import { Component, OnInit, ViewChild } from '@angular/core';
import { ModalController, IonDatetime, IonPopover } from '@ionic/angular/standalone';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonItemSliding,
  IonLabel, IonItemOptions, IonItemOption, IonButton, IonToast, IonFab, IonFabButton, IonIcon,
  IonText, IonButtons, IonInput, IonSelect, IonSelectOption, IonFooter, } from '@ionic/angular/standalone';
import { Inventory } from '../inventory';
import { InventoryService } from '../inventoryservice.service';

@Component({
  selector: 'app-modal-input',
  templateUrl: './modal-input.component.html',
  styleUrls: ['./modal-input.component.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem,
    IonItemSliding, IonLabel, IonItemOptions, IonItemOption, IonButton, IonToast,
    IonFab, IonFabButton, IonIcon, IonText, IonButtons, IonInput, CommonModule, FormsModule,
    IonSelect, IonSelectOption, IonFooter, IonDatetime, IonPopover
  ],
})
export class ModalInputComponent implements OnInit {
@ViewChild(IonPopover) popover!: IonPopover;
@ViewChild(IonDatetime) datetime!: IonDatetime;
  _message: string = "Add Item";
  _name?: string;
  _quantity?: number;
  _serialNumber?: string;
  _purchaseDate?: string;
  _location?: string;
  _assetTag?: string;
  _picture?: string;
  _file?: string;
  _inventory?: Inventory;
  _index?: number;
  _editMode: boolean = false;

  _quantities: number[] = [];
  _quantitySize: number = 10;

  selectedFile: File | null = null;
  isDatePickerOpen = false;

  constructor(
    private modalCtrl: ModalController,
    private inventoryService: InventoryService
  ) {
    for (let i = 1; i <= this._quantitySize; i++) {
      this._quantities.push(i);
    }
  }

  ngOnInit() {
    if (this._inventory !== undefined && this._index !== undefined) {
      this._name = this._inventory.getAssetName();
      this._quantity = this._inventory.getAssetQuantity();
      this._serialNumber = this._inventory.getSerialNumber();
      this._purchaseDate = this._inventory.getPurchaseDate();
      this._location = this._inventory.getLocation();
      this._assetTag = this._inventory.getAssetTag();
      this._picture = this._inventory.getPicture();
      this._file = this._inventory.getFile();
      this._editMode = true;
      this._message = "Edit Item";
    } else {
      // Set default date to today for new items
      this._purchaseDate = new Date().toISOString().split('T')[0];
    }
  }

  confirm() {
    if (!this._name || this._quantity === undefined || this._quantity === null) {
      alert("Name and quantity are required");
      return;
    }
  
    const formData = new FormData();
    formData.append('assetName', this._name);
    formData.append('assetQuantity', this._quantity.toString());
    formData.append('serialNumber', this._serialNumber ?? "");
    formData.append('purchaseDate', this._purchaseDate ?? "");
    formData.append('location', this._location ?? "");
    formData.append('assetTag', this._assetTag ?? "");
    formData.append('picture', this._picture ?? "");
    
    if (this.selectedFile) {
      formData.append('file', this.selectedFile, this.selectedFile.name);
    }
  
    if (!this._editMode) {
      this.inventoryService.addInventory(formData).subscribe(
        () => {
          this.modalCtrl.dismiss('confirm');
        },
        (error: any) => {
          console.error('Error adding inventory:', error);
          alert('Failed to add inventory. Please try again.');
        }
      );
    } else if (this._inventory && this._index !== undefined) {
      formData.append('_id', this._inventory._id);
      const id = this._inventory._id;
      this.inventoryService.editInventory(id, formData).subscribe(
        () => {
          this.modalCtrl.dismiss('confirm');
        },
        (error: any) => {
          console.error('Error editing inventory:', error);
          alert('Failed to edit inventory. Please try again.');
        }
      );
    } else {
      console.error('Inventory or index is undefined in edit mode');
      alert('An error occurred. Please try again.');
    }
  }

  onFileSelected(event: Event) {
    const target = event.target as HTMLInputElement;
    const file: File = (target.files as FileList)[0];
    this.selectedFile = file;
  }

  cancel() {
    this.modalCtrl.dismiss();
  }


  
  openDatePicker(event: Event) {
    this.popover.event = event;
    this.isDatePickerOpen = true;
  }
  
  dateChanged(value: string | string[] | null) {
    if (value) {
    if (Array.isArray(value)) {
      this._purchaseDate = value[0];
    } else {
      this._purchaseDate = value as string;
    }
    this.isDatePickerOpen = false;
  }
  
  formatDate(dateString: string | undefined): string {
    if (!dateString) return '';
    const date = new Date(dateString);
    return date.toLocaleDateString();
  }

}
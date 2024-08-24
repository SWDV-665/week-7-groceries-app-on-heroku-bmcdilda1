import { Component, OnInit, ChangeDetectorRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  IonHeader, IonToolbar, IonTitle, IonContent, IonList, IonItem, IonItemSliding,
  IonLabel, IonItemOptions, IonItemOption, IonButton, IonToast, IonIcon,
  IonText
} from '@ionic/angular/standalone';
import { ExploreContainerComponent } from '../explore-container/explore-container.component';
import { Inventory } from '../inventory';
import { InventoryService } from '../inventoryservice.service';
import { ToastController } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { ModalInputComponent } from '../modal-input/modal-input.component';
import { addIcons } from 'ionicons';
import { pencil, trash, share, add } from 'ionicons/icons';
import { Share } from '@capacitor/share';
import { AlertController } from '@ionic/angular';
import { CustomFabComponent } from '../components/custom-fab/custom-fab.component';

@Component({
  selector: 'app-tab1',
  templateUrl: 'tab1.page.html',
  styleUrls: ['tab1.page.scss'],
  standalone: true,
  imports: [
    IonHeader, IonToolbar, IonTitle, IonContent, ExploreContainerComponent, IonList, IonItem,
    IonItemSliding, IonLabel, IonItemOptions, IonItemOption, IonButton, IonToast,
    IonIcon, IonText, CommonModule, CustomFabComponent
  ],
})
export class Tab1Page implements OnInit {
  _inventoryList: Inventory[] = [];
  _title: string = "Inventory List";

  constructor(
    private toastController: ToastController,
    private modalCtrl: ModalController,
    private inventoryService: InventoryService,
    private alertController: AlertController,
    private changeDetectorRef: ChangeDetectorRef
  ) {
    addIcons({ pencil, trash, share, add });
  }

  ngOnInit() {
    this.updateList();
    this.inventoryService.inventoryListChanged$.subscribe((inventoryListChanged: boolean) => {
      if (inventoryListChanged) {
        this.updateList();
      }
    });

    this.inventoryService.triggerError$.subscribe((triggerError: boolean) => {
      if (triggerError) {
        this.presentAlert();
      }
    });
  }

  async updateList() {
    console.log('Updating Inventory List Called');

    this.inventoryService.getInventoryList().subscribe(
      (data: Inventory[]) => {
        console.log('Data from Server TAB: ', data);
        this._inventoryList = data;
        console.log('Inventory List: ', this._inventoryList);
        this.changeDetectorRef.detectChanges();
      },
      error => {
        console.error('Error getting inventory list: ', error);
      }
    );
  }

  async deleteItem(inventory: Inventory, index: number, slider: IonItemSliding) {
    if (index > -1) {
      this.inventoryService.deleteInventory(this._inventoryList[index]).subscribe(
        (data: any) => {
          console.log('Delete from Server: ', data);
          this.presentToast(this._inventoryList[index], 'Deleted', 'bottom');
        },
        error => {
          console.error('Error deleting inventory item: ', error);
          slider.close();
        }
      );
    }
  }

  async shareItem(inventory: Inventory, index: number, slider: IonItemSliding) {
    if (index > -1) {
      this.presentToast(this._inventoryList[index], 'Shared', 'bottom');

      const title: string = 'Sharing Inventory Item';
      const text: string = 'Inventory item - Name: ' + this._inventoryList[index].assetName + ' - Quantity: ' + this._inventoryList[index].assetQuantity;

      await Share.share({
        title: title,
        text: text,
      });

      slider.close();
    }
  }

  async addWithModal() {
    const modal = await this.modalCtrl.create({
      component: ModalInputComponent
    });
    modal.present();
  }

  async editWithModal(inventory: Inventory, index: number, slider: IonItemSliding) {
    const modal = await this.modalCtrl.create({
      component: ModalInputComponent,
      componentProps: {
        _inventory: inventory,
        _index: index
      }
    });
    modal.present();
    slider.close();
  }

  async presentToast(inventory: Inventory, action: string, position: 'top' | 'middle' | 'bottom') {
    let name = inventory.assetName;

    try {
      const toast = await this.toastController.create({
        message: name + ' - ' + action,
        duration: 1500,
        position: position
      });

      await toast.present();
    } catch (error) {
      console.error('Error presenting toast: ', error);
    }
  }

  async presentAlert() {
    const alert = await this.alertController.create({
      header: 'Server ERROR',
      message: 'Error communicating with server',
      buttons: ['OK']
    });

    await alert.present();
  }
}
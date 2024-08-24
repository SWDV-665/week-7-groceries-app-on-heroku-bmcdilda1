import { Component, Input, Output, EventEmitter } from '@angular/core';
import { IonFab, IonFabButton, IonIcon } from '@ionic/angular/standalone';

@Component({
  selector: 'app-custom-fab',
  templateUrl: './custom-fab.component.html',
  styleUrls: ['./custom-fab.component.scss'],
  standalone: true,
  imports: [IonFab, IonFabButton, IonIcon]
})
export class CustomFabComponent {
  @Input() imageSrc: string = 'assets/images/home-logo.png';
  @Output() fabClick = new EventEmitter<void>();

  onFabClick() {
    this.fabClick.emit();
  }
}
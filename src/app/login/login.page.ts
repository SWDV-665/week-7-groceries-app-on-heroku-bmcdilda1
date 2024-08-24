import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonLabel, IonInput, IonButton } from '@ionic/angular/standalone';
import { Router, RouterModule } from '@angular/router';
import { HttpClient } from '@angular/common/http';  // Make sure to import HttpClient

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [
    IonContent,
    IonHeader,
    IonTitle,
    IonToolbar,
    IonItem,
    IonLabel,
    IonInput,
    IonButton,
    CommonModule,
    FormsModule,
    RouterModule
  ]
})
export class LoginPage implements OnInit {
  username: string = '';
  password: string = '';

  constructor(private router: Router, private http: HttpClient) {}

  ngOnInit() {}

  onLogin() {
    console.log('onLogin method triggered');
    if (this.username.trim() && this.password.trim()) {
      console.log('Sending login request with:', { username: this.username, password: this.password });
      this.http.post('http://localhost:8081/api/login', { username: this.username, password: this.password })
        .subscribe(
          (response: any) => {
            console.log('Login successful:', response);
            // Store the token in localStorage
            localStorage.setItem('token', response.token);
            this.router.navigate(['/tabs/tab1']);
          },
          (error) => {
            console.error('Login failed:', error);
            alert('Invalid username or password');
          }
        );
    } else {
      alert('Please enter both username and password.');
    }
  }
}

import { Component, Output, EventEmitter } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { AuthService } from '../auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule, MatFormFieldModule, MatInputModule, MatButtonModule],
  template: `
    <form (ngSubmit)="login()" #loginForm="ngForm" class="login-form">
      <mat-form-field>
        <input matInput placeholder="Username" [(ngModel)]="username" name="username" required>
      </mat-form-field>
      <mat-form-field>
        <input matInput placeholder="Password" [(ngModel)]="password" name="password" type="password" required>
      </mat-form-field>
      <button mat-raised-button color="primary" type="submit">Login</button>
      <div *ngIf="error" class="error">{{error}}</div>
    </form>
  `,
  styles: [`.login-form { display: flex; flex-direction: column; gap: 1em; max-width: 300px; margin: auto; } .error { color: red; }`]
})
export class LoginComponent {
  username = '';
  password = '';
  error = '';
  @Output() loginSuccess = new EventEmitter<void>();


  constructor(private http: HttpClient, private authService: AuthService) {}

  login() {
  this.http.post<any>('/api/login', { username: this.username, password: this.password }).subscribe({
    next: res => {
      this.authService.setLogin(res.token, res.isAdmin, this.username); // <-- add username
      this.loginSuccess.emit();
    },
    error: () => this.error = 'Invalid credentials'
  });
}
}
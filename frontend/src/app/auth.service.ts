import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class AuthService {
  isLoggedIn(): boolean {
    return !!localStorage.getItem('token');
  }
  isAdmin(): boolean {
    return localStorage.getItem('isAdmin') === 'true';
  }
  setLogin(token: string, isAdmin: boolean, username: string) {
    localStorage.setItem('token', token);
    localStorage.setItem('isAdmin', isAdmin ? 'true' : 'false');
    localStorage.setItem('username', username);
    }
    getUsername(): string | null {
    return localStorage.getItem('username');
    }
    logout() {
        localStorage.removeItem('token');
        localStorage.removeItem('isAdmin');
    }
}
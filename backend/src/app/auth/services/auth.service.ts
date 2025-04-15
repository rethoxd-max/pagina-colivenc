import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private apiUrl = 'http://localhost:5000/auth';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isAuthenticated());

  constructor(private http: HttpClient) { }

  register(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, userData);
  }

  login(userData: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, userData);
  }

  saveToken(token: string) {
    localStorage.setItem('authToken', token);
    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  isAuthenticated(): boolean {
    return !!this.getToken();
  }

  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();  // Devuelve un observable para que los componentes puedan suscribirse
  }

  logout(): void {
    localStorage.removeItem('authToken');
    this.isLoggedInSubject.next(false);  // Emitir el cambio de estado de autenticación
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }


}

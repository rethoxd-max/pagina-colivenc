import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: string;
  name: string;
  email: string;
  password: string;
  userTypes: string[]; // Definir userTypes como arreglo de strings
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  private userDataSubject = new BehaviorSubject<any>(this.getUser());

  constructor(private http: HttpClient) { }

  register(user: { name: string, email: string, password: string, userTypes: string[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
  }

  login(userData: any): Observable<any> {
    // Limpiar datos previos para evitar mezcla de información entre usuarios
    this.clearUserData();
    
    return this.http.post(`${this.apiUrl}/login`, userData)
      .pipe(
        tap((response: any) => {
          if (response.token) {
            this.saveToken(response.token);
            // Asegurarse de guardar solo los datos del usuario actual
            this.saveUserData(response.user);
            this.userDataSubject.next(response.user);
            this.isLoggedInSubject.next(true);
          }
        })
      );
  }

  saveToken(token: string): void {
    localStorage.setItem('authToken', token);
    this.isLoggedInSubject.next(true);
  }

  getToken(): string | null {
    return localStorage.getItem('authToken');
  }

  saveUserData(userData: any): void {
    localStorage.setItem('userData', JSON.stringify(userData));
    this.userDataSubject.next(userData);
  }

  getUserData(): string | null {
    return localStorage.getItem('userData');
  }

  getUserId(): string | null {
    const user = this.getUser();  // Obtener los datos del usuario desde el localStorage
    return user ? user.id : null;  // Si el usuario está disponible, devolver el id. Si no, devolver null
  }

  isAuthenticated(): boolean {
    const token = this.getToken();  // Verifica si el token existe
    return !!token;
  }

  getIsLoggedIn(): Observable<boolean> {
    return this.isLoggedInSubject.asObservable();  // Devuelve un observable para que los componentes puedan suscribirse
  }

  getUserObservable(): Observable<any> {
    return this.userDataSubject.asObservable();
  }

  clearUserData(): void {
    localStorage.removeItem('authToken');
    localStorage.removeItem('userData');
    this.userDataSubject.next(null);
    this.isLoggedInSubject.next(false);
  }

  logout(): void {
    this.clearUserData();
  }

  getUser(): any {
    const userData = this.getUserData();  // Utilizar la función definida
    return userData ? JSON.parse(userData) : null;
  }

  isLoggedIn(): boolean {
    return !!localStorage.getItem('authToken');
  }

  isAdmin(): boolean {
    const user = this.getUser();
    return user && user.userTypes.includes('Admin');
  }

  isAtleta(): boolean {
    const user = this.getUser();
    return user && user.userTypes.includes('Atleta');
  }

  isEntrenador(): boolean {
    const user = this.getUser();
    return user && user.userTypes.includes('Entrenador');
  }

  isEditor(): boolean {
    const user = this.getUser();
    return user && user.userTypes.includes('Editor');
  }

  isViewer(): boolean {
    const user = this.getUser();
    return user && user.userTypes.includes('Viewer');
  }

  refreshUserState(): void {
    // Este método se puede llamar para forzar una actualización del estado
    const isAuthenticated = this.isAuthenticated();
    this.isLoggedInSubject.next(isAuthenticated);
    
    if (isAuthenticated) {
      const userData = this.getUser();
      this.userDataSubject.next(userData);
    } else {
      this.userDataSubject.next(null);
    }
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    });
  }
}

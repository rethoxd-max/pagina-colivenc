import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { tap } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface Usuario {
  id: string;
  name: string;
  email: string;
  userTypes: string[];
  fechaNacimiento?: string;
  numeroLicencia?: string;
  activo?: boolean;
}

@Injectable({
  providedIn: 'root'
})

export class AuthService {
  private apiUrl = `${environment.apiUrl}/auth`;
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isAuthenticated());
  private userDataSubject = new BehaviorSubject<any>(this.getUser());

  constructor(private http: HttpClient) {
    // Limpiar token expirado al arrancar la aplicación
    if (this.getToken() && this.isTokenExpired()) {
      localStorage.removeItem('authToken');
      localStorage.removeItem('userData');
      this.userDataSubject.next(null);
    }
  }

  register(user: { name: string, email: string, password: string, codigoInvitacion: string, fechaNacimiento?: string, numeroLicencia?: string, dni?: string }): Observable<any> {
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
    const token = this.getToken();
    if (!token) return false;
    return !this.isTokenExpired();
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

  /**
   * Decodifica el token JWT sin verificar la firma
   */
  private decodeToken(token: string): any {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch {
      return null;
    }
  }

  /**
   * Verifica si el token ha expirado
   */
  isTokenExpired(): boolean {
    const token = this.getToken();
    if (!token) return true;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return true;

    // exp está en segundos, Date.now() en milisegundos
    const expirationDate = decoded.exp * 1000;
    const now = Date.now();
    
    // Considerar expirado si quedan menos de 60 segundos
    return now >= (expirationDate - 60000);
  }

  /**
   * Obtiene el tiempo restante del token en milisegundos
   */
  getTokenTimeRemaining(): number {
    const token = this.getToken();
    if (!token) return 0;

    const decoded = this.decodeToken(token);
    if (!decoded || !decoded.exp) return 0;

    const expirationDate = decoded.exp * 1000;
    return Math.max(0, expirationDate - Date.now());
  }

  /**
   * Maneja el token expirado - limpia datos y notifica
   */
  handleExpiredToken(): void {
    console.log('AuthService - Manejando token expirado');
    this.clearUserData();
  }

  changePassword(currentPassword: string, newPassword: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/change-password`, {
      currentPassword,
      newPassword
    });
  }
}

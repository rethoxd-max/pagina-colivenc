import { HttpClient } from '@angular/common/http';
import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';


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
  private apiUrl = 'http://localhost:5000/auth';
  private isLoggedInSubject = new BehaviorSubject<boolean>(this.isAuthenticated());

  constructor(private http: HttpClient) { }

  register(user: { name: string, email: string, password: string, userTypes: string[] }): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user);
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

  saveUserData(userData: any): void {
    localStorage.setItem('userData', JSON.stringify(userData));
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

  logout(): void {
    localStorage.removeItem('authToken');
    this.isLoggedInSubject.next(false);  // Emitir el cambio de estado de autenticación
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

}

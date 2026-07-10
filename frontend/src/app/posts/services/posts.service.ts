import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/posts`;

  getPosts(limit?: number): Observable<any[]> {
    const url = limit ? `${this.apiUrl}?limit=${limit}` : this.apiUrl;
    return this.http.get<any[]>(url);
  }

  getUltimosPosts(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/ultimos`); // Endpoint para traer las últimas noticias
  }

  getPostDestacado(): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/destacado`);
  }

  toggleDestacado(id: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.patch(`${this.apiUrl}/${id}/destacar`, {}, { headers });
  }

  getPost(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/${id}`);
  }

  createPost(postData: FormData): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found'); // Manejar el caso de token faltante
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.post(this.apiUrl, postData, { headers });
  }

  updatePost(id: string, postData: FormData): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found'); // Manejar el caso de token faltante
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.put(`${this.apiUrl}/${id}`, postData, { headers });
  }

  deletePost(id: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found'); // Manejar el caso de token faltante
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}

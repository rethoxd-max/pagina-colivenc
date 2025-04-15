import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { inject } from '@angular/core';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';

@Injectable({
  providedIn: 'root'
})
export class PostService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = 'http://localhost:5000/posts';

  getPosts(): Observable<any> {
    return this.http.get(this.apiUrl);
  }

  getPostById(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/${id}`);
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

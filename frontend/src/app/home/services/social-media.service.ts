import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';

export interface PostInstagram {
  _id: string;
  url: string;
  imagenUrl: string;
  descripcion: string;
  likes: number;
  comentarios: number;
  orden: number;
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SocialMediaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/instagram`;

  fetchMetadata(url: string): Observable<{ imagenUrl: string; descripcion: string }> {
    const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    return this.http.get<{ imagenUrl: string; descripcion: string }>(
      `${this.apiUrl}/fetch-metadata`,
      { headers, params: { url } }
    );
  }

  getPosts(): Observable<PostInstagram[]> {
    return this.http.get<PostInstagram[]>(this.apiUrl);
  }

  addPost(url: string, orden: number = 0, imagenUrl = '', descripcion = '', likes = 0, comentarios = 0): Observable<PostInstagram> {
    const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    return this.http.post<PostInstagram>(this.apiUrl, { url, orden, imagenUrl, descripcion, likes, comentarios }, { headers });
  }

  refreshPost(id: string): Observable<PostInstagram> {
    const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    return this.http.post<PostInstagram>(`${this.apiUrl}/${id}/refresh`, {}, { headers });
  }

  deletePost(id: string): Observable<any> {
    const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}

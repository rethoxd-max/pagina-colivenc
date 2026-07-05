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
  createdAt: string;
}

@Injectable({ providedIn: 'root' })
export class SocialMediaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/instagram`;

  getPosts(): Observable<PostInstagram[]> {
    return this.http.get<PostInstagram[]>(this.apiUrl);
  }

  addPost(url: string): Observable<PostInstagram> {
    const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    return this.http.post<PostInstagram>(this.apiUrl, { url }, { headers });
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

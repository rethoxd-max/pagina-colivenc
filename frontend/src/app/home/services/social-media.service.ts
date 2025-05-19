import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, throwError } from 'rxjs';
import { catchError, map } from 'rxjs/operators';
import { environment } from '../../../environments/environment';

export interface InstagramPost {
  id: string;
  media_url: string;
  caption: string;
  timestamp: string;
  permalink: string;
  media_type: string;
}

export interface FacebookPost {
  id: string;
  message: string;
  created_time: string;
  full_picture?: string;
  permalink_url: string;
  likes: {
    summary: {
      total_count: number;
    };
  };
}

@Injectable({
  providedIn: 'root'
})
export class SocialMediaService {
  private readonly apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) { }

  getInstagramPosts(): Observable<{ data: InstagramPost[] }> {
    return this.http.get<{ data: InstagramPost[] }>(`${this.apiUrl}/api/instagram/posts`).pipe(
      catchError(error => {
        console.error('Error al obtener posts de Instagram:', error);
        return throwError(() => new Error('No se pudieron cargar los posts de Instagram'));
      })
    );
  }

  getFacebookPosts(): Observable<{ data: FacebookPost[] }> {
    return this.http.get<{ data: FacebookPost[] }>(`${this.apiUrl}/api/facebook/posts`).pipe(
      catchError(error => {
        console.error('Error al obtener posts de Facebook:', error);
        return throwError(() => new Error('No se pudieron cargar los posts de Facebook'));
      })
    );
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

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
  private readonly FACEBOOK_PAGE_ID = 'TU_PAGE_ID'; // Reemplazar con el ID de la página de Facebook
  private readonly INSTAGRAM_BUSINESS_ID = 'TU_BUSINESS_ID'; // Reemplazar con el ID de Instagram Business
  private readonly ACCESS_TOKEN = 'TU_ACCESS_TOKEN'; // Reemplazar con el token de acceso

  constructor(private http: HttpClient) { }

  getInstagramPosts(): Observable<{ data: InstagramPost[] }> {
    const url = `https://graph.facebook.com/v18.0/${this.INSTAGRAM_BUSINESS_ID}/media`;
    const params = {
      access_token: this.ACCESS_TOKEN,
      fields: 'id,media_url,caption,timestamp,permalink,media_type'
    };
    return this.http.get<{ data: InstagramPost[] }>(url, { params });
  }

  getFacebookPosts(): Observable<{ data: FacebookPost[] }> {
    const url = `https://graph.facebook.com/v18.0/${this.FACEBOOK_PAGE_ID}/posts`;
    const params = {
      access_token: this.ACCESS_TOKEN,
      fields: 'id,message,created_time,full_picture,permalink_url,likes.summary(true)'
    };
    return this.http.get<{ data: FacebookPost[] }>(url, { params });
  }
} 
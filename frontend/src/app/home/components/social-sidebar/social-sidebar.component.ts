import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialMediaService, PostInstagram } from '../../services/social-media.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-social-sidebar',
  templateUrl: './social-sidebar.component.html',
  styleUrls: ['./social-sidebar.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class SocialSidebarComponent implements OnInit {
  posts: PostInstagram[] = [];
  cargando = true;

  constructor(private socialMediaService: SocialMediaService) {}

  ngOnInit(): void {
    this.socialMediaService.getPosts().subscribe({
      next: (data) => { this.posts = data; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  getImagenUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }
}

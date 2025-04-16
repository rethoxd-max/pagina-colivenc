import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SocialMediaService, InstagramPost, FacebookPost } from '../../services/social-media.service';

@Component({
  selector: 'app-social-sidebar',
  templateUrl: './social-sidebar.component.html',
  styleUrls: ['./social-sidebar.component.css'],
  standalone: true,
  imports: [CommonModule]
})
export class SocialSidebarComponent implements OnInit {
  instagramPosts: InstagramPost[] = [];
  facebookPosts: FacebookPost[] = [];
  loading = true;
  error: string | null = null;

  constructor(private socialMediaService: SocialMediaService) { }

  ngOnInit() {
    this.loadSocialMediaPosts();
  }

  private loadSocialMediaPosts() {
    this.loading = true;
    this.error = null;

    // Cargar posts de Instagram
    this.socialMediaService.getInstagramPosts().subscribe({
      next: (response) => {
        this.instagramPosts = response.data
          .filter(post => post.media_type === 'IMAGE' || post.media_type === 'CAROUSEL_ALBUM')
          .slice(0, 3); // Limitar a 3 posts más recientes
      },
      error: (err) => {
        console.error('Error cargando posts de Instagram:', err);
        this.error = 'No se pudieron cargar los posts de Instagram';
      }
    });

    // Cargar posts de Facebook
    this.socialMediaService.getFacebookPosts().subscribe({
      next: (response) => {
        this.facebookPosts = response.data.slice(0, 3); // Limitar a 3 posts más recientes
      },
      error: (err) => {
        console.error('Error cargando posts de Facebook:', err);
        this.error = 'No se pudieron cargar los posts de Facebook';
      },
      complete: () => {
        this.loading = false;
      }
    });
  }

  formatDate(dateString: string): string {
    return new Date(dateString).toLocaleDateString('es-ES', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric'
    });
  }
} 
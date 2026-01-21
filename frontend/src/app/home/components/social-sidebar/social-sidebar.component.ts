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
  useMockData = true; // Cambiar a false para usar la API real

  constructor(private socialMediaService: SocialMediaService) { }

  ngOnInit() {
    if (this.useMockData) {
      this.loadMockData();
    } else {
      this.loadSocialMediaPosts();
    }
  }

  private loadMockData() {
    // Datos de ejemplo con imágenes de Picsum
    this.instagramPosts = [
      {
        id: '1',
        media_type: 'IMAGE',
        media_url: 'https://picsum.photos/seed/athletics1/400/400',
        caption: '¡Gran entrenamiento de velocidad hoy! 🏃‍♂️💨 Nuestros atletas dando todo en pista.',
        timestamp: new Date().toISOString(),
        permalink: 'https://www.instagram.com/c.e.colivenc'
      },
      {
        id: '2',
        media_type: 'IMAGE',
        media_url: 'https://picsum.photos/seed/athletics2/400/400',
        caption: 'Preparándonos para la próxima competición. ¡Vamos equipo! 🏆',
        timestamp: new Date(Date.now() - 86400000).toISOString(),
        permalink: 'https://www.instagram.com/c.e.colivenc'
      },
      {
        id: '3',
        media_type: 'IMAGE',
        media_url: 'https://picsum.photos/seed/athletics3/400/400',
        caption: 'Nuevos récords personales esta semana. ¡Felicidades campeones! 🥇',
        timestamp: new Date(Date.now() - 172800000).toISOString(),
        permalink: 'https://www.instagram.com/c.e.colivenc'
      },
      {
        id: '4',
        media_type: 'IMAGE',
        media_url: 'https://picsum.photos/seed/athletics4/400/400',
        caption: 'Sesión de técnica de saltos 🦘 Mejorando día a día.',
        timestamp: new Date(Date.now() - 259200000).toISOString(),
        permalink: 'https://www.instagram.com/c.e.colivenc'
      }
    ] as InstagramPost[];

    this.facebookPosts = [
      {
        id: '1',
        message: '📢 ¡Inscripciones abiertas para la temporada 2025! No te quedes sin tu plaza.',
        full_picture: 'https://picsum.photos/seed/fb1/400/400',
        created_time: new Date().toISOString(),
        permalink_url: 'https://facebook.com',
        likes: { summary: { total_count: 45 } }
      },
      {
        id: '2',
        message: '🎉 Felicitamos a nuestros atletas por los resultados del fin de semana.',
        full_picture: 'https://picsum.photos/seed/fb2/400/400',
        created_time: new Date(Date.now() - 86400000).toISOString(),
        permalink_url: 'https://facebook.com',
        likes: { summary: { total_count: 78 } }
      },
      {
        id: '3',
        message: '🏅 Medallas conseguidas en el Campeonato Provincial. ¡Enhorabuena!',
        full_picture: 'https://picsum.photos/seed/fb3/400/400',
        created_time: new Date(Date.now() - 172800000).toISOString(),
        permalink_url: 'https://facebook.com',
        likes: { summary: { total_count: 124 } }
      },
      {
        id: '4',
        message: '📅 Horarios actualizados de entrenamientos para enero 2025.',
        full_picture: 'https://picsum.photos/seed/fb4/400/400',
        created_time: new Date(Date.now() - 259200000).toISOString(),
        permalink_url: 'https://facebook.com',
        likes: { summary: { total_count: 32 } }
      }
    ] as FacebookPost[];

    this.loading = false;
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/posts.service';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
  createdAt: string;
}

@Component({
  selector: 'app-post-detail',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="post-detail-page">
      <div class="post-container">
        <!-- Navegación superior -->
        <nav class="post-nav">
          <button class="btn-back" (click)="volver()">
            <i class="fas fa-arrow-left"></i>
            <span>Volver a noticias</span>
          </button>
          
          <div *ngIf="isAdmin() || isEditor()" class="admin-actions">
            <button (click)="editarNoticia()" class="btn-admin btn-edit">
              <i class="fas fa-edit"></i>
              Editar
            </button>
            <button (click)="eliminarNoticia()" class="btn-admin btn-delete">
              <i class="fas fa-trash-alt"></i>
              Eliminar
            </button>
          </div>
        </nav>

        <!-- Artículo principal -->
        <article class="post-article">
          <!-- Cabecera del artículo -->
          <header class="article-header">
            <div class="post-meta">
              <span class="post-category">
                <i class="fas fa-newspaper"></i>
                Noticia
              </span>
              <span class="post-date">
                <i class="far fa-calendar-alt"></i>
                {{ post?.createdAt | date:'dd MMMM yyyy' }}
              </span>
            </div>
            <h1 class="post-title">{{ post?.title }}</h1>
          </header>

          <!-- Imagen destacada -->
          <figure *ngIf="post?.imageUrl" class="featured-image">
            <img [src]="getImageUrl(post?.imageUrl)" 
                 [alt]="post?.title"
                 class="post-image">
          </figure>

          <!-- Contenido del artículo -->
          <div class="article-content">
            <div class="post-body" [innerHTML]="post?.content"></div>
          </div>

          <!-- Footer del artículo -->
          <footer class="article-footer">
            <div class="share-section">
              <span class="share-label">Compartir esta noticia:</span>
              <div class="share-buttons">
                <button class="share-btn twitter" title="Compartir en Twitter">
                  <i class="fab fa-twitter"></i>
                </button>
                <button class="share-btn facebook" title="Compartir en Facebook">
                  <i class="fab fa-facebook-f"></i>
                </button>
                <button class="share-btn whatsapp" title="Compartir en WhatsApp">
                  <i class="fab fa-whatsapp"></i>
                </button>
              </div>
            </div>
          </footer>
        </article>

        <!-- Botón volver abajo -->
        <div class="bottom-nav">
          <button class="btn-all-news" (click)="volver()">
            <i class="fas fa-th-large"></i>
            Ver todas las noticias
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    /* Variables */
    :host {
      --primary-color: #2563eb;
      --primary-dark: #1d4ed8;
      --danger-color: #ef4444;
      --text-color: #1e293b;
      --text-light: #64748b;
      --bg-color: #f8fafc;
      --card-bg: #ffffff;
      --border-radius: 16px;
      --shadow-md: 0 4px 6px -1px rgba(0, 0, 0, 0.1);
      --shadow-lg: 0 10px 25px -5px rgba(0, 0, 0, 0.1);
      --transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
    }

    .post-detail-page {
      min-height: 100vh;
      background: var(--bg-color);
      padding: 2rem 1rem;
    }

    .post-container {
      max-width: 900px;
      margin: 0 auto;
    }

    /* Navegación superior */
    .post-nav {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 2rem;
      padding: 0 0.5rem;
    }

    .btn-back {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: var(--card-bg);
      color: var(--text-color);
      border: 1px solid #e2e8f0;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      font-size: 0.9rem;
      font-weight: 500;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-back:hover {
      background: var(--primary-color);
      color: white;
      border-color: var(--primary-color);
    }

    .btn-back i {
      font-size: 0.85rem;
    }

    .admin-actions {
      display: flex;
      gap: 0.75rem;
    }

    .btn-admin {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.75rem 1.25rem;
      border-radius: 10px;
      border: none;
      font-size: 0.9rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-edit {
      background: #eff6ff;
      color: var(--primary-color);
    }

    .btn-edit:hover {
      background: var(--primary-color);
      color: white;
    }

    .btn-delete {
      background: #fef2f2;
      color: var(--danger-color);
    }

    .btn-delete:hover {
      background: var(--danger-color);
      color: white;
    }

    /* Artículo */
    .post-article {
      background: var(--card-bg);
      border-radius: var(--border-radius);
      box-shadow: var(--shadow-lg);
      overflow: hidden;
    }

    /* Header del artículo */
    .article-header {
      padding: 2.5rem 2.5rem 2rem;
    }

    .post-meta {
      display: flex;
      flex-wrap: wrap;
      gap: 1rem;
      margin-bottom: 1.25rem;
    }

    .post-category {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: linear-gradient(135deg, var(--primary-color), var(--primary-dark));
      color: white;
      padding: 0.5rem 1rem;
      border-radius: 25px;
      font-size: 0.8rem;
      font-weight: 600;
    }

    .post-date {
      display: inline-flex;
      align-items: center;
      gap: 0.4rem;
      background: #f1f5f9;
      color: var(--text-light);
      padding: 0.5rem 1rem;
      border-radius: 25px;
      font-size: 0.85rem;
    }

    .post-date i {
      color: var(--primary-color);
    }

    .post-title {
      font-size: 2.25rem;
      font-weight: 800;
      color: var(--text-color);
      line-height: 1.3;
      margin: 0;
    }

    /* Imagen destacada */
    .featured-image {
      margin: 0;
      padding: 0 2.5rem;
    }

    .post-image {
      width: 100%;
      height: auto;
      max-height: 500px;
      object-fit: cover;
      border-radius: 12px;
      display: block;
    }

    /* Contenido */
    .article-content {
      padding: 2rem 2.5rem;
    }

    .post-body {
      font-size: 1.125rem;
      line-height: 1.9;
      color: var(--text-color);
    }

    .post-body p {
      margin-bottom: 1.5rem;
    }

    .post-body p:last-child {
      margin-bottom: 0;
    }

    /* Footer del artículo */
    .article-footer {
      padding: 2rem 2.5rem;
      border-top: 1px solid #e2e8f0;
      background: #fafbfc;
    }

    .share-section {
      display: flex;
      align-items: center;
      gap: 1rem;
      flex-wrap: wrap;
    }

    .share-label {
      color: var(--text-light);
      font-size: 0.95rem;
      font-weight: 500;
    }

    .share-buttons {
      display: flex;
      gap: 0.5rem;
    }

    .share-btn {
      width: 42px;
      height: 42px;
      border-radius: 50%;
      border: none;
      display: flex;
      align-items: center;
      justify-content: center;
      cursor: pointer;
      transition: var(--transition);
      color: white;
      font-size: 1rem;
    }

    .share-btn.twitter {
      background: #1da1f2;
    }

    .share-btn.facebook {
      background: #1877f2;
    }

    .share-btn.whatsapp {
      background: #25d366;
    }

    .share-btn:hover {
      transform: translateY(-3px) scale(1.05);
      box-shadow: 0 6px 16px rgba(0, 0, 0, 0.2);
    }

    /* Navegación inferior */
    .bottom-nav {
      display: flex;
      justify-content: center;
      margin-top: 2.5rem;
    }

    .btn-all-news {
      display: inline-flex;
      align-items: center;
      gap: 0.75rem;
      background: var(--card-bg);
      color: var(--primary-color);
      border: 2px solid var(--primary-color);
      padding: 1rem 2rem;
      border-radius: 12px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: var(--transition);
    }

    .btn-all-news:hover {
      background: var(--primary-color);
      color: white;
    }

    /* Responsive */
    @media (max-width: 768px) {
      .post-detail-page {
        padding: 1rem 0.5rem;
      }

      .post-nav {
        flex-direction: column;
        gap: 1rem;
        align-items: stretch;
      }

      .btn-back {
        justify-content: center;
      }

      .admin-actions {
        justify-content: center;
      }

      .article-header {
        padding: 1.5rem 1.25rem;
      }

      .post-title {
        font-size: 1.5rem;
      }

      .featured-image {
        padding: 0 1.25rem;
      }

      .article-content {
        padding: 1.5rem 1.25rem;
      }

      .post-body {
        font-size: 1rem;
      }

      .article-footer {
        padding: 1.5rem 1.25rem;
      }

      .share-section {
        flex-direction: column;
        align-items: flex-start;
      }
    }
  `]
})
export class PostDetailComponent implements OnInit {
  post: Post | null = null;
  baseURL: string = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private authService: AuthService
  ) { }

  ngOnInit() {
    const id = this.route.snapshot.paramMap.get('id');
    if (id) {
      this.postService.getPost(id).subscribe({
        next: (data: Post) => {
          this.post = data;
        },
        error: (error: Error) => {
          console.error('Error al cargar la noticia:', error);
          this.router.navigate(['/noticias']);
        }
      });
    }
  }

  getImageUrl(imageUrl: string | undefined): string {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${this.baseURL}${imageUrl}`;
  }

  volver() {
    this.router.navigate(['/noticias']);
  }

  editarNoticia() {
    this.router.navigate(['/edit', this.post?._id]);
  }

  eliminarNoticia() {
    if (confirm('¿Estás seguro de que deseas eliminar esta noticia?')) {
      this.postService.deletePost(this.post?._id || '').subscribe({
        next: () => {
          this.router.navigate(['/noticias']);
        },
        error: (error: Error) => {
          console.error('Error al eliminar la noticia:', error);
        }
      });
    }
  }

  isAdmin(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Admin');
  }

  isEditor(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Editor');
  }
} 
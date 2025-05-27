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
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center mb-4">
                <h1 class="card-title display-5">{{ post?.title }}</h1>
                <small class="text-muted">{{ post?.createdAt | date:'mediumDate' }}</small>
              </div>

              <div *ngIf="post?.imageUrl" class="text-center mb-4">
                <img [src]="getImageUrl(post?.imageUrl)" 
                     class="img-fluid rounded shadow" 
                     alt="Imagen de la noticia"
                     style="max-height: 500px; object-fit: cover;">
              </div>

              <div class="post-content">
                <p class="lead" [innerHTML]="post?.content"></p>
              </div>

              <div class="d-flex justify-content-between align-items-center mt-4">
                <button class="btn btn-outline-primary" (click)="volver()">
                  <i class="bi bi-arrow-left me-2"></i>Volver
                </button>
                <div *ngIf="isAdmin() || isEditor()" class="btn-group">
                  <button (click)="editarNoticia()" class="btn btn-outline-primary">
                    <i class="bi bi-pencil me-2"></i>Editar
                  </button>
                  <button (click)="eliminarNoticia()" class="btn btn-outline-danger">
                    <i class="bi bi-trash me-2"></i>Eliminar
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .post-content {
      line-height: 1.8;
      font-size: 1.1rem;
    }
    
    .post-content p {
      white-space: pre-wrap;
    }
    
    .card {
      border: none;
      border-radius: 15px;
    }
    
    .btn {
      border-radius: 8px;
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/posts.service';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment.development';

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8">
          <div class="card shadow">
            <div class="card-body">
              <h2 class="card-title mb-4">Editar Noticia</h2>
              <form (ngSubmit)="onSubmit()">
                <div class="mb-3">
                  <label for="title" class="form-label">Título</label>
                  <input type="text" class="form-control" id="title" [(ngModel)]="post.title" name="title" required>
                </div>
                <div class="mb-3">
                  <label for="content" class="form-label">Contenido</label>
                  <textarea class="form-control" id="content" [(ngModel)]="post.content" name="content" rows="5" required></textarea>
                </div>
                <div class="mb-3">
                  <label for="image" class="form-label">Imagen</label>
                  <input type="file" class="form-control" id="image" (change)="onFileSelected($event)" name="image">
                </div>
                <div class="d-flex justify-content-between">
                  <button type="button" class="btn btn-outline-secondary" (click)="volver()">Cancelar</button>
                  <button type="submit" class="btn btn-primary">Guardar Cambios</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  `
})
export class EditPostComponent implements OnInit {
  post: Post = {
    _id: '',
    title: '',
    content: '',
    imageUrl: ''
  };
  selectedFile: File | null = null;
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

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
    }
  }

  onSubmit() {
    const formData = new FormData();
    formData.append('title', this.post.title);
    formData.append('content', this.post.content);
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.postService.updatePost(this.post._id, formData).subscribe({
      next: () => {
        this.router.navigate(['/noticias']);
      },
      error: (error: Error) => {
        console.error('Error al actualizar la noticia:', error);
      }
    });
  }

  volver() {
    this.router.navigate(['/noticias']);
  }
}

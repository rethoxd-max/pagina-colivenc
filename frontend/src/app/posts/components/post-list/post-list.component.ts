import { Component, OnInit } from '@angular/core';
import { PostService } from '../../services/posts.service';
import { CommonModule, NgIf } from '@angular/common'; // Importar CommonModule para usar *ngIf y *ngFor
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
  providers: [PostService]
})
export class PostListComponent implements OnInit {
  posts: any[] = [];
  imageUrl: string | null = null;
  baseURL: string = environment.apiUrl;

  constructor(
    private postService: PostService,
    private authService: AuthService // Inyección correcta de AuthService
  ) { }

  ngOnInit(): void {
    this.loadPosts();
  }

  loadPosts() {
    this.postService.getPosts().subscribe(
      (data) => {
        this.posts = data; // Asumiendo que el API devuelve un array de posts

      },
      (error) => {
        console.error('Error al cargar los posts:', error);
      }
    );
  }

  deletePost(id: string) {
    const token = this.authService.getToken();
    console.log('Token enviado:', token); // Verifica el token aquí
    this.postService.deletePost(id).subscribe(
      () => {
        this.posts = this.posts.filter(post => post._id !== id);
      },
      (error) => {
        console.error('Error al eliminar el post:', error);
      }
    );
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  isAdmin(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Admin');
  }

  isEditor(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Editor');
  }


  getImageUrl(imageUrl: string) {
    // Verificar si la URL ya tiene el dominio para evitar duplicarlo
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Si la URL ya es completa, la devolvemos tal cual
    }
    return `${this.baseURL}${imageUrl}`; // Si es relativa, la completamos con baseUrl
  }

}

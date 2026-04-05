import { Component, OnInit } from '@angular/core';
import { PostService } from '../../services/posts.service';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule, FormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-post-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, FormsModule, NgIf, RouterLink],
  templateUrl: './post-list.component.html',
  styleUrls: ['./post-list.component.css'],
  providers: [PostService]
})
export class PostListComponent implements OnInit {
  posts: any[] = [];
  filteredPosts: any[] = [];
  pagedPosts: any[] = [];
  searchTerm: string = '';
  fechaDesde: string = '';
  fechaHasta: string = '';
  pinnedPostId: string | null = null;
  pageSize: number = 9;
  currentPage: number = 1;
  copiedPostId: string | null = null;
  baseURL: string = environment.apiUrl;

  constructor(
    private postService: PostService,
    private authService: AuthService,
    private router: Router
  ) { }

  ngOnInit(): void {
    this.pinnedPostId = localStorage.getItem('colivenc_pinned_post');
    this.loadPosts();
  }

  loadPosts(): void {
    this.postService.getPosts().subscribe(
      (data) => {
        this.posts = data.sort((a, b) =>
          new Date(b.createdAt ?? b.date).getTime() - new Date(a.createdAt ?? a.date).getTime()
        );
        this.applyFilters();
      },
      (error) => { console.error('Error al cargar los posts:', error); }
    );
  }

  applyFilters(): void {
    const term = this.searchTerm.toLowerCase().trim();
    let result = [...this.posts];
    if (term) result = result.filter(p => p.title?.toLowerCase().includes(term));
    if (this.fechaDesde) {
      const desde = new Date(this.fechaDesde);
      desde.setHours(0, 0, 0, 0);
      result = result.filter(p => new Date(p.createdAt ?? p.date) >= desde);
    }
    if (this.fechaHasta) {
      const hasta = new Date(this.fechaHasta);
      hasta.setHours(23, 59, 59, 999);
      result = result.filter(p => new Date(p.createdAt ?? p.date) <= hasta);
    }
    this.filteredPosts = result;
    this.currentPage = 1;
    this.updatePagedPosts();
  }

  filterPosts(): void { this.applyFilters(); }

  limpiarFechas(): void {
    this.fechaDesde = '';
    this.fechaHasta = '';
    this.applyFilters();
  }

  updatePagedPosts(): void {
    this.pagedPosts = this.filteredPosts.slice(0, this.pageSize * this.currentPage);
  }

  verMas(): void { this.currentPage++; this.updatePagedPosts(); }

  hayMas(): boolean { return this.pagedPosts.length < this.filteredPosts.length; }

  getPinnedPost(): any {
    if (!this.pinnedPostId || this.searchTerm || this.fechaDesde || this.fechaHasta) return null;
    return this.posts.find(p => p._id === this.pinnedPostId) ?? null;
  }

  getNonPinnedPagedPosts(): any[] {
    if (!this.pinnedPostId || this.searchTerm || this.fechaDesde || this.fechaHasta) return this.pagedPosts;
    return this.pagedPosts.filter(p => p._id !== this.pinnedPostId);
  }

  togglePin(event: Event, postId: string): void {
    event.stopPropagation();
    if (this.pinnedPostId === postId) {
      this.pinnedPostId = null;
      localStorage.removeItem('colivenc_pinned_post');
    } else {
      this.pinnedPostId = postId;
      localStorage.setItem('colivenc_pinned_post', postId);
    }
  }

  compartirNoticia(event: Event, post: any): void {
    event.stopPropagation();
    const url = `${window.location.origin}/noticia/${post._id}`;
    if (navigator.share) {
      navigator.share({ title: post.title, url });
    } else {
      navigator.clipboard.writeText(url).then(() => {
        this.copiedPostId = post._id;
        setTimeout(() => { this.copiedPostId = null; }, 2000);
      });
    }
  }

  verNoticia(id: string) { this.router.navigate(['/noticia', id]); }

  editarNoticia(event: Event, id: string) {
    event.stopPropagation();
    this.router.navigate(['/edit', id]);
  }

  eliminarNoticia(event: Event, id: string) {
    event.stopPropagation();
    if (confirm('¿Estás seguro de que deseas eliminar esta noticia?')) {
      this.postService.deletePost(id).subscribe(
        () => {
          this.posts = this.posts.filter(post => post._id !== id);
          if (this.pinnedPostId === id) {
            this.pinnedPostId = null;
            localStorage.removeItem('colivenc_pinned_post');
          }
          this.applyFilters();
        },
        (error) => { console.error('Error al eliminar el post:', error); }
      );
    }
  }

  isLoggedIn(): boolean { return this.authService.isLoggedIn(); }

  isAdmin(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Admin');
  }

  isEditor(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Editor');
  }

  getImageUrl(imageUrl: string) {
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) return imageUrl;
    return `${this.baseURL}${imageUrl}`;
  }
}

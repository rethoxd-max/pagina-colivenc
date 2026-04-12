import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SocialMediaService, PostInstagram } from '../../home/services/social-media.service';
import { environment } from '../../../environments/environment';

@Component({
  selector: 'app-admin-instagram',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-instagram.component.html',
  styleUrls: ['./admin-instagram.component.css'],
})
export class AdminInstagramComponent implements OnInit {
  posts: PostInstagram[] = [];
  nuevaUrl = '';
  nuevaImagenUrl = '';
  nuevaDescripcion = '';
  nuevosLikes = 0;
  nuevosComentarios = 0;
  cargando = false;
  buscando = false;
  refrescandoId: string | null = null;
  error = '';
  exito = '';
  errorBusqueda = '';

  constructor(private socialMediaService: SocialMediaService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.socialMediaService.getPosts().subscribe({
      next: (data) => { this.posts = data; this.cargando = false; },
      error: () => { this.error = 'Error al cargar los posts'; this.cargando = false; },
    });
  }

  anadir(): void {
    this.error = '';
    this.exito = '';
    const url = this.nuevaUrl.trim();
    if (!url) { this.error = 'Introduce una URL de Instagram.'; return; }
    if (!url.includes('instagram.com/p/') && !url.includes('instagram.com/reel/')) {
      this.error = 'La URL debe ser de una publicación de Instagram (instagram.com/p/... o /reel/...).';
      return;
    }
    this.socialMediaService.addPost(
      url,
      this.posts.length,
      this.nuevaImagenUrl.trim(),
      this.nuevaDescripcion.trim(),
      this.nuevosLikes,
      this.nuevosComentarios,
    ).subscribe({
      next: () => {
        this.exito = 'Post añadido correctamente.';
        this.nuevaUrl = '';
        this.nuevaImagenUrl = '';
        this.nuevaDescripcion = '';
        this.nuevosLikes = 0;
        this.nuevosComentarios = 0;
        this.cargar();
      },
      error: (e) => {
        this.error = e?.error?.mensaje || 'Error al añadir el post.';
      },
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar este post del listado?')) return;
    this.socialMediaService.deletePost(id).subscribe({
      next: () => { this.exito = 'Post eliminado.'; this.cargar(); },
      error: () => { this.error = 'Error al eliminar.'; },
    });
  }

  refrescar(post: PostInstagram): void {
    this.refrescandoId = post._id;
    this.error = '';
    this.exito = '';
    this.socialMediaService.refreshPost(post._id).subscribe({
      next: (updated) => {
        const i = this.posts.findIndex(p => p._id === post._id);
        if (i >= 0) this.posts[i] = updated;
        this.exito = 'Datos actualizados correctamente.';
        this.refrescandoId = null;
      },
      error: (e) => {
        this.error = e?.error?.mensaje || 'No se pudieron obtener los datos automáticamente.';
        this.refrescandoId = null;
      },
    });
  }

  obtenerDatos(): void {
    this.errorBusqueda = '';
    const url = this.nuevaUrl.trim();
    if (!url) { this.errorBusqueda = 'Introduce primero la URL del post.'; return; }
    this.buscando = true;
    this.socialMediaService.fetchMetadata(url).subscribe({
      next: (data) => {
        this.nuevaImagenUrl = data.imagenUrl || '';
        this.nuevaDescripcion = data.descripcion || '';
        this.buscando = false;
      },
      error: (e) => {
        this.errorBusqueda = e?.error?.mensaje || 'No se pudieron obtener los datos automáticamente.';
        this.buscando = false;
      },
    });
  }

  getImagenUrl(url: string): string {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `${environment.apiUrl}${url}`;
  }
}

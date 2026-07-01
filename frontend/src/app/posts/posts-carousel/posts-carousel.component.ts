import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostService } from '../services/posts.service';
import { environment } from '../../../environments/environment';
import { DisciplinaFilterService } from '../../services/disciplina-filter.service';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { isPdf, getPostMediaUrl } from '../utils/post-media.util';

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-posts-carousel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink, PdfViewerModule],
  templateUrl: './posts-carousel.component.html',
  styleUrls: ['./posts-carousel.component.css']
})

export class PostsCarouselComponent implements OnInit, OnDestroy {
  allPosts: Post[] = [];
  posts: Post[] = [];
  currentIndex: number = 0;
  autoSlideSub?: Subscription;
  private filterSub?: Subscription;
  baseURL: string = environment.apiUrl;

  constructor(
    private postService: PostService,
    private disciplinaFilterService: DisciplinaFilterService
  ) { }

  ngOnInit() {
    this.fetchLatestPosts();
  }

  fetchLatestPosts() {
    this.postService.getUltimosPosts().subscribe({
      next: (data) => {
        this.allPosts = data;
        this.applyFilter(this.disciplinaFilterService.disciplinaActual);
        this.filterSub = this.disciplinaFilterService.disciplina$.subscribe(id => this.applyFilter(id));
      },
      error: (err) => console.error('Error al obtener posts', err)
    });
  }

  applyFilter(discId: string | null): void {
    this.posts = discId
      ? this.allPosts.filter(p => !(p as any).disciplina || ((p as any).disciplina?._id || (p as any).disciplina) === discId)
      : this.allPosts;
    this.currentIndex = 0;
    this.stopAutoSlide();
    if (this.posts.length > 0) this.startAutoSlide();
  }

  startAutoSlide() {
    this.autoSlideSub = interval(5000).subscribe(() => this.nextSlide());
  }

  stopAutoSlide() {
    this.autoSlideSub?.unsubscribe();
  }

  nextSlide() {
    this.currentIndex = (this.currentIndex + 1) % this.posts.length;
  }

  prevSlide() {
    this.currentIndex = (this.currentIndex - 1 + this.posts.length) % this.posts.length;
  }

  getImageUrl(imageUrl: string | undefined) {
    return getPostMediaUrl(imageUrl);
  }

  isPdf(imageUrl: string | undefined): boolean {
    return isPdf(imageUrl);
  }

  ngOnDestroy() {
    this.stopAutoSlide();
    this.filterSub?.unsubscribe();
  }
}

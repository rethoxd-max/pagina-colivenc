import { Component, OnInit, OnDestroy } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { interval, Subscription } from 'rxjs';
import { CommonModule, NgIf } from '@angular/common';
import { ReactiveFormsModule } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { PostService } from '../services/posts.service';
import { environment } from '../../../environments/environment';

interface Post {
  _id: string;
  title: string;
  content: string;
  imageUrl?: string;
}

@Component({
  selector: 'app-posts-carousel',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink],
  templateUrl: './posts-carousel.component.html',
  styleUrls: ['./posts-carousel.component.css']
})

export class PostsCarouselComponent implements OnInit, OnDestroy {
  posts: Post[] = [];
  currentIndex: number = 0;
  autoSlideSub?: Subscription;
  baseURL: string = environment.apiUrl;

  constructor(private postService: PostService) { }

  ngOnInit() {
    this.fetchLatestPosts();
  }

  fetchLatestPosts() {
    this.postService.getUltimosPosts().subscribe({
      next: (data) => {
        this.posts = data;
        this.startAutoSlide();
      },
      error: (err) => console.error('Error al obtener posts', err)
    });
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
    if (!imageUrl) return '';
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${this.baseURL}${imageUrl}`;
  }

  ngOnDestroy() {
    this.stopAutoSlide();
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { PostService } from '../../../posts/services/posts.service';
import { isPdf, getPostMediaUrl } from '../../../posts/utils/post-media.util';

@Component({
  selector: 'app-featured-post',
  standalone: true,
  imports: [CommonModule, RouterLink, PdfViewerModule],
  templateUrl: './featured-post.component.html',
  styleUrls: ['./featured-post.component.css'],
})
export class FeaturedPostComponent implements OnInit {
  posts: any[] = [];
  cargando = true;

  constructor(private postService: PostService) {}

  ngOnInit(): void {
    this.postService.getPostsDestacados().subscribe({
      next: (data) => { this.posts = data || []; this.cargando = false; },
      error: () => { this.cargando = false; }
    });
  }

  getImageUrl(imageUrl: string | undefined): string {
    return getPostMediaUrl(imageUrl);
  }

  isPdf(imageUrl: string | undefined): boolean {
    return isPdf(imageUrl);
  }
}

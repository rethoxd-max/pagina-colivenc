import { Component, OnInit } from '@angular/core';
import { CommonModule, NgIf } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/posts.service';
import { AuthService } from '../../../auth/services/auth.service';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-edit-post',
  standalone: true,
  imports: [CommonModule, NgIf, ReactiveFormsModule],
  templateUrl: './edit-post.component.html',
  styleUrls: ['./edit-post.component.css']
})
export class EditPostComponent implements OnInit {
  postForm: FormGroup;
  postId: string | null = null;
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  isEditMode = true;
  baseURL: string = environment.apiUrl;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private postService: PostService,
    private authService: AuthService,
    private fb: FormBuilder
  ) {
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      category: [''],
    });
  }

  ngOnInit() {
    this.postId = this.route.snapshot.paramMap.get('id');
    if (this.postId) {
      this.postService.getPost(this.postId).subscribe({
        next: (post: any) => {
          this.postForm.patchValue({
            title: post.title,
            content: post.content,
            category: post.category || '',
          });
          if (post.imageUrl) {
            this.imageUrl = post.imageUrl;
          }
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
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit() {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('title', this.postForm.get('title')?.value);
    formData.append('content', this.postForm.get('content')?.value);
    formData.append('category', this.postForm.get('category')?.value || '');
    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.postService.updatePost(this.postId!, formData).subscribe({
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


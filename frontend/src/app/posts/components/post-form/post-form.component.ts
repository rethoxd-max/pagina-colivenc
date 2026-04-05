import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/posts.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf } from '@angular/common';
import { environment } from '../../../../environments/environment';
@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.css'],
})
export class PostFormComponent implements OnInit {
  postForm: FormGroup;
  postId: string | null = null;
  isEditMode = false;
  selectedFile: File | null = null;
  imageUrl: string | null = null;

  baseUrl: string = environment.apiUrl;

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    // Inicializar formulario con validaciones
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      category: [''],
    });
  }

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
    if (this.postId) {
      this.isEditMode = true;
      this.postService.getPosts().subscribe((posts) => {
        const post = posts.find(
          (p: { _id: string | null }) => p._id === this.postId
        );
        if (post) {
          this.postForm.patchValue({
            title: post.title,
            content: post.content,
            category: post.category || '',
          });
        }
      });
    }
  }

  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];
    if (this.selectedFile) {
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  onSubmit() {
    if (this.postForm.invalid) {
      this.postForm.markAllAsTouched(); // Marca todos los campos como "tocados"
      return;
    }

    const formData = new FormData();
    formData.append('title', this.postForm.get('title')?.value);
    formData.append('content', this.postForm.get('content')?.value);
    formData.append('category', this.postForm.get('category')?.value || '');

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    this.postService.createPost(formData).subscribe(
      (response) => {
        console.log('Respuesta del servidor:', response);
        this.router.navigate(['/noticias']);
      },
      (error) => {
        console.error('Error al crear el post:', error);
      }
    );
  }

  volver(): void {
    this.router.navigate(['/noticias']);
  }
}

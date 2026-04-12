import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/posts.service';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf, NgFor } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { DisciplinaService, Disciplina } from '../../../services/disciplina.service';
import { forkJoin } from 'rxjs';
@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor],
  templateUrl: './post-form.component.html',
  styleUrls: ['./post-form.component.css'],
})
export class PostFormComponent implements OnInit {
  postForm: FormGroup;
  postId: string | null = null;
  isEditMode = false;
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  disciplinas: Disciplina[] = [];

  baseUrl: string = environment.apiUrl;

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private disciplinaService: DisciplinaService
  ) {
    // Inicializar formulario con validaciones
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      category: [''],
      disciplina: [null],
    });
  }

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
    if (this.postId) {
      this.isEditMode = true;
      forkJoin([
        this.disciplinaService.getDisciplinas(),
        this.postService.getPost(this.postId)
      ]).subscribe(([disciplinas, post]) => {
        this.disciplinas = disciplinas;
        if (post) {
          this.postForm.patchValue({
            title: post.title,
            content: post.content,
            category: post.category || '',
            disciplina: post.disciplina?._id || post.disciplina || null,
          });
          if (post.imageUrl) {
            this.imageUrl = `${this.baseUrl}/${post.imageUrl}`;
          }
        }
      });
    } else {
      this.disciplinaService.getDisciplinas().subscribe(d => { this.disciplinas = d; });
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
    const discId = this.postForm.get('disciplina')?.value;
    if (discId) formData.append('disciplina', discId);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    const request = this.isEditMode && this.postId
      ? this.postService.updatePost(this.postId, formData)
      : this.postService.createPost(formData);

    request.subscribe(
      () => { this.router.navigate(['/noticias']); },
      (error) => { console.error('Error al guardar el post:', error); }
    );
  }

  volver(): void {
    this.router.navigate(['/noticias']);
  }
}

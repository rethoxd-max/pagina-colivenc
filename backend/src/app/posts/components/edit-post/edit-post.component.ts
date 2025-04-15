import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { PostService } from '../../services/posts.service';
import { NgClass, NgIf } from '@angular/common';
import { environment } from '../../../../environments/environment.development';
@Component({
  selector: 'app-edit-post',
  standalone: true,
  templateUrl: './edit-post.component.html',
  styleUrls: ['./edit-post.component.css'],
  imports: [ReactiveFormsModule, NgIf, NgClass]
})
export class EditPostComponent implements OnInit {
  postForm: FormGroup;
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  postId: string | null = null;
  baseUrl: string = environment.apiUrl;




  constructor(
    private route: ActivatedRoute,
    private formBuilder: FormBuilder,
    private postService: PostService,
    private router: Router
  ) {
    this.postForm = this.formBuilder.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
    });
  }

  ngOnInit(): void {
    this.postId = this.route.snapshot.paramMap.get('id');
    console.log('Post ID:', this.postId); // Verifica si el ID se está recuperando correctamente
    if (this.postId) {
      this.loadPostData(this.postId);
    }
  }


  loadPostData(id: string): void {
    this.postService.getPostById(id).subscribe(
      post => {
        this.postForm.patchValue({
          title: post.title,
          content: post.content,
        });

        // Si el post tiene una imagen, concatenamos la URL base con el path de la imagen
        if (post.imageUrl) {
          this.imageUrl = this.getImageUrl(post.imageUrl); // Cargar la imagen actual correctamente
        }
      },
      error => {
        console.error('Error al cargar el post:', error);
      }
    );
  }


  getImageUrl(imageUrl: string) {
    // Verificar si la URL ya tiene el dominio para evitar duplicarlo
    if (imageUrl.startsWith('http')) {
      return imageUrl; // Si la URL ya es completa, la devolvemos tal cual
    }
    return `${this.baseUrl}${imageUrl}`; // Si es relativa, la completamos con baseUrl
  }


  onFileSelected(event: any) {
    this.selectedFile = event.target.files[0];

    if (this.selectedFile) {
      const reader = new FileReader();

      // Cargar la imagen seleccionada y mostrarla en el formulario
      reader.onload = (e: any) => {
        this.imageUrl = e.target.result;  // Actualiza imageUrl para la vista previa
      };

      reader.readAsDataURL(this.selectedFile); // Lee la imagen seleccionada
    }
  }


  onSubmit(): void {
    if (!this.postId) return;

    const formData = new FormData();
    formData.append('title', this.postForm.get('title')?.value);
    formData.append('content', this.postForm.get('content')?.value);

    if (this.selectedFile) {
      formData.append('image', this.selectedFile); // Añadir la nueva imagen si se selecciona
    }

    this.postService.updatePost(this.postId, formData).subscribe(
      () => {
        this.router.navigate(['/posts']);
      },
      error => {
        console.error('Error al actualizar el post:', error);
      }
    );
  }
}

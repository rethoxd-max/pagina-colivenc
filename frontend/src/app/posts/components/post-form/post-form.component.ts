import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { PostService } from '../../services/posts.service';
import {
  FormBuilder,
  FormGroup,
  FormArray,
  FormsModule,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { NgIf, NgFor, NgClass, DatePipe } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { DisciplinaService, Disciplina } from '../../../services/disciplina.service';
import { CompeticionService } from '../../../calendario/services/competicion.service';
import { forkJoin } from 'rxjs';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { isPdf as isPdfUtil, getPostMediaUrl, getFileIcon } from '../../utils/post-media.util';
@Component({
  selector: 'app-post-form',
  standalone: true,
  imports: [ReactiveFormsModule, FormsModule, NgIf, NgFor, NgClass, DatePipe, PdfViewerModule],
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
  enlaceFiles: (File | null)[] = []; // Archivo seleccionado (si lo hay) para cada fila de "enlaces", en paralelo al FormArray

  // Competición enlazada a esta noticia (buscador de texto, solo hoy o futuras)
  competicionVinculada: any = null;
  buscarCompeticionTexto = '';
  private competicionesFuturas: any[] = [];

  baseUrl: string = environment.apiUrl;

  constructor(
    private postService: PostService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private disciplinaService: DisciplinaService,
    private competicionService: CompeticionService
  ) {
    // Inicializar formulario con validaciones
    this.postForm = this.fb.group({
      title: ['', Validators.required],
      content: ['', Validators.required],
      category: [''],
      disciplina: [null],
      enlaces: this.fb.array([]),
    });
  }

  ngOnInit(): void {
    this.cargarCompeticionesFuturas();

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
            this.imageUrl = getPostMediaUrl(post.imageUrl);
          }
          if (post.competicion) {
            this.competicionVinculada = post.competicion;
          }

          // Cargar enlaces existentes
          if (post.enlaces && post.enlaces.length > 0) {
            post.enlaces.forEach((enlace: any) => {
              this.enlaces.push(this.fb.group({
                nombre: [enlace.nombre, Validators.required],
                url: [enlace.url || ''],
                origen: [enlace.origen || 'url'],
              }));
              this.enlaceFiles.push(null);
            });
          }
        }
      });
    } else {
      this.disciplinaService.getDisciplinas().subscribe(d => { this.disciplinas = d; });
    }
  }

  private cargarCompeticionesFuturas(): void {
    this.competicionService.getCompeticiones().subscribe({
      next: (competiciones) => {
        const hoy = new Date();
        hoy.setHours(0, 0, 0, 0);
        this.competicionesFuturas = competiciones
          .filter(c => new Date(c.fecha) >= hoy)
          .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
      },
      error: () => { this.competicionesFuturas = []; }
    });
  }

  get competicionesEncontradas(): any[] {
    const texto = this.buscarCompeticionTexto.trim().toLowerCase();
    if (!texto) return [];
    return this.competicionesFuturas
      .filter(c => c.nombre.toLowerCase().includes(texto))
      .slice(0, 8);
  }

  seleccionarCompeticion(competicion: any): void {
    this.competicionVinculada = competicion;
    this.buscarCompeticionTexto = '';
  }

  quitarCompeticionVinculada(): void {
    this.competicionVinculada = null;
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

  // Getters y helpers para el FormArray de enlaces
  get enlaces(): FormArray {
    return this.postForm.get('enlaces') as FormArray;
  }

  addEnlace(): void {
    if (this.enlaces.length < 10) {
      this.enlaces.push(this.fb.group({
        nombre: ['', Validators.required],
        url: [''],
        origen: ['url'],
      }));
      this.enlaceFiles.push(null);
    }
  }

  removeEnlace(index: number): void {
    this.enlaces.removeAt(index);
    this.enlaceFiles.splice(index, 1);
  }

  // Alterna una fila de "enlaces" entre URL manual y archivo subido
  onEnlaceTipoChange(index: number, origen: 'url' | 'archivo'): void {
    this.enlaces.at(index).patchValue({ origen, url: '' });
    this.enlaceFiles[index] = null;
    const fileInput = document.getElementById(`enlace-file-${index}`) as HTMLInputElement;
    if (fileInput) fileInput.value = '';
  }

  onEnlaceFileSelected(event: any, index: number): void {
    const file = event.target.files[0];
    if (!file) return;
    this.enlaceFiles[index] = file;
    const grupo = this.enlaces.at(index);
    grupo.patchValue({ origen: 'archivo', url: '' });
    if (!grupo.get('nombre')?.value) {
      grupo.patchValue({ nombre: file.name });
    }
  }

  isEnlaceArchivo(index: number): boolean {
    return this.enlaces.at(index).get('origen')?.value === 'archivo';
  }

  getEnlaceFileName(index: number): string {
    const file = this.enlaceFiles[index];
    if (file) return file.name;
    const url = this.enlaces.at(index).get('url')?.value;
    return url ? url.split('/').pop() || '' : '';
  }

  getEnlaceIcon(index: number): string {
    const file = this.enlaceFiles[index];
    if (file) return getFileIcon(file.name);
    return getFileIcon(this.enlaces.at(index).get('url')?.value);
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
    formData.append('competicionVinculada', this.competicionVinculada?._id || '');

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    }

    // Enviar enlaces: mezcla de URLs manuales y archivos subidos (cualquier tipo, máx. 50MB)
    const enlacesMeta: any[] = [];
    this.enlaces.value.forEach((enlace: any, index: number) => {
      if (!enlace.nombre) return;
      const file = this.enlaceFiles[index];
      if (enlace.origen === 'archivo') {
        if (file) {
          enlacesMeta.push({ nombre: enlace.nombre, origen: 'archivo', nuevoArchivo: true });
          formData.append('adjuntos', file);
        } else if (enlace.url) {
          enlacesMeta.push({ nombre: enlace.nombre, origen: 'archivo', url: enlace.url, nuevoArchivo: false });
        }
      } else if (enlace.url) {
        enlacesMeta.push({ nombre: enlace.nombre, origen: 'url', url: enlace.url });
      }
    });
    formData.append('enlaces', JSON.stringify(enlacesMeta));

    const request = this.isEditMode && this.postId
      ? this.postService.updatePost(this.postId, formData)
      : this.postService.createPost(formData);

    request.subscribe(
      () => { this.router.navigate(['/noticias']); },
      (error) => { console.error('Error al guardar el post:', error); }
    );
  }

  isPdf(url: string | null): boolean {
    return isPdfUtil(url);
  }

  volver(): void {
    this.router.navigate(['/noticias']);
  }
}

import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { TiendaService } from '../../services/tienda.service';
import { Router, ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-crear-producto',
  standalone: true,
  imports: [CommonModule, FormsModule, ReactiveFormsModule],
  templateUrl: './crear-producto.component.html',
  styleUrls: ['./crear-producto.component.css']
})
export class CrearProductoComponent implements OnInit {
  productoForm: FormGroup;
  imagenSeleccionada: File | null = null;
  imagenPreview: string | null = null;
  imagenActual: string | null = null;
  loading = false;
  esEdicion = false;
  productoId: string | null = null;

  constructor(
    private fb: FormBuilder,
    private tiendaService: TiendaService,
    private router: Router,
    private route: ActivatedRoute
  ) {
    this.productoForm = this.fb.group({
      nombre: ['', Validators.required],
      descripcion: ['', Validators.required],
      precio: ['', [Validators.required, Validators.min(0)]],
      categoria: ['', Validators.required],
      stock: ['', [Validators.required, Validators.min(0)]],
      tallas: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.productoId = this.route.snapshot.paramMap.get('id');
    if (this.productoId) {
      this.esEdicion = true;
      this.cargarProducto();
    }
  }

  cargarProducto() {
    if (!this.productoId) return;
    
    this.loading = true;
    this.tiendaService.getProducto(this.productoId).subscribe({
      next: (producto) => {
        this.productoForm.patchValue({
          nombre: producto.nombre,
          descripcion: producto.descripcion,
          precio: producto.precio,
          categoria: producto.categoria,
          stock: producto.stock,
          tallas: producto.tallas.join(', ')
        });
        this.imagenActual = producto.imagen;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar el producto:', error);
        this.loading = false;
      }
    });
  }

  onFileSelected(event: Event) {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.imagenSeleccionada = input.files[0];
      const reader = new FileReader();
      reader.onload = (e: any) => {
        this.imagenPreview = e.target.result;
      };
      reader.readAsDataURL(this.imagenSeleccionada);
    }
  }

  getImagenUrl(filename: string): string {
    return this.tiendaService.getImagenUrl(filename);
  }

  onSubmit() {
    if (this.productoForm.invalid) return;

    this.loading = true;
    const formData = new FormData();

    // Agregar campos del formulario
    Object.keys(this.productoForm.value).forEach(key => {
      if (key === 'tallas') {
        // Procesar tallas: dividir por comas, limpiar espacios y filtrar vacíos
        const tallas = this.productoForm.value[key]
          .split(',')
          .map((t: string) => t.trim())
          .filter((t: string) => t);
        formData.append(key, JSON.stringify(tallas));
      } else {
        formData.append(key, this.productoForm.value[key]);
      }
    });

    // Agregar imagen solo si se ha seleccionado una nueva
    if (this.imagenSeleccionada) {
      formData.append('imagen', this.imagenSeleccionada);
    }

    const request = this.esEdicion && this.productoId
      ? this.tiendaService.actualizarProducto(this.productoId, formData)
      : this.tiendaService.crearProducto(formData);

    request.subscribe({
      next: () => {
        this.router.navigate(['/tienda']);
      },
      error: (error) => {
        console.error('Error al guardar el producto:', error);
        this.loading = false;
      }
    });
  }

  volver() {
    this.router.navigate(['/tienda']);
  }
} 
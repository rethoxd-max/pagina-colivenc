import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompeticionService, PruebaCompeticion, SectorCompeticion, CategoriaCompeticion } from '../../services/competicion.service';
import { NgClass, NgFor, NgIf } from '@angular/common';
import { environment } from '../../../../environments/environment.development';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectChange } from '@angular/material/select';

@Component({
  selector: 'app-competicion-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgClass, NgFor, MatAutocompleteModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './competicion-form.component.html',
  styleUrls: ['./competicion-form.component.css'],
})
export class CompeticionFormComponent implements OnInit {
  competicionForm: FormGroup;
  competicionId: string | null = null;
  isEditMode = false;
  selectedFile: File | null = null;
  imageUrl: string | null = null;

  // Variables para categorías, sectores y pruebas
  categoriasDisponibles: CategoriaCompeticion[] = [];
  sectoresDisponibles: SectorCompeticion[] = [];
  pruebasDisponibles: PruebaCompeticion[] = [];
  pruebasSeleccionadas: PruebaCompeticion[] = [];
  categoriasSeleccionadas: string[] = [];


  baseUrl: string = environment.apiUrl;

  constructor(
    private competicionService: CompeticionService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder
  ) {
    this.competicionForm = this.fb.group({
      nombre: ['', Validators.required],
      fecha: ['', Validators.required],
      lugar: ['', Validators.required],
      descripcion: [''],
      imagen: [''],
      tipo: [''],
      categorias: [[]], // Ahora permite múltiples categorías
      sector: [''],
      pruebas: [[]],
    });
  }

  ngOnInit(): void {
    this.competicionId = this.route.snapshot.paramMap.get('id');
    this.categoriasSeleccionadas = [];
    // Cargar categorías y sectores al iniciar
    this.competicionService.getCategorias().subscribe(
      categorias => {
        this.categoriasDisponibles = categorias;
      }
    );

    this.competicionService.getSectores().subscribe(
      sectores => {
        this.sectoresDisponibles = sectores;
      }
    );

    // Si es modo edición, cargar la competición y sus pruebas seleccionadas
    if (this.competicionId) {
      this.isEditMode = true;
      this.competicionService.getCompeticionById(this.competicionId).subscribe(
        competicion => {
          this.competicionForm.patchValue({
            nombre: competicion.nombre,
            fecha: this.formatDate(competicion.fecha),
            lugar: competicion.lugar,
            descripcion: competicion.descripcion,
            tipo: competicion.tipo,
            imagen: competicion.imageUrl, // Aquí estás asignando el campo imagen
            categorias: competicion.categorias,
            pruebas: [],
            sector: ''
          });
          // Establecer la URL de la imagen si existe
          if (competicion.imagen) {
            console.log(this.imageUrl);
            this.imageUrl = `${this.baseUrl}/uploads/competiciones/${competicion.imagen}`; // Suponiendo que la imagen está en la carpeta 'uploads'
          }

          this.categoriasSeleccionadas = competicion.categorias;

          if (competicion.pruebas && competicion.pruebas.length > 0) {
            this.competicionService.getPruebasByIds(competicion.pruebas).subscribe(
              pruebas => {
                this.pruebasSeleccionadas = pruebas;
                this.pruebasDisponibles = this.pruebasDisponibles.filter(
                  prueba => !this.pruebasSeleccionadas.some(sel => sel._id === prueba._id)
                );
                this.competicionForm.patchValue({
                  pruebas: this.pruebasSeleccionadas
                });
              }
            );
          }
        }
      );
    }
  }

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Cargar pruebas según las categorías y el sector seleccionados
  cargarPruebas(sectorId: string, categorias: string[]): void {
    if (categorias.length > 0 && sectorId) {
      this.competicionService.getPruebasPorCategoriaYSector(sectorId, categorias).subscribe(
        pruebas => {
          // Mezclar las pruebas disponibles y seleccionadas
          const nuevasPruebas = pruebas.filter(
            prueba => !this.pruebasSeleccionadas.some(sel => sel._id === prueba._id)
          );
          this.pruebasDisponibles = [...nuevasPruebas, ...this.pruebasSeleccionadas];
        },
        error => {
          console.error('Error al cargar las pruebas:', error);
        }
      );
    } else {
      this.pruebasDisponibles = [];
    }
  }



  // Manejador de cambio de categorías
  onCategoriasChange(event: MatSelectChange): void {
    this.categoriasSeleccionadas = event.value; // Actualizamos las categorías seleccionadas
    const sectorId = this.competicionForm.get('sector')?.value; // Obtén el sector seleccionado
    const competicionId = this.competicionId;
    if (sectorId && this.categoriasSeleccionadas.length > 0) {
      this.cargarPruebas(sectorId, this.categoriasSeleccionadas);
    } else if (this.categoriasSeleccionadas.length < 1){
      this.categoriasSeleccionadas = [];
    }
  }

  // Manejador de cambio de sector
  onSectorChange(event: any): void {
    const sectorId = event.target.value; // Se obtiene el valor del sector seleccionado
    const categoriasIds = this.competicionForm.get('categorias')?.value;

    if (sectorId && categoriasIds.length > 0) {
      this.cargarPruebas(sectorId, categoriasIds);
    }
  }


  onFileSelected(event: any): void {
    const file = event.target.files[0];
    if (file) {
      this.selectedFile = file;

      // Crear una URL para mostrar la vista previa de la imagen
      const reader = new FileReader();
      reader.onload = () => {
        this.imageUrl = reader.result as string;
      };
      reader.readAsDataURL(file);
    }
  }


  seleccionarPrueba(prueba: PruebaCompeticion): void {
    this.pruebasSeleccionadas.push(prueba);
    this.pruebasDisponibles = this.pruebasDisponibles.filter(p => p._id !== prueba._id);
    this.competicionForm.patchValue({ pruebas: this.pruebasSeleccionadas });
  }

  deseleccionarPrueba(prueba: PruebaCompeticion): void {
    this.pruebasSeleccionadas = this.pruebasSeleccionadas.filter(p => p._id !== prueba._id);
    this.pruebasDisponibles.push(prueba);
    this.competicionForm.patchValue({ pruebas: this.pruebasSeleccionadas });
  }

  onSubmit() {
    if (this.competicionForm.invalid) {
      this.competicionForm.markAllAsTouched();
      return;
    }

    const formData = new FormData();
    formData.append('nombre', this.competicionForm.get('nombre')?.value);
    formData.append('fecha', this.competicionForm.get('fecha')?.value);
    formData.append('lugar', this.competicionForm.get('lugar')?.value);
    formData.append('descripcion', this.competicionForm.get('descripcion')?.value);
    formData.append('tipo', this.competicionForm.get('tipo')?.value);

    const categoriasIds = this.competicionForm.get('categorias')?.value;
    categoriasIds.forEach((id: string, index: number) => {
      formData.append(`categorias[${index}]`, id);
    });

    const pruebasIds = this.competicionForm.get('pruebas')?.value.map((prueba: PruebaCompeticion) => prueba._id);
    pruebasIds.forEach((id: string, index: number) => {
      formData.append(`pruebas[${index}]`, id);
    });

    if (this.selectedFile) {
      formData.append('imagen', this.selectedFile);
    } else if (this.isEditMode && this.imageUrl) {
      formData.append('imageUrl', this.imageUrl);  // Enviar la URL de la imagen existente si no se selecciona una nueva.
    }

    if (this.categoriasSeleccionadas!.length < 1) {
      this.categoriasSeleccionadas = [];
    }


    if (this.isEditMode) {
      this.competicionService.updateCompeticion(this.competicionId!, formData).subscribe(
        () => {
          this.router.navigate(['/competiciones']);
        }
      );
    } else {
      this.competicionService.createCompeticion(formData).subscribe(
        () => {
          this.router.navigate(['/competiciones']);
        }
      );
    }
  }
}

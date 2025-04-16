import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CompeticionService, SectorCompeticion, CategoriaCompeticion, PruebaCompeticion } from '../../services/competicion.service';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatButtonModule } from '@angular/material/button';
import { MatSelectModule } from '@angular/material/select';
import { MatCardModule } from '@angular/material/card';
import { MatTabsModule } from '@angular/material/tabs';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatListModule } from '@angular/material/list';

@Component({
  selector: 'app-create-datos-competiciones',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    MatInputModule,
    MatButtonModule,
    MatSelectModule,
    MatCardModule,
    MatTabsModule,
    MatSnackBarModule,
    MatListModule
  ],
  templateUrl: './create-datos-competiciones.component.html',
  styleUrls: ['./create-datos-competiciones.component.scss']
})
export class CreateDatosCompeticionesComponent implements OnInit {
  // Formularios
  sectorForm: FormGroup;
  categoriaForm: FormGroup;
  pruebaForm: FormGroup;

  // Datos existentes
  sectores: SectorCompeticion[] = [];
  categorias: CategoriaCompeticion[] = [];
  pruebas: PruebaCompeticion[] = [];

  constructor(
    private fb: FormBuilder,
    private competicionService: CompeticionService,
    private snackBar: MatSnackBar
  ) {
    // Inicializar formularios
    this.sectorForm = this.fb.group({
      nombre_sector: ['', Validators.required]
    });

    this.categoriaForm = this.fb.group({
      nombre_categoria: ['', Validators.required]
    });

    this.pruebaForm = this.fb.group({
      nombre_prueba: ['', Validators.required],
      sector_id: ['', Validators.required],
      categoria_id: ['', Validators.required]
    });
  }

  ngOnInit(): void {
    this.cargarDatos();
  }

  cargarDatos(): void {
    // Cargar sectores
    this.competicionService.getSectores().subscribe(
      sectores => {
        this.sectores = sectores;
      },
      error => {
        this.mostrarError('Error al cargar los sectores');
      }
    );

    // Cargar categorías
    this.competicionService.getCategorias().subscribe(
      categorias => {
        this.categorias = categorias;
      },
      error => {
        this.mostrarError('Error al cargar las categorías');
      }
    );
  }

  crearSector(): void {
    if (this.sectorForm.valid) {
      const sectorData = this.sectorForm.value;
      this.competicionService.createSector(sectorData).subscribe(
        response => {
          this.mostrarExito('Sector creado exitosamente');
          this.sectorForm.reset();
          this.cargarDatos();
        },
        error => {
          this.mostrarError('Error al crear el sector');
        }
      );
    }
  }

  crearCategoria(): void {
    if (this.categoriaForm.valid) {
      const categoriaData = this.categoriaForm.value;
      this.competicionService.createCategoria(categoriaData).subscribe(
        response => {
          this.mostrarExito('Categoría creada exitosamente');
          this.categoriaForm.reset();
          this.cargarDatos();
        },
        error => {
          this.mostrarError('Error al crear la categoría');
        }
      );
    }
  }

  crearPrueba(): void {
    if (this.pruebaForm.valid) {
      const pruebaData = this.pruebaForm.value;
      this.competicionService.createPrueba(pruebaData).subscribe(
        response => {
          this.mostrarExito('Prueba creada exitosamente');
          this.pruebaForm.reset();
          this.cargarDatos();
        },
        error => {
          this.mostrarError('Error al crear la prueba');
        }
      );
    }
  }

  mostrarExito(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['success-snackbar']
    });
  }

  mostrarError(mensaje: string): void {
    this.snackBar.open(mensaje, 'Cerrar', {
      duration: 3000,
      panelClass: ['error-snackbar']
    });
  }
} 
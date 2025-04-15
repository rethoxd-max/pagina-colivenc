import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { Observable } from 'rxjs';
import { Atleta, Categoria, PcAL, Prueba, RankingService, Sector, Marca } from '../services/ranking.service'; // Marca importada
import { SearchAtletaComponent } from "./components/search-atleta/search-atleta.component";

@Component({
  selector: 'app-create-performance',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, SearchAtletaComponent],
  templateUrl: './create-performance.component.html',
  styleUrls: ['./create-performance.component.css']
})
export class CreatePerformanceComponent implements OnInit {

  performanceForm!: FormGroup;
  sectores: Sector[] = [];
  pruebas: Prueba[] = [];
  categorias: Categoria[] = [];
  PcAL: PcAL[] = [];
  atletas: Atleta[] = [];

  categoriaSeleccionada: Categoria | null = null;
  sectorSeleccionado: Sector | null = null;
  pruebaSeleccionada: Prueba | null = null;

  constructor(private fb: FormBuilder, private rankingService: RankingService) { }

  ngOnInit(): void {
    this.performanceForm = this.fb.group({
      nombre_sector: [null, Validators.required],
      nombre_atleta: [null, Validators.required],
      nombre_prueba: [null, Validators.required],
      horas: [null],
      minutos: [null],
      segundos: [null],
      metros: [null],
      puntos: [null],
      lugar: [null],
      viento: [null],
      comentario: [null],
      categoria: [null, Validators.required],
      anyo: [null],
      PcAL: [null, Validators.required]
    });

    this.getSectores();
    this.getCategorias();
    this.getPcAL();
    this.getAtletas();

    // Cuando cambia el sector, cargamos las pruebas del sector correspondiente
    this.performanceForm.get('nombre_sector')?.valueChanges.subscribe(sector => {
      this.sectorSeleccionado = sector;
      this.getPruebasPorSector(sector);
    });

    this.performanceForm.get('nombre_prueba')?.valueChanges.subscribe(value => {
      this.pruebaSeleccionada = value; // Actualiza la prueba seleccionada
    });
  }

  // Cargar sectores desde el backend
  getSectores() {
    this.rankingService.getSectores().subscribe((sectores: any[]) => {
      this.sectores = sectores;
    });
  }

  getAtletas() {
    this.rankingService.getAtletas().subscribe((atletas: any[]) => {
      this.atletas = atletas;
    });
  }

  // Cargar pruebas por sector desde el backend
  getPruebasPorSector(sectorId: string) {
    if (sectorId) {
      this.rankingService.getPruebasPorSector(sectorId).subscribe((pruebas: Prueba[]) => {
        this.pruebas = pruebas;
      });
    } else {
      sectorId = '';
    }
  }

  getCategorias(): void {
    this.rankingService.getCategorias().subscribe((categorias) => {
      this.categorias = categorias;
    });
  }

  getPcAL(): void {
    this.rankingService.getPcAL().subscribe((PcAL) => {
      this.PcAL = PcAL;
    });
  }

  onSectorSelected(): void {
    this.pruebaSeleccionada = null; // Reiniciar selección de prueba
    this.categoriaSeleccionada = null; // Reiniciar selección de categoría

    if (this.sectorSeleccionado && this.sectorSeleccionado._id) {
      this.getPruebasPorSector(this.sectorSeleccionado._id);
    }
  }

  onAtletaSelected(atleta: Atleta) {
    this.performanceForm.patchValue({
      nombre_atleta: atleta._id // Asegúrate de que este campo coincide con lo que espera el backend
    });
  }



  // Función para manejar el envío del formulario
  onSubmit(): void {
    if (this.performanceForm.valid) {
      const performanceData = this.performanceForm.value as Marca;
      console.log('Datos enviados:', performanceData); // Verifica si `nombre_atleta` tiene el valor correcto
      this.rankingService.postMarca(performanceData).subscribe(
        (response) => {
          console.log('Marca enviada con éxito', response);
          this.performanceForm.reset();
        },
        (error) => {
          console.error('Error al enviar la marca', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }

}

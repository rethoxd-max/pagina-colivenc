import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
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

  sectoresMetros: string[] = ['Lanzamientos', 'Saltos'];
  sectoresPuntos: string[] = ['Combinadas'];
  pruebasViento: string[] = ['Longitud', 'Triple salto', '60ml', '60mv', '100ml', '100mv', '110mv', '200ml'];
  pruebasDecatlon: string[] = ['Decatlon'];


  categoriaSeleccionada: Categoria | null = null;
  sectorSeleccionado: Sector | null = null;
  pruebaSeleccionada: Prueba | null = null;

  mostrarCampoMetros: boolean = false;
  mostrarCampoTiempo: boolean = false;
  mostrarCampoPuntos: boolean = false;
  mostrarCampoViento: boolean = false;
  mostrarCampoComentario: boolean = false;

  nombreAtletaControl = new FormControl('');

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
      anyo: [null, Validators.required],
      fecha_realizacion: [null],
      PcAL: [null, Validators.required]
    });

    this.nombreAtletaControl = this.fb.control('');

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

    // Reiniciar selección de prueba y categoría
    this.pruebaSeleccionada = null;
    this.categoriaSeleccionada = null;

    // Obtener el valor del sector seleccionado desde el formulario
    const sectorId = this.performanceForm.get('nombre_sector')?.value;
    const sectorSeleccionado = this.sectores.find(sector => sector._id === sectorId);

    if (sectorSeleccionado) {
      this.getPruebasPorSector(sectorSeleccionado._id);

      // Comprobamos si el sector está en sectoresMetros
      if (this.sectoresMetros.includes(sectorSeleccionado.nombre_sector)) {
        this.mostrarCampoMetros = true;
        this.mostrarCampoTiempo = false;
        this.mostrarCampoPuntos = false;
        this.mostrarCampoComentario = false;

      }
      // Comprobamos si el sector está en sectoresPuntos
      else if (this.sectoresPuntos.includes(sectorSeleccionado.nombre_sector)) {
        this.mostrarCampoMetros = false;
        this.mostrarCampoTiempo = false;
        this.mostrarCampoPuntos = true;
        this.mostrarCampoComentario = true;
      }
      // Para cualquier otro sector
      else {
        this.mostrarCampoMetros = false;
        this.mostrarCampoTiempo = true;
        this.mostrarCampoPuntos = false;
        this.mostrarCampoComentario = false;
      }
    }
  }

  onPruebaSelected(): void {
    const pruebaId = this.performanceForm.get('nombre_prueba')?.value;
    const pruebaSeleccionada = this.pruebas.find(prueba => prueba._id === pruebaId);

    if (pruebaSeleccionada) {
      if (this.pruebasViento.includes(pruebaSeleccionada.nombre_prueba)) {
        this.mostrarCampoViento = true;
      } else {
        this.mostrarCampoViento = false;
      }
    }
  }

  onAtletaSelected(atleta: Atleta) {
    this.performanceForm.patchValue({
      nombre_atleta: atleta._id // Asegúrate de que este campo coincide con lo que espera el backend
    });
  }

  resetAtleta(): void {
    this.nombreAtletaControl.reset(); // Reiniciar el campo autocompletado
    this.performanceForm.patchValue({
      nombre_atleta: null
    });
  }




  // Función para manejar el envío del formulario
  onSubmit(): void {
    if (this.performanceForm.valid) {
      // Obtenemos los datos del formulario
      const performanceData = this.performanceForm.value as Marca;

      // Extraemos la fecha y la formateamos
      const fechaISO = this.performanceForm.get('fecha_realizacion')?.value;
      const fechaFormateada = this.formatDate(fechaISO);

      // Reemplazamos la fecha con el formato dd-MM-yyyy
      const formData = {
        ...performanceData,
        fecha_realizacion: fechaFormateada
      };

      console.log('Datos enviados:', formData); // Verifica que `nombre_atleta` tiene el valor correcto y la fecha formateada

      // Enviamos los datos al servicio
      this.rankingService.postMarca(formData).subscribe(
        (response) => {
          console.log('Marca enviada con éxito', response);
          this.performanceForm.reset();
          this.resetAtleta();
        },
        (error) => {
          console.error('Error al enviar la marca', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }

  // Método para formatear la fecha al formato dd-MM-yyyy
  formatDate(fechaISO: string): string {
    const date = new Date(fechaISO);
    const day = String(date.getDate()).padStart(2, '0');
    const month = String(date.getMonth() + 1).padStart(2, '0'); // Los meses empiezan desde 0
    const year = date.getFullYear();
    return `${day}/${month}/${year}`;
  }


}

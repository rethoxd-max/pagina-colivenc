import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatTabsModule } from '@angular/material/tabs';
import { MatCardModule } from '@angular/material/card';
import { Observable } from 'rxjs';
import { Atleta, Categoria, PcAL, Prueba, RankingService, Sector, Marca } from '../services/ranking.service'; // Marca importada
import { SearchAtletaComponent } from "./components/search-atleta/search-atleta.component";
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

@Component({
  selector: 'app-create-performance',
  standalone: true,
  imports: [
    ReactiveFormsModule, 
    CommonModule, 
    FormsModule, 
    MatAutocompleteModule, 
    MatFormFieldModule, 
    MatInputModule,
    MatTabsModule,
    MatCardModule,
    SearchAtletaComponent
  ],
  templateUrl: './create-performance.component.html',
  styleUrls: ['./create-performance.component.css']
})
export class CreatePerformanceComponent implements OnInit {

  performanceForm!: FormGroup;
  atletaForm!: FormGroup;
  pruebaForm!: FormGroup;
  sectores: Sector[] = [];
  pruebas: Prueba[] = [];
  categorias: Categoria[] = [];
  PcAL: PcAL[] = [];
  atletas: Atleta[] = [];
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  isEditMode = false;
  currentYear = new Date().getFullYear();
  currentDate = new Date().toISOString().split('T')[0]; // Formato YYYY-MM-DD para el input date

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

  sectorForm: FormGroup;
  categoriaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router
  ) {
    this.performanceForm = this.fb.group({
      nombre_sector: ['', Validators.required],
      nombre_atleta: ['', Validators.required],
      nombre_prueba: ['', Validators.required],
      horas: [null],
      minutos: [null],
      segundos: [null],
      metros: [null],
      puntos: [null],
      lugar: ['', Validators.required],
      viento: [null],
      comentario: [''],
      categoria: ['', Validators.required],
      anyo: [null, Validators.required],
      fecha_realizacion: ['', Validators.required],
      PcAL: ['', Validators.required]
    });

    // Añadir validación condicional para los campos de tiempo
    this.performanceForm.get('horas')?.valueChanges.subscribe(() => this.actualizarValidacionTiempo());
    this.performanceForm.get('minutos')?.valueChanges.subscribe(() => this.actualizarValidacionTiempo());
    this.performanceForm.get('segundos')?.valueChanges.subscribe(() => this.actualizarValidacionTiempo());

    this.atletaForm = this.fb.group({
      nombre: ['', Validators.required],
      fecha_nacimiento: ['', [Validators.required, this.fechaNoFuturaValidator()]]
    });

    this.pruebaForm = this.fb.group({
      nombre_prueba: ['', Validators.required],
      sector_id: ['', Validators.required]
    });

    this.sectorForm = this.fb.group({
      nombre_sector: ['', Validators.required]
    });

    this.categoriaForm = this.fb.group({
      nombre_categoria: ['', Validators.required]
    });

    this.performanceForm.get('nombre_sector')?.valueChanges.subscribe(sectorId => {
      const sector = this.sectores.find(s => s._id === sectorId);
      if (sector) {
        if (this.sectoresMetros.includes(sector.nombre_sector)) {
          this.performanceForm.get('metros')?.setValidators([Validators.required]);
          this.performanceForm.get('horas')?.clearValidators();
          this.performanceForm.get('minutos')?.clearValidators();
          this.performanceForm.get('segundos')?.clearValidators();
          this.performanceForm.get('puntos')?.clearValidators();
        } else if (this.sectoresPuntos.includes(sector.nombre_sector)) {
          this.performanceForm.get('puntos')?.setValidators([Validators.required]);
          this.performanceForm.get('metros')?.clearValidators();
          this.performanceForm.get('horas')?.clearValidators();
          this.performanceForm.get('minutos')?.clearValidators();
          this.performanceForm.get('segundos')?.clearValidators();
        } else {
          this.performanceForm.get('horas')?.setValidators([Validators.required]);
          this.performanceForm.get('minutos')?.setValidators([Validators.required]);
          this.performanceForm.get('segundos')?.setValidators([Validators.required]);
          this.performanceForm.get('metros')?.clearValidators();
          this.performanceForm.get('puntos')?.clearValidators();
        }
        this.performanceForm.get('metros')?.updateValueAndValidity();
        this.performanceForm.get('horas')?.updateValueAndValidity();
        this.performanceForm.get('minutos')?.updateValueAndValidity();
        this.performanceForm.get('segundos')?.updateValueAndValidity();
        this.performanceForm.get('puntos')?.updateValueAndValidity();
      }
    });
  }

  ngOnInit(): void {
    this.getSectores();
    this.getCategorias();
    this.getPcAL();
    this.getAtletas();

    // Cuando cambia el sector, cargamos las pruebas del sector correspondiente
    this.performanceForm.get('nombre_sector')?.valueChanges.subscribe(sector => {
      this.sectorSeleccionado = sector;
      this.getPruebasPorSector(sector._id);
    });

    this.performanceForm.get('nombre_prueba')?.valueChanges.subscribe(value => {
      this.pruebaSeleccionada = value; // Actualiza la prueba seleccionada
    });
  }

  // Cargar sectores desde el backend
  getSectores() {
    this.http.get<any[]>(`${environment.apiUrl}/sectores`).subscribe((sectores) => {
      this.sectores = sectores;
    });
  }

  getAtletas() {
    this.http.get<any[]>(`${environment.apiUrl}/atletas`).subscribe((atletas) => {
      this.atletas = atletas;
    });
  }

  // Cargar pruebas por sector desde el backend
  getPruebasPorSector(sectorId: string) {
    if (sectorId) {
      this.http.get<Prueba[]>(`${environment.apiUrl}/pruebas/sector/${sectorId}`).subscribe((pruebas) => {
        this.pruebas = pruebas;
      });
    } else {
      sectorId = '';
    }
  }

  getCategorias(): void {
    this.http.get<Categoria[]>(`${environment.apiUrl}/categorias`).subscribe((categorias) => {
      this.categorias = categorias;
    });
  }

  getPcAL(): void {
    this.http.get<PcAL[]>(`${environment.apiUrl}/pcAL`).subscribe((PcAL) => {
      this.PcAL = PcAL;
    });
  }

  actualizarValidacionTiempo(): void {
    const horas = this.performanceForm.get('horas')?.value;
    const minutos = this.performanceForm.get('minutos')?.value;
    const segundos = this.performanceForm.get('segundos')?.value;

    const tieneTiempo = horas !== null && horas !== '' || 
                       minutos !== null && minutos !== '' || 
                       segundos !== null && segundos !== '';
    
    if (this.mostrarCampoTiempo) {
      if (!tieneTiempo) {
        this.performanceForm.setErrors({ tiempoRequerido: true });
      } else {
        this.performanceForm.setErrors(null);
      }
    }
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
        this.performanceForm.get('metros')?.setValidators([Validators.required]);
        this.performanceForm.get('metros')?.updateValueAndValidity();
        this.performanceForm.setErrors(null);
      }
      // Comprobamos si el sector está en sectoresPuntos
      else if (this.sectoresPuntos.includes(sectorSeleccionado.nombre_sector)) {
        this.mostrarCampoMetros = false;
        this.mostrarCampoTiempo = false;
        this.mostrarCampoPuntos = true;
        this.mostrarCampoComentario = true;
        this.performanceForm.get('puntos')?.setValidators([Validators.required]);
        this.performanceForm.get('puntos')?.updateValueAndValidity();
        this.performanceForm.setErrors(null);
      }
      // Para cualquier otro sector
      else {
        this.mostrarCampoMetros = false;
        this.mostrarCampoTiempo = true;
        this.mostrarCampoPuntos = false;
        this.mostrarCampoComentario = false;
        this.actualizarValidacionTiempo();
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
      nombre_atleta: atleta._id
    });
    this.performanceForm.get('nombre_atleta')?.updateValueAndValidity();
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
      this.http.post(`${environment.apiUrl}/marcas`, formData).subscribe(
        (response) => {
          console.log('Marca enviada con éxito', response);
          this.performanceForm.reset();
          this.resetAtleta();
          this.snackBar.open('Marca creada exitosamente', 'Cerrar', { duration: 3000 });
          this.router.navigate(['/ranking']);
        },
        (error) => {
          console.error('Error al enviar la marca', error);
          this.snackBar.open('Error al crear marca', 'Cerrar', { duration: 3000 });
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

  onSubmitAtleta(): void {
    if (this.atletaForm.valid) {
      const atletaData = {
        ...this.atletaForm.value,
        fecha_nacimiento: new Date(this.atletaForm.value.fecha_nacimiento)
      };

      this.http.post(`${environment.apiUrl}/atletas`, atletaData).subscribe(
        response => {
          this.snackBar.open('Atleta creado exitosamente', 'Cerrar', { duration: 3000 });
          this.atletaForm.reset();
        },
        error => {
          console.error('Error al crear atleta:', error);
          this.snackBar.open('Error al crear atleta', 'Cerrar', { duration: 3000 });
        }
      );
    }
  }

  onSubmitPrueba(): void {
    if (this.pruebaForm.valid) {
      this.http.post(`${environment.apiUrl}/pruebas`, this.pruebaForm.value).subscribe(
        response => {
          this.snackBar.open('Prueba creada exitosamente', 'Cerrar', { duration: 3000 });
          this.pruebaForm.reset();
          this.getSectores(); // Recargar sectores para actualizar las pruebas disponibles
        },
        error => {
          console.error('Error al crear prueba:', error);
          this.snackBar.open('Error al crear prueba', 'Cerrar', { duration: 3000 });
        }
      );
    }
  }

  onSubmitSector(): void {
    if (this.sectorForm.valid) {
      this.http.post(`${environment.apiUrl}/sectores`, this.sectorForm.value).subscribe(
        response => {
          this.snackBar.open('Sector creado exitosamente', 'Cerrar', { duration: 3000 });
          this.sectorForm.reset();
          this.getSectores(); // Recargar sectores
        },
        error => {
          console.error('Error al crear sector:', error);
          this.snackBar.open('Error al crear sector', 'Cerrar', { duration: 3000 });
        }
      );
    }
  }

  onSubmitCategoria(): void {
    if (this.categoriaForm.valid) {
      this.http.post(`${environment.apiUrl}/categorias`, this.categoriaForm.value).subscribe(
        response => {
          this.snackBar.open('Categoría creada exitosamente', 'Cerrar', { duration: 3000 });
          this.categoriaForm.reset();
          this.getCategorias(); // Recargar categorías
        },
        error => {
          console.error('Error al crear categoría:', error);
          this.snackBar.open('Error al crear categoría', 'Cerrar', { duration: 3000 });
        }
      );
    }
  }

  // Validador personalizado para asegurar que la fecha no sea en el futuro
  fechaNoFuturaValidator() {
    return (control: FormControl) => {
      const fechaSeleccionada = new Date(control.value);
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (fechaSeleccionada > hoy) {
        return { fechaFutura: true };
      }
      return null;
    };
  }
}

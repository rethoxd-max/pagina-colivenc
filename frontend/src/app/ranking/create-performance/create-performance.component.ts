import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
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
import { ImportarCsvComponent } from "./components/importar-csv/importar-csv.component";
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';
import { MatSnackBar } from '@angular/material/snack-bar';
import { Router } from '@angular/router';

// Declara la variable global google
declare var google: any;

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
    SearchAtletaComponent,
    ImportarCsvComponent
  ],
  templateUrl: './create-performance.component.html',
  styleUrls: ['./create-performance.component.css']
})
export class CreatePerformanceComponent implements OnInit {
  @ViewChild('lugarInput', { static: false }) lugarInputRef!: ElementRef;
  
  performanceForm!: FormGroup;
  atletaForm!: FormGroup;
  pruebaForm!: FormGroup;
  sectores: Sector[] = [];
  pruebas: Prueba[] = [];
  pruebasFiltradas: Prueba[] = [];
  sectorFiltro: string = '';
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
  pruebasViento: string[] = [
    'Longitud', 
    'Triple Salto', 
    '60ml', 
    '100ml', 
    '200ml',
    '100mv (0.762) sub16 FEM',
    '100mv (0.762) sub18 FEM',
    '100mv (0.91) sub16 MASC',
    '100mv FEM',
    '110mv (0.91) sub18 MASC',
    '110mv (0.99) sub20 MASC',
    '110mv MASC',
    '220mv sub14 FEM',
    '220mv sub14 MASC',
    '60mv (0.60) sub12 FEM',
    '60mv (0.60) sub12 MASC',
    '60mv (0.762) sub14 FEM',
    '60mv (0.762) sub16 FEM',
    '60mv (0.762) sub18 FEM',
    '60mv (0.84) sub14 MASC',
    '60mv (0.91) sub16 MASC',
    '60mv (0.91) sub18 MASC',
    '60mv (0.99) sub20 MASC',
    '60mv FEM',
    '60mv MASC',
    '80mv (0.762) sub14 FEM',
    '80mv (0.84) sub14 MASC',
    '80ml',
    '150ml'
  ];
  pruebasDecatlon: string[] = ['Decatlon'];

  categoriaSeleccionada: Categoria | null = null;
  sectorSeleccionado: Sector | null = null;
  pruebaSeleccionada: Prueba | null = null;

  mostrarCampoMetros: boolean = false;
  mostrarCampoTiempo: boolean = false;
  mostrarCampoPuntos: boolean = false;
  mostrarCampoViento: boolean = false;
  mostrarCampoComentario: boolean = false;

  nombreAtletaControl = new FormControl<string | Atleta>('');
  
  // Variable para Google Maps Places Autocomplete
  autocomplete: any;

  sectorForm: FormGroup;
  categoriaForm: FormGroup;

  constructor(
    private fb: FormBuilder,
    private http: HttpClient,
    private snackBar: MatSnackBar,
    private router: Router,
    private ngZone: NgZone
  ) {
    this.performanceForm = this.fb.group({
      nombre_atleta: ['', Validators.required],
      nombre_sector: ['', Validators.required],
      nombre_prueba: ['', Validators.required],
      metros: [null],
      horas: [null],
      minutos: [null],
      segundos: [null],
      puntos: [null],
      viento: [null],
      comentario: [''],
      categoria: ['', null],
      anyo: [this.currentYear, [Validators.required, Validators.min(1900)]],
      fecha_realizacion: [this.currentDate], 
      lugar: [''],
      PcAL: ['', Validators.required]
    }, { validator: this.tiempoValidator });

    // Añadir validación condicional para los campos de tiempo
    this.performanceForm.get('horas')?.valueChanges.subscribe(() => this.actualizarValidacionTiempo());
    this.performanceForm.get('minutos')?.valueChanges.subscribe(() => this.actualizarValidacionTiempo());
    this.performanceForm.get('segundos')?.valueChanges.subscribe(() => this.actualizarValidacionTiempo());

    this.atletaForm = this.fb.group({
      nombre: ['', Validators.required],
      fecha_nacimiento: ['', Validators.required],
      genero: ['', Validators.required]
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
    this.getAllPruebas();

    // Cuando cambia el sector, cargamos las pruebas del sector correspondiente
    this.performanceForm.get('nombre_sector')?.valueChanges.subscribe(sector => {
      this.sectorSeleccionado = sector;
      this.getPruebasPorSector(sector._id);
    });

    this.performanceForm.get('nombre_prueba')?.valueChanges.subscribe(value => {
      this.pruebaSeleccionada = value; // Actualiza la prueba seleccionada
    });

    // Añadir suscriptor para cambios en la fecha de realización
    this.performanceForm.get('fecha_realizacion')?.valueChanges.subscribe(() => {
      this.onFechaRealizacionChange();
    });
  }

  ngAfterViewInit(): void {
    // Esperar a que el ViewChild esté disponible antes de inicializar el autocomplete
    setTimeout(() => {
      this.inicializarAutocompletadoLugar();
    }, 500);
  }

  inicializarAutocompletadoLugar(): void {
    // Verificar que la API de Google Maps ha sido cargada
    if (typeof google === 'undefined' || typeof google.maps === 'undefined' || !this.lugarInputRef) {
      console.error('Google Maps API no está cargada o el elemento de referencia no está disponible');
      return;
    }

    try {
      // Crear objeto Autocomplete
      this.autocomplete = new google.maps.places.Autocomplete(this.lugarInputRef.nativeElement, {
        types: ['geocode'],
        // Puedes limitar por país si lo deseas
        // componentRestrictions: { country: 'es' }
      });

      // Añadir listener para cuando se selecciona un lugar
      this.autocomplete.addListener('place_changed', () => {
        this.ngZone.run(() => {
          const place = this.autocomplete.getPlace();
          
          if (place && place.address_components) {
            // Formatear la dirección sin código postal
            let formattedAddress = this.formatearDireccionSinCodigoPostal(place);
            
            // Actualizar el valor en el formulario
            this.performanceForm.patchValue({
              lugar: formattedAddress
            });
          } else if (place && place.formatted_address) {
            // Si no podemos procesar los componentes, usamos la dirección completa
            this.performanceForm.patchValue({
              lugar: place.formatted_address
            });
          }
        });
      });
    } catch (error) {
      console.error('Error al inicializar Google Places Autocomplete:', error);
    }
  }

  // Método para formatear la dirección sin incluir el código postal
  formatearDireccionSinCodigoPostal(place: any): string {
    // Componentes que queremos incluir en la dirección final
    let calle = '';
    let numero = '';
    let ciudad = '';
    let provincia = '';
    let pais = '';
    let paisShortName = '';
    
    // Extraer componentes relevantes
    for (const component of place.address_components) {
      const componentType = component.types[0];
      
      switch (componentType) {
        case 'street_number':
          numero = component.long_name;
          break;
        case 'route':
          calle = component.long_name;
          break;
        case 'locality':
          ciudad = component.long_name;
          break;
        case 'administrative_area_level_1':
          provincia = component.long_name;
          break;
        case 'country':
          pais = component.long_name;
          paisShortName = component.short_name;
          break;
      }
    }
    
    // Construir la dirección formateada
    let direccion = '';
    
    // Para lugares fuera de España, solo mostrar ciudad y país entre paréntesis
    if (paisShortName && paisShortName !== 'ES') {
      if (ciudad) {
        direccion = ciudad;
        direccion += ` (${pais})`;
      } else if (provincia) {
        // Si no hay ciudad pero sí provincia
        direccion = provincia;
        direccion += ` (${pais})`;
      } else {
        // Si solo tenemos el país
        direccion = pais;
      }
    } else {
      // Para lugares en España, mostrar calle, número, ciudad y provincia
      // Calle y número
      if (calle) {
        direccion += calle;
        if (numero) {
          direccion += ', ' + numero;
        }
      }
      
      // Ciudad
      if (ciudad) {
        if (direccion) direccion += ', ';
        direccion += ciudad;
      }
      
      // Provincia
      if (provincia) {
        if (direccion) direccion += ', ';
        direccion += provincia;
      }
    }
    
    return direccion;
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

  // Cargar todas las pruebas
  getAllPruebas() {
    this.http.get<Prueba[]>(`${environment.apiUrl}/pruebas`).subscribe(
      (pruebas) => {
        this.pruebas = pruebas;
      },
      (error) => {
        console.error('Error al cargar todas las pruebas:', error);
      }
    );
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

  // Filtrar pruebas según el sector seleccionado para la tabla
  cargarPruebasPorSector() {
    if (this.sectorFiltro) {
      this.http.get<Prueba[]>(`${environment.apiUrl}/pruebas/sector/${this.sectorFiltro}`).subscribe(
        (pruebas) => {
          this.pruebasFiltradas = pruebas;
        },
        (error) => {
          console.error('Error al cargar pruebas filtradas:', error);
          this.pruebasFiltradas = [];
        }
      );
    } else {
      this.pruebasFiltradas = [];
    }
  }

  // Obtener nombre del sector a partir de su ID para mostrar en la tabla
  getSectorNombre(sectorId: any): string {
    if (typeof sectorId === 'object' && sectorId && sectorId.nombre_sector) {
      return sectorId.nombre_sector;
    }
    
    const sector = this.sectores.find(s => s._id === sectorId);
    return sector ? sector.nombre_sector : 'Desconocido';
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
      // Para el sector Relevos
      else if (sectorSeleccionado.nombre_sector === 'Relevos') {
        this.mostrarCampoMetros = false;
        this.mostrarCampoTiempo = true;
        this.mostrarCampoPuntos = false;
        this.mostrarCampoComentario = true;
        this.actualizarValidacionTiempo();
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

  onAtletaSelected(atleta: Atleta): void {
    if (atleta) {
      // Actualizar el FormControl con el nombre del atleta
      this.nombreAtletaControl.setValue(atleta);
      
      // Actualizar el formulario con el ID del atleta
      this.performanceForm.patchValue({
        nombre_atleta: atleta._id
      });

      // Si hay una fecha de realización seleccionada, calcular la categoría
      const fechaRealizacion = this.performanceForm.get('fecha_realizacion')?.value;
      if (fechaRealizacion && atleta.fecha_nacimiento) {
        const categoriaId = this.calcularCategoria(atleta.fecha_nacimiento, fechaRealizacion);
        this.performanceForm.patchValue({
          categoria: categoriaId
        });
      }
    }
  }

  resetAtleta(): void {
    this.nombreAtletaControl.setValue(null); // Reiniciar el campo autocompletado
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

      console.log('Datos enviados:', formData);

      // Enviamos los datos al servicio
      this.http.post(`${environment.apiUrl}/marcas`, formData).subscribe(
        (response) => {
          console.log('Marca enviada con éxito', response);
          
          // Guardamos los valores que queremos mantener
          const anyo = this.performanceForm.get('anyo')?.value;
          const fecha_realizacion = this.performanceForm.get('fecha_realizacion')?.value;
          const lugar = this.performanceForm.get('lugar')?.value;
          const PcAL = this.performanceForm.get('PcAL')?.value;

          // Reseteamos el formulario
          this.performanceForm.reset();
          this.resetAtleta();

          // Restauramos los valores guardados
          this.performanceForm.patchValue({
            anyo: anyo,
            fecha_realizacion: fecha_realizacion,
            lugar: lugar,
            PcAL: PcAL
          });

          this.snackBar.open('Marca creada exitosamente', 'Cerrar', { duration: 3000 });
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
          // Recargar la lista de atletas
          this.getAtletas();
          // Actualizar el componente de búsqueda de atletas
          this.nombreAtletaControl.setValue('');
          // Forzar la actualización del componente de búsqueda
          this.nombreAtletaControl.updateValueAndValidity();
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
          // Recargar pruebas
          this.getAllPruebas();
          // Si hay un sector seleccionado en el filtro, recargar las pruebas filtradas
          if (this.sectorFiltro) {
            this.cargarPruebasPorSector();
          }
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
          // Recargar sectores
          this.getSectores();
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
          // Recargar categorías
          this.getCategorias();
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
      return null;
    };
  }

  // Validador personalizado para tiempo
  tiempoValidator(formGroup: FormGroup) {
    if (!formGroup) return null;
    
    // Verificar si el sector seleccionado requiere campos de tiempo
    const sectorId = formGroup.get('nombre_sector')?.value;
    if (!sectorId) return null; // Si no hay sector seleccionado, no validamos tiempo
    
    // Comprobamos si estamos mostrando el campo de tiempo
    // Solo validamos el tiempo si no hay metros o puntos seleccionados
    const tienePuntos = formGroup.get('puntos')?.value !== null && formGroup.get('puntos')?.value !== '';
    const tieneMetros = formGroup.get('metros')?.value !== null && formGroup.get('metros')?.value !== '';
    
    // Si tiene puntos o metros, no necesitamos validar el tiempo
    if (tienePuntos || tieneMetros) {
      return null;
    }
    
    // Solo validamos tiempo si ninguno de los otros campos está presente
    const horas = formGroup.get('horas')?.value;
    const minutos = formGroup.get('minutos')?.value;
    const segundos = formGroup.get('segundos')?.value;
    
    const tieneTiempo = (horas !== null && horas !== '') || 
                         (minutos !== null && minutos !== '') || 
                         (segundos !== null && segundos !== '');
    
    if (!tieneTiempo) {
      return { tiempoRequerido: true };
    }
    
    return null;
  }

  // Método para calcular la categoría basada en la edad
  calcularCategoria(fechaNacimiento: Date, fechaRealizacion: Date): string {
    const nacimiento = new Date(fechaNacimiento);
    const realizacion = new Date(fechaRealizacion);
    
    // Calculamos la edad que tendrá el atleta en el año de la temporada
    const añoTemporada = realizacion.getFullYear();
    const edadTemporada = añoTemporada - nacimiento.getFullYear();
    
    // Calculamos la edad exacta para la categoría veterano
    const edadExacta = this.calcularEdad(fechaNacimiento, fechaRealizacion);
    
    // Si el atleta es veterano (35 años o más en la fecha exacta), asignamos esa categoría
    if (edadExacta >= 35) return '681886e1ce29de7b04db6143'; // Veterano
    
    // Para el resto de categorías usamos la edad del año de la temporada
    if (edadTemporada < 12) return '68186acff6ad9b47b3ad289e'; // sub12
    if (edadTemporada < 14) return '68186ad4f6ad9b47b3ad28a1'; // sub14
    if (edadTemporada < 16) return '68186ad7f6ad9b47b3ad28a4'; // sub16
    if (edadTemporada < 18) return '68186adaf6ad9b47b3ad28a7'; // sub18
    if (edadTemporada < 20) return '68186addf6ad9b47b3ad28aa'; // sub20
    if (edadTemporada < 23) return '68186adff6ad9b47b3ad28ad'; // sub23
    return '67fe4650e4aaded6787b37fd'; // Absoluta
  }

  // Método para calcular la edad (ya no se usa para la categoría)
  calcularEdad(fechaNacimiento: Date, fechaRealizacion: Date): number {
    const nacimiento = new Date(fechaNacimiento);
    const realizacion = new Date(fechaRealizacion);
    
    let edad = realizacion.getFullYear() - nacimiento.getFullYear();
    const mesRealizacion = realizacion.getMonth();
    const mesNacimiento = nacimiento.getMonth();
    
    if (mesRealizacion < mesNacimiento || 
        (mesRealizacion === mesNacimiento && realizacion.getDate() < nacimiento.getDate())) {
      edad--;
    }
    
    return edad;
  }

  // Modificar el método para cuando cambia la fecha de realización
  onFechaRealizacionChange(): void {
    const fechaRealizacion = this.performanceForm.get('fecha_realizacion')?.value;
    const atletaId = this.performanceForm.get('nombre_atleta')?.value;
    
    if (fechaRealizacion && atletaId) {
      // Obtener el atleta seleccionado
      this.http.get<Atleta>(`${environment.apiUrl}/atletas/${atletaId}`).subscribe(atleta => {
        if (atleta && atleta.fecha_nacimiento) {
          const categoriaId = this.calcularCategoria(atleta.fecha_nacimiento, fechaRealizacion);
          this.performanceForm.patchValue({
            categoria: categoriaId
          });
        }
      });
    }
  }
}

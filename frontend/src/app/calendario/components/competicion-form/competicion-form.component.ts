import { Component, OnInit, NgZone, ElementRef, ViewChild } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, FormArray, ReactiveFormsModule, Validators } from '@angular/forms';
import { CompeticionService, PruebaCompeticion, SectorCompeticion, CategoriaCompeticion } from '../../services/competicion.service';
import { NgFor, NgIf } from '@angular/common';
import { environment } from '../../../../environments/environment';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatSelectModule } from '@angular/material/select';
import { MatSelectChange } from '@angular/material/select';
import { DisciplinaService, Disciplina } from '../../../services/disciplina.service';
/// <reference types="@types/googlemaps" />

declare var google: any;

@Component({
  selector: 'app-competicion-form',
  standalone: true,
  imports: [ReactiveFormsModule, NgIf, NgFor, MatAutocompleteModule, MatFormFieldModule, MatSelectModule],
  templateUrl: './competicion-form.component.html',
  styleUrls: ['./competicion-form.component.css'],
})
export class CompeticionFormComponent implements OnInit {
  @ViewChild('lugarInput', { static: false }) lugarInputRef!: ElementRef;
  
  competicionForm: FormGroup;
  competicionId: string | null = null;
  isEditMode = false;
  selectedFile: File | null = null;
  imageUrl: string | null = null;
  existingImage: string | null = null; // Variable para guardar el nombre de la imagen existente

  // Variables para categorías, sectores y pruebas
  categoriasDisponibles: CategoriaCompeticion[] = [];
  sectoresDisponibles: SectorCompeticion[] = [];
  pruebasDisponibles: PruebaCompeticion[] = [];
  pruebasSeleccionadas: PruebaCompeticion[] = [];
  categoriasSeleccionadas: string[] = [];
  disciplinas: Disciplina[] = [];

  // Variable para Google Maps Places Autocomplete
  autocomplete: any;

  baseUrl: string = environment.apiUrl;

  constructor(
    private competicionService: CompeticionService,
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private ngZone: NgZone,
    private disciplinaService: DisciplinaService
  ) {
    this.competicionForm = this.fb.group({
      nombre: ['', Validators.required],
      fecha: ['', Validators.required],
      lugar: ['', Validators.required],
      descripcion: [''],
      imagen: [''],
      tipo: [''],
      disciplina: [null],
      categorias: [[]], // Ahora permite múltiples categorías
      sector: [''],
      pruebas: [[]],
      enlaces: this.fb.array([]),
    });
  }

  volver(): void {
    this.router.navigate(['/competiciones']);
  }

  ngOnInit(): void {
    this.competicionId = this.route.snapshot.paramMap.get('id');
    this.categoriasSeleccionadas = [];
    this.disciplinaService.getDisciplinas().subscribe(d => { this.disciplinas = d; });
    // Cargar categorías y sectores al iniciar
    this.competicionService.getCategorias().subscribe(
      categorias => {
        this.categoriasDisponibles = categorias;
      }
    );

    this.competicionService.getSectores().subscribe(
      sectores => {
        console.log('Sectores disponibles:', sectores);
        this.sectoresDisponibles = sectores;
      }
    );

    // Si es modo edición, cargar la competición y sus pruebas seleccionadas
    if (this.competicionId) {
      this.isEditMode = true;
      this.competicionService.getCompeticionById(this.competicionId).subscribe(
        competicion => {
          console.log('Competición cargada:', competicion);
          this.competicionForm.patchValue({
            nombre: competicion.nombre,
            fecha: this.formatDate(competicion.fecha),
            lugar: competicion.lugar,
            descripcion: competicion.descripcion,
            tipo: competicion.tipo,
            disciplina: competicion.disciplina?._id || competicion.disciplina || null,
            categorias: competicion.categorias,
            pruebas: [],
            sector: ''
          });
          
          if (competicion.imageUrl) {
            // Extraer el nombre del archivo de la URL completa
            const urlParts = competicion.imageUrl.split('/');
            this.existingImage = urlParts[urlParts.length - 1]; // Obtener último segmento de la URL
            
            // Mostrar la imagen actual
            this.imageUrl = competicion.imageUrl;
            console.log('Imagen existente:', this.existingImage);
            console.log('URL de imagen:', this.imageUrl);
          }

          this.categoriasSeleccionadas = competicion.categorias;

          // Cargar enlaces existentes
          if (competicion.enlaces && competicion.enlaces.length > 0) {
            competicion.enlaces.forEach((enlace: any) => {
              this.enlaces.push(this.fb.group({
                nombre: [enlace.nombre, Validators.required],
                url: [enlace.url, Validators.required],
              }));
            });
          }

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
            this.competicionForm.patchValue({
              lugar: formattedAddress
            });
          } else if (place && place.formatted_address) {
            // Si no podemos procesar los componentes, usamos la dirección completa
            this.competicionForm.patchValue({
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

  formatDate(dateString: string): string {
    const date = new Date(dateString);
    const year = date.getFullYear();
    const month = (date.getMonth() + 1).toString().padStart(2, '0');
    const day = date.getDate().toString().padStart(2, '0');
    return `${year}-${month}-${day}`;
  }

  // Cargar pruebas según las categorías y el sector seleccionados
  cargarPruebas(sectorId: string, categorias: string[]): void {
    console.log('Cargando pruebas con:', { sectorId, categorias });
    if (categorias.length > 0 && sectorId) {
      this.competicionService.getPruebasPorCategoriaYSector(sectorId, categorias).subscribe(
        pruebas => {
          console.log('Pruebas encontradas:', pruebas);
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
  onSectorChange(event: MatSelectChange): void {
    const sectorId = event.value; // Obtener el valor directamente del evento
    const sectorSeleccionado = this.sectoresDisponibles.find(s => s._id === sectorId);
    console.log('Sector seleccionado:', sectorSeleccionado);
    
    const categoriasIds = this.competicionForm.get('categorias')?.value;
    console.log('Categorías seleccionadas:', categoriasIds);

    if (sectorId && categoriasIds && categoriasIds.length > 0) {
      this.cargarPruebas(sectorId, categoriasIds);
    } else {
      this.pruebasDisponibles = [];
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

  // Getters y helpers para el FormArray de enlaces
  get enlaces(): FormArray {
    return this.competicionForm.get('enlaces') as FormArray;
  }

  addEnlace(): void {
    if (this.enlaces.length < 5) {
      this.enlaces.push(this.fb.group({
        nombre: ['', Validators.required],
        url: ['', Validators.required],
      }));
    }
  }

  removeEnlace(index: number): void {
    this.enlaces.removeAt(index);
  }

  // Método para limpiar la selección de archivo y volver a mostrar la imagen existente
  clearFileSelection(): void {
    this.selectedFile = null;
    if (this.existingImage) {
      this.imageUrl = `${this.baseUrl}/uploads/competiciones/${this.existingImage}`;
    } else {
      this.imageUrl = null;
    }
    // Resetear el input de archivo
    const fileInput = document.getElementById('imagen') as HTMLInputElement;
    if (fileInput) {
      fileInput.value = '';
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

    const disciplinaId = this.competicionForm.get('disciplina')?.value;
    if (disciplinaId) formData.append('disciplina', disciplinaId);

    const categoriasIds = this.competicionForm.get('categorias')?.value;
    categoriasIds.forEach((id: string, index: number) => {
      formData.append(`categorias[${index}]`, id);
    });

    const pruebasIds = this.competicionForm.get('pruebas')?.value.map((prueba: PruebaCompeticion) => prueba._id);
    pruebasIds.forEach((id: string, index: number) => {
      formData.append(`pruebas[${index}]`, id);
    });

    if (this.selectedFile) {
      formData.append('image', this.selectedFile);
    } else if (this.isEditMode && this.existingImage) {
      // Si estamos en modo edición y hay una imagen existente pero no se ha seleccionado una nueva,
      // enviar el nombre de la imagen existente para mantenerla
      formData.append('existingImage', this.existingImage);
    }

    // Enviar enlaces como JSON
    const enlaces = this.enlaces.value;
    formData.append('enlaces', JSON.stringify(enlaces));

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

import { Component, OnInit, Inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, FormArray, FormControl, Validators, AbstractControl } from '@angular/forms';
import { MatDialogModule, MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { MatInputModule } from '@angular/material/input';
import { MatSelectModule } from '@angular/material/select';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatButtonToggleModule } from '@angular/material/button-toggle';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { EntrenamientosService, Entrenamiento } from '../../services/entrenamientos.service';
import { CompeticionService, Competicion } from '../../../competiciones/services/competicion.service';
import { Observable } from 'rxjs';
import { map, startWith } from 'rxjs/operators';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';

interface EntrenamientoForm {
  tipo: FormControl<string | null>;
  tecnica: FormArray<FormGroup>;
  pesas: FormArray<FormGroup>;
  serie: FormArray<FormGroup>;
  velocidad: FormArray<FormGroup>;
  vallas: FormArray<FormGroup>;
  multisaltos: FormArray<FormGroup>;
  multilanzamientos: FormArray<FormGroup>;
  rodaje: FormGroup;
  cuestas: FormArray<FormGroup>;
  lastre: FormArray<FormGroup>;
  extras: FormArray<FormGroup>;
  test: FormGroup;
  competicion?: FormGroup;
}

type EntrenamientoFormControls = {
  [K in keyof EntrenamientoForm]: EntrenamientoForm[K];
} & {
  [key: string]: AbstractControl<any, any>;
};

@Component({
  selector: 'app-crear-entrenamiento',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    ReactiveFormsModule,
    MatDialogModule,
    MatButtonModule,
    MatInputModule,
    MatSelectModule,
    MatIconModule,
    MatFormFieldModule,
    MatButtonToggleModule,
    MatAutocompleteModule,
    MatDatepickerModule,
    MatNativeDateModule
  ],
  templateUrl: './crear-entrenamiento.component.html',
  styleUrls: ['./crear-entrenamiento.component.css']
})
export class CrearEntrenamientoComponent implements OnInit {
  entrenamientoForm: FormGroup<EntrenamientoFormControls>;
  tiposEntrenamiento = [
    'Técnica', 'Pesas', 'Series', 'Velocidad', 'Vallas', 
    'Multisaltos', 'Multilanzamientos', 'Rodaje', 'Cuestas', 
    'Lastre', 'Extras', 'Test', 'Competición'
  ];

  tiposMultisaltos = ['Hierba', 'Foso', 'Vallas'];
  tiposMultilanzamientos = ['Hierba', 'Step', 'Pared', 'Bola'];

  competiciones: Competicion[] = [];
  filteredCompeticiones: Observable<Competicion[]>;
  competicionControl = new FormControl<string>('');
  competicionesFiltradas: Competicion[] = [];
  fechaDiaEntrenamiento: Date;

  constructor(
    private fb: FormBuilder,
    private dialogRef: MatDialogRef<CrearEntrenamientoComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { diaId: string, fecha: Date },
    private entrenamientoService: EntrenamientosService,
    private competicionService: CompeticionService
  ) {
    this.fechaDiaEntrenamiento = data.fecha;
    this.entrenamientoForm = this.fb.group<EntrenamientoFormControls>({
      tipo: this.fb.control('', Validators.required),
      tecnica: this.fb.array<FormGroup>([]),
      pesas: this.fb.array<FormGroup>([]),
      serie: this.fb.array<FormGroup>([]),
      velocidad: this.fb.array<FormGroup>([]),
      vallas: this.fb.array<FormGroup>([]),
      multisaltos: this.fb.array<FormGroup>([]),
      multilanzamientos: this.fb.array<FormGroup>([]),
      rodaje: this.fb.group({
        tiempo: [''],
        comentario: ['']
      }),
      cuestas: this.fb.array<FormGroup>([]),
      lastre: this.fb.array<FormGroup>([]),
      extras: this.fb.array<FormGroup>([]),
      test: this.fb.group({
        comentario: ['']
      }),
      competicion: this.fb.group({
        nombre: [''],
        fecha: [''],
        lugar: ['']
      })
    });

    this.filteredCompeticiones = this.competicionControl.valueChanges.pipe(
      startWith(''),
      map(value => this._filterCompeticiones(value))
    );
  }

  ngOnInit(): void {
    this.entrenamientoForm.get('tipo')?.valueChanges.subscribe(tipo => {
      if (tipo) {
        this.onTipoChange();
      }
    });
    this.loadCompeticiones();
  }

  resetFormArrays() {
    ['tecnica', 'pesas', 'serie', 'velocidad', 'vallas', 'multisaltos', 
     'multilanzamientos', 'cuestas', 'lastre', 'extras'].forEach(arrayName => {
      const array = this.entrenamientoForm.get(arrayName) as FormArray;
      while (array.length) {
        array.removeAt(0);
      }
    });
  }

  addDefaultField(tipo: string) {
    switch (tipo) {
      case 'Técnica':
        this.addTecnica();
        break;
      case 'Pesas':
        this.addPesas();
        break;
      case 'Series':
        this.addSerie();
        break;
      case 'Velocidad':
        this.addVelocidad();
        break;
      case 'Vallas':
        this.addVallas();
        break;
      case 'Multisaltos':
        this.addMultisaltos();
        break;
      case 'Multilanzamientos':
        this.addMultilanzamientos();
        break;
      case 'Rodaje':
        // No necesita agregar campos ya que es un FormGroup
        break;
      case 'Cuestas':
        this.addCuestas();
        break;
      case 'Lastre':
        this.addLastre();
        break;
      case 'Extras':
        this.addExtras();
        break;
    }
  }

  // Métodos para agregar campos a los arrays
  addTecnica() {
    const tecnicaArray = this.entrenamientoForm.get('tecnica') as FormArray;
    tecnicaArray.push(this.fb.group({
      tecnica: ['']
    }));
  }

  addPesas() {
    const pesasArray = this.entrenamientoForm.get('pesas') as FormArray;
    pesasArray.push(this.fb.group({
      series: [''],
      repeticiones: [''],
      porcentaje: [''],
      comentario: ['']
    }));
  }

  addSerie() {
    const serieArray = this.entrenamientoForm.get('serie') as FormArray;
    serieArray.push(this.fb.group({
      numeroSeries: [''],
      metros: [''],
      recuperacion: [''],
      tiempoObjetivo: [''],
      comentario: ['']
    }));
  }

  addVelocidad() {
    const velocidadArray = this.entrenamientoForm.get('velocidad') as FormArray;
    velocidadArray.push(this.fb.group({
      numeroSeries: [''],
      metros: [''],
      recuperacion: [''],
      porcentaje: [''],
      comentario: ['']
    }));
  }

  addVallas() {
    const vallasArray = this.entrenamientoForm.get('vallas') as FormArray;
    vallasArray.push(this.fb.group({
      numeroSeries: [''],
      numeroVallas: [''],
      recuperacion: [''],
      comentario: ['']
    }));
  }

  addMultisaltos() {
    const multisaltosArray = this.entrenamientoForm.get('multisaltos') as FormArray;
    multisaltosArray.push(this.fb.group({
      numeroSaltos: [''],
      tipo: [''],
      comentario: ['']
    }));
  }

  addMultilanzamientos() {
    const multilanzamientosArray = this.entrenamientoForm.get('multilanzamientos') as FormArray;
    multilanzamientosArray.push(this.fb.group({
      numeroLanzamientos: [''],
      tipo: [''],
      comentario: ['']
    }));
  }

  addCuestas() {
    const cuestasArray = this.entrenamientoForm.get('cuestas') as FormArray;
    cuestasArray.push(this.fb.group({
      numeroCuestas: [''],
      metros: [''],
      recuperacion: [''],
      comentario: ['']
    }));
  }

  addLastre() {
    const lastreArray = this.entrenamientoForm.get('lastre') as FormArray;
    lastreArray.push(this.fb.group({
      numeroSeries: [''],
      metros: [''],
      kilos: [''],
      recuperacion: [''],
      comentario: ['']
    }));
  }

  addExtras() {
    const extrasArray = this.entrenamientoForm.get('extras') as FormArray;
    extrasArray.push(this.fb.group({
      comentario: ['']
    }));
  }

  getFormArray(name: string): FormArray {
    return this.entrenamientoForm.get(name) as FormArray;
  }

  eliminarCampo(arrayName: string, index: number): void {
    const array = this.getFormArray(arrayName);
    array.removeAt(index);
  }

  agregarCampo(arrayName: string): void {
    switch (arrayName) {
      case 'tecnica':
        this.addTecnica();
        break;
      case 'pesas':
        this.addPesas();
        break;
      case 'serie':
        this.addSerie();
        break;
      case 'velocidad':
        this.addVelocidad();
        break;
      case 'vallas':
        this.addVallas();
        break;
      case 'multisaltos':
        this.addMultisaltos();
        break;
      case 'multilanzamientos':
        this.addMultilanzamientos();
        break;
      case 'cuestas':
        this.addCuestas();
        break;
      case 'lastre':
        this.addLastre();
        break;
      case 'extras':
        this.addExtras();
        break;
    }
  }

  onSubmit(): void {
    if (this.entrenamientoForm.valid) {
      const tipo = this.entrenamientoForm.get('tipo')?.value;
      if (!tipo || !this.tiposEntrenamiento.includes(tipo)) {
        console.error('Tipo de entrenamiento inválido');
        return;
      }

      const formValue = this.entrenamientoForm.value;
      const entrenamiento: Partial<Entrenamiento> = {
        dia_entrenamiento: this.data.diaId,
        tipo: tipo as Entrenamiento['tipo']
      };

      // Solo incluir los campos relevantes según el tipo de entrenamiento
      switch (tipo) {
        case 'Técnica':
          if (formValue.tecnica && formValue.tecnica.length > 0) {
            entrenamiento.tecnica = formValue.tecnica;
          }
          break;
        case 'Pesas':
          if (formValue.pesas && formValue.pesas.length > 0) {
            entrenamiento.pesas = formValue.pesas;
          }
          break;
        case 'Series':
          if (formValue.serie && formValue.serie.length > 0) {
            entrenamiento.serie = formValue.serie;
          }
          break;
        case 'Velocidad':
          if (formValue.velocidad && formValue.velocidad.length > 0) {
            entrenamiento.velocidad = formValue.velocidad;
          }
          break;
        case 'Vallas':
          if (formValue.vallas && formValue.vallas.length > 0) {
            entrenamiento.vallas = formValue.vallas;
          }
          break;
        case 'Multisaltos':
          if (formValue.multisaltos && formValue.multisaltos.length > 0) {
            entrenamiento.multisaltos = formValue.multisaltos;
          }
          break;
        case 'Multilanzamientos':
          if (formValue.multilanzamientos && formValue.multilanzamientos.length > 0) {
            entrenamiento.multilanzamientos = formValue.multilanzamientos;
          }
          break;
        case 'Rodaje':
          if (formValue.rodaje && (formValue.rodaje.tiempo || formValue.rodaje.comentario)) {
            entrenamiento.rodaje = formValue.rodaje;
          }
          break;
        case 'Cuestas':
          if (formValue.cuestas && formValue.cuestas.length > 0) {
            entrenamiento.cuestas = formValue.cuestas;
          }
          break;
        case 'Lastre':
          if (formValue.lastre && formValue.lastre.length > 0) {
            entrenamiento.lastre = formValue.lastre;
          }
          break;
        case 'Extras':
          if (formValue.extras && formValue.extras.length > 0) {
            entrenamiento.extras = formValue.extras;
          }
          break;
        case 'Test':
          if (formValue.test && formValue.test.comentario) {
            entrenamiento.test = formValue.test;
          }
          break;
        case 'Competición':
          if (formValue.competicion && formValue.competicion.nombre) {
            entrenamiento.competicion = formValue.competicion;
          }
          break;
      }
      
      this.entrenamientoService.createEntrenamiento(this.data.diaId, entrenamiento as Entrenamiento).subscribe({
        next: () => {
          this.dialogRef.close(true);
        },
        error: (error: Error) => {
          console.error('Error al crear el entrenamiento:', error);
        }
      });
    }
  }

  onCancel(): void {
    this.dialogRef.close();
  }

  private _filterCompeticiones(value: string | Competicion | null): Competicion[] {
    const filterValue = typeof value === 'string' ? value.toLowerCase() : '';
    return this.competicionesFiltradas.filter(competicion => 
      competicion.nombre.toLowerCase().includes(filterValue)
    );
  }

  loadCompeticiones() {
    this.competicionService.getCompeticionesByAtleta('ID_DEL_ATLETA').subscribe(
      (competiciones: Competicion[]) => {
        this.competiciones = competiciones;
        this.filtrarCompeticionesPorFecha();
      },
      (error: any) => {
        console.error('Error al cargar competiciones:', error);
      }
    );
  }

  filtrarCompeticionesPorFecha(): void {
    this.competicionesFiltradas = this.competiciones.filter(competicion => {
      const fechaCompeticion = new Date(competicion.fecha);
      return fechaCompeticion.toDateString() === this.fechaDiaEntrenamiento.toDateString();
    });
  }

  onTipoChange() {
    const tipo = this.entrenamientoForm.get('tipo')?.value;
    if (!tipo) return;
    
    this.resetFormArrays();

    if (tipo === 'Competición') {
      const competicionGroup = this.fb.group({
        nombre: [''],
        fecha: [''],
        lugar: ['']
      });
      (this.entrenamientoForm as FormGroup).setControl('competicion', competicionGroup);
    } else {
      (this.entrenamientoForm as FormGroup).removeControl('competicion');
      this.addDefaultField(tipo);
    }
  }

  selectCompeticion(competicion: Competicion) {
    this.entrenamientoForm.patchValue({
      competicion: {
        nombre: competicion.nombre,
        fecha: competicion.fecha,
        lugar: competicion.lugar
      }
    });
  }

  displayCompeticion(competicion: Competicion): string {
    return competicion ? `${competicion.nombre} - ${competicion.lugar}` : '';
  }
}

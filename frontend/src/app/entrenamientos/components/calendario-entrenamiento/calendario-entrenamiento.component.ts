import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DiaEntrenamiento, Entrenamiento as EntrenamientoService, EntrenamientosService } from '../../services/entrenamientos.service';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule } from '@angular/forms';
import { FormBuilder, FormGroup, FormArray, Validators } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { CrearEntrenamientoComponent } from '../crear-entrenamiento/crear-entrenamiento.component';
import { trigger, transition, style, animate } from '@angular/animations';
import { CompeticionService } from '../../../calendario/services/competicion.service';
import { AuthService } from '../../../auth/services/auth.service';
import { forkJoin, of } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

interface CalendarDay {
  date: Date;
  diaEntrenamiento?: any;
}

interface EntrenamientoFiltro {
    tipo: string;
    _id?: string;
    tecnica?: Array<{ tecnica: string }>;
    pesas?: Array<{ series: string; repeticiones: string; porcentaje: string }>;
    serie?: Array<{ numeroSeries: string; metros: string; recuperacion: string }>;
    velocidad?: Array<{ numeroSeries: string; metros: string; porcentaje: string }>;
    vallas?: Array<{ numeroSeries: string; numeroVallas: string }>;
    multisaltos?: Array<{ numeroSaltos: string; tipo: string }>;
    multilanzamientos?: Array<{ numeroLanzamientos: string; tipo: string }>;
    rodaje?: { tiempo: string };
    cuestas?: Array<{ numeroCuestas: string; metros: string }>;
    lastre?: Array<{ numeroSeries: string; metros: string; kilos: string }>;
    comentario?: string;
    competicion?: { nombre: string; lugar: string };
}

interface Resultado {
    atleta?: {
        _id: string;
        usuario: string;
        nombre: string;
        apellidos: string;
    };
    resultado: string;
    fecha: Date;
}

@Component({
  selector: 'app-calendario-entrenamiento',
  standalone: true,
  templateUrl: './calendario-entrenamiento.component.html',
  styleUrls: ['./calendario-entrenamiento.component.css'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, MatIconModule, MatDialogModule],
  animations: [
    trigger('modalAnimation', [
      transition(':enter', [
        style({ opacity: 0, transform: 'scale(0.95)' }),
        animate('200ms ease-out', style({ opacity: 1, transform: 'scale(1)' }))
      ]),
      transition(':leave', [
        animate('200ms ease-in', style({ opacity: 0, transform: 'scale(0.95)' }))
      ])
    ])
  ]
})
export class CalendarioEntrenamientoComponent implements OnInit, OnDestroy {
  currentMonth: number = new Date().getMonth();
  currentYear: number = new Date().getFullYear();
  daysInMonth: any[] = [];
  diasEntrenamiento: DiaEntrenamiento[] = [];
  private entrenamientosService = inject(EntrenamientosService);
  private openMenus: Set<string> = new Set();
  private clickListener: any;

  atletaId: string = '';
  calendarioId: string | null = null;
  selectedDay: any = null;
  popupPosition = { x: 0, y: 0 };
  showPopup: boolean = false;
  showTooltipFlag: boolean = false;
  currentTooltipTraining: any = null;
  tooltipPosition = { x: 0, y: 0 };
  showTrainingModal: boolean = false;
  currentTraining: any = null;
  showEditModal = false;
  isEditing = false;
  trainingForm: FormGroup;
  filtersForm!: FormGroup;
  filteredDays: any[] = [];
  competiciones: any[] = [];
  competicionesFiltradas: any[] = [];
  searchCompeticion: string = '';
  selectedCompeticion: any = null;
  isAdmin: boolean = false;
  isEntrenador: boolean = false;
  userId: string | null = null;
  grupoId: string | null = null;

  showResultadosModal = false;
  showAddResultadoModal = false;
  currentResultado = '';
  resultados: any[] = [];
  isAddingResultado = false;
  miResultado: any = null;

  // Añadir un mapa para almacenar los resultados por entrenamiento
  entrenamientoResultados: Map<string, string> = new Map();

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private dialog: MatDialog,
    private competicionService: CompeticionService,
    private authService: AuthService
  ) {
    this.trainingForm = this.fb.group({
      tipo: ['', Validators.required],
      tecnica: this.fb.array([]),
      pesas: this.fb.array([]),
      serie: this.fb.array([]),
      velocidad: this.fb.array([]),
      vallas: this.fb.array([]),
      multisaltos: this.fb.array([]),
      multilanzamientos: this.fb.array([]),
      rodaje: this.fb.group({
        tiempo: [''],
        comentario: ['']
      }),
      cuestas: this.fb.array([]),
      lastre: this.fb.array([]),
      extras: this.fb.array([]),
      test: this.fb.group({
        comentario: ['']
      }),
      competicion: this.fb.group({
        nombre: [''],
        fecha: [''],
        lugar: ['']
      })
    });
    this.initializeFiltersForm();
  }

  private initializeFiltersForm() {
    this.filtersForm = this.fb.group({
      tipo: [''],
      // Campos para Técnica
      tecnica: [''],
      // Campos para Pesas
      pesas_series: [''],
      pesas_repeticiones: [''],
      pesas_porcentaje: [''],
      // Campos para Series
      series_numeroSeries: [''],
      series_metros: [''],
      series_recuperacion: [''],
      // Campos para Velocidad
      velocidad_numeroSeries: [''],
      velocidad_metros: [''],
      velocidad_porcentaje: [''],
      // Campos para Vallas
      vallas_numeroSeries: [''],
      vallas_numeroVallas: [''],
      // Campos para Multisaltos
      multisaltos_numeroSaltos: [''],
      multisaltos_tipo: [''],
      // Campos para Multilanzamientos
      multilanzamientos_numeroLanzamientos: [''],
      multilanzamientos_tipo: [''],
      // Campos para Rodaje
      rodaje_tiempo: [''],
      // Campos para Cuestas
      cuestas_numeroCuestas: [''],
      cuestas_metros: [''],
      // Campos para Lastre
      lastre_numeroSeries: [''],
      lastre_metros: [''],
      lastre_kilos: [''],
      // Campos para Extras y Test
      comentario: [''],
      // Campos para Competición
      competicion_nombre: [''],
      competicion_lugar: ['']
    });
  }

  ngOnInit(): void {
    // Obtener información del usuario
    const user = this.authService.getUser();
    if (user) {
      this.userId = user.id;
      console.log('Usuario logueado:', {
        id: user.id,
        name: user.name,
        email: user.email
      });
    } else {
      console.error('No hay usuario logueado');
    }
    
    this.route.params.subscribe(params => {
      this.atletaId = params['atletaId'];
      this.grupoId = params['grupoId'];
      this.loadCalendar();
      this.checkUserPermissions();
    });

    // Agregar listener para cerrar el popup al hacer clic fuera
    this.clickListener = (event: MouseEvent) => {
      const target = event.target as HTMLElement;
      if (!target.closest('.trainings-popup') && !target.closest('.view-trainings-button')) {
        this.selectedDay = null;
        this.showPopup = false;
      }
    };
    document.addEventListener('click', this.clickListener);
  }

  ngOnDestroy(): void {
    if (this.clickListener) {
      document.removeEventListener('click', this.clickListener);
    }
  }

  getMonthName(month: number): string {
    const months = [
      'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
      'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
    ];
    return months[month];
  }

  getDayName(date: Date): string {
    return date.toLocaleString('es-ES', { weekday: 'long' });
  }

  loadCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const daysInMonth = lastDay.getDate();
    
    // Obtener el día de la semana en que comienza el mes (0 = Domingo, 1 = Lunes, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Ajustar para que el lunes sea el primer día (1) en lugar del domingo (0)
    const adjustedFirstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Crear array de días vacíos para el inicio del mes
    const emptyDays = Array(adjustedFirstDayOfWeek).fill(null);
    
    // Crear array de días del mes
    const days = Array.from({ length: daysInMonth }, (_, i) => {
      const date = new Date(this.currentYear, this.currentMonth, i + 1);
      return {
        date,
        diaEntrenamiento: null
      };
    });
    
    // Combinar días vacíos con días del mes
    this.daysInMonth = [...emptyDays, ...days];
    
    // Cargar los días de entrenamiento
    this.loadTrainingDays();
  }

  loadTrainingDays(): void {
    this.entrenamientosService.getCalendarioPorAtleta(this.atletaId)
      .subscribe({
        next: (response) => {
          if (response?.calendario?._id) {
            this.calendarioId = response.calendario._id;
            this.diasEntrenamiento = response.calendario.diasEntrenamiento || [];
            this.generateCalendar();
        } else {
            console.error("No se encontró el calendario");
          this.diasEntrenamiento = [];
        }
      },
        error: (error) => {
          console.error("Error al cargar el calendario:", error);
          this.diasEntrenamiento = [];
        }
        });
  }

  private generateCalendar(): void {
    const firstDay = new Date(this.currentYear, this.currentMonth, 1);
    const lastDay = new Date(this.currentYear, this.currentMonth + 1, 0);
    const currentMonthDays = lastDay.getDate();
    
    // Obtener el primer día del mes anterior
    const prevMonthLastDay = new Date(this.currentYear, this.currentMonth, 0);
    const prevMonthDays = prevMonthLastDay.getDate();
    
    // Calcular el primer día de la semana del mes actual (0 = domingo, 1 = lunes, etc.)
    const firstDayOfWeek = firstDay.getDay();
    
    // Calcular el último día de la semana del mes actual
    const lastDayOfWeek = lastDay.getDay();
    
    const days: (CalendarDay | null)[] = [];
    
    // Añadir días del mes anterior para completar la primera semana
    const daysFromPrevMonth = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = daysFromPrevMonth; i > 0; i--) {
      const day = new Date(this.currentYear, this.currentMonth - 1, prevMonthDays - i + 1);
      days.push({
        date: day,
        diaEntrenamiento: this.getDiaEntrenamiento(day)
      });
    }
    
    // Añadir días del mes actual
    for (let i = 1; i <= currentMonthDays; i++) {
      const day = new Date(this.currentYear, this.currentMonth, i);
      days.push({
        date: day,
        diaEntrenamiento: this.getDiaEntrenamiento(day)
      });
    }
    
    // Añadir días del mes siguiente para completar la última semana
    const daysFromNextMonth = 7 - (lastDayOfWeek === 0 ? 7 : lastDayOfWeek);
    for (let i = 1; i <= daysFromNextMonth; i++) {
      const day = new Date(this.currentYear, this.currentMonth + 1, i);
      days.push({
        date: day,
        diaEntrenamiento: this.getDiaEntrenamiento(day)
      });
    }
    
    this.daysInMonth = days;
  }

  getDiaEntrenamiento(date: Date): DiaEntrenamiento | undefined {
    const dia = this.diasEntrenamiento.find(d => 
      new Date(d.fecha).toDateString() === date.toDateString()
    );
    
    if (dia) {
      // Asegurarse de que los entrenamientos están definidos
      dia.entrenamientos = dia.entrenamientos || [];
      // Asegurarse de que cada entrenamiento tiene sus propiedades definidas
      dia.entrenamientos = dia.entrenamientos.map(entrenamiento => ({
        ...entrenamiento,
        competicion: entrenamiento.competicion || undefined
      }));
    }
    
    return dia;
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentYear--;
      this.currentMonth = 11;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar();
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentYear++;
      this.currentMonth = 0;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar();
  }

  eliminarEntrenamiento(diaId: string, entrenamientoId: string): void {
    this.entrenamientosService.deleteEntrenamiento(diaId, entrenamientoId)
      .subscribe({
        next: () => {
          // Actualizar la lista de días de entrenamiento
          const dia = this.diasEntrenamiento.find(d => d._id === diaId);
          if (dia) {
            dia.entrenamientos = dia.entrenamientos?.filter(e => e._id !== entrenamientoId);
            this.generateCalendar();
          }
        },
        error: (error: Error) => {
          console.error('Error al eliminar el entrenamiento:', error);
        }
      });
  }

  onClickAgregarOEditar(date: Date): void {
    if (!this.calendarioId) {
      console.error('No hay un calendario seleccionado');
      return;
    }

    this.entrenamientosService.getDiaEntrenamientoId(this.calendarioId, date)
      .subscribe({
        next: (dia) => {
          if (dia?._id) {
            this.openDialog(dia._id, date);
          } else {
            this.entrenamientosService.createDiaEntrenamiento(this.calendarioId!, date)
              .subscribe({
                next: (nuevoDia) => {
                  if (nuevoDia?._id) {
                    this.openDialog(nuevoDia._id, date);
                    this.diasEntrenamiento.push(nuevoDia);
                    this.generateCalendar();
      } else {
                    console.error('Error al crear el día de entrenamiento');
                  }
                },
                error: (error) => {
                  console.error('Error al crear el día de entrenamiento:', error);
                }
              });
          }
        },
        error: (error) => {
          console.error('Error al obtener/crear el día de entrenamiento:', error);
        }
      });
  }

  private openDialog(diaId: string, fecha: Date): void {
    const dialogRef = this.dialog.open(CrearEntrenamientoComponent, {
      width: '600px',
      data: { diaId, fecha }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        this.loadCalendar();
      }
    });
  }

  toggleMenu(date: Date) {
    if (!date) return; // Si no hay fecha, salir
    
    const day = this.daysInMonth.find(d => d && d.date && d.date.getTime() === date.getTime());
    if (day) {
      if (this.selectedDay === day) {
        this.selectedDay = null;
      } else {
        this.selectedDay = day;
        // Calcular la posición del popup
        const button = document.querySelector(`[data-date="${date.getTime()}"]`);
        if (button) {
          const rect = button.getBoundingClientRect();
          this.popupPosition = {
            x: rect.right + 10,
            y: rect.top
          };
        }
      }
    }
  }

  isMenuOpen(date: Date): boolean {
    return this.openMenus.has(date.toISOString());
  }

  editarEntrenamiento(entrenamientoId: string): void {
    this.router.navigate(['/editar-entrenamiento', entrenamientoId]);
  }

  // Cerrar el menú cuando se hace clic fuera de él
  onDocumentClick(event: MouseEvent): void {
    const target = event.target as HTMLElement;
    if (!target.closest('.trainings-menu')) {
      this.openMenus.clear();
    }
  }

  toggleTrainingsPopup(day: any, event?: MouseEvent): void {
    // Prevenir la propagación del evento si se proporciona
    if (event) {
      event.stopPropagation();
    }

    if (this.selectedDay && this.selectedDay.date.getTime() === day.date.getTime()) {
      this.selectedDay = null;
      this.showPopup = false;
      return;
    }

    this.selectedDay = day;
    this.showPopup = true;

    // Usar setTimeout para asegurar que el DOM se haya actualizado
    setTimeout(() => {
      const button = document.querySelector(`[data-date="${day.date.getTime()}"]`);
      if (button) {
        const rect = button.getBoundingClientRect();
        const windowWidth = window.innerWidth;
        const popupWidth = 400;
        
        let x = rect.right + 10;
        if (x + popupWidth > windowWidth) {
          x = rect.left - popupWidth - 10;
        }
        
        this.popupPosition = {
          x: x,
          y: rect.top
        };
      }
    });
  }

  hasCompetition(day: any): boolean {
    if (!day?.diaEntrenamiento?.entrenamientos) return false;
    return day.diaEntrenamiento.entrenamientos.some((e: any) => 
        e.tipo === 'Competición' && e.competicion && e.competicion.nombre
    );
  }

  getTrainingIcon(tipo: string): string {
    switch (tipo) {
        case 'Técnica':
            return 'sports_martial_arts';
        case 'Pesas':
            return 'fitness_center';
        case 'Series':
            return 'speed';
        case 'Velocidad':
            return 'bolt';
        case 'Vallas':
            return 'sports_hurdle';
        case 'Multilanzamientos':
            return 'sports_handball';
        case 'Multisaltos':
            return 'sports_gymnastics';
        case 'Rodaje':
            return 'directions_run';
        case 'Cuestas':
            return 'trending_up';
        case 'Lastre':
            return 'drag_indicator';
        case 'Extras':
            return 'error_outline';
        case 'Test':
            return 'analytics';
        case 'Competición':
            return 'emoji_events';
        default:
            return 'sports';
    }
  }

  openTrainingDetails(entrenamiento: any): void {
    this.currentTraining = entrenamiento;
    this.showTrainingModal = true;
    this.loadResultados();
  }

  closeTrainingDetails() {
    this.showTrainingModal = false;
    this.currentTraining = null;
    this.showPopup = false;
    this.selectedDay = null;
  }

  editTraining(training: any) {
    if (!training) {
      console.error('No se proporcionó un entrenamiento para editar');
      return;
    }

    this.isEditing = true;
    // Mantener el ID y la información del entrenamiento
    this.currentTraining = { ...training };
    
    // Limpiar el formulario antes de llenarlo
    this.trainingForm.reset();
    
    // Establecer el tipo de entrenamiento
    this.trainingForm.patchValue({
      tipo: training.tipo || ''
    });

    // Llenar el formulario con los datos del entrenamiento según el tipo
    if (training.tipo === 'Técnica' && training.tecnica) {
      // Limpiar el array de técnicas
      while (this.tecnicaArray.length !== 0) {
        this.tecnicaArray.removeAt(0);
      }
      // Añadir las técnicas
      training.tecnica.forEach((t: any) => {
        this.tecnicaArray.push(this.fb.group({
          tecnica: [t.tecnica || '']
        }));
      });
    }

    if (training.tipo === 'Pesas' && training.pesas) {
      while (this.pesasArray.length !== 0) {
        this.pesasArray.removeAt(0);
      }
      training.pesas.forEach((p: any) => {
        this.pesasArray.push(this.fb.group({
          series: [p.series || ''],
          repeticiones: [p.repeticiones || ''],
          porcentaje: [p.porcentaje || ''],
          comentario: [p.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Series' && training.serie) {
      while (this.serieArray.length !== 0) {
        this.serieArray.removeAt(0);
      }
      training.serie.forEach((s: any) => {
        this.serieArray.push(this.fb.group({
          numeroSeries: [s.numeroSeries || ''],
          metros: [s.metros || ''],
          recuperacion: [s.recuperacion || ''],
          tiempoObjetivo: [s.tiempoObjetivo || ''],
          comentario: [s.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Velocidad' && training.velocidad) {
      while (this.velocidadArray.length !== 0) {
        this.velocidadArray.removeAt(0);
      }
      training.velocidad.forEach((v: any) => {
        this.velocidadArray.push(this.fb.group({
          numeroSeries: [v.numeroSeries || ''],
          metros: [v.metros || ''],
          recuperacion: [v.recuperacion || ''],
          porcentaje: [v.porcentaje || ''],
          comentario: [v.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Vallas' && training.vallas) {
      while (this.vallasArray.length !== 0) {
        this.vallasArray.removeAt(0);
      }
      training.vallas.forEach((v: any) => {
        this.vallasArray.push(this.fb.group({
          numeroSeries: [v.numeroSeries || ''],
          numeroVallas: [v.numeroVallas || ''],
          recuperacion: [v.recuperacion || ''],
          comentario: [v.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Multisaltos' && training.multisaltos) {
      while (this.multisaltosArray.length !== 0) {
        this.multisaltosArray.removeAt(0);
      }
      training.multisaltos.forEach((m: any) => {
        this.multisaltosArray.push(this.fb.group({
          numeroSaltos: [m.numeroSaltos || ''],
          tipo: [m.tipo || ''],
          comentario: [m.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Multilanzamientos' && training.multilanzamientos) {
      while (this.multilanzamientosArray.length !== 0) {
        this.multilanzamientosArray.removeAt(0);
      }
      training.multilanzamientos.forEach((m: any) => {
        this.multilanzamientosArray.push(this.fb.group({
          numeroLanzamientos: [m.numeroLanzamientos || ''],
          tipo: [m.tipo || ''],
          comentario: [m.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Rodaje' && training.rodaje) {
      this.trainingForm.patchValue({
        rodaje: {
          tiempo: training.rodaje.tiempo || '',
          comentario: training.rodaje.comentario || ''
        }
      });
    }

    if (training.tipo === 'Cuestas' && training.cuestas) {
      while (this.cuestasArray.length !== 0) {
        this.cuestasArray.removeAt(0);
      }
      training.cuestas.forEach((c: any) => {
        this.cuestasArray.push(this.fb.group({
          numeroCuestas: [c.numeroCuestas || ''],
          metros: [c.metros || ''],
          recuperacion: [c.recuperacion || ''],
          comentario: [c.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Lastre' && training.lastre) {
      while (this.lastreArray.length !== 0) {
        this.lastreArray.removeAt(0);
      }
      training.lastre.forEach((l: any) => {
        this.lastreArray.push(this.fb.group({
          numeroSeries: [l.numeroSeries || ''],
          metros: [l.metros || ''],
          kilos: [l.kilos || ''],
          recuperacion: [l.recuperacion || ''],
          comentario: [l.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Extras' && training.extras) {
      while (this.extrasArray.length !== 0) {
        this.extrasArray.removeAt(0);
      }
      training.extras.forEach((e: any) => {
        this.extrasArray.push(this.fb.group({
          comentario: [e.comentario || '']
        }));
      });
    }

    if (training.tipo === 'Test' && training.test) {
      this.trainingForm.patchValue({
        test: {
          comentario: training.test.comentario || ''
        }
      });
    }

    if (training.tipo === 'Competición' && training.competicion) {
      this.trainingForm.patchValue({
        competicion: {
          nombre: training.competicion.nombre || '',
          fecha: training.competicion.fecha || '',
          lugar: training.competicion.lugar || ''
        }
      });
    }

    this.showEditModal = true;
    // Mantener la ventana de detalles abierta
    this.showTrainingModal = true;
  }

  deleteTraining(training: any) {
    if (!training) {
      console.error('No se proporcionó un entrenamiento para eliminar');
      return;
    }

    if (!training.dia_entrenamiento || !training._id) {
      console.error('El entrenamiento no tiene los datos necesarios para ser eliminado');
      return;
    }

    if (confirm('¿Estás seguro de que quieres eliminar este entrenamiento?')) {
      this.entrenamientosService.deleteEntrenamiento(training.dia_entrenamiento, training._id).subscribe({
        next: () => {
          // Actualizar la vista
          this.loadTrainingDays();
          this.closeTrainingDetails();
        },
        error: (error) => {
          console.error('Error al eliminar el entrenamiento:', error);
          alert('Error al eliminar el entrenamiento. Por favor, inténtalo de nuevo.');
        }
      });
    }
  }

  closeEditModal() {
    this.showEditModal = false;
    this.isEditing = false;
    // No reiniciamos currentTraining para mantener la información
    this.trainingForm.reset();
    // Limpiar los arrays
    while (this.tecnicaArray.length !== 0) {
      this.tecnicaArray.removeAt(0);
    }
    while (this.pesasArray.length !== 0) {
      this.pesasArray.removeAt(0);
    }
    while (this.serieArray.length !== 0) {
      this.serieArray.removeAt(0);
    }
    while (this.velocidadArray.length !== 0) {
      this.velocidadArray.removeAt(0);
    }
    while (this.vallasArray.length !== 0) {
      this.vallasArray.removeAt(0);
    }
    while (this.multisaltosArray.length !== 0) {
      this.multisaltosArray.removeAt(0);
    }
    while (this.multilanzamientosArray.length !== 0) {
      this.multilanzamientosArray.removeAt(0);
    }
    while (this.cuestasArray.length !== 0) {
      this.cuestasArray.removeAt(0);
    }
    while (this.lastreArray.length !== 0) {
      this.lastreArray.removeAt(0);
    }
    while (this.extrasArray.length !== 0) {
      this.extrasArray.removeAt(0);
    }
    // Mantener la ventana de detalles abierta
    this.showTrainingModal = true;
  }

  onSubmit() {
    if (this.trainingForm.valid) {
      const formData = this.trainingForm.value;
      
      if (this.isEditing) {
        // Actualizar entrenamiento existente
        const entrenamientoData = {
          ...formData,
          dia_entrenamiento: this.currentTraining.dia_entrenamiento
        };
        
        this.entrenamientosService.updateEntrenamiento(
          this.currentTraining._id,
          entrenamientoData
        ).subscribe({
          next: (updatedTraining) => {
            // Actualizar currentTraining con los nuevos datos
            this.currentTraining = {
              ...this.currentTraining,
              ...updatedTraining,
              tipo: formData.tipo,
              tecnica: formData.tecnica,
              pesas: formData.pesas,
              serie: formData.serie,
              velocidad: formData.velocidad,
              vallas: formData.vallas,
              multisaltos: formData.multisaltos,
              multilanzamientos: formData.multilanzamientos,
              rodaje: formData.rodaje,
              cuestas: formData.cuestas,
              lastre: formData.lastre,
              extras: formData.extras,
              test: formData.test,
              competicion: formData.competicion
            };
            
            this.closeEditModal();
            this.loadTrainingDays();
          },
          error: (error) => {
            console.error('Error al actualizar el entrenamiento:', error);
            alert('Error al actualizar el entrenamiento. Por favor, inténtalo de nuevo.');
          }
        });
      } else {
        // Crear nuevo entrenamiento
        const diaId = this.selectedDay?.diaEntrenamiento?._id;
        if (diaId) {
          const entrenamientoData = {
            ...formData,
            dia_entrenamiento: diaId
          };
          
          this.entrenamientosService.createEntrenamiento(diaId, entrenamientoData).subscribe({
            next: (newTraining) => {
              this.closeEditModal();
              this.loadTrainingDays();
            },
            error: (error) => {
              console.error('Error al crear el entrenamiento:', error);
              alert('Error al crear el entrenamiento. Por favor, inténtalo de nuevo.');
            }
          });
        } else {
          console.error('No se encontró el ID del día de entrenamiento');
          alert('No se pudo encontrar el día de entrenamiento. Por favor, inténtalo de nuevo.');
        }
      }
    }
  }

  onTrainingTypeChange(event: any) {
    const tipo = event.target.value;
    // Limpiar los arrays y grupos según el tipo seleccionado
    if (tipo === 'Competición') {
      this.loadCompeticiones();
    }
  }

  get tecnicaArray() {
    return this.trainingForm.get('tecnica') as FormArray;
  }

  get pesasArray() {
    return this.trainingForm.get('pesas') as FormArray;
  }

  get serieArray() {
    return this.trainingForm.get('serie') as FormArray;
  }

  get velocidadArray() {
    return this.trainingForm.get('velocidad') as FormArray;
  }

  get vallasArray() {
    return this.trainingForm.get('vallas') as FormArray;
  }

  get multisaltosArray() {
    return this.trainingForm.get('multisaltos') as FormArray;
  }

  get multilanzamientosArray() {
    return this.trainingForm.get('multilanzamientos') as FormArray;
  }

  get cuestasArray() {
    return this.trainingForm.get('cuestas') as FormArray;
  }

  get lastreArray() {
    return this.trainingForm.get('lastre') as FormArray;
  }

  get extrasArray() {
    return this.trainingForm.get('extras') as FormArray;
  }

  getTrainingClass(tipo: string): string {
    switch (tipo) {
        case 'Técnica':
            return 'tecnica';
        case 'Competición':
            return 'competicion';
        case 'Pesas':
            return 'pesas';
        case 'Series':
            return 'series';
        case 'Velocidad':
            return 'velocidad';
        case 'Vallas':
            return 'vallas';
        case 'Multilanzamientos':
            return 'multilanzamientos';
        case 'Multisaltos':
            return 'multisaltos';
        case 'Rodaje':
            return 'rodaje';
        case 'Cuestas':
            return 'cuestas';
        case 'Lastre':
            return 'lastre';
        case 'Extras':
            return 'extras';
        case 'Test':
            return 'test';
        default:
            return '';
    }
  }

  // Métodos para Técnica
  addTecnica() {
    this.tecnicaArray.push(this.fb.group({
      tecnica: ['']
    }));
  }

  removeTecnica(index: number) {
    this.tecnicaArray.removeAt(index);
  }

  // Métodos para Pesas
  addPesas() {
    this.pesasArray.push(this.fb.group({
      series: [''],
      repeticiones: [''],
      porcentaje: [''],
      comentario: ['']
    }));
  }

  removePesas(index: number) {
    this.pesasArray.removeAt(index);
  }

  // Métodos para Series
  addSerie() {
    this.serieArray.push(this.fb.group({
      numeroSeries: [''],
      metros: [''],
      recuperacion: [''],
      tiempoObjetivo: [''],
      comentario: ['']
    }));
  }

  removeSerie(index: number) {
    this.serieArray.removeAt(index);
  }

  // Métodos para Velocidad
  addVelocidad() {
    this.velocidadArray.push(this.fb.group({
      numeroSeries: [''],
      metros: [''],
      recuperacion: [''],
      porcentaje: [''],
      comentario: ['']
    }));
  }

  removeVelocidad(index: number) {
    this.velocidadArray.removeAt(index);
  }

  // Métodos para Vallas
  addVallas() {
    this.vallasArray.push(this.fb.group({
      numeroSeries: [''],
      numeroVallas: [''],
      recuperacion: [''],
      comentario: ['']
    }));
  }

  removeVallas(index: number) {
    this.vallasArray.removeAt(index);
  }

  // Métodos para Multisaltos
  addMultisaltos() {
    this.multisaltosArray.push(this.fb.group({
      numeroSaltos: [''],
      tipo: [''],
      comentario: ['']
    }));
  }

  removeMultisaltos(index: number) {
    this.multisaltosArray.removeAt(index);
  }

  // Métodos para Multilanzamientos
  addMultilanzamientos() {
    this.multilanzamientosArray.push(this.fb.group({
      numeroLanzamientos: [''],
      tipo: [''],
      comentario: ['']
    }));
  }

  removeMultilanzamientos(index: number) {
    this.multilanzamientosArray.removeAt(index);
  }

  // Métodos para Cuestas
  addCuestas() {
    this.cuestasArray.push(this.fb.group({
      numeroCuestas: [''],
      metros: [''],
      recuperacion: [''],
      comentario: ['']
    }));
  }

  removeCuestas(index: number) {
    this.cuestasArray.removeAt(index);
  }

  // Métodos para Lastre
  addLastre() {
    this.lastreArray.push(this.fb.group({
      numeroSeries: [''],
      metros: [''],
      kilos: [''],
      recuperacion: [''],
      comentario: ['']
    }));
  }

  removeLastre(index: number) {
    this.lastreArray.removeAt(index);
  }

  // Métodos para Extras
  addExtras() {
    this.extrasArray.push(this.fb.group({
      comentario: ['']
    }));
  }

  removeExtras(index: number) {
    this.extrasArray.removeAt(index);
  }

  applyFilters() {
    const filters = this.filtersForm.value;
    console.log('Aplicando filtros:', filters);
    
    this.filteredDays = this.daysInMonth.filter(day => {
      if (!day || !day.diaEntrenamiento?.entrenamientos) return false;

      console.log(`Día ${day.date.toLocaleDateString()}, entrenamientos:`, day.diaEntrenamiento.entrenamientos);
      
      const matchingEntrenamientos = day.diaEntrenamiento.entrenamientos.filter((entrenamiento: EntrenamientoFiltro) => {
        if (filters.tipo && entrenamiento.tipo !== filters.tipo) return false;

        // Verificamos si el entrenamiento cumple con los filtros
        const matchesFilters = this.matchesEntrenamientoFilters(entrenamiento, filters);

        // Si el entrenamiento cumple con los filtros, obtenemos su resultado
        if (matchesFilters && entrenamiento._id) {
          console.log('Entrenamiento coincide con filtros:', entrenamiento);
          this.loadEntrenamientoResultado(entrenamiento._id);
        }

        return matchesFilters;
      });
      
      console.log(`Día ${day.date.toLocaleDateString()}, entrenamientos que coinciden:`, matchingEntrenamientos.length);
      
      return matchingEntrenamientos.length > 0;
    });
    
    console.log('Días filtrados:', this.filteredDays.length);
  }

  // Método auxiliar para evaluar si un entrenamiento cumple con los filtros
  private matchesEntrenamientoFilters(entrenamiento: EntrenamientoFiltro, filters: any): boolean {
    switch (entrenamiento.tipo) {
      case 'Técnica':
        return !filters.tecnica || 
               (entrenamiento.tecnica?.some(t => t.tecnica.toLowerCase().includes(filters.tecnica.toLowerCase())) ?? false);
      
      case 'Pesas':
        return (!filters.pesas_series || (entrenamiento.pesas?.some(p => p.series.toString().includes(filters.pesas_series)) ?? false)) &&
               (!filters.pesas_repeticiones || (entrenamiento.pesas?.some(p => p.repeticiones.toString().includes(filters.pesas_repeticiones)) ?? false)) &&
               (!filters.pesas_porcentaje || (entrenamiento.pesas?.some(p => p.porcentaje.toString().includes(filters.pesas_porcentaje)) ?? false));
      
      case 'Series':
        return (!filters.series_numeroSeries || (entrenamiento.serie?.some(s => s.numeroSeries.toString().includes(filters.series_numeroSeries)) ?? false)) &&
               (!filters.series_metros || (entrenamiento.serie?.some(s => s.metros.toString().includes(filters.series_metros)) ?? false)) &&
               (!filters.series_recuperacion || (entrenamiento.serie?.some(s => s.recuperacion.toLowerCase().includes(filters.series_recuperacion.toLowerCase())) ?? false));
      
      case 'Velocidad':
        return (!filters.velocidad_numeroSeries || (entrenamiento.velocidad?.some(v => v.numeroSeries.toString().includes(filters.velocidad_numeroSeries)) ?? false)) &&
               (!filters.velocidad_metros || (entrenamiento.velocidad?.some(v => v.metros.toString().includes(filters.velocidad_metros)) ?? false)) &&
               (!filters.velocidad_porcentaje || (entrenamiento.velocidad?.some(v => v.porcentaje.toString().includes(filters.velocidad_porcentaje)) ?? false));
      
      case 'Vallas':
        return (!filters.vallas_numeroSeries || (entrenamiento.vallas?.some(v => v.numeroSeries.toString().includes(filters.vallas_numeroSeries)) ?? false)) &&
               (!filters.vallas_numeroVallas || (entrenamiento.vallas?.some(v => v.numeroVallas.toString().includes(filters.vallas_numeroVallas)) ?? false));
      
      case 'Multisaltos':
        return (!filters.multisaltos_numeroSaltos || (entrenamiento.multisaltos?.some(m => m.numeroSaltos.toString().includes(filters.multisaltos_numeroSaltos)) ?? false)) &&
               (!filters.multisaltos_tipo || (entrenamiento.multisaltos?.some(m => m.tipo.toLowerCase().includes(filters.multisaltos_tipo.toLowerCase())) ?? false));
      
      case 'Multilanzamientos':
        return (!filters.multilanzamientos_numeroLanzamientos || (entrenamiento.multilanzamientos?.some(m => m.numeroLanzamientos.toString().includes(filters.multilanzamientos_numeroLanzamientos)) ?? false)) &&
               (!filters.multilanzamientos_tipo || (entrenamiento.multilanzamientos?.some(m => m.tipo.toLowerCase().includes(filters.multilanzamientos_tipo.toLowerCase())) ?? false));
      
      case 'Rodaje':
        return !filters.rodaje_tiempo || (entrenamiento.rodaje?.tiempo.toLowerCase().includes(filters.rodaje_tiempo.toLowerCase()) ?? false);
      
      case 'Cuestas':
        return (!filters.cuestas_numeroCuestas || (entrenamiento.cuestas?.some(c => c.numeroCuestas.toString().includes(filters.cuestas_numeroCuestas)) ?? false)) &&
               (!filters.cuestas_metros || (entrenamiento.cuestas?.some(c => c.metros.toString().includes(filters.cuestas_metros)) ?? false));
      
      case 'Lastre':
        return (!filters.lastre_numeroSeries || (entrenamiento.lastre?.some(l => l.numeroSeries.toString().includes(filters.lastre_numeroSeries)) ?? false)) &&
               (!filters.lastre_metros || (entrenamiento.lastre?.some(l => l.metros.toString().includes(filters.lastre_metros)) ?? false)) &&
               (!filters.lastre_kilos || (entrenamiento.lastre?.some(l => l.kilos.toString().includes(filters.lastre_kilos)) ?? false));
      
      case 'Extras':
      case 'Test':
        return !filters.comentario || (entrenamiento.comentario?.toLowerCase().includes(filters.comentario.toLowerCase()) ?? false);
      
      case 'Competición':
        return (!filters.competicion_nombre || (entrenamiento.competicion?.nombre.toLowerCase().includes(filters.competicion_nombre.toLowerCase()) ?? false)) &&
               (!filters.competicion_lugar || (entrenamiento.competicion?.lugar.toLowerCase().includes(filters.competicion_lugar.toLowerCase()) ?? false));
      
      default:
        return true;
    }
  }

  // Método para cargar el resultado del atleta logeado para un entrenamiento específico
  loadEntrenamientoResultado(entrenamientoId: string) {
    if (!entrenamientoId) {
      console.error('loadEntrenamientoResultado: No se proporcionó ID de entrenamiento');
      return;
    }
    
    if (this.entrenamientoResultados.has(entrenamientoId)) {
      // Ya tenemos el resultado, no es necesario cargarlo nuevamente
      return;
    }

    console.log(`Cargando resultado para entrenamiento: ${entrenamientoId}`);
    
    // Obtener información del usuario actual
    const user = this.authService.getUser();
    if (!user) {
      console.error('loadEntrenamientoResultado: No hay usuario logueado');
      return;
    }
    
    console.log('Usuario actual:', {
      id: user.id,
      name: user.name,
      email: user.email
    });
    
    this.entrenamientosService.getResultados(entrenamientoId)
      .subscribe({
        next: (resultados: Resultado[]) => {
          console.log(`Resultados recibidos para entrenamiento ${entrenamientoId}:`, resultados);
          
          // Buscar mi resultado por usuario o nombre
          const miResultado = resultados.find(r => {
            const matchByUserId = r.atleta?.usuario === user.id;
            const matchByName = r.atleta?.nombre?.toLowerCase() === user.name?.toLowerCase();
            
            console.log(`Comparando resultado:`, {
              resultadoAtleta: r.atleta,
              matchByUserId,
              matchByName
            });
            
            return matchByUserId || matchByName;
          });
          
          console.log('Mi resultado encontrado:', miResultado);
          
          if (miResultado) {
            this.entrenamientoResultados.set(entrenamientoId, miResultado.resultado);
            console.log(`Resultado guardado para entrenamiento ${entrenamientoId}:`, miResultado.resultado);
          } else {
            // Incluso si no hay resultado, guardamos una entrada vacía para evitar múltiples consultas
            this.entrenamientoResultados.set(entrenamientoId, '');
          }
        },
        error: (err) => {
          console.error('Error al cargar resultado:', err);
          // En caso de error, guardamos una entrada vacía para evitar múltiples consultas
          this.entrenamientoResultados.set(entrenamientoId, '');
        }
      });
  }

  // Método para obtener el resultado de un entrenamiento específico
  getEntrenamientoResultado(entrenamientoId: string): string {
    const resultado = this.entrenamientoResultados.get(entrenamientoId);
    console.log(`Obteniendo resultado para ${entrenamientoId}:`, resultado);
    return resultado || '';
  }

  clearFilters() {
    this.filtersForm.reset();
    this.filteredDays = [];
    this.entrenamientoResultados.clear();
  }

  onFilterTypeChange(event: any) {
    const tipo = event.target.value;
    // Limpiar todos los campos excepto el tipo
    Object.keys(this.filtersForm.controls).forEach(key => {
      if (key !== 'tipo') {
        this.filtersForm.get(key)?.setValue('');
      }
    });
  }

  loadCompeticiones() {
    this.competicionService.getCompeticiones().subscribe({
      next: (competiciones) => {
        this.competiciones = competiciones;
        this.filterCompeticiones();
      },
      error: (error) => {
        console.error('Error al cargar las competiciones:', error);
      }
    });
  }

  filterCompeticiones() {
    if (!this.searchCompeticion) {
      this.competicionesFiltradas = this.competiciones;
      return;
    }

    const searchTerm = this.searchCompeticion.toLowerCase();
    this.competicionesFiltradas = this.competiciones.filter(competicion => 
      competicion.nombre.toLowerCase().includes(searchTerm) ||
      competicion.lugar.toLowerCase().includes(searchTerm)
    );
  }

  selectCompeticion(competicion: any) {
    this.selectedCompeticion = competicion;
    this.trainingForm.patchValue({
      competicion: {
        nombre: competicion.nombre,
        fecha: competicion.fecha,
        lugar: competicion.lugar,
        competicionId: competicion._id
      }
    });
  }

  private checkUserPermissions() {
    const user = this.authService.getUser();
    if (user) {
      this.userId = user.id;
      this.isAdmin = this.authService.isAdmin();
      this.isEntrenador = this.authService.isEntrenador();
      
      // Si hay un grupoId, verificar si el usuario es el entrenador
      if (this.grupoId) {
        this.entrenamientosService.getGrupoEntrenamiento(this.grupoId).subscribe({
          next: (grupo) => {
            // Verificar si el usuario es el entrenador del grupo
            this.isEntrenador = this.isEntrenador || grupo.entrenador?._id === this.userId;
            console.log('Permisos verificados:', {
              userId: this.userId,
              grupoEntrenadorId: grupo.entrenador?._id,
              isAdmin: this.isAdmin,
              isEntrenador: this.isEntrenador
            });
          },
          error: (error) => {
            console.error('Error al verificar el grupo:', error);
          }
        });
      }
    }
  }

  canAddTraining(): boolean {
    return this.isAdmin || this.isEntrenador;
  }

  loadResultados(): void {
    if (!this.currentTraining?._id) return;

    // Limpiar resultados anteriores para evitar mezclar datos de diferentes usuarios
    this.resultados = [];
    this.miResultado = null;
    this.currentResultado = '';
    
    this.entrenamientosService.getResultados(this.currentTraining._id)
      .subscribe({
        next: (resultados: any[]) => {
          console.log('Resultados obtenidos del servidor:', resultados);
          this.resultados = resultados;
          
          const user = this.authService.getUser();
          if (!user) {
            console.warn('No hay usuario logueado para verificar resultados');
            return;
          }
          
          console.log('Buscando resultados para usuario:', user.id, user.name);
          
          // Buscar mi resultado - la estructura puede variar según cómo estén diseñados los endpoints
          this.miResultado = resultados.find((r: any) => {
            if (r.atleta) {
              if (typeof r.atleta === 'object') {
                // Si atleta es un objeto (probablemente populado)
                return r.atleta.usuario === user.id || 
                      (r.atleta.nombre && user.name && 
                       r.atleta.nombre.toLowerCase() === user.name.toLowerCase());
              } else if (typeof r.atleta === 'string') {
                // Si atleta es un string (probablemente un ID)
                return r.atleta === user.id;
              }
            }
            return false;
          });
          
          console.log('Resultado encontrado para el usuario actual:', this.miResultado);
          
          if (this.miResultado) {
            this.currentResultado = this.miResultado.resultado;
          }
        },
        error: (error) => {
          console.error('Error al cargar los resultados:', error);
          alert('Error al cargar los resultados. Por favor, inténtalo de nuevo más tarde.');
        }
      });
  }

  toggleAddResultado(): void {
    this.showAddResultadoModal = !this.showAddResultadoModal;
    if (!this.showAddResultadoModal) {
      this.currentResultado = '';
    } else if (this.miResultado) {
      // Si hay un resultado existente, cargarlo en el textarea
      this.currentResultado = this.miResultado.resultado;
    }
  }

  toggleResultadosModal(): void {
    this.showResultadosModal = !this.showResultadosModal;
    if (this.showResultadosModal) {
      this.loadResultados();
    }
  }

  addResultado(): void {
    if (!this.currentTraining?._id || !this.currentResultado.trim()) return;

    this.isAddingResultado = true;
    const userId = this.authService.getUserId();
    if (!userId) {
      console.error('No se pudo obtener el ID del usuario');
      this.isAddingResultado = false;
      return;
    }

    this.entrenamientosService.addResultado(this.currentTraining._id, userId, this.currentResultado)
      .subscribe({
        next: (response) => {
          console.log('Resultado guardado correctamente:', response);
          // Para asegurar que se recarga con la estructura correcta
          setTimeout(() => {
            this.loadResultados(); // Recargar resultados para actualizar la vista
          }, 500);
          this.toggleAddResultado();
          this.currentResultado = '';
        },
        error: (error) => {
          console.error('Error al añadir/actualizar el resultado:', error);
          alert('Hubo un error al guardar tu resultado. Por favor, inténtalo de nuevo.');
          this.isAddingResultado = false;
        },
        complete: () => {
          this.isAddingResultado = false;
        }
      });
  }

  // Método para verificar si el atleta en un resultado es un objeto
  isAtletaObject(resultado: any): boolean {
    return resultado && resultado.atleta && typeof resultado.atleta === 'object';
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { CompeticionService, Competicion, PruebaCompeticion } from '../../../calendario/services/competicion.service';
import { PerfilAtletaService, Atleta } from '../../../ranking/services/perfil-atleta.service';
import { DisciplinaFilterService } from '../../../services/disciplina-filter.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-calendario-lateral',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './calendario-lateral.component.html',
  styleUrls: ['./calendario-lateral.component.css'],
  template: `
    <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/5.15.4/css/all.min.css">
  `
})
export class CalendarioLateralComponent implements OnInit, OnDestroy {
  currentDate: Date = new Date();
  currentMonth: number = this.currentDate.getMonth();
  currentYear: number = this.currentDate.getFullYear();
  daysInMonth: number[] = [];
  firstDayOfMonth: number = 0;
  competiciones: Competicion[] = [];
  competicionesPorDia: { [key: string]: Competicion[] } = {};
  atletas: Atleta[] = [];
  cumpleanerosHoy: Atleta[] = [];
  hoveredDate: Date | null = null;
  selectedDate: Date | null = null;
  private todasCompeticiones: Competicion[] = [];
  private filterSub?: Subscription;

  constructor(
    private competicionService: CompeticionService,
    private perfilAtletaService: PerfilAtletaService,
    private disciplinaFilterService: DisciplinaFilterService
  ) {}

  ngOnInit(): void {
    this.loadCompeticiones();
    this.loadAtletas();
    this.updateCalendar();
    this.filterSub = this.disciplinaFilterService.disciplina$.subscribe(id => {
      this.applyDiscFilter(id);
    });
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  loadCompeticiones(): void {
    this.competicionService.getCompeticiones().subscribe(
      (data: Competicion[]) => {
        this.todasCompeticiones = data;
        this.applyDiscFilter(this.disciplinaFilterService.disciplinaActual);
        this.updateCalendar();
      },
      (error) => { console.error('Error al cargar las competiciones:', error); }
    );
  }

  applyDiscFilter(discId: string | null): void {
    this.competiciones = discId
      ? this.todasCompeticiones.filter(c => ((c.disciplina as any)?._id || c.disciplina) === discId)
      : this.todasCompeticiones;
    this.organizarCompeticionesPorDia();
    this.updateCalendar();
  }

  loadAtletas(): void {
    this.perfilAtletaService.getAtletas().subscribe(
      (data: Atleta[]) => {
        this.atletas = data;
        this.checkCumpleaneros();
      },
      (error) => {
        console.error('Error al cargar los atletas:', error);
      }
    );
  }

  checkCumpleaneros(): void {
    const hoy = new Date();
    const diaHoy = hoy.getDate();
    const mesHoy = hoy.getMonth() + 1;

    this.cumpleanerosHoy = this.atletas.filter(atleta => {
      const fechaNacimiento = new Date(atleta.fecha_nacimiento);
      return fechaNacimiento.getDate() === diaHoy && 
             fechaNacimiento.getMonth() + 1 === mesHoy;
    });
  }

  organizarCompeticionesPorDia(): void {
    this.competicionesPorDia = {};
    this.competiciones.forEach(competicion => {
      const fecha = new Date(competicion.fecha);
      const key = `${fecha.getFullYear()}-${fecha.getMonth() + 1}-${fecha.getDate()}`;
      if (!this.competicionesPorDia[key]) {
        this.competicionesPorDia[key] = [];
      }
      this.competicionesPorDia[key].push(competicion);
    });
  }

  updateCalendar(): void {
    const year = this.currentDate.getFullYear();
    const month = this.currentDate.getMonth();
    
    // Obtener el primer día del mes
    const firstDay = new Date(year, month, 1);
    const firstDayOfWeek = firstDay.getDay(); // 0 = Domingo, 1 = Lunes, ..., 6 = Sábado
    
    // Ajustar para que el lunes sea el primer día (1) en lugar del domingo (0)
    const adjustedFirstDayOfWeek = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    
    // Crear array de días vacíos para el inicio del mes
    const emptyDays = Array(adjustedFirstDayOfWeek).fill(0);
    
    // Obtener el número de días en el mes
    const daysInMonth = Array.from(
      { length: new Date(year, month + 1, 0).getDate() },
      (_, i) => i + 1
    );
    
    // Combinar días vacíos con días del mes
    this.daysInMonth = [...emptyDays, ...daysInMonth];
  }

  prevMonth(): void {
    this.selectedDate = null;
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() - 1,
      1
    );
    this.updateCalendar();
  }

  nextMonth(): void {
    this.selectedDate = null;
    this.currentDate = new Date(
      this.currentDate.getFullYear(),
      this.currentDate.getMonth() + 1,
      1
    );
    this.updateCalendar();
  }

  getMonthName(): string {
    return this.currentDate.toLocaleString('es-ES', { month: 'long' });
  }

  getYear(): number {
    return this.currentDate.getFullYear();
  }

  getCompeticionesDelDia(day: number): Competicion[] {
    const key = `${this.currentDate.getFullYear()}-${this.currentDate.getMonth() + 1}-${day}`;
    return this.competicionesPorDia[key] || [];
  }

  getCategoriasUnicas(competicion: Competicion): string[] {
    const categorias = new Set<string>();
    competicion.pruebas.forEach(prueba => {
      if (prueba.categoria_id && prueba.categoria_id.nombre_categoria) {
        categorias.add(prueba.categoria_id.nombre_categoria);
      }
    });
    return Array.from(categorias);
  }

  hasCompeticiones(day: number): boolean {
    const key = `${this.currentDate.getFullYear()}-${this.currentDate.getMonth() + 1}-${day}`;
    return this.competicionesPorDia[key]?.length > 0;
  }

  setHoveredDate(day: number): void {
    if (day === 0) {
      this.hoveredDate = null;
      return;
    }
    this.hoveredDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
  }

  clearHoveredDate(): void {
    this.hoveredDate = null;
  }

  selectDate(day: number): void {
    if (day === 0 || !this.hasCompeticiones(day)) {
      return;
    }
    this.selectedDate = new Date(this.currentDate.getFullYear(), this.currentDate.getMonth(), day);
  }

  closeSelectedDate(): void {
    this.selectedDate = null;
  }
} 
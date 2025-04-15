import { Component, inject, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { DiaEntrenamiento, Entrenamiento, EntrenamientosService } from '../../services/entrenamientos.service';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-calendario-entrenamiento',
  standalone: true,
  templateUrl: './calendario-entrenamiento.component.html',
  styleUrls: ['./calendario-entrenamiento.component.css'],
  imports: [CommonModule, FormsModule, RouterLink]
})
export class CalendarioEntrenamientoComponent implements OnInit {
  currentMonth: number;
  currentYear: number;
  daysInMonth: any[] = [];
  diasEntrenamiento: DiaEntrenamiento[] = [];
  private entrenamientosService = inject(EntrenamientosService);

  atletaId: string | null = null;

  constructor(private route: ActivatedRoute, private router: Router) {
    const today = new Date();
    this.currentMonth = today.getMonth();
    this.currentYear = today.getFullYear();

  }

  ngOnInit(): void {
    // Obtener atletaId de la URL
    this.atletaId = this.route.snapshot.paramMap.get('atletaId');

    if (this.atletaId) {
      this.loadCalendar(this.atletaId);
    }
  }

  loadCalendar(atletaId: string): void {
    this.entrenamientosService.getCalendarioPorAtleta(atletaId)
      .subscribe(response => {
        if (response?.calendario?.diasEntrenamiento) {
          this.diasEntrenamiento = response.calendario.diasEntrenamiento;
        } else {
          this.diasEntrenamiento = [];
        }
        this.generateCalendar(this.currentMonth, this.currentYear);
      },
        error => {
          console.error("Error al cargar el calendario:", error);
          this.diasEntrenamiento = [];
        });
  }

  generateCalendar(month: number, year: number): void {
    const firstDay = new Date(year, month, 1);
    const lastDay = new Date(year, month + 1, 0);
    const daysArray = Array.from({ length: lastDay.getDate() }, (_, i) => i + 1);

    this.daysInMonth = daysArray.map(day => {
      const date = new Date(year, month, day);
      return {
        date,
        diaEntrenamiento: this.getDiaEntrenamiento(date),
      };
    });
  }

  getDiaEntrenamiento(date: Date): DiaEntrenamiento | undefined {
    return this.diasEntrenamiento.find(d => new Date(d.fecha).toDateString() === date.toDateString());
  }

  previousMonth(): void {
    if (this.currentMonth === 0) {
      this.currentYear--;
      this.currentMonth = 11;
    } else {
      this.currentMonth--;
    }
    this.generateCalendar(this.currentMonth, this.currentYear);
  }

  nextMonth(): void {
    if (this.currentMonth === 11) {
      this.currentYear++;
      this.currentMonth = 0;
    } else {
      this.currentMonth++;
    }
    this.generateCalendar(this.currentMonth, this.currentYear);
  }

  onClickAgregarOEditar(date: Date): void {
    if (!this.atletaId) return;

    this.entrenamientosService.getDiaEntrenamientoId(this.atletaId, date).subscribe(dia => {
      if (dia) {
        // Si el día de entrenamiento existe, redirige a la página de edición
        this.router.navigate(['/crear-entrenamiento', dia._id]);
      } else {
        // Si no existe, crea el día de entrenamiento y luego redirige a la página de creación
        const nuevoDia: DiaEntrenamiento = { fecha: date, entrenamientos: [] };
        this.entrenamientosService.createDiaEntrenamiento(nuevoDia).subscribe(newDia => {
          this.router.navigate(['/crear-entrenamiento', newDia._id]);
        });
      }
    });
  }

}

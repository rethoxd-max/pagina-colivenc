import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

interface Horario {
  categoria: string;
  horario: string;
  dias: string[];
}

@Component({
  selector: 'app-horarios-escuela',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horarios-escuela.component.html',
  styleUrls: ['./horarios-escuela.component.css']
})
export class HorariosEscuelaComponent implements OnInit {
  horarios: Horario[] = [];
  temporadaActual: string = '';

  constructor() { }

  ngOnInit(): void {
    this.calcularTemporada();
    this.generarHorarios();
  }

  private calcularTemporada(): void {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth(); // 0-11 (enero=0, agosto=7)
    const dia = hoy.getDate();
    
    const AGOSTO = 7; // En JavaScript los meses van de 0 a 11
    const DIA_CAMBIO_TEMPORADA = 20;
    
    // La temporada cambia el 20 de agosto
    // Si estamos antes del 20 de agosto, estamos en la temporada del año actual
    // Si estamos después del 20 de agosto, estamos en la temporada del año siguiente
    let añoTemporada: number;
    if (mes < AGOSTO || (mes === AGOSTO && dia < DIA_CAMBIO_TEMPORADA)) {
      // Antes del 20 de agosto: temporada del año actual
      añoTemporada = año;
    } else {
      // Después del 20 de agosto: temporada del año siguiente
      añoTemporada = año + 1;
    }
    
    // Formato: "Temporada 2025-26"
    const añoInicio = añoTemporada - 1;
    const añoFinCorto = añoTemporada.toString().slice(-2);
    this.temporadaActual = `Temporada ${añoInicio}-${añoFinCorto}`;
  }

  private getAñoNacimientoCategoria(edadMinima: number, edadMaxima: number): string {
    const hoy = new Date();
    const año = hoy.getFullYear();
    const mes = hoy.getMonth();
    const dia = hoy.getDate();
    
    // Calcular el año de referencia para la temporada
    let añoTemporada: number;
    if (mes < 7 || (mes === 7 && dia < 20)) {
      añoTemporada = año;
    } else {
      añoTemporada = año + 1;
    }
    
    // Los años de nacimiento se calculan restando la edad del año de la temporada
    const añoNacimientoMayor = añoTemporada - edadMaxima;
    const añoNacimientoMenor = añoTemporada - edadMinima;
    
    return `${añoNacimientoMayor}-${añoNacimientoMenor}`;
  }

  private generarHorarios(): void {
    this.horarios = [
      {
        categoria: `Benjamín (${this.getAñoNacimientoCategoria(8, 9)})`,
        horario: '16:00 - 17:00',
        dias: ['Lunes', 'Miércoles']
      },
      {
        categoria: `Alevín (${this.getAñoNacimientoCategoria(10, 11)})`,
        horario: '17:00 - 18:00',
        dias: ['Lunes', 'Jueves', 'Viernes']
      },
      {
        categoria: `Infantil (${this.getAñoNacimientoCategoria(12, 13)})`,
        horario: '17:00 - 18:15',
        dias: ['Lunes', 'Miércoles', 'Jueves']
      },
      {
        categoria: `Cadete (${this.getAñoNacimientoCategoria(14, 15)})`,
        horario: '17:00 - 18:30',
        dias: ['Martes', 'Jueves', 'Viernes']
      }
    ];
  }
} 
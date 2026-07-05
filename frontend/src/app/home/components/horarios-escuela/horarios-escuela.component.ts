import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HorariosEscuelaService, HorarioEscuela } from '../../services/horarios-escuela.service';

interface SeccionHorarios {
  nombre: string;
  horarios: HorarioEscuela[];
}

@Component({
  selector: 'app-horarios-escuela',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './horarios-escuela.component.html',
  styleUrls: ['./horarios-escuela.component.css']
})
export class HorariosEscuelaComponent implements OnInit {
  secciones: SeccionHorarios[] = [];
  cargando = true;

  constructor(private horariosService: HorariosEscuelaService) { }

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.horariosService.getHorarios().subscribe({
      next: (data) => {
        this.secciones = this.agruparPorSeccion(data);
        this.cargando = false;
      },
      error: () => { this.cargando = false; }
    });
  }

  private agruparPorSeccion(horarios: HorarioEscuela[]): SeccionHorarios[] {
    const mapa = new Map<string, HorarioEscuela[]>();
    horarios.forEach(h => {
      if (!mapa.has(h.seccion)) mapa.set(h.seccion, []);
      mapa.get(h.seccion)!.push(h);
    });
    return Array.from(mapa.entries()).map(([nombre, horarios]) => ({ nombre, horarios }));
  }
}

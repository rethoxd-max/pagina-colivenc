import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HorariosEscuelaService, HorarioEscuela } from '../../home/services/horarios-escuela.service';

interface SeccionHorarios {
  nombre: string;
  horarios: HorarioEscuela[];
}

@Component({
  selector: 'app-admin-horarios-escuela',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-horarios-escuela.component.html',
  styleUrls: ['./admin-horarios-escuela.component.css'],
})
export class AdminHorariosEscuelaComponent implements OnInit {
  readonly diasSemana = ['Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'];

  horarios: HorarioEscuela[] = [];
  secciones: SeccionHorarios[] = [];
  seccionesExistentes: string[] = [];

  cargando = false;
  guardando = false;
  editandoId: string | null = null;
  error = '';
  exito = '';

  form = {
    seccion: '',
    categoria: '',
    horario: '',
    dias: [] as string[],
  };

  constructor(private horariosService: HorariosEscuelaService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.horariosService.getHorarios().subscribe({
      next: (data) => {
        this.horarios = data;
        this.secciones = this.agruparPorSeccion(data);
        this.seccionesExistentes = Array.from(new Set(data.map(h => h.seccion)));
        this.cargando = false;
      },
      error: () => { this.error = 'Error al cargar los horarios'; this.cargando = false; }
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

  toggleDia(dia: string): void {
    const i = this.form.dias.indexOf(dia);
    if (i >= 0) this.form.dias.splice(i, 1);
    else this.form.dias.push(dia);
  }

  guardar(): void {
    this.error = '';
    this.exito = '';
    const seccion = this.form.seccion.trim();
    const categoria = this.form.categoria.trim();
    const horario = this.form.horario.trim();

    if (!seccion || !categoria || !horario) {
      this.error = 'La sección, la categoría y el horario son obligatorios.';
      return;
    }
    if (this.form.dias.length === 0) {
      this.error = 'Selecciona al menos un día de entrenamiento.';
      return;
    }

    this.guardando = true;
    const payload = { seccion, categoria, horario, dias: this.form.dias };
    const peticion = this.editandoId
      ? this.horariosService.actualizar(this.editandoId, payload)
      : this.horariosService.crear(payload);

    peticion.subscribe({
      next: () => {
        this.exito = this.editandoId ? 'Horario actualizado correctamente.' : 'Horario añadido correctamente.';
        this.guardando = false;
        this.cancelarEdicion();
        this.cargar();
      },
      error: (e) => {
        this.error = e?.error?.mensaje || 'Error al guardar el horario.';
        this.guardando = false;
      }
    });
  }

  editar(horario: HorarioEscuela): void {
    this.editandoId = horario._id;
    this.form = {
      seccion: horario.seccion,
      categoria: horario.categoria,
      horario: horario.horario,
      dias: [...horario.dias],
    };
    this.error = '';
    this.exito = '';
  }

  cancelarEdicion(): void {
    this.editandoId = null;
    this.form = { seccion: '', categoria: '', horario: '', dias: [] };
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar este horario?')) return;
    this.horariosService.eliminar(id).subscribe({
      next: () => {
        this.exito = 'Horario eliminado.';
        if (this.editandoId === id) this.cancelarEdicion();
        this.cargar();
      },
      error: () => { this.error = 'Error al eliminar el horario.'; }
    });
  }
}

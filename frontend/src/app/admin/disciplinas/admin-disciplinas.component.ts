import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DisciplinaService, Disciplina } from '../../services/disciplina.service';

@Component({
  selector: 'app-admin-disciplinas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './admin-disciplinas.component.html',
  styleUrls: ['./admin-disciplinas.component.css'],
})
export class AdminDisciplinasComponent implements OnInit {
  disciplinas: Disciplina[] = [];
  cargando = false;
  error = '';
  exito = '';

  // formulario nueva/editar
  editandoId: string | null = null;
  form = { nombre: '', slug: '', color: '#005cbf', icono: 'fa-running' };

  constructor(private disciplinaService: DisciplinaService) {}

  ngOnInit(): void {
    this.cargar();
  }

  cargar(): void {
    this.cargando = true;
    this.disciplinaService.getDisciplinas().subscribe({
      next: (data) => { this.disciplinas = data; this.cargando = false; },
      error: () => { this.error = 'Error al cargar disciplinas'; this.cargando = false; },
    });
  }

  // Auto-genera el slug a partir del nombre
  generarSlug(): void {
    this.form.slug = this.form.nombre
      .toLowerCase()
      .normalize('NFD')
      .replace(/[\u0300-\u036f]/g, '')
      .replace(/[^a-z0-9]+/g, '-')
      .replace(/^-|-$/g, '');
  }

  iniciarEdicion(d: Disciplina): void {
    this.editandoId = d._id;
    this.form = { nombre: d.nombre, slug: d.slug, color: d.color, icono: d.icono };
  }

  cancelar(): void {
    this.editandoId = null;
    this.form = { nombre: '', slug: '', color: '#005cbf', icono: 'fa-running' };
    this.error = '';
    this.exito = '';
  }

  guardar(): void {
    this.error = '';
    this.exito = '';
    if (!this.form.nombre.trim() || !this.form.slug.trim()) {
      this.error = 'El nombre y el slug son obligatorios.';
      return;
    }
    const obs = this.editandoId
      ? this.disciplinaService.updateDisciplina(this.editandoId, this.form)
      : this.disciplinaService.createDisciplina(this.form);

    obs.subscribe({
      next: () => {
        this.exito = this.editandoId ? 'Disciplina actualizada.' : 'Disciplina creada.';
        this.cancelar();
        this.cargar();
      },
      error: (e) => {
        this.error = e?.error?.mensaje || 'Error al guardar la disciplina.';
      },
    });
  }

  eliminar(id: string): void {
    if (!confirm('¿Eliminar esta disciplina? Los posts y competiciones ya asignados perderán la asignación.')) return;
    this.disciplinaService.deleteDisciplina(id).subscribe({
      next: () => { this.exito = 'Disciplina eliminada.'; this.cargar(); },
      error: () => { this.error = 'Error al eliminar.'; },
    });
  }
}

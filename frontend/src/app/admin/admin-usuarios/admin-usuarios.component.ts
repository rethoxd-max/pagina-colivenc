import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { RouterLink } from '@angular/router';
import { environment } from '../../../environments/environment';

interface Usuario {
  _id: string;
  name: string;
  email: string;
  userTypes: string[];
  fechaNacimiento?: string;
  numeroLicencia?: string;
  dni?: string;
  telefono?: string;
  activo: boolean;
}

@Component({
  selector: 'app-admin-usuarios',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterLink],
  templateUrl: './admin-usuarios.component.html',
  styleUrl: './admin-usuarios.component.css'
})
export class AdminUsuariosComponent implements OnInit {
  usuarios: Usuario[] = [];
  usuariosFiltrados: Usuario[] = [];
  filtro = '';
  errorMessage: string | null = null;
  successMessage: string | null = null;

  usuarioEditando: Usuario | null = null;
  editForm: Partial<Usuario> = {};

  resetPasswordUserId: string | null = null;
  nuevaPassword = '';
  confirmarPassword = '';

  userTypeOptions = ['Admin', 'Atleta', 'Entrenador', 'Editor', 'Viewer'];

  private apiUrl = `${environment.apiUrl}/auth`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarUsuarios();
  }

  cargarUsuarios() {
    this.http.get<Usuario[]>(`${this.apiUrl}/users`).subscribe({
      next: (data) => {
        this.usuarios = data;
        this.aplicarFiltro();
      },
      error: () => this.errorMessage = 'Error al cargar los usuarios'
    });
  }

  aplicarFiltro() {
    const f = this.filtro.toLowerCase();
    this.usuariosFiltrados = this.usuarios.filter(u =>
      u.name.toLowerCase().includes(f) ||
      u.email.toLowerCase().includes(f) ||
      (u.dni || '').toLowerCase().includes(f)
    );
  }

  abrirEdicion(u: Usuario) {
    this.usuarioEditando = u;
    this.editForm = {
      name: u.name,
      email: u.email,
      userTypes: [...u.userTypes],
      fechaNacimiento: u.fechaNacimiento ? u.fechaNacimiento.substring(0, 10) : '',
      numeroLicencia: u.numeroLicencia || '',
      dni: u.dni || '',
      telefono: u.telefono || '',
      activo: u.activo
    };
    this.errorMessage = null;
    this.successMessage = null;
  }

  cerrarEdicion() {
    this.usuarioEditando = null;
    this.editForm = {};
  }

  toggleRol(rol: string) {
    const tipos = this.editForm.userTypes || [];
    const idx = tipos.indexOf(rol);
    if (idx === -1) tipos.push(rol);
    else tipos.splice(idx, 1);
    this.editForm.userTypes = [...tipos];
  }

  tieneRol(rol: string): boolean {
    return (this.editForm.userTypes || []).includes(rol);
  }

  guardarEdicion() {
    if (!this.usuarioEditando) return;
    this.http.put<Usuario>(`${this.apiUrl}/users/${this.usuarioEditando._id}`, this.editForm).subscribe({
      next: (updated) => {
        const idx = this.usuarios.findIndex(u => u._id === updated._id);
        if (idx !== -1) this.usuarios[idx] = updated;
        this.aplicarFiltro();
        this.successMessage = 'Usuario actualizado correctamente';
        this.cerrarEdicion();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => this.errorMessage = err.error?.msg || 'Error al actualizar el usuario'
    });
  }

  abrirResetPassword(userId: string) {
    this.resetPasswordUserId = userId;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
    this.errorMessage = null;
  }

  cerrarResetPassword() {
    this.resetPasswordUserId = null;
    this.nuevaPassword = '';
    this.confirmarPassword = '';
  }

  guardarPassword() {
    if (this.nuevaPassword !== this.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }
    if (this.nuevaPassword.length < 6) {
      this.errorMessage = 'La contraseña debe tener al menos 6 caracteres';
      return;
    }
    this.http.post(`${this.apiUrl}/users/${this.resetPasswordUserId}/reset-password`, { newPassword: this.nuevaPassword }).subscribe({
      next: () => {
        this.successMessage = 'Contraseña actualizada correctamente';
        this.cerrarResetPassword();
        setTimeout(() => this.successMessage = null, 3000);
      },
      error: (err) => this.errorMessage = err.error?.msg || 'Error al cambiar la contraseña'
    });
  }

  nombreRoles(tipos: string[]): string {
    return tipos.join(', ') || 'Sin rol';
  }
}

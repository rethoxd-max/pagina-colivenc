import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-solicitud-cuenta',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './solicitud-cuenta.component.html',
})
export class SolicitudCuentaComponent {
  abierto = false;
  nombre = '';
  email = '';
  enviando = false;
  exito = false;
  error: string | null = null;

  private apiUrl = `${environment.apiUrl}/auth/solicitar-cuenta`;

  constructor(private http: HttpClient) {}

  toggle() {
    this.abierto = !this.abierto;
    if (!this.abierto) {
      this.resetear();
    }
  }

  enviar() {
    if (!this.nombre.trim() || !this.email.trim()) return;
    this.enviando = true;
    this.error = null;
    this.http.post(this.apiUrl, { nombre: this.nombre.trim(), email: this.email.trim() }).subscribe({
      next: () => {
        this.exito = true;
        this.enviando = false;
      },
      error: (err) => {
        this.error = err.error?.msg || 'Error al enviar la solicitud. Inténtalo de nuevo.';
        this.enviando = false;
      }
    });
  }

  resetear() {
    this.nombre = '';
    this.email = '';
    this.exito = false;
    this.error = null;
  }
}

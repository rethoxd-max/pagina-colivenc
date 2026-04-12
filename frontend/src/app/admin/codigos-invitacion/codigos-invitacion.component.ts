import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';
import { environment } from '../../../environments/environment';

interface CodigoInvitacion {
  _id: string;
  codigo: string;
  usado: boolean;
  creadoPor: { name: string; email: string };
  usadoPor?: { name: string; email: string };
  creadoEn: string;
  usadoEn?: string;
}

@Component({
  selector: 'app-codigos-invitacion',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './codigos-invitacion.component.html',
})
export class CodigosInvitacionComponent implements OnInit {
  codigos: CodigoInvitacion[] = [];
  generando = false;
  errorMessage: string | null = null;
  copiado: string | null = null;

  private apiUrl = `${environment.apiUrl}/admin/codigos`;

  constructor(private http: HttpClient) {}

  ngOnInit() {
    this.cargarCodigos();
  }

  cargarCodigos() {
    this.http.get<CodigoInvitacion[]>(this.apiUrl).subscribe({
      next: (data) => this.codigos = data,
      error: () => this.errorMessage = 'Error al cargar los códigos'
    });
  }

  generarCodigo() {
    this.generando = true;
    this.errorMessage = null;
    this.http.post<CodigoInvitacion>(this.apiUrl, {}).subscribe({
      next: (nuevo) => {
        this.codigos.unshift(nuevo);
        this.generando = false;
      },
      error: () => {
        this.errorMessage = 'Error al generar el código';
        this.generando = false;
      }
    });
  }

  eliminarCodigo(id: string) {
    this.http.delete(`${this.apiUrl}/${id}`).subscribe({
      next: () => this.codigos = this.codigos.filter(c => c._id !== id),
      error: (err) => this.errorMessage = err.error?.msg || 'Error al eliminar el código'
    });
  }

  copiarCodigo(codigo: string) {
    navigator.clipboard.writeText(codigo);
    this.copiado = codigo;
    setTimeout(() => this.copiado = null, 2000);
  }

  codigosDisponibles() {
    return this.codigos.filter(c => !c.usado);
  }

  codigosUsados() {
    return this.codigos.filter(c => c.usado);
  }
}

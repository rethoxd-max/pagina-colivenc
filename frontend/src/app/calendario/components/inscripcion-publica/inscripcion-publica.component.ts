import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';

@Component({
  selector: 'app-inscripcion-publica',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="publica-wrapper">

      <!-- Cargando -->
      <div *ngIf="cargando" class="publica-loading">
        <i class="fas fa-spinner fa-spin"></i> Cargando...
      </div>

      <!-- Error -->
      <div *ngIf="!cargando && error" class="publica-error">
        <i class="fas fa-exclamation-circle"></i>
        <p>{{ error }}</p>
      </div>

      <!-- Formulario -->
      <div *ngIf="!cargando && !error && !enviado" class="publica-card">
        <div class="publica-header">
          <img *ngIf="competicion?.imageUrl" [src]="competicion.imageUrl" class="publica-img" alt="Imagen competición" />
          <h1 class="publica-nombre">{{ competicion?.nombre }}</h1>
          <div class="publica-meta">
            <span><i class="fas fa-calendar-day"></i> {{ competicion?.fecha | date:'dd/MM/yyyy' }}</span>
            <span><i class="fas fa-map-marker-alt"></i> {{ competicion?.lugar }}</span>
          </div>
          <p *ngIf="competicion?.descripcion" class="publica-desc">{{ competicion?.descripcion }}</p>
        </div>

        <form (ngSubmit)="enviar()" #form="ngForm" class="publica-form">
          <div class="publica-field">
            <label for="nombre_atleta">Nombre del atleta</label>
            <input
              id="nombre_atleta"
              type="text"
              [(ngModel)]="nombreAtleta"
              name="nombre_atleta"
              placeholder="Nombre y apellidos"
              required
              #campoNombre="ngModel"
              class="publica-input" />
            <div *ngIf="campoNombre.invalid && campoNombre.touched" class="publica-error-inline">
              El nombre es obligatorio
            </div>
          </div>

          <button type="submit" class="publica-btn" [disabled]="form.invalid || enviando">
            <i class="fas" [ngClass]="enviando ? 'fa-spinner fa-spin' : 'fa-check'"></i>
            {{ enviando ? 'Enviando...' : 'Confirmar asistencia' }}
          </button>

          <div *ngIf="errorEnvio" class="publica-error-inline publica-error-envio">
            {{ errorEnvio }}
          </div>
        </form>
      </div>

      <!-- Confirmación -->
      <div *ngIf="enviado" class="publica-ok">
        <i class="fas fa-check-circle"></i>
        <h2>¡Inscripción confirmada!</h2>
        <p><strong>{{ nombreAtleta }}</strong> aparecerá en la lista de <strong>{{ competicion?.nombre }}</strong>.</p>
      </div>

    </div>
  `,
  styles: [`
    .publica-wrapper {
      min-height: 100vh;
      display: flex;
      align-items: center;
      justify-content: center;
      background: #f1f5f9;
      padding: 2rem 1rem;
      font-family: inherit;
    }
    .publica-loading, .publica-error {
      text-align: center;
      color: #64748b;
      font-size: 1.1rem;
    }
    .publica-error { color: #ef4444; }
    .publica-card {
      background: #fff;
      border-radius: 16px;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      padding: 2rem;
      max-width: 480px;
      width: 100%;
    }
    .publica-img {
      width: 100%;
      max-height: 180px;
      object-fit: cover;
      border-radius: 10px;
      margin-bottom: 1rem;
    }
    .publica-nombre {
      font-size: 1.5rem;
      font-weight: 700;
      color: #1e293b;
      margin: 0 0 0.5rem;
    }
    .publica-meta {
      display: flex;
      gap: 1.2rem;
      color: #64748b;
      font-size: 0.9rem;
      margin-bottom: 0.75rem;
    }
    .publica-meta i { margin-right: 0.3rem; color: #6366f1; }
    .publica-desc {
      color: #475569;
      font-size: 0.9rem;
      margin-bottom: 1.25rem;
    }
    .publica-form { margin-top: 1.5rem; }
    .publica-field { margin-bottom: 1.25rem; }
    .publica-field label {
      display: block;
      font-weight: 600;
      color: #334155;
      margin-bottom: 0.4rem;
      font-size: 0.95rem;
    }
    .publica-input {
      width: 100%;
      padding: 0.65rem 0.85rem;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      font-size: 1rem;
      outline: none;
      transition: border-color 0.2s;
      box-sizing: border-box;
    }
    .publica-input:focus { border-color: #6366f1; }
    .publica-btn {
      width: 100%;
      padding: 0.75rem;
      background: #6366f1;
      color: #fff;
      border: none;
      border-radius: 10px;
      font-size: 1rem;
      font-weight: 600;
      cursor: pointer;
      transition: background 0.2s;
    }
    .publica-btn:hover:not(:disabled) { background: #4f46e5; }
    .publica-btn:disabled { background: #cbd5e1; cursor: not-allowed; }
    .publica-error-inline { color: #ef4444; font-size: 0.85rem; margin-top: 0.3rem; }
    .publica-error-envio { margin-top: 0.75rem; text-align: center; }
    .publica-ok {
      text-align: center;
      background: #fff;
      border-radius: 16px;
      padding: 3rem 2rem;
      box-shadow: 0 4px 24px rgba(0,0,0,0.10);
      max-width: 420px;
      width: 100%;
    }
    .publica-ok i { font-size: 3.5rem; color: #10b981; margin-bottom: 1rem; }
    .publica-ok h2 { font-size: 1.6rem; color: #1e293b; margin-bottom: 0.75rem; }
    .publica-ok p { color: #475569; font-size: 1rem; }
  `]
})
export class InscripcionPublicaComponent implements OnInit {
  competicion: any = null;
  nombreAtleta = '';
  cargando = true;
  error = '';
  enviando = false;
  enviado = false;
  errorEnvio = '';

  private token = '';
  private apiUrl = environment.apiUrl;

  constructor(private route: ActivatedRoute, private http: HttpClient) {}

  ngOnInit(): void {
    this.token = this.route.snapshot.paramMap.get('token') || '';
    this.http.get(`${this.apiUrl}/inscripciones-publicas/${this.token}`).subscribe({
      next: (data) => { this.competicion = data; this.cargando = false; },
      error: () => { this.error = 'Enlace inválido o competición no encontrada.'; this.cargando = false; }
    });
  }

  enviar(): void {
    if (!this.nombreAtleta.trim()) return;
    this.enviando = true;
    this.errorEnvio = '';
    this.http.post(`${this.apiUrl}/inscripciones-publicas/${this.token}`, { nombre_atleta: this.nombreAtleta }).subscribe({
      next: () => { this.enviando = false; this.enviado = true; },
      error: (err) => {
        this.enviando = false;
        this.errorEnvio = err?.error?.mensaje || 'Error al enviar. Inténtalo de nuevo.';
      }
    });
  }
}

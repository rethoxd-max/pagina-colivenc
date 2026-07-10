import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { HttpClient } from '@angular/common/http';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { environment } from '../../../../environments/environment';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { isPdf, isImageFile, getMediaUrl } from '../../utils/competicion-media.util';

@Component({
  selector: 'app-inscripcion-publica',
  standalone: true,
  imports: [CommonModule, FormsModule, PdfViewerModule],
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
          <img *ngIf="competicion?.imageUrl && !isPdf(competicion.imageUrl)" [src]="getMediaUrl(competicion.imageUrl)" class="publica-img" alt="Imagen competición" />
          <div class="publica-pdf" *ngIf="competicion?.imageUrl && isPdf(competicion.imageUrl)">
            <pdf-viewer [src]="getMediaUrl(competicion.imageUrl)"
                [show-all]="true"
                [render-text]="true"
                [fit-to-page]="true"
                [original-size]="false"
                class="publica-pdf-viewer"></pdf-viewer>
          </div>
          <h1 class="publica-nombre">{{ competicion?.nombre }}</h1>
          <div class="publica-meta">
            <span><i class="fas fa-calendar-day"></i> {{ competicion?.fecha | date:'dd/MM/yyyy' }}</span>
            <span><i class="fas fa-map-marker-alt"></i> {{ competicion?.lugar }}</span>
          </div>
          <p *ngIf="competicion?.descripcion" class="publica-desc">{{ competicion?.descripcion }}</p>

          <div class="publica-enlaces" *ngIf="competicion?.enlaces && competicion.enlaces.length > 0">
            <span class="publica-enlaces-label"><i class="fas fa-paperclip"></i> Documentos:</span>
            <div class="publica-enlaces-list">
              <a *ngFor="let enlace of competicion.enlaces"
                  [href]="isEnlaceArchivo(enlace) ? getMediaUrl(enlace.url) : enlace.url"
                  target="_blank" rel="noopener noreferrer"
                  class="publica-enlace-chip">
                <i class="fas" [ngClass]="getEnlaceIcon(enlace)"></i> {{ enlace.nombre }}
              </a>
            </div>
          </div>
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
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    .publica-meta {
      display: flex;
      flex-wrap: wrap;
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
      word-break: break-word;
      overflow-wrap: anywhere;
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
    .publica-pdf-viewer {
      display: block;
      width: 100%;
      height: 320px;
      border-radius: 10px;
      margin-bottom: 1rem;
      overflow: auto;
    }
    .publica-enlaces { margin-top: 0.5rem; margin-bottom: 1.25rem; }
    .publica-enlaces-label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.5rem;
    }
    .publica-enlaces-label i { margin-right: 0.3rem; color: #6366f1; }
    .publica-enlaces-list { display: flex; flex-wrap: wrap; gap: 0.5rem; }
    .publica-enlace-chip {
      display: inline-flex;
      align-items: center;
      gap: 0.35rem;
      background: #eef2ff;
      color: #4f46e5;
      border: 1px solid #c7d2fe;
      padding: 0.3rem 0.75rem;
      border-radius: 20px;
      font-size: 0.82rem;
      font-weight: 500;
      text-decoration: none;
    }
    .publica-enlace-chip:hover { background: #e0e7ff; }
    .publica-enlace-chip { max-width: 100%; word-break: break-word; overflow-wrap: anywhere; }

    /* --- Responsive --- */
    @media (max-width: 768px) {
      .publica-wrapper {
        padding: 1.5rem 0.75rem;
        align-items: flex-start;
      }
      .publica-card {
        padding: 1.5rem 1.25rem;
      }
      .publica-nombre { font-size: 1.35rem; }
      .publica-ok { padding: 2.5rem 1.5rem; }
    }

    @media (max-width: 480px) {
      .publica-wrapper {
        padding: 1rem 0.5rem;
      }
      .publica-card {
        padding: 1.25rem 1rem;
        border-radius: 14px;
      }
      .publica-nombre { font-size: 1.2rem; }
      .publica-meta {
        flex-direction: column;
        gap: 0.4rem;
      }
      .publica-btn { min-height: 48px; }
      .publica-input { min-height: 44px; }
      .publica-pdf-viewer { height: 240px; }
      .publica-ok { padding: 2rem 1rem; }
      .publica-ok i { font-size: 3rem; }
      .publica-ok h2 { font-size: 1.35rem; }
    }
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

  isPdf(url: string | null | undefined): boolean {
    return isPdf(url);
  }

  getMediaUrl(url: string | null | undefined): string {
    return getMediaUrl(url);
  }

  isEnlaceArchivo(enlace: any): boolean {
    return enlace?.origen === 'archivo';
  }

  getEnlaceIcon(enlace: any): string {
    if (!this.isEnlaceArchivo(enlace)) return 'fa-file-alt';
    if (isPdf(enlace.url)) return 'fa-file-pdf';
    if (isImageFile(enlace.url)) return 'fa-file-image';
    return 'fa-paperclip';
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

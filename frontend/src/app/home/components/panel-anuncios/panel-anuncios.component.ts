import { Component, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';

export interface Anuncio {
  texto: string;
  enlace?: string;
  enlaceTexto?: string;
}

@Component({
  selector: 'app-panel-anuncios',
  standalone: true,
  imports: [CommonModule, RouterModule],
  templateUrl: './panel-anuncios.component.html',
  styleUrls: ['./panel-anuncios.component.css']
})
export class PanelAnunciosComponent {
  @Input() anuncios: Anuncio[] = [];

  currentIndex = 0;
  visible = true;

  get anuncioActual(): Anuncio | null {
    return this.anuncios.length > 0 ? this.anuncios[this.currentIndex] : null;
  }

  prev(): void {
    this.currentIndex = this.currentIndex > 0
      ? this.currentIndex - 1
      : this.anuncios.length - 1;
  }

  next(): void {
    this.currentIndex = this.currentIndex < this.anuncios.length - 1
      ? this.currentIndex + 1
      : 0;
  }

  cerrar(): void {
    this.visible = false;
  }
}

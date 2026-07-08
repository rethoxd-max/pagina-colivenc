import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.css'],
})
export class RankingComponent {
  // URL del embed de Mundo Atletismo para el club
  private readonly embedUrl = 'https://mundoatletismo.es/embed/club/centre-esp-colivenc?nav=0';
  embedUrlSegura: SafeResourceUrl;
  cargando = true;

  constructor(private sanitizer: DomSanitizer) {
    this.embedUrlSegura = this.sanitizer.bypassSecurityTrustResourceUrl(this.embedUrl);
  }

  onCargado(): void {
    this.cargando = false;
  }
}

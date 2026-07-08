import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { HttpClient } from '@angular/common/http';

interface EntradaRanking {
  puesto: string;
  nombre: string;
  marca: string;
  anyo_nac: string;
  fecha: string;
  lugar: string;
  extra: string;
}

interface PruebaRanking {
  prueba: string;
  tipo: 'estandar' | 'maraton';
  entradas: EntradaRanking[];
}

interface RankingClubData {
  titulo: string;
  actualizado: string;
  generos: { M: PruebaRanking[]; F: PruebaRanking[] };
}

@Component({
  selector: 'app-ranking-club',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking-club.component.html',
  styleUrls: ['./ranking-club.component.css'],
})
export class RankingClubComponent implements OnInit {
  data: RankingClubData | null = null;
  cargando = true;
  error = false;

  genero: 'M' | 'F' = 'M';
  pruebaIdx = 0;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<RankingClubData>('assets/ranking-club.json').subscribe({
      next: (d) => { this.data = d; this.cargando = false; },
      error: () => { this.error = true; this.cargando = false; },
    });
  }

  get pruebas(): PruebaRanking[] {
    return this.data ? this.data.generos[this.genero] : [];
  }

  get pruebaActual(): PruebaRanking | null {
    return this.pruebas[this.pruebaIdx] ?? null;
  }

  setGenero(g: 'M' | 'F'): void {
    if (this.genero === g) return;
    this.genero = g;
    this.pruebaIdx = 0;
  }

  setPrueba(i: number): void {
    this.pruebaIdx = i;
  }

  medalla(puesto: string): string {
    return puesto === '1' ? 'oro' : puesto === '2' ? 'plata' : puesto === '3' ? 'bronce' : '';
  }

  // Normaliza el nombre de la prueba para mostrarlo (el JSON conserva el original del Excel):
  // primera letra en mayúscula (si la hay) y el resto en minúsculas.
  nombreMostrado(nombre: string): string {
    if (!nombre) return nombre;
    return nombre.charAt(0).toUpperCase() + nombre.slice(1).toLowerCase();
  }
}

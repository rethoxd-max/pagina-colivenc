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

type SectorClave = 'velocidad' | 'medio_fondo' | 'ruta_marcha' | 'saltos' | 'lanzamientos' | 'combinadas';

interface CategoriaRanking {
  nombre: string;
  entradas: EntradaRanking[];
}

interface PruebaRanking {
  prueba: string;
  tipo: 'estandar' | 'maraton';
  sector: SectorClave;
  categorias: CategoriaRanking[];
}

interface RankingClubData {
  titulo: string;
  actualizado: string;
  generos: { M: PruebaRanking[]; F: PruebaRanking[] };
}

interface SectorInfo {
  clave: SectorClave;
  nombre: string;
  icono: string;
}

@Component({
  selector: 'app-ranking-club',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './ranking-club.component.html',
  styleUrls: ['./ranking-club.component.css'],
})
export class RankingClubComponent implements OnInit {
  readonly SECTORES: SectorInfo[] = [
    { clave: 'velocidad', nombre: 'Velocidad y vallas', icono: 'fa-bolt' },
    { clave: 'medio_fondo', nombre: 'Medio y fondo', icono: 'fa-person-running' },
    { clave: 'ruta_marcha', nombre: 'Ruta y marcha', icono: 'fa-road' },
    { clave: 'saltos', nombre: 'Saltos', icono: 'fa-arrow-up-long' },
    { clave: 'lanzamientos', nombre: 'Lanzamientos', icono: 'fa-dumbbell' },
    { clave: 'combinadas', nombre: 'Pruebas combinadas', icono: 'fa-layer-group' },
  ];

  data: RankingClubData | null = null;
  cargando = true;
  error = false;

  genero: 'M' | 'F' = 'M';
  sectorActual: SectorClave = 'velocidad';
  pruebaSeleccionada: PruebaRanking | null = null;

  constructor(private http: HttpClient) {}

  ngOnInit(): void {
    this.http.get<RankingClubData>('assets/ranking-club.json').subscribe({
      next: (d) => {
        this.data = d;
        this.cargando = false;
        this.setSector(this.sectorActual);
      },
      error: () => { this.error = true; this.cargando = false; },
    });
  }

  get pruebas(): PruebaRanking[] {
    return this.data ? this.data.generos[this.genero] : [];
  }

  pruebasDelSector(clave: SectorClave): PruebaRanking[] {
    return this.pruebas.filter(p => p.sector === clave);
  }

  sectorTienePruebas(clave: SectorClave): boolean {
    return this.pruebasDelSector(clave).length > 0;
  }

  setGenero(g: 'M' | 'F'): void {
    if (this.genero === g) return;
    this.genero = g;
    this.setSector(this.sectorActual);
  }

  setSector(clave: SectorClave): void {
    this.sectorActual = clave;
    const del = this.pruebasDelSector(clave);
    this.pruebaSeleccionada = del[0] ?? null;
  }

  setPrueba(p: PruebaRanking): void {
    this.pruebaSeleccionada = p;
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

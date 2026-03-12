import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

// Coeficientes IAAF 2001 para pruebas combinadas
// Formato: { A, B, C } donde puntos = A * (B - marca)^C para carreras y A * (marca - B)^C para saltos/lanzamientos
const COEFICIENTES_IAAF: { [key: string]: { A: number; B: number; C: number; tipo: 'carrera' | 'salto' | 'lanzamiento' } } = {
  // Carreras masculinas (puntos = A * (B - tiempo)^C)
  '60ml_M': { A: 58.015, B: 11.5, C: 1.81, tipo: 'carrera' },
  '80ml_M': { A: 9.07605, B: 23.0, C: 1.81, tipo: 'carrera' },  // Ajustado según tablas Sub14
  '100ml_M': { A: 25.4347, B: 18.0, C: 1.81, tipo: 'carrera' },
  '200ml_M': { A: 5.8425, B: 38.0, C: 1.81, tipo: 'carrera' },
  '400ml_M': { A: 1.53775, B: 82.0, C: 1.81, tipo: 'carrera' },
  '600ml_M': { A: 0.08713, B: 254.0, C: 1.85, tipo: 'carrera' },
  '800ml_M': { A: 0.11193, B: 254.0, C: 1.85, tipo: 'carrera' },
  '1000ml_M': { A: 0.08713, B: 305.5, C: 1.85, tipo: 'carrera' },
  '1500ml_M': { A: 0.03768, B: 480.0, C: 1.85, tipo: 'carrera' },
  
  // Vallas masculinas
  '60mv_M': { A: 20.5173, B: 15.5, C: 1.92, tipo: 'carrera' },
  '80mv_M': { A: 9.23076, B: 26.7, C: 1.835, tipo: 'carrera' },  // Ajustado según tablas oficiales Sub14
  '100mv_M': { A: 5.74352, B: 28.5, C: 1.92, tipo: 'carrera' },
  '110mv_M': { A: 5.74352, B: 28.5, C: 1.92, tipo: 'carrera' },
  
  // Saltos masculinos (puntos = A * (marca_cm - B)^C)
  'Altura_M': { A: 0.8465, B: 75.0, C: 1.42, tipo: 'salto' },
  'Pertiga_M': { A: 0.2797, B: 100.0, C: 1.35, tipo: 'salto' },
  'Longitud_M': { A: 0.14354, B: 220.0, C: 1.40, tipo: 'salto' },
  'Triple_M': { A: 0.06533, B: 640.0, C: 1.40, tipo: 'salto' },
  
  // Lanzamientos masculinos (puntos = A * (marca_m - B)^C)
  'Peso_M': { A: 51.39, B: 1.5, C: 1.05, tipo: 'lanzamiento' },
  'Disco_M': { A: 12.91, B: 4.0, C: 1.10, tipo: 'lanzamiento' },
  'Jabalina_M': { A: 10.14, B: 7.0, C: 1.08, tipo: 'lanzamiento' },
  'Martillo_M': { A: 13.0449, B: 5.0, C: 1.05, tipo: 'lanzamiento' },
  
  // Carreras femeninas
  '60ml_F': { A: 46.0849, B: 13.0, C: 1.81, tipo: 'carrera' },
  '80ml_F': { A: 25.4347, B: 17.0, C: 1.81, tipo: 'carrera' },
  '100ml_F': { A: 17.857, B: 21.0, C: 1.81, tipo: 'carrera' },
  '200ml_F': { A: 4.99087, B: 42.5, C: 1.81, tipo: 'carrera' },
  '400ml_F': { A: 1.34285, B: 91.7, C: 1.81, tipo: 'carrera' },
  '600ml_F': { A: 0.00658, B: 305.5, C: 1.88, tipo: 'carrera' },
  '800ml_F': { A: 0.11193, B: 254.0, C: 1.88, tipo: 'carrera' },
  '1000ml_F': { A: 0.06601, B: 340.0, C: 1.85, tipo: 'carrera' },
  '1500ml_F': { A: 0.02883, B: 535.0, C: 1.88, tipo: 'carrera' },
  
  // Vallas femeninas
  '60mv_F': { A: 20.0479, B: 17.0, C: 1.835, tipo: 'carrera' },
  '80mv_F': { A: 8.99067, B: 27.0, C: 1.835, tipo: 'carrera' },
  '100mv_F': { A: 9.23076, B: 26.7, C: 1.835, tipo: 'carrera' },
  
  // Saltos femeninos
  'Altura_F': { A: 1.84523, B: 75.0, C: 1.348, tipo: 'salto' },
  'Pertiga_F': { A: 0.44125, B: 100.0, C: 1.35, tipo: 'salto' },
  'Longitud_F': { A: 0.188807, B: 210.0, C: 1.41, tipo: 'salto' },
  'Triple_F': { A: 0.08559, B: 600.0, C: 1.41, tipo: 'salto' },
  
  // Lanzamientos femeninos
  'Peso_F': { A: 56.0211, B: 1.5, C: 1.05, tipo: 'lanzamiento' },
  'Disco_F': { A: 12.3311, B: 3.0, C: 1.10, tipo: 'lanzamiento' },
  'Jabalina_F': { A: 15.9803, B: 3.8, C: 1.04, tipo: 'lanzamiento' },
  'Martillo_F': { A: 17.5458, B: 3.0, C: 1.05, tipo: 'lanzamiento' },
};

// Configuración de pruebas combinadas
interface PruebaCombinada {
  nombre: string;
  nombreDisplay: string;
  tipoPrueba: 'carrera' | 'salto' | 'lanzamiento';
  placeholder: string;
}

interface CombibnadaConfig {
  nombre: string;
  genero: 'M' | 'F';
  categoria: string;
  pruebas: PruebaCombinada[];
}

const COMBINADAS: CombibnadaConfig[] = [
  // Decatlón
  {
    nombre: 'Decatlón',
    genero: 'M',
    categoria: 'Absoluto',
    pruebas: [
      { nombre: '100ml', nombreDisplay: '100m Lisos', tipoPrueba: 'carrera', placeholder: '11.50' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '6.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (7.26kg)', tipoPrueba: 'lanzamiento', placeholder: '12.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.85' },
      { nombre: '400ml', nombreDisplay: '400m Lisos', tipoPrueba: 'carrera', placeholder: '52.00' },
      { nombre: '110mv', nombreDisplay: '110m Vallas (1.06m)', tipoPrueba: 'carrera', placeholder: '16.00' },
      { nombre: 'Disco', nombreDisplay: 'Lanzamiento de Disco (2kg)', tipoPrueba: 'lanzamiento', placeholder: '35.00' },
      { nombre: 'Pertiga', nombreDisplay: 'Salto con Pértiga', tipoPrueba: 'salto', placeholder: '4.00' },
      { nombre: 'Jabalina', nombreDisplay: 'Lanzamiento de Jabalina (800g)', tipoPrueba: 'lanzamiento', placeholder: '50.00' },
      { nombre: '1500ml', nombreDisplay: '1500m Lisos', tipoPrueba: 'carrera', placeholder: '4:30.00' }
    ]
  },
  {
    nombre: 'Decatlón Sub20',
    genero: 'M',
    categoria: 'Sub20',
    pruebas: [
      { nombre: '100ml', nombreDisplay: '100m Lisos', tipoPrueba: 'carrera', placeholder: '11.50' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '6.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (5kg)', tipoPrueba: 'lanzamiento', placeholder: '12.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.85' },
      { nombre: '400ml', nombreDisplay: '400m Lisos', tipoPrueba: 'carrera', placeholder: '52.00' },
      { nombre: '100mv', nombreDisplay: '100m Vallas (0.91m)', tipoPrueba: 'carrera', placeholder: '14.50' },
      { nombre: 'Disco', nombreDisplay: 'Lanzamiento de Disco (1kg)', tipoPrueba: 'lanzamiento', placeholder: '35.00' },
      { nombre: 'Pertiga', nombreDisplay: 'Salto con Pértiga', tipoPrueba: 'salto', placeholder: '4.00' },
      { nombre: 'Jabalina', nombreDisplay: 'Lanzamiento de Jabalina (700g)', tipoPrueba: 'lanzamiento', placeholder: '50.00' },
      { nombre: '1500ml', nombreDisplay: '1500m Lisos', tipoPrueba: 'carrera', placeholder: '4:30.00' }
    ]
  },
  {
    nombre: 'Decatlón Sub18',
    genero: 'M',
    categoria: 'Sub18',
    pruebas: [
      { nombre: '100ml', nombreDisplay: '100m Lisos', tipoPrueba: 'carrera', placeholder: '11.50' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '6.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (5kg)', tipoPrueba: 'lanzamiento', placeholder: '12.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.85' },
      { nombre: '400ml', nombreDisplay: '400m Lisos', tipoPrueba: 'carrera', placeholder: '52.00' },
      { nombre: '100mv', nombreDisplay: '100m Vallas (0.91m)', tipoPrueba: 'carrera', placeholder: '14.50' },
      { nombre: 'Disco', nombreDisplay: 'Lanzamiento de Disco (1kg)', tipoPrueba: 'lanzamiento', placeholder: '35.00' },
      { nombre: 'Pertiga', nombreDisplay: 'Salto con Pértiga', tipoPrueba: 'salto', placeholder: '4.00' },
      { nombre: 'Jabalina', nombreDisplay: 'Lanzamiento de Jabalina (700g)', tipoPrueba: 'lanzamiento', placeholder: '50.00' },
      { nombre: '1500ml', nombreDisplay: '1500m Lisos', tipoPrueba: 'carrera', placeholder: '4:30.00' }
    ]
  },
  // Octatlón Sub16
  {
    nombre: 'Octatlón Sub16',
    genero: 'M',
    categoria: 'Sub16',
    pruebas: [
      { nombre: '100ml', nombreDisplay: '100m Lisos', tipoPrueba: 'carrera', placeholder: '12.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (4kg)', tipoPrueba: 'lanzamiento', placeholder: '10.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.60' },
      { nombre: 'Disco', nombreDisplay: 'Lanzamiento de Disco (1kg)', tipoPrueba: 'lanzamiento', placeholder: '30.00' },
      { nombre: '100mv', nombreDisplay: '100m Vallas (0.91m)', tipoPrueba: 'carrera', placeholder: '15.00' },
      { nombre: 'Pertiga', nombreDisplay: 'Salto con Pértiga', tipoPrueba: 'salto', placeholder: '3.00' },
      { nombre: '1000ml', nombreDisplay: '1000m Lisos', tipoPrueba: 'carrera', placeholder: '3:10.00' }
    ]
  },
  // Heptatlón Masculino (PC)
  {
    nombre: 'Heptatlón Masculino',
    genero: 'M',
    categoria: 'Absoluto',
    pruebas: [
      { nombre: '60ml', nombreDisplay: '60m Lisos', tipoPrueba: 'carrera', placeholder: '7.20' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '7.00' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (7.26kg)', tipoPrueba: 'lanzamiento', placeholder: '14.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '2.00' },
      { nombre: '60mv', nombreDisplay: '60m Vallas (1.06m)', tipoPrueba: 'carrera', placeholder: '8.00' },
      { nombre: 'Pertiga', nombreDisplay: 'Salto con Pértiga', tipoPrueba: 'salto', placeholder: '4.80' },
      { nombre: '1000ml', nombreDisplay: '1000m Lisos', tipoPrueba: 'carrera', placeholder: '2:45.00' }
    ]
  },
  {
    nombre: 'Heptatlón Masculino Sub20',
    genero: 'M',
    categoria: 'Sub20',
    pruebas: [
      { nombre: '60ml', nombreDisplay: '60m Lisos', tipoPrueba: 'carrera', placeholder: '7.50' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '6.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (5kg)', tipoPrueba: 'lanzamiento', placeholder: '12.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.85' },
      { nombre: '60mv', nombreDisplay: '60m Vallas (0.91m)', tipoPrueba: 'carrera', placeholder: '8.50' },
      { nombre: 'Pertiga', nombreDisplay: 'Salto con Pértiga', tipoPrueba: 'salto', placeholder: '4.00' },
      { nombre: '1000ml', nombreDisplay: '1000m Lisos', tipoPrueba: 'carrera', placeholder: '2:55.00' }
    ]
  },
  {
    nombre: 'Heptatlón Masculino Sub18',
    genero: 'M',
    categoria: 'Sub18',
    pruebas: [
      { nombre: '60ml', nombreDisplay: '60m Lisos', tipoPrueba: 'carrera', placeholder: '7.50' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '6.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (5kg)', tipoPrueba: 'lanzamiento', placeholder: '12.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.85' },
      { nombre: '60mv', nombreDisplay: '60m Vallas (0.91m)', tipoPrueba: 'carrera', placeholder: '8.50' },
      { nombre: 'Pertiga', nombreDisplay: 'Salto con Pértiga', tipoPrueba: 'salto', placeholder: '4.00' },
      { nombre: '1000ml', nombreDisplay: '1000m Lisos', tipoPrueba: 'carrera', placeholder: '2:55.00' }
    ]
  },
  // Heptatlón Femenino (AL)
  {
    nombre: 'Heptatlón',
    genero: 'F',
    categoria: 'Absoluto',
    pruebas: [
      { nombre: '100mv', nombreDisplay: '100m Vallas (0.84m)', tipoPrueba: 'carrera', placeholder: '14.50' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.75' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (4kg)', tipoPrueba: 'lanzamiento', placeholder: '12.00' },
      { nombre: '200ml', nombreDisplay: '200m Lisos', tipoPrueba: 'carrera', placeholder: '25.00' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '5.80' },
      { nombre: 'Jabalina', nombreDisplay: 'Lanzamiento de Jabalina (600g)', tipoPrueba: 'lanzamiento', placeholder: '40.00' },
      { nombre: '800ml', nombreDisplay: '800m Lisos', tipoPrueba: 'carrera', placeholder: '2:15.00' }
    ]
  },
  {
    nombre: 'Heptatlón Sub18',
    genero: 'F',
    categoria: 'Sub18',
    pruebas: [
      { nombre: '100mv', nombreDisplay: '100m Vallas (0.76m)', tipoPrueba: 'carrera', placeholder: '15.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.60' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (3kg)', tipoPrueba: 'lanzamiento', placeholder: '10.00' },
      { nombre: '200ml', nombreDisplay: '200m Lisos', tipoPrueba: 'carrera', placeholder: '26.00' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '5.20' },
      { nombre: 'Jabalina', nombreDisplay: 'Lanzamiento de Jabalina (500g)', tipoPrueba: 'lanzamiento', placeholder: '35.00' },
      { nombre: '800ml', nombreDisplay: '800m Lisos', tipoPrueba: 'carrera', placeholder: '2:25.00' }
    ]
  },
  // Hexatlón
  {
    nombre: 'Hexatlón Sub16',
    genero: 'M',
    categoria: 'Sub16',
    pruebas: [
      { nombre: '60ml', nombreDisplay: '60m Lisos', tipoPrueba: 'carrera', placeholder: '8.00' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '5.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (4kg)', tipoPrueba: 'lanzamiento', placeholder: '10.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.60' },
      { nombre: '60mv', nombreDisplay: '60m Vallas (0.91m)', tipoPrueba: 'carrera', placeholder: '9.00' },
      { nombre: '1000ml', nombreDisplay: '1000m Lisos', tipoPrueba: 'carrera', placeholder: '3:10.00' }
    ]
  },
  {
    nombre: 'Hexatlón Sub14',
    genero: 'M',
    categoria: 'Sub14',
    pruebas: [
      { nombre: '80ml', nombreDisplay: '80m Lisos', tipoPrueba: 'carrera', placeholder: '10.50' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '4.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (3kg)', tipoPrueba: 'lanzamiento', placeholder: '8.00' },
      { nombre: '80mv', nombreDisplay: '80m Vallas (0.76m)', tipoPrueba: 'carrera', placeholder: '13.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.40' },
      { nombre: 'Jabalina', nombreDisplay: 'Lanzamiento de Jabalina (400g)', tipoPrueba: 'lanzamiento', placeholder: '30.00' }
    ]
  },
  {
    nombre: 'Hexatlón Femenino Sub16',
    genero: 'F',
    categoria: 'Sub16',
    pruebas: [
      { nombre: '100mv', nombreDisplay: '100m Vallas (0.76m)', tipoPrueba: 'carrera', placeholder: '15.50' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (3kg)', tipoPrueba: 'lanzamiento', placeholder: '9.00' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '4.80' },
      { nombre: 'Jabalina', nombreDisplay: 'Lanzamiento de Jabalina (500g)', tipoPrueba: 'lanzamiento', placeholder: '30.00' },
      { nombre: '600ml', nombreDisplay: '600m Lisos', tipoPrueba: 'carrera', placeholder: '1:50.00' }
    ]
  },
  // Pentatlón
  {
    nombre: 'Pentatlón',
    genero: 'F',
    categoria: 'Absoluto',
    pruebas: [
      { nombre: '60mv', nombreDisplay: '60m Vallas (0.84m)', tipoPrueba: 'carrera', placeholder: '8.50' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.75' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (4kg)', tipoPrueba: 'lanzamiento', placeholder: '12.00' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '5.80' },
      { nombre: '800ml', nombreDisplay: '800m Lisos', tipoPrueba: 'carrera', placeholder: '2:15.00' }
    ]
  },
  {
    nombre: 'Pentatlón Sub18',
    genero: 'F',
    categoria: 'Sub18',
    pruebas: [
      { nombre: '60mv', nombreDisplay: '60m Vallas (0.76m)', tipoPrueba: 'carrera', placeholder: '9.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.55' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (3kg)', tipoPrueba: 'lanzamiento', placeholder: '10.00' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '5.00' },
      { nombre: '800ml', nombreDisplay: '800m Lisos', tipoPrueba: 'carrera', placeholder: '2:25.00' }
    ]
  },
  {
    nombre: 'Pentatlón Femenino Sub16',
    genero: 'F',
    categoria: 'Sub16',
    pruebas: [
      { nombre: '60mv', nombreDisplay: '60m Vallas (0.76m)', tipoPrueba: 'carrera', placeholder: '9.50' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.45' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (3kg)', tipoPrueba: 'lanzamiento', placeholder: '9.00' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '4.50' },
      { nombre: '600ml', nombreDisplay: '600m Lisos', tipoPrueba: 'carrera', placeholder: '1:55.00' }
    ]
  },
  {
    nombre: 'Pentatlón Masculino Sub14',
    genero: 'M',
    categoria: 'Sub14',
    pruebas: [
      { nombre: '60ml', nombreDisplay: '60m Lisos', tipoPrueba: 'carrera', placeholder: '8.50' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '4.50' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (3kg)', tipoPrueba: 'lanzamiento', placeholder: '8.00' },
      { nombre: 'Altura', nombreDisplay: 'Salto de Altura', tipoPrueba: 'salto', placeholder: '1.40' },
      { nombre: '60mv', nombreDisplay: '60m Vallas (0.84m)', tipoPrueba: 'carrera', placeholder: '10.00' }
    ]
  },
  // Tetratlon
  {
    nombre: 'Tetratlon Femenino Sub14',
    genero: 'F',
    categoria: 'Sub14',
    pruebas: [
      { nombre: '60mv', nombreDisplay: '60m Vallas (0.76m)', tipoPrueba: 'carrera', placeholder: '10.00' },
      { nombre: 'Peso', nombreDisplay: 'Lanzamiento de Peso (3kg)', tipoPrueba: 'lanzamiento', placeholder: '8.00' },
      { nombre: 'Longitud', nombreDisplay: 'Salto de Longitud', tipoPrueba: 'salto', placeholder: '4.20' },
      { nombre: '60ml', nombreDisplay: '60m Lisos', tipoPrueba: 'carrera', placeholder: '8.50' }
    ]
  }
];

interface MarcaInput {
  valor: string;
  puntos: number;
}

@Component({
  selector: 'app-calculadora-combinadas',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './calculadora-combinadas.component.html',
  styleUrls: ['./calculadora-combinadas.component.css']
})
export class CalculadoraCombinadasComponent implements OnInit {
  combinadas = COMBINADAS;
  combinadaSeleccionada: CombibnadaConfig | null = null;
  marcas: MarcaInput[] = [];
  puntuacionTotal = 0;

  // Filtros
  generoFiltro: 'todos' | 'M' | 'F' = 'todos';
  categoriaFiltro: string = 'todos';

  get categorias(): string[] {
    const cats = new Set<string>();
    this.combinadas.forEach(c => cats.add(c.categoria));
    return Array.from(cats);
  }

  get combinadasFiltradas(): CombibnadaConfig[] {
    return this.combinadas.filter(c => {
      const cumpleGenero = this.generoFiltro === 'todos' || c.genero === this.generoFiltro;
      const cumpleCategoria = this.categoriaFiltro === 'todos' || c.categoria === this.categoriaFiltro;
      return cumpleGenero && cumpleCategoria;
    });
  }

  ngOnInit(): void {}

  seleccionarCombinada(combinada: CombibnadaConfig): void {
    this.combinadaSeleccionada = combinada;
    this.marcas = combinada.pruebas.map(() => ({ valor: '', puntos: 0 }));
    this.puntuacionTotal = 0;
  }

  volver(): void {
    this.combinadaSeleccionada = null;
    this.marcas = [];
    this.puntuacionTotal = 0;
  }

  calcularPuntos(index: number): void {
    if (!this.combinadaSeleccionada) return;
    
    const prueba = this.combinadaSeleccionada.pruebas[index];
    const marca = this.marcas[index];
    
    if (!marca.valor || marca.valor.trim() === '') {
      marca.puntos = 0;
      this.calcularTotal();
      return;
    }

    const puntos = this.calcularPuntosPrueba(
      prueba.nombre,
      marca.valor,
      prueba.tipoPrueba,
      this.combinadaSeleccionada.genero
    );
    
    marca.puntos = puntos;
    this.calcularTotal();
  }

  private calcularPuntosPrueba(
    nombrePrueba: string,
    valorMarca: string,
    tipoPrueba: 'carrera' | 'salto' | 'lanzamiento',
    genero: 'M' | 'F'
  ): number {
    // Normalizar nombre de prueba para buscar coeficientes
    const nombreNormalizado = nombrePrueba.replace(/\([^)]*\)/g, '').trim();
    const claveCoef = `${nombreNormalizado}_${genero}`;
    
    const coef = COEFICIENTES_IAAF[claveCoef];
    if (!coef) {
      console.warn(`No se encontraron coeficientes para: ${claveCoef}`);
      return 0;
    }

    let marcaEnUnidad: number;

    if (tipoPrueba === 'carrera') {
      // Convertir tiempo a segundos
      marcaEnUnidad = this.parseTime(valorMarca);
      if (marcaEnUnidad <= 0) return 0;
      
      // Para carreras: puntos = A * (B - tiempo)^C
      const diferencia = coef.B - marcaEnUnidad;
      if (diferencia <= 0) return 0;
      
      return Math.floor(coef.A * Math.pow(diferencia, coef.C));
    } else if (tipoPrueba === 'salto') {
      // Metros a centímetros
      marcaEnUnidad = parseFloat(valorMarca.replace(',', '.')) * 100;
      if (isNaN(marcaEnUnidad) || marcaEnUnidad <= 0) return 0;
      
      // Para saltos: puntos = A * (marca_cm - B)^C
      const diferencia = marcaEnUnidad - coef.B;
      if (diferencia <= 0) return 0;
      
      return Math.floor(coef.A * Math.pow(diferencia, coef.C));
    } else {
      // Lanzamientos en metros
      marcaEnUnidad = parseFloat(valorMarca.replace(',', '.'));
      if (isNaN(marcaEnUnidad) || marcaEnUnidad <= 0) return 0;
      
      // Para lanzamientos: puntos = A * (marca_m - B)^C
      const diferencia = marcaEnUnidad - coef.B;
      if (diferencia <= 0) return 0;
      
      return Math.floor(coef.A * Math.pow(diferencia, coef.C));
    }
  }

  private parseTime(timeStr: string): number {
    // Formatos: "11.50" (segundos), "1:30.50" (min:seg), "4:30.00" (min:seg)
    const partes = timeStr.split(':');
    
    if (partes.length === 1) {
      // Solo segundos
      return parseFloat(partes[0].replace(',', '.'));
    } else if (partes.length === 2) {
      // Minutos:Segundos
      const minutos = parseInt(partes[0], 10);
      const segundos = parseFloat(partes[1].replace(',', '.'));
      return minutos * 60 + segundos;
    } else if (partes.length === 3) {
      // Horas:Minutos:Segundos
      const horas = parseInt(partes[0], 10);
      const minutos = parseInt(partes[1], 10);
      const segundos = parseFloat(partes[2].replace(',', '.'));
      return horas * 3600 + minutos * 60 + segundos;
    }
    
    return 0;
  }

  private calcularTotal(): void {
    this.puntuacionTotal = this.marcas.reduce((sum, m) => sum + m.puntos, 0);
  }

  limpiarTodo(): void {
    this.marcas.forEach(m => {
      m.valor = '';
      m.puntos = 0;
    });
    this.puntuacionTotal = 0;
  }

  getGeneroLabel(genero: 'M' | 'F'): string {
    return genero === 'M' ? 'Masculino' : 'Femenino';
  }

  getGeneroIcon(genero: 'M' | 'F'): string {
    return genero === 'M' ? 'fa-mars' : 'fa-venus';
  }

  getTipoPruebaIcon(tipo: 'carrera' | 'salto' | 'lanzamiento'): string {
    switch (tipo) {
      case 'carrera': return 'fa-running';
      case 'salto': return 'fa-arrow-up';
      case 'lanzamiento': return 'fa-bullseye';
      default: return 'fa-circle';
    }
  }

  getInputLabel(tipoPrueba: 'carrera' | 'salto' | 'lanzamiento'): string {
    switch (tipoPrueba) {
      case 'carrera': return 'Tiempo';
      case 'salto': return 'Metros';
      case 'lanzamiento': return 'Metros';
    }
  }
}

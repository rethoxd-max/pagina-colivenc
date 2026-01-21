import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

// Interfaces según la nueva estructura de la base de datos
export interface Atleta {
  _id: string;
  nombre: string;
  slug?: string;
  fecha_nacimiento: Date;
  genero: 'Masculino' | 'Femenino';
  usuario?: {
    _id: string;
    name: string;
  };
}

export interface Prueba {
  _id: string;
  nombre_prueba: string;
  sector_id: Sector;
}

export interface Sector {
  _id: string;
  nombre_sector: string;
}

export interface Categoria {
  _id: string;
  nombre_categoria: string;
}

export interface Marca {
  _id: string;
  nombre_atleta: Atleta;
  nombre_prueba: Prueba;
  horas: number;
  minutos: number;
  segundos: number;
  metros: number;
  puntos: number;
  lugar: string;
  viento: number;
  comentario: string;
  categoria: Categoria;
  anyo: number;
  PcAL: PcAL;
  fecha_realizacion: String;
}

export interface PcAL {
  _id: string;
  PcAL: string;
}

@Injectable({
  providedIn: 'root'
})
export class PerfilAtletaService {

  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  // Obtener todas las pruebas
  getPruebas(): Observable<Prueba[]> {
    return this.http.get<Prueba[]>(`${this.apiUrl}/pruebas`);
  }

  getPruebasPorAtleta(atletaId: string): Observable<Prueba[]> {
    return this.http.get<Prueba[]>(`${this.apiUrl}/perfil-atleta/pruebas/atleta/${atletaId}`);
  }

  getPruebasPorAtletaYAnyo(atletaId: string, anyo: number): Observable<Prueba[]> {
    return this.http.get<Prueba[]>(`${this.apiUrl}/perfil-atleta/pruebas/atleta/${atletaId}/anyo/${anyo}`);
  }

  // Obtener todos los sectores
  getSectores(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.apiUrl}/sectores`);
  }

  // Obtener todos los atletas
  getAtletas(): Observable<Atleta[]> {
    return this.http.get<Atleta[]>(`${this.apiUrl}/atletas`);
  }

  getAtletaByUserId(userId: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/atletas/usuario/${userId}`);
  }

  getAtletaById(atletaId: string): Observable<Atleta> {
    return this.http.get<Atleta>(`${this.apiUrl}/atletas/${atletaId}`);
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`);
  }

  getCategoriaById(categoriaId: string): Observable<Categoria> {
    return this.http.get<Categoria>(`${this.apiUrl}/categorias/${categoriaId}`);
  }

  getPcAL(): Observable<PcAL[]> {
    return this.http.get<PcAL[]>(`${this.apiUrl}/PcAL`);
  }

  getPcALById(PcALId: string): Observable<PcAL> {
    return this.http.get<PcAL>(`${this.apiUrl}/PcAL/${PcALId}`);
  }

  getMarcasByAtletaId(atletaId: string): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/perfil-atleta/marcas/atleta/${atletaId}`);
  }

  // ==================== ENDPOINTS OPTIMIZADOS ====================
  
  // Obtener todas las mejores marcas del atleta en una sola llamada
  getMejoresMarcasOptimizado(atletaId: string): Observable<{ mejoresMarcas: Marca[], mejoresMarcasIlegales: { [key: string]: Marca } }> {
    return this.http.get<{ mejoresMarcas: Marca[], mejoresMarcasIlegales: { [key: string]: Marca } }>(
      `${this.apiUrl}/perfil-atleta/mejores-marcas/atleta/${atletaId}`
    );
  }

  // Obtener todas las mejores marcas del atleta por año en una sola llamada
  getMejoresMarcasPorAnyoOptimizado(atletaId: string, anyo: number): Observable<{ mejoresMarcas: Marca[], mejoresMarcasIlegales: { [key: string]: Marca } }> {
    return this.http.get<{ mejoresMarcas: Marca[], mejoresMarcasIlegales: { [key: string]: Marca } }>(
      `${this.apiUrl}/perfil-atleta/mejores-marcas/atleta/${atletaId}/anyo/${anyo}`
    );
  }

  // Obtener todas las marcas del atleta por año agrupadas por prueba
  getTodasMarcasPorAnyoOptimizado(atletaId: string, anyo: number): Observable<{ marcasPorPrueba: { [key: string]: Marca[] } }> {
    return this.http.get<{ marcasPorPrueba: { [key: string]: Marca[] } }>(
      `${this.apiUrl}/perfil-atleta/todas-marcas/atleta/${atletaId}/anyo/${anyo}`
    );
  }

  // Obtener datos de progresión: mejores marcas por prueba y año en una sola llamada
  getProgresionOptimizado(atletaId: string): Observable<{ 
    marcasPorPruebaAnyo: { [key: string]: Marca }, 
    marcasIlegalesPorPruebaAnyo: { [key: string]: Marca } 
  }> {
    return this.http.get<{ 
      marcasPorPruebaAnyo: { [key: string]: Marca }, 
      marcasIlegalesPorPruebaAnyo: { [key: string]: Marca } 
    }>(`${this.apiUrl}/perfil-atleta/progresion/atleta/${atletaId}`);
  }

  // ==================== FIN ENDPOINTS OPTIMIZADOS ====================

  // 1. Obtener la mejor marca por prueba de cada atleta
  getMejorMarcaPorPrueba(atletaId: string, pruebaId: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca/prueba/${pruebaId}/atleta/${atletaId}`);
  }

  // 2. Obtener la mejor marca por prueba y categoría de cada atleta
  getMejorMarcaPorPruebaYCategoria(atletaId: string, pruebaId: string, categoriaId: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca/prueba/${pruebaId}/categoria/${categoriaId}/atleta/${atletaId}`);
  }

  // Obtener la mejor marca por prueba y PcAL de cada atleta
  getMejorMarcaPorPruebaYPcAL(atletaId: string, pruebaId: string, PcALId: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca/prueba/${pruebaId}/PcAL/${PcALId}/atleta/${atletaId}`);
  }

  // 3. Obtener la mejor marca por prueba, categoría y PcAL de cada atleta
  getMejorMarcaPorPruebaCategoriaPcAL(atletaId: string, pruebaId: string, categoriaId: string, PcALId: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca/prueba/${pruebaId}/categoria/${categoriaId}/PcAL/${PcALId}/atleta/${atletaId}`);
  }

  // 4. Obtener la mejor marca por prueba de cada atleta, filtrando por año
  getMejorMarcaPorPruebaYAnyo(atletaId: string, pruebaId: string, anyo: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca/prueba/${pruebaId}/anyo/${anyo}/atleta/${atletaId}`);
  }

  // 5. Obtener la mejor marca por prueba, categoría de cada atleta, filtrando por año
  getMejorMarcaPorPruebaCategoriaYAnyo(atletaId: string, pruebaId: string, categoriaId: string, anyo: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca/prueba/${pruebaId}/categoria/${categoriaId}/anyo/${anyo}/atleta/${atletaId}`);
  }

  // 5. Obtener la mejor marca por prueba y PcAL, filtrando por año
  getMejorMarcaPorPruebaPcALYAnyo(atletaId: string, pruebaId: string, PcAlId: string, anyo: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca/prueba/${pruebaId}/PcAL/${PcAlId}/anyo/${anyo}/atleta/${atletaId}`);
  }

  // 6. Obtener la mejor marca por prueba, categoría, PcAL de cada atleta, filtrando por año
  getMejorMarcaPorPruebaCategoriaPcALYAnyo(atletaId: string, pruebaId: string, categoriaId: string, PcALId: string, anyo: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca/prueba/${pruebaId}/categoria/${categoriaId}/PcAL/${PcALId}/anyo/${anyo}/atleta/${atletaId}`);
  }

  getAllMarcasPorAnyoYPrueba(atletaId: string, pruebaId: string, anyo: number): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/perfil-atleta/marcas/prueba/${pruebaId}/anyo/${anyo}/atleta/${atletaId}`);
  }

  // Obtener la mejor marca con viento legal por prueba de cada atleta
  getMejorMarcaLegalPorPrueba(atletaId: string, pruebaId: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca-legal/prueba/${pruebaId}/atleta/${atletaId}`);
  }

  // Obtener la mejor marca con viento legal por prueba y categoría de cada atleta
  getMejorMarcaLegalPorPruebaYCategoria(atletaId: string, pruebaId: string, categoriaId: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca-legal/prueba/${pruebaId}/categoria/${categoriaId}/atleta/${atletaId}`);
  }

  // Obtener la mejor marca con viento legal por prueba y PcAL de cada atleta
  getMejorMarcaLegalPorPruebaYPcAL(atletaId: string, pruebaId: string, PcALId: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca-legal/prueba/${pruebaId}/PcAL/${PcALId}/atleta/${atletaId}`);
  }

  // Obtener la mejor marca con viento legal por prueba, categoría y PcAL de cada atleta
  getMejorMarcaLegalPorPruebaCategoriaPcAL(atletaId: string, pruebaId: string, categoriaId: string, PcALId: string): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca-legal/prueba/${pruebaId}/categoria/${categoriaId}/PcAL/${PcALId}/atleta/${atletaId}`);
  }

  // Obtener la mejor marca con viento legal por prueba y año de cada atleta
  getMejorMarcaLegalPorPruebaYAnyo(atletaId: string, pruebaId: string, anyo: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca-legal/prueba/${pruebaId}/anyo/${anyo}/atleta/${atletaId}`);
  }

  // Obtener la mejor marca con viento legal por prueba, PcAL y año de cada atleta
  getMejorMarcaLegalPorPruebaPcALYAnyo(atletaId: string, pruebaId: string, PcALId: string, anyo: number): Observable<Marca> {
    return this.http.get<Marca>(`${this.apiUrl}/perfil-atleta/mejor-marca-legal/prueba/${pruebaId}/PcAL/${PcALId}/anyo/${anyo}/atleta/${atletaId}`);
  }

}


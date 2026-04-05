import { Injectable } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
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

export interface LugarConocido {
  nombre: string;
  pcAL: 'PC' | 'AL';
  totalMarcas: number;
  variantes?: { pcAL: string; count: number }[];
}

@Injectable({
  providedIn: 'root'
})
export class RankingService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  postAtleta(atleta: Atleta): Observable<Atleta> {
    return this.http.post<Atleta>(`${this.apiUrl}/atletas`, atleta);
  }

  postPrueba(prueba: Prueba): Observable<Prueba> {
    return this.http.post<Prueba>(`${this.apiUrl}/pruebas`, prueba);
  }

  postMarca(marca: Marca): Observable<Marca> {
    return this.http.post<Marca>(`${this.apiUrl}/marcas`, marca);
  }
  // Obtener el ranking completo (posiblemente filtrado y combinado)
  getRanking(): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking`);
  }

  // Obtener todas las pruebas
  getPruebas(): Observable<Prueba[]> {
    return this.http.get<Prueba[]>(`${this.apiUrl}/pruebas`);
  }

  getPruebasPorSector(sector: string): Observable<Prueba[]> {
    return this.http.get<Prueba[]>(`${this.apiUrl}/pruebas/sector/${sector}`);
  }

  // Obtener todos los sectores
  getSectores(): Observable<Sector[]> {
    return this.http.get<Sector[]>(`${this.apiUrl}/sectores`);
  }

  // Obtener sectores que tienen marcas para una categoría específica
  getSectoresPorCategoria(categoriaId: string, genero?: string): Observable<Sector[]> {
    let params = new HttpParams();
    if (genero) {
      params = params.set('genero', genero);
    }
    return this.http.get<Sector[]>(`${this.apiUrl}/sectores/por-categoria/${categoriaId}`, { params });
  }

  // Obtener pruebas que tienen marcas para una categoría y sector específicos
  getPruebasPorCategoriaYSector(categoriaId: string, sectorId: string, genero?: string): Observable<Prueba[]> {
    let params = new HttpParams();
    if (genero) {
      params = params.set('genero', genero);
    }
    return this.http.get<Prueba[]>(`${this.apiUrl}/pruebas/por-categoria-sector/${categoriaId}/${sectorId}`, { params });
  }

  // Obtener todos los atletas
  getAtletas(): Observable<Atleta[]> {
    return this.http.get<Atleta[]>(`${this.apiUrl}/atletas`);
  }

  // Obtener lugares conocidos de las marcas existentes
  getLugaresConocidos(): Observable<LugarConocido[]> {
    return this.http.get<LugarConocido[]>(`${this.apiUrl}/marcas/lugares`);
  }

  // Obtener atletas por género
  getAtletasPorGenero(genero: string): Observable<Atleta[]> {
    return this.http.get<Atleta[]>(`${this.apiUrl}/atletas/genero/${genero}`);
  }

  getAtletaById(atletaId: string): Observable<Atleta> {
    return this.http.get<Atleta>(`${this.apiUrl}/atletas/${atletaId}`);
  }

  // Obtener todas las marcas de un atleta en una prueba específica
  getTodasMarcasAtletaEnPrueba(atletaId: string, pruebaId: string): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/marcas/atleta/${atletaId}/prueba/${pruebaId}`);
  }

  // Obtener todas las marcas para una prueba
  getTodasMarcasPorPrueba(pruebaId: string): Observable<Marca[]> {
    return this.http.get<Marca[]>(`${this.apiUrl}/marcas/prueba/${pruebaId}`);
  }

  // Obtener mejores marcas por prueba
  getMejoresMarcas(pruebaId: string, mostrarSoloMejorMarca: boolean = true): Observable<Marca[]> {
    const params = new HttpParams().set('todasMarcas', (!mostrarSoloMejorMarca).toString());
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking/mejores-marcas/${pruebaId}`, { params });
  }

  // Obtener mejores marcas por prueba y género
  getMejoresMarcasPorGenero(pruebaId: string, genero: string, mostrarSoloMejorMarca: boolean = true): Observable<Marca[]> {
    const params = new HttpParams().set('todasMarcas', (!mostrarSoloMejorMarca).toString());
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking/mejores-marcas/${pruebaId}/genero/${genero}`, { params });
  }

  // Obtener mejores marcas por prueba y PcAL (sin categoría)
  getMejoresMarcasPorPcAL(pruebaId: string, PcALId: string, mostrarSoloMejorMarca: boolean = true): Observable<Marca[]> {
    const params = new HttpParams().set('todasMarcas', (!mostrarSoloMejorMarca).toString());
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking/mejores-marcas/${pruebaId}/pcal/${PcALId}`, { params });
  }

  // Obtener mejores marcas por prueba, PcAL y género (sin categoría)
  getMejoresMarcasPorPcALYGenero(pruebaId: string, PcALId: string, genero: string, mostrarSoloMejorMarca: boolean = true): Observable<Marca[]> {
    const params = new HttpParams().set('todasMarcas', (!mostrarSoloMejorMarca).toString());
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking/mejores-marcas/${pruebaId}/pcal/${PcALId}/genero/${genero}`, { params });
  }

  getMejoresMarcasPorCategoria(pruebaId: string, categoriaId: string, mostrarSoloMejorMarca: boolean = true): Observable<Marca[]> {
    const params = new HttpParams().set('todasMarcas', (!mostrarSoloMejorMarca).toString());
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking/mejores-marcas/${pruebaId}/${categoriaId}`, { params });
  }

  // Obtener mejores marcas por prueba, categoría y género
  getMejoresMarcasPorCategoriaYGenero(pruebaId: string, categoriaId: string, genero: string, mostrarSoloMejorMarca: boolean = true): Observable<Marca[]> {
    const params = new HttpParams().set('todasMarcas', (!mostrarSoloMejorMarca).toString());
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking/mejores-marcas/${pruebaId}/${categoriaId}/genero/${genero}`, { params });
  }

  getMejoresMarcasPorCategoriaYPcAL(pruebaId: string, categoriaId: string, PcALId: string, mostrarSoloMejorMarca: boolean = true): Observable<Marca[]> {
    const params = new HttpParams().set('todasMarcas', (!mostrarSoloMejorMarca).toString());
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking/mejores-marcas/${pruebaId}/${categoriaId}/${PcALId}`, { params });
  }

  // Obtener mejores marcas por prueba, categoría, PcAL y género
  getMejoresMarcasPorCategoriaYPcALYGenero(pruebaId: string, categoriaId: string, PcALId: string, genero: string, mostrarSoloMejorMarca: boolean = true): Observable<Marca[]> {
    const params = new HttpParams().set('todasMarcas', (!mostrarSoloMejorMarca).toString());
    return this.http.get<Marca[]>(`${this.apiUrl}/ranking/mejores-marcas/${pruebaId}/${categoriaId}/${PcALId}/genero/${genero}`, { params });
  }

  getCategorias(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/categorias`);
  }

  // Categorías que tienen al menos una marca en toda la BBDD
  getCategoriasConMarcas(): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/ranking/categorias-con-marcas`);
  }

  // Categorías en las que un atleta concreto tiene al menos una marca
  getCategoriasConMarcasAtleta(atletaId: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/perfil-atleta/categorias-con-marcas/${atletaId}`);
  }

  // Obtener categorías disponibles para una prueba (solo las que tienen marcas)
  getCategoriasDisponibles(pruebaId: string): Observable<Categoria[]> {
    return this.http.get<Categoria[]>(`${this.apiUrl}/ranking/categorias-disponibles/${pruebaId}`);
  }

  // Obtener años de temporada disponibles para una prueba
  getAnyosDisponibles(pruebaId: string): Observable<number[]> {
    return this.http.get<number[]>(`${this.apiUrl}/ranking/anyos-disponibles/${pruebaId}`);
  }

  // Inicializar categorías con valores por defecto
  inicializarCategorias(forzar: boolean = false): Observable<any> {
    return this.http.post(`${this.apiUrl}/categorias/inicializar`, { forzar });
  }

  getPcAL(): Observable<PcAL[]> {
    return this.http.get<PcAL[]>(`${this.apiUrl}/pcAL`);
  }

  deleteMarca(marcaId: string): Observable<Marca> {
    return this.http.delete<Marca>(`${this.apiUrl}/marcas/${marcaId}`)
  }

  // Previsualizar importación de CSV
  previsualizarCSV(csvData: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/marcas/previsualizar-csv`, { csvData });
  }

  // Importar marcas desde CSV
  importarCSV(csvData: string): Observable<any> {
    return this.http.post(`${this.apiUrl}/marcas/importar-csv`, { csvData });
  }

}

// src/app/services/competicion.service.ts
import { inject, Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';
import { AuthService } from '../../auth/services/auth.service';
import { Disciplina } from '../../services/disciplina.service';

export interface EnlaceCompeticion {
  nombre: string;
  url: string;
  origen?: 'url' | 'archivo';
}

export interface Competicion {
  _id: string; // Mongoose agrega esta propiedad automáticamente
  nombre: string;
  fecha: Date;
  lugar: string;
  descripcion?: string; // Opcional
  tipo?: string; // Opcional
  imageUrl?: string; // Opcional
  pruebas: PruebaCompeticion[]; // Array de strings
  sectores: SectorCompeticion[];
  enlaces?: EnlaceCompeticion[];
  disciplina?: Disciplina | null;
}

export interface PruebaCompeticion {
  _id: string;
  nombre_prueba: string;
  sector_id: SectorCompeticion;
  categoria_id: CategoriaCompeticion;
}

export interface SectorCompeticion {
  _id: string;
  nombre_sector: string;
}

export interface CategoriaCompeticion {
  _id: string;
  nombre_categoria: string;
}


@Injectable({
  providedIn: 'root',
})
export class CompeticionService {
  private apiUrl = `${environment.apiUrl}`;
  private authService = inject(AuthService);
  constructor(private http: HttpClient) { }

  getCompeticiones(): Observable<Competicion[]> {
    return this.http.get<Competicion[]>(`${this.apiUrl}/competiciones`);
  }

  getCompeticionById(id: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/competiciones/${id}`)
  }

  // Obtener todas las pruebas
  getPruebas(): Observable<PruebaCompeticion[]> {
    return this.http.get<PruebaCompeticion[]>(`${this.apiUrl}/pruebasCompeticion`);
  }

  getCategorias(): Observable<CategoriaCompeticion[]> {
    return this.http.get<CategoriaCompeticion[]>(`${this.apiUrl}/categoriasCompeticion`);
  }

  getPruebasByCompeticionId(competicionId: string): Observable<{ _id: string; nombre_prueba: string; sector_id: string; categoria_id: string; __v: number; }[]> {
    return this.http.get<{ _id: string; nombre_prueba: string; sector_id: string; categoria_id: string; __v: number; }[]>(`${this.apiUrl}/pruebasCompeticion/competicion/${competicionId}`);
  }

  getPruebasByIds(ids: string[]): Observable<any[]> {
    // Convertir el array de IDs a una cadena separada por comas
    const idsString = ids.join(',');
    return this.http.get<any[]>(`${this.apiUrl}/pruebasCompeticion/ids?ids=${idsString}`);
  }

  getPruebasPorCategoriaYSector(sector: string, categorias: string[]): Observable<PruebaCompeticion[]> {
    const categoriasQueryParam = categorias.join(','); // Convierte el array en una cadena separada por comas
    return this.http.get<PruebaCompeticion[]>(`${this.apiUrl}/pruebasCompeticion/sector/${sector}/categorias?categorias=${categoriasQueryParam}`);
  }


  // Obtener todos los sectores
  getSectores(): Observable<SectorCompeticion[]> {
    return this.http.get<SectorCompeticion[]>(`${this.apiUrl}/sectoresCompeticion`);
  }

  createSector(sectorData: any): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.post(`${this.apiUrl}/sectoresCompeticion`, sectorData, { headers });
  }

  createCategoria(categoriaData: any): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.post(`${this.apiUrl}/categoriasCompeticion`, categoriaData, { headers });
  }

  createPrueba(pruebaData: any): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.post(`${this.apiUrl}/pruebasCompeticion`, pruebaData, { headers });
  }

  createCompeticion(competicionData: FormData): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.post(`${this.apiUrl}/competiciones`, competicionData, { headers });
  }

  updateCompeticion(id: string, competicionData: FormData): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.put(`${this.apiUrl}/competiciones/${id}`, competicionData, { headers });
  }

  deleteCompeticion(id: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.delete(`${this.apiUrl}/competiciones/${id}`, { headers });
  }

  getInscripcionById(inscripcionId: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.get(`${this.apiUrl}/inscripciones/inscripcion/${inscripcionId}`, { headers });
  }

  createInscripcion(
    nombre_atleta: string,
    competicionId: string,
    pruebas: string[],
    userId: string
  ): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const headers = new HttpHeaders().set('x-auth-token', token);

    const inscripcionData: any = {
      nombre_atleta,
      competicionId,
      pruebas,
      userId
    };

    return this.http.post(`${this.apiUrl}/inscripciones`, inscripcionData, { headers });
  }

  // Método para actualizar una inscripción existente
  updateInscripcion(
    inscripcionId: string,
    atleta: string,
    competicionId: string,
    pruebasSeleccionadasIds: string[],
    userId: string,
    fechaInscripcion?: Date // Añadir la fecha de inscripción opcionalmente
  ): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const headers = new HttpHeaders().set('x-auth-token', token);

    const body = {
      atleta,
      competicionId,
      pruebasSeleccionadas: pruebasSeleccionadasIds,
      userId,
      fechaInscripcion: fechaInscripcion || new Date() // Si no se pasa una fecha, usar la actual
    };

    console.log(body);  // Verificar qué se está enviando en la solicitud

    return this.http.put(`${this.apiUrl}/inscripciones/${inscripcionId}/${competicionId}`, body, { headers });
  }


  deleteInscripcion(inscripcionId: string): Observable<any> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }
    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.delete(`${this.apiUrl}/inscripciones/${inscripcionId}`, { headers });
  }


  getInscripcionesByEntrenadorYCompeticion(entrenadorId: string, competicionId: string): Observable<any[]> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.get<any[]>(`${this.apiUrl}/inscripciones/entrenador/${entrenadorId}/competicion/${competicionId}`, { headers });
  }


  getInscripcionesByCompeticion(competicionId: string): Observable<any[]> {
    const token = this.authService.getToken();
    if (!token) {
      throw new Error('No token found');
    }

    const headers = new HttpHeaders().set('x-auth-token', token);
    return this.http.get<any[]>(`${this.apiUrl}/inscripciones/competicion/${competicionId}`, { headers });
  }

}

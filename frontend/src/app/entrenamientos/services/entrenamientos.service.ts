import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { CalendarioEntrenamientoComponent } from '../components/calendario-entrenamiento/calendario-entrenamiento.component';

export interface GrupoEntrenamiento {
  _id: string;
  nombre_grupo: string;
  entrenador: string;
  atletas: string[];
}

export interface DiaEntrenamiento {
  _id?: string;
  fecha: Date;
  entrenamientos: Entrenamiento[]; // Array de entrenamientos enlazados al día
}


export interface Entrenamiento {
  diaEntrenamiento: string; // ID de DiaEntrenamiento asociado
  tipo: 'Técnica' | 'Pesas' | 'Series' | 'Velocidad' | 'Vallas' | 'Multisaltos' | 'Multilanzamientos' | 'Rodaje' | 'Cuestas' | 'Lastre' | 'Extras' | 'Test';

  tecnica?: { tecnica: string }[];

  pesas?: {
    series: string;
    repeticiones: string;
    porcentaje: string;
    comentario: string;
  }[];

  serie?: {
    numeroSeries: string;
    metros: string;
    recuperacion: string;
    tiempoObjetivo: string;
    comentario: string;
  }[];

  velocidad?: {
    numeroSeries: string;
    metros: string;
    recuperacion: string;
    porcentaje: string;
    comentario: string;
  }[];

  vallas?: {
    numeroSeries: string;
    numeroVallas: string;
    recuperacion: string;
    comentario: string;
  }[];

  multisaltos?: {
    numeroSaltos: string;
    tipo: 'Hierba' | 'Foso' | 'Vallas';
    comentario: string;
  }[];

  multilanzamientos?: {
    numeroLanzamientos: string;
    tipo: 'Hierba' | 'Step' | 'Pared' | 'Bola';
    comentario: string;
  }[];

  rodaje?: {
    tiempo: string;
    comentario: string;
  };

  cuestas?: {
    numeroCuestas: string;
    metros: string;
    recuperacion: string;
    comentario: string;
  }[];

  lastre?: {
    numeroSeries: string;
    metros: string;
    kilos: string;
    recuperacion: string;
    comentario: string;
  }[];

  extras?: {
    comentario: string;
  }[];
}




@Injectable({
  providedIn: 'root'
})
export class EntrenamientosService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getGruposEntrenamiento(atletaId: string): Observable<GrupoEntrenamiento[]> {
    return this.http.get<GrupoEntrenamiento[]>(`${this.apiUrl}/grupo-entrenamiento/atleta/${atletaId}`);
  }

  getGrupoEntrenamientoById(grupoEntrenamientoId: string): Observable<GrupoEntrenamiento> {
    return this.http.get<GrupoEntrenamiento>(`${this.apiUrl}/grupo-entrenamiento/${grupoEntrenamientoId}`)
  }

  createGrupoEntrenamiento(grupo: GrupoEntrenamiento): Observable<GrupoEntrenamiento> {
    return this.http.post<GrupoEntrenamiento>(`${this.apiUrl}/grupo-entrenamiento`, grupo);
  }

  updateGrupoEntrenamiento(grupo: GrupoEntrenamiento): Observable<GrupoEntrenamiento> {
    const grupoId = grupo._id;
    return this.http.put<GrupoEntrenamiento>(`${this.apiUrl}/grupo-entrenamiento/${grupoId}`, grupo);
  }

  getCalendarioPorAtleta(atletaId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/calendario-entrenamiento/${atletaId}`);
  }

  updateDiaEntrenamiento(diaId: string, dia: DiaEntrenamiento): Observable<DiaEntrenamiento> {
    return this.http.put<DiaEntrenamiento>(`${this.apiUrl}/dia-entrenamiento/${diaId}`, dia);
  }

  createEntrenamiento(entrenamiento: Entrenamiento): Observable<Entrenamiento> {
    return this.http.post<Entrenamiento>(`${this.apiUrl}/entrenamiento`, entrenamiento);
  }

  updateEntrenamiento(entrenamientoId: string, entrenamiento: Entrenamiento): Observable<Entrenamiento> {
    return this.http.put<Entrenamiento>(`${this.apiUrl}/entrenamiento/${entrenamientoId}`, entrenamiento);
  }

  getDiaEntrenamientoId(atletaId: string, fecha: Date): Observable<DiaEntrenamiento | null> {
    return this.http.get<DiaEntrenamiento | null>(`${this.apiUrl}/dia-entrenamiento/${atletaId}/${fecha.toISOString()}`);
  }

  createDiaEntrenamiento(diaEntrenamiento: DiaEntrenamiento): Observable<DiaEntrenamiento> {
    return this.http.post<DiaEntrenamiento>(`${environment.apiUrl}/dia-entrenamiento`, diaEntrenamiento);
  }

  addEntrenamientoToDia(diaEntrenamientoId: string, entrenamiento: Entrenamiento): Observable<any> {
    return this.http.post(`${environment.apiUrl}/dia-entrenamiento/${diaEntrenamientoId}/entrenamientos`, entrenamiento);
  }
  
  
}

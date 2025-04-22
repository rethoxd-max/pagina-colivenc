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
  calendario_entrenamiento?: string;
  entrenamientos: Entrenamiento[];
}

export interface Entrenamiento {
  _id?: string;
  dia_entrenamiento: string;
  tipo: 'Técnica' | 'Pesas' | 'Series' | 'Velocidad' | 'Vallas' | 'Multisaltos' | 'Multilanzamientos' | 'Rodaje' | 'Cuestas' | 'Lastre' | 'Extras' | 'Test' | 'Competición';

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
    tiempo?: string;
    comentario?: string;
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

  test?: {
    comentario?: string;
  };

  competicion?: {
    nombre?: string;
    fecha?: string;
    lugar?: string;
  };
}

@Injectable({
  providedIn: 'root'
})
export class EntrenamientosService {
  private apiUrl = `${environment.apiUrl}`;

  constructor(private http: HttpClient) { }

  getGruposEntrenamiento(atletaId: string): Observable<GrupoEntrenamiento[]> {
    return this.http.get<GrupoEntrenamiento[]>(`${this.apiUrl}/grupos-entrenamiento/atleta/${atletaId}`);
  }

  getGrupoEntrenamientoById(grupoEntrenamientoId: string): Observable<GrupoEntrenamiento> {
    return this.http.get<GrupoEntrenamiento>(`${this.apiUrl}/grupos-entrenamiento/${grupoEntrenamientoId}`);
  }

  createGrupoEntrenamiento(grupo: GrupoEntrenamiento): Observable<GrupoEntrenamiento> {
    return this.http.post<GrupoEntrenamiento>(`${this.apiUrl}/grupos-entrenamiento`, grupo);
  }

  updateGrupoEntrenamiento(grupo: GrupoEntrenamiento): Observable<GrupoEntrenamiento> {
    const grupoId = grupo._id;
    return this.http.put<GrupoEntrenamiento>(`${this.apiUrl}/grupos-entrenamiento/${grupoId}`, grupo);
  }

  getCalendarioPorAtleta(atletaId: string): Observable<any> {
    return this.http.get<any>(`${this.apiUrl}/calendarios-entrenamiento/${atletaId}`);
  }

  updateDiaEntrenamiento(diaId: string, dia: DiaEntrenamiento): Observable<DiaEntrenamiento> {
    return this.http.put<DiaEntrenamiento>(`${this.apiUrl}/dias-entrenamiento/${diaId}`, dia);
  }

  createEntrenamiento(diaId: string, entrenamiento: Entrenamiento): Observable<Entrenamiento> {
    return this.http.post<Entrenamiento>(`${this.apiUrl}/entrenamientos/${diaId}`, entrenamiento);
  }

  updateEntrenamiento(entrenamientoId: string, entrenamiento: Entrenamiento): Observable<Entrenamiento> {
    return this.http.put<Entrenamiento>(`${this.apiUrl}/entrenamientos/${entrenamientoId}`, entrenamiento);
  }

  getDiaEntrenamientoId(calendarioId: string, fecha: Date): Observable<DiaEntrenamiento | null> {
    return this.http.get<DiaEntrenamiento | null>(
      `${this.apiUrl}/dias-entrenamiento/${calendarioId}/${fecha.toISOString()}`
    );
  }

  createDiaEntrenamiento(calendarioId: string, fecha: Date): Observable<DiaEntrenamiento> {
    return this.http.get<DiaEntrenamiento>(
      `${this.apiUrl}/dias-entrenamiento/${calendarioId}/${fecha.toISOString()}`
    );
  }

  addEntrenamientoToDia(diaId: string, entrenamiento: Entrenamiento): Observable<DiaEntrenamiento> {
    return this.http.post<DiaEntrenamiento>(
      `${this.apiUrl}/dias-entrenamiento/${diaId}/entrenamientos`, 
      entrenamiento
    );
  }

  deleteEntrenamiento(diaId: string, entrenamientoId: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/entrenamientos/${entrenamientoId}`);
  }

  formatEntrenamientoDetails(entrenamiento: Entrenamiento): string {
    switch (entrenamiento.tipo) {
      case 'Pesas':
        if (entrenamiento.pesas && entrenamiento.pesas.length > 0) {
          const pesa = entrenamiento.pesas[0];
          return `${pesa.series}x${pesa.repeticiones}${pesa.porcentaje ? ` ${pesa.porcentaje}%` : ''}`;
        }
        break;
      case 'Series':
        if (entrenamiento.serie && entrenamiento.serie.length > 0) {
          const serie = entrenamiento.serie[0];
          return `${serie.numeroSeries}x${serie.metros}m`;
        }
        break;
      case 'Velocidad':
        if (entrenamiento.velocidad && entrenamiento.velocidad.length > 0) {
          const velocidad = entrenamiento.velocidad[0];
          return `${velocidad.numeroSeries}x${velocidad.metros}m`;
        }
        break;
      case 'Vallas':
        if (entrenamiento.vallas && entrenamiento.vallas.length > 0) {
          const valla = entrenamiento.vallas[0];
          return `${valla.numeroSeries}x${valla.numeroVallas} vallas`;
        }
        break;
      case 'Multisaltos':
        if (entrenamiento.multisaltos && entrenamiento.multisaltos.length > 0) {
          const salto = entrenamiento.multisaltos[0];
          return `${salto.numeroSaltos} saltos`;
        }
        break;
      case 'Multilanzamientos':
        if (entrenamiento.multilanzamientos && entrenamiento.multilanzamientos.length > 0) {
          const lanzamiento = entrenamiento.multilanzamientos[0];
          return `${lanzamiento.numeroLanzamientos} lanzamientos`;
        }
        break;
      case 'Rodaje':
        if (entrenamiento.rodaje) {
          return `${entrenamiento.rodaje.tiempo}`;
        }
        break;
      case 'Técnica':
        if (entrenamiento.tecnica && entrenamiento.tecnica.length > 0) {
          return entrenamiento.tecnica[0].tecnica;
        }
        break;
      case 'Competición':
        if (entrenamiento.competicion && entrenamiento.competicion.fecha) {
          const fecha = new Date(entrenamiento.competicion.fecha);
          const fechaFormateada = fecha.toLocaleDateString('es-ES', { day: '2-digit', month: '2-digit', year: 'numeric' });
          return `${entrenamiento.competicion.nombre} - ${entrenamiento.competicion.lugar} (${fechaFormateada})`;
        }
        break;
    }
    return '';
  }
}

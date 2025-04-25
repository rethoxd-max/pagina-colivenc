import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, BehaviorSubject, catchError, map, of, tap } from 'rxjs';
import { environment } from '../../../environments/environment.development';
import { CalendarioEntrenamientoComponent } from '../components/calendario-entrenamiento/calendario-entrenamiento.component';
import { AuthService } from '../../auth/services/auth.service';

export interface GrupoEntrenamiento {
  _id: string;
  nombre_grupo: string;
  entrenador: {
    _id: string;
    name: string;
  };
  atletas: Array<{
    _id: string;
    nombre: string;
    fecha_nacimiento: Date;
    usuario?: {
      _id: string;
      name: string;
    };
  }>;
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

export interface ResultadoEntrenamiento {
  _id?: string;
  entrenamiento: string;
  atleta: {
    _id: string;
    usuario: string;
    nombre: string;
    apellidos: string;
  };
  resultado: string;
  fecha: Date;
}

@Injectable({
  providedIn: 'root'
})
export class EntrenamientosService {
  private apiUrl = `${environment.apiUrl}`;
  private authService = inject(AuthService);
  private currentUserIdSubject = new BehaviorSubject<string | null>(this.authService.getUserId());

  constructor(private http: HttpClient) {
    // Suscribirse a cambios en la autenticación
    this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        this.currentUserIdSubject.next(this.authService.getUserId());
      } else {
        this.currentUserIdSubject.next(null);
      }
    });
  }

  // Método para obtener el ID del usuario actual
  getCurrentUserId(): string | null {
    return this.currentUserIdSubject.value;
  }

  getGruposEntrenamiento(atletaId: string): Observable<GrupoEntrenamiento[]> {
    return this.http.get<GrupoEntrenamiento[]>(`${this.apiUrl}/grupos-entrenamiento/atleta/${atletaId}`);
  }

  getGruposEntrenamientoByEntrenador(entrenadorId: string): Observable<GrupoEntrenamiento[]> {
    return this.http.get<GrupoEntrenamiento[]>(`${this.apiUrl}/grupos-entrenamiento/entrenador/${entrenadorId}`);
  }

  getGrupoEntrenamiento(grupoId: string): Observable<GrupoEntrenamiento> {
    return this.http.get<GrupoEntrenamiento>(`${this.apiUrl}/grupos-entrenamiento/${grupoId}`);
  }

  createGrupoEntrenamiento(grupo: GrupoEntrenamiento): Observable<GrupoEntrenamiento> {
    return this.http.post<GrupoEntrenamiento>(`${this.apiUrl}/grupos-entrenamiento`, grupo);
  }

  actualizarGrupo(grupoId: string, datos: { nombre_grupo: string }): Observable<GrupoEntrenamiento> {
    return this.http.put<GrupoEntrenamiento>(`${this.apiUrl}/grupos-entrenamiento/${grupoId}`, datos);
  }

  agregarAtletaAlGrupo(grupoId: string, atletaId: string): Observable<GrupoEntrenamiento> {
    return this.http.post<GrupoEntrenamiento>(`${this.apiUrl}/grupos-entrenamiento/${grupoId}/atletas`, { atletaId });
  }

  eliminarAtletaDelGrupo(grupoId: string, atletaId: string): Observable<GrupoEntrenamiento> {
    return this.http.delete<GrupoEntrenamiento>(`${this.apiUrl}/grupos-entrenamiento/${grupoId}/atletas/${atletaId}`);
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

  addResultado(entrenamientoId: string, atletaId: string, resultado: string): Observable<any> {
    // Utilizar el ID del usuario actual si está disponible
    const userId = this.getCurrentUserId();
    if (userId && (!atletaId || atletaId === 'current')) {
      atletaId = userId;
    }

    const resultadoData = {
      atletaId: atletaId,
      resultado
    };

    // Usar la ruta correcta del backend: /entrenamientos/:id/resultados
    return this.http.post<any>(`${this.apiUrl}/entrenamientos/${entrenamientoId}/resultados`, resultadoData)
      .pipe(
        tap(response => {
          console.log('Resultado guardado correctamente:', response);
        }),
        catchError(error => {
          console.error('Error al guardar resultado:', error);
          throw error;
        })
      );
  }

  getResultados(entrenamientoId: string): Observable<any[]> {
    // Usar la ruta correcta del backend: /entrenamientos/:id/resultados
    return this.http.get<any[]>(`${this.apiUrl}/entrenamientos/${entrenamientoId}/resultados`)
      .pipe(
        catchError(error => {
          console.error('Error al obtener resultados:', error);
          return of([]);
        }),
        map(resultados => {
          // Verificar si hay algún resultado para el usuario actual
          const currentUserId = this.getCurrentUserId();
          console.log(`Verificando resultados para el usuario: ${currentUserId}`);
          if (currentUserId) {
            const miResultado = resultados.find(r => {
              // La estructura del resultado es diferente en el backend
              // r.atleta es un ObjectId, no un objeto
              const atletaMatch = r.atleta && (
                (r.atleta.usuario && r.atleta.usuario === currentUserId) || 
                (typeof r.atleta === 'string' && r.atleta === currentUserId)
              );
              return atletaMatch;
            });
            console.log(`Resultado encontrado:`, miResultado);
          }
          return resultados;
        })
      );
  }
}

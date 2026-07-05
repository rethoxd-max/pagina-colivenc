import { Injectable, inject } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { AuthService } from '../../auth/services/auth.service';
import { environment } from '../../../environments/environment';

export interface HorarioEscuela {
  _id: string;
  seccion: string;
  categoria: string;
  horario: string;
  dias: string[];
  orden: number;
}

@Injectable({ providedIn: 'root' })
export class HorariosEscuelaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/horarios-escuela`;

  private authHeaders(): HttpHeaders {
    return new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
  }

  getHorarios(): Observable<HorarioEscuela[]> {
    return this.http.get<HorarioEscuela[]>(this.apiUrl);
  }

  crear(data: Partial<HorarioEscuela>): Observable<HorarioEscuela> {
    return this.http.post<HorarioEscuela>(this.apiUrl, data, { headers: this.authHeaders() });
  }

  actualizar(id: string, data: Partial<HorarioEscuela>): Observable<HorarioEscuela> {
    return this.http.put<HorarioEscuela>(`${this.apiUrl}/${id}`, data, { headers: this.authHeaders() });
  }

  eliminar(id: string): Observable<any> {
    return this.http.delete(`${this.apiUrl}/${id}`, { headers: this.authHeaders() });
  }
}

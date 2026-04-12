import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders } from '@angular/common/http';
import { Observable } from 'rxjs';
import { inject } from '@angular/core';
import { AuthService } from '../auth/services/auth.service';
import { environment } from '../../environments/environment';

export interface Disciplina {
  _id: string;
  nombre: string;
  slug: string;
  color: string;
  icono: string;
}

@Injectable({ providedIn: 'root' })
export class DisciplinaService {
  private http = inject(HttpClient);
  private authService = inject(AuthService);
  private apiUrl = `${environment.apiUrl}/disciplinas`;

  getDisciplinas(): Observable<Disciplina[]> {
    return this.http.get<Disciplina[]>(this.apiUrl);
  }

  createDisciplina(data: Partial<Disciplina>): Observable<Disciplina> {
    const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    return this.http.post<Disciplina>(this.apiUrl, data, { headers });
  }

  updateDisciplina(id: string, data: Partial<Disciplina>): Observable<Disciplina> {
    const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    return this.http.put<Disciplina>(`${this.apiUrl}/${id}`, data, { headers });
  }

  deleteDisciplina(id: string): Observable<any> {
    const headers = new HttpHeaders().set('x-auth-token', this.authService.getToken() || '');
    return this.http.delete(`${this.apiUrl}/${id}`, { headers });
  }
}

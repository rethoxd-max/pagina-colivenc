import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../../environments/environment';

export interface Competicion {
  _id?: string;
  nombre: string;
  fecha: string;
  lugar: string;
  atletaId: string;
}

@Injectable({
  providedIn: 'root'
})
export class CompeticionService {
  private apiUrl = `${environment.apiUrl}/competiciones`;

  constructor(private http: HttpClient) { }

  getCompeticionesByAtleta(atletaId: string): Observable<Competicion[]> {
    return this.http.get<Competicion[]>(`${this.apiUrl}/atleta/${atletaId}`);
  }

  createCompeticion(competicion: Competicion): Observable<Competicion> {
    return this.http.post<Competicion>(this.apiUrl, competicion);
  }

  updateCompeticion(id: string, competicion: Competicion): Observable<Competicion> {
    return this.http.put<Competicion>(`${this.apiUrl}/${id}`, competicion);
  }

  deleteCompeticion(id: string): Observable<void> {
    return this.http.delete<void>(`${this.apiUrl}/${id}`);
  }
} 
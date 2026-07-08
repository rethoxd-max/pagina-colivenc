import { Injectable, inject } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { environment } from '../../environments/environment';

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

@Injectable({ providedIn: 'root' })
export class AtletaService {
  private http = inject(HttpClient);
  private apiUrl = `${environment.apiUrl}/atletas`;

  getAtletas(): Observable<Atleta[]> {
    return this.http.get<Atleta[]>(this.apiUrl);
  }

  getAtletasPorGenero(genero: string): Observable<Atleta[]> {
    return this.http.get<Atleta[]>(`${this.apiUrl}/genero/${genero}`);
  }

  getAtletaById(identificador: string): Observable<Atleta> {
    return this.http.get<Atleta>(`${this.apiUrl}/${identificador}`);
  }

  getAtletaByUserId(userId: string | null): Observable<any> {
    return this.http.get(`${this.apiUrl}/usuario/${userId}`);
  }
}

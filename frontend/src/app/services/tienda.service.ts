import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { environment } from '../../environments/environment';
import { Producto } from '../tienda/models/producto.model';
import { throwError, Observable } from 'rxjs';
import { catchError, map } from 'rxjs/operators';

interface StripeResponse {
  sessionId: string;
}

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private apiUrl = environment.apiUrl;

  constructor(private http: HttpClient) {}

  async iniciarPago(producto: Producto, talla: string): Promise<string> {

    
    const token = localStorage.getItem('authToken');


    if (!token) {
      throw new Error('No hay token de autenticación');
    }

    const headers = new HttpHeaders()
      .set('Content-Type', 'application/json')
      .set('x-auth-token', token)
      .set('Accept', 'application/json');



    try {

      const response = await this.http.post<StripeResponse>(
        `${this.apiUrl}/tienda/crear-sesion`,
        { productoId: producto._id, talla },
        { 
          headers,
          withCredentials: true,
          observe: 'response'
        }
      ).pipe(
        map(response => response.body?.sessionId),
        catchError((error: HttpErrorResponse) => {
          console.error('Error en la petición:', error);
          if (error.status === 401) {
            console.error('Error de autenticación - Token inválido o expirado');
            localStorage.removeItem('authToken');
            return throwError(() => new Error('Sesión expirada. Por favor, vuelve a iniciar sesión.'));
          }
          return throwError(() => error);
        })
      ).toPromise();

      if (!response) {
        throw new Error('No se recibió respuesta del servidor');
      }

      return response;
    } catch (error) {
      console.error('Error en TiendaService:', error);
      throw error;
    }
  }
} 
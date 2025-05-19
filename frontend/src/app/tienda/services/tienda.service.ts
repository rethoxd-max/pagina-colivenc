import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable } from 'rxjs';
import { Producto } from '../models/producto.model';
import { loadStripe } from '@stripe/stripe-js';

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private apiUrl = 'https://api.cecolivenc.es/tienda'; // URL actualizada sin /api
  private stripePromise = loadStripe('pk_test_51RH3umPZPnVDLAtk0NrPnwnwZZDBvPzuO76pwCWHvCv8p8O1YjWZ1fYZKYDnjSgRMbIa6YJ71sgX5vVPFe6QSngw00TkDjQX3m'); // Reemplaza con tu clave pública de Stripe

  constructor(private http: HttpClient) {
    console.log('TiendaService constructor inicializado');
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    console.log('TiendaService - Obteniendo headers con token:', !!token);
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-auth-token': token || ''
    });
  }

  getProductos(): Observable<Producto[]> {
    console.log('Obteniendo productos de:', `${this.apiUrl}/productos`);
    return this.http.get<Producto[]>(`${this.apiUrl}/productos`);
  }

  async iniciarPago(producto: Producto, talla: string): Promise<string> {
    console.log('=== INICIO DE INICIAR PAGO ===');
    try {
      const headers = this.getHeaders();
      console.log('Headers preparados:', headers.keys());

      const payload = {
        productoId: producto._id,
        talla: talla
      };
      console.log('Enviando petición al backend:', {
        url: `${this.apiUrl}/crear-sesion`,
        payload,
        headers: headers.keys()
      });

      const response = await this.http.post(
        `${this.apiUrl}/crear-sesion`,
        payload,
        { headers }
      ).toPromise();

      console.log('Respuesta completa del backend:', response);

      if (!response) {
        console.error('Error: Respuesta vacía del servidor');
        throw new Error('Respuesta vacía del servidor');
      }

      if (!('sessionId' in response)) {
        console.error('Error: Respuesta no contiene sessionId:', response);
        throw new Error('Respuesta inválida del servidor');
      }

      const { sessionId } = response as { sessionId: string };
      console.log('SessionId extraído correctamente:', sessionId);
      console.log('=== FIN DE INICIAR PAGO ===');
      return sessionId;
    } catch (error: unknown) {
      console.error('Error detallado al iniciar el pago:', error);
      if (error instanceof HttpErrorResponse) {
        console.log('Estado del error:', {
          status: error.status,
          message: error.message,
          error: error.error
        });
      }
      throw error;
    }
  }
} 
import { Injectable } from '@angular/core';
import { HttpClient, HttpHeaders, HttpErrorResponse } from '@angular/common/http';
import { Observable, BehaviorSubject } from 'rxjs';
import { Producto } from '../models/producto.model';
import { ItemCarrito, Carrito } from '../models/carrito.model';
import { loadStripe } from '@stripe/stripe-js';
import { environment } from '../../../environments/environment';

@Injectable({
  providedIn: 'root'
})
export class TiendaService {
  private apiUrl = environment.apiUrl + '/tienda'; // URL para desarrollo local
  private stripePromise = loadStripe('pk_test_51RH3umPZPnVDLAtk0NrPnwnwZZDBvPzuO76pwCWHvCv8p8O1YjWZ1fYZKYDnjSgRMbIa6YJ71sgX5vVPFe6QSngw00TkDjQX3m'); // Reemplaza con tu clave pública de Stripe

  private carritoSubject = new BehaviorSubject<Carrito>({ items: [], total: 0 });
  carrito$ = this.carritoSubject.asObservable();

  constructor(private http: HttpClient) {
    // Cargar carrito del localStorage al iniciar
    const carritoGuardado = localStorage.getItem('carrito');
    if (carritoGuardado) {
      try {
        const carrito = JSON.parse(carritoGuardado);
        if (this.esCarritoValido(carrito)) {
          this.carritoSubject.next(carrito);
        } else {
          this.inicializarCarrito();
        }
      } catch (error) {
        console.error('Error al cargar el carrito:', error);
        this.inicializarCarrito();
      }
    } else {
      this.inicializarCarrito();
    }
  }

  private esCarritoValido(carrito: any): boolean {
    return carrito && 
           Array.isArray(carrito.items) && 
           typeof carrito.total === 'number';
  }

  private inicializarCarrito(): void {
    this.carritoSubject.next({ items: [], total: 0 });
    localStorage.setItem('carrito', JSON.stringify({ items: [], total: 0 }));
  }

  private getHeaders(): HttpHeaders {
    const token = localStorage.getItem('authToken');
    return new HttpHeaders({
      'Content-Type': 'application/json',
      'x-auth-token': token || ''
    });
  }

  getProductos(): Observable<Producto[]> {
    return this.http.get<Producto[]>(`${this.apiUrl}/productos`);
  }

  getProducto(id: string): Observable<any> {
    return this.http.get(`${this.apiUrl}/productos/id/${id}`);
  }

  getImagenUrl(filename: string): string {
    return `${this.apiUrl}/productos/imagen/${filename}`;
  }

  crearProducto(formData: FormData): Observable<Producto> {
    const headers = new HttpHeaders();
    return this.http.post<Producto>(`${this.apiUrl}/productos`, formData, { headers });
  }

  actualizarProducto(id: string, productoData: FormData): Observable<any> {
    const headers = new HttpHeaders();
    return this.http.put(`${this.apiUrl}/productos/${id}`, productoData, { headers });
  }

  eliminarProducto(id: string): Observable<any> {
    const headers = this.getHeaders();
    return this.http.delete(`${this.apiUrl}/productos/${id}`, { headers });
  }

  async iniciarPago(producto: Producto, talla: string): Promise<string> {
    try {
      const headers = this.getHeaders();

      const payload = {
        productoId: producto._id,
        talla: talla
      };

      const response = await this.http.post(
        `${this.apiUrl}/crear-sesion`,
        payload,
        { headers }
      ).toPromise();

      if (!response) {
        console.error('Error: Respuesta vacía del servidor');
        throw new Error('Respuesta vacía del servidor');
      }

      if (!('sessionId' in response)) {
        console.error('Error: Respuesta no contiene sessionId:', response);
        throw new Error('Respuesta inválida del servidor');
      }

      const { sessionId } = response as { sessionId: string };

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

  agregarAlCarrito(producto: Producto, talla: string): void {
    const carritoActual = this.carritoSubject.value || { items: [], total: 0 };
    const itemExistente = carritoActual.items.find(
      item => item.productoId === producto._id && item.talla === talla
    );

    if (itemExistente) {
      itemExistente.cantidad += 1;
    } else {
      carritoActual.items.push({
        productoId: producto._id,
        nombre: producto.nombre,
        precio: producto.precio,
        talla: talla,
        imagen: producto.imagen,
        cantidad: 1
      });
    }

    this.actualizarCarrito(carritoActual);
  }

  eliminarDelCarrito(productoId: string, talla: string): void {
    const carritoActual = this.carritoSubject.value || { items: [], total: 0 };
    carritoActual.items = carritoActual.items.filter(
      item => !(item.productoId === productoId && item.talla === talla)
    );
    this.actualizarCarrito(carritoActual);
  }

  actualizarCantidad(productoId: string, talla: string, cantidad: number): void {
    const carritoActual = this.carritoSubject.value || { items: [], total: 0 };
    const item = carritoActual.items.find(
      item => item.productoId === productoId && item.talla === talla
    );

    if (item) {
      item.cantidad = cantidad;
      this.actualizarCarrito(carritoActual);
    }
  }

  private actualizarCarrito(carrito: Carrito): void {
    carrito.total = carrito.items.reduce(
      (total, item) => total + (item.precio * item.cantidad),
      0
    );
    this.carritoSubject.next(carrito);
    localStorage.setItem('carrito', JSON.stringify(carrito));
  }

  limpiarCarrito(): void {
    this.inicializarCarrito();
  }

  async iniciarPagoCarrito(): Promise<string> {
    try {
      const headers = this.getHeaders();
      const carrito = this.carritoSubject.value;

      if (!carrito || !carrito.items.length) {
        throw new Error('El carrito está vacío');
      }

      const payload = {
        items: carrito.items.map(item => ({
          productoId: item.productoId,
          talla: item.talla,
          cantidad: item.cantidad
        }))
      };

      const response = await this.http.post(
        `${this.apiUrl}/crear-sesion-carrito`,
        payload,
        { headers }
      ).toPromise();

      if (!response || !('sessionId' in response)) {
        throw new Error('Respuesta inválida del servidor');
      }

      const { sessionId } = response as { sessionId: string };
      
      // Limpiar el carrito después de iniciar el pago
      this.limpiarCarrito();
      
      return sessionId;
    } catch (error: unknown) {
      console.error('Error al iniciar el pago del carrito:', error);
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
import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { TiendaService } from './services/tienda.service';
import { Producto } from './models/producto.model';
import { Router } from '@angular/router';
import { loadStripe } from '@stripe/stripe-js';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule],
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.css']
})
export class TiendaComponent implements OnInit {
  productos: Producto[] = [];
  tallasSeleccionadas: Map<string, string> = new Map();
  productoSeleccionado: Producto | null = null;
  error: string = '';
  loading: boolean = true;
  private stripePromise = loadStripe('pk_test_51RH3umPZPnVDLAtk0NrPnwnwZZDBvPzuO76pwCWHvCv8p8O1YjWZ1fYZKYDnjSgRMbIa6YJ71sgX5vVPFe6QSngw00TkDjQX3m');

  constructor(
    private tiendaService: TiendaService,
    private router: Router
  ) {
    console.log('TiendaComponent constructor - URL actual:', this.router.url);
  }

  ngOnInit(): void {
    console.log('TiendaComponent ngOnInit - URL actual:', this.router.url);
    this.cargarProductos();
  }

  cargarProductos(): void {
    console.log('Cargando productos...');
    this.loading = true;
    this.tiendaService.getProductos().subscribe({
      next: (productos) => {
        console.log('Productos cargados:', productos);
        this.productos = productos;
        this.loading = false;
      },
      error: (error) => {
        console.error('Error al cargar productos:', error);
        this.error = 'Error al cargar los productos. Por favor, inténtalo de nuevo.';
        this.loading = false;
      }
    });
  }

  seleccionarProducto(producto: Producto): void {
    console.log('Producto seleccionado:', producto);
    this.productoSeleccionado = producto;
  }

  seleccionarTalla(productoId: string, talla: string): void {
    console.log('Seleccionando talla:', { productoId, talla });
    this.tallasSeleccionadas.set(productoId, talla);
  }

  getTallaSeleccionada(productoId: string): string {
    return this.tallasSeleccionadas.get(productoId) || '';
  }

  async iniciarCompra(producto: Producto): Promise<void> {
    console.log('=== INICIO DEL PROCESO DE COMPRA ===');
    console.log('Producto a comprar:', producto);
    console.log('URL actual antes de iniciar compra:', this.router.url);
    
    const tallaSeleccionada = this.tallasSeleccionadas.get(producto._id);
    console.log('Talla seleccionada:', tallaSeleccionada);
    
    if (!tallaSeleccionada) {
      console.log('Error: No hay talla seleccionada');
      this.error = 'Por favor, selecciona una talla';
      return;
    }

    const token = localStorage.getItem('authToken');
    console.log('Token presente:', !!token);
    if (!token) {
      console.log('No hay token - Redirigiendo a login');
      this.router.navigate(['/login'], { queryParams: { returnUrl: '/tienda' } });
      return;
    }

    try {
      console.log('Iniciando proceso de pago...');
      this.loading = true;
      this.error = '';
      
      console.log('Llamando a iniciarPago...');
      const sessionId = await this.tiendaService.iniciarPago(producto, tallaSeleccionada);
      console.log('SessionId recibido:', sessionId);
      
      console.log('Inicializando Stripe...');
      const stripe = await this.stripePromise;
      
      if (!stripe) {
        console.error('Error: No se pudo inicializar Stripe');
        throw new Error('No se pudo inicializar Stripe');
      }

      console.log('Redirigiendo a checkout de Stripe...');
      const result = await stripe.redirectToCheckout({ sessionId });
      console.log('Resultado de redirección a Stripe:', result);
      
      if (result.error) {
        console.error('Error en redirección a Stripe:', result.error);
        throw result.error;
      }
    } catch (error: any) {
      console.error('Error completo al procesar la compra:', error);
      console.log('Estado del error:', {
        status: error.status,
        message: error.message,
        stack: error.stack
      });
      
      if (error.status === 401) {
        console.log('Error 401 - Redirigiendo a login');
        this.router.navigate(['/login'], { queryParams: { returnUrl: '/tienda' } });
      } else {
        this.error = 'Error al procesar la compra. Por favor, inténtalo de nuevo.';
      }
    } finally {
      this.loading = false;
      console.log('=== FIN DEL PROCESO DE COMPRA ===');
    }
  }
}

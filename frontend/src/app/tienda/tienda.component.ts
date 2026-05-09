import { Component, OnInit, ViewChild, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RouterModule } from '@angular/router';
import { TiendaService } from './services/tienda.service';
import { Producto } from './models/producto.model';
import { Router } from '@angular/router';
import { CarritoComponent } from './components/carrito/carrito.component';
import { AuthService } from '../auth/services/auth.service';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-tienda',
  standalone: true,
  imports: [CommonModule, FormsModule, RouterModule, CarritoComponent],
  templateUrl: './tienda.component.html',
  styleUrls: ['./tienda.component.css']
})
export class TiendaComponent implements OnInit, OnDestroy {
  @ViewChild('carritoComponent') carritoComponent!: CarritoComponent;
  
  productos: Producto[] = [];
  tallasSeleccionadas: Map<string, string> = new Map();
  productoSeleccionado: Producto | null = null;
  error: string = '';
  loading: boolean = true;
  cantidadItems: number = 0;
  private subscription: Subscription;

  constructor(
    private tiendaService: TiendaService,
    private router: Router,
    private authService: AuthService
  ) {
    this.subscription = this.tiendaService.carrito$.subscribe(carrito => {
      this.cantidadItems = carrito?.items?.length || 0;
    });
  }

  ngOnInit() {
    this.cargarProductos();
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  cargarProductos(): void {
    this.loading = true;
    this.tiendaService.getProductos().subscribe({
      next: (productos) => {
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

  getImagenUrl(filename: string): string {
    return this.tiendaService.getImagenUrl(filename);
  }

  formatearTalla(talla: string): string {
    return talla.replace(/[\[\]"]/g, '');
  }

  seleccionarProducto(producto: Producto): void {
    this.productoSeleccionado = producto;
  }

  seleccionarTalla(productoId: string, talla: string): void {
    this.tallasSeleccionadas.set(productoId, talla);
  }

  getTallaSeleccionada(productoId: string): string {
    return this.tallasSeleccionadas.get(productoId) || '';
  }

  agregarAlCarrito(producto: Producto): void {
    const tallaSeleccionada = this.tallasSeleccionadas.get(producto._id);
    if (!tallaSeleccionada) {
      this.error = 'Por favor, selecciona una talla';
      return;
    }

    this.tiendaService.agregarAlCarrito(producto, tallaSeleccionada);
    this.error = '';
    this.toggleCarrito(); // Abrir el carrito al añadir un producto
  }

  editarProducto(producto: Producto): void {
    this.router.navigate(['/tienda/editar-producto', producto._id]);
  }

  eliminarProducto(producto: Producto): void {
    if (confirm('¿Estás seguro de que deseas eliminar este producto?')) {
      this.tiendaService.eliminarProducto(producto._id).subscribe({
        next: () => {
          this.productos = this.productos.filter(p => p._id !== producto._id);
          alert('Producto eliminado correctamente');
        },
        error: (error) => {
          console.error('Error al eliminar el producto:', error);
          alert('Error al eliminar el producto. Por favor, inténtalo de nuevo.');
        }
      });
    }
  }

  toggleCarrito(): void {
    if (this.carritoComponent) {
      this.carritoComponent.toggleCarrito();
    }
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}

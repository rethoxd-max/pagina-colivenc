import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { TiendaService } from '../../services/tienda.service';
import { ItemCarrito, Carrito } from '../../models/carrito.model';
import { loadStripe } from '@stripe/stripe-js';
import { Subscription } from 'rxjs';

@Component({
  selector: 'app-carrito',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="carrito-container" [class.abierto]="abierto">
      <div class="carrito-header">
        <h2>Carrito de Compras</h2>
        <button class="btn-cerrar" (click)="toggleCarrito()">×</button>
      </div>

      <div class="carrito-items" *ngIf="carrito?.items && carrito.items.length > 0">
        <div class="carrito-item" *ngFor="let item of carrito.items">
          <img [src]="getImagenUrl(item.imagen)" [alt]="item.nombre" class="item-imagen">
          <div class="item-info">
            <h3>{{ item.nombre }}</h3>
            <p>Talla: {{ item.talla }}</p>
            <p>Precio: {{ item.precio | currency:'EUR' }}</p>
            <div class="cantidad-control">
              <button (click)="actualizarCantidad(item, -1)">-</button>
              <span>{{ item.cantidad }}</span>
              <button (click)="actualizarCantidad(item, 1)">+</button>
            </div>
          </div>
          <button class="btn-eliminar" (click)="eliminarItem(item)">×</button>
        </div>

        <div class="carrito-total">
          <h3>Total: {{ carrito.total | currency:'EUR' }}</h3>
        </div>

        <button class="btn-comprar" (click)="iniciarCompra()" [disabled]="loading">
          {{ loading ? 'Procesando...' : 'Comprar' }}
        </button>
      </div>

      <div class="carrito-vacio" *ngIf="!carrito?.items || carrito.items.length === 0">
        <p>Tu carrito está vacío</p>
      </div>
    </div>
  `,
  styles: [`
    .carrito-container {
      position: fixed;
      top: 0;
      right: -400px;
      width: 400px;
      height: 100vh;
      background: white;
      box-shadow: -2px 0 5px rgba(0,0,0,0.1);
      transition: right 0.3s ease;
      z-index: 1000;
      display: flex;
      flex-direction: column;
    }

    .carrito-container.abierto {
      right: 0;
    }

    .carrito-header {
      padding: 1rem;
      border-bottom: 1px solid #eee;
      display: flex;
      justify-content: space-between;
      align-items: center;
    }

    .btn-cerrar {
      background: none;
      border: none;
      font-size: 1.5rem;
      cursor: pointer;
      color: #666;
    }

    .carrito-items {
      flex: 1;
      overflow-y: auto;
      padding: 1rem;
    }

    .carrito-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      border-bottom: 1px solid #eee;
      position: relative;
    }

    .item-imagen {
      width: 80px;
      height: 80px;
      object-fit: contain;
    }

    .item-info {
      flex: 1;
    }

    .item-info h3 {
      margin: 0 0 0.5rem 0;
      font-size: 1rem;
    }

    .cantidad-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .cantidad-control button {
      width: 24px;
      height: 24px;
      border: 1px solid #ddd;
      background: white;
      cursor: pointer;
    }

    .btn-eliminar {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: none;
      border: none;
      color: #666;
      cursor: pointer;
      font-size: 1.2rem;
    }

    .carrito-total {
      padding: 1rem;
      border-top: 1px solid #eee;
      text-align: right;
    }

    .btn-comprar {
      margin: 1rem;
      padding: 1rem;
      background: #007bff;
      color: white;
      border: none;
      border-radius: 4px;
      cursor: pointer;
      font-weight: bold;
    }

    .btn-comprar:disabled {
      background: #ccc;
      cursor: not-allowed;
    }

    .carrito-vacio {
      flex: 1;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #666;
    }
  `]
})
export class CarritoComponent implements OnInit, OnDestroy {
  carrito: Carrito = { items: [], total: 0 };
  abierto = false;
  loading = false;
  private subscription: Subscription | undefined;
  private stripePromise = loadStripe('pk_test_51RH3umPZPnVDLAtk0NrPnwnwZZDBvPzuO76pwCWHvCv8p8O1YjWZ1fYZKYDnjSgRMbIa6YJ71sgX5vVPFe6QSngw00TkDjQX3m');

  constructor(
    private tiendaService: TiendaService,
    private router: Router
  ) {}

  ngOnInit() {
    this.subscription = this.tiendaService.carrito$.subscribe(carrito => {
      if (carrito) {
        this.carrito = carrito;
      }
    });
  }

  ngOnDestroy() {
    if (this.subscription) {
      this.subscription.unsubscribe();
    }
  }

  toggleCarrito() {
    this.abierto = !this.abierto;
  }

  getImagenUrl(filename: string): string {
    return this.tiendaService.getImagenUrl(filename);
  }

  actualizarCantidad(item: ItemCarrito, cambio: number) {
    const nuevaCantidad = item.cantidad + cambio;
    if (nuevaCantidad > 0) {
      this.tiendaService.actualizarCantidad(item.productoId, item.talla, nuevaCantidad);
    }
  }

  eliminarItem(item: ItemCarrito) {
    this.tiendaService.eliminarDelCarrito(item.productoId, item.talla);
  }

  async iniciarCompra() {
    try {
      this.loading = true;
      const sessionId = await this.tiendaService.iniciarPagoCarrito();
      const stripe = await this.stripePromise;
      
      if (!stripe) {
        throw new Error('No se pudo inicializar Stripe');
      }

      const result = await stripe.redirectToCheckout({ sessionId });
      
      if (result.error) {
        throw result.error;
      }
    } catch (error) {
      console.error('Error al procesar la compra:', error);
      // Aquí podrías mostrar un mensaje de error al usuario
    } finally {
      this.loading = false;
    }
  }
} 
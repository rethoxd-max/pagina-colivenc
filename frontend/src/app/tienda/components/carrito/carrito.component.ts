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
    <!-- Overlay de fondo -->
    <div class="carrito-overlay" [class.visible]="abierto" (click)="toggleCarrito()"></div>
    
    <div class="carrito-container" [class.abierto]="abierto">
      <div class="carrito-header">
        <div class="header-title">
          <i class="fas fa-shopping-cart"></i>
          <h2>Mi Carrito</h2>
        </div>
        <button class="btn-cerrar" (click)="toggleCarrito()">
          <i class="fas fa-times"></i>
        </button>
      </div>

      <div class="carrito-content" *ngIf="carrito?.items && carrito.items.length > 0">
        <div class="items-count">
          <span>{{ carrito.items.length }} {{ carrito.items.length === 1 ? 'producto' : 'productos' }}</span>
        </div>
        
        <div class="carrito-items">
          <div class="carrito-item" *ngFor="let item of carrito.items">
            <div class="item-imagen-container">
              <img [src]="getImagenUrl(item.imagen)" [alt]="item.nombre" class="item-imagen">
            </div>
            <div class="item-details">
              <h3 class="item-nombre">{{ item.nombre }}</h3>
              <span class="item-talla">
                <i class="fas fa-ruler"></i>
                Talla: {{ item.talla }}
              </span>
              <span class="item-precio">{{ item.precio | currency:'EUR' }}</span>
              <div class="cantidad-control">
                <button class="btn-cantidad" (click)="actualizarCantidad(item, -1)">
                  <i class="fas fa-minus"></i>
                </button>
                <span class="cantidad-valor">{{ item.cantidad }}</span>
                <button class="btn-cantidad" (click)="actualizarCantidad(item, 1)">
                  <i class="fas fa-plus"></i>
                </button>
              </div>
            </div>
            <button class="btn-eliminar-item" (click)="eliminarItem(item)">
              <i class="fas fa-trash-alt"></i>
            </button>
          </div>
        </div>

        <div class="carrito-footer">
          <div class="carrito-total">
            <span class="total-label">Total</span>
            <span class="total-valor">{{ carrito.total | currency:'EUR' }}</span>
          </div>
          <button class="btn-comprar" (click)="iniciarCompra()" [disabled]="loading">
            <i class="fas" [ngClass]="loading ? 'fa-spinner fa-spin' : 'fa-credit-card'"></i>
            {{ loading ? 'Procesando...' : 'Finalizar Compra' }}
          </button>
          <p class="secure-badge">
            <i class="fas fa-lock"></i>
            Pago seguro con Stripe
          </p>
        </div>
      </div>

      <div class="carrito-vacio" *ngIf="!carrito?.items || carrito.items.length === 0">
        <div class="vacio-icon">
          <i class="fas fa-shopping-bag"></i>
        </div>
        <h3>Tu carrito está vacío</h3>
        <p>Añade productos para comenzar tu compra</p>
        <button class="btn-explorar" (click)="toggleCarrito()">
          <i class="fas fa-arrow-left"></i>
          Explorar productos
        </button>
      </div>
    </div>
  `,
  styles: [`
    .carrito-overlay {
      position: fixed;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      background: rgba(0, 0, 0, 0.5);
      backdrop-filter: blur(4px);
      opacity: 0;
      visibility: hidden;
      transition: all 0.3s ease;
      z-index: 999;
    }
    
    .carrito-overlay.visible {
      opacity: 1;
      visibility: visible;
    }
    
    .carrito-container {
      position: fixed;
      top: 60px;
      right: -420px;
      width: 400px;
      height: calc(100vh - 60px);
      background: #ffffff;
      box-shadow: -5px 0 25px rgba(0, 0, 0, 0.15);
      transition: right 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      z-index: 1000;
      display: flex;
      flex-direction: column;
      border-radius: 16px 0 0 0;
    }

    .carrito-container.abierto {
      right: 0;
    }

    .carrito-header {
      padding: 1.25rem 1.5rem;
      background: linear-gradient(135deg, #1e3c72 0%, #2a5298 100%);
      display: flex;
      justify-content: space-between;
      align-items: center;
      border-radius: 16px 0 0 0;
    }
    
    .header-title {
      display: flex;
      align-items: center;
      gap: 0.75rem;
      color: white;
    }
    
    .header-title i {
      font-size: 1.25rem;
    }
    
    .header-title h2 {
      margin: 0;
      font-size: 1.25rem;
      font-weight: 700;
    }

    .btn-cerrar {
      background: rgba(255, 255, 255, 0.2);
      border: none;
      width: 36px;
      height: 36px;
      border-radius: 50%;
      cursor: pointer;
      color: white;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    
    .btn-cerrar:hover {
      background: rgba(255, 255, 255, 0.3);
      transform: rotate(90deg);
    }
    
    .carrito-content {
      flex: 1;
      display: flex;
      flex-direction: column;
      overflow: hidden;
    }
    
    .items-count {
      padding: 0.75rem 1.5rem;
      background: #f8fafc;
      border-bottom: 1px solid #e2e8f0;
      font-size: 0.875rem;
      color: #64748b;
      font-weight: 500;
    }

    .carrito-items {
      flex: 1;
      overflow-y: auto;
      padding: 1rem 1.5rem;
    }

    .carrito-item {
      display: flex;
      gap: 1rem;
      padding: 1rem;
      background: #f8fafc;
      border-radius: 12px;
      margin-bottom: 1rem;
      position: relative;
      border: 1px solid #e2e8f0;
      transition: all 0.3s ease;
    }
    
    .carrito-item:hover {
      border-color: #2a5298;
      box-shadow: 0 4px 12px rgba(42, 82, 152, 0.1);
    }
    
    .item-imagen-container {
      width: 80px;
      height: 80px;
      background: white;
      border-radius: 8px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }

    .item-imagen {
      width: 100%;
      height: 100%;
      object-fit: contain;
      border-radius: 8px;
    }

    .item-details {
      flex: 1;
      display: flex;
      flex-direction: column;
      gap: 0.25rem;
      min-width: 0;
    }

    .item-nombre {
      margin: 0;
      font-size: 0.95rem;
      font-weight: 600;
      color: #1e293b;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    
    .item-talla {
      font-size: 0.8rem;
      color: #64748b;
      display: flex;
      align-items: center;
      gap: 0.35rem;
    }
    
    .item-talla i {
      font-size: 0.7rem;
      color: #2a5298;
    }
    
    .item-precio {
      font-size: 1rem;
      font-weight: 700;
      color: #1e3c72;
    }

    .cantidad-control {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      margin-top: 0.5rem;
    }

    .btn-cantidad {
      width: 28px;
      height: 28px;
      border: 2px solid #e2e8f0;
      background: white;
      border-radius: 6px;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      color: #64748b;
      transition: all 0.2s ease;
    }
    
    .btn-cantidad:hover {
      border-color: #2a5298;
      color: #2a5298;
      background: #eff6ff;
    }
    
    .btn-cantidad i {
      font-size: 0.65rem;
    }
    
    .cantidad-valor {
      font-weight: 600;
      color: #1e293b;
      min-width: 24px;
      text-align: center;
    }

    .btn-eliminar-item {
      position: absolute;
      top: 0.5rem;
      right: 0.5rem;
      background: none;
      border: none;
      color: #94a3b8;
      cursor: pointer;
      padding: 0.5rem;
      transition: all 0.2s ease;
    }
    
    .btn-eliminar-item:hover {
      color: #ef4444;
    }

    .carrito-footer {
      padding: 1.5rem;
      border-top: 1px solid #e2e8f0;
      background: white;
    }
    
    .carrito-total {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 1rem;
    }
    
    .total-label {
      font-size: 1rem;
      color: #64748b;
      font-weight: 500;
    }
    
    .total-valor {
      font-size: 1.5rem;
      font-weight: 800;
      color: #1e3c72;
    }

    .btn-comprar {
      width: 100%;
      padding: 1rem;
      background: linear-gradient(135deg, #10b981, #059669);
      color: white;
      border: none;
      border-radius: 12px;
      cursor: pointer;
      font-weight: 700;
      font-size: 1rem;
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.75rem;
      transition: all 0.3s ease;
    }
    
    .btn-comprar:hover:not(:disabled) {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(16, 185, 129, 0.3);
    }

    .btn-comprar:disabled {
      background: #cbd5e1;
      cursor: not-allowed;
      transform: none;
      box-shadow: none;
    }
    
    .secure-badge {
      display: flex;
      align-items: center;
      justify-content: center;
      gap: 0.5rem;
      margin-top: 1rem;
      font-size: 0.8rem;
      color: #64748b;
    }
    
    .secure-badge i {
      color: #10b981;
    }

    .carrito-vacio {
      flex: 1;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 2rem;
      text-align: center;
    }
    
    .vacio-icon {
      width: 80px;
      height: 80px;
      background: linear-gradient(135deg, #eff6ff, #dbeafe);
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 1.5rem;
    }
    
    .vacio-icon i {
      font-size: 2rem;
      color: #2a5298;
    }
    
    .carrito-vacio h3 {
      margin: 0 0 0.5rem;
      color: #1e293b;
      font-size: 1.25rem;
    }
    
    .carrito-vacio p {
      margin: 0 0 1.5rem;
      color: #64748b;
      font-size: 0.9rem;
    }
    
    .btn-explorar {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      background: linear-gradient(135deg, #1e3c72, #2a5298);
      color: white;
      border: none;
      padding: 0.75rem 1.5rem;
      border-radius: 10px;
      font-weight: 600;
      cursor: pointer;
      transition: all 0.3s ease;
    }
    
    .btn-explorar:hover {
      transform: translateY(-2px);
      box-shadow: 0 8px 20px rgba(30, 60, 114, 0.3);
    }
    
    @media (max-width: 480px) {
      .carrito-container {
        width: 100%;
        right: -100%;
        border-radius: 0;
      }
      
      .carrito-header {
        border-radius: 0;
      }
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
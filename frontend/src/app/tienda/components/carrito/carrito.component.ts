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
          <div class="telefono-field">
            <label><i class="fas fa-phone"></i> Teléfono de contacto</label>
            <div class="telefono-input-wrapper">
              <div class="pais-selector" (click)="toggleDropdown()">
                <span class="pais-flag">{{ paisSeleccionado.flag }}</span>
                <span class="pais-dial">{{ paisSeleccionado.dialCode }}</span>
                <i class="fas fa-chevron-down pais-arrow" [class.rotated]="dropdownAbierto"></i>
              </div>
              <div class="paises-dropdown" *ngIf="dropdownAbierto">
                <div class="paises-search">
                  <i class="fas fa-search"></i>
                  <input type="text" [(ngModel)]="busquedaPais" placeholder="Buscar país..."
                    class="search-pais-input" (click)="$event.stopPropagation()" />
                </div>
                <div class="paises-list">
                  <div class="pais-option" *ngFor="let pais of paisesFiltrados"
                    (click)="seleccionarPais(pais)">
                    <span>{{ pais.flag }}</span>
                    <span class="pais-name">{{ pais.name }}</span>
                    <span class="pais-code-opt">{{ pais.dialCode }}</span>
                  </div>
                </div>
              </div>
              <input id="telefono-carrito" type="tel" [(ngModel)]="telefonoNumero"
                placeholder="612 345 678" class="input-telefono" />
            </div>
            <div class="dropdown-backdrop" *ngIf="dropdownAbierto" (click)="dropdownAbierto = false"></div>
          </div>
          <button class="btn-comprar" (click)="iniciarCompra()" [disabled]="loading || !telefonoNumero">
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
      top: 80px;
      right: -420px;
      width: 400px;
      height: calc(100vh - 80px);
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

    .telefono-field {
      margin: 0.75rem 0;
      position: relative;
    }

    .telefono-field label {
      display: block;
      font-size: 0.85rem;
      font-weight: 600;
      color: #475569;
      margin-bottom: 0.35rem;
    }

    .telefono-input-wrapper {
      display: flex;
      align-items: stretch;
      border: 1.5px solid #cbd5e1;
      border-radius: 8px;
      overflow: visible;
      position: relative;
      background: white;
    }

    .pais-selector {
      display: flex;
      align-items: center;
      gap: 0.3rem;
      padding: 0.5rem 0.6rem;
      cursor: pointer;
      border-right: 1.5px solid #cbd5e1;
      background: #f8fafc;
      border-radius: 8px 0 0 8px;
      user-select: none;
      white-space: nowrap;
      flex-shrink: 0;
      transition: background 0.15s;
    }

    .pais-selector:hover {
      background: #f1f5f9;
    }

    .pais-flag {
      font-size: 1.15rem;
      line-height: 1;
    }

    .pais-dial {
      font-size: 0.82rem;
      font-weight: 600;
      color: #334155;
    }

    .pais-arrow {
      font-size: 0.6rem;
      color: #94a3b8;
      transition: transform 0.2s;
    }

    .pais-arrow.rotated {
      transform: rotate(180deg);
    }

    .paises-dropdown {
      position: absolute;
      top: calc(100% + 4px);
      left: 0;
      width: 280px;
      background: white;
      border: 1px solid #e2e8f0;
      border-radius: 10px;
      box-shadow: 0 8px 24px rgba(0,0,0,0.14);
      z-index: 9999;
      overflow: hidden;
    }

    .paises-search {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.6rem 0.75rem;
      border-bottom: 1px solid #f1f5f9;
    }

    .paises-search i {
      color: #94a3b8;
      font-size: 0.78rem;
      flex-shrink: 0;
    }

    .search-pais-input {
      width: 100%;
      border: none;
      outline: none;
      font-size: 0.87rem;
      color: #334155;
      background: transparent;
    }

    .paises-list {
      max-height: 210px;
      overflow-y: auto;
    }

    .pais-option {
      display: flex;
      align-items: center;
      gap: 0.5rem;
      padding: 0.45rem 0.75rem;
      cursor: pointer;
      font-size: 0.84rem;
      transition: background 0.12s;
    }

    .pais-option:hover {
      background: #f8fafc;
    }

    .pais-name {
      flex: 1;
      color: #334155;
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }

    .pais-code-opt {
      color: #94a3b8;
      font-size: 0.78rem;
      flex-shrink: 0;
    }

    .dropdown-backdrop {
      position: fixed;
      inset: 0;
      z-index: 9998;
    }

    .input-telefono {
      flex: 1;
      padding: 0.55rem 0.75rem;
      border: none;
      border-radius: 0 8px 8px 0;
      font-size: 0.95rem;
      outline: none;
      background: transparent;
      box-sizing: border-box;
      min-width: 0;
    }

    .input-telefono:focus {
      outline: none;
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
    
    @media (max-width: 768px) {
      .carrito-container {
        width: 100%;
        max-width: 400px;
        top: 70px;
        height: calc(100vh - 70px);
        right: -100%;
        border-radius: 0;
      }

      .carrito-header {
        border-radius: 0;
      }

      /* El dropdown de países nunca debe desbordar el panel */
      .paises-dropdown {
        width: 100%;
        max-width: calc(100vw - 3rem);
      }
    }

    @media (max-width: 480px) {
      .carrito-container {
        width: 100%;
        max-width: none;
        top: 64px;
        height: calc(100vh - 64px);
        right: -100%;
        border-radius: 0;
      }

      .carrito-items {
        padding: 1rem;
      }

      .carrito-item {
        padding: 0.85rem;
        gap: 0.75rem;
      }

      .item-imagen-container {
        width: 64px;
        height: 64px;
      }

      .carrito-footer {
        padding: 1.25rem 1rem;
      }

      .btn-comprar {
        min-height: 48px;
      }

      .btn-cantidad {
        width: 32px;
        height: 32px;
      }

      .paises-dropdown {
        width: 100%;
        max-width: calc(100vw - 2rem);
      }
    }
  `]
})
export class CarritoComponent implements OnInit, OnDestroy {
  carrito: Carrito = { items: [], total: 0 };
  abierto = false;
  loading = false;
  telefonoNumero = '';
  busquedaPais = '';
  dropdownAbierto = false;
  private subscription: Subscription | undefined;
  private stripePromise = loadStripe('pk_test_51RH3umPZPnVDLAtk0NrPnwnwZZDBvPzuO76pwCWHvCv8p8O1YjWZ1fYZKYDnjSgRMbIa6YJ71sgX5vVPFe6QSngw00TkDjQX3m');

  paises = [
    { code: 'AF', name: 'Afganistán', dialCode: '+93', flag: '🇦🇫' },
    { code: 'AL', name: 'Albania', dialCode: '+355', flag: '🇦🇱' },
    { code: 'DE', name: 'Alemania', dialCode: '+49', flag: '🇩🇪' },
    { code: 'AD', name: 'Andorra', dialCode: '+376', flag: '🇦🇩' },
    { code: 'AO', name: 'Angola', dialCode: '+244', flag: '🇦🇴' },
    { code: 'AG', name: 'Antigua y Barbuda', dialCode: '+1', flag: '🇦🇬' },
    { code: 'SA', name: 'Arabia Saudita', dialCode: '+966', flag: '🇸🇦' },
    { code: 'DZ', name: 'Argelia', dialCode: '+213', flag: '🇩🇿' },
    { code: 'AR', name: 'Argentina', dialCode: '+54', flag: '🇦🇷' },
    { code: 'AM', name: 'Armenia', dialCode: '+374', flag: '🇦🇲' },
    { code: 'AU', name: 'Australia', dialCode: '+61', flag: '🇦🇺' },
    { code: 'AT', name: 'Austria', dialCode: '+43', flag: '🇦🇹' },
    { code: 'AZ', name: 'Azerbaiyán', dialCode: '+994', flag: '🇦🇿' },
    { code: 'BS', name: 'Bahamas', dialCode: '+1', flag: '🇧🇸' },
    { code: 'BD', name: 'Bangladesh', dialCode: '+880', flag: '🇧🇩' },
    { code: 'BB', name: 'Barbados', dialCode: '+1', flag: '🇧🇧' },
    { code: 'BH', name: 'Baréin', dialCode: '+973', flag: '🇧🇭' },
    { code: 'BE', name: 'Bélgica', dialCode: '+32', flag: '🇧🇪' },
    { code: 'BZ', name: 'Belice', dialCode: '+501', flag: '🇧🇿' },
    { code: 'BJ', name: 'Benín', dialCode: '+229', flag: '🇧🇯' },
    { code: 'BY', name: 'Bielorrusia', dialCode: '+375', flag: '🇧🇾' },
    { code: 'BO', name: 'Bolivia', dialCode: '+591', flag: '🇧🇴' },
    { code: 'BA', name: 'Bosnia y Herzegovina', dialCode: '+387', flag: '🇧🇦' },
    { code: 'BW', name: 'Botsuana', dialCode: '+267', flag: '🇧🇼' },
    { code: 'BR', name: 'Brasil', dialCode: '+55', flag: '🇧🇷' },
    { code: 'BN', name: 'Brunéi', dialCode: '+673', flag: '🇧🇳' },
    { code: 'BG', name: 'Bulgaria', dialCode: '+359', flag: '🇧🇬' },
    { code: 'BF', name: 'Burkina Faso', dialCode: '+226', flag: '🇧🇫' },
    { code: 'BI', name: 'Burundi', dialCode: '+257', flag: '🇧🇮' },
    { code: 'BT', name: 'Bután', dialCode: '+975', flag: '🇧🇹' },
    { code: 'CV', name: 'Cabo Verde', dialCode: '+238', flag: '🇨🇻' },
    { code: 'KH', name: 'Camboya', dialCode: '+855', flag: '🇰🇭' },
    { code: 'CM', name: 'Camerún', dialCode: '+237', flag: '🇨🇲' },
    { code: 'CA', name: 'Canadá', dialCode: '+1', flag: '🇨🇦' },
    { code: 'QA', name: 'Catar', dialCode: '+974', flag: '🇶🇦' },
    { code: 'TD', name: 'Chad', dialCode: '+235', flag: '🇹🇩' },
    { code: 'CL', name: 'Chile', dialCode: '+56', flag: '🇨🇱' },
    { code: 'CN', name: 'China', dialCode: '+86', flag: '🇨🇳' },
    { code: 'CY', name: 'Chipre', dialCode: '+357', flag: '🇨🇾' },
    { code: 'VA', name: 'Ciudad del Vaticano', dialCode: '+39', flag: '🇻🇦' },
    { code: 'CO', name: 'Colombia', dialCode: '+57', flag: '🇨🇴' },
    { code: 'KM', name: 'Comoras', dialCode: '+269', flag: '🇰🇲' },
    { code: 'CD', name: 'Congo (RDC)', dialCode: '+243', flag: '🇨🇩' },
    { code: 'CG', name: 'Congo (Rep.)', dialCode: '+242', flag: '🇨🇬' },
    { code: 'KP', name: 'Corea del Norte', dialCode: '+850', flag: '🇰🇵' },
    { code: 'KR', name: 'Corea del Sur', dialCode: '+82', flag: '🇰🇷' },
    { code: 'CR', name: 'Costa Rica', dialCode: '+506', flag: '🇨🇷' },
    { code: 'CI', name: 'Costa de Marfil', dialCode: '+225', flag: '🇨🇮' },
    { code: 'HR', name: 'Croacia', dialCode: '+385', flag: '🇭🇷' },
    { code: 'CU', name: 'Cuba', dialCode: '+53', flag: '🇨🇺' },
    { code: 'DK', name: 'Dinamarca', dialCode: '+45', flag: '🇩🇰' },
    { code: 'DM', name: 'Dominica', dialCode: '+1', flag: '🇩🇲' },
    { code: 'EC', name: 'Ecuador', dialCode: '+593', flag: '🇪🇨' },
    { code: 'EG', name: 'Egipto', dialCode: '+20', flag: '🇪🇬' },
    { code: 'SV', name: 'El Salvador', dialCode: '+503', flag: '🇸🇻' },
    { code: 'AE', name: 'Emiratos Árabes Unidos', dialCode: '+971', flag: '🇦🇪' },
    { code: 'ER', name: 'Eritrea', dialCode: '+291', flag: '🇪🇷' },
    { code: 'SK', name: 'Eslovaquia', dialCode: '+421', flag: '🇸🇰' },
    { code: 'SI', name: 'Eslovenia', dialCode: '+386', flag: '🇸🇮' },
    { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' },
    { code: 'US', name: 'Estados Unidos', dialCode: '+1', flag: '🇺🇸' },
    { code: 'EE', name: 'Estonia', dialCode: '+372', flag: '🇪🇪' },
    { code: 'ET', name: 'Etiopía', dialCode: '+251', flag: '🇪🇹' },
    { code: 'PH', name: 'Filipinas', dialCode: '+63', flag: '🇵🇭' },
    { code: 'FI', name: 'Finlandia', dialCode: '+358', flag: '🇫🇮' },
    { code: 'FJ', name: 'Fiyi', dialCode: '+679', flag: '🇫🇯' },
    { code: 'FR', name: 'Francia', dialCode: '+33', flag: '🇫🇷' },
    { code: 'GA', name: 'Gabón', dialCode: '+241', flag: '🇬🇦' },
    { code: 'GM', name: 'Gambia', dialCode: '+220', flag: '🇬🇲' },
    { code: 'GE', name: 'Georgia', dialCode: '+995', flag: '🇬🇪' },
    { code: 'GH', name: 'Ghana', dialCode: '+233', flag: '🇬🇭' },
    { code: 'GD', name: 'Granada', dialCode: '+1', flag: '🇬🇩' },
    { code: 'GR', name: 'Grecia', dialCode: '+30', flag: '🇬🇷' },
    { code: 'GT', name: 'Guatemala', dialCode: '+502', flag: '🇬🇹' },
    { code: 'GN', name: 'Guinea', dialCode: '+224', flag: '🇬🇳' },
    { code: 'GQ', name: 'Guinea Ecuatorial', dialCode: '+240', flag: '🇬🇶' },
    { code: 'GW', name: 'Guinea-Bisáu', dialCode: '+245', flag: '🇬🇼' },
    { code: 'GY', name: 'Guyana', dialCode: '+592', flag: '🇬🇾' },
    { code: 'HT', name: 'Haití', dialCode: '+509', flag: '🇭🇹' },
    { code: 'HN', name: 'Honduras', dialCode: '+504', flag: '🇭🇳' },
    { code: 'HU', name: 'Hungría', dialCode: '+36', flag: '🇭🇺' },
    { code: 'IN', name: 'India', dialCode: '+91', flag: '🇮🇳' },
    { code: 'ID', name: 'Indonesia', dialCode: '+62', flag: '🇮🇩' },
    { code: 'IQ', name: 'Irak', dialCode: '+964', flag: '🇮🇶' },
    { code: 'IR', name: 'Irán', dialCode: '+98', flag: '🇮🇷' },
    { code: 'IE', name: 'Irlanda', dialCode: '+353', flag: '🇮🇪' },
    { code: 'IS', name: 'Islandia', dialCode: '+354', flag: '🇮🇸' },
    { code: 'MH', name: 'Islas Marshall', dialCode: '+692', flag: '🇲🇭' },
    { code: 'SB', name: 'Islas Salomón', dialCode: '+677', flag: '🇸🇧' },
    { code: 'IL', name: 'Israel', dialCode: '+972', flag: '🇮🇱' },
    { code: 'IT', name: 'Italia', dialCode: '+39', flag: '🇮🇹' },
    { code: 'JM', name: 'Jamaica', dialCode: '+1', flag: '🇯🇲' },
    { code: 'JP', name: 'Japón', dialCode: '+81', flag: '🇯🇵' },
    { code: 'JO', name: 'Jordania', dialCode: '+962', flag: '🇯🇴' },
    { code: 'KZ', name: 'Kazajistán', dialCode: '+7', flag: '🇰🇿' },
    { code: 'KE', name: 'Kenia', dialCode: '+254', flag: '🇰🇪' },
    { code: 'KG', name: 'Kirguistán', dialCode: '+996', flag: '🇰🇬' },
    { code: 'KI', name: 'Kiribati', dialCode: '+686', flag: '🇰🇮' },
    { code: 'KW', name: 'Kuwait', dialCode: '+965', flag: '🇰🇼' },
    { code: 'LA', name: 'Laos', dialCode: '+856', flag: '🇱🇦' },
    { code: 'LS', name: 'Lesoto', dialCode: '+266', flag: '🇱🇸' },
    { code: 'LV', name: 'Letonia', dialCode: '+371', flag: '🇱🇻' },
    { code: 'LB', name: 'Líbano', dialCode: '+961', flag: '🇱🇧' },
    { code: 'LR', name: 'Liberia', dialCode: '+231', flag: '🇱🇷' },
    { code: 'LY', name: 'Libia', dialCode: '+218', flag: '🇱🇾' },
    { code: 'LI', name: 'Liechtenstein', dialCode: '+423', flag: '🇱🇮' },
    { code: 'LT', name: 'Lituania', dialCode: '+370', flag: '🇱🇹' },
    { code: 'LU', name: 'Luxemburgo', dialCode: '+352', flag: '🇱🇺' },
    { code: 'MK', name: 'Macedonia del Norte', dialCode: '+389', flag: '🇲🇰' },
    { code: 'MG', name: 'Madagascar', dialCode: '+261', flag: '🇲🇬' },
    { code: 'MY', name: 'Malasia', dialCode: '+60', flag: '🇲🇾' },
    { code: 'MW', name: 'Malaui', dialCode: '+265', flag: '🇲🇼' },
    { code: 'MV', name: 'Maldivas', dialCode: '+960', flag: '🇲🇻' },
    { code: 'ML', name: 'Mali', dialCode: '+223', flag: '🇲🇱' },
    { code: 'MT', name: 'Malta', dialCode: '+356', flag: '🇲🇹' },
    { code: 'MA', name: 'Marruecos', dialCode: '+212', flag: '🇲🇦' },
    { code: 'MU', name: 'Mauricio', dialCode: '+230', flag: '🇲🇺' },
    { code: 'MR', name: 'Mauritania', dialCode: '+222', flag: '🇲🇷' },
    { code: 'MX', name: 'México', dialCode: '+52', flag: '🇲🇽' },
    { code: 'FM', name: 'Micronesia', dialCode: '+691', flag: '🇫🇲' },
    { code: 'MD', name: 'Moldavia', dialCode: '+373', flag: '🇲🇩' },
    { code: 'MC', name: 'Mónaco', dialCode: '+377', flag: '🇲🇨' },
    { code: 'MN', name: 'Mongolia', dialCode: '+976', flag: '🇲🇳' },
    { code: 'ME', name: 'Montenegro', dialCode: '+382', flag: '🇲🇪' },
    { code: 'MZ', name: 'Mozambique', dialCode: '+258', flag: '🇲🇿' },
    { code: 'MM', name: 'Myanmar', dialCode: '+95', flag: '🇲🇲' },
    { code: 'NA', name: 'Namibia', dialCode: '+264', flag: '🇳🇦' },
    { code: 'NR', name: 'Nauru', dialCode: '+674', flag: '🇳🇷' },
    { code: 'NP', name: 'Nepal', dialCode: '+977', flag: '🇳🇵' },
    { code: 'NI', name: 'Nicaragua', dialCode: '+505', flag: '🇳🇮' },
    { code: 'NE', name: 'Níger', dialCode: '+227', flag: '🇳🇪' },
    { code: 'NG', name: 'Nigeria', dialCode: '+234', flag: '🇳🇬' },
    { code: 'NO', name: 'Noruega', dialCode: '+47', flag: '🇳🇴' },
    { code: 'NZ', name: 'Nueva Zelanda', dialCode: '+64', flag: '🇳🇿' },
    { code: 'OM', name: 'Omán', dialCode: '+968', flag: '🇴🇲' },
    { code: 'NL', name: 'Países Bajos', dialCode: '+31', flag: '🇳🇱' },
    { code: 'PK', name: 'Pakistán', dialCode: '+92', flag: '🇵🇰' },
    { code: 'PW', name: 'Palaos', dialCode: '+680', flag: '🇵🇼' },
    { code: 'PA', name: 'Panamá', dialCode: '+507', flag: '🇵🇦' },
    { code: 'PG', name: 'Papúa Nueva Guinea', dialCode: '+675', flag: '🇵🇬' },
    { code: 'PY', name: 'Paraguay', dialCode: '+595', flag: '🇵🇾' },
    { code: 'PE', name: 'Perú', dialCode: '+51', flag: '🇵🇪' },
    { code: 'PL', name: 'Polonia', dialCode: '+48', flag: '🇵🇱' },
    { code: 'PT', name: 'Portugal', dialCode: '+351', flag: '🇵🇹' },
    { code: 'GB', name: 'Reino Unido', dialCode: '+44', flag: '🇬🇧' },
    { code: 'CF', name: 'Rep. Centroafricana', dialCode: '+236', flag: '🇨🇫' },
    { code: 'CZ', name: 'Rep. Checa', dialCode: '+420', flag: '🇨🇿' },
    { code: 'DO', name: 'Rep. Dominicana', dialCode: '+1', flag: '🇩🇴' },
    { code: 'RW', name: 'Ruanda', dialCode: '+250', flag: '🇷🇼' },
    { code: 'RO', name: 'Rumanía', dialCode: '+40', flag: '🇷🇴' },
    { code: 'RU', name: 'Rusia', dialCode: '+7', flag: '🇷🇺' },
    { code: 'WS', name: 'Samoa', dialCode: '+685', flag: '🇼🇸' },
    { code: 'KN', name: 'San Cristóbal y Nieves', dialCode: '+1', flag: '🇰🇳' },
    { code: 'SM', name: 'San Marino', dialCode: '+378', flag: '🇸🇲' },
    { code: 'VC', name: 'San Vicente y las Granadinas', dialCode: '+1', flag: '🇻🇨' },
    { code: 'LC', name: 'Santa Lucía', dialCode: '+1', flag: '🇱🇨' },
    { code: 'ST', name: 'Santo Tomé y Príncipe', dialCode: '+239', flag: '🇸🇹' },
    { code: 'SN', name: 'Senegal', dialCode: '+221', flag: '🇸🇳' },
    { code: 'RS', name: 'Serbia', dialCode: '+381', flag: '🇷🇸' },
    { code: 'SC', name: 'Seychelles', dialCode: '+248', flag: '🇸🇨' },
    { code: 'SL', name: 'Sierra Leona', dialCode: '+232', flag: '🇸🇱' },
    { code: 'SG', name: 'Singapur', dialCode: '+65', flag: '🇸🇬' },
    { code: 'SY', name: 'Siria', dialCode: '+963', flag: '🇸🇾' },
    { code: 'SO', name: 'Somalia', dialCode: '+252', flag: '🇸🇴' },
    { code: 'LK', name: 'Sri Lanka', dialCode: '+94', flag: '🇱🇰' },
    { code: 'SZ', name: 'Suazilandia', dialCode: '+268', flag: '🇸🇿' },
    { code: 'ZA', name: 'Sudáfrica', dialCode: '+27', flag: '🇿🇦' },
    { code: 'SD', name: 'Sudán', dialCode: '+249', flag: '🇸🇩' },
    { code: 'SS', name: 'Sudán del Sur', dialCode: '+211', flag: '🇸🇸' },
    { code: 'SE', name: 'Suecia', dialCode: '+46', flag: '🇸🇪' },
    { code: 'CH', name: 'Suiza', dialCode: '+41', flag: '🇨🇭' },
    { code: 'SR', name: 'Surinam', dialCode: '+597', flag: '🇸🇷' },
    { code: 'TH', name: 'Tailandia', dialCode: '+66', flag: '🇹🇭' },
    { code: 'TZ', name: 'Tanzania', dialCode: '+255', flag: '🇹🇿' },
    { code: 'TJ', name: 'Tayikistán', dialCode: '+992', flag: '🇹🇯' },
    { code: 'TL', name: 'Timor Oriental', dialCode: '+670', flag: '🇹🇱' },
    { code: 'TG', name: 'Togo', dialCode: '+228', flag: '🇹🇬' },
    { code: 'TO', name: 'Tonga', dialCode: '+676', flag: '🇹🇴' },
    { code: 'TT', name: 'Trinidad y Tobago', dialCode: '+1', flag: '🇹🇹' },
    { code: 'TN', name: 'Túnez', dialCode: '+216', flag: '🇹🇳' },
    { code: 'TM', name: 'Turkmenistán', dialCode: '+993', flag: '🇹🇲' },
    { code: 'TR', name: 'Turquía', dialCode: '+90', flag: '🇹🇷' },
    { code: 'TV', name: 'Tuvalu', dialCode: '+688', flag: '🇹🇻' },
    { code: 'UA', name: 'Ucrania', dialCode: '+380', flag: '🇺🇦' },
    { code: 'UG', name: 'Uganda', dialCode: '+256', flag: '🇺🇬' },
    { code: 'UY', name: 'Uruguay', dialCode: '+598', flag: '🇺🇾' },
    { code: 'UZ', name: 'Uzbekistán', dialCode: '+998', flag: '🇺🇿' },
    { code: 'VU', name: 'Vanuatu', dialCode: '+678', flag: '🇻🇺' },
    { code: 'VE', name: 'Venezuela', dialCode: '+58', flag: '🇻🇪' },
    { code: 'VN', name: 'Vietnam', dialCode: '+84', flag: '🇻🇳' },
    { code: 'YE', name: 'Yemen', dialCode: '+967', flag: '🇾🇪' },
    { code: 'DJ', name: 'Yibuti', dialCode: '+253', flag: '🇩🇯' },
    { code: 'ZM', name: 'Zambia', dialCode: '+260', flag: '🇿🇲' },
    { code: 'ZW', name: 'Zimbabue', dialCode: '+263', flag: '🇿🇼' },
  ];

  paisSeleccionado = { code: 'ES', name: 'España', dialCode: '+34', flag: '🇪🇸' };

  get paisesFiltrados() {
    if (!this.busquedaPais) return this.paises;
    const t = this.busquedaPais.toLowerCase();
    return this.paises.filter(p =>
      p.name.toLowerCase().includes(t) || p.dialCode.includes(t)
    );
  }

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

  toggleDropdown() {
    this.dropdownAbierto = !this.dropdownAbierto;
    if (this.dropdownAbierto) this.busquedaPais = '';
  }

  seleccionarPais(pais: any) {
    this.paisSeleccionado = pais;
    this.dropdownAbierto = false;
    this.busquedaPais = '';
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
      const telefono = this.paisSeleccionado.dialCode + this.telefonoNumero;
      const sessionId = await this.tiendaService.iniciarPagoCarrito(telefono);
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
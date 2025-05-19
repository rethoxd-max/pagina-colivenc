import { Component } from '@angular/core';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-cancel',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <div class="card">
            <div class="card-body">
              <h1 class="card-title text-danger mb-4">
                <i class="fas fa-times-circle"></i> Pago Cancelado
              </h1>
              <p class="lead">El proceso de pago ha sido cancelado.</p>
              <p>Si tienes alguna pregunta, no dudes en contactarnos.</p>
              <button class="btn btn-primary mt-3" (click)="volverATienda()">
                Volver a la tienda
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .card {
      box-shadow: 0 4px 8px rgba(0,0,0,0.1);
      border: none;
      border-radius: 10px;
    }
    .text-danger {
      color: #dc3545;
    }
    .fas {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
  `]
})
export class CancelComponent {
  constructor(private router: Router) {}

  volverATienda() {
    this.router.navigate(['/tienda']);
  }
} 
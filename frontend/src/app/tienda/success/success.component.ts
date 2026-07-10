import { Component, OnInit } from '@angular/core';
import { ActivatedRoute, Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-success',
  standalone: true,
  imports: [CommonModule, RouterModule],
  template: `
    <div class="container mt-5">
      <div class="row justify-content-center">
        <div class="col-md-8 text-center">
          <div class="card">
            <div class="card-body">
              <h1 class="card-title text-success mb-4">
                <i class="fas fa-check-circle"></i> ¡Pago Exitoso!
              </h1>
              <p class="lead">Gracias por tu compra. Tu pedido ha sido procesado correctamente.</p>
              <p>Te enviaremos un correo electrónico con los detalles de tu compra.</p>
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
    .text-success {
      color: #28a745;
    }
    .fas {
      font-size: 3rem;
      margin-bottom: 1rem;
    }
    .card-body {
      padding: 2rem;
    }
    .btn {
      min-height: 44px;
    }
    @media (max-width: 480px) {
      .container.mt-5 {
        margin-top: 1.5rem !important;
      }
      .card-body {
        padding: 1.5rem 1rem;
      }
      .card-title {
        font-size: 1.5rem;
      }
      .fas {
        font-size: 2.25rem;
      }
      .lead {
        font-size: 1rem;
      }
    }
  `]
})
export class SuccessComponent implements OnInit {
  constructor(
    private route: ActivatedRoute,
    private router: Router,
  ) {}

  ngOnInit() {
    const sessionId = this.route.snapshot.queryParamMap.get('session_id');
    if (sessionId) {
      // Aquí podrías verificar el estado del pago si es necesario
      console.log('Session ID:', sessionId);
    }
  }

  volverATienda() {
    this.router.navigate(['/tienda']);
  }
} 
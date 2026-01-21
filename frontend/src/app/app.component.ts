import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { PerfilAtletaService } from './ranking/services/perfil-atleta.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NgIf, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'pagina-colivenc';
  isLoggedIn: boolean = false;  // Variable para almacenar el estado de autenticación
  atletaId: string | null = null; // Variable para almacenar el ID del atleta
  atletaSlug: string | null = null; // Variable para almacenar el slug del atleta
  private authSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private perfilAtletaService: PerfilAtletaService // Inyección del servicio de atleta
  ) { }

  ngOnInit(): void {
    // Verificar el estado de autenticación inicial
    this.updateAuthState(this.authService.isAuthenticated());

    // Suscribirse a cambios en el estado de autenticación
    this.authSubscription = this.authService.getIsLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.updateAuthState(isLoggedIn);
    });

    // Suscribirse a cambios en la navegación
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Cuando cambia la ruta, verificamos nuevamente la autenticación
        // Esto ayuda a manejar casos donde el usuario recarga la página
        if (this.authService.isAuthenticated()) {
          this.updateAuthState(true);
        }
      });
  }

  ngOnDestroy(): void {
    // Limpiar suscripciones al destruir el componente
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
    if (this.routerSubscription) {
      this.routerSubscription.unsubscribe();
    }
  }

  updateAuthState(isLoggedIn: boolean): void {
    this.isLoggedIn = isLoggedIn;

    if (isLoggedIn) {
      const userId = this.authService.getUserId();
      
      if (userId) {
        // Obtener el ID del atleta correspondiente al usuario logueado
        this.perfilAtletaService.getAtletaByUserId(userId).subscribe({
          next: (atleta) => {
            if (atleta && (atleta.slug || atleta._id)) {
              this.atletaId = atleta._id;
              this.atletaSlug = atleta.slug || atleta._id;
              const identificador = atleta.slug || atleta._id;
              
              // Solo redirigir si estamos exactamente en la ruta '/perfil-atleta' sin ID
              const url = this.router.url;
              if (url === '/perfil-atleta') {
                this.router.navigate(['/perfil-atleta', identificador]);
              }
            } else {
              console.warn('El usuario actual no tiene un atleta asociado');
              this.atletaId = null;
              this.atletaSlug = null;
            }
          },
          error: (error) => {
            console.error('Error al obtener el atleta del usuario:', error);
            this.atletaId = null;
            this.atletaSlug = null;
          }
        });
      } else {
        console.warn('Usuario logueado pero sin ID');
        this.atletaId = null;
      }
    } else {
      console.log('Usuario no logueado');
      this.atletaId = null;
    }
  }

  logout(): void {
    // Limpiar datos del usuario y redirigir
    this.authService.logout();
    this.atletaId = null;
    this.router.navigate(['/']);
  }

  isAdmin(): boolean {
    return this.authService.isAdmin();
  }
}

import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { PerfilAtletaService } from './ranking/services/perfil-atleta.service';
import { Subscription, filter } from 'rxjs';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NgIf, RouterLink],  // Importa el RouterModule para usar router-outlet
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'pagina-colivenc';
  isLoggedIn: boolean = false;  // Variable para almacenar el estado de autenticación
  atletaId: string | null = null; // Variable para almacenar el ID del atleta
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
            if (atleta && atleta._id) {
              this.atletaId = atleta._id;
              
              // Si estamos en la ruta de perfil-atleta, actualizar la URL si es necesario
              const url = this.router.url;
              if (url.includes('/perfil-atleta') && !url.includes(atleta._id)) {
                this.router.navigate(['/perfil-atleta', atleta._id]);
              }
            } else {
              console.warn('El usuario actual no tiene un atleta asociado');
              this.atletaId = null;
            }
          },
          error: (error) => {
            console.error('Error al obtener el atleta del usuario:', error);
            this.atletaId = null;
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

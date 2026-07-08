import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, RouterLink, RouterModule, NavigationEnd } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { AtletaService } from './services/atleta.service';
import { Subscription, filter } from 'rxjs';
import { DisciplinaService, Disciplina } from './services/disciplina.service';
import { DisciplinaFilterService } from './services/disciplina-filter.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NgIf, RouterLink, CommonModule],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent implements OnInit, OnDestroy {
  title = 'pagina-colivenc';
  currentYear = new Date().getFullYear();
  isLoggedIn: boolean = false;
  atletaId: string | null = null;
  disciplinas: Disciplina[] = [];
  disciplinaSeleccionada: string | null = null;
  dropdownAbierto = false;
  private authSubscription: Subscription | null = null;
  private routerSubscription: Subscription | null = null;

  constructor(
    private authService: AuthService,
    private router: Router,
    private atletaService: AtletaService,
    private disciplinaService: DisciplinaService,
    public disciplinaFilterService: DisciplinaFilterService
  ) { }

  ngOnInit(): void {
    // Verificar el estado de autenticación inicial
    this.updateAuthState(this.authService.isAuthenticated());
    // Cargar disciplinas para el filtro
    this.disciplinaService.getDisciplinas().subscribe(d => { this.disciplinas = d; });
    this.disciplinaFilterService.disciplina$.subscribe(id => { this.disciplinaSeleccionada = id; });

    // Suscribirse a cambios en el estado de autenticación
    this.authSubscription = this.authService.getIsLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.updateAuthState(isLoggedIn);
    });

    // Suscribirse a cambios en la navegación
    this.routerSubscription = this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe(() => {
        // Re-evaluar el estado real en cada navegación (detecta tokens expirados)
        const isAuth = this.authService.isAuthenticated();
        if (!isAuth && this.isLoggedIn) {
          // Token expiró durante la sesión: limpiar y cerrar sesión
          this.authService.logout();
        }
        this.updateAuthState(isAuth);
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
        // (se usa para mostrar el acceso a "Entrenamientos" en la barra lateral)
        this.atletaService.getAtletaByUserId(userId).subscribe({
          next: (atleta) => {
            if (atleta && atleta._id) {
              this.atletaId = atleta._id;
            } else {
              this.atletaId = null;
            }
          },
          error: () => {
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

  isEditor(): boolean {
    return this.authService.isEditor();
  }

  seleccionarDisciplina(id: string | null): void {
    this.disciplinaFilterService.setDisciplina(id);
    this.dropdownAbierto = false;
  }

  getNombreDisciplina(): string {
    if (!this.disciplinaSeleccionada) return 'Todas';
    const d = this.disciplinas.find(d => d._id === this.disciplinaSeleccionada);
    return d ? d.nombre : 'Todas';
  }

  getDisciplinaActual(): Disciplina | null {
    if (!this.disciplinaSeleccionada) return null;
    return this.disciplinas.find(d => d._id === this.disciplinaSeleccionada) ?? null;
  }
}

import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { CommonModule, NgIf } from '@angular/common';
import { PerfilAtletaService } from './ranking/services/perfil-atleta.service';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NgIf, RouterLink],  // Importa el RouterModule para usar router-outlet
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  title = 'pagina-colivenc';
  isLoggedIn: boolean = false;  // Variable para almacenar el estado de autenticación
  atletaId: string | null = null; // Variable para almacenar el ID del atleta

  constructor(
    private authService: AuthService,
    private router: Router,
    private perfilAtletaService: PerfilAtletaService // Inyección del servicio de atleta
  ) { }

  ngOnInit(): void {
    this.authService.getIsLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;

      if (this.isLoggedIn) {
        const userId = this.authService.getUserId(); // Método que obtenga el ID del usuario logueado
        this.perfilAtletaService.getAtletaByUserId(userId).subscribe(atleta => {
          this.atletaId = atleta._id; // Almacenar el ID del atleta
        });
      } else {
        this.atletaId = null; // Reiniciar el atletaId si el usuario no está logueado
      }
    });
  }

  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }

  isAdmin(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Admin');
  }
}

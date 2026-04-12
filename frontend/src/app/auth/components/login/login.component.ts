import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';
import { SolicitudCuentaComponent } from '../solicitud-cuenta/solicitud-cuenta.component';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, SolicitudCuentaComponent],
  templateUrl: './login.component.html',
  styleUrls: ['./login.component.css'],
})
export class LoginComponent implements OnInit {
  user = { email: '', password: '' };
  errorMessage: string | null = null;
  returnUrl: string = '/home';

  constructor(
    private authService: AuthService, 
    private router: Router,
    private route: ActivatedRoute
  ) {
    console.log('LoginComponent constructor - URL actual:', this.router.url);
  }

  ngOnInit() {
    console.log('LoginComponent ngOnInit - URL actual:', this.router.url);
    console.log('Query params:', this.route.snapshot.queryParams);
    
    if (this.authService.isLoggedIn()) {
      console.log('Usuario ya está logueado, redirigiendo a home');
      this.router.navigate(['/home']);
      return;
    }

    // Obtener la URL de retorno de los query params
    let returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
    
    // Validar que no sea la página de login ni una URL malformada
    if (returnUrl.includes('/login') || returnUrl.includes('%2F') || returnUrl.includes('returnUrl')) {
      returnUrl = '/home';
    }
    
    this.returnUrl = returnUrl;
    console.log('URL de retorno configurada:', this.returnUrl);
  }

  onSubmit() {
    console.log('Iniciando proceso de login...');
    this.errorMessage = null;

    this.authService.login(this.user).subscribe({
      next: (response) => {
        console.log('Login exitoso, guardando datos...');
        this.authService.saveToken(response.token);
        this.authService.saveUserData(response.user);
        
        console.log('Redirigiendo a:', this.returnUrl);
        this.router.navigate([this.returnUrl]);
      },
      error: (error) => {
        console.error('Error en login:', error);
        this.errorMessage = error.error?.msg || 'Error al iniciar sesión';
      }
    });
  }
}

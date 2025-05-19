import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, ActivatedRoute } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule],
  templateUrl: './login.component.html',
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
    this.returnUrl = this.route.snapshot.queryParams['returnUrl'] || '/home';
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

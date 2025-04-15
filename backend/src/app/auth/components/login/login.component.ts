import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: './login.component.html',
})
export class LoginComponent {
  user = { email: '', password: '' };
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    this.authService.login(this.user).subscribe(
      response => {
        this.authService.saveToken(response.token);
        this.router.navigate(['posts']);
      },
      error => {
        // Mostrar mensaje de error devuelto por el backend
        this.errorMessage = error.error.msg || 'Error al iniciar sesión';
      }
    );
  }
}

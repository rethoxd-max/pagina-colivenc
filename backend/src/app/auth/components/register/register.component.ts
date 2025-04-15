import { Component } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: 'register.component.html',
})
export class RegisterComponent {
  user = { name: '', email: '', password: '' };
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    this.authService.register(this.user).subscribe(
      response => {
        this.router.navigate(['posts']);
      },
      error => {
        // Mostrar mensaje de error devuelto por el backend
        this.errorMessage = error.error.msg || 'Error al registrar usuario';
      }
    );
  }
}

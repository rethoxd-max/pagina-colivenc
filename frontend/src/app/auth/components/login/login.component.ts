import { Component, OnInit } from '@angular/core';
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
export class LoginComponent implements OnInit {
  user = { email: '', password: '' };
  errorMessage: string | null = null;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    if (this.authService.isLoggedIn()) {
      this.router.navigate(['/home']);
    }
  }

  onSubmit() {
    this.authService.login(this.user).subscribe(
      response => {
        this.authService.saveToken(response.token);
        this.authService.saveUserData(response.user);
        this.router.navigate(['home']);
      },
      error => {
        // Mostrar mensaje de error devuelto por el backend
        this.errorMessage = error.error.msg || 'Error al iniciar sesión';
      }
    );
  }
}

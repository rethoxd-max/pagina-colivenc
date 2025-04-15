import { Component } from '@angular/core';
import { AuthService, Usuario } from '../../services/auth.service';
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
  // Ajustar el modelo para incluir el campo userTypes
  user: Usuario = {
    id: '',
    name: '',
    email: '',
    password: '',
    userTypes: [] // Inicializar userTypes como un arreglo vacío
  };
  errorMessage: string | null = null;

  userTypeOptions = ['Admin', 'Atleta', 'Entrenador', 'Editor', 'Viewer']; // Tipos de usuario disponibles

  constructor(private authService: AuthService, private router: Router) { }

  onSubmit() {
    this.authService.register(this.user).subscribe(
      response => {
        this.router.navigate(['login']);
      },
      error => {
        // Mostrar mensaje de error devuelto por el backend
        this.errorMessage = error.error.msg || 'Error al registrar usuario';
      }
    );
  }

  // Método para gestionar la selección de tipos de usuario
  toggleUserType(type: string) {
    const index = this.user.userTypes.indexOf(type);
    if (index === -1) {
      this.user.userTypes.push(type); // Añadir tipo si no está seleccionado
    } else {
      this.user.userTypes.splice(index, 1); // Quitar tipo si está seleccionado
    }
  }
}

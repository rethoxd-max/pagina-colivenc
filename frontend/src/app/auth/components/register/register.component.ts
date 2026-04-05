import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';

interface RegisterForm {
  id: string;
  name: string;
  email: string;
  password: string;
  userTypes: string[];
  fechaNacimiento?: string;
  numeroLicencia?: string;
  activo?: boolean;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink],
  templateUrl: 'register.component.html',
})
export class RegisterComponent implements OnInit {
  user: RegisterForm = {
    id: '',
    name: '',
    email: '',
    password: '',
    userTypes: [],
    fechaNacimiento: '',
    numeroLicencia: '',
    activo: true
  };
  errorMessage: string | null = null;

  userTypeOptions = ['Admin', 'Atleta', 'Entrenador', 'Editor', 'Viewer']; // Tipos de usuario disponibles

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {
    // Registro abierto a cualquier persona
  }

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

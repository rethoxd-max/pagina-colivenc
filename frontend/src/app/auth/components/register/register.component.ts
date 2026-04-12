import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../services/auth.service';
import { FormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Router, RouterLink } from '@angular/router';
import { SolicitudCuentaComponent } from '../solicitud-cuenta/solicitud-cuenta.component';

interface RegisterForm {
  id: string;
  name: string;
  email: string;
  password: string;
  confirmarPassword: string;
  codigoInvitacion: string;
  fechaNacimiento?: string;
  numeroLicencia?: string;
  dni?: string;
  telefono?: string;
}

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [FormsModule, CommonModule, RouterLink, SolicitudCuentaComponent],
  templateUrl: 'register.component.html',
  styleUrls: ['./register.component.css'],
})
export class RegisterComponent implements OnInit {
  user: RegisterForm = {
    id: '',
    name: '',
    email: '',
    password: '',
    confirmarPassword: '',
    codigoInvitacion: '',
    fechaNacimiento: '',
    numeroLicencia: '',
    dni: '',
    telefono: ''
  };
  errorMessage: string | null = null;
  registroExitoso = false;

  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit() {}

  onSubmit() {
    if (this.user.password !== this.user.confirmarPassword) {
      this.errorMessage = 'Las contraseñas no coinciden';
      return;
    }
    const { confirmarPassword, id, ...payload } = this.user;
    this.authService.register(payload).subscribe(
      response => {
        this.registroExitoso = true;
        setTimeout(() => this.router.navigate(['login']), 2000);
      },
      error => {
        this.errorMessage = error.error.msg || error.error.errors?.[0]?.msg || 'Error al registrar usuario';
      }
    );
  }
}

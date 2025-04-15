import { Injectable, inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../services/auth.service';

export const AuthGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isLoggedIn()) {
    return true; // El usuario está autenticado, permite el acceso
  } else {
    router.navigate(['/login']); // Redirige al login si no está autenticado
    return false; // Bloquea el acceso a la ruta
  }
};

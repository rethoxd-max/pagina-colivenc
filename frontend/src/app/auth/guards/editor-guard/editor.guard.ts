import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const editorGuard: CanActivateFn = (route, state) => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isEditor()) {
    return true; // El usuario es admin, permite el acceso
  } else {
    router.navigate(['/home']); // Redirige al login si no es admin
    return false; // Bloquea el acceso
  }
};

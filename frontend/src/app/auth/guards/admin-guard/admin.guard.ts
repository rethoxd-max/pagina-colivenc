import { inject } from '@angular/core';
import { CanActivateFn, Router } from '@angular/router';
import { AuthService } from '../../services/auth.service';

export const adminGuard: CanActivateFn = () => {
  const authService = inject(AuthService);
  const router = inject(Router);

  if (authService.isTokenExpired()) {
    authService.handleExpiredToken();
    router.navigate(['/login']);
    return false;
  }

  if (authService.isAdmin()) {
    return true;
  } else {
    router.navigate(['/home']);
    return false;
  }
};


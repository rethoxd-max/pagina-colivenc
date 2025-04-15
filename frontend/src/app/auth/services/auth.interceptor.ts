import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';  // Importa tu servicio de autenticación
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService); // Utiliza la función inject para obtener dependencias
    const router = inject(Router);

    const authToken = authService.getToken();

    let authReq = req;
    if (authToken) {
        authReq = req.clone({
            setHeaders: {
                Authorization: `Bearer ${authToken}`
            }
        });
    }

    return next(authReq).pipe(
        catchError(err => {
            if (err.status === 401) {
                // Si la respuesta es 401, redirige al login y limpia el token
                authService.logout();
                router.navigate(['/login']);
            }
            return throwError(err);
        })
    );
};

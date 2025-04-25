import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';  // Importa tu servicio de autenticación
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService); // Utiliza la función inject para obtener dependencias
    const router = inject(Router);

    // Si la petición es para el calendario, no requerir autenticación
    if (req.url.includes('/calendarios-entrenamiento/') || 
        req.url.includes('/dias-entrenamiento/') ||
        req.url.includes('/competiciones')) {
        return next(req);
    }

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
            // Ya no deslogueamos automáticamente al usuario
            return throwError(err);
        })
    );
};

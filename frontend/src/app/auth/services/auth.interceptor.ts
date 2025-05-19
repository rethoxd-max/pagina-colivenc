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
    console.log('Interceptor - Token presente:', !!authToken);

    let authReq = req;
    if (authToken) {
        authReq = req.clone({
            setHeaders: {
                'x-auth-token': authToken
            }
        });
    }

    return next(authReq).pipe(
        catchError(err => {
            console.log('Interceptor - Error:', err.status);
            if (err.status === 401) {
                console.log('Interceptor - Redirigiendo a login');
                const currentUrl = router.url;
                router.navigate(['/login'], { queryParams: { returnUrl: currentUrl } });
            }
            return throwError(() => err);
        })
    );
};

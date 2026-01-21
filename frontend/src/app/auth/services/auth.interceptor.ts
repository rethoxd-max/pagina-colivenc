import { HttpInterceptorFn } from '@angular/common/http';
import { inject } from '@angular/core';
import { Router } from '@angular/router';
import { AuthService } from './auth.service';
import { catchError, throwError } from 'rxjs';

export const authInterceptor: HttpInterceptorFn = (req, next) => {
    const authService = inject(AuthService);
    const router = inject(Router);

    // Excluir rutas de autenticación de la verificación de token
    const isAuthRoute = req.url.includes('/auth/login') || 
                        req.url.includes('/auth/register');

    // Verificar si el token está expirado antes de hacer la petición (excepto rutas de auth)
    if (!isAuthRoute && authService.getToken() && authService.isTokenExpired()) {
        console.log('Interceptor - Token expirado localmente, limpiando sesión');
        authService.handleExpiredToken();
        router.navigate(['/login'], { 
            queryParams: { 
                returnUrl: router.url,
                reason: 'session_expired'
            } 
        });
        return throwError(() => new Error('Token expirado'));
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
            console.log('Interceptor - Error:', err.status, err.error?.code);
            
            if (err.status === 401) {
                const errorCode = err.error?.code;
                
                if (errorCode === 'TOKEN_EXPIRED') {
                    console.log('Interceptor - Token expirado en servidor');
                    authService.handleExpiredToken();
                    router.navigate(['/login'], { 
                        queryParams: { 
                            returnUrl: router.url,
                            reason: 'session_expired'
                        } 
                    });
                } else {
                    console.log('Interceptor - Error de autenticación, redirigiendo a login');
                    authService.logout();
                    router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
                }
            }
            return throwError(() => err);
        })
    );
};

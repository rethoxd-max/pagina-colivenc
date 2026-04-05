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
    
    // Excluir rutas de checkout de la tienda (accesibles sin cuenta)
    const isCheckoutRoute = req.url.includes('/tienda/crear-sesion');

    // Verificar si el token está expirado antes de hacer la petición (excepto rutas de auth y checkout)
    if (!isAuthRoute && !isCheckoutRoute && authService.getToken() && authService.isTokenExpired()) {
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
            
            if (err.status === 401) {
                const errorCode = err.error?.code;
                
                // No redirigir a login si el error viene de las rutas de checkout
                if (isCheckoutRoute) {
                    return throwError(() => err);
                }
                
                if (errorCode === 'TOKEN_EXPIRED') {
                    authService.handleExpiredToken();
                    router.navigate(['/login'], { 
                        queryParams: { 
                            returnUrl: router.url,
                            reason: 'session_expired'
                        } 
                    });
                } else {
                    authService.logout();
                    router.navigate(['/login'], { queryParams: { returnUrl: router.url } });
                }
            }
            return throwError(() => err);
        })
    );
};

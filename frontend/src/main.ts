import { provideRouter, RouterModule } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { authInterceptor } from './app/auth/services/auth.interceptor';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';

import { routes } from './app/app.routes';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter(routes), provideAnimationsAsync(), provideAnimationsAsync(), provideAnimationsAsync()
  ]
});

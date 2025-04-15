import { provideRouter, RouterModule } from '@angular/router';
import { bootstrapApplication } from '@angular/platform-browser';
import { provideHttpClient, withInterceptors } from '@angular/common/http';
import { AppComponent } from './app/app.component';
import { RegisterComponent } from './app/auth/components/register/register.component';
import { LoginComponent } from './app/auth/components/login/login.component';
import { AuthGuard } from './app/auth/guards/auth.guard';
import { PostListComponent } from './app/posts/components/post-list/post-list.component';
import { EditPostComponent } from './app/posts/components/edit-post/edit-post.component';
import { PostFormComponent } from './app/posts/components/post-form/post-form.component';
import { authInterceptor } from './app/auth/services/auth.interceptor';
import { RankingComponent } from './app/ranking/ranking.component';
import { provideAnimationsAsync } from '@angular/platform-browser/animations/async';
import { CreatePerformanceComponent } from './app/ranking/create-performance/create-performance.component';
import { CreateAtletaComponent } from './app/ranking/create-performance/components/create-atleta/create-atleta.component';
import { CreatePruebaComponent } from './app/ranking/create-performance/components/create-prueba/create-prueba.component';

bootstrapApplication(AppComponent, {
  providers: [
    provideHttpClient(withInterceptors([authInterceptor])),
    provideRouter([
      { path: 'posts', component: PostListComponent, },
      { path: 'create', component: PostFormComponent, canActivate: [AuthGuard] },
      { path: 'edit/:id', component: EditPostComponent, canActivate: [AuthGuard] }, { path: 'login', component: LoginComponent },
      { path: 'register', component: RegisterComponent },
      { path: 'login', component: LoginComponent },
      { path: 'ranking', component: RankingComponent },
      { path: 'formularioMarca', component: CreatePerformanceComponent },
      { path: 'formularioAtleta', component: CreateAtletaComponent },
      { path: 'formularioPrueba', component: CreatePruebaComponent },
      { path: '', redirectTo: '/posts', pathMatch: 'full' }
    ]), provideAnimationsAsync(), provideAnimationsAsync(), provideAnimationsAsync()
  ]
});

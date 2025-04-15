import { Routes } from '@angular/router';
import { PostFormComponent } from './posts/components/post-form/post-form.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { LoginComponent } from './auth/components/login/login.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { PostListComponent } from './posts/components/post-list/post-list.component';
import { EditPostComponent } from './posts/components/edit-post/edit-post.component';
import { RankingComponent } from './ranking/ranking.component';
import { CreatePerformanceComponent } from './ranking/create-performance/create-performance.component';
import { CreateAtletaComponent } from './ranking/create-performance/components/create-atleta/create-atleta.component';
import { CreatePruebaComponent } from './ranking/create-performance/components/create-prueba/create-prueba.component';

export const routes: Routes = [
    { path: 'posts', component: PostListComponent, canActivate: [AuthGuard] },
    { path: 'create', component: PostFormComponent, canActivate: [AuthGuard] },
    { path: 'edit/:id', component: EditPostComponent, canActivate: [AuthGuard] },
    { path: 'register', component: RegisterComponent },
    { path: 'login', component: LoginComponent },
    { path: 'ranking', component: RankingComponent},
    { path: 'formularioMarca', component: CreatePerformanceComponent},
    { path: 'formularioAtleta', component: CreateAtletaComponent },
    { path: 'formularioPrueba', component: CreatePruebaComponent },
    { path: '', redirectTo: '/posts', pathMatch: 'full' },

];
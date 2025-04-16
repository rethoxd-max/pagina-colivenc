import { Routes } from '@angular/router';
import { PostFormComponent } from './posts/components/post-form/post-form.component';
import { RegisterComponent } from './auth/components/register/register.component';
import { LoginComponent } from './auth/components/login/login.component';
import { AuthGuard } from './auth/guards/auth.guard';
import { PostListComponent } from './posts/components/post-list/post-list.component';
import { EditPostComponent } from './posts/components/edit-post/edit-post.component';
import { RankingComponent } from './ranking/ranking.component';
import { CreatePerformanceComponent } from './ranking/create-performance/create-performance.component';
import { CompeticionListComponent } from './calendario/components/competicion-list/competicion-list.component';
import { CompeticionFormComponent } from './calendario/components/competicion-form/competicion-form.component';
import { adminGuard } from './auth/guards/admin-guard/admin.guard';
import { editorGuard } from './auth/guards/editor-guard/editor.guard';
import { InscripcionComponent } from './calendario/components/inscripcion/inscripcion.component';
import { atletaGuard } from './auth/guards/atleta-guard/atleta.guard';
import { MisInscripcionesComponent } from './calendario/components/inscripcion/mis-inscripciones/mis-inscripciones.component';
import { entrenadorGuard } from './auth/guards/entrenador-guard/entrenador.guard';
import { InscripcionListComponent } from './calendario/components/inscripcion/inscripcion-list/inscripcion-list.component';
import { PerfilAtletaComponent } from './perfil-atleta/perfil-atleta.component';
import { SearchAtletaComponent } from './ranking/create-performance/components/search-atleta/search-atleta.component';
import { EntrenamientosComponent } from './entrenamientos/components/entrenamientos/entrenamientos.component';
import { CrearGrupoEntrenamientoComponent } from './entrenamientos/components/crear-grupo-entrenamiento/crear-grupo-entrenamiento.component';
import { CalendarioEntrenamientoComponent } from './entrenamientos/components/calendario-entrenamiento/calendario-entrenamiento.component';
import { CrearEntrenamientoComponent } from './entrenamientos/components/crear-entrenamiento/crear-entrenamiento.component';
import { HomeComponent } from './home/home.component';
import { CreateDatosCompeticionesComponent } from './calendario/components/create-datos-competiciones/create-datos-competiciones.component';
import { BuscadorAtletasComponent } from './buscador-atletas/buscador-atletas.component';
import { PostDetailComponent } from './posts/components/post-detail/post-detail.component';

export const routes: Routes = [
    { path: 'home', component: HomeComponent },
    { path: 'login', component: LoginComponent },
    { path: 'register', component: RegisterComponent },
    
    // Rutas de posts/noticias
    { path: 'noticias', component: PostListComponent },
    { path: 'noticia/:id', component: PostDetailComponent },
    { path: 'create', component: PostFormComponent, canActivate: [AuthGuard, editorGuard] },
    { path: 'edit/:id', component: EditPostComponent, canActivate: [AuthGuard, editorGuard] },
    
    // Rutas de competiciones
    { path: 'competiciones', component: CompeticionListComponent },
    { path: 'create-competicion', component: CompeticionFormComponent, canActivate: [AuthGuard, adminGuard] },
    { path: 'edit-competicion/:id', component: CompeticionFormComponent, canActivate: [AuthGuard, adminGuard] },
    { path: 'datos-competiciones', component: CreateDatosCompeticionesComponent, canActivate: [AuthGuard, adminGuard] },
    
    // Rutas de ranking
    { path: 'ranking', component: RankingComponent },
    { path: 'ranking/create-performance', component: CreatePerformanceComponent, canActivate: [AuthGuard, adminGuard] },
    { path: 'edit-marca/:id', component: CreatePerformanceComponent, canActivate: [AuthGuard, adminGuard] },
    
    // Rutas de atletas
    { path: 'atletas/:atletaId/perfil', component: PerfilAtletaComponent },
    { path: 'buscador-atletas', component: BuscadorAtletasComponent },
    { path: 'perfil-atleta/:atletaId', component: PerfilAtletaComponent },
    
    // Rutas de inscripciones
    { path: 'inscripcion/:id', component: InscripcionComponent, canActivate: [AuthGuard, atletaGuard] },
    { path: 'editar-inscripcion/:inscripcionId/:competicionId', component: InscripcionComponent, canActivate: [AuthGuard] },
    { path: 'mis-inscripciones/:entrenadorId/:competicionId', component: MisInscripcionesComponent, canActivate: [AuthGuard] },
    { path: 'inscripciones/:competicionId', component: InscripcionListComponent, canActivate: [AuthGuard, entrenadorGuard] },
    
    // Rutas de entrenamientos
    { path: 'entrenamientos', component: EntrenamientosComponent, canActivate: [AuthGuard] },
    { path: 'calendario/:atletaId', component: CalendarioEntrenamientoComponent, canActivate: [AuthGuard] },
    { path: 'crear-grupo', component: CrearGrupoEntrenamientoComponent, canActivate: [AuthGuard, entrenadorGuard] },
    { path: 'crear-entrenamiento/:diaEntrenamientoId', component: CrearEntrenamientoComponent, canActivate: [AuthGuard, entrenadorGuard] },
    
    // Ruta por defecto
    { path: '', redirectTo: '/ranking/create-performance', pathMatch: 'full' }
];
import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { PostsCarouselComponent } from "../posts/posts-carousel/posts-carousel.component";
import { HorariosEscuelaComponent } from './components/horarios-escuela/horarios-escuela.component';
import { CalendarioLateralComponent } from './components/calendario-lateral/calendario-lateral.component';
import { SocialSidebarComponent } from './components/social-sidebar/social-sidebar.component';
import { PanelAnunciosComponent, Anuncio } from './components/panel-anuncios/panel-anuncios.component';
import { TiendaPreviewComponent } from './components/tienda-preview/tienda-preview.component';
import { FeaturedPostComponent } from './components/featured-post/featured-post.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, RouterModule, PostsCarouselComponent, HorariosEscuelaComponent, CalendarioLateralComponent, SocialSidebarComponent, PanelAnunciosComponent, TiendaPreviewComponent, FeaturedPostComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {
  anuncios: Anuncio[] = [
    {
      texto: '📣 ¡Inscripciones abiertas para la próxima temporada!',
      enlace: '/inscripciones',
      enlaceTexto: 'Inscríbete'
    }
  ];
}

import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PostsCarouselComponent } from "../posts/posts-carousel/posts-carousel.component";
import { HorariosEscuelaComponent } from './components/horarios-escuela/horarios-escuela.component';
import { CalendarioLateralComponent } from './components/calendario-lateral/calendario-lateral.component';
import { SocialSidebarComponent } from './components/social-sidebar/social-sidebar.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [CommonModule, PostsCarouselComponent, HorariosEscuelaComponent, CalendarioLateralComponent, SocialSidebarComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}

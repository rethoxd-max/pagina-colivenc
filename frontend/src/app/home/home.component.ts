import { Component } from '@angular/core';
import { PostsCarouselComponent } from "../posts/posts-carousel/posts-carousel.component";
import { HorariosEscuelaComponent } from './components/horarios-escuela/horarios-escuela.component';

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostsCarouselComponent, HorariosEscuelaComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}

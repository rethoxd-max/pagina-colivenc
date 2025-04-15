import { Component } from '@angular/core';
import { PostsCarouselComponent } from "../posts/posts-carousel/posts-carousel.component";

@Component({
  selector: 'app-home',
  standalone: true,
  imports: [PostsCarouselComponent],
  templateUrl: './home.component.html',
  styleUrl: './home.component.css'
})
export class HomeComponent {

}

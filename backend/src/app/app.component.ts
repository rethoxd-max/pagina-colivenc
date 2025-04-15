import { Component, OnInit } from '@angular/core';
import { Router, RouterLink, RouterModule } from '@angular/router';
import { AuthService } from './auth/services/auth.service';
import { CommonModule, NgIf } from '@angular/common';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterModule, NgIf, RouterLink],  // Importa el RouterModule para usar router-outlet
  templateUrl: './app.component.html',
})
export class AppComponent implements OnInit {
  isLoggedIn: boolean = false;  // Variable para almacenar el estado de autenticación


  constructor(private authService: AuthService, private router: Router) { }

  ngOnInit(): void {
    this.authService.getIsLoggedIn().subscribe((isLoggedIn: boolean) => {
      this.isLoggedIn = isLoggedIn;
    });
  }
  
  logout(): void {
    this.authService.logout();
    this.router.navigate(['/']);
  }
}

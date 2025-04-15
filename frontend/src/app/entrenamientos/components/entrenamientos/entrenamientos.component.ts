import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrenamientosService } from '../../services/entrenamientos.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RankingService } from '../../../ranking/services/ranking.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PerfilAtletaService } from '../../../ranking/services/perfil-atleta.service';

@Component({
  selector: 'app-entrenamientos',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './entrenamientos.component.html',
  styleUrls: ['./entrenamientos.component.css']
})
export class EntrenamientosComponent implements OnInit {
  gruposEntrenamiento: any[] = [];
  private entrenamientosService = inject(EntrenamientosService);
  private authService = inject(AuthService);
  private perfilAtletaService = inject(PerfilAtletaService);
  isEntrenador: boolean = false;
  atletaId = '';



  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    const userId = this.authService.getUserId();
    // Obtenemos el atleta como observable, suscribiéndonos para acceder al ID del atleta
    this.perfilAtletaService.getAtletaByUserId(userId).subscribe({
      next: (atleta) => {
        this.atletaId = atleta._id; // Asegúrate de que este sea el campo correcto que contiene el ID del atleta

        // Llama al servicio de entrenamientos para obtener los grupos usando el atletaId
        this.entrenamientosService.getGruposEntrenamiento(this.atletaId).subscribe({
          next: (grupos) => this.gruposEntrenamiento = grupos,
          error: (error) => console.error('Error al obtener los grupos:', error)
        });
      },
      error: (error) => console.error('Error al obtener el atleta:', error)
    });

    this.isEntrenador = this.authService.isEntrenador();
  }


  navigateToCrearGrupo() {
    this.router.navigate(['/crear-grupo']);
  }

  irAlCalendario(atletaId: string): void {
    // Redirige al usuario a la ruta del calendario correspondiente al grupo seleccionado
    this.router.navigate(['/calendario', atletaId]);
  }
}

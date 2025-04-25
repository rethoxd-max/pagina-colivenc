import { Component, OnInit, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrenamientosService } from '../../services/entrenamientos.service';
import { AuthService } from '../../../auth/services/auth.service';
import { RankingService } from '../../../ranking/services/ranking.service';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { PerfilAtletaService } from '../../../ranking/services/perfil-atleta.service';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-entrenamientos',
  standalone: true,
  imports: [CommonModule, MatIconModule],
  templateUrl: './entrenamientos.component.html',
  styleUrls: ['./entrenamientos.component.css']
})
export class EntrenamientosComponent implements OnInit {
  gruposEntrenamiento: any[] = [];
  private entrenamientosService = inject(EntrenamientosService);
  private authService = inject(AuthService);
  private perfilAtletaService = inject(PerfilAtletaService);
  isEntrenador: boolean = false;
  isAdmin: boolean = false;
  atletaId = '';
  userId: string | null = null;

  constructor(
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {
    this.userId = this.authService.getUserId();
    this.isEntrenador = this.authService.isEntrenador();
    this.isAdmin = this.authService.isAdmin();

    if (!this.userId) {
      console.error('No se encontró el ID del usuario');
      return;
    }

    this.cargarGrupos();
  }

  cargarGrupos() {
    if (!this.userId) {
      console.error('No se puede cargar grupos sin ID de usuario');
      return;
    }

    if (this.isEntrenador) {
      console.log('Cargando grupos como entrenador con ID:', this.userId);
      this.entrenamientosService.getGruposEntrenamientoByEntrenador(this.userId).subscribe({
        next: (grupos) => {
          console.log('Grupos obtenidos como entrenador:', grupos);
          this.gruposEntrenamiento = grupos;
        },
        error: (error) => {
          console.error('Error al obtener los grupos como entrenador:', error);
          this.gruposEntrenamiento = [];
        }
      });
    } else {
      console.log('Cargando grupos como atleta');
      this.perfilAtletaService.getAtletaByUserId(this.userId).subscribe({
        next: (atleta) => {
          this.atletaId = atleta._id;
          console.log('Cargando grupos para atleta con ID:', this.atletaId);
          this.entrenamientosService.getGruposEntrenamiento(this.atletaId).subscribe({
            next: (grupos) => {
              console.log('Grupos obtenidos como atleta:', grupos);
              this.gruposEntrenamiento = grupos;
            },
            error: (error) => {
              console.error('Error al obtener los grupos como atleta:', error);
              this.gruposEntrenamiento = [];
            }
          });
        },
        error: (error) => {
          console.error('Error al obtener el atleta:', error);
          this.gruposEntrenamiento = [];
        }
      });
    }
  }

  puedeEditarGrupo(grupo: any): boolean {
    return this.isAdmin || (this.isEntrenador && grupo.entrenador === this.userId);
  }

  navigateToCrearGrupo() {
    this.router.navigate(['/crear-grupo']);
  }

  editarGrupo(grupoId: string) {
    this.router.navigate(['/editar-grupo', grupoId]);
  }

  irAlCalendario(grupoId: string): void {
    this.router.navigate(['/calendario', grupoId]);
  }
}

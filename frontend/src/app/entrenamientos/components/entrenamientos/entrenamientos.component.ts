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

    // Array para almacenar todos los grupos
    let gruposCombinados: any[] = [];

    // Si es entrenador, cargar grupos donde es entrenador
    if (this.isEntrenador) {
      console.log('Cargando grupos como entrenador con ID:', this.userId);
      this.entrenamientosService.getGruposEntrenamientoByEntrenador(this.userId).subscribe({
        next: (gruposEntrenador) => {
          console.log('Grupos obtenidos como entrenador:', gruposEntrenador);
          gruposCombinados = [...gruposEntrenador];
          this.gruposEntrenamiento = gruposCombinados;
        },
        error: (error) => {
          console.error('Error al obtener los grupos como entrenador:', error);
        }
      });
    }

    // Cargar grupos donde es atleta
    console.log('Cargando grupos como atleta');
    this.perfilAtletaService.getAtletaByUserId(this.userId).subscribe({
      next: (atleta) => {
        if (!atleta || !atleta._id) {
          console.error('No se encontró el atleta o no tiene ID válido');
          return;
        }
        this.atletaId = atleta._id;
        console.log('Cargando grupos para atleta con ID:', this.atletaId);
        this.entrenamientosService.getGruposEntrenamiento(this.atletaId).subscribe({
          next: (gruposAtleta) => {
            console.log('Grupos obtenidos como atleta:', gruposAtleta);
            // Combinar los grupos de atleta con los existentes
            const gruposUnicos = [...this.gruposEntrenamiento];
            gruposAtleta.forEach(grupoAtleta => {
              if (!gruposUnicos.some(g => g._id === grupoAtleta._id)) {
                gruposUnicos.push(grupoAtleta);
              }
            });
            this.gruposEntrenamiento = gruposUnicos;
          },
          error: (error) => {
            console.error('Error al obtener los grupos como atleta:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error al obtener el atleta:', error);
      }
    });
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

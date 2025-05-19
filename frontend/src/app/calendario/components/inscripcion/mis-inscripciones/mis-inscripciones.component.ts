import { Component, OnInit } from '@angular/core';
import { CompeticionService } from '../../../services/competicion.service';
import { AuthService } from '../../../../auth/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mis-inscripciones',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './mis-inscripciones.component.html',
  styleUrls: ['./mis-inscripciones.component.css']
})
export class MisInscripcionesComponent implements OnInit {
  inscripciones: any[] = [];
  competicionId: string = '';
  inscripcionId: string = '';
  userId: string | null = null;

  constructor(
    private competicionService: CompeticionService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute
  ) { }

  ngOnInit(): void {
    this.competicionId = this.route.snapshot.paramMap.get('competicionId') || '';
    this.inscripcionId = this.route.snapshot.paramMap.get('inscripcionId') || '';
    this.userId = this.authService.getUserId();

    if (this.competicionId && this.userId) {
      this.loadInscripciones();
    } else {
      console.error('Competición ID o User ID no encontrado.');
    }
  }

  loadInscripciones() {
    if (!this.userId || !this.competicionId) {
      console.error('El ID del usuario o la competición no está disponible.');
      return;
    }

    this.competicionService.getInscripcionesByEntrenadorYCompeticion(this.userId, this.competicionId).subscribe(
      (inscripciones) => {
        this.inscripciones = inscripciones || [];
      },
      (error) => {
        console.error('Error al cargar las inscripciones:', error);
      }
    );
  }

  editarInscripcion(inscripcionId: string) {
    this.router.navigate(['/editar-inscripcion', inscripcionId, this.competicionId]);
  }

  borrarInscripcion(inscripcionId: string) {
    this.competicionService.deleteInscripcion(inscripcionId).subscribe(
      () => {
        this.inscripciones = this.inscripciones.filter(inscripcion => inscripcion._id !== inscripcionId);
      },
      (error) => {
        console.error('Error al borrar la inscripción:', error);
      }
    );
  }

  isLastElement(prueba: any, pruebasSeleccionadas: any[]): boolean {
    return pruebasSeleccionadas.indexOf(prueba) === pruebasSeleccionadas.length - 1;
  }
}

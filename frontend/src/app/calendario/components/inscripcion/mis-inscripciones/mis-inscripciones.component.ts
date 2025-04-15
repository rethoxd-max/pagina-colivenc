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
  inscripcionesEntrenador: any[] = [];
  competicionId: string = '';
  inscripcionId: string = '';
  entrenadorId!: string | null;

  constructor(
    private competicionService: CompeticionService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // Para capturar el competicionId de la URL
  ) { }

  ngOnInit(): void {
    // Obtener el competicionId desde los parámetros de la ruta
    this.competicionId = this.route.snapshot.paramMap.get('competicionId') || '';
    this.inscripcionId = this.route.snapshot.paramMap.get('inscripcionId') || '';
    this.entrenadorId = this.authService.getUserId();
    if (this.competicionId) {
      this.loadInscripcionesByEntrenadorYCompeticion(this.competicionId);
    } else {
      console.error('Competición ID no encontrado en la URL.');
    }


  }


  loadInscripcionesByEntrenadorYCompeticion(competicionId: string) {
    const entrenadorId = this.authService.getUserId();

    if (!entrenadorId) {
      console.error('El ID del entrenador no está disponible.');
      return;
    }

    this.competicionService.getInscripcionesByEntrenadorYCompeticion(entrenadorId, competicionId).subscribe(
      (inscripciones) => {
        this.inscripcionesEntrenador = inscripciones || []; // Asegurarse de que sea un array vacío si no hay inscripciones
      },
      (error) => {
        console.error('Error al cargar las inscripciones del entrenador para la competición:', error);
      }
    );
  }


  editarInscripcion(inscripcionId: string) {

    // Redirigir al componente de edición, pasando el ID de inscripción en la URL
    this.router.navigate(['/editar-inscripcion', inscripcionId, this.competicionId]);
  }

  borrarInscripcion(inscripcionId: string) {
    this.competicionService.deleteInscripcion(inscripcionId).subscribe(
      () => {
        this.inscripcionesEntrenador = this.inscripcionesEntrenador.filter(inscripcion => inscripcion._id !== inscripcionId);
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

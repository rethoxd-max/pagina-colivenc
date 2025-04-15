import { Component, OnInit } from '@angular/core';
import { AuthService } from '../../../../auth/services/auth.service';
import { CompeticionService } from '../../../services/competicion.service';
import { ActivatedRoute } from '@angular/router';
import { CommonModule, NgFor } from '@angular/common';
import { Router } from '@angular/router';

@Component({
  selector: 'app-inscripcion-list',
  standalone: true,
  imports: [NgFor, CommonModule],
  templateUrl: './inscripcion-list.component.html',
  styleUrls: ['./inscripcion-list.component.css']
})
export class InscripcionListComponent implements OnInit {
  inscripciones: any[] = [];
  competicionId: string = '';
  inscripcionId: string = '';

  constructor(
    private competicionService: CompeticionService,
    private authService: AuthService,
    private router: Router,
    private route: ActivatedRoute // Para obtener parámetros de la ruta
  ) { }

  ngOnInit(): void {
    this.competicionId = this.route.snapshot.paramMap.get('competicionId') || ''; // Obtener ID de competición desde la URL
    this.inscripcionId = this.route.snapshot.paramMap.get('inscripcionId') || ''; // Obtener ID de competición desde la URL
    this.loadInscripciones();
  }

  loadInscripciones() {

    if (!this.competicionId) {
      console.error('El ID de la competición no está disponible.');
      return;
    }

    // Cargar inscripciones del entrenador para una competición específica
    this.competicionService.getInscripcionesByCompeticion(this.competicionId).subscribe(
      (inscripciones) => {
        this.inscripciones = inscripciones || []; // Asegurar que sea un array vacío si no hay inscripciones
      },
      (error) => {
        console.error('Error al cargar las inscripciones para la competición:', error);
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

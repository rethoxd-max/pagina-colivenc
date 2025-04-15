import { Component, NgModule, OnInit } from '@angular/core';
import { CategoriaCompeticion, CompeticionService, PruebaCompeticion } from '../../services/competicion.service';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, NgModel, NgModelGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router'; // Añadido ActivatedRoute
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment.development';

@Component({
  selector: 'app-competicion-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink, FormsModule],
  templateUrl: './competicion-list.component.html',
  styleUrls: ['./competicion-list.component.css'],
  providers: [CompeticionService]
})
export class CompeticionListComponent implements OnInit {
  competiciones: any[] = [];
  pruebas: { [competicionId: string]: PruebaCompeticion[] } = {}; // Diccionario para almacenar las pruebas por competicionId
  baseURL: string = environment.apiUrl;

  filteredCompeticiones: any[] = [];
  categoriasDisponibles: string[] = []; // Para el dropdown de categorías
  searchName: string = '';
  startDate: string = '';
  endDate: string = '';
  searchCategoria: string = '';
  inscripcionesEntrenador: any[] = [];
  inscripcionesPorCompeticion: { [competicionId: string]: any[] } = {};
  inscripcionesPorCompeticionYEntrenador: { [competicionId: string]: any[] } = {};
  competicionId!: string;
  userId!: string | null;

  constructor(
    private competicionService: CompeticionService,
    private authService: AuthService,
    private route: ActivatedRoute // Añadido para obtener parámetros de la URL
  ) { }

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.competicionId = this.route.snapshot.paramMap.get('competicionId') || '';
    this.loadCompeticiones();
    this.loadCategorias();
  }

  loadCategorias() {
    this.competicionService.getCategorias().subscribe(
      (categorias) => {
        this.categoriasDisponibles = categorias.map(categoria => categoria.nombre_categoria);
      }
    )
  }

  loadCompeticiones() {
    this.competicionService.getCompeticiones().subscribe(
      (data) => {
        this.competiciones = data; // Guardamos las competiciones obtenidas
        this.filteredCompeticiones = data;
        // Iteramos sobre cada competición y llamamos a loadPruebas con su ID
        data.forEach((competicion: any) => {
          this.loadPruebas(competicion._id); // Pasamos el ID de la competición a loadPruebas
          this.competicionId = competicion._id;
          this.loadInscripciones(this.competicionId); // Carga inscripciones para la competición

        });

        // Después de cargar las competiciones, cargamos las inscripciones
      },
      (error) => {
        console.error('Error al cargar las competiciones:', error);
      }
    );
  }

  loadInscripciones(competicionId: string) {
    const entrenador = this.authService.getUser();
    const entrenadorId = entrenador ? entrenador.id : null;

    if (!entrenadorId) {
      console.error('El ID del entrenador no está disponible.');
      return;
    }

    this.competicionService.getInscripcionesByEntrenadorYCompeticion(entrenadorId, competicionId).subscribe(
      (inscripciones) => {
        this.inscripcionesPorCompeticionYEntrenador[competicionId] = inscripciones || []; // Asigna las inscripciones a la competición específica
      },
      (error) => {
        console.error('Error al cargar las inscripciones del entrenador para la competición:', error);
      }
    );
    this.competicionService.getInscripcionesByCompeticion(competicionId).subscribe(
      (inscripciones) => {
        this.inscripcionesPorCompeticion[competicionId] = inscripciones || []; // Asigna las inscripciones a la competición específica
      },
      (error) => {
        console.error('Error al cargar las inscripciones del entrenador para la competición:', error);
      }
    );

  }





  loadPruebas(competicionId: string) {
    this.competicionService.getPruebasByCompeticionId(competicionId).subscribe(
      (pruebas: { _id: string; nombre_prueba: string; sector_id: string; categoria_id: string; __v: number }[]) => { // Cambié el tipo de pruebaIds a un arreglo de objetos
        // Extraer los IDs de las pruebas
        const pruebaIds = pruebas.map(prueba => prueba._id);

        if (pruebaIds && pruebaIds.length > 0) {
          this.competicionService.getPruebasByIds(pruebaIds).subscribe(
            (pruebasData) => {
              this.pruebas[competicionId] = pruebasData;
            },
            (error) => {
              console.error('Error al obtener las pruebas:', error);
            }
          );
        } else {
          console.log('No se encontraron pruebas para esta competición');
        }
      },
      (error) => {
        console.error('Error al obtener IDs de pruebas:', error);
      }
    );
  }

  filterCompeticiones() {
    this.filteredCompeticiones = this.competiciones.filter(competicion => {
      const matchesName = competicion.nombre.toLowerCase().includes(this.searchName.toLowerCase());
      const matchesDate = this.startDate && this.endDate
        ? new Date(competicion.fecha) >= new Date(this.startDate) && new Date(competicion.fecha) <= new Date(this.endDate)
        : true;

      const matchesCategoria = this.searchCategoria
        ? this.pruebas[competicion._id]?.some(prueba => prueba.categoria_id.nombre_categoria === this.searchCategoria)
        : true;

      return matchesName && matchesDate && matchesCategoria;
    });
  }

  getCategoriasUnicas(competicionId: string): string[] {
    if (!this.pruebas[competicionId]) return [];

    const categoriasSet = new Set<string>();
    this.pruebas[competicionId].forEach((prueba: any) => {
      if (prueba.categoria_id && prueba.categoria_id.nombre_categoria) {
        categoriasSet.add(prueba.categoria_id.nombre_categoria);
      }
    });

    return Array.from(categoriasSet);
  }

  deleteCompeticion(id: string) {
    this.competicionService.deleteCompeticion(id).subscribe(
      () => {
        this.competiciones = this.competiciones.filter(comp => comp._id !== id);
      },
      (error) => {
        console.error('Error al eliminar la competición:', error);
      }
    );
  }

  editarInscripcion(inscripcionId: string) {
    console.log(`Editar inscripción con ID: ${inscripcionId}`);
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

  // Función que verifica si el atleta tiene inscripciones en una competición específica
  tieneInscripcionEnCompeticion(competicionId: string): boolean {
    const inscripciones = this.inscripcionesPorCompeticion[competicionId] || [];
    // Verifica si alguna inscripción pertenece al atleta actual
    return inscripciones.some(inscripcion => inscripcion.usuario === this.userId);
  }


  isEntrenador(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Entrenador');
  }

  isLoggedIn(): boolean {
    return this.authService.isLoggedIn();
  }

  getImageUrl(imageUrl: string) {
    if (imageUrl.startsWith('http')) {
      return imageUrl;
    }
    return `${this.baseURL}${imageUrl}`;
  }

  isAdmin(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Admin');
  }

  isEditor(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Editor');
  }

  isAtleta(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Atleta');
  }
}
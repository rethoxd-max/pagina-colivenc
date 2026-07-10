import { Component, NgModule, OnInit, OnDestroy } from '@angular/core';
import { CategoriaCompeticion, CompeticionService, PruebaCompeticion } from '../../services/competicion.service';
import { CommonModule, NgIf } from '@angular/common';
import { FormsModule, NgModel, NgModelGroup, ReactiveFormsModule } from '@angular/forms';
import { RouterLink, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { environment } from '../../../../environments/environment';
import { DisciplinaFilterService } from '../../../services/disciplina-filter.service';
import { Subscription } from 'rxjs';
import { PdfViewerModule } from 'ng2-pdf-viewer';
import { isPdf, isImageFile, getMediaUrl } from '../../utils/competicion-media.util';

interface CompeticionAgrupada {
  year: number;
  months: {
    month: number;
    monthName: string;
    competiciones: any[];
  }[];
}

@Component({
  selector: 'app-competicion-list',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, NgIf, RouterLink, FormsModule, PdfViewerModule],
  templateUrl: './competicion-list.component.html',
  styleUrls: ['./competicion-list.component.css'],
  providers: [CompeticionService]
})
export class CompeticionListComponent implements OnInit, OnDestroy {
  competiciones: any[] = [];
  competicionesAgrupadas: CompeticionAgrupada[] = [];
  pruebas: { [competicionId: string]: PruebaCompeticion[] } = {};
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

  // Vista lista o tarjetas
  vistaActual: 'tarjetas' | 'lista' = 'tarjetas';
  mesActual: number = new Date().getMonth();
  anyoActual: number = new Date().getFullYear();

  // Competición a la que hay que saltar al entrar (llega por ?competicionId=... desde el mini calendario del Home)
  private focoCompeticionId: string | null = null;
  competicionDestacadaId: string | null = null;

  private nombresMeses = [
    'Enero', 'Febrero', 'Marzo', 'Abril', 'Mayo', 'Junio',
    'Julio', 'Agosto', 'Septiembre', 'Octubre', 'Noviembre', 'Diciembre'
  ];

  constructor(
    private competicionService: CompeticionService,
    private authService: AuthService,
    private route: ActivatedRoute,
    private disciplinaFilterService: DisciplinaFilterService
  ) { }

  private filterSub?: Subscription;

  ngOnInit(): void {
    this.userId = this.authService.getUserId();
    this.competicionId = this.route.snapshot.paramMap.get('competicionId') || '';
    this.focoCompeticionId = this.route.snapshot.queryParamMap.get('competicionId');
    this.loadCompeticiones();
    this.loadCategorias();
    this.filterSub = this.disciplinaFilterService.disciplina$.subscribe(() => this.filterCompeticiones());
  }

  ngOnDestroy(): void {
    this.filterSub?.unsubscribe();
  }

  loadCategorias() {
    this.competicionService.getCategorias().subscribe(
      (categorias) => {
        this.categoriasDisponibles = categorias.map(categoria => categoria.nombre_categoria);
      }
    )
  }

  private agruparCompeticiones(competiciones: any[]): CompeticionAgrupada[] {
    const agrupadas: { [año: number]: { [mes: number]: any[] } } = {};

    competiciones.forEach(competicion => {
      const fecha = new Date(competicion.fecha);
      const año = fecha.getFullYear();
      const mes = fecha.getMonth();

      if (!agrupadas[año]) {
        agrupadas[año] = {};
      }
      if (!agrupadas[año][mes]) {
        agrupadas[año][mes] = [];
      }
      agrupadas[año][mes].push(competicion);
    });

    return Object.keys(agrupadas)
      .map(year => Number(year))
      .sort((a, b) => b - a) // Ordenar años de más reciente a más antiguo
      .map(year => ({
        year,
        months: Object.keys(agrupadas[year])
          .map(month => Number(month))
          .sort((a, b) => b - a) // Ordenar meses de más reciente a más antiguo
          .map(month => ({
            month,
            monthName: this.nombresMeses[month],
            competiciones: agrupadas[year][month]
          }))
      }));
  }

  loadCompeticiones() {
    this.competicionService.getCompeticiones().subscribe(
      (data) => {
        this.competiciones = data;
        this.filteredCompeticiones = data;
        this.competicionesAgrupadas = this.agruparCompeticiones(data);
        
        data.forEach((competicion: any) => {
          this.loadPruebas(competicion._id);
          this.competicionId = competicion._id;
          this.loadInscripciones(this.competicionId);
        });

        if (this.focoCompeticionId) {
          this.irACompeticion(this.focoCompeticionId);
        } else {
          this.scrollToNearestCompetition();
        }
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
    const discId = this.disciplinaFilterService.disciplinaActual;
    this.filteredCompeticiones = this.competiciones
      .filter(competicion => {
        const matchesName = competicion.nombre.toLowerCase().includes(this.searchName.toLowerCase());
        const matchesDate = this.startDate && this.endDate
          ? new Date(competicion.fecha) >= new Date(this.startDate) && new Date(competicion.fecha) <= new Date(this.endDate)
          : true;
        const matchesCategoria = this.searchCategoria
          ? this.pruebas[competicion._id]?.some(prueba => prueba.categoria_id.nombre_categoria === this.searchCategoria)
          : true;
        const matchesDisciplina = discId
          ? (competicion.disciplina?._id || competicion.disciplina) === discId
          : true;
        return matchesName && matchesDate && matchesCategoria && matchesDisciplina;
      })
      .sort((a, b) => new Date(b.fecha).getTime() - new Date(a.fecha).getTime());
    this.competicionesAgrupadas = this.agruparCompeticiones(this.filteredCompeticiones);

    this.scrollToNearestCompetition();
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
        this.loadCompeticiones();
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
    return getMediaUrl(imageUrl);
  }

  isPdf(url: string | null | undefined): boolean {
    return isPdf(url);
  }

  isEnlaceArchivo(enlace: any): boolean {
    return enlace?.origen === 'archivo';
  }

  getEnlaceIcon(enlace: any): string {
    if (!this.isEnlaceArchivo(enlace)) return 'fa-file-alt';
    if (isPdf(enlace.url)) return 'fa-file-pdf';
    if (isImageFile(enlace.url)) return 'fa-file-image';
    return 'fa-paperclip';
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

  // ---- Vista Lista ----

  cambiarVista(vista: 'tarjetas' | 'lista'): void {
    this.vistaActual = vista;
    this.scrollToNearestCompetition();
  }

  mesAnterior(): void {
    if (this.mesActual === 0) {
      this.mesActual = 11;
      this.anyoActual--;
    } else {
      this.mesActual--;
    }
    this.scrollToNearestCompetition();
  }

  mesSiguiente(): void {
    if (this.mesActual === 11) {
      this.mesActual = 0;
      this.anyoActual++;
    } else {
      this.mesActual++;
    }
    this.scrollToNearestCompetition();
  }

  getCompeticionesAgrupadasDelMes(): CompeticionAgrupada[] {
    return this.competicionesAgrupadas
      .filter(yearGroup => yearGroup.year === this.anyoActual)
      .map(yearGroup => ({
        year: yearGroup.year,
        months: yearGroup.months.filter(monthGroup => monthGroup.month === this.mesActual)
      }))
      .filter(yearGroup => yearGroup.months.length > 0);
  }

  getNombreMes(): string {
    return this.nombresMeses[this.mesActual];
  }

  getCompeticionesDelMes(): any[] {
    return this.filteredCompeticiones
      .filter(c => {
        const fecha = new Date(c.fecha);
        return fecha.getMonth() === this.mesActual && fecha.getFullYear() === this.anyoActual;
      })
      .sort((a, b) => new Date(a.fecha).getTime() - new Date(b.fecha).getTime());
  }

  getCompeticionesDelMesAgrupadasPorDia(): { fechaObj: Date, competiciones: any[] }[] {
    const competicionesMes = this.getCompeticionesDelMes();
    const agrupadas = new Map<number, any[]>();

    competicionesMes.forEach(c => {
      const dateObj = new Date(c.fecha);
      dateObj.setHours(0, 0, 0, 0);
      const time = dateObj.getTime();

      if (!agrupadas.has(time)) {
        agrupadas.set(time, []);
      }
      agrupadas.get(time)!.push(c);
    });

    return Array.from(agrupadas.entries())
      .map(([time, comps]) => ({
        fechaObj: new Date(time),
        competiciones: comps
      }))
      .sort((a, b) => a.fechaObj.getTime() - b.fechaObj.getTime());
  }

  isPasada(fecha: any): boolean {
    return new Date(fecha) < new Date(new Date().setHours(0, 0, 0, 0));
  }

  copiadoId: string | null = null;

  copiarLinkPublico(competicion: any): void {
    if (!competicion.tokenPublico) return;
    const url = `${window.location.origin}/inscripcion-publica/${competicion.tokenPublico}`;
    navigator.clipboard.writeText(url).then(() => {
      this.copiadoId = competicion._id;
      setTimeout(() => this.copiadoId = null, 2000);
    });
  }

  // Salta al mes y a la competición indicados por ?competicionId=... en la URL
  // (se usa al pulsar una competición desde el mini calendario del Home)
  irACompeticion(id: string): void {
    const competicion = this.competiciones.find(c => c._id === id);
    if (!competicion) {
      this.scrollToNearestCompetition();
      return;
    }

    const fecha = new Date(competicion.fecha);
    this.mesActual = fecha.getMonth();
    this.anyoActual = fecha.getFullYear();
    this.competicionDestacadaId = id;

    setTimeout(() => {
      const element = document.getElementById(`competicion-${id}`);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }
      setTimeout(() => { this.competicionDestacadaId = null; }, 2500);
    }, 300);
  }

  scrollToNearestCompetition(): void {
    setTimeout(() => {
      const hoy = new Date();
      hoy.setHours(0, 0, 0, 0);
      
      if (this.mesActual === hoy.getMonth() && this.anyoActual === hoy.getFullYear()) {
        const competicionesMes = this.getCompeticionesDelMes();
        
        const futuras = competicionesMes.filter(c => {
          const fechaComp = new Date(c.fecha);
          fechaComp.setHours(0, 0, 0, 0);
          return fechaComp.getTime() >= hoy.getTime();
        });
        
        if (futuras.length > 0) {
          const primeraFecha = new Date(futuras[0].fecha);
          primeraFecha.setHours(0, 0, 0, 0);
          const fechaMasCercana = primeraFecha.getTime();
          
          const competicionesCercanas = futuras.filter(c => {
            const f = new Date(c.fecha);
            f.setHours(0, 0, 0, 0);
            return f.getTime() === fechaMasCercana;
          });
          
          const competicionObjetivo = competicionesCercanas[competicionesCercanas.length - 1];
          
          const element = document.getElementById(`competicion-${competicionObjetivo._id}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }
      }
    }, 300);
  }
}
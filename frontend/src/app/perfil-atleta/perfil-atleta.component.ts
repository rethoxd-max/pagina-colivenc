import { Component, OnInit, OnDestroy } from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { Atleta, Categoria, Marca, PcAL, Prueba, RankingService } from '../ranking/services/ranking.service';
import { CommonModule } from '@angular/common';
import { PerfilAtletaService } from '../ranking/services/perfil-atleta.service';
import { FormsModule } from '@angular/forms';
import { Observer, Subscription } from 'rxjs';
import { AuthService } from '../auth/services/auth.service';

@Component({
  selector: 'app-perfil-atleta',
  templateUrl: './perfil-atleta.component.html',
  styleUrls: ['./perfil-atleta.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PerfilAtletaComponent implements OnInit, OnDestroy {
  atleta: any;
  pruebas: Prueba[] = [];
  marcas: Marca[] = [];
  mejoresMarcas: Marca[] = [];
  marcasPorPrueba: { [key: string]: Marca[] } = {}; // Objeto para almacenar las marcas por cada prueba
  marcasPorPruebaAnyo: { [key: string]: Marca } = {}; // Almacena las marcas por prueba, año y PcAL.
  categorias: Categoria[] = [];  // Lista de categorías disponibles
  categoriaSeleccionada!: string;
  PcALseleccionado!: string;
  anyos: any[] = [];  // Lista de años en los que el atleta ha competido
  PcAL: PcAL[] = []; // Lista de PcAL disponibles

  filtroCategoria: string = '';
  filtroPcAL: string = '';
  filtroAnyo: number | undefined;
  anyosPorPrueba!: { [pruebaId: string]: number[]; };
  mejoresMarcasLegales: { [key: string]: Marca } = {};
  
  private routeSubscription!: Subscription;
  private authSubscription!: Subscription;

  constructor(
    private rankingService: RankingService,
    private perfilAtletaService: PerfilAtletaService,
    private route: ActivatedRoute,
    private router: Router,
    private authService: AuthService
  ) { }

  ngOnInit() {
    // Suscribirse a los cambios de parámetros de la ruta
    this.routeSubscription = this.route.paramMap.subscribe(params => {
      const atletaId = params.get('atletaId');
      this.loadAtletaData(atletaId);
    });

    // Suscribirse a los cambios en el estado de autenticación
    this.authSubscription = this.authService.getIsLoggedIn().subscribe(isLoggedIn => {
      if (isLoggedIn) {
        // Si no hay atletaId en la ruta y el usuario está logueado, cargar su perfil
        if (!this.route.snapshot.paramMap.get('atletaId')) {
          this.loadCurrentUserAtleta();
        }
      } else {
        // Si el usuario se desloguea, limpiar los datos
        this.clearAtletaData();
      }
    });
  }

  ngOnDestroy() {
    // Cancelar las suscripciones al destruir el componente
    if (this.routeSubscription) {
      this.routeSubscription.unsubscribe();
    }
    if (this.authSubscription) {
      this.authSubscription.unsubscribe();
    }
  }

  // Método para cargar el atleta del usuario actual
  loadCurrentUserAtleta() {
    const userId = this.authService.getUserId();
    if (userId) {
      this.perfilAtletaService.getAtletaByUserId(userId).subscribe({
        next: (atleta) => {
          if (atleta && atleta._id) {
            // Redirigir a la página del perfil con el ID correcto del atleta
            this.router.navigate(['/perfil-atleta', atleta._id]);
          } else {
            console.error('No se encontró el atleta para el usuario actual');
          }
        },
        error: (error) => {
          console.error('Error al obtener el perfil del atleta:', error);
        }
      });
    }
  }

  // Método para limpiar los datos del atleta
  clearAtletaData() {
    this.atleta = null;
    this.pruebas = [];
    this.marcas = [];
    this.mejoresMarcas = [];
    this.marcasPorPrueba = {};
    this.marcasPorPruebaAnyo = {};
    this.anyos = [];
    this.anyosPorPrueba = {};
    this.mejoresMarcasLegales = {};
  }

  // Método para cargar los datos del atleta
  loadAtletaData(atletaId: string | null) {
    if (!atletaId) {
      console.error('No se proporcionó un ID de atleta válido');
      return;
    }

    // Reiniciar los datos antes de cargar nuevos
    this.clearAtletaData();

    // Cargar los datos del atleta utilizando el ID
    this.rankingService.getAtletaById(atletaId).subscribe({
      next: (atleta: Atleta) => {
        this.atleta = atleta;

        // Cargar las marcas del atleta usando su ID
        this.perfilAtletaService.getMarcasByAtletaId(this.atleta._id).subscribe({
          next: (marcas: Marca[]) => {
            this.marcas = marcas;

            // Agrupa los años disponibles por prueba
            // Obtener los años únicos y ordenarlos de mayor a menor
            this.anyos = [...new Set(marcas.map((marca: Marca) => marca.anyo))].sort((a, b) => b - a);

            // Crear el objeto anyosPorPrueba y ordenar los años de cada prueba de mayor a menor
            this.anyosPorPrueba = marcas.reduce((acc: { [pruebaId: string]: number[] }, marca: Marca) => {
              if (!acc[marca.nombre_prueba._id]) {
                acc[marca.nombre_prueba._id] = [];
              }
              // Añadir el año si no está ya presente
              if (!acc[marca.nombre_prueba._id].includes(marca.anyo)) {
                acc[marca.nombre_prueba._id].push(marca.anyo);
              }
              // Ordenar los años de mayor a menor después de agregar un nuevo año
              acc[marca.nombre_prueba._id].sort((a, b) => b - a);

              return acc;
            }, {});

            // Inicializa el filtro de año con el más reciente para cada prueba (opcional)
            if (this.anyos.length > 0) {
              this.filtroAnyo = Math.max(...this.anyos);
            }
          },
          error: (error) => {
            console.error('Error al cargar las marcas del atleta:', error);
          }
        });
      },
      error: (error) => {
        console.error('Error al cargar los datos del atleta:', error);
      }
    });

    this.getCategorias();
    this.getPcAL();
    this.getPruebasPorAtleta(atletaId);
  }

  activeTab: string = 'marcasPersonales'; // Tab activa por defecto

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.getPruebasPorAtleta(this.atleta._id);
    
    // Resetear el filtro de año cuando se cambia a marcas personales
    if (this.activeTab === 'marcasPersonales') {
      this.filtroAnyo = undefined;
    } else if (this.activeTab === 'mejoresAnyo' && this.anyos.length > 0) {
      // Seleccionar automáticamente el año más reciente
      this.filtroAnyo = Math.max(...this.anyos);
    }
    
    if (this.activeTab === "resultados" && this.filtroAnyo) {
      this.getPruebasPorAtletaYAnyo(this.atleta._id, this.filtroAnyo);
    }
  }

  getPcAL(): void {
    this.rankingService.getPcAL().subscribe((pcals) => {
      this.PcAL = pcals; // Asignar correctamente a categorias
    });
  }

  getCategorias(): void {
    this.rankingService.getCategorias().subscribe((categorias) => {
      this.categorias = categorias; // Asignar correctamente a categorias
    });
  }

  onCategoriaChange(categoriaId: string): void {
    this.filtroCategoria = categoriaId;
    this.getCategoriaById(categoriaId);
    this.cargarMejoresMarcas();
  }

  onPcALChange(PcALId: string): void {
    this.filtroPcAL = PcALId;
    this.getPcALById(PcALId);
    this.cargarMejoresMarcas();
  }

  onAnyoChange(anyoSeleccionado: number | undefined): void {
    this.filtroAnyo = anyoSeleccionado;

    if (this.activeTab === "resultados" && this.filtroAnyo) {
      this.getPruebasPorAtletaYAnyo(this.atleta._id, this.filtroAnyo);
    }
    this.cargarMejoresMarcas();
  }

  getPcALById(PcALId: string): void {
    this.perfilAtletaService.getPcALById(PcALId).subscribe((PcALData: PcAL) => {
      if (PcALData) {
        this.PcALseleccionado = PcALData.PcAL; // Asigna directamente el valor de PcAL
      }
    }, error => {
      console.error('Error obteniendo PcAL:', error);
    });
  }

  getCategoriaById(categoriaId: string): void {
    this.perfilAtletaService.getCategoriaById(categoriaId).subscribe((CategoriaData: Categoria) => {
      if (CategoriaData) {
        this.categoriaSeleccionada = CategoriaData.nombre_categoria; // Asigna directamente el valor de nombre_categoria
      }
    }, error => {
      console.error('Error obteniendo categoría:', error);
    });
  }

  getPruebasPorAtleta(atletaId: string | null): void {
    this.perfilAtletaService.getPruebasPorAtleta(atletaId!).subscribe((pruebas) => {
      if (pruebas && Array.isArray(pruebas)) {
        this.pruebas = pruebas;
        // Ahora puedes cargar las mejores marcas después de que las pruebas se hayan cargado
        this.cargarMejoresMarcas();
      } else {
        console.error('Error: No se recibieron pruebas válidas.');
      }
    });
  }

  getPruebasPorAtletaYAnyo(atletaId: string | null, anyo: number): void {
    this.perfilAtletaService.getPruebasPorAtletaYAnyo(atletaId!, anyo).subscribe((pruebas) => {
      if (pruebas && Array.isArray(pruebas)) {
        this.pruebas = pruebas;
        this.cargarTodasLasMarcasPorAnyoYPrueba();
      } else {
        console.error('Error: No se recibieron pruebas válidas.');
      }
    });
  }

  cargarMejorMarcaPorAnyo(pruebaId: string, anyo: number) {
    const key = `${pruebaId}-${anyo}`;

    if (!this.marcasPorPruebaAnyo[key]) {
      this.perfilAtletaService.getMejorMarcaPorPruebaYAnyo(this.atleta._id, pruebaId, anyo)
        .subscribe((marca: Marca) => {
          this.marcasPorPruebaAnyo[key] = marca; // Guardar la marca en el objeto de cache
          
          // Si la marca tiene viento ilegal, cargar la mejor marca legal
          if (this.esVientoIlegal(marca.viento)) {
            const keyLegal = `${pruebaId}-${anyo}-legal`;
            this.perfilAtletaService.getMejorMarcaLegalPorPruebaYAnyo(this.atleta._id, pruebaId, anyo)
              .subscribe((marcaLegal: Marca) => {
                this.marcasPorPruebaAnyo[keyLegal] = marcaLegal;
              });
          }
        });
    }
  }

  cargarTodasLasMarcasPorAnyoYPrueba(): void {
    // Reiniciar el objeto de marcas
    this.marcasPorPrueba = {};

    // Recorrer todas las pruebas
    this.pruebas.forEach((prueba) => {
      // Solo cargar marcas si hay un año seleccionado
      if (this.filtroAnyo) {
        // Llamada al servicio para obtener las marcas por año y prueba
        const observableMarcas = this.perfilAtletaService.getAllMarcasPorAnyoYPrueba(
          this.atleta._id,
          prueba._id,
          this.filtroAnyo
        );

        // Definir el observer
        const observer: Observer<Marca[]> = {
          next: (data: Marca[]) => {
            // Guardar los datos obtenidos en el objeto utilizando el ID de la prueba como clave
            this.marcasPorPrueba[prueba._id] = data;
          },
          error: (error) => {
            console.error('Error al obtener las marcas para la prueba:', prueba._id, error);
          },
          complete: function (): void {
          }
        };

        // Subscribirse al observable para obtener las marcas
        observableMarcas.subscribe(observer);
      }
    });
  }

  cargarMejoresMarcas() {
    const pruebaIds = this.pruebas.map(prueba => prueba._id);
    this.mejoresMarcas = [];
    this.mejoresMarcasLegales = {};

    pruebaIds.forEach((pruebaId) => {
      let observableMarca: any;
      
      // Solo aplicar filtro de año en las pestañas de 'mejoresAnyo' y 'resultados'
      if ((this.activeTab === 'mejoresAnyo' || this.activeTab === 'resultados') && this.filtroAnyo) {
        if (this.filtroPcAL) {
          observableMarca = this.perfilAtletaService.getMejorMarcaPorPruebaPcALYAnyo(
            this.atleta._id,
            pruebaId,
            this.filtroPcAL,
            this.filtroAnyo
          );
        } else {
          observableMarca = this.perfilAtletaService.getMejorMarcaPorPruebaYAnyo(
            this.atleta._id,
            pruebaId,
            this.filtroAnyo
          );
        }
      } else {
        // Para otras pestañas sin filtro de año, mantenemos la lógica original
        if (this.filtroCategoria && this.filtroPcAL) {
          observableMarca = this.perfilAtletaService.getMejorMarcaPorPruebaCategoriaPcAL(
            this.atleta._id,
            pruebaId,
            this.filtroCategoria,
            this.filtroPcAL
          );
        } else if (this.filtroCategoria) {
          observableMarca = this.perfilAtletaService.getMejorMarcaPorPruebaYCategoria(
            this.atleta._id,
            pruebaId,
            this.filtroCategoria
          );
        } else if (this.filtroPcAL) {
          observableMarca = this.perfilAtletaService.getMejorMarcaPorPruebaYPcAL(
            this.atleta._id,
            pruebaId,
            this.filtroPcAL
          );
        } else {
          observableMarca = this.perfilAtletaService.getMejorMarcaPorPrueba(
            this.atleta._id,
            pruebaId
          );
        }
      }

      observableMarca.subscribe((mejorMarca: Marca | null) => {
        if (mejorMarca && !this.mejoresMarcas.some(m => m._id === mejorMarca._id)) {
          this.mejoresMarcas.push(mejorMarca);
          
          // Si la mejor marca tiene viento ilegal, buscamos la mejor marca legal
          if (this.esVientoIlegal(mejorMarca.viento)) {
            let observableMarcaLegal: any;
            
            // Solo aplicar filtro de año en las pestañas de 'mejoresAnyo' y 'resultados'
            if ((this.activeTab === 'mejoresAnyo' || this.activeTab === 'resultados') && this.filtroAnyo) {
              if (this.filtroPcAL) {
                observableMarcaLegal = this.perfilAtletaService.getMejorMarcaLegalPorPruebaPcALYAnyo(
                  this.atleta._id,
                  pruebaId,
                  this.filtroPcAL,
                  this.filtroAnyo
                );
              } else {
                observableMarcaLegal = this.perfilAtletaService.getMejorMarcaLegalPorPruebaYAnyo(
                  this.atleta._id,
                  pruebaId,
                  this.filtroAnyo
                );
              }
            } else {
              // Para otras pestañas sin filtro de año, mantenemos la lógica original
              if (this.filtroCategoria && this.filtroPcAL) {
                observableMarcaLegal = this.perfilAtletaService.getMejorMarcaLegalPorPruebaCategoriaPcAL(
                  this.atleta._id,
                  pruebaId,
                  this.filtroCategoria,
                  this.filtroPcAL
                );
              } else if (this.filtroCategoria) {
                observableMarcaLegal = this.perfilAtletaService.getMejorMarcaLegalPorPruebaYCategoria(
                  this.atleta._id,
                  pruebaId,
                  this.filtroCategoria
                );
              } else if (this.filtroPcAL) {
                observableMarcaLegal = this.perfilAtletaService.getMejorMarcaLegalPorPruebaYPcAL(
                  this.atleta._id,
                  pruebaId,
                  this.filtroPcAL
                );
              } else {
                observableMarcaLegal = this.perfilAtletaService.getMejorMarcaLegalPorPrueba(
                  this.atleta._id,
                  pruebaId
                );
              }
            }

            observableMarcaLegal.subscribe((marcaLegal: Marca | null) => {
              if (marcaLegal) {
                this.mejoresMarcasLegales[pruebaId] = marcaLegal;
              }
            });
          }
        }
      }, (error: any) => {
        if (error.status !== 404) {
          console.error('Error obteniendo marca:', error);
        }
      });
    });
  }

  calcularCategoria(): string {
    if (!this.atleta || !this.atleta.fecha_nacimiento) {
      return '';
    }

    const fechaNacimiento = new Date(this.atleta.fecha_nacimiento);
    const hoy = new Date();
    let edad = hoy.getFullYear() - fechaNacimiento.getFullYear();
    
    // Ajustar la edad si aún no ha pasado el cumpleaños este año
    const mesActual = hoy.getMonth();
    const diaActual = hoy.getDate();
    const mesNacimiento = fechaNacimiento.getMonth();
    const diaNacimiento = fechaNacimiento.getDate();
    
    if (mesActual < mesNacimiento || (mesActual === mesNacimiento && diaActual < diaNacimiento)) {
      edad--;
    }

    if (edad < 10) {
      return 'Sub10';
    } else if (edad < 12) {
      return 'Sub12';
    } else if (edad < 14) {
      return 'Sub14';
    } else if (edad < 16) {
      return 'Sub16';
    } else if (edad < 18) {
      return 'Sub18';
    } else if (edad < 20) {
      return 'Sub20';
    } else if (edad < 23) {
      return 'Sub23';
    } else if (edad < 35) {
      return 'Absoluta';
    } else {
      return 'Veteran@';
    }
  }

  formatearTiempo(horas?: number, minutos?: number, segundos?: number): string {
    horas = horas ?? 0;
    minutos = minutos ?? 0;
    segundos = segundos ?? 0;

    if (horas > 0) {
      return `${horas}:${this.pad(minutos)}:${this.pad(Math.round(segundos))}`;
    } else if (minutos > 0) {
      return `${this.pad(minutos)}:${this.formatSegundos(segundos)}`;
    } else {
      return `${this.formatSegundos(segundos)}`;
    }
  }

  pad(valor: number): string {
    return valor < 10 ? '0' + valor : valor.toString();
  }

  formatSegundos(segundos: number | null | undefined): string {
    if (segundos === null || segundos === undefined) {
      return '00.00';
    }
    const segundosEnteros = Math.floor(segundos);
    const decimales = (segundos % 1).toFixed(2).substring(1);
    return `${this.pad(segundosEnteros)}${decimales}`;
  }

  convertirFecha(fecha: string | String): Date | null {
    if (!fecha) return null;
    
    // Si la fecha ya está en formato dd/MM/yyyy, la convertimos a Date
    const partes = fecha.toString().split('/');
    if (partes.length === 3) {
      const dia = parseInt(partes[0], 10);
      const mes = parseInt(partes[1], 10) - 1; // Los meses en JavaScript van de 0 a 11
      const año = parseInt(partes[2], 10);
      
      const date = new Date(año, mes, dia);
      return isNaN(date.getTime()) ? null : date;
    }
    
    // Si no está en el formato esperado, intentamos con el formato por defecto
    const date = new Date(fecha.toString());
    return isNaN(date.getTime()) ? null : date;
  }

  esVientoIlegal(viento: number | undefined): boolean {
    return viento !== undefined && Math.abs(viento) > 2.0;
  }
}

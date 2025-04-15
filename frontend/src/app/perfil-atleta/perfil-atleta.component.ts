import { Component, OnInit } from '@angular/core';
import { ActivatedRoute } from '@angular/router';
import { Atleta, Categoria, Marca, PcAL, Prueba, RankingService } from '../ranking/services/ranking.service';
import { CommonModule } from '@angular/common';
import { PerfilAtletaService } from '../ranking/services/perfil-atleta.service';
import { FormsModule } from '@angular/forms';
import { Observer } from 'rxjs';

@Component({
  selector: 'app-perfil-atleta',
  templateUrl: './perfil-atleta.component.html',
  styleUrls: ['./perfil-atleta.component.css'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class PerfilAtletaComponent implements OnInit {
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
  filtroAnyo!: number;
  anyosPorPrueba!: { [pruebaId: string]: number[]; };

  constructor(
    private rankingService: RankingService,
    private perfilAtletaService: PerfilAtletaService,
    private route: ActivatedRoute
  ) { }

  ngOnInit() {

    const atletaId = this.route.snapshot.paramMap.get('atletaId');
    if (atletaId) {
      // Cargar los datos del atleta
      this.rankingService.getAtletaById(atletaId).subscribe((atleta: Atleta) => {
        this.atleta = atleta;

        // Cargar las marcas del atleta usando su ID
        this.perfilAtletaService.getMarcasByAtletaId(this.atleta._id).subscribe((marcas: Marca[]) => {
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
          this.filtroAnyo = Math.max(...this.anyos);
        });
      });
    } else {
      console.error('El ID del atleta no está disponible.');
      // Manejo del error o redirección
    }

    this.getCategorias();
    this.getPcAL();
    this.getPruebasPorAtleta(atletaId);
  }

  activeTab: string = 'marcasPersonales'; // Tab activa por defecto

  onTabChange(tab: string): void {
    this.activeTab = tab;
    this.getPruebasPorAtleta(this.atleta._id);
    if (this.activeTab === "resultados") {
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


  onAnyoChange(anyoSeleccionado: number): void {
    this.filtroAnyo = anyoSeleccionado;

    if (this.activeTab === "resultados") {
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
        });
    }
  }


  cargarTodasLasMarcasPorAnyoYPrueba(): void {
    // Reiniciar el objeto de marcas
    this.marcasPorPrueba = {};

    // Recorrer todas las pruebas
    this.pruebas.forEach((prueba) => {
      // Llamada al servicio para obtener las marcas por año y prueba
      const observableMarcas = this.perfilAtletaService.getAllMarcasPorAnyoYPrueba(
        this.atleta._id,
        prueba._id, // Asegúrate de que estás pasando el ID correcto de la prueba
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
    });
  }



  cargarMejoresMarcas() {
    const pruebaIds = this.pruebas.map(prueba => prueba._id);
    this.mejoresMarcas = [];

    pruebaIds.forEach((pruebaId) => {
      let observableMarca: any;
      // Lógica para obtener las mejores marcas si se selecciona un año
      if (this.filtroAnyo && (this.activeTab === "mejoresAnyo")) {
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
          // Solo agregar la marca si no está ya en la lista
          this.mejoresMarcas.push(mejorMarca);
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

    const añoNacimiento = this.atleta.fecha_nacimiento;
    const añoActual = new Date().getFullYear();
    const edad = añoActual - añoNacimiento;

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

  formatearTiempo(horas: number, minutos: number, segundos: number): string {
    // Usamos ?? para asegurar que minutos y segundos no sean null o undefined.
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
}

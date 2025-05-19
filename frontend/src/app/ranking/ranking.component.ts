import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RankingService, Sector, Prueba, Marca, Categoria, PcAL } from './services/ranking.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DecathlonModalComponent } from './components/decathlon-modal/decathlon-modal.component';
import { AuthService } from '../auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
import { firstValueFrom } from 'rxjs';

@Component({
  selector: 'app-ranking',
  standalone: true,
  imports: [CommonModule, FormsModule, MatDialogModule, RouterModule],
  templateUrl: './ranking.component.html',
  styleUrls: ['./ranking.component.css']
})
export class RankingComponent implements OnInit {
  sectores: Sector[] = [];
  pruebas: Prueba[] = [];
  marcas: Marca[] = [];
  categorias: Categoria[] = [];
  PcAL: PcAL[] = [];

  categoriaSeleccionada: Categoria | null = null;
  sectorSeleccionado: Sector | null = null;
  pruebaSeleccionada: Prueba | null = null;
  PcALSeleccionado: PcAL | null = null;
  generoSeleccionado: string | null = null;
  vientoValido: boolean = true; // Por defecto mostrar solo marcas con viento válido
  mostrarSoloMejorMarca: boolean = true; // Por defecto mostrar solo la mejor marca de cada atleta

  // Lista de pruebas que requieren medición de viento
  pruebasConViento: string[] = [
    // Pruebas de velocidad
    '100m', '200m',
    // Pruebas de vallas
    '100mv (0.762) sub16 FEM',
    '100mv (0.762) sub18 FEM',
    '100mv (0.91) sub16 MASC',
    '100mv FEM',
    '110mv (0.91) sub18 MASC',
    '110mv (0.99) sub20 MASC',
    '110mv MASC',
    '220mv sub14 FEM',
    '220mv sub14 MASC',
    '300mv sub16 FEM',
    '300mv sub16 MASC',
    '400mv FEM',
    '400mv MASC',
    '400mv sub18 FEM',
    '400mv sub18 MASC',
    '60mv (0.60) sub12 FEM',
    '60mv (0.60) sub12 MASC',
    '60mv (0.762) sub14 FEM',
    '60mv (0.762) sub16 FEM',
    '60mv (0.762) sub18 FEM',
    '60mv (0.84) sub14 MASC',
    '60mv (0.91) sub16 MASC',
    '60mv (0.91) sub18 MASC',
    '60mv (0.99) sub20 MASC',
    '60mv FEM',
    '60mv MASC',
    '80mv (0.762) sub14 FEM',
    '80mv (0.84) sub14 MASC',
    // Pruebas de saltos
    'Salto de Longitud', 
    'Triple Salto'
  ];
  requiereMedicionViento: boolean = false;

  mostrarAtleta: boolean = true;
  mostrarTiempo: boolean = false;
  mostrarMetros: boolean = false;
  mostrarPuntos: boolean = false;
  mostrarLugar: boolean = true;
  mostrarViento: boolean = false;
  mostrarComentario: boolean = false;
  mostrarFecha: boolean = true;

  // Opciones de género para el select
  opcionesGenero = [
    { valor: null, texto: 'Todos' },
    { valor: 'Masculino', texto: 'Masculino' },
    { valor: 'Femenino', texto: 'Femenino' }
  ];

  // Opciones de viento para el select
  opcionesViento = [
    { valor: true, texto: 'Marcas válidas' },
    { valor: false, texto: 'Todas las marcas' }
  ];

  // Opciones para mostrar marcas
  opcionesMostrarMarcas = [
    { valor: true, texto: 'Mejores marcas' },
    { valor: false, texto: 'Todas las marcas' }
  ];

  ambas: PcAL = { _id: 'ambas', PcAL: 'Ambas' };

  // Opción para mostrar todas las categorías
  todasLasCategorias: Categoria = { _id: 'todas', nombre_categoria: 'Todas las categorías' };

  constructor(private rankingService: RankingService, private dialog: MatDialog, private authService: AuthService) { }

  ngOnInit(): void {
    this.getSectores();
    this.getCategorias();
    this.getPcAL();
    this.configurarColumnas();
  }

  configurarColumnas(): void {
    // Siempre mostrar atleta, lugar y fecha
    this.mostrarAtleta = true;
    this.mostrarLugar = true;
    this.mostrarFecha = true;

    // Ocultar todos los campos específicos por defecto
    this.mostrarTiempo = false;
    this.mostrarMetros = false;
    this.mostrarPuntos = false;
    this.mostrarComentario = false;
    this.mostrarViento = false;

    if (!this.pruebaSeleccionada) return;

    // Configurar según el sector
    if (this.sectorSeleccionado) {
      switch (this.sectorSeleccionado.nombre_sector) {
        case 'Velocidad':
        case 'Medio fondo':
        case 'Vallas':
          this.mostrarTiempo = true;
          this.mostrarViento = this.verificarSiRequiereViento();
          break;

        case 'Saltos':
        case 'Lanzamientos':
          this.mostrarMetros = true;
          this.mostrarViento = this.verificarSiRequiereViento();
          break;

        case 'Combinadas':
          this.mostrarPuntos = true;
          this.mostrarComentario = true;
          break;

        case 'Relevos':
          this.mostrarTiempo = true;
          this.mostrarComentario = true;
          break;
      }
    }
  }

  // Verifica si la prueba seleccionada requiere medición de viento
  verificarSiRequiereViento(): boolean {
    if (!this.pruebaSeleccionada) return false;
    
    // Comprueba si la prueba seleccionada está en la lista de pruebas con viento
    this.requiereMedicionViento = this.pruebasConViento.some(
      nombre => this.pruebaSeleccionada?.nombre_prueba.includes(nombre)
    );
    
    return this.requiereMedicionViento;
  }

  // Método para manejar cambio en el filtro de viento
  onVientoSelected(): void {
    if (this.pruebaSeleccionada) {
      this.cargarMarcasSegunFiltros();
    }
  }

  getSectores(): void {
    this.rankingService.getSectores().subscribe((sectores) => {
      this.sectores = sectores;
    });
  }

  onSectorSelected(): void {
    this.pruebaSeleccionada = null; // Reiniciar selección de prueba
    this.categoriaSeleccionada = null; // Reiniciar selección de categoría
    this.marcas = []; // Limpiar marcas
    this.requiereMedicionViento = false; // Resetear flag de viento
    this.configurarColumnas();

    if (this.sectorSeleccionado && this.sectorSeleccionado._id && this.sectorSeleccionado._id !== null && this.sectorSeleccionado !== null) {
      this.getPruebas(this.sectorSeleccionado._id);
    }
  }

  getPruebas(sectorId: string): void {
    this.rankingService.getPruebas().subscribe((pruebas) => {
      // Validar que el sector_id exista antes de hacer el filtro
      this.pruebas = pruebas.filter(prueba => prueba.sector_id && prueba.sector_id._id === sectorId);
    });
  }

  onPruebaSelected(): void {
    this.categoriaSeleccionada = null;
    this.marcas = [];
    this.verificarSiRequiereViento();
    this.configurarColumnas();
  }

  getCategorias(): void {
    this.rankingService.getCategorias().subscribe((categorias) => {
      this.categorias = [this.todasLasCategorias, ...categorias]; // Añadir la opción de todas las categorías al principio
    });
  }

  onCategoriaSelected(): void {
    this.PcALSeleccionado = this.ambas;
    this.marcas = [];
    if (this.pruebaSeleccionada && this.categoriaSeleccionada) {
      this.cargarMarcasSegunFiltros();
    }
  }

  getPcAL(): void {
    this.rankingService.getPcAL().subscribe((pcals) => {
      this.PcAL = pcals; // Asignar correctamente a categorias
    });
  }

  onPcALSelected(): void {
    if (this.pruebaSeleccionada && this.categoriaSeleccionada && this.PcALSeleccionado) {
      this.cargarMarcasSegunFiltros();
    }
  }

  onGeneroSelected(): void {
    this.marcas = [];
    if (this.pruebaSeleccionada) {
      this.cargarMarcasSegunFiltros();
    }
  }

  // Método para manejar cambio en la opción de mostrar marcas
  onMostrarMarcasSelected(): void {
    if (this.pruebaSeleccionada) {
      this.cargarMarcasSegunFiltros();
    }
  }

  // Filtra las marcas por viento válido (≤ 2.0)
  filtrarMarcasPorViento(marcas: Marca[]): Marca[] {
    if (!this.requiereMedicionViento || !this.vientoValido) {
      return marcas; // Si no requiere medición de viento o si queremos todas las marcas, devolver sin filtrar
    }

    // Un mapa para guardar las mejores marcas válidas por atleta
    const mejoresMarcasValidasPorAtleta = new Map<string, Marca>();
    // Un mapa para guardar las mejores marcas (válidas o no) por atleta
    const mejoresMarcasPorAtleta = new Map<string, Marca>();

    marcas.forEach(marca => {
      const atletaId = marca.nombre_atleta._id;
      
      // Actualizar mejor marca global
      if (!mejoresMarcasPorAtleta.has(atletaId) || this.esMejorMarca(marca, mejoresMarcasPorAtleta.get(atletaId)!)) {
        mejoresMarcasPorAtleta.set(atletaId, marca);
      }
      
      // Actualizar mejor marca válida si el viento es válido (≤ 2.0)
      const esVientoValido = marca.viento === undefined || marca.viento === null || marca.viento <= 2.0;
      if (esVientoValido) {
        if (!mejoresMarcasValidasPorAtleta.has(atletaId) || 
            this.esMejorMarca(marca, mejoresMarcasValidasPorAtleta.get(atletaId)!)) {
          mejoresMarcasValidasPorAtleta.set(atletaId, marca);
        }
      }
    });

    // Para aquellos atletas sin marcas válidas, buscar todas sus marcas
    const atletasSinMarcasValidas = Array.from(mejoresMarcasPorAtleta.keys())
      .filter(atletaId => !mejoresMarcasValidasPorAtleta.has(atletaId));

    if (atletasSinMarcasValidas.length > 0) {
      // Aquí cargaríamos todas las marcas para los atletas sin marcas válidas
      // y buscaríamos sus mejores marcas válidas
      // Esto requeriría un enfoque asíncrono
      console.log('Atletas sin marcas válidas:', atletasSinMarcasValidas);
    }

    // Construir el resultado final con las mejores marcas válidas
    return Array.from(mejoresMarcasValidasPorAtleta.values())
      .sort((a, b) => this.ordenarMarcas(a, b));
  }

  // Verifica si marca1 es mejor que marca2
  esMejorMarca(marca1: Marca, marca2: Marca): boolean {
    // Para pruebas de distancia (metros)
    if (marca1.metros !== undefined && marca1.metros !== null && 
        marca2.metros !== undefined && marca2.metros !== null) {
      return marca1.metros > marca2.metros;
    } 
    // Para pruebas de puntos
    else if (marca1.puntos !== undefined && marca1.puntos !== null && 
             marca2.puntos !== undefined && marca2.puntos !== null) {
      return marca1.puntos > marca2.puntos;
    } 
    // Para pruebas de tiempo
    else {
      const tiempo1 = (marca1.horas || 0) * 3600 + (marca1.minutos || 0) * 60 + (marca1.segundos || 0);
      const tiempo2 = (marca2.horas || 0) * 3600 + (marca2.minutos || 0) * 60 + (marca2.segundos || 0);
      return tiempo1 < tiempo2; // Menor tiempo es mejor
    }
  }
  
  // Método para aplicar filtro de todas las marcas vs mejores marcas
  async aplicarFiltroMostrarMarcas(marcas: Marca[]): Promise<Marca[]> {
    if (!this.mostrarSoloMejorMarca) {
      return marcas; // Mostrar todas las marcas
    }

    // Si queremos solo la mejor marca por atleta, agrupamos por atleta
    const mejoresMarcasPorAtleta = new Map<string, Marca>();
    
    // Para cada marca, guardamos solo la mejor de cada atleta
    marcas.forEach(marca => {
      const atletaId = marca.nombre_atleta._id;
      
      if (!mejoresMarcasPorAtleta.has(atletaId) || 
          this.esMejorMarca(marca, mejoresMarcasPorAtleta.get(atletaId)!)) {
        mejoresMarcasPorAtleta.set(atletaId, marca);
      }
    });
    
    // Devolver solo las mejores marcas
    return Array.from(mejoresMarcasPorAtleta.values())
      .sort((a, b) => this.ordenarMarcas(a, b));
  }

  // Método principal para aplicar filtro de viento con asincronía
  async aplicarFiltroViento(marcas: Marca[]): Promise<Marca[]> {
    if (!this.requiereMedicionViento || !this.vientoValido) {
      return this.aplicarFiltroMostrarMarcas(marcas); // No aplicamos filtro de viento, solo el de mostrar marcas
    }

    // Agrupar marcas por atleta
    const marcasPorAtleta: { [key: string]: Marca[] } = {};
    const atletasIds: string[] = [];
    
    marcas.forEach(marca => {
      const atletaId = marca.nombre_atleta._id;
      if (!atletasIds.includes(atletaId)) {
        atletasIds.push(atletaId);
      }
      
      if (!marcasPorAtleta[atletaId]) {
        marcasPorAtleta[atletaId] = [];
      }
      marcasPorAtleta[atletaId].push(marca);
    });

    // Resultado final
    let marcasFiltradas: Marca[] = [];
    
    // Procesar cada atleta
    for (const atletaId of atletasIds) {
      const marcasAtleta = marcasPorAtleta[atletaId];
      
      // Filtrar marcas con viento válido
      const marcasValidas = marcasAtleta.filter(marca => 
        marca.viento === undefined || marca.viento === null || marca.viento <= 2.0
      );
      
      if (marcasValidas.length > 0) {
        if (this.mostrarSoloMejorMarca) {
          // Si mostramos solo mejores marcas, añadir la mejor marca válida
          marcasFiltradas.push(this.obtenerMejorMarca(marcasValidas));
        } else {
          // Si mostramos todas las marcas, añadir todas las marcas válidas
          marcasFiltradas = [...marcasFiltradas, ...marcasValidas];
        }
      } else if (this.pruebaSeleccionada) {
        // Si no hay marcas válidas, buscar todas las marcas del atleta para esta prueba
        try {
          const todasMarcasAtleta = await firstValueFrom(this.rankingService
            .getTodasMarcasAtletaEnPrueba(atletaId, this.pruebaSeleccionada._id));
          
          if (todasMarcasAtleta && todasMarcasAtleta.length > 0) {
            // Filtrar solo marcas con viento válido
            const marcasConVientoValido = todasMarcasAtleta.filter(marca => 
              marca.viento === undefined || marca.viento === null || marca.viento <= 2.0
            );
            
            if (marcasConVientoValido.length > 0) {
              if (this.mostrarSoloMejorMarca) {
                // Si mostramos solo mejores marcas, añadir la mejor marca válida
                marcasFiltradas.push(this.obtenerMejorMarca(marcasConVientoValido));
              } else {
                // Si mostramos todas las marcas, añadir todas las marcas válidas
                marcasFiltradas = [...marcasFiltradas, ...marcasConVientoValido];
              }
            }
          }
        } catch (error) {
          console.error('Error al obtener todas las marcas del atleta:', error);
        }
      }
    }
    
    // Ordenar resultado final
    return marcasFiltradas.sort(this.ordenarMarcas);
  }

  // Obtiene la mejor marca según el tipo de disciplina
  obtenerMejorMarca(marcas: Marca[]): Marca {
    return marcas.reduce((mejor, actual) => {
      if (actual.metros !== undefined && actual.metros !== null) {
        // Para pruebas de distancia (mayor es mejor)
        return mejor.metros === undefined || actual.metros > mejor.metros ? actual : mejor;
      } else if (actual.puntos !== undefined && actual.puntos !== null) {
        // Para pruebas de puntos (mayor es mejor)
        return mejor.puntos === undefined || actual.puntos > mejor.puntos ? actual : mejor;
      } else {
        // Para pruebas de tiempo (menor es mejor)
        const tiempoActual = (actual.horas || 0) * 3600 + (actual.minutos || 0) * 60 + (actual.segundos || 0);
        const tiempoMejor = (mejor.horas || 0) * 3600 + (mejor.minutos || 0) * 60 + (mejor.segundos || 0);
        return tiempoActual < tiempoMejor ? actual : mejor;
      }
    }, marcas[0]);
  }

  // Ordena las marcas para el ranking
  ordenarMarcas(a: Marca, b: Marca): number {
    if (a.metros !== undefined && b.metros !== undefined) {
      return b.metros - a.metros;
    } else if (a.puntos !== undefined && b.puntos !== undefined) {
      return b.puntos - a.puntos;
    } else {
      const tiempoA = (a.horas || 0) * 3600 + (a.minutos || 0) * 60 + (a.segundos || 0);
      const tiempoB = (b.horas || 0) * 3600 + (b.minutos || 0) * 60 + (b.segundos || 0);
      return tiempoA - tiempoB;
    }
  }

  // Método centralizado para cargar marcas según los filtros seleccionados
  cargarMarcasSegunFiltros(): void {
    if (!this.pruebaSeleccionada) return;

    const pruebaId = this.pruebaSeleccionada._id;
    const categoriaId = this.categoriaSeleccionada?._id;
    const PcALId = this.PcALSeleccionado?._id;
    const genero = this.generoSeleccionado;

    // Si se selecciona "Todas las categorías", cargar todas las marcas de la prueba
    if (categoriaId === 'todas') {
      if (genero) {
        this.getMejoresMarcasPorGenero(pruebaId, genero);
      } else {
        this.getMejoresMarcas(pruebaId);
      }
      return;
    }

    // Lógica existente para categorías específicas
    if (categoriaId && PcALId) {
      if (PcALId === 'ambas') {
        if (genero) {
          this.getMejoresMarcasPorCategoriaYGenero(pruebaId, categoriaId, genero);
        } else {
          this.getMejoresMarcasPorCategoria(pruebaId, categoriaId);
        }
      } else {
        if (genero) {
          this.getMejoresMarcasPorCategoriaYPcALYGenero(pruebaId, categoriaId, PcALId, genero);
        } else {
          this.getMejoresMarcasPorCategoriaYPcAL(pruebaId, categoriaId, PcALId);
        }
      }
    }
  }

  getMejoresMarcas(pruebaId: string): void {
    this.rankingService.getMejoresMarcas(pruebaId).subscribe(
      async (marcas) => {
        // Validar que la prueba_id exista antes de hacer el filtro
        let marcasFiltradas = marcas.filter(marca => marca.nombre_prueba && marca.nombre_prueba._id === pruebaId);
        // Aplicar filtro de viento si es necesario
        this.marcas = await this.aplicarFiltroViento(marcasFiltradas);
      },
      (error) => {
        console.error('Error al obtener marcas:', error);
        this.marcas = [];
      }
    );
  }

  getMejoresMarcasPorGenero(pruebaId: string, genero: string): void {
    this.rankingService.getMejoresMarcasPorGenero(pruebaId, genero).subscribe(
      async (marcas) => {
        // Aplicar filtro de viento si es necesario
        this.marcas = await this.aplicarFiltroViento(marcas);
      },
      (error) => {
        console.error('Error al obtener marcas por género:', error);
        this.marcas = [];
      }
    );
  }

  getMejoresMarcasPorCategoria(pruebaId: string, categoriaId: string): void {
    if (!categoriaId || !pruebaId) {
      console.error('categoriaId o pruebaId es undefined');
      return;
    }

    this.rankingService.getMejoresMarcasPorCategoria(pruebaId, categoriaId, this.mostrarSoloMejorMarca).subscribe(
      async (marcas) => {
        if (!marcas || marcas.length === 0) {
          this.marcas = [];
          return;
        }

        // Filtrar marcas válidas
        let marcasFiltradas = marcas.filter(marca => {
          if (!marca || !marca.nombre_prueba || !marca.categoria) {
            return false;
          }
          return marca.nombre_prueba._id === pruebaId && marca.categoria._id === categoriaId;
        });

        // Aplicar filtro de viento si es necesario
        this.marcas = await this.aplicarFiltroViento(marcasFiltradas);
      },
      (error) => {
        console.error('Error al obtener las mejores marcas por categoría:', error);
        this.marcas = [];
      }
    );
  }

  getMejoresMarcasPorCategoriaYGenero(pruebaId: string, categoriaId: string, genero: string): void {
    this.rankingService.getMejoresMarcasPorCategoriaYGenero(pruebaId, categoriaId, genero, this.mostrarSoloMejorMarca).subscribe(
      async (marcas) => {
        // Aplicar filtro de viento si es necesario
        this.marcas = await this.aplicarFiltroViento(marcas);
      },
      (error) => {
        console.error('Error al obtener marcas por categoría y género:', error);
        this.marcas = [];
      }
    );
  }

  getMejoresMarcasPorCategoriaYPcAL(pruebaId: string, categoriaId: string, PcALId: string): void {
    if (!categoriaId) {
      console.error('categoriaId es undefined');
      return; // Evita llamar al servicio si categoriaId es undefined
    }

    this.rankingService.getMejoresMarcasPorCategoriaYPcAL(pruebaId, categoriaId, PcALId, this.mostrarSoloMejorMarca).subscribe(
      async (marcas) => {
        let marcasFiltradas = marcas.filter(marca =>
          marca.nombre_prueba && marca.nombre_prueba._id === pruebaId &&
          marca.categoria && marca.categoria._id === categoriaId &&
          marca.PcAL && marca.PcAL._id === PcALId
        );
        
        // Aplicar filtro de viento si es necesario
        this.marcas = await this.aplicarFiltroViento(marcasFiltradas);
      },
      (error) => {
        console.error('Error al obtener las mejores marcas por categoría y PcAL', error);
      }
    );
  }

  getMejoresMarcasPorCategoriaYPcALYGenero(pruebaId: string, categoriaId: string, PcALId: string, genero: string): void {
    this.rankingService.getMejoresMarcasPorCategoriaYPcALYGenero(pruebaId, categoriaId, PcALId, genero, this.mostrarSoloMejorMarca).subscribe(
      async (marcas) => {
        // Aplicar filtro de viento si es necesario
        this.marcas = await this.aplicarFiltroViento(marcas);
      },
      (error) => {
        console.error('Error al obtener marcas por categoría, PcAL y género:', error);
        this.marcas = [];
      }
    );
  }

  formatearTiempo(horas: number, minutos: number, segundos: number): string {
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
      return '00.00'; // Valor por defecto si los segundos son null o undefined
    }
    // Formateamos los segundos con dos decimales y aplicamos el padding si es necesario
    const segundosEnteros = Math.floor(segundos); // Parte entera de los segundos
    const decimales = (segundos % 1).toFixed(2).substring(1); // Parte decimal de los segundos
    return `${this.pad(segundosEnteros)}${decimales}`; // Aplicamos pad a los segundos enteros y añadimos los decimales
  }

  openDecathlonModal(comentario: string): void {
    const dialogRef = this.dialog.open(DecathlonModalComponent, {
      width: '400px',
      data: { 
        comentario: comentario,
        tipoPrueba: this.pruebaSeleccionada ? this.pruebaSeleccionada.nombre_prueba : 'Decatlón MASC'
      }
    });

    dialogRef.afterClosed().subscribe(result => {
      if (result) {
        console.log('Marcas ingresadas:', result);
        // Aquí puedes manejar las marcas ingresadas
      }
    });
  }

  

  deleteMarca(marcaId: string) {
    const confirmacion = confirm('¿Estás seguro de que quieres borrar esta marca?');
    if (confirmacion) {
      this.rankingService.deleteMarca(marcaId).subscribe(
        (response) => {
          console.log('Marca eliminada con éxito');
          // Recargar las marcas según filtros activos
          this.cargarMarcasSegunFiltros();
        },
        (error) => {
          console.error('Error al eliminar la marca:', error);
        }
      );
    }
  }

  isAdmin(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Admin');
  }

}

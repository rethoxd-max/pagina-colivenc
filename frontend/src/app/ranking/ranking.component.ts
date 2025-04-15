import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { RankingService, Sector, Prueba, Marca, Categoria, PcAL } from './services/ranking.service';
import { MatDialog, MatDialogModule } from '@angular/material/dialog';
import { DecathlonModalComponent } from './components/decathlon-modal/decathlon-modal.component';
import { AuthService } from '../auth/services/auth.service';
import { Router, RouterModule } from '@angular/router';
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

  mostrarAtleta: boolean = true;
  mostrarTiempo: boolean = false;
  mostrarMetros: boolean = false;
  mostrarPuntos: boolean = false;
  mostrarLugar: boolean = true;
  mostrarViento: boolean = false;
  mostrarComentario: boolean = false;
  mostrarFecha: boolean = true;



  ambas: PcAL = { _id: 'ambas', PcAL: 'Ambas' };

  constructor(private rankingService: RankingService, private dialog: MatDialog, private authService: AuthService) { }

  ngOnInit(): void {
    this.getSectores();
    this.getCategorias();
    this.getPcAL();
    this.configurarColumnas();
  }

  configurarColumnas(): void {
    // Según el tipo de prueba, selecciona las columnas a mostrar
    if (this.sectorSeleccionado?.nombre_sector === 'Velocidad' || this.sectorSeleccionado?.nombre_sector === 'Medio fondo') {
      this.mostrarTiempo = true;
      this.mostrarMetros = false;
      this.mostrarPuntos = false;
      this.mostrarComentario = false;
      this.mostrarViento = true; // Puede ser necesario en carreras
    } else if (this.sectorSeleccionado?.nombre_sector === 'Saltos' || this.sectorSeleccionado?.nombre_sector === 'Lanzamientos') {
      this.mostrarTiempo = false;
      this.mostrarMetros = true;
      this.mostrarPuntos = false;
      this.mostrarComentario = false;
      this.mostrarViento = true; // Puede ser necesario para saltos y lanzamientos
    } else if (this.sectorSeleccionado?.nombre_sector === 'Combinadas') {
      this.mostrarTiempo = false;
      this.mostrarMetros = false;
      this.mostrarPuntos = true;
      this.mostrarComentario = true;
      this.mostrarViento = false; // Puede o no ser necesario en combinadas
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
  }

  getCategorias(): void {
    this.rankingService.getCategorias().subscribe((categorias) => {
      this.categorias = categorias; // Asignar correctamente a categorias
    });
  }

  onCategoriaSelected(): void {
    this.PcALSeleccionado = this.ambas;
    this.marcas = [];
    if (this.pruebaSeleccionada && this.categoriaSeleccionada) {
      this.getMejoresMarcasPorCategoria(this.pruebaSeleccionada._id, this.categoriaSeleccionada._id);
    }
  }

  getPcAL(): void {
    this.rankingService.getPcAL().subscribe((pcals) => {
      this.PcAL = pcals; // Asignar correctamente a categorias
    });
  }

  onPcALSelected(): void {
    if (this.pruebaSeleccionada && this.categoriaSeleccionada && this.PcALSeleccionado) {
      this.getMejoresMarcasPorCategoriaYPcAL(this.pruebaSeleccionada._id, this.categoriaSeleccionada._id, this.PcALSeleccionado._id);
    }
  }

  getMejoresMarcas(pruebaId: string): void {
    this.rankingService.getMejoresMarcas(pruebaId).subscribe((marcas) => {
      // Validar que la prueba_id exista antes de hacer el filtro
      this.marcas = marcas.filter(marca => marca.nombre_prueba && marca.nombre_prueba._id === pruebaId);
    });
  }

  getMejoresMarcasPorCategoria(pruebaId: string, categoriaId: string): void {
    if (!categoriaId) {
      console.error('categoriaId es undefined');
      return; // Evita llamar al servicio si categoriaId es undefined
    }

    this.rankingService.getMejoresMarcasPorCategoria(pruebaId, categoriaId).subscribe(
      (marcas) => {
        this.marcas = marcas.filter(marca =>
          marca.nombre_prueba && marca.nombre_prueba._id === pruebaId &&
          marca.categoria && marca.categoria._id === categoriaId
        );
      },
      (error) => {
        console.error('Error al obtener las mejores marcas por categoría:', error);
      }
    );
  }

  getMejoresMarcasPorCategoriaYPcAL(pruebaId: string, categoriaId: string, PcALId: string): void {
    if (!categoriaId) {
      console.error('categoriaId es undefined');
      return; // Evita llamar al servicio si categoriaId es undefined
    }

    if (PcALId === this.ambas._id) {
      this.getMejoresMarcasPorCategoria(pruebaId, categoriaId);
    } else {
      this.rankingService.getMejoresMarcasPorCategoriaYPcAL(pruebaId, categoriaId, PcALId).subscribe(
        (marcas) => {
          this.marcas = marcas.filter(marca =>
            marca.nombre_prueba && marca.nombre_prueba._id === pruebaId &&
            marca.categoria && marca.categoria._id === categoriaId &&
            marca.PcAL && marca.PcAL._id === PcALId
          );
        },
        (error) => {
          console.error('Error al obtener las mejores marcas por categoría y PcAL', error);
        }
      );
    }
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
      data: { comentario: comentario } // Pasa el comentario aquí
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
          // Verificar si las variables de categoría, prueba y PcAL están definidas
          if (this.pruebaSeleccionada && this.categoriaSeleccionada && this.PcALSeleccionado) {
            // Llamar a la función para actualizar las marcas después de eliminar una
            this.getMejoresMarcasPorCategoriaYPcAL(
              this.pruebaSeleccionada._id,
              this.categoriaSeleccionada._id,
              this.PcALSeleccionado._id
            );
          }
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

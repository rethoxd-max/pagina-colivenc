import { Component, OnInit, ViewChild, ElementRef } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatSnackBar, MatSnackBarModule } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { MatExpansionModule } from '@angular/material/expansion';
import { RankingService, Atleta, Prueba, LugarConocido, Sector } from '../../../services/ranking.service';
import { PerfilAtletaService } from '../../../services/perfil-atleta.service';

// Tipos de línea para autocompletado
type TipoLinea = 'lugar' | 'prueba' | 'atleta' | 'desconocido';
type TipoCampoPrueba = 'sector' | 'prueba' | 'ninguno';

interface MarcaPreview {
  valido: boolean;
  atleta?: string;
  fechaNacimiento?: string;
  genero?: string;
  atletaExiste?: boolean;
  categoria?: string;
  marca?: string;
  comentario?: string;
  marcaParsed?: any;
  error?: string;
  texto?: string;
}

interface PruebaPreview {
  numero: number;
  nombre: string;
  encontrada: boolean;
  sector: string;
  sectorEncontrado?: boolean;
  seCrearaSector?: boolean;
  seCrearaPrueba?: boolean;
  resumen: {
    totalMarcas: number;
    validos: number;
    invalidos: number;
  };
  marcas: MarcaPreview[];
}

interface CompeticionPreview {
  numero: number;
  valido: boolean;
  cabecera: {
    lugar: string;
    fecha: string;
    pcAL: string;
    pcALValido: boolean;
  } | null;
  pruebas: PruebaPreview[];
  errores: any[];
}

interface PreviewResponse {
  totalCompeticiones: number;
  totalPruebas: number;
  resumenGlobal: {
    totalMarcas: number;
    validos: number;
    invalidos: number;
  };
  competiciones: CompeticionPreview[];
}

@Component({
  selector: 'app-importar-csv',
  standalone: true,
  imports: [
    CommonModule,
    FormsModule,
    MatCardModule,
    MatButtonModule,
    MatSnackBarModule,
    MatProgressSpinnerModule,
    MatIconModule,
    MatTooltipModule,
    MatExpansionModule
  ],
  templateUrl: './importar-csv.component.html',
  styleUrls: ['./importar-csv.component.css']
})
export class ImportarCsvComponent implements OnInit {
  @ViewChild('csvTextarea') csvTextarea!: ElementRef<HTMLTextAreaElement>;
  
  csvData: string = '';
  previsualizacion: PreviewResponse | null = null;
  cargando: boolean = false;
  importando: boolean = false;
  resultadoImportacion: any = null;

  // Datos para autocompletado
  atletas: Atleta[] = [];
  pruebas: Prueba[] = [];
  sectores: Sector[] = [];
  lugaresConocidos: LugarConocido[] = [];

  // Estado del autocompletado
  mostrarSugerencias: boolean = false;
  sugerenciaSeleccionada: number = -1;
  tipoAutocompletado: TipoLinea = 'desconocido';
  sugerenciasActuales: any[] = [];
  lineaActual: number = 0;
  textoLineaActual: string = '';

  // Ejemplo de formato para mostrar al usuario
  ejemploFormato: string = `Valencia,19/12/2025,PC
Saltos,Longitud
Pablo García,05/04/2000,M,6.70
María López,15/08/2005,F,5.50 +1.2`;

  ejemploCarreras: string = `Madrid,15/06/2024,AL
Carreras,100m
Juan Pérez,10/03/2007,M,11.45 +1.2
Ana García,22/09/2008,F,12.30 -0.5`;

  ejemploCombinadas: string = `Benimamet,19/12/2025,PC
Combinadas,Decatlón
Carlos Ruiz,05/04/2000,M,5000,7.50/6.80/12.50/1.85/52.30/15.20/35.00/4.20/45.00/4:30.50`;

  ejemploMultiple: string = `Valencia,19/12/2025,PC
Saltos,Longitud
Pablo García,05/04/2000,M,6.70
María López,15/08/2005,F,5.50 +1.2

Carreras,100m
Juan Pérez,10/03/2007,M,11.45 +1.2


Madrid,20/12/2025,AL
Carreras,200m
Ana García,22/09/2008,F,25.30`;

  constructor(
    private rankingService: RankingService,
    private perfilAtletaService: PerfilAtletaService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit(): void {
    // Cargar todos los atletas para autocompletado
    this.perfilAtletaService.getAtletas().subscribe({
      next: (atletas) => {
        this.atletas = atletas;
      },
      error: (err) => {
        console.error('Error al cargar atletas:', err);
      }
    });

    // Cargar todas las pruebas para autocompletado
    this.rankingService.getPruebas().subscribe({
      next: (pruebas) => {
        this.pruebas = pruebas;
      },
      error: (err) => {
        console.error('Error al cargar pruebas:', err);
      }
    });

    // Cargar todos los sectores para autocompletado
    this.rankingService.getSectores().subscribe({
      next: (sectores) => {
        this.sectores = sectores;
      },
      error: (err) => {
        console.error('Error al cargar sectores:', err);
      }
    });

    // Cargar lugares conocidos de marcas existentes
    this.rankingService.getLugaresConocidos().subscribe({
      next: (lugares) => {
        this.lugaresConocidos = lugares;
      },
      error: (err) => {
        console.error('Error al cargar lugares:', err);
      }
    });
  }

  // Determinar el tipo de línea basado en el contexto
  detectarTipoLinea(texto: string, cursorPos: number): TipoLinea {
    const lineas = texto.substring(0, cursorPos).split('\n');
    const numLinea = lineas.length - 1;
    
    // Si es la primera línea, es lugar
    if (numLinea === 0) {
      return 'lugar';
    }
    
    // Analizar las líneas anteriores para determinar el contexto
    let lineasVaciasConsecutivas = 0;
    let ultimaLineaConTexto = -1;
    
    for (let i = numLinea - 1; i >= 0; i--) {
      const linea = texto.split('\n')[i];
      if (linea.trim() === '') {
        lineasVaciasConsecutivas++;
      } else {
        ultimaLineaConTexto = i;
        break;
      }
    }
    
    // 2 o más líneas vacías antes = nueva competición = lugar
    if (lineasVaciasConsecutivas >= 2) {
      return 'lugar';
    }
    
    // 1 línea vacía antes = nueva prueba
    if (lineasVaciasConsecutivas === 1) {
      return 'prueba';
    }
    
    // Si la línea anterior tiene texto, determinar qué tipo es esa línea
    if (ultimaLineaConTexto >= 0) {
      const lineaAnterior = texto.split('\n')[ultimaLineaConTexto];
      
      // Si la línea anterior es una cabecera (lugar,fecha,PC/AL), esta es una prueba
      if (this.esLineaCabecera(lineaAnterior)) {
        return 'prueba';
      }
      
      // Si la línea anterior es una prueba (sin comas o muy pocas), esta es atleta
      if (!lineaAnterior.includes(',') || lineaAnterior.split(',').length <= 2) {
        return 'atleta';
      }
      
      // Si la línea anterior parece una marca de atleta, esta también es atleta
      return 'atleta';
    }
    
    return 'desconocido';
  }

  // Manejar input en el textarea para autocompletado
  onTextareaInput(event: Event): void {
    const textarea = event.target as HTMLTextAreaElement;
    const cursorPos = textarea.selectionStart;
    const texto = textarea.value;
    
    // Obtener la línea actual
    const lineasHastaCursor = texto.substring(0, cursorPos).split('\n');
    this.lineaActual = lineasHastaCursor.length - 1;
    this.textoLineaActual = lineasHastaCursor[lineasHastaCursor.length - 1];
    
    // Detectar el tipo de línea
    this.tipoAutocompletado = this.detectarTipoLinea(texto, cursorPos);
    
    // Autoformatear fechas si estamos en campo de fecha
    if (this.tipoAutocompletado === 'lugar' || this.tipoAutocompletado === 'atleta') {
      const resultado = this.autoformatearFecha(textarea, cursorPos, texto);
      if (resultado) {
        return; // Si se autoformateó, no continuar con el autocompletado normal
      }
    }
    
    const textoBusqueda = this.textoLineaActual.split(',')[0].trim();
    
    if (textoBusqueda.length < 1) {
      this.mostrarSugerencias = false;
      this.sugerenciasActuales = [];
      return;
    }
    
    switch (this.tipoAutocompletado) {
      case 'lugar':
        this.buscarLugares(textoBusqueda);
        break;
      case 'prueba':
        // Determinar si estamos escribiendo sector o prueba
        this.buscarSectorOPrueba();
        break;
      case 'atleta':
        this.buscarAtletas(textoBusqueda);
        break;
      default:
        this.mostrarSugerencias = false;
        this.sugerenciasActuales = [];
    }
  }

  // Determinar si estamos en campo de sector o prueba y buscar apropiadamente
  buscarSectorOPrueba(): void {
    const partes = this.textoLineaActual.split(',');
    
    if (partes.length === 1) {
      // Escribiendo el sector (antes de la coma)
      const textoSector = partes[0].trim();
      if (textoSector.length >= 1) {
        this.buscarSectores(textoSector);
      } else {
        this.mostrarSugerencias = false;
        this.sugerenciasActuales = [];
      }
    } else {
      // Después de la coma, escribiendo la prueba
      const nombreSector = partes[0].trim();
      const textoPrueba = partes[1].trim();
      
      if (textoPrueba.length >= 1) {
        this.buscarPruebasPorSector(textoPrueba, nombreSector);
      } else {
        // Mostrar todas las pruebas del sector seleccionado
        this.buscarPruebasPorSector('', nombreSector);
      }
    }
  }

  // Buscar sectores que coincidan
  buscarSectores(texto: string): void {
    const textoLower = texto.toLowerCase();
    this.sugerenciasActuales = this.sectores
      .filter(sector => sector.nombre_sector.toLowerCase().includes(textoLower))
      .map(sector => ({ tipo: 'sector', ...sector }))
      .slice(0, 8);
    
    this.mostrarSugerencias = this.sugerenciasActuales.length > 0;
    this.sugerenciaSeleccionada = -1;
  }

  // Buscar pruebas, opcionalmente filtradas por sector
  buscarPruebasPorSector(textoPrueba: string, nombreSector: string): void {
    const textoLower = textoPrueba.toLowerCase();
    const sectorLower = nombreSector.toLowerCase();
    
    let pruebasFiltradas = this.pruebas;
    
    // Si hay un sector, filtrar primero por ese sector
    if (nombreSector) {
      pruebasFiltradas = this.pruebas.filter(
        prueba => prueba.sector_id?.nombre_sector?.toLowerCase() === sectorLower
      );
    }
    
    // Luego filtrar por texto de prueba
    if (textoPrueba) {
      pruebasFiltradas = pruebasFiltradas.filter(
        prueba => prueba.nombre_prueba.toLowerCase().includes(textoLower)
      );
    }
    
    this.sugerenciasActuales = pruebasFiltradas
      .map(prueba => ({ tipo: 'prueba', ...prueba }))
      .slice(0, 8);
    
    this.mostrarSugerencias = this.sugerenciasActuales.length > 0;
    this.sugerenciaSeleccionada = -1;
  }

  // Autoformatear fecha mientras se escribe
  autoformatearFecha(textarea: HTMLTextAreaElement, cursorPos: number, texto: string): boolean {
    // Encontrar inicio y fin de la línea actual
    const inicioLinea = texto.lastIndexOf('\n', cursorPos - 1) + 1;
    const finLinea = texto.indexOf('\n', cursorPos);
    const finReal = finLinea === -1 ? texto.length : finLinea;
    const lineaActual = texto.substring(inicioLinea, finReal);
    
    const partes = lineaActual.split(',');
    const posEnLinea = cursorPos - inicioLinea;
    
    // Determinar en qué campo estamos (contando comas hasta la posición del cursor)
    let comasAntes = 0;
    let posInicioCampo = 0;
    for (let i = 0; i < posEnLinea; i++) {
      if (lineaActual[i] === ',') {
        comasAntes++;
        posInicioCampo = i + 1;
      }
    }
    
    // Campo de fecha: 
    // - En línea de lugar: después de la primera coma (índice 1)
    // - En línea de atleta: después de la primera coma (índice 1)
    const esCampoFecha = comasAntes === 1;
    
    if (!esCampoFecha) {
      return false;
    }
    
    // Obtener el contenido del campo de fecha actual
    const campoFecha = partes[1] || '';
    const posEnCampo = posEnLinea - posInicioCampo;
    
    // Solo procesar si el último carácter es un dígito
    const ultimoCaracter = campoFecha[posEnCampo - 1];
    if (!ultimoCaracter || !/\d/.test(ultimoCaracter)) {
      return false;
    }
    
    // Analizar la fecha parcial
    const partesDate = campoFecha.split('/');
    const numPartes = partesDate.length;
    
    let nuevoTexto = texto;
    let nuevaPosicion = cursorPos;
    let modificado = false;
    
    if (numPartes === 1) {
      // Estamos escribiendo el día
      const dia = partesDate[0];
      if (dia.length === 1) {
        const primerDigito = parseInt(dia, 10);
        // Si es > 3, añadir 0 delante y pasar al mes
        if (primerDigito > 3) {
          const nuevaFecha = `0${dia}/`;
          nuevoTexto = this.reemplazarCampo(texto, inicioLinea, partes, 1, nuevaFecha);
          nuevaPosicion = inicioLinea + posInicioCampo + nuevaFecha.length;
          modificado = true;
        }
      } else if (dia.length === 2) {
        // Si hay 2 dígitos, añadir /
        const nuevaFecha = `${dia}/`;
        nuevoTexto = this.reemplazarCampo(texto, inicioLinea, partes, 1, nuevaFecha);
        nuevaPosicion = inicioLinea + posInicioCampo + nuevaFecha.length;
        modificado = true;
      }
    } else if (numPartes === 2) {
      // Estamos escribiendo el mes
      const mes = partesDate[1];
      if (mes.length === 1) {
        const primerDigito = parseInt(mes, 10);
        // Si es > 1, añadir 0 delante y pasar al año
        if (primerDigito > 1) {
          const nuevaFecha = `${partesDate[0]}/0${mes}/`;
          nuevoTexto = this.reemplazarCampo(texto, inicioLinea, partes, 1, nuevaFecha);
          nuevaPosicion = inicioLinea + posInicioCampo + nuevaFecha.length;
          modificado = true;
        }
      } else if (mes.length === 2) {
        // Si hay 2 dígitos, añadir /
        const nuevaFecha = `${partesDate[0]}/${mes}/`;
        nuevoTexto = this.reemplazarCampo(texto, inicioLinea, partes, 1, nuevaFecha);
        nuevaPosicion = inicioLinea + posInicioCampo + nuevaFecha.length;
        modificado = true;
      }
    } else if (numPartes === 3) {
      // Estamos escribiendo el año
      const anyo = partesDate[2];
      if (anyo.length === 2) {
        const anyoNum = parseInt(anyo, 10);
        let anyoCompleto: string;
        // 50-99 → 1950-1999, 00-49 → 2000-2049
        if (anyoNum >= 50 && anyoNum <= 99) {
          anyoCompleto = `19${anyo}`;
        } else {
          anyoCompleto = `20${anyo}`;
        }
        const nuevaFecha = `${partesDate[0]}/${partesDate[1]}/${anyoCompleto}`;
        nuevoTexto = this.reemplazarCampo(texto, inicioLinea, partes, 1, nuevaFecha);
        nuevaPosicion = inicioLinea + posInicioCampo + nuevaFecha.length;
        modificado = true;
      }
    }
    
    if (modificado) {
      this.csvData = nuevoTexto;
      setTimeout(() => {
        textarea.setSelectionRange(nuevaPosicion, nuevaPosicion);
      }, 0);
      return true;
    }
    
    return false;
  }

  // Reemplazar un campo específico en la línea
  reemplazarCampo(texto: string, inicioLinea: number, partes: string[], indiceCampo: number, nuevoValor: string): string {
    partes[indiceCampo] = nuevoValor;
    const finLinea = texto.indexOf('\n', inicioLinea);
    const finReal = finLinea === -1 ? texto.length : finLinea;
    const nuevaLinea = partes.join(',');
    return texto.substring(0, inicioLinea) + nuevaLinea + texto.substring(finReal);
  }

  // Buscar lugares que coincidan
  buscarLugares(texto: string): void {
    const textoLower = texto.toLowerCase();
    this.sugerenciasActuales = this.lugaresConocidos
      .filter(lugar => lugar.nombre.toLowerCase().includes(textoLower))
      .slice(0, 8);
    
    this.mostrarSugerencias = this.sugerenciasActuales.length > 0;
    this.sugerenciaSeleccionada = -1;
  }

  // Buscar atletas que coincidan con el texto
  buscarAtletas(texto: string): void {
    const textoLower = texto.toLowerCase();
    this.sugerenciasActuales = this.atletas
      .filter(atleta => atleta.nombre.toLowerCase().includes(textoLower))
      .slice(0, 8);
    
    this.mostrarSugerencias = this.sugerenciasActuales.length > 0;
    this.sugerenciaSeleccionada = -1;
  }

  // Detectar si la línea es una cabecera de competición (lugar,fecha,PC/AL)
  esLineaCabecera(linea: string): boolean {
    const partes = linea.split(',');
    if (partes.length === 3) {
      const pcal = partes[2].trim().toUpperCase();
      if (pcal === 'PC' || pcal === 'AL') {
        return true;
      }
    }
    return false;
  }

  // Manejar teclas especiales en el textarea
  onTextareaKeydown(event: KeyboardEvent): void {
    if (!this.mostrarSugerencias) return;
    
    switch (event.key) {
      case 'ArrowDown':
        event.preventDefault();
        this.sugerenciaSeleccionada = Math.min(this.sugerenciaSeleccionada + 1, this.sugerenciasActuales.length - 1);
        break;
      case 'ArrowUp':
        event.preventDefault();
        this.sugerenciaSeleccionada = Math.max(this.sugerenciaSeleccionada - 1, -1);
        break;
      case 'Enter':
        if (this.sugerenciaSeleccionada >= 0) {
          event.preventDefault();
          this.seleccionarSugerencia(this.sugerenciasActuales[this.sugerenciaSeleccionada]);
        }
        break;
      case 'Tab':
        if (this.sugerenciaSeleccionada >= 0) {
          event.preventDefault();
          this.seleccionarSugerencia(this.sugerenciasActuales[this.sugerenciaSeleccionada]);
        } else if (this.sugerenciasActuales.length > 0) {
          event.preventDefault();
          this.seleccionarSugerencia(this.sugerenciasActuales[0]);
        }
        break;
      case 'Escape':
        this.mostrarSugerencias = false;
        break;
    }
  }

  // Seleccionar la sugerencia según el tipo
  seleccionarSugerencia(sugerencia: any): void {
    switch (this.tipoAutocompletado) {
      case 'lugar':
        this.seleccionarLugar(sugerencia as LugarConocido);
        break;
      case 'prueba':
        // Determinar si es sector o prueba por el tipo de sugerencia
        if (sugerencia.tipo === 'sector') {
          this.seleccionarSector(sugerencia);
        } else {
          this.seleccionarPrueba(sugerencia);
        }
        break;
      case 'atleta':
        this.seleccionarAtleta(sugerencia as Atleta);
        break;
    }
  }

  // Seleccionar un lugar y autocompletar con formato lugar,,PC/AL
  seleccionarLugar(lugar: LugarConocido): void {
    const textarea = this.csvTextarea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const texto = textarea.value;
    
    // Encontrar el inicio de la línea actual
    const inicioLinea = texto.lastIndexOf('\n', cursorPos - 1) + 1;
    const finLinea = texto.indexOf('\n', cursorPos);
    const finReal = finLinea === -1 ? texto.length : finLinea;
    
    // Construir nueva línea: Lugar,,PC o AL (fecha vacía para que el usuario la llene)
    const nuevaLinea = `${lugar.nombre},,${lugar.pcAL}`;
    
    // Reemplazar la línea
    this.csvData = texto.substring(0, inicioLinea) + nuevaLinea + texto.substring(finReal);
    
    // Ocultar sugerencias
    this.mostrarSugerencias = false;
    this.sugerenciasActuales = [];
    
    // Mover cursor después de la primera coma (campo de fecha)
    setTimeout(() => {
      const posicionFecha = inicioLinea + lugar.nombre.length + 1;
      textarea.setSelectionRange(posicionFecha, posicionFecha);
      textarea.focus();
    }, 0);
  }

  // Seleccionar un sector (añade el nombre del sector seguido de coma)
  seleccionarSector(sector: any): void {
    const textarea = this.csvTextarea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const texto = textarea.value;
    
    // Encontrar el inicio de la línea actual
    const inicioLinea = texto.lastIndexOf('\n', cursorPos - 1) + 1;
    const finLinea = texto.indexOf('\n', cursorPos);
    const finReal = finLinea === -1 ? texto.length : finLinea;
    
    // Construir nueva línea: Sector, (con coma para escribir la prueba)
    const nuevaLinea = `${sector.nombre_sector},`;
    
    // Reemplazar la línea
    this.csvData = texto.substring(0, inicioLinea) + nuevaLinea + texto.substring(finReal);
    
    // Ocultar sugerencias
    this.mostrarSugerencias = false;
    this.sugerenciasActuales = [];
    
    // Mover cursor después de la coma para escribir la prueba
    setTimeout(() => {
      const nuevaPosicion = inicioLinea + nuevaLinea.length;
      textarea.setSelectionRange(nuevaPosicion, nuevaPosicion);
      textarea.focus();
    }, 0);
  }

  // Seleccionar una prueba (completa la línea con sector,prueba)
  seleccionarPrueba(prueba: any): void {
    const textarea = this.csvTextarea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const texto = textarea.value;
    
    // Encontrar el inicio de la línea actual
    const inicioLinea = texto.lastIndexOf('\n', cursorPos - 1) + 1;
    const finLinea = texto.indexOf('\n', cursorPos);
    const finReal = finLinea === -1 ? texto.length : finLinea;
    
    // Obtener el sector actual de la línea (si existe)
    const lineaActual = texto.substring(inicioLinea, finReal);
    const partes = lineaActual.split(',');
    const sectorActual = partes[0].trim();
    
    // Usar el sector de la prueba seleccionada o el que ya estaba escrito
    const nombreSector = sectorActual || prueba.sector_id?.nombre_sector || '';
    
    // Construir nueva línea: Sector,Prueba
    const nuevaLinea = `${nombreSector},${prueba.nombre_prueba}`;
    
    // Reemplazar la línea
    this.csvData = texto.substring(0, inicioLinea) + nuevaLinea + texto.substring(finReal);
    
    // Ocultar sugerencias
    this.mostrarSugerencias = false;
    this.sugerenciasActuales = [];
    
    // Mover cursor al final
    setTimeout(() => {
      const nuevaPosicion = inicioLinea + nuevaLinea.length;
      textarea.setSelectionRange(nuevaPosicion, nuevaPosicion);
      textarea.focus();
    }, 0);
  }

  // Seleccionar un atleta y autocompletar
  seleccionarAtleta(atleta: Atleta): void {
    const textarea = this.csvTextarea.nativeElement;
    const cursorPos = textarea.selectionStart;
    const texto = textarea.value;
    
    // Encontrar el inicio de la línea actual
    const inicioLinea = texto.lastIndexOf('\n', cursorPos - 1) + 1;
    const finLinea = texto.indexOf('\n', cursorPos);
    const finReal = finLinea === -1 ? texto.length : finLinea;
    
    // Obtener la línea actual
    const lineaActual = texto.substring(inicioLinea, finReal);
    const partes = lineaActual.split(',');
    
    // Formatear fecha de nacimiento
    const fechaNac = new Date(atleta.fecha_nacimiento);
    const fechaFormateada = `${fechaNac.getDate().toString().padStart(2, '0')}/${(fechaNac.getMonth() + 1).toString().padStart(2, '0')}/${fechaNac.getFullYear()}`;
    
    // Género (M/F)
    const genero = atleta.genero === 'Masculino' ? 'M' : 'F';
    
    // Construir nueva línea: Nombre,FechaNac,Genero,
    let nuevaLinea = `${atleta.nombre},${fechaFormateada},${genero},`;
    
    // Si ya había algo después del nombre (marca), mantenerlo
    if (partes.length > 3) {
      nuevaLinea += partes.slice(3).join(',');
    }
    
    // Reemplazar la línea
    this.csvData = texto.substring(0, inicioLinea) + nuevaLinea + texto.substring(finReal);
    
    // Ocultar sugerencias
    this.mostrarSugerencias = false;
    this.sugerenciasActuales = [];
    
    // Mover cursor al final de la línea (para escribir la marca)
    setTimeout(() => {
      const nuevaPosicion = inicioLinea + nuevaLinea.length;
      textarea.setSelectionRange(nuevaPosicion, nuevaPosicion);
      textarea.focus();
    }, 0);
  }

  previsualizar(): void {
    if (!this.csvData.trim()) {
      this.snackBar.open('Por favor, introduce datos CSV', 'Cerrar', { duration: 3000 });
      return;
    }

    this.cargando = true;
    this.previsualizacion = null;
    this.resultadoImportacion = null;

    this.rankingService.previsualizarCSV(this.csvData).subscribe({
      next: (response: PreviewResponse) => {
        this.previsualizacion = response;
        this.cargando = false;
      },
      error: (err: any) => {
        this.snackBar.open(`Error: ${err.error?.message || err.message}`, 'Cerrar', { duration: 5000 });
        this.cargando = false;
      }
    });
  }

  importar(): void {
    if (!this.csvData.trim()) {
      this.snackBar.open('Por favor, introduce datos CSV', 'Cerrar', { duration: 3000 });
      return;
    }

    if (!this.previsualizacion) {
      this.snackBar.open('Por favor, previsualiza primero', 'Cerrar', { duration: 3000 });
      return;
    }

    if (this.previsualizacion.resumenGlobal.validos === 0) {
      this.snackBar.open('No hay marcas válidas para importar', 'Cerrar', { duration: 3000 });
      return;
    }

    this.importando = true;

    this.rankingService.importarCSV(this.csvData).subscribe({
      next: (response: any) => {
        this.resultadoImportacion = response;
        this.importando = false;
        this.snackBar.open(
          `Importación completada: ${response.resumen?.totalMarcasCreadas || 0} marcas creadas`,
          'Cerrar',
          { duration: 5000 }
        );
      },
      error: (err: any) => {
        this.snackBar.open(`Error: ${err.error?.message || err.message}`, 'Cerrar', { duration: 5000 });
        this.importando = false;
      }
    });
  }

  limpiar(): void {
    this.csvData = '';
    this.previsualizacion = null;
    this.resultadoImportacion = null;
  }

  cargarEjemplo(tipo: 'saltos' | 'carreras' | 'combinadas' | 'multiple'): void {
    switch (tipo) {
      case 'saltos':
        this.csvData = this.ejemploFormato;
        break;
      case 'carreras':
        this.csvData = this.ejemploCarreras;
        break;
      case 'combinadas':
        this.csvData = this.ejemploCombinadas;
        break;
      case 'multiple':
        this.csvData = this.ejemploMultiple;
        break;
    }
  }

  puedeImportar(): boolean {
    if (!this.previsualizacion) return false;
    return this.previsualizacion.competiciones.every(comp => 
      comp.cabecera?.pcALValido && 
      comp.pruebas.every(prueba => prueba.encontrada || prueba.seCrearaPrueba)
    );
  }

  formatearMarca(marcaParsed: any): string {
    if (!marcaParsed) return '';
    
    if (marcaParsed.metros !== null) {
      let resultado = `${marcaParsed.metros}m`;
      if (marcaParsed.viento !== null) {
        resultado += ` (${marcaParsed.viento > 0 ? '+' : ''}${marcaParsed.viento} m/s)`;
      }
      return resultado;
    }
    
    if (marcaParsed.puntos !== null) {
      return `${marcaParsed.puntos} pts`;
    }
    
    let tiempo = '';
    if (marcaParsed.horas) tiempo += `${marcaParsed.horas}h `;
    if (marcaParsed.minutos) tiempo += `${marcaParsed.minutos}' `;
    if (marcaParsed.segundos !== null) tiempo += `${marcaParsed.segundos}''`;
    if (marcaParsed.viento !== null) {
      tiempo += ` (${marcaParsed.viento > 0 ? '+' : ''}${marcaParsed.viento} m/s)`;
    }
    
    return tiempo.trim();
  }
}

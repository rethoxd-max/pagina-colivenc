import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';

interface Marca {
  atleta: string;
  prueba: string;
  marca: string;
  fecha: string;
  competicion: string;
  lugar: string;
}

@Component({
  selector: 'app-procesar-resultados',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="container mt-4">
      <h2>Procesar Resultados de Competición</h2>
      
      <div class="form-group">
        <label for="resultados">Pega aquí los resultados de la competición:</label>
        <textarea 
          id="resultados" 
          class="form-control" 
          rows="10" 
          [(ngModel)]="textoResultados"
          placeholder="Pega aquí el texto de los resultados...">
        </textarea>
      </div>

      <button class="btn btn-primary mt-3" (click)="procesarResultados()">
        Procesar Resultados
      </button>

      <div *ngIf="marcas.length > 0" class="mt-4">
        <h3>Marcas encontradas:</h3>
        <pre>{{ marcas | json }}</pre>
        
        <button class="btn btn-success mt-3" (click)="copiarJSON()">
          Copiar JSON
        </button>
      </div>
    </div>
  `,
  styles: [`
    .container {
      max-width: 800px;
      margin: 0 auto;
      box-sizing: border-box;
    }
    textarea {
      font-family: monospace;
      width: 100%;
      max-width: 100%;
      box-sizing: border-box;
    }
    pre {
      background-color: #f8f9fa;
      padding: 15px;
      border-radius: 5px;
      max-height: 500px;
      overflow: auto;
      max-width: 100%;
      box-sizing: border-box;
      white-space: pre-wrap;
      word-break: break-word;
      overflow-wrap: anywhere;
    }
    @media (max-width: 768px) {
      .container {
        padding-left: 12px;
        padding-right: 12px;
      }
      h2 {
        font-size: 1.5rem;
        word-break: break-word;
      }
      .btn {
        width: 100%;
        min-height: 44px;
      }
      pre {
        padding: 12px;
        font-size: 0.85rem;
      }
    }
    @media (max-width: 480px) {
      h2 {
        font-size: 1.3rem;
      }
      pre {
        max-height: 360px;
      }
    }
  `]
})
export class ProcesarResultadosComponent {
  textoResultados: string = '';
  marcas: Marca[] = [];

  procesarResultados() {
    const lineas = this.textoResultados.split('\n');
    this.marcas = [];
    let pruebaActual = '';
    let competicionActual = '';
    let lugarActual = '';
    let fechaActual = '';

    for (let i = 0; i < lineas.length; i++) {
      const linea = lineas[i].trim();

      // Detectar información de la competición
      if (linea.includes('Cto. Provincial')) {
        competicionActual = linea;
        // Buscar fecha en las siguientes líneas
        for (let j = i + 1; j < i + 5; j++) {
          if (lineas[j]?.includes('/')) {
            fechaActual = lineas[j].trim();
            break;
          }
        }
      }

      // Detectar lugar
      if (linea.includes('Pista de Atletismo')) {
        lugarActual = linea;
      }

      // Detectar prueba
      if (linea.match(/^\d{2}:\d{2}/) || linea.match(/^[A-Za-z]+$/)) {
        pruebaActual = linea;
      }

      // Buscar atletas del Centre Esp. Colivenc
      if (linea.includes('Centre Esp. Colivenc')) {
        const nombreAtleta = lineas[i - 1]?.trim();
        const marca = lineas[i + 1]?.trim();

        if (nombreAtleta && marca) {
          this.marcas.push({
            atleta: nombreAtleta,
            prueba: pruebaActual,
            marca: marca,
            fecha: fechaActual,
            competicion: competicionActual,
            lugar: lugarActual
          });
        }
      }
    }
  }

  copiarJSON() {
    const jsonString = JSON.stringify(this.marcas, null, 2);
    navigator.clipboard.writeText(jsonString)
      .then(() => alert('JSON copiado al portapapeles'))
      .catch(err => console.error('Error al copiar:', err));
  }
} 
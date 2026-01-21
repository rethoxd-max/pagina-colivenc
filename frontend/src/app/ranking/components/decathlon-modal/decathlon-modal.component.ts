import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { FormsModule } from '@angular/forms';
import { NgFor, NgIf } from '@angular/common';

interface PruebaCombinada {
  nombre: string;
  marca: string;
  viento?: number | null;
}

interface PruebasCombinadas {
  [key: string]: PruebaCombinada[];
}

@Component({
  selector: 'app-pruebas-combinadas-modal',
  standalone: true,
  imports: [MatDialogModule, MatButtonModule, FormsModule, NgFor, NgIf],
  templateUrl: './decathlon-modal.component.html',
  styleUrls: ['./decathlon-modal.component.css']
})
export class DecathlonModalComponent {
  pruebasPorTipo: PruebasCombinadas = {
    // ================== DECATHLON ==================
    'DecatlonM': [
      { nombre: '100ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(7.260kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '400ml', marca: '' },
      { nombre: '110mv(1.06)', marca: '' },
      { nombre: 'Disco(2kg)', marca: '' },
      { nombre: 'Pertiga', marca: '' },
      { nombre: 'Jabalina(800g)', marca: '' },
      { nombre: '1500ml', marca: '' }
    ],
    'DecatlonM Sub20': [
      { nombre: '100ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(5kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '400ml', marca: '' },
      { nombre: '100mv(0.91)', marca: '' },
      { nombre: 'Disco(1kg)', marca: '' },
      { nombre: 'Pertiga', marca: '' },
      { nombre: 'Jabalina(700g)', marca: '' },
      { nombre: '1500ml', marca: '' }
    ],
    'DecatlonM Sub18': [
      { nombre: '100ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(5kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '400ml', marca: '' },
      { nombre: '100mv(0.91)', marca: '' },
      { nombre: 'Disco(1kg)', marca: '' },
      { nombre: 'Pertiga', marca: '' },
      { nombre: 'Jabalina(700g)', marca: '' },
      { nombre: '1500ml', marca: '' }
    ],

    // ================== OCTATLON ==================
    'OctatlonM Sub16': [
      { nombre: '100ml', marca: '' },
      { nombre: 'Peso(4kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Disco(1kg)', marca: '' },
      { nombre: '100mv(0.91)', marca: '' },
      { nombre: 'Pertiga', marca: '' },
      { nombre: 'Jabalina(600g)', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],

    // ================== HEPTATLON MASCULINO (Pista Cubierta) ==================
    'HeptatlonM': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(7.260kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv(1.06)', marca: '' },
      { nombre: 'Pertiga', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'HeptatlonM Sub20': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(5kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv(0.91)', marca: '' },
      { nombre: 'Pertiga', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'HeptatlonM Sub18': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(5kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv(0.91)', marca: '' },
      { nombre: 'Pertiga', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],

    // ================== HEPTATLON FEMENINO (Aire Libre) ==================
    'HeptatlonF': [
      { nombre: '100mv(0.84)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso(4kg)', marca: '' },
      { nombre: '200ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Jabalina(600g)', marca: '' },
      { nombre: '800ml', marca: '' }
    ],
    'HeptatlonF Sub18': [
      { nombre: '100mv(0.76)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso(3kg)', marca: '' },
      { nombre: '200ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Jabalina(500g)', marca: '' },
      { nombre: '800ml', marca: '' }
    ],

    // ================== HEXATLON ==================
    'HexatlonM Sub16': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(4kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv(0.91)', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'HexatlonM Sub14': [
      { nombre: '80ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(3kg)', marca: '' },
      { nombre: '80mv(0.76)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Jabalina(400g)', marca: '' }
    ],
    'HexatlonF Sub16': [
      { nombre: '100mv(0.76)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso(3kg)', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Jabalina(500g)', marca: '' },
      { nombre: '600ml', marca: '' }
    ],

    // ================== PENTATLON ==================
    'PentatlonF': [
      { nombre: '60mv(0.84)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso(4kg)', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: '800ml', marca: '' }
    ],
    'PentatlonF Sub18': [
      { nombre: '60mv(0.76)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso(3kg)', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: '800ml', marca: '' }
    ],
    'PentatlonF Sub16': [
      { nombre: '60mv(0.76)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso(3kg)', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: '600ml', marca: '' }
    ],
    'PentatlonM Sub14': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso(3kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv(0.84)', marca: '' }
    ],

    // ================== TETRATLON ==================
    'TetratlonF Sub14': [
      { nombre: '60mv(0.76)', marca: '' },
      { nombre: 'Peso(3kg)', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: '60ml', marca: '' }
    ]
  };

  pruebas: PruebaCombinada[] = [];
  tipoPrueba: string = '';
  Math = Math; // Para usar Math.ceil en el template

  constructor(
    public dialogRef: MatDialogRef<DecathlonModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { comentario: string, tipoPrueba: string }
  ) {
    this.tipoPrueba = data.tipoPrueba || 'DecatlonM';
    this.inicializarPruebas();
    this.setMarcasDesdeComentario(data.comentario);
  }

  inicializarPruebas(): void {
    if (this.pruebasPorTipo[this.tipoPrueba]) {
      this.pruebas = [...this.pruebasPorTipo[this.tipoPrueba]];
    } else {
      // Si no existe el tipo de prueba, usar DecatlonM como valor predeterminado
      this.pruebas = [...this.pruebasPorTipo['DecatlonM']];
    }
  }

  setMarcasDesdeComentario(comentario: string): void {
    // Verifica si el comentario es nulo o vacío
    if (!comentario) {
      // Si el comentario es nulo o vacío, mantener marcas vacías
      return;
    }
    
    const marcas = comentario.split('/'); // Divide la cadena en un array usando '/' como separador

    // Asigna las marcas a las pruebas
    for (let i = 0; i < this.pruebas.length; i++) {
      if (marcas[i]) {
        // Parsear marca y viento si existe en formato "marca(viento)"
        const match = marcas[i].match(/^([^(]+)(?:\(([+-]?\d+\.?\d*)\))?$/);
        if (match) {
          this.pruebas[i].marca = match[1].trim();
          if (match[2]) {
            this.pruebas[i].viento = parseFloat(match[2]);
          }
        } else {
          this.pruebas[i].marca = marcas[i];
        }
      }
    }
  }

  onClose(): void {
    // Crear el comentario como una cadena separada por "/"
    const comentarioActualizado = this.pruebas.map(prueba => {
      if (prueba.viento !== undefined && prueba.viento !== null) {
        const vientoStr = prueba.viento >= 0 ? `+${prueba.viento}` : `${prueba.viento}`;
        return `${prueba.marca}(${vientoStr})`;
      }
      return prueba.marca;
    }).join('/');
    this.dialogRef.close({ pruebas: this.pruebas, comentario: comentarioActualizado });
  }
}

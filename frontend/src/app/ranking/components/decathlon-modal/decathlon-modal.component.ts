import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

interface PruebasCombinadas {
  [key: string]: { nombre: string, marca: string }[];
}

@Component({
  selector: 'app-pruebas-combinadas-modal',
  standalone: true,
  imports: [MatDialogModule, FormsModule, NgFor],
  templateUrl: './decathlon-modal.component.html',
  styleUrls: ['./decathlon-modal.component.css']
})
export class DecathlonModalComponent {
  pruebasPorTipo: PruebasCombinadas = {
    'Decatlón MASC': [
      { nombre: '100ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '400ml', marca: '' },
      { nombre: '110mv', marca: '' },
      { nombre: 'Disco', marca: '' },
      { nombre: 'Pértiga', marca: '' },
      { nombre: 'Jabalina', marca: '' },
      { nombre: '1500ml', marca: '' }
    ],
    'Decatlón MASC sub18': [
      { nombre: '100ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (5kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '400ml', marca: '' },
      { nombre: '110mv (0.91m)', marca: '' },
      { nombre: 'Disco (1.5kg)', marca: '' },
      { nombre: 'Pértiga', marca: '' },
      { nombre: 'Jabalina (700g)', marca: '' },
      { nombre: '1500ml', marca: '' }
    ],
    'Decatlón MASC sub20': [
      { nombre: '100ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (6kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '400ml', marca: '' },
      { nombre: '110mv (0.99m)', marca: '' },
      { nombre: 'Disco (1.75kg)', marca: '' },
      { nombre: 'Pértiga', marca: '' },
      { nombre: 'Jabalina', marca: '' },
      { nombre: '1500ml', marca: '' }
    ],
    'Heptatlón FEM': [
      { nombre: '100mv', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso', marca: '' },
      { nombre: '200ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Jabalina', marca: '' },
      { nombre: '800ml', marca: '' }
    ],
    'Heptatlón FEM sub18': [
      { nombre: '100mv (0.76m)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso (3kg)', marca: '' },
      { nombre: '200ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Jabalina (500g)', marca: '' },
      { nombre: '800ml', marca: '' }
    ],
    'Heptatlón MASC': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv', marca: '' },
      { nombre: 'Pértiga', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'Heptatlón MASC sub18': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (5kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv (0.91m)', marca: '' },
      { nombre: 'Pértiga', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'Heptatlón MASC sub20': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (6kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv (0.99m)', marca: '' },
      { nombre: 'Pértiga', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'Hexatlón FEM sub16': [
      { nombre: '80mv', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso (3kg)', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Jabalina (500g)', marca: '' },
      { nombre: '600ml', marca: '' }
    ],
    'Hexatlón MASC sub14': [
      { nombre: '80ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (3kg)', marca: '' },
      { nombre: '80mv (0.84m)', marca: '' },
      { nombre: 'Jabalina (500g)', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'Hexatlón MASC sub16': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (4kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv (0.91m)', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'Octatlón MASC sub16': [
      { nombre: '100ml', marca: '' },
      { nombre: 'Peso (4kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Disco (1kg)', marca: '' },
      { nombre: '100mv (0.91m)', marca: '' },
      { nombre: 'Pértiga', marca: '' },
      { nombre: 'Jabalina (600g)', marca: '' },
      { nombre: '1000ml', marca: '' }
    ],
    'Pentatlón FEM sub16': [
      { nombre: '60mv', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: 'Peso (3kg)', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: '600ml', marca: '' }
    ],
    'Pentatlón MASC sub14': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (3kg)', marca: '' },
      { nombre: 'Altura', marca: '' },
      { nombre: '60mv (0.84m)', marca: '' }
    ],
    'Tetratlón FEM sub14': [
      { nombre: '60mv (0.76m)', marca: '' },
      { nombre: 'Peso (3kg)', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: '60ml', marca: '' }
    ],
    'Triatlón FEM sub12': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (2kg)', marca: '' }
    ],
    'Triatlón MASC sub12': [
      { nombre: '60ml', marca: '' },
      { nombre: 'Longitud', marca: '' },
      { nombre: 'Peso (2kg)', marca: '' }
    ]
  };

  pruebas: { nombre: string, marca: string }[] = [];
  tipoPrueba: string = '';

  constructor(
    public dialogRef: MatDialogRef<DecathlonModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { comentario: string, tipoPrueba: string }
  ) {
    this.tipoPrueba = data.tipoPrueba || 'Decatlón MASC';
    this.inicializarPruebas();
    this.setMarcasDesdeComentario(data.comentario);
  }

  inicializarPruebas(): void {
    if (this.pruebasPorTipo[this.tipoPrueba]) {
      this.pruebas = [...this.pruebasPorTipo[this.tipoPrueba]];
    } else {
      // Si no existe el tipo de prueba, usar Decatlón MASC como valor predeterminado
      this.pruebas = [...this.pruebasPorTipo['Decatlón MASC']];
    }
  }

  setMarcasDesdeComentario(comentario: string): void {
    // Verifica si el comentario es nulo o vacío
    if (!comentario) {
      // Si el comentario es nulo o vacío, mantener marcas vacías
      return;
    } else {
      const marcas = comentario.split('/'); // Divide la cadena en un array usando '/' como separador

      // Asigna las marcas a las pruebas
      for (let i = 0; i < this.pruebas.length; i++) {
        if (marcas[i]) {
          this.pruebas[i].marca = marcas[i]; // Asigna la marca a la prueba correspondiente
        }
      }
    }
  }

  onClose(): void {
    // Crear el comentario como una cadena separada por "/"
    const comentarioActualizado = this.pruebas.map(prueba => prueba.marca).join('/');
    this.dialogRef.close({ pruebas: this.pruebas, comentario: comentarioActualizado });
  }
}

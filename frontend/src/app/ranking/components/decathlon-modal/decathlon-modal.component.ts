import { Component, Inject } from '@angular/core';
import { MatDialogRef, MAT_DIALOG_DATA } from '@angular/material/dialog';
import { MatDialogModule } from '@angular/material/dialog';
import { FormsModule } from '@angular/forms';
import { NgFor } from '@angular/common';

@Component({
  selector: 'app-decathlon-modal',
  standalone: true,
  imports: [MatDialogModule, FormsModule, NgFor],
  templateUrl: './decathlon-modal.component.html',
  styleUrls: ['./decathlon-modal.component.css'] // Asegúrate de usar 'styleUrls' aquí
})
export class DecathlonModalComponent {
  pruebas = [
    { nombre: '100ml', marca: '' },
    { nombre: 'Longitud', marca: '' },
    { nombre: 'Peso', marca: '' },
    { nombre: 'Altura', marca: '' },
    { nombre: '400ml', marca: '' },
    { nombre: '110mv', marca: '' },
    { nombre: 'Disco', marca: '' },
    { nombre: 'Pértiga', marca: '' },
    { nombre: 'Jabalina', marca: '' },
    { nombre: '1500ml', marca: '' },
  ];

  constructor(
    public dialogRef: MatDialogRef<DecathlonModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: { comentario: string } // Recibe el comentario al abrir el modal
  ) {
    this.setMarcasDesdeComentario(data.comentario);
  }

  setMarcasDesdeComentario(comentario: string): void {
    // Verifica si el comentario es nulo o vacío
    if (!comentario) {
      // Si el comentario es nulo o vacío, asigna marcas vacías a las pruebas
      for (let i = 0; i < this.pruebas.length; i++) {
        this.pruebas[i].marca = ''; // Asigna una marca vacía
      }
    } else {
      const marcas = comentario.split('/'); // Divide la cadena en un array usando '/' como separador

      // Asigna las marcas a las pruebas
      for (let i = 0; i < this.pruebas.length; i++) {
        if (marcas[i]) {
          this.pruebas[i].marca = marcas[i]; // Asigna la marca a la prueba correspondiente
        } else {
          this.pruebas[i].marca = ''; // Asigna una marca vacía si no hay suficiente información
        }
      }
    }
  }


  onClose(): void {
    this.dialogRef.close(this.pruebas);
  }
}

import { Component, EventEmitter, OnInit, Output } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { Prueba, RankingService, Sector } from '../../../services/ranking.service';

@Component({
  selector: 'app-create-prueba',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule],
  templateUrl: './create-prueba.component.html',
  styleUrls: ['./create-prueba.component.css']
})
export class CreatePruebaComponent implements OnInit {
  pruebaForm!: FormGroup;
  sectores: Sector[] = [];

  constructor(private fb: FormBuilder, private rankingService: RankingService) { }

  ngOnInit(): void {
    // Inicializamos el formulario con los campos necesarios para una prueba
    this.pruebaForm = this.fb.group({
      nombre_prueba: ['', [Validators.required]], // Nombre de la prueba (requerido)
      sector_id: ['', [Validators.required]] // Sector de la prueba (requerido), aquí se almacenará el ID del sector
    });

    // Obtenemos los sectores desde el servicio
    this.getSectores();
  }

  getSectores() {
    this.rankingService.getSectores().subscribe((sectores: any[]) => {
      this.sectores = sectores;
    });
  }

  // Función para manejar el envío del formulario
  onSubmit(): void {
    if (this.pruebaForm.valid) {
      const pruebaData = this.pruebaForm.value;

      // Verifica los datos enviados
      console.log('Datos del formulario antes de enviar:', pruebaData);

      this.rankingService.postPrueba(pruebaData).subscribe(
        (response) => {
          console.log('Prueba creada con éxito', response);
          this.pruebaForm.reset(); // Reiniciamos el formulario
        },
        (error) => {
          console.error('Error al crear la prueba', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }


}

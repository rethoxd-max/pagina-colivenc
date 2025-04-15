import { Component, OnInit } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';
import { RankingService } from '../../../services/ranking.service';

@Component({
  selector: 'app-create-atleta',
  standalone: true,
  imports: [ReactiveFormsModule, CommonModule], // Importamos ReactiveFormsModule y CommonModule
  templateUrl: './create-atleta.component.html',
  styleUrls: ['./create-atleta.component.css']
})
export class CreateAtletaComponent implements OnInit {
  atletaForm!: FormGroup;
  currentYear: number = 2024;

  constructor(private fb: FormBuilder, private rankingService: RankingService) { }

  ngOnInit(): void {
    // Inicializamos el formulario
    this.atletaForm = this.fb.group({
      nombre: ['', [Validators.required]], // Nombre del atleta (requerido)
      fecha_nacimiento: ['', [Validators.required]] // Fecha de nacimiento (requerido)
    });
  }

  // Función para manejar el envío del formulario
  onSubmit(): void {
    if (this.atletaForm.valid) {
      const atletaData = this.atletaForm.value; // Datos del formulario
      this.rankingService.postAtleta(atletaData).subscribe(
        (response) => {
          console.log('Atleta creado con éxito', response);
          this.atletaForm.reset(); // Reiniciamos el formulario
        },
        (error) => {
          console.error('Error al crear el atleta', error);
        }
      );
    } else {
      console.log('Formulario no válido');
    }
  }
}

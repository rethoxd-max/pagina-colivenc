import { Component, inject } from '@angular/core';
import { FormBuilder, FormGroup, Validators, FormArray, FormControl, FormsModule, ReactiveFormsModule } from '@angular/forms';
import { EntrenamientosService, Entrenamiento } from '../../services/entrenamientos.service';
import { ActivatedRoute, Route, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-crear-entrenamiento',
  standalone: true,
  templateUrl: './crear-entrenamiento.component.html',
  styleUrls: ['./crear-entrenamiento.component.css'],
  imports: [ReactiveFormsModule, CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule]
})
export class CrearEntrenamientoComponent {
  entrenamientoForm: FormGroup;
  private entrenamientosService = inject(EntrenamientosService);
  private route = inject(ActivatedRoute);

  tiposEntrenamiento = ['Técnica', 'Pesas', 'Series', 'Velocidad'];
  tecnicas = ['Peso', 'Longitud', 'Pértiga'];
  constructor(
    private fb: FormBuilder,
    private router: Router,

  ) {
    this.entrenamientoForm = this.fb.group({
      tipo: ['', Validators.required],
      tecnica: this.fb.array([]),
      pesas: this.fb.array([]),
      serie: this.fb.array([]),
      velocidad: this.fb.array([]),
    });
  }

  addField(type: string): void {
    const control = this.fb.group({});
    if (type === 'tecnica') {
      control.addControl('descripcion', this.fb.control(''));
      this.tecnica.push(control);
    } else if (type === 'pesas') {
      control.addControl('series', this.fb.control(''));
      control.addControl('repeticiones', this.fb.control(''));
      control.addControl('porcentaje', this.fb.control(''));
      control.addControl('comentario', this.fb.control(''));
      this.pesas.push(control);
    } else if (type === 'serie') {
      control.addControl('numeroSeries', this.fb.control(''));
      control.addControl('metros', this.fb.control(''));
      control.addControl('recuperacion', this.fb.control(''));
      control.addControl('comentario', this.fb.control(''));
      this.serie.push(control);
    } else if (type === 'velocidad') {
      control.addControl('numeroSeries', this.fb.control(''));
      control.addControl('metros', this.fb.control(''));
      control.addControl('recuperacion', this.fb.control(''));
      control.addControl('comentario', this.fb.control(''));
      this.velocidad.push(control);
    }
  }

  get tecnica() {
    return this.entrenamientoForm.get('tecnica') as FormArray;
  }

  get pesas() {
    return this.entrenamientoForm.get('pesas') as FormArray;
  }

  get serie() {
    return this.entrenamientoForm.get('serie') as FormArray;
  }

  get velocidad() {
    return this.entrenamientoForm.get('velocidad') as FormArray;
  }

  onSubmit(): void {
    if (this.entrenamientoForm.valid) {
      const entrenamiento: Entrenamiento = this.entrenamientoForm.value;
      const diaEntrenamientoId = this.route.snapshot.paramMap.get('diaEntrenamientoId');

      if (diaEntrenamientoId) {
        this.entrenamientosService.addEntrenamientoToDia(diaEntrenamientoId, entrenamiento).subscribe({
          next: () => this.router.navigate(['/entrenamientos']),
          error: (err) => console.error('Error al crear entrenamiento:', err)
        });
      }
    }
  }

}

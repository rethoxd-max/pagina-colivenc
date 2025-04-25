import { Component, OnInit, inject } from '@angular/core';
import { FormBuilder, FormControl, FormGroup, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, ActivatedRoute } from '@angular/router';
import { AuthService } from '../../../auth/services/auth.service';
import { EntrenamientosService, GrupoEntrenamiento } from '../../services/entrenamientos.service';
import { SearchAtletaComponent } from "../../../ranking/create-performance/components/search-atleta/search-atleta.component";
import { CommonModule } from '@angular/common';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';

@Component({
  selector: 'app-crear-grupo-entrenamiento',
  standalone: true,
  templateUrl: './crear-grupo-entrenamiento.component.html',
  styleUrls: ['./crear-grupo-entrenamiento.component.css'],
  imports: [ReactiveFormsModule, CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, SearchAtletaComponent],
})
export class CrearGrupoEntrenamientoComponent implements OnInit {
  grupoForm!: FormGroup;
  atletasSeleccionados: any[] = [];
  isEditing: boolean = false;
  nombreAtletaControl = new FormControl('');
  nombreGrupo: string = '';
  grupoId: string | null = null;
  entrenadorNombre: string = '';

  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private entrenamientosService = inject(EntrenamientosService);
  public router = inject(Router);
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.grupoId = this.route.snapshot.paramMap.get('id');
    this.isEditing = !!this.grupoId;
    this.initForm();

    if (this.isEditing && this.grupoId) {
      this.entrenamientosService.getGrupoEntrenamiento(this.grupoId).subscribe((grupo: GrupoEntrenamiento) => {
        this.nombreGrupo = grupo.nombre_grupo;
        this.atletasSeleccionados = grupo.atletas;
        this.grupoForm.patchValue({
          nombre_grupo: grupo.nombre_grupo,
          atletas: grupo.atletas
        });
      });
    }
  }

  initForm() {
    const entrenador = this.authService.getUser();
    this.entrenadorNombre = entrenador?.name || '';
    
    // Inicializar el control de búsqueda de atletas
    this.nombreAtletaControl = new FormControl('');

    this.grupoForm = this.fb.group({
      nombre_grupo: ['', Validators.required],
      entrenador: [entrenador?.id, Validators.required],
      atletas: [[]]
    });
  }

  addAtleta(atleta: any) {
    this.atletasSeleccionados.push(atleta);
    this.grupoForm.get('atletas')?.setValue(this.atletasSeleccionados);

    this.nombreAtletaControl.setValue('');
  }

  removeAtleta(atletaId: string) {
    this.atletasSeleccionados = this.atletasSeleccionados.filter(a => a._id !== atletaId);
    this.grupoForm.get('atletas')?.setValue(this.atletasSeleccionados);
  }

  onSubmit() {
    const formValue = this.grupoForm.getRawValue();
    if (this.isEditing && this.grupoId) {
      this.entrenamientosService.actualizarGrupo(this.grupoId, formValue).subscribe(() => this.router.navigate(['/entrenamientos']));
    } else {
      this.entrenamientosService.createGrupoEntrenamiento(formValue).subscribe(() => this.router.navigate(['/entrenamientos']));
    }
  }
}

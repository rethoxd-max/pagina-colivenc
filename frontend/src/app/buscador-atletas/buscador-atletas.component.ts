import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormControl, FormsModule, Validators, FormGroup } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, startWith, map, of } from 'rxjs';
import { RankingService } from '../ranking/services/ranking.service';
import { Atleta } from '../ranking/services/perfil-atleta.service';
import { SearchAtletaComponent } from '../ranking/create-performance/components/search-atleta/search-atleta.component';

@Component({
  selector: 'app-buscador-atletas',
  standalone: true,
  imports: [
    ReactiveFormsModule, CommonModule, FormsModule, MatAutocompleteModule, MatFormFieldModule, MatInputModule, SearchAtletaComponent
  ],
  templateUrl: './buscador-atletas.component.html'
})
export class BuscadorAtletasComponent implements OnInit {
  buscadorForm!: FormGroup;
  nombreAtletaControl = new FormControl(''); // Inicializado aquí
  atletas: Atleta[] = [];
  atletaSeleccionado: Atleta | null = null; // Guardar el atleta seleccionado completo

  constructor(private router: Router, private fb: FormBuilder, private rankingService: RankingService) { }

  ngOnInit(): void {
    this.buscadorForm = this.fb.group({
      nombre_atleta: [null, Validators.required],
    });
    this.nombreAtletaControl = this.fb.control('');
    this.getAtletas();
  }

  getAtletas() {
    this.rankingService.getAtletas().subscribe((atletas: any[]) => {
      this.atletas = atletas;
    });
  }

  onAtletaSelected(atleta: Atleta) {
    this.atletaSeleccionado = atleta; // Guardar el atleta completo
    this.buscadorForm.patchValue({
      nombre_atleta: atleta._id
    });
  }

  resetAtleta(): void {
    this.nombreAtletaControl.reset();
    this.atletaSeleccionado = null;
    this.buscadorForm.patchValue({
      nombre_atleta: null
    });
  }

  onSubmit(): void {
    if (this.buscadorForm.valid && this.atletaSeleccionado) {
      // Usar el slug si está disponible, sino usar el ID
      const identificador = this.atletaSeleccionado.slug || this.atletaSeleccionado._id;
      this.router.navigate(['/perfil-atleta', identificador]);
      this.buscadorForm.reset();
      this.resetAtleta();
    } else {
      console.log('No se ha seleccionado un atleta.');
    }
  }

}

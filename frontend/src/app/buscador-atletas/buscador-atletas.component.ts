import { Component, OnInit } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormControl, FormsModule, Validators, FormGroup } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { Observable, startWith, map, of } from 'rxjs';
import { RankingService, Atleta } from '../ranking/services/ranking.service';
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
    this.buscadorForm.patchValue({
      nombre_atleta: atleta._id
    });
  }

  resetAtleta(): void {
    this.nombreAtletaControl.reset();
    this.buscadorForm.patchValue({
      nombre_atleta: null
    });
  }

  onSubmit(): void {
    if (this.buscadorForm.valid) {
      const atletaId = this.buscadorForm.get('nombre_atleta')?.value;

      if (atletaId) {
        this.router.navigate([`/perfil-atleta/${atletaId}`]);
        this.buscadorForm.reset();
        this.resetAtleta();
      } else {
        console.log('No se ha seleccionado un atleta.');
      }
    } else {
      console.log('Formulario no válido');
    }
  }

}

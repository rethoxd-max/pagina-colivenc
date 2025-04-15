import { Component, EventEmitter, Output, OnInit, Input } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, FormsModule, FormControl } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Observable, startWith, map } from 'rxjs';
import { RankingService, Atleta } from '../../../services/ranking.service';

@Component({
  selector: 'app-search-atleta',
  standalone: true,
  imports: [
    ReactiveFormsModule,
    FormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule,
    CommonModule
  ],
  templateUrl: './search-atleta.component.html',

})
export class SearchAtletaComponent implements OnInit {
  // Control del formulario

  // Lista completa de atletas
  atletas: Atleta[] = [];

  // Observable que contendrá los atletas filtrados según el texto ingresado
  filteredAtletas$!: Observable<Atleta[]>;
  @Input() nombreAtletaControl!: FormControl;

  constructor(private fb: FormBuilder, private rankingService: RankingService) { }

  ngOnInit() {

    // Definir el observable aquí
    this.filteredAtletas$ = this.nombreAtletaControl.valueChanges.pipe(
      startWith(''),
      map((value: string) => this._filter(value || '')) // Conversión de tipo a string
    );

    // Obtener los atletas desde el servicio cuando el componente se inicializa
    this.rankingService.getAtletas().subscribe((atletas: Atleta[]) => {
      this.atletas = atletas;
    });
  }

  private _filter(value: string): Atleta[] {
    const filterValue = value.toLowerCase();
    return this.atletas.filter(atleta => atleta.nombre.toLowerCase().includes(filterValue));
  }


  @Output() atletaSeleccionado = new EventEmitter<Atleta>();

  // Función que se ejecuta cuando se selecciona una opción del autocompletado
  onOptionSelected(atletaNombre: string) {
    const atleta = this.atletas.find(atleta => atleta.nombre === atletaNombre);
    if (atleta) {
      this.seleccionarAtleta(atleta);
    }
  }

  // Función que emite el atleta seleccionado
  seleccionarAtleta(atleta: Atleta) {
    this.atletaSeleccionado.emit(atleta);
  }



}

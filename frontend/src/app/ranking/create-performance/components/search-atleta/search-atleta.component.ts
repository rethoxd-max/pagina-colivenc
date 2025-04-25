import { Component, OnInit, Input, Output, EventEmitter } from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatInputModule } from '@angular/material/input';
import { MatFormFieldModule } from '@angular/material/form-field';
import { CommonModule } from '@angular/common';
import { Observable, debounceTime, distinctUntilChanged, map, startWith } from 'rxjs';
import { PerfilAtletaService, Atleta } from '../../../services/perfil-atleta.service';

@Component({
  selector: 'app-search-atleta',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatAutocompleteModule,
    MatInputModule,
    MatFormFieldModule
  ],
  templateUrl: './search-atleta.component.html',
  styleUrls: ['./search-atleta.component.css']
})
export class SearchAtletaComponent implements OnInit {
  @Input() nombreAtletaControl!: FormControl;
  @Output() atletaSeleccionado = new EventEmitter<Atleta>();
  filteredAtletas$: Observable<Atleta[]> = new Observable<Atleta[]>();
  todosLosAtletas: Atleta[] = [];

  constructor(private perfilAtletaService: PerfilAtletaService) {}

  ngOnInit() {
    // Inicializar el control si no está definido
    if (!this.nombreAtletaControl) {
      this.nombreAtletaControl = new FormControl('');
    }

    // Cargar todos los atletas al iniciar
    this.perfilAtletaService.getAtletas().subscribe(atletas => {
      this.todosLosAtletas = atletas;
    });

    // Configurar el filtrado reactivo
    this.filteredAtletas$ = this.nombreAtletaControl.valueChanges.pipe(
      startWith(''),
      debounceTime(300),
      distinctUntilChanged(),
      map(value => {
        const searchTerm = typeof value === 'string' ? value : '';
        return this._filterAtletas(searchTerm);
      })
    );
  }

  private _filterAtletas(value: string): Atleta[] {
    const filterValue = value.toLowerCase();
    return this.todosLosAtletas.filter(atleta => 
      atleta.nombre.toLowerCase().includes(filterValue)
    );
  }

  onOptionSelected(atleta: Atleta) {
    this.atletaSeleccionado.emit(atleta);
  }

  displayFn(atleta: Atleta): string {
    return atleta ? atleta.nombre : '';
  }
}

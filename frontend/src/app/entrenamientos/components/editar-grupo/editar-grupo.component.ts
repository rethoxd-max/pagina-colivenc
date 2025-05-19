import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { EntrenamientosService, GrupoEntrenamiento } from '../../services/entrenamientos.service';
import { PerfilAtletaService, Atleta } from '../../../ranking/services/perfil-atleta.service';
import { ActivatedRoute, Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-editar-grupo',
  standalone: true,
  imports: [CommonModule, FormsModule, MatIconModule],
  templateUrl: './editar-grupo.component.html',
  styleUrls: ['./editar-grupo.component.css']
})
export class EditarGrupoComponent implements OnInit {
  grupoId: string = '';
  nombreGrupo: string = '';
  atletas: Atleta[] = [];
  atletasDisponibles: Atleta[] = [];
  searchTerm: string = '';

  constructor(
    private entrenamientosService: EntrenamientosService,
    private perfilAtletaService: PerfilAtletaService,
    private route: ActivatedRoute,
    private router: Router
  ) { }

  ngOnInit() {
    this.grupoId = this.route.snapshot.paramMap.get('id') || '';
    this.cargarGrupo();
  }

  cargarGrupo() {
    this.entrenamientosService.getGrupoEntrenamiento(this.grupoId).subscribe({
      next: (grupo: GrupoEntrenamiento) => {
        this.nombreGrupo = grupo.nombre_grupo;
        this.atletas = grupo.atletas as Atleta[];
        this.cargarAtletasDisponibles();
      },
      error: (error: any) => console.error('Error al cargar el grupo:', error)
    });
  }

  cargarAtletasDisponibles() {
    this.perfilAtletaService.getAtletas().subscribe({
      next: (atletas: Atleta[]) => {
        this.atletasDisponibles = atletas.filter(atleta => 
          !this.atletas.some(a => a._id === atleta._id)
        );
      },
      error: (error: any) => console.error('Error al cargar atletas:', error)
    });
  }

  buscarAtletas() {
    if (this.searchTerm.trim()) {
      this.perfilAtletaService.getAtletas().subscribe({
        next: (atletas: Atleta[]) => {
          this.atletasDisponibles = atletas
            .filter(atleta => atleta.nombre.toLowerCase().includes(this.searchTerm.toLowerCase()))
            .filter(atleta => !this.atletas.some(a => a._id === atleta._id));
        },
        error: (error: any) => console.error('Error al buscar atletas:', error)
      });
    } else {
      this.cargarAtletasDisponibles();
    }
  }

  agregarAtleta(atleta: Atleta) {
    if (this.atletas.some(a => a._id === atleta._id)) {
      console.log('El atleta ya está en el grupo');
      return;
    }

    this.entrenamientosService.agregarAtletaAlGrupo(this.grupoId, atleta._id).subscribe({
      next: (grupoActualizado: GrupoEntrenamiento) => {
        this.atletas = grupoActualizado.atletas.map(a => ({
          ...a,
          genero: 'Masculino'
        })) as Atleta[];
        this.atletasDisponibles = this.atletasDisponibles.filter(a => a._id !== atleta._id);
      },
      error: (error: any) => console.error('Error al agregar atleta:', error)
    });
  }

  eliminarAtleta(atletaId: string) {
    this.entrenamientosService.eliminarAtletaDelGrupo(this.grupoId, atletaId).subscribe({
      next: (grupoActualizado: GrupoEntrenamiento) => {
        this.atletas = grupoActualizado.atletas.map(a => ({
          ...a,
          genero: 'Masculino'
        })) as Atleta[];
        this.cargarAtletasDisponibles();
      },
      error: (error: any) => console.error('Error al eliminar atleta:', error)
    });
  }

  guardarCambios() {
    this.entrenamientosService.actualizarGrupo(this.grupoId, { nombre_grupo: this.nombreGrupo }).subscribe({
      next: () => this.router.navigate(['/entrenamientos']),
      error: (error: any) => console.error('Error al actualizar el grupo:', error)
    });
  }
} 
import { Component, OnInit } from '@angular/core';
import { AuthService, Usuario } from '../../../auth/services/auth.service';
import { ActivatedRoute, Router } from '@angular/router';
import { CompeticionService, PruebaCompeticion } from '../../services/competicion.service';
import { FormArray, FormBuilder, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-inscripcion',
  standalone: true,
  templateUrl: './inscripcion.component.html',
  styleUrls: ['./inscripcion.component.css'],
  imports: [ReactiveFormsModule, CommonModule]
})
export class InscripcionComponent implements OnInit {
  inscripcionForm: FormGroup;
  competicionId!: string;
  pruebas: any[] = [];
  usuario!: Usuario;
  nombre_atleta: string = '';
  inscripcionesEntrenador: any[] = [];
  inscripcionId?: string;  // ID de la inscripción en caso de que estemos editando

  constructor(
    private authService: AuthService,
    private route: ActivatedRoute,
    private competicionService: CompeticionService,
    private fb: FormBuilder,
    private router: Router
  ) {
    this.inscripcionForm = this.fb.group({
      nombre: [{ value: '', disabled: !(this.isAdmin() || this.isEntrenador()) }], // Se habilita solo si es Admin o Entrenador
      competicionId: [''],
      pruebas: this.fb.array([])
    });


  }

  ngOnInit(): void {
    // Obtener el usuario autenticado
    this.usuario = this.authService.getUser();
    if (!this.usuario) {
      console.error('No se pudo obtener el usuario.');
      return;
    }

    // Obtener el competicionId desde la URL (route snapshot)
    if (this.route.snapshot.params['id']) {
      this.competicionId = this.route.snapshot.params['id'];
    } else {
      // Si no hay competicionId en la ruta, buscarlo en el formulario (por ejemplo, para cuando se está creando una nueva inscripción)
      this.competicionId = this.inscripcionForm?.get('competicion')?.value;
    }

    // Inicializar el formulario (esto debería ir antes de cargar datos para evitar problemas con controles no inicializados)
    this.inscripcionForm = this.fb.group({
      nombre: [{ value: '', disabled: !(this.isAdmin() || this.isEntrenador()) }], // Campo nombre habilitado solo si es admin o entrenador
      competicionId: [this.competicionId], // Asignar el competicionId al formulario
      pruebas: this.fb.array([]) // Arreglo vacío de pruebas
    });


    // Verificar si estamos en modo edición, es decir, si hay inscripcionId en los parámetros de la URL
    this.inscripcionId = this.route.snapshot.params['inscripcionId'];
    if (this.inscripcionId) {
      // Modo edición: cargar datos de la inscripción existente
      this.cargarInscripcion(this.inscripcionId);
    } else {
      // Modo creación: asignar el nombre del usuario autenticado al formulario
      this.nombre_atleta = this.usuario.name;
      this.inscripcionForm.patchValue({
        nombre: this.nombre_atleta
      });
    }

    // Cargar las pruebas basadas en el competicionId
    this.cargarPruebas();
    
  }


  cargarPruebas() {
    this.competicionService.getPruebasByCompeticionId(this.competicionId).subscribe(
      (pruebas) => {
        this.pruebas = pruebas;
        const pruebasFormArray = this.inscripcionForm.get('pruebas') as FormArray;
        pruebasFormArray.clear();

        // Agregamos un control por cada prueba
        this.pruebas.forEach(() => {
          pruebasFormArray.push(this.fb.control(false));
        });
      },
      (error) => {
        console.error('Error al obtener las pruebas:', error);
      }
    );
  }

  cargarInscripcion(inscripcionId: string) {
    this.competicionService.getInscripcionById(inscripcionId).subscribe(
      (inscripcion) => {
        // Asignar el nombre del atleta y el ID de la competición al formulario
        this.inscripcionForm.patchValue({
          nombre: inscripcion.nombre_atleta, // Nombre del atleta en modo edición
          competicionId: inscripcion.competicion._id, // Competición de la inscripción
        });

        // Cargar las pruebas correspondientes a la competición

        // Luego de cargar las pruebas, marcar las seleccionadas
        this.competicionService.getPruebasByCompeticionId(inscripcion.competicion._id).subscribe(
          (pruebas) => {
            this.pruebas = pruebas;
            const pruebasFormArray = this.inscripcionForm.get('pruebas') as FormArray;

            pruebasFormArray.clear();

            // Mapear las pruebas seleccionadas en el formulario
            this.pruebas.forEach((prueba) => {
              const seleccionada = inscripcion.pruebasSeleccionadas.includes(prueba._id);
              pruebasFormArray.push(this.fb.control(seleccionada));
            });
          }
        );
      },
      (error: any) => {
        console.error('Error al cargar la inscripción:', error);
      }
    );
  }

  onNombreChange(): void {
    this.inscripcionForm.get('nombre')?.valueChanges.subscribe((nuevoValor: string) => {
      this.nombre_atleta = nuevoValor;
    });
  }

  habilitarCampo(): void {
    this.inscripcionForm.get('nombre')?.enable();
  }

  deshabilitarCampo(): void {
    this.inscripcionForm.get('nombre')?.disable();
  }

  isEntrenador(): boolean {
    const user = this.authService.getUser();
    return this.authService.isAuthenticated() && user && user.userTypes.includes('Entrenador');
  }

  isAtleta(): boolean {
    return this.authService.isAuthenticated() && this.usuario && this.usuario.userTypes.includes('Atleta');
  }

  isAdmin(): boolean {
    return this.authService.isAuthenticated() && this.usuario && this.usuario.userTypes.includes('Admin');
  }

  // Manejar envío del formulario
  onSubmit() {
    if (!this.usuario || !this.usuario.id) {
      console.error('El usuario no está disponible o no tiene _id.');
      return;
    }

    const seleccionadas = this.inscripcionForm.value.pruebas;
    const atleta = this.inscripcionForm.getRawValue().nombre;
    const competicionId = this.inscripcionForm.value.competicionId;
    const pruebasSeleccionadasIds = this.pruebas
      .filter((_, index) => seleccionadas[index])
      .map(prueba => prueba._id);

    const userId = this.usuario.id;

    if (this.inscripcionId) {
      // Editar inscripción existente
      this.competicionService.updateInscripcion(this.inscripcionId, atleta, competicionId, pruebasSeleccionadasIds, userId)
        .subscribe(
          (response) => {
            this.router.navigate(['/competiciones']);
          },
          (error) => {
            console.error('Error al actualizar la inscripción:', error);
          }
        );
    } else {
      // Crear nueva inscripción
      this.competicionService.createInscripcion(atleta, competicionId, pruebasSeleccionadasIds, userId)
        .subscribe(
          (response) => {
            this.router.navigate(['/competiciones']);
          },
          (error) => {
            console.error('Error al realizar la inscripción:', error);
          }
        );
    }
  }
}

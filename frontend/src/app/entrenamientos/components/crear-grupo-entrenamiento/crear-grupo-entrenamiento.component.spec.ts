import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CrearGrupoEntrenamientoComponent } from './crear-grupo-entrenamiento.component';

describe('CrearGrupoEntrenamientoComponent', () => {
  let component: CrearGrupoEntrenamientoComponent;
  let fixture: ComponentFixture<CrearGrupoEntrenamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CrearGrupoEntrenamientoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CrearGrupoEntrenamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

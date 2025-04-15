import { ComponentFixture, TestBed } from '@angular/core/testing';

import { PerfilAtletaComponent } from './perfil-atleta.component';

describe('PerfilAtletaComponent', () => {
  let component: PerfilAtletaComponent;
  let fixture: ComponentFixture<PerfilAtletaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [PerfilAtletaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(PerfilAtletaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

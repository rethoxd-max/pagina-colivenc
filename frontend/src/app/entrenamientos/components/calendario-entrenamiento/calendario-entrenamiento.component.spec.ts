import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CalendarioEntrenamientoComponent } from './calendario-entrenamiento.component';

describe('CalendarioEntrenamientoComponent', () => {
  let component: CalendarioEntrenamientoComponent;
  let fixture: ComponentFixture<CalendarioEntrenamientoComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CalendarioEntrenamientoComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CalendarioEntrenamientoComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

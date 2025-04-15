import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePruebaComponent } from './create-prueba.component';

describe('CreatePruebaComponent', () => {
  let component: CreatePruebaComponent;
  let fixture: ComponentFixture<CreatePruebaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePruebaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePruebaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

import { ComponentFixture, TestBed } from '@angular/core/testing';

import { BuscadorAtletasComponent } from './buscador-atletas.component';

describe('BuscadorAtletasComponent', () => {
  let component: BuscadorAtletasComponent;
  let fixture: ComponentFixture<BuscadorAtletasComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [BuscadorAtletasComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(BuscadorAtletasComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

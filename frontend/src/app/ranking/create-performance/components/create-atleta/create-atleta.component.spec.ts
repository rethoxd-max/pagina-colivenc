import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreateAtletaComponent } from './create-atleta.component';

describe('CreateAtletaComponent', () => {
  let component: CreateAtletaComponent;
  let fixture: ComponentFixture<CreateAtletaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreateAtletaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreateAtletaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

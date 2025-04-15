import { ComponentFixture, TestBed } from '@angular/core/testing';

import { DecathlonModalComponent } from './decathlon-modal.component';

describe('DecathlonModalComponent', () => {
  let component: DecathlonModalComponent;
  let fixture: ComponentFixture<DecathlonModalComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [DecathlonModalComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(DecathlonModalComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

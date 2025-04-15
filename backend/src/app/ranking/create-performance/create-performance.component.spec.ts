import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CreatePerformanceComponent } from './create-performance.component';

describe('CreatePerformanceComponent', () => {
  let component: CreatePerformanceComponent;
  let fixture: ComponentFixture<CreatePerformanceComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CreatePerformanceComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CreatePerformanceComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

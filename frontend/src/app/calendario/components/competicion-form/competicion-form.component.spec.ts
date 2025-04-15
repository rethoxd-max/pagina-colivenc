import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompeticionFormComponent } from './competicion-form.component';

describe('CompeticionFormComponent', () => {
  let component: CompeticionFormComponent;
  let fixture: ComponentFixture<CompeticionFormComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompeticionFormComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompeticionFormComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

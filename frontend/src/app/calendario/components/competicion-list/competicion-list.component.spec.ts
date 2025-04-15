import { ComponentFixture, TestBed } from '@angular/core/testing';

import { CompeticionListComponent } from './competicion-list.component';

describe('CompeticionListComponent', () => {
  let component: CompeticionListComponent;
  let fixture: ComponentFixture<CompeticionListComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [CompeticionListComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(CompeticionListComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

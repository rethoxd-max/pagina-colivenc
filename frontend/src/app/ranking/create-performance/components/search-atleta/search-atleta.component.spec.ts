import { ComponentFixture, TestBed } from '@angular/core/testing';

import { SearchAtletaComponent } from './search-atleta.component';

describe('SearchAtletaComponent', () => {
  let component: SearchAtletaComponent;
  let fixture: ComponentFixture<SearchAtletaComponent>;

  beforeEach(async () => {
    await TestBed.configureTestingModule({
      imports: [SearchAtletaComponent]
    })
    .compileComponents();

    fixture = TestBed.createComponent(SearchAtletaComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  it('should create', () => {
    expect(component).toBeTruthy();
  });
});

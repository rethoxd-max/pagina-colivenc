import { TestBed } from '@angular/core/testing';

import { CompeticionService } from './competicion.service';

describe('CompeticionService', () => {
  let service: CompeticionService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(CompeticionService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

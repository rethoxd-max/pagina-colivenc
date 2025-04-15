import { TestBed } from '@angular/core/testing';
import { CanActivateFn } from '@angular/router';

import { atletaGuard } from './atleta.guard';

describe('atletaGuard', () => {
  const executeGuard: CanActivateFn = (...guardParameters) => 
      TestBed.runInInjectionContext(() => atletaGuard(...guardParameters));

  beforeEach(() => {
    TestBed.configureTestingModule({});
  });

  it('should be created', () => {
    expect(executeGuard).toBeTruthy();
  });
});

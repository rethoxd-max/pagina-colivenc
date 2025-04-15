import { TestBed } from '@angular/core/testing';

import { PerfilAtletaService } from './perfil-atleta.service';

describe('PerfilAtletaService', () => {
  let service: PerfilAtletaService;

  beforeEach(() => {
    TestBed.configureTestingModule({});
    service = TestBed.inject(PerfilAtletaService);
  });

  it('should be created', () => {
    expect(service).toBeTruthy();
  });
});

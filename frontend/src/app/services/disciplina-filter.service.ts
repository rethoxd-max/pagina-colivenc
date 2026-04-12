import { Injectable } from '@angular/core';
import { BehaviorSubject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class DisciplinaFilterService {
  private _disciplinaSeleccionada = new BehaviorSubject<string | null>(null);

  /** Observable al que se suscriben los componentes */
  disciplina$ = this._disciplinaSeleccionada.asObservable();

  /** ID de la disciplina activa (null = todas) */
  get disciplinaActual(): string | null {
    return this._disciplinaSeleccionada.getValue();
  }

  setDisciplina(id: string | null): void {
    this._disciplinaSeleccionada.next(id);
  }

  limpiar(): void {
    this._disciplinaSeleccionada.next(null);
  }
}

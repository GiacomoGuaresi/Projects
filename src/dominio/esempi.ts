// Attività d'esempio per i test.

import type { Attivita } from './tipi'

let prossimoId = 1

export function attivita(campi: Partial<Attivita> = {}): Attivita {
  return {
    id: prossimoId++,
    titolo: 'Attività',
    descrizione: null,
    progetto: null,
    stato: 'da_fare',
    priorita: 3,
    avanzamento: 0,
    creata_il: '2026-09-01T00:00:00Z',
    modificata_il: '2026-09-01T00:00:00Z',
    completata_il: null,
    ha_diario: false,
    ...campi,
  }
}

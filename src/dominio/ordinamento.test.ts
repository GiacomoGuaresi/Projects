import { describe, expect, it } from 'vitest'
import { attivita } from './esempi'
import { ordinaAttivita, sezioniDashboard } from './ordinamento'

const titoli = (elenco: { titolo: string }[]) => elenco.map((a) => a.titolo)

describe('ordinaAttivita', () => {
  it('ordina per progetto A→Z, senza progetto in fondo', () => {
    const elenco = [
      attivita({ titolo: 'senza', progetto: null }),
      attivita({ titolo: 'casa', progetto: 'casa' }),
      attivita({ titolo: 'auto', progetto: 'Auto' }),
    ]
    expect(titoli(ordinaAttivita(elenco))).toEqual(['auto', 'casa', 'senza'])
  })

  it('nello stesso progetto: priorità decrescente, poi titolo senza tag', () => {
    const elenco = [
      attivita({ titolo: 'Zoccolino', priorita: 3, progetto: 'Casa' }),
      attivita({ titolo: '<urgente> Vetri', priorita: 3, progetto: 'Casa' }),
      attivita({ titolo: 'Caldaia', priorita: 5, progetto: 'Casa' }),
    ]
    expect(titoli(ordinaAttivita(elenco))).toEqual(['Caldaia', '<urgente> Vetri', 'Zoccolino'])
  })

  it('mette le completate in fondo, dalla più recente', () => {
    const elenco = [
      attivita({ titolo: 'vecchia', stato: 'completo', completata_il: '2026-01-01T00:00:00Z', progetto: 'A' }),
      attivita({ titolo: 'aperta', progetto: 'Z' }),
      attivita({ titolo: 'recente', stato: 'completo', completata_il: '2026-09-01T00:00:00Z', progetto: 'B' }),
    ]
    expect(titoli(ordinaAttivita(elenco))).toEqual(['aperta', 'recente', 'vecchia'])
  })

  it("non cambia l'elenco ricevuto", () => {
    const elenco = [attivita({ titolo: 'b' }), attivita({ titolo: 'a' })]
    ordinaAttivita(elenco)
    expect(titoli(elenco)).toEqual(['b', 'a'])
  })
})

describe('sezioniDashboard', () => {
  it('divide per stato, senza le completate, con solo "In corso" aperta', () => {
    const elenco = [
      attivita({ titolo: 'fatta', stato: 'completo' }),
      attivita({ titolo: 'b', stato: 'in_corso', priorita: 1 }),
      attivita({ titolo: 'a', stato: 'in_corso', priorita: 4 }),
      attivita({ titolo: 'ferma', stato: 'bloccato' }),
    ]
    expect(
      sezioniDashboard(elenco).map((s) => ({ titolo: s.titolo, aperta: s.apertaDiDefault, voci: titoli(s.attivita) })),
    ).toEqual([
      { titolo: 'In corso', aperta: true, voci: ['a', 'b'] },
      { titolo: 'Da fare', aperta: false, voci: [] },
      { titolo: 'Bloccate', aperta: false, voci: ['ferma'] },
    ])
  })
})

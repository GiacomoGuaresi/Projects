import { describe, expect, it } from 'vitest'
import { attivita } from './esempi'
import { ordinaAttivita, schedeProgetti, sezioniPerStato } from './ordinamento'

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

describe('sezioniPerStato', () => {
  it('divide per stato, senza le completate, con solo "In corso" aperta', () => {
    const elenco = [
      attivita({ titolo: 'fatta', stato: 'completo' }),
      attivita({ titolo: 'b', stato: 'in_corso', priorita: 1 }),
      attivita({ titolo: 'a', stato: 'in_corso', priorita: 4 }),
      attivita({ titolo: 'ferma', stato: 'bloccato' }),
    ]
    expect(
      sezioniPerStato(elenco).map((s) => ({ titolo: s.titolo, aperta: s.apertaDiDefault, voci: titoli(s.attivita) })),
    ).toEqual([
      { titolo: 'In corso', aperta: true, voci: ['a', 'b'] },
      { titolo: 'Da fare', aperta: false, voci: [] },
      { titolo: 'Bloccate', aperta: false, voci: ['ferma'] },
    ])
  })
})

describe('schedeProgetti', () => {
  it('preferiti in cima e accantonati in fondo, ogni gruppo A→Z', () => {
    const elenco = [
      attivita({ progetto: null }),
      attivita({ progetto: 'Zeta' }),
      attivita({ progetto: 'Casa' }),
      attivita({ progetto: 'Auto' }),
      attivita({ progetto: 'Bici' }),
      attivita({ progetto: 'Orto' }),
      attivita({ progetto: 'Barca' }),
    ]
    const rilievi = { zeta: 'preferito', casa: 'preferito', auto: 'accantonato', barca: 'accantonato' } as const
    expect(schedeProgetti(elenco, rilievi).map((s) => [s.progetto, s.rilievo])).toEqual([
      ['Casa', 'preferito'],
      ['Zeta', 'preferito'],
      ['Bici', 'normale'],
      ['Orto', 'normale'],
      [null, 'normale'],
      ['Auto', 'accantonato'],
      ['Barca', 'accantonato'],
    ])
  })

  it('una card per progetto A→Z, senza distinguere maiuscole, "senza progetto" in fondo, completate comprese', () => {
    const elenco = [
      attivita({ titolo: 'senza', progetto: null }),
      attivita({ titolo: 'c1', progetto: 'Casa' }),
      attivita({ titolo: 'a1', progetto: 'Auto' }),
      attivita({ titolo: 'c2', progetto: 'casa' }),
      attivita({ titolo: 'fatta', progetto: 'Giardino', stato: 'completo' }),
      attivita({ titolo: 'c3', progetto: 'CASA', stato: 'completo' }),
    ]
    expect(
      schedeProgetti(elenco).map((s) => ({ progetto: s.progetto, voci: titoli(s.attivita), completate: s.completate })),
    ).toEqual([
      { progetto: 'Auto', voci: ['a1'], completate: 0 },
      { progetto: 'Casa', voci: ['c1', 'c2', 'c3'], completate: 1 },
      { progetto: 'Giardino', voci: ['fatta'], completate: 1 },
      { progetto: null, voci: ['senza'], completate: 0 },
    ])
  })

  it('nella card: in corso, da fare, bloccate, poi priorità; completate in fondo dalla più recente', () => {
    const elenco = [
      attivita({ titolo: 'vecchia', stato: 'completo', priorita: 5, completata_il: '2026-01-01T00:00:00Z' }),
      attivita({ titolo: 'ferma', stato: 'bloccato', priorita: 5 }),
      attivita({ titolo: 'da fare bassa', priorita: 1 }),
      attivita({ titolo: 'recente', stato: 'completo', priorita: 1, completata_il: '2026-09-01T00:00:00Z' }),
      attivita({ titolo: 'in corso', stato: 'in_corso', priorita: 1 }),
      attivita({ titolo: 'da fare alta', priorita: 4 }),
    ]
    expect(titoli(schedeProgetti(elenco)[0].attivita)).toEqual([
      'in corso',
      'da fare alta',
      'da fare bassa',
      'ferma',
      'recente',
      'vecchia',
    ])
  })
})

import { describe, expect, it } from 'vitest'
import { attivita } from './esempi'
import { schedeProgetti } from './ordinamento'

const titoli = (elenco: { titolo: string }[]) => elenco.map((a) => a.titolo)

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

  it('nella card: in corso, da fare, bloccate, poi titolo; completate in fondo dalla più recente', () => {
    const elenco = [
      attivita({ titolo: 'vecchia', stato: 'completo', completata_il: '2026-01-01T00:00:00Z' }),
      attivita({ titolo: 'ferma', stato: 'bloccato' }),
      attivita({ titolo: 'da fare b' }),
      attivita({ titolo: 'recente', stato: 'completo', completata_il: '2026-09-01T00:00:00Z' }),
      attivita({ titolo: 'in corso', stato: 'in_corso' }),
      attivita({ titolo: 'da fare a' }),
    ]
    expect(titoli(schedeProgetti(elenco)[0].attivita)).toEqual([
      'in corso',
      'da fare a',
      'da fare b',
      'ferma',
      'recente',
      'vecchia',
    ])
  })

  it('nello stesso stato prima la scadenza più vicina, poi le altre per titolo', () => {
    const elenco = [
      attivita({ titolo: 'senza', progetto: 'Casa' }),
      attivita({ titolo: '<scadenza 20/11/26> tardi', progetto: 'Casa' }),
      attivita({ titolo: '<SCADENZA 1/11/2026> presto', progetto: 'Casa' }),
      attivita({ titolo: '<attesa 1/10/26> attesa', progetto: 'Casa' }),
    ]
    expect(titoli(schedeProgetti(elenco)[0].attivita)).toEqual([
      '<SCADENZA 1/11/2026> presto',
      '<scadenza 20/11/26> tardi',
      '<attesa 1/10/26> attesa',
      'senza',
    ])
  })
})

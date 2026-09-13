import { describe, expect, it } from 'vitest'
import { attivita } from './esempi'
import { conStato, filtraAttivita, filtriAttivi, FILTRI_VUOTI, type Filtri } from './filtri'

const elenco = [
  attivita({ titolo: "<urgente> Chiamare l'idraulico", progetto: 'Bagno', priorita: 5, stato: 'in_corso' }),
  attivita({ titolo: 'Piastrelle', progetto: 'bagno', priorita: 3 }),
  attivita({ titolo: 'Tagliando', progetto: 'Auto', priorita: 3, stato: 'bloccato' }),
  attivita({ titolo: 'Lampadina', progetto: null, priorita: 1, stato: 'completo', completata_il: '2026-09-01T00:00:00Z' }),
]

const titoli = (filtri: Partial<Filtri>) =>
  filtraAttivita(elenco, { ...FILTRI_VUOTI, ...filtri }).map((a) => a.titolo)

describe('filtraAttivita', () => {
  it('di default nasconde le completate', () => {
    expect(titoli({})).toEqual(['Tagliando', "<urgente> Chiamare l'idraulico", 'Piastrelle'])
  })

  it('"Mostra completate" le aggiunge in fondo', () => {
    expect(titoli({ mostraCompletate: true }).at(-1)).toBe('Lampadina')
  })

  it('il filtro di stato "Completo" mostra le completate anche con l\'interruttore spento', () => {
    expect(titoli({ stato: 'completo' })).toEqual(['Lampadina'])
  })

  it('cerca il testo nel titolo e nel progetto, senza maiuscole', () => {
    expect(titoli({ testo: 'IDRAUL' })).toEqual(["<urgente> Chiamare l'idraulico"])
    expect(titoli({ testo: 'auto' })).toEqual(['Tagliando'])
    expect(titoli({ testo: 'urgente' })).toEqual(["<urgente> Chiamare l'idraulico"])
  })

  it('filtra per progetto esatto, senza distinguere le grafie', () => {
    expect(titoli({ progetto: ' BAGNO ' })).toEqual(["<urgente> Chiamare l'idraulico", 'Piastrelle'])
    expect(titoli({ progetto: 'Bag' })).toEqual([])
  })

  it('filtra per stato e per priorità', () => {
    expect(titoli({ stato: 'bloccato' })).toEqual(['Tagliando'])
    expect(titoli({ priorita: 3 })).toEqual(['Tagliando', 'Piastrelle'])
  })
})

describe('conStato', () => {
  it('"Completo" accende "Mostra completate"', () => {
    expect(conStato(FILTRI_VUOTI, 'completo')).toMatchObject({ stato: 'completo', mostraCompletate: true })
  })

  it('gli altri stati lasciano l\'interruttore com\'è', () => {
    expect(conStato(FILTRI_VUOTI, 'da_fare').mostraCompletate).toBe(false)
    expect(conStato({ ...FILTRI_VUOTI, mostraCompletate: true }, null).mostraCompletate).toBe(true)
  })
})

describe('filtriAttivi', () => {
  it('è falso solo senza filtri', () => {
    expect(filtriAttivi(FILTRI_VUOTI)).toBe(false)
    expect(filtriAttivi({ ...FILTRI_VUOTI, testo: '  ' })).toBe(false)
    expect(filtriAttivi({ ...FILTRI_VUOTI, priorita: 2 })).toBe(true)
    expect(filtriAttivi({ ...FILTRI_VUOTI, mostraCompletate: true })).toBe(true)
  })
})

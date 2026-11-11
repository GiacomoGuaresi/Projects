import { describe, expect, it } from 'vitest'
import { boschetti, disponi } from './foresta'
import { festa, pasqua, postiDecori } from './feste'
import type { Attivita } from './tipi'

const giorno = (anno: number, mese: number, dì: number) => Date.UTC(anno, mese - 1, dì) / 86_400_000

describe('pasqua', () => {
  it('cade nei giorni giusti', () => {
    expect(pasqua(2025)).toBe(giorno(2025, 4, 20))
    expect(pasqua(2026)).toBe(giorno(2026, 4, 5))
    expect(pasqua(2027)).toBe(giorno(2027, 3, 28))
    expect(pasqua(2028)).toBe(giorno(2028, 4, 16))
    expect(pasqua(2029)).toBe(giorno(2029, 4, 1))
    expect(pasqua(2030)).toBe(giorno(2030, 4, 21))
  })
})

describe('festa', () => {
  const il = (anno: number, mese: number, dì: number, ora = 12) => festa(new Date(anno, mese - 1, dì, ora))

  it('Natale dall\'Immacolata all\'Epifania', () => {
    expect(il(2026, 12, 7)).toBeNull()
    expect(il(2026, 12, 8)).toBe('natale')
    expect(il(2026, 12, 25)).toBe('natale')
    expect(il(2027, 1, 3)).toBe('natale')
    expect(il(2027, 1, 7)).toBeNull()
  })

  it('Capodanno ed Epifania vincono su Natale', () => {
    expect(il(2026, 12, 30)).toBe('natale')
    expect(il(2026, 12, 31)).toBe('capodanno')
    expect(il(2027, 1, 1, 0)).toBe('capodanno')
    expect(il(2027, 1, 2)).toBe('natale')
    expect(il(2027, 1, 6)).toBe('epifania')
  })

  it('il Carnevale ambrosiano finisce il sabato dopo le Ceneri, e San Valentino vince', () => {
    // Pasqua 2026: 5 aprile. Ceneri il 18 febbraio, sabato grasso ambrosiano il 21.
    expect(il(2026, 2, 11)).toBeNull()
    expect(il(2026, 2, 12)).toBe('carnevale')
    expect(il(2026, 2, 14)).toBe('san_valentino')
    expect(il(2026, 2, 21)).toBe('carnevale')
    expect(il(2026, 2, 22)).toBeNull()
    // Nel 2027 (Pasqua il 28 marzo) San Valentino è prima del Carnevale.
    expect(il(2027, 2, 14)).toBe('san_valentino')
    expect(il(2027, 2, 13)).toBe('carnevale')
  })

  it('Pasqua dalle Palme a Pasquetta', () => {
    expect(il(2026, 3, 28)).toBeNull()
    expect(il(2026, 3, 29)).toBe('pasqua')
    expect(il(2026, 4, 5)).toBe('pasqua')
    expect(il(2026, 4, 6)).toBe('pasqua')
    expect(il(2026, 4, 7)).toBeNull()
  })

  it('Halloween l\'ultima settimana di ottobre', () => {
    expect(il(2026, 10, 23)).toBeNull()
    expect(il(2026, 10, 24)).toBe('halloween')
    expect(il(2026, 10, 31, 23)).toBe('halloween')
    expect(il(2026, 11, 1)).toBeNull()
  })

  it('i giorni normali non hanno festa', () => {
    expect(il(2026, 6, 15)).toBeNull()
    expect(il(2026, 9, 1)).toBeNull()
  })
})

describe('postiDecori', () => {
  const attivita = (n: number): Attivita[] =>
    Array.from({ length: n }, (_, i) => ({
      id: i + 1,
      titolo: 'x',
      progetto: i % 2 ? 'Casa' : 'Auto',
      stato: 'completo',
      avanzamento: 100,
      creata_il: '2026-01-01T00:00:00Z',
      modificata_il: '2026-01-01T00:00:00Z',
      completata_il: null,
      eliminata_il: null,
      ha_diario: false,
    }))

  it('una ogni otto alberi, da 3 a 24, sempre negli stessi posti liberi vicino alla foresta', () => {
    const foresta = disponi(boschetti(attivita(40)), 10)
    const posti = postiDecori(foresta, 7)
    expect(posti).toHaveLength(5)
    expect(postiDecori(foresta, 7)).toEqual(posti)
    const prese = new Set(foresta.elementi.map((e) => `${e.col},${e.riga}`))
    const tipi = new Map(foresta.caselle.map((c) => [`${c.col},${c.riga}`, c.tipo]))
    for (const p of posti) {
      expect(prese.has(`${p.col},${p.riga}`)).toBe(false)
      expect(tipi.get(`${p.col},${p.riga}`)).toBe('prato')
    }
    expect(postiDecori(disponi(boschetti(attivita(4)), 0), 7)).toHaveLength(3)
  })

  it('senza alberi niente decorazioni', () => {
    expect(postiDecori(disponi([], 5), 7)).toEqual([])
  })
})

import { describe, expect, it } from 'vitest'
import { albaTramonto, CASA, daCodiceMeteo, faseLunare, forzaVento, luce, nomeFaseLunare, stagione } from './ambiente'

describe('stagione', () => {
  it('cambia ai giorni astronomici', () => {
    expect(stagione(new Date(2026, 2, 20))).toBe('inverno')
    expect(stagione(new Date(2026, 2, 21))).toBe('primavera')
    expect(stagione(new Date(2026, 5, 21))).toBe('estate')
    expect(stagione(new Date(2026, 8, 22))).toBe('estate')
    expect(stagione(new Date(2026, 8, 23))).toBe('autunno')
    expect(stagione(new Date(2026, 11, 21))).toBe('inverno')
    expect(stagione(new Date(2027, 0, 15))).toBe('inverno')
  })
})

describe('luce', () => {
  const alba = new Date('2026-10-02T05:20:00Z')
  const tramonto = new Date('2026-10-02T17:05:00Z')
  const alle = (ora: string) => luce(new Date(`2026-10-02T${ora}:00Z`), alba, tramonto)

  it('di notte è buio, di giorno no', () => {
    expect(alle('02:00')).toEqual({ fase: 'notte', buio: 1, tinta: 0 })
    expect(alle('12:00')).toEqual({ fase: 'giorno', buio: 0, tinta: 0 })
    expect(alle('22:00').fase).toBe('notte')
  })

  it("all'ora dell'alba e del tramonto è a metà, con il cielo più caldo", () => {
    expect(alle('05:20')).toMatchObject({ fase: 'alba', buio: 0.5, tinta: 1 })
    expect(alle('17:05')).toMatchObject({ fase: 'tramonto', buio: 0.5, tinta: 1 })
  })

  it("schiarisce durante l'alba e scurisce durante il tramonto", () => {
    expect(alle('05:05').buio).toBeGreaterThan(alle('05:35').buio)
    expect(alle('16:50').buio).toBeLessThan(alle('17:20').buio)
  })
})

describe('albaTramonto', () => {
  const minuti = (d: Date) => d.getUTCHours() * 60 + d.getUTCMinutes()

  it('a Milano il 21 giugno: alba verso le 3:35 UTC, tramonto verso le 19:15 UTC', () => {
    const { alba, tramonto } = albaTramonto(new Date(2026, 5, 21, 12), CASA.lat, CASA.lon)
    expect(Math.abs(minuti(alba) - (3 * 60 + 35))).toBeLessThan(15)
    expect(Math.abs(minuti(tramonto) - (19 * 60 + 15))).toBeLessThan(15)
  })

  it('a Milano il 21 dicembre: alba verso le 7:00 UTC, tramonto verso le 15:40 UTC', () => {
    const { alba, tramonto } = albaTramonto(new Date(2026, 11, 21, 12), CASA.lat, CASA.lon)
    expect(Math.abs(minuti(alba) - 7 * 60)).toBeLessThan(15)
    expect(Math.abs(minuti(tramonto) - (15 * 60 + 40))).toBeLessThan(15)
  })
})

describe('faseLunare', () => {
  // La fase gira in cerchio: 0.99 è vicinissima a 0.
  const distanza = (a: number, b: number) => Math.min(Math.abs(a - b), 1 - Math.abs(a - b))

  it('riconosce lune nuove e piene note', () => {
    expect(distanza(faseLunare(new Date('2024-04-08T18:21:00Z')), 0)).toBeLessThan(0.03)
    expect(distanza(faseLunare(new Date('2024-04-23T23:49:00Z')), 0.5)).toBeLessThan(0.03)
  })

  it('sta sempre tra 0 e 1', () => {
    for (const d of ['1990-01-01', '2026-10-02', '2100-06-15']) {
      const f = faseLunare(new Date(d))
      expect(f).toBeGreaterThanOrEqual(0)
      expect(f).toBeLessThan(1)
    }
  })
})

describe('nomeFaseLunare', () => {
  it('dà il nome della fase, coi confini a metà tra due fasi', () => {
    expect(nomeFaseLunare(0).nome).toBe('Luna nuova')
    expect(nomeFaseLunare(0.98).nome).toBe('Luna nuova')
    expect(nomeFaseLunare(0.25).nome).toBe('Primo quarto')
    expect(nomeFaseLunare(0.5)).toEqual({ nome: 'Luna piena', emoji: '🌕' })
    expect(nomeFaseLunare(0.74).nome).toBe('Ultimo quarto')
    expect(nomeFaseLunare(0.06).nome).toBe('Luna nuova')
    expect(nomeFaseLunare(0.07).nome).toBe('Falce crescente')
  })
})

describe('daCodiceMeteo', () => {
  it('traduce i codici WMO', () => {
    expect(daCodiceMeteo(0).cielo).toBe('sereno')
    expect(daCodiceMeteo(3)).toEqual({ cielo: 'nuvoloso', intensita: 1 })
    expect(daCodiceMeteo(45).cielo).toBe('nebbia')
    expect(daCodiceMeteo(63).cielo).toBe('pioggia')
    expect(daCodiceMeteo(81).cielo).toBe('pioggia')
    expect(daCodiceMeteo(75)).toEqual({ cielo: 'neve', intensita: 1 })
    expect(daCodiceMeteo(95).cielo).toBe('temporale')
  })

  it('un codice sconosciuto è sereno', () => {
    expect(daCodiceMeteo(42)).toEqual({ cielo: 'sereno', intensita: 0 })
  })
})

describe('forzaVento', () => {
  it('va da 0 a 1', () => {
    expect(forzaVento(0)).toBe(0)
    expect(forzaVento(20)).toBe(0.5)
    expect(forzaVento(120)).toBe(1)
  })
})

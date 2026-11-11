import { describe, expect, it, vi } from 'vitest'
import type { MeteoLetto } from '../../dati/meteo'
import { calcolaAmbiente, comandiConsole, type Forzature } from './useAmbiente'

const ora = new Date('2026-10-02T12:00:00Z')
const letto: MeteoLetto = {
  codice: 63,
  ventoKmh: 20,
  alba: '2026-10-02T05:20Z',
  tramonto: '2026-10-02T17:05Z',
  letto: ora.getTime(),
}

describe('calcolaAmbiente', () => {
  it('segue la data, l\'ora e il meteo letto', () => {
    const a = calcolaAmbiente(ora, letto, {})
    expect(a.stagione).toBe('autunno')
    expect(a.luce.fase).toBe('giorno')
    expect(a.meteo.cielo).toBe('pioggia')
    expect(a.vento).toBe(0.5)
    expect(a.meteoVero).toBe(true)
    expect(a.sole.alba.toISOString()).toBe('2026-10-02T05:20:00.000Z')
    // Salvato prima che si leggesse la temperatura: non c'è.
    expect(a.temperatura).toBeNull()
    expect(calcolaAmbiente(ora, { ...letto, temperatura: 14.6 }, {}).temperatura).toBe(14.6)
  })

  it('senza meteo è sereno, con alba e tramonto calcolati', () => {
    const a = calcolaAmbiente(new Date('2026-10-02T23:00:00Z'), null, {})
    expect(a.meteo.cielo).toBe('sereno')
    expect(a.luce.fase).toBe('notte')
    expect(a.meteoVero).toBe(false)
    expect(a.temperatura).toBeNull()
  })

  it('le forzature vincono sul vero', () => {
    const a = calcolaAmbiente(ora, letto, { stagione: 'inverno', fase: 'notte', cielo: 'neve' })
    expect(a).toMatchObject({ stagione: 'inverno', meteo: { cielo: 'neve' }, meteoVero: false })
    expect(a.luce.fase).toBe('notte')
  })

  it('la festa segue il calendario, e si può forzare o spegnere', () => {
    expect(calcolaAmbiente(ora, letto, {}).festa).toBeNull()
    expect(calcolaAmbiente(new Date(2026, 11, 25, 12), letto, {}).festa).toBe('natale')
    expect(calcolaAmbiente(ora, letto, { festa: 'halloween' }).festa).toBe('halloween')
    expect(calcolaAmbiente(new Date(2026, 11, 25, 12), letto, { festa: 'nessuna' }).festa).toBeNull()
  })

  it('anche il vento si può forzare', () => {
    expect(calcolaAmbiente(ora, letto, { vento: 0 }).vento).toBe(0)
    expect(calcolaAmbiente(ora, letto, { cielo: 'temporale', vento: 0.1 }).vento).toBe(0.1)
  })
})

describe('comandiConsole', () => {
  const prova = () => {
    let forza: Forzature = {}
    const comandi = comandiConsole(
      () => ({ ...calcolaAmbiente(ora, letto, forza), forza }),
      (cambia) => (forza = cambia(forza)),
    )
    return { comandi, forza: () => forza }
  }

  it('forza un valore alla volta, tenendo gli altri', () => {
    const { comandi, forza } = prova()
    comandi.stagione('inverno')
    comandi.meteo('neve')
    comandi.ora('notte')
    comandi.vento(0.9)
    expect(forza()).toEqual({ stagione: 'inverno', cielo: 'neve', fase: 'notte', vento: 0.9 })
    expect(comandi.stato()).toMatchObject({ stagione: 'inverno', meteo: { cielo: 'neve' }, vento: 0.9 })
  })

  it('forza la festa, anche nessuna, e rifiuta quelle che non ci sono', () => {
    const avviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { comandi, forza } = prova()
    comandi.festa('pasqua')
    expect(comandi.stato().festa).toBe('pasqua')
    comandi.festa('nessuna')
    expect(comandi.stato().festa).toBeNull()
    comandi.festa('ferragosto' as never)
    expect(forza()).toEqual({ festa: 'nessuna' })
    expect(avviso).toHaveBeenCalledOnce()
    avviso.mockRestore()
  })

  it('senza argomento torna al vero; reset toglie tutto', () => {
    const { comandi, forza } = prova()
    comandi.stagione('estate')
    comandi.meteo('pioggia')
    comandi.stagione()
    expect(forza()).toEqual({ stagione: undefined, cielo: 'pioggia' })
    comandi.reset()
    expect(forza()).toEqual({})
  })

  it('rifiuta i valori sbagliati, spiegando quelli ammessi', () => {
    const avviso = vi.spyOn(console, 'warn').mockImplementation(() => {})
    const { comandi, forza } = prova()
    comandi.stagione('monsone' as never)
    comandi.vento(3)
    expect(forza()).toEqual({})
    expect(avviso).toHaveBeenCalledTimes(2)
    expect(avviso.mock.calls[0][0]).toContain('primavera, estate, autunno, inverno')
    avviso.mockRestore()
  })
})

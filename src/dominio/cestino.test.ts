import { describe, expect, it } from 'vitest'
import { giorniRimasti, limiteCestino, nelCestino } from './cestino'
import { attivita } from './esempi'

const adesso = new Date('2026-10-21T12:00:00Z')
const giorniFa = (giorni: number) => new Date(adesso.getTime() - giorni * 24 * 60 * 60 * 1000).toISOString()

describe('limiteCestino', () => {
  it('è 30 giorni fa', () => {
    expect(limiteCestino(adesso).toISOString()).toBe(giorniFa(30))
  })
})

describe('giorniRimasti', () => {
  it('conta per eccesso fino a zero', () => {
    expect(giorniRimasti({ eliminata_il: adesso.toISOString() }, adesso)).toBe(30)
    expect(giorniRimasti({ eliminata_il: giorniFa(0.5) }, adesso)).toBe(30)
    expect(giorniRimasti({ eliminata_il: giorniFa(29.5) }, adesso)).toBe(1)
    expect(giorniRimasti({ eliminata_il: giorniFa(31) }, adesso)).toBe(0)
  })
})

describe('nelCestino', () => {
  it('solo le cestinate da meno di 30 giorni, dalla più recente', () => {
    const viva = attivita({ titolo: 'viva' })
    const vecchia = attivita({ titolo: 'vecchia', eliminata_il: giorniFa(20) })
    const recente = attivita({ titolo: 'recente', eliminata_il: giorniFa(1) })
    const scaduta = attivita({ titolo: 'scaduta', eliminata_il: giorniFa(31) })

    expect(nelCestino([vecchia, viva, scaduta, recente], adesso).map((a) => a.titolo)).toEqual(['recente', 'vecchia'])
  })
})

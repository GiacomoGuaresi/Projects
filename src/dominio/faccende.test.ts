import { describe, expect, it } from 'vitest'
import { faccendeDiOggi, inizioGiornata, scaduta, segnaCompleta } from './faccende'
import type { Faccenda } from './tipi'

const adesso = new Date(2026, 8, 14, 15, 30)
const oggi = (ore: number) => new Date(2026, 8, 14, ore).toISOString()
const ieri = (ore: number) => new Date(2026, 8, 13, ore).toISOString()

let prossimoId = 1
const faccenda = (campi: Partial<Faccenda> = {}): Faccenda => ({
  id: prossimoId++,
  titolo: 'Passare l’aspirapolvere',
  completa: false,
  creata_il: ieri(9),
  completata_il: null,
  ...campi,
})

describe('inizioGiornata', () => {
  it('è la mezzanotte locale dello stesso giorno', () => {
    expect(inizioGiornata(adesso)).toEqual(new Date(2026, 8, 14, 0, 0, 0, 0))
  })
})

describe('scaduta', () => {
  it('solo se completata prima di oggi', () => {
    expect(scaduta(faccenda({ completa: true, completata_il: ieri(23) }), adesso)).toBe(true)
    expect(scaduta(faccenda({ completa: true, completata_il: oggi(0) }), adesso)).toBe(false)
    expect(scaduta(faccenda({ creata_il: ieri(1) }), adesso)).toBe(false)
  })
})

describe('faccendeDiOggi', () => {
  it('da fare dalla più vecchia, poi le fatte oggi dalla più recente, senza le scadute', () => {
    const nuova = faccenda({ titolo: 'nuova', creata_il: oggi(10) })
    const vecchia = faccenda({ titolo: 'vecchia', creata_il: ieri(8) })
    const fattaPresto = faccenda({ titolo: 'fatta presto', completa: true, completata_il: oggi(8) })
    const fattaTardi = faccenda({ titolo: 'fatta tardi', completa: true, completata_il: oggi(14) })
    const fattaIeri = faccenda({ titolo: 'fatta ieri', completa: true, completata_il: ieri(20) })

    const titoli = faccendeDiOggi([fattaPresto, nuova, fattaIeri, fattaTardi, vecchia], adesso).map((f) => f.titolo)
    expect(titoli).toEqual(['vecchia', 'nuova', 'fatta tardi', 'fatta presto'])
  })
})

describe('segnaCompleta', () => {
  it('fatta segna quando; riaperta perde la data', () => {
    const fatta = segnaCompleta(faccenda(), true, adesso)
    expect(fatta).toMatchObject({ completa: true, completata_il: adesso.toISOString() })
    expect(segnaCompleta(fatta, false, adesso)).toMatchObject({ completa: false, completata_il: null })
  })

  it('già fatta resta con la sua data', () => {
    const fatta = faccenda({ completa: true, completata_il: oggi(8) })
    expect(segnaCompleta(fatta, true, adesso)).toBe(fatta)
  })
})

import { describe, expect, it } from 'vitest'
import {
  CATALOGO,
  caselle,
  giorniValidi,
  leggiSpunte,
  leggiViaggio,
  listaPerViaggio,
  scriviSpunte,
  scriviViaggio,
  VIAGGIO_PREDEFINITO,
  type Viaggio,
} from './valigia'

const ids = (viaggio: Viaggio) => listaPerViaggio(viaggio).flatMap((c) => c.voci.map((v) => v.id))
const categorie = (viaggio: Viaggio) => listaPerViaggio(viaggio).map((c) => c.id)

describe('CATALOGO', () => {
  it('ha id unici e adatti al cookie', () => {
    const tutti = CATALOGO.flatMap((c) => c.voci.map((v) => v.id))
    expect(new Set(tutti).size).toBe(tutti.length)
    for (const id of tutti) expect(id).toMatch(/^[a-z0-9-]+$/)
  })
})

describe('listaPerViaggio', () => {
  it('senza tipi mostra solo le voci generiche', () => {
    const viaggio = { giorni: 3, tipi: [] }
    expect(ids(viaggio)).toContain('spazzolino')
    expect(ids(viaggio)).not.toContain('sacco-lenzuolo')
    expect(categorie(viaggio)).not.toContain('spiaggia')
    expect(categorie(viaggio)).not.toContain('campeggio')
  })

  it('un tipo aggiunge le sue voci e le sue categorie', () => {
    const viaggio: Viaggio = { giorni: 3, tipi: ['mare'] }
    expect(ids(viaggio)).toContain('costume')
    expect(categorie(viaggio)).toContain('spiaggia')
    expect(ids(viaggio)).not.toContain('scarponi')
  })

  it('basta uno dei tipi della voce', () => {
    expect(categorie({ giorni: 3, tipi: ['rifugio'] })).toContain('escursioni')
    expect(categorie({ giorni: 3, tipi: ['montagna'] })).toContain('escursioni')
    expect(categorie({ giorni: 3, tipi: ['montagna'] })).not.toContain('rifugio')
  })

  it('dice quali tipi scelti hanno fatto comparire voci e categorie', () => {
    const lista = listaPerViaggio({ giorni: 3, tipi: ['mare', 'rifugio'] })
    const voci = lista.flatMap((c) => c.voci)
    expect(voci.find((v) => v.id === 'solare')?.tipi).toEqual(['mare', 'rifugio'])
    expect(voci.find((v) => v.id === 'scarponi')?.tipi).toEqual(['rifugio'])
    expect(voci.find((v) => v.id === 'spazzolino')?.tipi).toEqual([])
    expect(lista.find((c) => c.id === 'spiaggia')?.tipi).toEqual(['mare'])
    expect(lista.find((c) => c.id === 'beauty')?.tipi).toEqual([])
  })

  it('porta il dettaglio delle voci raggruppate', () => {
    const portafogli = listaPerViaggio({ giorni: 3, tipi: [] })
      .flatMap((c) => c.voci)
      .find((v) => v.id === 'portafogli')
    expect(portafogli?.dettaglio).toContain('patente')
  })

  it('le quantità seguono i giorni, con un tetto', () => {
    const quantita = (giorni: number, id: string) =>
      listaPerViaggio({ giorni, tipi: [] })
        .flatMap((c) => c.voci)
        .find((v) => v.id === id)?.quantita
    expect(quantita(3, 'calzini')).toBe(4)
    expect(quantita(20, 'calzini')).toBe(8)
    expect(quantita(3, 'pigiama')).toBe(1)
    expect(quantita(5, 'pigiama')).toBe(2)
    expect(quantita(3, 'spazzolino')).toBeUndefined()
  })
})

describe('caselle', () => {
  it('una a testa, una sola per chi ce l\'ha, una comune', () => {
    expect(caselle({ id: 'calzini', di: 'entrambi' })).toEqual([
      { persona: 'jack', chiave: 'calzini_j' },
      { persona: 'ale', chiave: 'calzini_a' },
    ])
    expect(caselle({ id: 'anello', di: 'ale' })).toEqual([{ persona: 'ale', chiave: 'anello_a' }])
    expect(caselle({ id: 'chiavi', di: 'comune' })).toEqual([{ persona: 'comune', chiave: 'chiavi' }])
  })

  it('la lista porta di chi è ogni voce', () => {
    const voci = listaPerViaggio({ giorni: 3, tipi: [] }).flatMap((c) => c.voci)
    expect(voci.find((v) => v.id === 'calzini')?.di).toBe('entrambi')
    expect(voci.find((v) => v.id === 'rasoio')?.di).toBe('jack')
    expect(voci.find((v) => v.id === 'chiavi')?.di).toBe('comune')
  })
})

describe('giorniValidi', () => {
  it('resta tra 1 e 30, intero', () => {
    expect(giorniValidi(0)).toBe(1)
    expect(giorniValidi(99)).toBe(30)
    expect(giorniValidi(4.4)).toBe(4)
    expect(giorniValidi(Number.NaN)).toBe(VIAGGIO_PREDEFINITO.giorni)
  })
})

describe('cookie del viaggio', () => {
  it('va e torna', () => {
    const viaggio: Viaggio = { giorni: 5, tipi: ['mare', 'rifugio'] }
    expect(scriviViaggio(viaggio)).toBe('5.mare.rifugio')
    expect(leggiViaggio(scriviViaggio(viaggio))).toEqual(viaggio)
  })

  it('scarta tipi sconosciuti e ripetuti, e un valore rovinato vale il predefinito', () => {
    expect(leggiViaggio('4.mare.boh.mare')).toEqual({ giorni: 4, tipi: ['mare'] })
    expect(leggiViaggio('abc.mare')).toEqual(VIAGGIO_PREDEFINITO)
    expect(leggiViaggio('')).toEqual(VIAGGIO_PREDEFINITO)
    expect(leggiViaggio(null)).toEqual(VIAGGIO_PREDEFINITO)
    expect(leggiViaggio('500')).toEqual({ giorni: 30, tipi: [] })
  })
})

describe('cookie delle spunte', () => {
  it('va e torna, scartando le chiavi non più nel catalogo', () => {
    const spunte = new Set(['calzini_j', 'calzini_a', 'tenda'])
    expect(leggiSpunte(scriviSpunte(spunte))).toEqual(spunte)
    expect(leggiSpunte('calzini_j.tolta_j.')).toEqual(new Set(['calzini_j']))
    expect(leggiSpunte(null)).toEqual(new Set())
  })

  it('scarta le chiavi di chi non ha la voce, e quelle senza persona', () => {
    // Il rasoio è solo di Jack, le chiavi di casa sono comuni, i calzini di tutti e due.
    expect(leggiSpunte('rasoio_j.rasoio_a.chiavi_j.calzini')).toEqual(new Set(['rasoio_j']))
  })
})

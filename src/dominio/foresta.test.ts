import { describe, expect, it } from 'vitest'
import {
  boschetti,
  disponi,
  numeriForesta,
  proietta,
  quandoFa,
  SENZA_PROGETTO,
  statisticheBosco,
  verdeZolla,
  type Elemento,
  type Lotto,
} from './foresta'
import type { Attivita, Stato } from './tipi'

let prossimoId = 1

function attivita(progetto: string | null, completata_il: string | null, stato: Stato = 'completo'): Attivita {
  return {
    id: prossimoId++,
    titolo: `Attività ${prossimoId}`,
    progetto,
    stato,
    avanzamento: stato === 'completo' ? 100 : 0,
    creata_il: '2026-01-01T00:00:00Z',
    modificata_il: '2026-01-01T00:00:00Z',
    completata_il,
    ha_diario: false,
  }
}

const giorno = (n: number) => `2026-01-${String(n).padStart(2, '0')}T10:00:00Z`

const alberi = (elementi: Elemento[]) => elementi.filter((e) => e.tipo === 'albero')
const arbusti = (elementi: Elemento[]) => elementi.filter((e) => e.tipo === 'arbusto')
const posto = (e: Elemento) => `${e.col},${e.riga}`

describe('boschetti', () => {
  it('prende tutte le attività, con il loro stato', () => {
    const elenco = [attivita('Casa', giorno(1)), attivita('Casa', null, 'in_corso')]
    expect(boschetti(elenco)).toHaveLength(1)
    expect(boschetti(elenco)[0].alberi.map((a) => a.stato)).toEqual(['completo', 'in_corso'])
  })

  it('raggruppa senza distinguere maiuscole e spazi, con la grafia più usata', () => {
    const [gruppo] = boschetti([
      attivita('Casa', giorno(1)),
      attivita(' casa ', giorno(2)),
      attivita('casa', giorno(3)),
    ])
    expect(gruppo.chiave).toBe('casa')
    expect(gruppo.nome).toBe('casa')
    expect(gruppo.alberi).toHaveLength(3)
  })

  it('mette le attività senza progetto in "Sparsi"', () => {
    const [gruppo] = boschetti([attivita(null, giorno(1))])
    expect(gruppo).toMatchObject({ chiave: '', nome: SENZA_PROGETTO })
  })

  it('ordina le piante per creazione e i boschetti per la prima pianta', () => {
    const tardi = { ...attivita('Auto', null, 'da_fare'), creata_il: giorno(5) }
    const presto = { ...attivita('Auto', giorno(9)), creata_il: giorno(2) }
    const elenco = [tardi, { ...attivita('Casa', giorno(1)), creata_il: giorno(3) }, presto]
    const gruppi = boschetti(elenco)
    expect(gruppi.map((g) => g.nome)).toEqual(['Auto', 'Casa'])
    expect(gruppi[0].alberi.map((a) => a.id)).toEqual([presto.id, tardi.id])
  })
})

describe('disponi', () => {
  it('una foresta vuota ha solo il prato (e magari qualche roccia)', () => {
    const foresta = disponi([], 0)
    expect(foresta.elementi.every((e) => e.tipo === 'roccia')).toBe(true)
    expect(foresta.lotti).toEqual([])
    expect(foresta.caselle.length).toBeGreaterThan(0)
  })

  it('mette un albero per attività, mai due nella stessa casella', () => {
    const elenco = [
      ...Array.from({ length: 30 }, (_, i) => attivita('Casa', giorno(1 + (i % 28)))),
      ...Array.from({ length: 12 }, () => attivita('Auto', giorno(2))),
      attivita(null, giorno(3)),
    ]
    const foresta = disponi(boschetti(elenco), 40)
    const piantati = [...alberi(foresta.elementi), ...arbusti(foresta.elementi)]
    expect(alberi(foresta.elementi)).toHaveLength(43)
    expect(arbusti(foresta.elementi)).toHaveLength(40)
    expect(new Set(piantati.map(posto)).size).toBe(piantati.length)
  })

  it('i boschetti non si toccano', () => {
    const elenco = [
      ...Array.from({ length: 20 }, () => attivita('Casa', giorno(1))),
      ...Array.from({ length: 9 }, () => attivita('Auto', giorno(2))),
      ...Array.from({ length: 3 }, () => attivita('Bagno', giorno(3))),
    ]
    const { lotti } = disponi(boschetti(elenco), 0)
    for (const a of lotti) {
      for (const b of lotti) {
        if (a === b) continue
        expect(Math.hypot(a.col - b.col, a.riga - b.riga)).toBeGreaterThan(a.raggio + b.raggio)
      }
    }
  })

  it('un albero nuovo non sposta quelli già piantati', () => {
    const elenco = Array.from({ length: 10 }, (_, i) => attivita('Casa', giorno(i + 1)))
    const prima = alberi(disponi(boschetti(elenco), 0).elementi).map(posto)
    const dopo = alberi(disponi(boschetti([...elenco, attivita('Casa', giorno(20))]), 0).elementi).map(posto)
    expect(dopo).toHaveLength(11)
    expect(dopo).toEqual(expect.arrayContaining(prima))
  })

  it('una pianta che cambia stato resta al suo posto', () => {
    const elenco = Array.from({ length: 6 }, (_, i) => attivita('Casa', null, i % 2 ? 'in_corso' : 'da_fare'))
    const prima = alberi(disponi(boschetti(elenco), 0).elementi)
    const cresciuta = elenco.map((a, i) => (i === 3 ? { ...a, stato: 'completo' as const, completata_il: giorno(9) } : a))
    const dopo = alberi(disponi(boschetti(cresciuta), 0).elementi)
    const posto3 = (lista: Elemento[]) => lista.find((e) => e.tipo === 'albero' && e.albero.id === elenco[3].id)
    expect(posto(posto3(dopo)!)).toBe(posto(posto3(prima)!))
  })

  it('gli arbusti stanno sempre negli stessi posti, solo sul prato libero', () => {
    const gruppi = boschetti([attivita('Casa', giorno(1)), attivita('Casa', giorno(2)), attivita('Auto', giorno(3))])
    const una = disponi(gruppi, 25)
    const due = disponi(gruppi, 25)
    expect(arbusti(una.elementi).map(posto)).toEqual(arbusti(due.elementi).map(posto))
    const tipi = new Map(una.caselle.map((c) => [posto(c as Elemento), c.tipo]))
    for (const a of arbusti(una.elementi)) expect(tipi.get(posto(a))).toBe('prato')
  })

  it('gli alberi di un boschetto stanno tutti alla stessa altezza, quella della zolla', () => {
    const elenco = Array.from({ length: 12 }, () => attivita('Casa', giorno(1)))
    const { elementi, caselle, lotti } = disponi(boschetti(elenco), 0)
    const zolle = caselle.filter((c) => c.tipo === 'zolla')
    expect(new Set(zolle.map((c) => c.altezza))).toEqual(new Set([lotti[0].altezza]))
    for (const a of alberi(elementi)) expect(a.altezza).toBe(lotti[0].altezza)
  })

  it('caselle ed elementi sono in ordine di disegno, da dietro in avanti', () => {
    const elenco = Array.from({ length: 8 }, () => attivita('Casa', giorno(1)))
    const { elementi, caselle } = disponi(boschetti(elenco), 5)
    for (const lista of [elementi, caselle]) {
      for (let i = 1; i < lista.length; i++) {
        expect(lista[i].col + lista[i].riga).toBeGreaterThanOrEqual(lista[i - 1].col + lista[i - 1].riga)
      }
    }
  })

  describe('famiglie', () => {
    const elenco = [
      ...Array.from({ length: 14 }, () => attivita('Software / Projects', giorno(1))),
      ...Array.from({ length: 9 }, () => attivita('Casa', giorno(2))),
      ...Array.from({ length: 6 }, () => attivita('Software / Grocery', giorno(3))),
      ...Array.from({ length: 4 }, () => attivita('Software', giorno(4))),
      ...Array.from({ length: 5 }, () => attivita('Auto', giorno(5))),
    ]
    const foresta = disponi(boschetti(elenco), 10)
    const lotto = (chiave: string) => foresta.lotti.find((l) => l.chiave === chiave)!
    const distacco = (a: Lotto, b: Lotto) => Math.hypot(a.col - b.col, a.riga - b.riga) - a.raggio - b.raggio
    const software = ['software / projects', 'software / grocery', 'software'].map(lotto)

    it('i boschetti della stessa famiglia stanno quasi attaccati, alla stessa quota', () => {
      expect(new Set(software.map((l) => l.famiglia))).toEqual(new Set(['software']))
      expect(new Set(software.map((l) => l.altezza)).size).toBe(1)
      for (const a of software) {
        const vicino = Math.min(...software.filter((b) => b !== a).map((b) => distacco(a, b)))
        expect(vicino).toBeGreaterThanOrEqual(1)
        expect(vicino).toBeLessThan(2)
      }
    })

    it('tra famiglie diverse resta il sentiero', () => {
      for (const a of software) {
        for (const b of [lotto('casa'), lotto('auto')]) expect(distacco(a, b)).toBeGreaterThanOrEqual(2)
      }
    })

    it('ogni albero sta sulla zolla del suo boschetto', () => {
      const zolle = new Map(foresta.caselle.map((c) => [posto(c as Elemento), c.chiave]))
      for (const a of alberi(foresta.elementi)) {
        if (a.tipo === 'albero') expect(zolle.get(posto(a))).toBe(a.chiave)
      }
    })
  })

  it('il prato contiene tutto', () => {
    const elenco = Array.from({ length: 15 }, () => attivita('Casa', giorno(1)))
    const { elementi, limiti } = disponi(boschetti(elenco), 30)
    for (const e of elementi) {
      expect(e.col).toBeGreaterThanOrEqual(limiti.minCol)
      expect(e.col).toBeLessThanOrEqual(limiti.maxCol)
      expect(e.riga).toBeGreaterThanOrEqual(limiti.minRiga)
      expect(e.riga).toBeLessThanOrEqual(limiti.maxRiga)
    }
  })
})

describe('proietta', () => {
  it('fa rombi due volte più larghi che alti', () => {
    expect(proietta(0, 0)).toEqual({ x: 0, y: 0 })
    expect(proietta(1, 0)).toEqual({ x: 16, y: 8 })
    expect(proietta(0, 1)).toEqual({ x: -16, y: 8 })
    expect(proietta(1, 1)).toEqual({ x: 0, y: 16 })
  })
})

describe('statisticheBosco', () => {
  it('conta tutte le attività del progetto per stato', () => {
    const elenco = [
      attivita('Casa', giorno(3)),
      attivita(' casa', giorno(1)),
      attivita('Casa', null, 'da_fare'),
      attivita('Casa', null, 'bloccato'),
      attivita('Auto', giorno(2)),
    ]
    expect(statisticheBosco(elenco, 'casa')).toEqual({
      totale: 4,
      perStato: { da_fare: 1, in_corso: 0, bloccato: 1, completo: 2 },
      percentuale: 50,
      primo: giorno(1),
      ultimo: giorno(3),
    })
  })

  it('con la chiave vuota prende le attività senza progetto', () => {
    const elenco = [attivita(null, giorno(1)), attivita(null, null, 'in_corso'), attivita('Casa', giorno(2))]
    expect(statisticheBosco(elenco, '')).toMatchObject({ totale: 2, percentuale: 50 })
  })

  it('un bosco senza attività ha tutto a zero', () => {
    expect(statisticheBosco([], 'casa')).toMatchObject({ totale: 0, percentuale: 0, primo: null, ultimo: null })
  })
})

describe('verdeZolla', () => {
  it('è sempre un verde, uguale per lo stesso progetto', () => {
    for (const nome of ['casa', 'auto', 'giardino', 'software / projects', 'moto', 'camino', 'x'.repeat(50)]) {
      const { h, s, l } = verdeZolla(nome)
      expect(h).toBeGreaterThanOrEqual(75)
      expect(h).toBeLessThanOrEqual(165)
      expect(s).toBeGreaterThanOrEqual(30)
      expect(l).toBeGreaterThanOrEqual(50)
      expect(l).toBeLessThanOrEqual(62)
      expect(verdeZolla(nome)).toEqual(verdeZolla(nome))
    }
  })

  it('cambia da progetto a progetto', () => {
    expect(verdeZolla('casa')).not.toEqual(verdeZolla('auto'))
  })

  it('i boschetti di una famiglia hanno verdi vicini, ma diversi', () => {
    const famiglia = verdeZolla('software')
    const figli = ['software / projects', 'software / grocery', 'software / lavoro'].map(verdeZolla)
    for (const f of figli) {
      expect(Math.abs(f.h - famiglia.h)).toBeLessThanOrEqual(10)
      expect(f).not.toEqual(famiglia)
    }
    expect(new Set(figli.map((f) => JSON.stringify(f))).size).toBe(figli.length)
  })
})

describe('numeriForesta', () => {
  const adesso = new Date('2026-01-20T12:00:00Z')

  it('conta piante per stato, boschetti e percentuale', () => {
    const elenco = [
      attivita('Casa', giorno(19)),
      attivita('Casa', giorno(2)),
      attivita('Orto', null, 'in_corso'),
      attivita(null, null, 'da_fare'),
      attivita('Orto', null, 'bloccato'),
    ]
    expect(numeriForesta(elenco, 4, adesso)).toEqual({
      alberi: 2,
      boschetti: 3,
      arbusti: 4,
      inCrescita: 2,
      secchi: 1,
      percentuale: 40,
      settimana: 1,
      ultimo: giorno(19),
    })
  })

  it('una foresta vuota è tutta a zero', () => {
    expect(numeriForesta([], null, adesso)).toMatchObject({ alberi: 0, boschetti: 0, percentuale: 0, ultimo: null })
  })
})

describe('quandoFa', () => {
  const adesso = new Date(2026, 0, 20, 9, 0)
  it('conta i giorni di calendario', () => {
    expect(quandoFa(new Date(2026, 0, 20, 8, 0).toISOString(), adesso)).toBe('oggi')
    expect(quandoFa(new Date(2026, 0, 19, 23, 0).toISOString(), adesso)).toBe('ieri')
    expect(quandoFa(new Date(2026, 0, 17, 10, 0).toISOString(), adesso)).toBe('3 giorni fa')
  })
})

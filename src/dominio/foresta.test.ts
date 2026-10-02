import { describe, expect, it } from 'vitest'
import { boschetti, disponi, proietta, SENZA_PROGETTO, statisticheBosco, verdeZolla, type Elemento } from './foresta'
import type { Attivita, Stato } from './tipi'

let prossimoId = 1

function attivita(progetto: string | null, completata_il: string | null, stato: Stato = 'completo'): Attivita {
  return {
    id: prossimoId++,
    titolo: `Attività ${prossimoId}`,
    progetto,
    stato,
    priorita: 3,
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
  it('una foresta vuota ha solo il prato', () => {
    const foresta = disponi([], 0)
    expect(foresta.elementi).toEqual([])
    expect(foresta.lotti).toEqual([])
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

  it('gli arbusti stanno sempre negli stessi posti e fuori dalle zolle', () => {
    const gruppi = boschetti([attivita('Casa', giorno(1)), attivita('Casa', giorno(2))])
    const una = disponi(gruppi, 6)
    const due = disponi(gruppi, 6)
    expect(arbusti(una.elementi).map(posto)).toEqual(arbusti(due.elementi).map(posto))
    const zolle = new Set(una.elementi.filter((e) => e.tipo === 'zolla').map(posto))
    for (const a of arbusti(una.elementi)) expect(zolle.has(posto(a))).toBe(false)
  })

  it('disegna prima le zolle, poi da dietro in avanti', () => {
    const elenco = Array.from({ length: 8 }, () => attivita('Casa', giorno(1)))
    const { elementi } = disponi(boschetti(elenco), 5)
    const ultimaZolla = elementi.map((e) => e.tipo).lastIndexOf('zolla')
    const resto = elementi.slice(ultimaZolla + 1)
    expect(resto.every((e) => e.tipo !== 'zolla')).toBe(true)
    for (let i = 1; i < resto.length; i++) {
      expect(resto[i].col + resto[i].riga).toBeGreaterThanOrEqual(resto[i - 1].col + resto[i - 1].riga)
    }
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
})

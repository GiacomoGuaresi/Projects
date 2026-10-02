import { describe, expect, it } from 'vitest'
import { LIVELLI, linea, livello, quota, terreno } from './terreno'

const limiti = { minCol: -20, maxCol: 20, minRiga: -20, maxRiga: 20 }

describe('quota e livello', () => {
  it('la quota dipende solo dalla casella e sta in [0, 1)', () => {
    for (let col = -30; col <= 30; col += 7) {
      for (let riga = -30; riga <= 30; riga += 5) {
        const q = quota(col, riga)
        expect(q).toBe(quota(col, riga))
        expect(q).toBeGreaterThanOrEqual(0)
        expect(q).toBeLessThan(1)
      }
    }
  })

  it('i livelli vanno da 0 a LIVELLI - 1', () => {
    expect(livello(0)).toBe(0)
    expect(livello(0.99)).toBe(LIVELLI - 1)
  })

  it('le colline salgono a gradini: i dirupi di più di un livello sono rari', () => {
    let salti = 0
    for (let col = -40; col < 40; col++) {
      for (let riga = -40; riga < 40; riga++) {
        if (Math.abs(livello(quota(col, riga)) - livello(quota(col + 1, riga))) > 1) salti++
      }
    }
    expect(salti / (80 * 80)).toBeLessThan(0.01)
  })
})

describe('linea', () => {
  it('va da un capo all\'altro a passi di una casella per lato', () => {
    const passi = linea({ col: -3, riga: 2 }, { col: 4, riga: -5 })
    expect(passi[0]).toEqual({ col: -3, riga: 2 })
    expect(passi.at(-1)).toEqual({ col: 4, riga: -5 })
    for (let i = 1; i < passi.length; i++) {
      expect(Math.abs(passi[i].col - passi[i - 1].col) + Math.abs(passi[i].riga - passi[i - 1].riga)).toBe(1)
    }
  })

  it('da una casella a sé stessa è una casella sola', () => {
    expect(linea({ col: 1, riga: 1 }, { col: 1, riga: 1 })).toEqual([{ col: 1, riga: 1 }])
  })
})

describe('terreno', () => {
  const pianori = [
    { chiave: 'casa', col: 0, riga: 0, raggio: 2 },
    { chiave: 'auto', col: 9, riga: -4, raggio: 1.5 },
  ]
  const mappa = terreno(limiti, pianori)
  const caselle = [...mappa.values()]

  it('copre tutti i limiti', () => {
    expect(caselle).toHaveLength(41 * 41)
  })

  it('una casella non cambia se la foresta si allarga', () => {
    const grande = terreno({ minCol: -30, maxCol: 30, minRiga: -30, maxRiga: 30 }, pianori)
    for (const c of caselle) expect(grande.get(`${c.col},${c.riga}`)).toEqual(c)
  })

  it('le zolle sono piane, senza acqua dentro né attorno', () => {
    for (const p of pianori) {
      const zolle = caselle.filter((c) => c.chiave === p.chiave)
      expect(new Set(zolle.map((c) => c.altezza)).size).toBe(1)
      const vicine = caselle.filter((c) => Math.hypot(c.col - p.col, c.riga - p.riga) <= p.raggio + 2)
      expect(vicine.some((c) => c.tipo === 'acqua')).toBe(false)
    }
  })

  it('l\'acqua sta sempre al livello 0', () => {
    for (const c of caselle) if (c.tipo === 'acqua') expect(c.altezza).toBe(0)
  })

  it('un sentiero unisce i boschetti', () => {
    expect(caselle.some((c) => c.tipo === 'sentiero')).toBe(true)
    for (const { col, riga } of linea(pianori[1], pianori[0])) {
      expect(['zolla', 'sentiero']).toContain(mappa.get(`${col},${riga}`)!.tipo)
    }
  })

  it('le rocce stanno solo in alto', () => {
    for (const c of caselle) if (c.tipo === 'roccia') expect(c.altezza).toBeGreaterThanOrEqual(2)
  })
})

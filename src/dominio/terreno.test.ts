import { describe, expect, it } from 'vitest'
import { LIVELLI, livello, quota, terreno } from './terreno'

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

/** Le caselle di un disco: una zolla per i test. */
function disco(col: number, riga: number, raggio: number) {
  const caselle: { col: number; riga: number }[] = []
  const r = Math.floor(raggio)
  for (let dc = -r; dc <= r; dc++) {
    for (let dr = -r; dr <= r; dr++) if (Math.hypot(dc, dr) <= raggio) caselle.push({ col: col + dc, riga: riga + dr })
  }
  return caselle
}

describe('terreno', () => {
  // Due boschetti attaccati: la foresta.
  const pianori = [
    { chiave: 'casa', caselle: disco(0, 0, 2) },
    { chiave: 'auto', caselle: disco(4, 0, 1.5) },
  ]
  const mappa = terreno(limiti, pianori)
  const caselle = [...mappa.values()]
  const foresta = pianori.flatMap((p) => p.caselle)
  const vicino = (c: { col: number; riga: number }, d: number) =>
    foresta.some((z) => Math.hypot(z.col - c.col, z.riga - c.riga) <= d)

  it('copre tutti i limiti', () => {
    expect(caselle).toHaveLength(41 * 41)
  })

  it('una casella non cambia se la foresta si allarga', () => {
    const grande = terreno({ minCol: -30, maxCol: 30, minRiga: -30, maxRiga: 30 }, pianori)
    for (const c of caselle) expect(grande.get(`${c.col},${c.riga}`)).toEqual(c)
  })

  it('ogni casella dei pianori è zolla del suo boschetto', () => {
    for (const p of pianori) {
      for (const z of p.caselle) expect(mappa.get(`${z.col},${z.riga}`)).toMatchObject({ tipo: 'zolla', chiave: p.chiave })
    }
  })

  it('la foresta e il sottobosco attorno stanno alla stessa quota, senza acqua né rocce', () => {
    const insieme = caselle.filter((c) => vicino(c, 1.5))
    expect(new Set(insieme.map((c) => c.altezza)).size).toBe(1)
    for (const c of insieme) expect(['zolla', 'prato']).toContain(c.tipo)
  })

  it('attorno alla foresta niente acqua, e si sale o scende di un livello al massimo', () => {
    const alto = mappa.get('0,0')!.altezza
    for (const c of caselle.filter((c) => vicino(c, 2))) {
      expect(c.tipo).not.toBe('acqua')
      expect(Math.abs(c.altezza - alto)).toBeLessThanOrEqual(1)
    }
  })

  it('l\'acqua sta sempre al livello 0', () => {
    for (const c of caselle) if (c.tipo === 'acqua') expect(c.altezza).toBe(0)
  })

  it('i sentieri sono di terra battuta, alla quota della foresta, mai sulle zolle', () => {
    const conSentiero = terreno(limiti, pianori, [{ col: 3, riga: 2 }, { col: 0, riga: 0 }])
    expect(conSentiero.get('3,2')).toMatchObject({ tipo: 'sentiero', altezza: mappa.get('0,0')!.altezza })
    expect(conSentiero.get('0,0')!.tipo).toBe('zolla')
  })

  it('le rocce stanno solo in alto', () => {
    for (const c of caselle) if (c.tipo === 'roccia') expect(c.altezza).toBeGreaterThanOrEqual(2)
  })
})

// Il terreno della Foresta (doc/08-interfaccia.md, "Foresta"): colline,
// laghetti, sentieri e rocce. Le altezze vengono da un rumore con seed fisso
// sulle coordinate assolute, quindi una foresta che si allarga non cambia le
// colline che c'erano già.

import { generatore } from './caso'

export type TipoCasella = 'prato' | 'zolla' | 'acqua' | 'sentiero' | 'roccia'

export interface CasellaTerreno {
  col: number
  riga: number
  /** Da 0 (pianura, livello dell'acqua) a `LIVELLI - 1`. */
  altezza: number
  tipo: TipoCasella
  /** Il boschetto, per le zolle. */
  chiave?: string
}

/** Un boschetto, come serve al terreno: il centro e il raggio della zolla. */
export interface Pianoro {
  chiave: string
  /** I pianori della stessa famiglia stanno alla stessa quota, uniti dal sottobosco. */
  famiglia: string
  col: number
  riga: number
  raggio: number
}

export const LIVELLI = 4
/** Sotto questa quota c'è acqua. */
const ACQUA = 0.27
/** Le soglie tra un livello e il successivo. */
const SOGLIE = [0.42, 0.56, 0.68]
/** Fin dove arriva il sottobosco piano attorno alle zolle di una famiglia. */
const SOTTOBOSCO = 1.5
/** Le rocce, sulle caselle alte: una su tante. */
const ROCCE = 0.05
const SEED_TERRENO = 7331
const SEED_ROCCE = 4049

const chiave = (col: number, riga: number) => `${col},${riga}`

/** Un numero fisso in [0, 1) per casella e seed. */
export function sorteggio(col: number, riga: number, seed: number): number {
  return generatore(Math.imul(col, 73856093) ^ Math.imul(riga, 19349663) ^ seed)()
}

const liscia = (t: number) => t * t * (3 - 2 * t)

/** Rumore a valori: un numero a caso ogni `passo` caselle, sfumato in mezzo. */
function rumore(col: number, riga: number, passo: number, seed: number): number {
  const x = col / passo
  const y = riga / passo
  const ix = Math.floor(x)
  const iy = Math.floor(y)
  const fx = liscia(x - ix)
  const fy = liscia(y - iy)
  const v = (dx: number, dy: number) => sorteggio(ix + dx, iy + dy, seed)
  const sopra = v(0, 0) + (v(1, 0) - v(0, 0)) * fx
  const sotto = v(0, 1) + (v(1, 1) - v(0, 1)) * fx
  return sopra + (sotto - sopra) * fy
}

/** La quota naturale della casella, in [0, 1): colline larghe più un po' di dettaglio. */
export function quota(col: number, riga: number): number {
  return 0.85 * rumore(col, riga, 9, SEED_TERRENO) + 0.15 * rumore(col, riga, 4, SEED_TERRENO + 1)
}

/** Il livello di una quota: 0 sotto la prima soglia, poi uno per soglia. */
export function livello(q: number): number {
  return SOGLIE.filter((s) => q >= s).length
}

/** Le caselle di una linea retta, una attaccata all'altra per lato (niente salti in diagonale). */
export function linea(da: { col: number; riga: number }, a: { col: number; riga: number }) {
  const dc = Math.abs(a.col - da.col)
  const dr = Math.abs(a.riga - da.riga)
  const caselle = [{ col: da.col, riga: da.riga }]
  let passiCol = 0
  let passiRiga = 0
  // Si avanza sull'asse che, in proporzione, è più indietro.
  for (let i = 0; i < dc + dr; i++) {
    if (dr === 0 || (dc !== 0 && (passiCol + 0.5) / dc < (passiRiga + 0.5) / dr)) passiCol++
    else passiRiga++
    caselle.push({
      col: da.col + Math.sign(a.col - da.col) * passiCol,
      riga: da.riga + Math.sign(a.riga - da.riga) * passiRiga,
    })
  }
  return caselle
}

/**
 * Il terreno dentro i limiti. I boschetti stanno su un pianoro alla quota del
 * loro centro (del primo, per una famiglia), raccordato al resto da un anello
 * che scende o sale di un livello al massimo; dentro e attorno ai boschetti
 * niente acqua. Tra i boschetti di una famiglia il prato è piano e senza
 * rocce, così sembrano un bosco solo. Ogni famiglia è unita da un sentiero
 * alla più vicina di quelle messe prima.
 */
export function terreno(
  limiti: { minCol: number; maxCol: number; minRiga: number; maxRiga: number },
  pianori: readonly Pianoro[],
): Map<string, CasellaTerreno> {
  const caselle = new Map<string, CasellaTerreno>()
  for (let col = limiti.minCol; col <= limiti.maxCol; col++) {
    for (let riga = limiti.minRiga; riga <= limiti.maxRiga; riga++) {
      const q = quota(col, riga)
      caselle.set(chiave(col, riga), { col, riga, altezza: livello(q), tipo: q < ACQUA ? 'acqua' : 'prato' })
    }
  }

  const quote = new Map<string, number>()
  const membri = new Map<string, number>()
  for (const p of pianori) {
    if (!quote.has(p.famiglia)) quote.set(p.famiglia, livello(quota(p.col, p.riga)))
    membri.set(p.famiglia, (membri.get(p.famiglia) ?? 0) + 1)
  }
  const sottobosco = new Set<string>()

  for (const p of pianori) {
    const alto = quote.get(p.famiglia)!
    const famiglia = membri.get(p.famiglia)! > 1
    const r = Math.ceil(p.raggio) + 2
    for (let dc = -r; dc <= r; dc++) {
      for (let dr = -r; dr <= r; dr++) {
        const c = caselle.get(chiave(p.col + dc, p.riga + dr))
        if (!c || c.tipo === 'zolla') continue
        const d = Math.hypot(dc, dr)
        if (d <= p.raggio) {
          Object.assign(c, { altezza: alto, tipo: 'zolla', chiave: p.chiave })
        } else if (famiglia && d <= p.raggio + SOTTOBOSCO) {
          Object.assign(c, { altezza: alto, tipo: 'prato' })
          sottobosco.add(chiave(c.col, c.riga))
        } else if (d <= p.raggio + 2) {
          c.altezza = Math.min(Math.max(c.altezza, alto - 1), alto + 1)
          if (c.tipo === 'acqua') c.tipo = 'prato'
        }
      }
    }
  }

  // L'acqua sta sempre in basso.
  for (const c of caselle.values()) if (c.tipo === 'acqua') c.altezza = 0

  pianori.forEach((p, i) => {
    const prima = pianori.slice(0, i)
    if (prima.length === 0 || prima.some((q) => q.famiglia === p.famiglia)) return
    const vicino = prima.reduce((a, b) =>
      Math.hypot(a.col - p.col, a.riga - p.riga) <= Math.hypot(b.col - p.col, b.riga - p.riga) ? a : b,
    )
    for (const { col, riga } of linea(p, vicino)) {
      const c = caselle.get(chiave(col, riga))
      if (c && c.tipo !== 'zolla') c.tipo = 'sentiero'
    }
  })

  for (const c of caselle.values()) {
    if (sottobosco.has(chiave(c.col, c.riga))) continue
    if (c.tipo === 'prato' && c.altezza >= 2 && sorteggio(c.col, c.riga, SEED_ROCCE) < ROCCE) c.tipo = 'roccia'
  }

  return caselle
}

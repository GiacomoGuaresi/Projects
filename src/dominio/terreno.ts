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

/** Un boschetto, come serve al terreno: le caselle della sua zolla. */
export interface Pianoro {
  chiave: string
  caselle: readonly { col: number; riga: number }[]
}

export const LIVELLI = 4
/** Sotto questa quota c'è acqua. */
const ACQUA = 0.12
/** Le soglie tra un livello e il successivo. */
const SOGLIE = [0.42, 0.56, 0.68]
/** Fin dove arriva il sottobosco piano, senza rocce, attorno alla foresta. */
const SOTTOBOSCO = 1.5
/** Fin dove il terreno si raccorda alla foresta, di un livello al massimo. */
const RACCORDO = 2
/** Le rocce, sulle caselle alte: una su tante. */
const ROCCE = 0.03
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

/**
 * Il terreno dentro i limiti. Tutta la foresta sta su un pianoro solo, alla
 * quota della prima zolla, raccordato al resto da un anello che scende o sale
 * di un livello al massimo; dentro e attorno alla foresta niente acqua, e al
 * margine il sottobosco è piano e senza rocce. I `sentieri` sono di terra
 * battuta, alla quota della foresta.
 */
export function terreno(
  limiti: { minCol: number; maxCol: number; minRiga: number; maxRiga: number },
  pianori: readonly Pianoro[],
  sentieri: readonly { col: number; riga: number }[] = [],
): Map<string, CasellaTerreno> {
  const caselle = new Map<string, CasellaTerreno>()
  for (let col = limiti.minCol; col <= limiti.maxCol; col++) {
    for (let riga = limiti.minRiga; riga <= limiti.maxRiga; riga++) {
      const q = quota(col, riga)
      caselle.set(chiave(col, riga), { col, riga, altezza: livello(q), tipo: q < ACQUA ? 'acqua' : 'prato' })
    }
  }

  const zolle = pianori.flatMap((p) => p.caselle.map((c) => ({ ...c, chiave: p.chiave })))
  const sottobosco = new Set<string>()
  if (zolle.length > 0) {
    const alto = livello(quota(zolle[0].col, zolle[0].riga))
    for (const z of zolle) {
      const c = caselle.get(chiave(z.col, z.riga))
      if (c) Object.assign(c, { altezza: alto, tipo: 'zolla', chiave: z.chiave })
    }

    // Quanto dista dalla foresta ogni casella dell'anello attorno.
    const distanze = new Map<string, number>()
    for (const z of zolle) {
      for (let dc = -RACCORDO; dc <= RACCORDO; dc++) {
        for (let dr = -RACCORDO; dr <= RACCORDO; dr++) {
          const k = chiave(z.col + dc, z.riga + dr)
          const d = Math.hypot(dc, dr)
          if (d <= RACCORDO && d < (distanze.get(k) ?? Infinity)) distanze.set(k, d)
        }
      }
    }
    for (const [k, d] of distanze) {
      const c = caselle.get(k)
      if (!c || c.tipo === 'zolla') continue
      if (d <= SOTTOBOSCO) {
        Object.assign(c, { altezza: alto, tipo: 'prato' })
        sottobosco.add(k)
      } else {
        c.altezza = Math.min(Math.max(c.altezza, alto - 1), alto + 1)
        if (c.tipo === 'acqua') c.tipo = 'prato'
      }
    }
    for (const { col, riga } of sentieri) {
      const c = caselle.get(chiave(col, riga))
      if (c && c.tipo !== 'zolla') Object.assign(c, { altezza: alto, tipo: 'sentiero' })
    }
  }

  // L'acqua sta sempre in basso.
  for (const c of caselle.values()) if (c.tipo === 'acqua') c.altezza = 0

  for (const c of caselle.values()) {
    if (sottobosco.has(chiave(c.col, c.riga))) continue
    if (c.tipo === 'prato' && c.altezza >= 2 && sorteggio(c.col, c.riga, SEED_ROCCE) < ROCCE) c.tipo = 'roccia'
  }

  return caselle
}

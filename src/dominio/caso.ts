// Il caso riproducibile: stesso seed, stessa sequenza. Lo usano lo sfondo
// (scripts/genera-sfondo.ts) e la foresta (foresta.ts), che deve disegnare
// sempre gli stessi alberi negli stessi posti.

/** Generatore pseudo-casuale con seed (mulberry32): numeri in [0, 1). */
export function generatore(seed: number): () => number {
  let stato = seed >>> 0
  return () => {
    stato = (stato + 0x6d2b79f5) >>> 0
    let t = stato
    t = Math.imul(t ^ (t >>> 15), t | 1)
    t ^= t + Math.imul(t ^ (t >>> 7), t | 61)
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
}

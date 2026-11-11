// Le feste della Foresta (doc/08-interfaccia.md, "Feste"): in certi giorni
// dell'anno la foresta si decora. Qui solo il calendario e dove mettere le
// decorazioni sul prato; il disegno sta in src/ui/foresta/Feste.tsx.

import type { Casella, Foresta } from './foresta'
import { sorteggio } from './terreno'

export const FESTE = ['natale', 'capodanno', 'epifania', 'carnevale', 'san_valentino', 'pasqua', 'halloween'] as const
export type Festa = (typeof FESTE)[number]

export const NOMI_FESTE: Record<Festa, string> = {
  natale: 'Natale',
  capodanno: 'Capodanno',
  epifania: 'Epifania',
  carnevale: 'Carnevale',
  san_valentino: 'San Valentino',
  pasqua: 'Pasqua',
  halloween: 'Halloween',
}

/** Il numero del giorno (giorni dal 1/1/1970), senza fusi né ora legale: `mese` da 0. */
const giorno = (anno: number, mese: number, dì: number) => Date.UTC(anno, mese, dì) / 86_400_000

/** Il giorno di Pasqua (algoritmo di Meeus per il calendario gregoriano), come numero del giorno. */
export function pasqua(anno: number): number {
  const a = anno % 19
  const b = Math.floor(anno / 100)
  const c = anno % 100
  const d = Math.floor(b / 4)
  const e = b % 4
  const f = Math.floor((b + 8) / 25)
  const g = Math.floor((b - f + 1) / 3)
  const h = (19 * a + b - d - g + 15) % 30
  const i = Math.floor(c / 4)
  const k = c % 4
  const l = (32 + 2 * e + 2 * i - h - k) % 7
  const m = Math.floor((a + 11 * h + 22 * l) / 451)
  const mese = Math.floor((h + l - 7 * m + 114) / 31)
  const dì = ((h + l - 7 * m + 114) % 31) + 1
  return giorno(anno, mese - 1, dì)
}

/** I periodi delle feste che toccano l'anno, estremi compresi. */
function periodi(anno: number): { festa: Festa; da: number; a: number }[] {
  const p = pasqua(anno)
  return [
    // Natale va dall'Immacolata all'Epifania: quello dell'anno prima finisce a gennaio.
    { festa: 'natale', da: giorno(anno - 1, 11, 8), a: giorno(anno, 0, 6) },
    { festa: 'natale', da: giorno(anno, 11, 8), a: giorno(anno + 1, 0, 6) },
    { festa: 'capodanno', da: giorno(anno - 1, 11, 31), a: giorno(anno, 0, 1) },
    { festa: 'capodanno', da: giorno(anno, 11, 31), a: giorno(anno + 1, 0, 1) },
    { festa: 'epifania', da: giorno(anno, 0, 6), a: giorno(anno, 0, 6) },
    // Il Carnevale ambrosiano: i dieci giorni fino al sabato dopo le Ceneri.
    { festa: 'carnevale', da: p - 52, a: p - 43 },
    { festa: 'san_valentino', da: giorno(anno, 1, 14), a: giorno(anno, 1, 14) },
    // Dalla Domenica delle Palme a Pasquetta.
    { festa: 'pasqua', da: p - 7, a: p + 1 },
    { festa: 'halloween', da: giorno(anno, 9, 24), a: giorno(anno, 9, 31) },
  ]
}

/**
 * La festa del giorno (nel fuso del dispositivo), o `null`. Se due feste si
 * sovrappongono vince la più breve: Capodanno ed Epifania su Natale, San
 * Valentino sul Carnevale.
 */
export function festa(data: Date): Festa | null {
  const oggi = giorno(data.getFullYear(), data.getMonth(), data.getDate())
  const attive = periodi(data.getFullYear()).filter((p) => p.da <= oggi && oggi <= p.a)
  if (attive.length === 0) return null
  return attive.reduce((breve, p) => (p.a - p.da < breve.a - breve.da ? p : breve)).festa
}

// Sul prato --------------------------------------------------------------------------

/** Una decorazione sul prato, sulla sua casella e alla sua altezza. */
export interface Decoro extends Casella {
  altezza: number
  seed: number
}

/**
 * Dove mettere le decorazioni sul prato (pacchi, uova, zucche): sulle caselle
 * di prato libere (senza arbusti né rocce) a due passi al massimo dalla
 * foresta, sempre le stesse a parità di foresta. Una ogni otto alberi, da 3 a 24.
 */
export function postiDecori(foresta: Foresta, seed: number): Decoro[] {
  const piante = foresta.elementi.filter((e) => e.tipo === 'albero')
  if (piante.length === 0) return []
  const prese = new Set(foresta.elementi.map((e) => `${e.col},${e.riga}`))
  const zolle = foresta.caselle.filter((c) => c.tipo === 'zolla')
  const vicina = (c: Casella) => zolle.some((z) => Math.hypot(z.col - c.col, z.riga - c.riga) <= 2)
  const quanti = Math.min(24, Math.max(3, Math.round(piante.length / 8)))
  return foresta.caselle
    .filter((c) => c.tipo === 'prato' && !prese.has(`${c.col},${c.riga}`) && vicina(c))
    .map((c) => ({ c, n: sorteggio(c.col, c.riga, seed) }))
    .sort((a, b) => a.n - b.n)
    .slice(0, quanti)
    .map(({ c }, i) => ({ col: c.col, riga: c.riga, altezza: c.altezza, seed: seed + i }))
}

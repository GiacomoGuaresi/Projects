// La foresta (doc/08-interfaccia.md, "Foresta"): ogni attività è una pianta
// che cresce col suo stato (germoglio da fare, alberello in corso, albero
// completo, albero secco bloccato), le piante dello stesso progetto formano un
// boschetto, le faccende fatte sono arbusti sparsi. Qui solo la disposizione su una griglia di
// caselle e la proiezione isometrica; il disegno sta in src/ui/foresta.

import { generatore } from './caso'
import { chiaveProgetto, tonalita } from './progetto'
import type { Attivita, Stato } from './tipi'

export type AlberoForesta = Pick<Attivita, 'id' | 'titolo' | 'progetto' | 'stato' | 'priorita' | 'creata_il'>

/** Le piante di un progetto, dalla prima attività creata all'ultima. */
export interface Boschetto {
  /** `chiaveProgetto()`, oppure '' per le attività senza progetto. */
  chiave: string
  /** La grafia più usata, oppure "Sparsi". */
  nome: string
  alberi: AlberoForesta[]
}

export const SENZA_PROGETTO = 'Sparsi'

// Per data di creazione, che non cambia: una pianta che cresce o si secca
// resta al suo posto.
const prima = (a: AlberoForesta, b: AlberoForesta) => a.creata_il.localeCompare(b.creata_il) || a.id - b.id

/**
 * Tutte le attività raggruppate per progetto, senza distinguere maiuscole e
 * minuscole. I boschetti più vecchi (prima attività creata prima) vengono
 * prima, così stanno al centro della foresta.
 */
export function boschetti(attivita: readonly Attivita[]): Boschetto[] {
  type Gruppo = { grafie: Map<string, number>; alberi: AlberoForesta[] }
  const gruppi = new Map<string, Gruppo>()
  for (const a of attivita) {
    const nome = a.progetto?.trim() ?? ''
    const chiave = nome ? chiaveProgetto(nome) : ''
    const gruppo: Gruppo = gruppi.get(chiave) ?? { grafie: new Map(), alberi: [] }
    if (nome) gruppo.grafie.set(nome, (gruppo.grafie.get(nome) ?? 0) + 1)
    const { id, titolo, progetto, stato, priorita, creata_il } = a
    gruppo.alberi.push({ id, titolo, progetto, stato, priorita, creata_il })
    gruppi.set(chiave, gruppo)
  }

  return [...gruppi]
    .map(([chiave, { grafie, alberi }]) => {
      const [nome] = [...grafie].reduce<[string, number]>(
        (migliore, grafia) =>
          grafia[1] > migliore[1] || (grafia[1] === migliore[1] && grafia[0] < migliore[0]) ? grafia : migliore,
        [SENZA_PROGETTO, 0],
      )
      return { chiave, nome, alberi: alberi.sort(prima) }
    })
    .sort((a, b) => prima(a.alberi[0], b.alberi[0]) || a.chiave.localeCompare(b.chiave))
}

// Griglia ------------------------------------------------------------------------

export interface Casella {
  col: number
  riga: number
}

interface Scostamento extends Casella {
  /** Distanza dal centro, al quadrato. */
  d2: number
}

let spirale: Scostamento[] = []
let raggioSpirale = 0

/**
 * Le caselle attorno al centro, dalla più vicina alla più lontana (a parità,
 * in senso orario): l'albero n-esimo di un boschetto va sempre nella casella
 * n-esima, quindi piantarne uno nuovo non sposta gli altri.
 */
function caselleFino(raggio: number): Scostamento[] {
  if (raggio <= raggioSpirale) return spirale
  raggioSpirale = Math.max(raggio, raggioSpirale * 2, 16)
  const celle: Scostamento[] = []
  for (let col = -raggioSpirale; col <= raggioSpirale; col++) {
    for (let riga = -raggioSpirale; riga <= raggioSpirale; riga++) {
      const d2 = col * col + riga * riga
      if (d2 <= raggioSpirale * raggioSpirale) celle.push({ col, riga, d2 })
    }
  }
  celle.sort((a, b) => a.d2 - b.d2 || Math.atan2(a.riga, a.col) - Math.atan2(b.riga, b.col))
  spirale = celle
  return spirale
}

/** Le prime `n` caselle della spirale, allargandola se serve. */
function primeCaselle(n: number): Scostamento[] {
  let raggio = Math.max(1, Math.ceil(Math.sqrt(n / Math.PI)) + 1)
  while (caselleFino(raggio).length < n) raggio *= 2
  return caselleFino(raggio).slice(0, n)
}

// Disposizione ---------------------------------------------------------------------

/** Lo spazio libero tra due boschetti, in caselle: il sentiero e l'etichetta. */
const SENTIERO = 3
/** Seed fisso degli arbusti: lo stesso conto dà sempre gli stessi posti. */
const SEED_ARBUSTI = 20261002

export interface Lotto {
  chiave: string
  nome: string
  /** Il centro del boschetto. */
  col: number
  riga: number
  /** Il raggio della zolla, in caselle. */
  raggio: number
  alberi: number
}

export type Elemento =
  | ({ tipo: 'zolla'; chiave: string } & Casella)
  | ({ tipo: 'albero'; chiave: string; albero: AlberoForesta } & Casella)
  | ({ tipo: 'arbusto'; seed: number } & Casella)

export interface Foresta {
  lotti: Lotto[]
  /** Zolle, alberi e arbusti, già in ordine di disegno (da dietro in avanti). */
  elementi: Elemento[]
  /** Le caselle estreme, prato compreso. */
  limiti: { minCol: number; maxCol: number; minRiga: number; maxRiga: number }
}

const chiaveCasella = (col: number, riga: number) => `${col},${riga}`

/** Un numero fisso per casella: ordina i posti candidati per gli arbusti. */
function sorteggio(col: number, riga: number): number {
  return generatore(Math.imul(col, 73856093) ^ Math.imul(riga, 19349663) ^ SEED_ARBUSTI)()
}

/**
 * Mette i boschetti su una griglia a partire dal centro: ciascuno occupa un
 * disco di caselle (la zolla) con gli alberi a spirale, e va nella prima
 * posizione della spirale grande che non tocca i boschetti già messi. Gli
 * arbusti finiscono sulle caselle libere attorno, sempre nello stesso ordine.
 */
export function disponi(gruppi: readonly Boschetto[], arbusti: number): Foresta {
  const lotti: Lotto[] = []
  const elementi: Elemento[] = []
  const occupate = new Set<string>()

  for (const gruppo of gruppi) {
    const posti = primeCaselle(gruppo.alberi.length)
    const raggio = Math.sqrt(posti[posti.length - 1].d2)
    const centro = trovaPosto(lotti, raggio)
    lotti.push({ chiave: gruppo.chiave, nome: gruppo.nome, ...centro, raggio, alberi: gruppo.alberi.length })

    for (const c of caselleFino(Math.ceil(raggio))) {
      if (c.d2 > raggio * raggio) break
      const col = centro.col + c.col
      const riga = centro.riga + c.riga
      occupate.add(chiaveCasella(col, riga))
      elementi.push({ tipo: 'zolla', chiave: gruppo.chiave, col, riga })
    }
    gruppo.alberi.forEach((albero, i) =>
      elementi.push({
        tipo: 'albero',
        chiave: gruppo.chiave,
        albero,
        col: centro.col + posti[i].col,
        riga: centro.riga + posti[i].riga,
      }),
    )
  }

  // Il prato: i boschetti più un bordo, allargato finché gli arbusti stanno
  // radi (al massimo una casella libera su due).
  const bordo = lotti.reduce(
    (b, l) => ({
      minCol: Math.min(b.minCol, Math.floor(l.col - l.raggio)),
      maxCol: Math.max(b.maxCol, Math.ceil(l.col + l.raggio)),
      minRiga: Math.min(b.minRiga, Math.floor(l.riga - l.raggio)),
      maxRiga: Math.max(b.maxRiga, Math.ceil(l.riga + l.raggio)),
    }),
    { minCol: 0, maxCol: 0, minRiga: 0, maxRiga: 0 },
  )
  let margine = 2
  let libere: Casella[] = []
  for (;;) {
    libere = []
    for (let col = bordo.minCol - margine; col <= bordo.maxCol + margine; col++) {
      for (let riga = bordo.minRiga - margine; riga <= bordo.maxRiga + margine; riga++) {
        if (!occupate.has(chiaveCasella(col, riga))) libere.push({ col, riga })
      }
    }
    if (libere.length >= arbusti * 2) break
    margine++
  }
  libere
    .map((c) => ({ ...c, n: sorteggio(c.col, c.riga) }))
    .sort((a, b) => a.n - b.n)
    .slice(0, arbusti)
    .forEach(({ col, riga }, seed) => elementi.push({ tipo: 'arbusto', seed, col, riga }))

  return {
    lotti,
    elementi: elementi.sort(inProfondita),
    limiti: {
      minCol: bordo.minCol - margine,
      maxCol: bordo.maxCol + margine,
      minRiga: bordo.minRiga - margine,
      maxRiga: bordo.maxRiga + margine,
    },
  }
}

/** Il primo centro, lungo la spirale, lontano abbastanza da tutti i lotti. */
function trovaPosto(lotti: readonly Lotto[], raggio: number): Casella {
  for (let r = 8; ; r *= 2) {
    for (const c of caselleFino(r)) {
      const libero = lotti.every(
        (l) => Math.hypot(l.col - c.col, l.riga - c.riga) >= l.raggio + raggio + SENTIERO,
      )
      if (libero) return { col: c.col, riga: c.riga }
    }
  }
}

/** Prima le zolle, poi il resto da dietro (in alto) in avanti (in basso). */
function inProfondita(a: Elemento, b: Elemento): number {
  const piatta = (e: Elemento) => (e.tipo === 'zolla' ? 0 : 1)
  return piatta(a) - piatta(b) || a.col + a.riga - (b.col + b.riga) || a.col - b.col
}

// Colore della zolla -------------------------------------------------------------------

/**
 * Il verde della zolla di un boschetto: sempre un verde (dall'oliva al verde
 * acqua), diverso da progetto a progetto e sempre lo stesso per lo stesso
 * progetto. Tonalità, saturazione e luminosità variano insieme, così anche
 * due tonalità vicine si distinguono. Le attività senza progetto hanno un
 * verde oliva spento.
 */
export function verdeZolla(chiave: string): { h: number; s: number; l: number } {
  if (!chiave) return { h: 70, s: 22, l: 60 }
  const t = tonalita(chiave)
  return { h: 75 + (t % 90), s: 30 + ((t * 7) % 21), l: 50 + ((t * 13) % 13) }
}

// Proiezione -------------------------------------------------------------------------

/** La larghezza di una casella sullo schermo; l'altezza è la metà (rombo 2:1). */
export const LATO = 32

/** Il centro della casella sullo schermo, in vista isometrica. */
export function proietta(col: number, riga: number): { x: number; y: number } {
  return { x: ((col - riga) * LATO) / 2, y: ((col + riga) * LATO) / 4 }
}

// Statistiche ----------------------------------------------------------------------

/** I numeri di un bosco: tutte le attività del progetto, non solo gli alberi. */
export interface StatisticheBosco {
  totale: number
  perStato: Record<Stato, number>
  /** Le completate sul totale, da 0 a 100. */
  percentuale: number
  /** Il primo e l'ultimo albero piantato. */
  primo: string | null
  ultimo: string | null
}

/** Le statistiche del bosco con questa chiave ('' per le attività senza progetto). */
export function statisticheBosco(attivita: readonly Attivita[], chiave: string): StatisticheBosco {
  const perStato: Record<Stato, number> = { da_fare: 0, in_corso: 0, bloccato: 0, completo: 0 }
  const date: string[] = []
  for (const a of attivita) {
    const nome = a.progetto?.trim() ?? ''
    if ((nome ? chiaveProgetto(nome) : '') !== chiave) continue
    perStato[a.stato]++
    if (a.stato === 'completo' && a.completata_il) date.push(a.completata_il)
  }
  const totale = perStato.da_fare + perStato.in_corso + perStato.bloccato + perStato.completo
  date.sort()
  return {
    totale,
    perStato,
    percentuale: totale ? Math.round((perStato.completo / totale) * 100) : 0,
    primo: date[0] ?? null,
    ultimo: date[date.length - 1] ?? null,
  }
}

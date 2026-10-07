// La foresta (doc/08-interfaccia.md, "Foresta"): ogni attività è una pianta
// che cresce col suo stato (germoglio da fare, alberello in corso, albero
// completo, albero secco bloccato), le piante dello stesso progetto formano un
// boschetto, le faccende fatte sono arbusti sparsi. I boschetti della stessa
// famiglia ("Software / Projects", "Software / Grocery") stanno attaccati, come
// un bosco solo. Qui solo la disposizione su una griglia di caselle e la
// proiezione isometrica; il disegno sta in src/ui/foresta.

import { chiaveProgetto, famigliaProgetto, tonalita } from './progetto'
import { sorteggio, terreno, type CasellaTerreno } from './terreno'
import type { Attivita, Stato } from './tipi'

export type AlberoForesta = Pick<Attivita, 'id' | 'titolo' | 'progetto' | 'stato' | 'priorita' | 'creata_il' | 'modificata_il'>

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
    const { id, titolo, progetto, stato, priorita, creata_il, modificata_il } = a
    gruppo.alberi.push({ id, titolo, progetto, stato, priorita, creata_il, modificata_il })
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
const SENTIERO = 2
/** Lo spazio tra due boschetti della stessa famiglia: un filo di prato, così sembrano un bosco solo. */
const SENTIERO_FAMIGLIA = 1
/** Seed fisso degli arbusti: lo stesso conto dà sempre gli stessi posti. */
const SEED_ARBUSTI = 20261002

export interface Lotto {
  chiave: string
  /** `famigliaProgetto(chiave)`: i lotti della stessa famiglia stanno vicini. */
  famiglia: string
  nome: string
  /** Il centro del boschetto. */
  col: number
  riga: number
  /** Il raggio della zolla, in caselle. */
  raggio: number
  /** Il livello del pianoro. */
  altezza: number
  alberi: number
}

/** Quello che sta sopra il terreno, ciascuno sulla sua casella e alla sua altezza. */
export type Elemento =
  | ({ tipo: 'albero'; chiave: string; albero: AlberoForesta; altezza: number } & Casella)
  | ({ tipo: 'arbusto'; seed: number; altezza: number } & Casella)
  | ({ tipo: 'roccia'; seed: number; altezza: number } & Casella)

export interface Foresta {
  lotti: Lotto[]
  /** Tutte le caselle del prato, in ordine di disegno (da dietro in avanti). */
  caselle: CasellaTerreno[]
  /** Alberi, arbusti e rocce, in ordine di disegno. */
  elementi: Elemento[]
  /** Le caselle estreme, prato compreso. */
  limiti: { minCol: number; maxCol: number; minRiga: number; maxRiga: number }
}

const chiaveCasella = (col: number, riga: number) => `${col},${riga}`

/**
 * Mette i boschetti su una griglia a partire dal centro: ciascuno occupa un
 * disco di caselle (la zolla) con gli alberi a spirale. I boschetti della
 * stessa famiglia si compongono prima tra loro, quasi attaccati; poi la
 * famiglia, come un disco solo, va nella prima posizione della spirale grande
 * che non tocca le famiglie già messe. Attorno il terreno (colline, acqua,
 * sentieri, rocce); gli arbusti finiscono sul prato libero, sempre nello
 * stesso ordine.
 */
export function disponi(gruppi: readonly Boschetto[], arbusti: number): Foresta {
  const lotti: Omit<Lotto, 'altezza'>[] = []
  const piante: { chiave: string; albero: AlberoForesta; col: number; riga: number }[] = []

  // Le famiglie, nell'ordine del loro boschetto più vecchio.
  const famiglie = new Map<string, Boschetto[]>()
  for (const gruppo of gruppi) {
    const famiglia = famigliaProgetto(gruppo.chiave)
    famiglie.set(famiglia, [...(famiglie.get(famiglia) ?? []), gruppo])
  }

  const messe: Pick<Lotto, 'col' | 'riga' | 'raggio'>[] = []
  for (const [famiglia, membri] of famiglie) {
    // I boschetti della famiglia attorno al primo, a un passo l'uno dall'altro.
    const locali: (Pick<Lotto, 'col' | 'riga' | 'raggio'> & { gruppo: Boschetto; posti: Scostamento[] })[] = []
    for (const gruppo of membri) {
      const posti = primeCaselle(gruppo.alberi.length)
      const raggio = Math.sqrt(posti[posti.length - 1].d2)
      locali.push({ gruppo, posti, raggio, ...trovaPosto(locali, raggio, SENTIERO_FAMIGLIA) })
    }
    const ingombro = Math.max(...locali.map((l) => Math.hypot(l.col, l.riga) + l.raggio))
    const centro = trovaPosto(messe, ingombro, SENTIERO)
    messe.push({ ...centro, raggio: ingombro })

    for (const { gruppo, posti, raggio, ...locale } of locali) {
      const col = centro.col + locale.col
      const riga = centro.riga + locale.riga
      lotti.push({ chiave: gruppo.chiave, famiglia, nome: gruppo.nome, col, riga, raggio, alberi: gruppo.alberi.length })
      gruppo.alberi.forEach((albero, i) =>
        piante.push({ chiave: gruppo.chiave, albero, col: col + posti[i].col, riga: riga + posti[i].riga }),
      )
    }
  }

  // Il prato: i boschetti più un bordo, allargato finché gli arbusti stanno
  // radi (al massimo una casella di prato libera su due).
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
  let limiti = bordo
  let mappa: Map<string, CasellaTerreno>
  let libere: CasellaTerreno[]
  for (;;) {
    limiti = {
      minCol: bordo.minCol - margine,
      maxCol: bordo.maxCol + margine,
      minRiga: bordo.minRiga - margine,
      maxRiga: bordo.maxRiga + margine,
    }
    mappa = terreno(limiti, lotti)
    libere = [...mappa.values()].filter((c) => c.tipo === 'prato')
    if (libere.length >= arbusti * 2) break
    margine++
  }

  const altezza = (col: number, riga: number) => mappa.get(chiaveCasella(col, riga))?.altezza ?? 0
  const elementi: Elemento[] = [
    ...piante.map((p) => ({ tipo: 'albero' as const, ...p, altezza: altezza(p.col, p.riga) })),
    ...libere
      .map((c) => ({ c, n: sorteggio(c.col, c.riga, SEED_ARBUSTI) }))
      .sort((a, b) => a.n - b.n)
      .slice(0, arbusti)
      .map(({ c }, seed) => ({ tipo: 'arbusto' as const, seed, col: c.col, riga: c.riga, altezza: c.altezza })),
    ...[...mappa.values()]
      .filter((c) => c.tipo === 'roccia')
      .map((c) => ({
        tipo: 'roccia' as const,
        seed: Math.floor(sorteggio(c.col, c.riga, 1) * 1e6),
        col: c.col,
        riga: c.riga,
        altezza: c.altezza,
      })),
  ]

  return {
    lotti: lotti.map((l) => ({ ...l, altezza: altezza(l.col, l.riga) })),
    caselle: [...mappa.values()].sort(inProfondita),
    elementi: elementi.sort(inProfondita),
    limiti,
  }
}

/** Il primo centro, lungo la spirale, lontano almeno `distacco` caselle da tutti i dischi. */
function trovaPosto(
  dischi: readonly Pick<Lotto, 'col' | 'riga' | 'raggio'>[],
  raggio: number,
  distacco: number,
): Casella {
  for (let r = 8; ; r *= 2) {
    for (const c of caselleFino(r)) {
      const libero = dischi.every(
        (l) => Math.hypot(l.col - c.col, l.riga - c.riga) >= l.raggio + raggio + distacco,
      )
      if (libero) return { col: c.col, riga: c.riga }
    }
  }
}

/** Da dietro (in alto) in avanti (in basso): la profondità è `col + riga`. */
export function inProfondita(a: Casella, b: Casella): number {
  return a.col + a.riga - (b.col + b.riga) || a.col - b.col
}

// Colore della zolla -------------------------------------------------------------------

/**
 * Il verde della zolla di un boschetto: sempre un verde (dall'oliva al verde
 * acqua), diverso da progetto a progetto e sempre lo stesso per lo stesso
 * progetto. Tonalità, saturazione e luminosità variano insieme, così anche
 * due tonalità vicine si distinguono. I boschetti di una famiglia partono
 * dalla tonalità della famiglia e se ne scostano di poco: si vede che sono
 * parenti. Le attività senza progetto hanno un verde oliva spento.
 */
export function verdeZolla(chiave: string): { h: number; s: number; l: number } {
  if (!chiave) return { h: 70, s: 22, l: 60 }
  const t = tonalita(chiave)
  const famiglia = famigliaProgetto(chiave)
  const base = 75 + (tonalita(famiglia) % 90)
  const h = famiglia === chiave ? base : Math.min(165, Math.max(75, base + (t % 21) - 10))
  return { h, s: 30 + ((t * 7) % 21), l: 50 + ((t * 13) % 13) }
}

// Proiezione -------------------------------------------------------------------------

/** La larghezza di una casella sullo schermo; l'altezza è la metà (rombo 2:1). */
export const LATO = 32

/** Quanto sale sullo schermo un livello di terreno, in px. */
export const GRADINO = 6

/** Il centro della casella sullo schermo, in vista isometrica, alla sua altezza. */
export function proietta(col: number, riga: number, altezza = 0): { x: number; y: number } {
  return { x: ((col - riga) * LATO) / 2, y: ((col + riga) * LATO) / 4 - altezza * GRADINO }
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

// Numeri -------------------------------------------------------------------------

/** I numeri di tutta la foresta: il pannello del titolo e l'overlay dello sfondo. */
export interface NumeriForesta {
  /** Le attività completate. */
  alberi: number
  boschetti: number
  /** Le faccende fatte; `null` se il conto non è arrivato. */
  arbusti: number | null
  /** Da fare e in corso. */
  inCrescita: number
  /** Bloccate. */
  secchi: number
  /** Le completate su tutte le attività, da 0 a 100. */
  percentuale: number
  /** Gli alberi piantati negli ultimi 7 giorni. */
  settimana: number
  /** Quando è stato piantato l'ultimo albero. */
  ultimo: string | null
}

const SETTIMANA = 7 * 86_400_000

export function numeriForesta(attivita: readonly Attivita[], arbusti: number | null, adesso = new Date()): NumeriForesta {
  let alberi = 0
  let inCrescita = 0
  let secchi = 0
  let settimana = 0
  let ultimo: string | null = null
  for (const a of attivita) {
    if (a.stato === 'completo') {
      alberi++
      if (a.completata_il) {
        if (adesso.getTime() - new Date(a.completata_il).getTime() < SETTIMANA) settimana++
        if (!ultimo || a.completata_il > ultimo) ultimo = a.completata_il
      }
    } else if (a.stato === 'bloccato') secchi++
    else inCrescita++
  }
  return {
    alberi,
    boschetti: boschetti(attivita).length,
    arbusti,
    inCrescita,
    secchi,
    percentuale: attivita.length ? Math.round((alberi / attivita.length) * 100) : 0,
    settimana,
    ultimo,
  }
}

/** "oggi", "ieri", "3 giorni fa": i giorni di calendario tra la data e adesso, nel fuso locale. */
export function quandoFa(iso: string, adesso = new Date()): string {
  const mezzanotte = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate()).getTime()
  const giorni = Math.round((mezzanotte(adesso) - mezzanotte(new Date(iso))) / 86_400_000)
  if (giorni <= 0) return 'oggi'
  if (giorni === 1) return 'ieri'
  return `${giorni} giorni fa`
}

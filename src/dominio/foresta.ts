// La foresta (doc/08-interfaccia.md, "Foresta"): ogni attività è una pianta
// che cresce col suo stato (germoglio da fare, alberello in corso, albero
// completo, alberello anche bloccato), le piante dello stesso progetto formano
// un boschetto della stessa specie, le faccende fatte sono arbusti di sottobosco. I boschetti stanno
// tutti attaccati, una foresta sola; quelli della stessa famiglia ("Software /
// Projects", "Software / Grocery") uno accanto all'altro. Qui solo la
// disposizione su una griglia di caselle e la proiezione isometrica; il
// disegno sta in src/ui/foresta.

import { chiaveProgetto, famigliaProgetto, tonalita } from './progetto'
import { sorteggio, terreno, type CasellaTerreno, type Pianoro } from './terreno'
import type { Attivita, Stato } from './tipi'

export type AlberoForesta = Pick<Attivita, 'id' | 'titolo' | 'progetto' | 'stato' | 'creata_il' | 'modificata_il'>

/** Le piante di un progetto, dalla prima attività creata all'ultima. */
export interface Boschetto {
  /** `chiaveProgetto()`, oppure '' per le attività senza progetto. */
  chiave: string
  /** La grafia più usata, oppure "Sparsi". */
  nome: string
  alberi: AlberoForesta[]
}

export const SENZA_PROGETTO = 'Sparsi'

// Per data di creazione, che non cambia: una pianta che cresce o si blocca
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
    const { id, titolo, progetto, stato, creata_il, modificata_il } = a
    gruppo.alberi.push({ id, titolo, progetto, stato, creata_il, modificata_il })
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

// Specie ---------------------------------------------------------------------------

export const SPECIE = [
  'conifera',
  'tonda',
  'betulla',
  'cipresso',
  'quercia',
  'salice',
  'pioppo',
  'pino',
  'acero',
  'larice',
  'ciliegio',
  'ulivo',
] as const
export type Specie = (typeof SPECIE)[number]

/**
 * La specie degli alberi di ogni boschetto, dal nome della sua famiglia: i
 * boschetti di una famiglia ("Software / Projects", "Software / Grocery",
 * "Software") hanno tutti la stessa. Ogni famiglia la sua finché bastano, poi
 * si ripetono il meno possibile. Si sceglie dalla più vecchia, quindi un
 * progetto nuovo non cambia la specie degli altri. Gli Sparsi non ci sono: i
 * loro alberi restano misti, la specie la dà l'id.
 */
export function specieBoschetti(gruppi: readonly Boschetto[]): Map<string, Specie> {
  const specie = new Map<string, Specie>()
  const famiglie = new Map<string, Specie>()
  const usate = SPECIE.map(() => 0)
  for (const { chiave } of gruppi) {
    if (!chiave) continue
    const famiglia = famigliaProgetto(chiave)
    let sua = famiglie.get(famiglia)
    if (!sua) {
      const minimo = Math.min(...usate)
      // Dalla preferita in avanti, la prima tra le meno usate.
      let i = tonalita(famiglia) % SPECIE.length
      while (usate[i] !== minimo) i = (i + 1) % SPECIE.length
      usate[i]++
      sua = SPECIE[i]
      famiglie.set(famiglia, sua)
    }
    specie.set(chiave, sua)
  }
  return specie
}

// Griglia ------------------------------------------------------------------------

export interface Casella {
  col: number
  riga: number
}

const chiaveCasella = (col: number, riga: number) => `${col},${riga}`

const VICINE = [
  [1, 0],
  [-1, 0],
  [0, 1],
  [0, -1],
] as const

/** Le otto caselle attorno, angoli compresi. */
const ATTORNO = [...VICINE, [1, 1], [1, -1], [-1, 1], [-1, -1]] as const

/** La casella più vicina a `verso`; a parità di distanza, in senso orario. */
function piuVicina(candidate: Iterable<Casella>, verso: { col: number; riga: number }): Casella {
  let migliore: Casella | null = null
  let distanza = Infinity
  let angolo = Infinity
  for (const c of candidate) {
    const d = Math.hypot(c.col - verso.col, c.riga - verso.riga)
    const a = Math.atan2(c.riga - verso.riga, c.col - verso.col)
    if (d < distanza - 1e-9 || (Math.abs(d - distanza) <= 1e-9 && a < angolo)) {
      migliore = c
      distanza = d
      angolo = a
    }
  }
  return migliore!
}

function baricentro(caselle: readonly Casella[]): { col: number; riga: number } {
  const col = caselle.reduce((s, c) => s + c.col, 0) / caselle.length
  const riga = caselle.reduce((s, c) => s + c.riga, 0) / caselle.length
  return { col, riga }
}

/** Le caselle libere attaccate per lato a quelle di `caselle`. */
function contorno(caselle: Iterable<Casella>, occupate: ReadonlyMap<string, Casella>): Casella[] {
  const libere = new Map<string, Casella>()
  for (const c of caselle) {
    for (const [dc, dr] of VICINE) {
      const k = chiaveCasella(c.col + dc, c.riga + dr)
      if (!occupate.has(k)) libere.set(k, { col: c.col + dc, riga: c.riga + dr })
    }
  }
  return [...libere.values()]
}

/** Le caselle libere appena oltre il sentiero che gira attorno alla foresta. */
function oltreIlSentiero(occupate: ReadonlyMap<string, Casella>): Casella[] {
  const sentiero = new Map<string, Casella>()
  for (const c of occupate.values()) {
    for (const [dc, dr] of ATTORNO) {
      const k = chiaveCasella(c.col + dc, c.riga + dr)
      if (!occupate.has(k)) sentiero.set(k, { col: c.col + dc, riga: c.riga + dr })
    }
  }
  return contorno(sentiero.values(), occupate).filter((c) => !sentiero.has(chiaveCasella(c.col, c.riga)))
}

/**
 * Le `n` caselle di un boschetto: dal seme si allarga sempre sulla casella
 * libera e `ammessa`, attaccata a quelle già prese, più vicina al seme. Si
 * incastra così tra i boschetti già messi. L'albero n-esimo va sempre nella
 * casella n-esima, quindi piantarne uno nuovo non sposta gli altri.
 */
function cresci(
  seme: Casella,
  n: number,
  occupate: Map<string, Casella>,
  ammessa: (c: Casella) => boolean,
): Casella[] {
  const prese: Casella[] = []
  const bordo = new Map<string, Casella>([[chiaveCasella(seme.col, seme.riga), seme]])
  while (prese.length < n) {
    const c = piuVicina(bordo.values(), seme)
    const k = chiaveCasella(c.col, c.riga)
    bordo.delete(k)
    occupate.set(k, c)
    prese.push(c)
    for (const [dc, dr] of VICINE) {
      const v = { col: c.col + dc, riga: c.riga + dr }
      const kv = chiaveCasella(v.col, v.riga)
      if (!occupate.has(kv) && ammessa(v)) bordo.set(kv, v)
    }
  }
  return prese
}

// Disposizione ---------------------------------------------------------------------

/** Le caselle di prato libere per arbusto: poche, così il prato è quasi tutto sottobosco. */
const PRATO_PER_ARBUSTO = 1.25
/** Seed fisso degli arbusti: lo stesso conto dà sempre gli stessi posti. */
const SEED_ARBUSTI = 20261002

export interface Lotto {
  chiave: string
  /** `famigliaProgetto(chiave)`: i lotti della stessa famiglia stanno vicini. */
  famiglia: string
  nome: string
  /** La casella del boschetto più vicina al suo baricentro: lì il nome e le farfalle. */
  col: number
  riga: number
  /** Il raggio di un disco con tante caselle quante il boschetto. */
  raggio: number
  /** Il livello del pianoro. */
  altezza: number
  alberi: number
}

/** Quello che sta sopra il terreno, ciascuno sulla sua casella e alla sua altezza. */
export type Elemento =
  | ({ tipo: 'albero'; chiave: string; albero: AlberoForesta; specie: Specie | null; altezza: number } & Casella)
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

/**
 * Una foresta sola e fitta: il primo boschetto parte dal centro e ognuno
 * cresce attaccato a quelli già messi. I boschetti di una famiglia si
 * toccano: il secondo parte dal bordo della famiglia, vicino al suo
 * baricentro. Tra famiglie diverse resta sempre una casella, il sentiero: un
 * boschetto non prende caselle che toccano, anche d'angolo, un'altra famiglia,
 * e una famiglia nuova parte appena oltre il sentiero, il più vicino
 * possibile al centro. I boschetti più vecchi stanno quindi al centro.
 * Attorno il terreno (colline, acqua, rocce); gli arbusti fanno da
 * sottobosco, più fitti al margine della foresta.
 */
export function disponi(gruppi: readonly Boschetto[], arbusti: number): Foresta {
  const lotti: Omit<Lotto, 'altezza'>[] = []
  const pianori: Pianoro[] = []
  const piante: { chiave: string; albero: AlberoForesta; specie: Specie | null; col: number; riga: number }[] = []
  const specie = specieBoschetti(gruppi)
  const occupate = new Map<string, Casella>()
  /** La famiglia di ogni casella occupata. */
  const diChi = new Map<string, string>()

  // Le famiglie, nell'ordine del loro boschetto più vecchio.
  const famiglie = new Map<string, Boschetto[]>()
  for (const gruppo of gruppi) {
    const famiglia = famigliaProgetto(gruppo.chiave)
    famiglie.set(famiglia, [...(famiglie.get(famiglia) ?? []), gruppo])
  }

  for (const [famiglia, membri] of famiglie) {
    const parenti: Casella[] = []
    // Ammesse le caselle che non toccano, nemmeno d'angolo, un'altra famiglia.
    const ammessa = (c: Casella) =>
      ATTORNO.every(([dc, dr]) => (diChi.get(chiaveCasella(c.col + dc, c.riga + dr)) ?? famiglia) === famiglia)
    for (const gruppo of membri) {
      let seme: Casella = { col: 0, riga: 0 }
      if (occupate.size) {
        // Attaccato ai fratelli; se sono chiusi tra i sentieri, o è il primo, oltre il sentiero.
        const vicino = parenti.length ? baricentro(parenti) : { col: 0, riga: 0 }
        const fratelli = contorno(parenti, occupate).filter(ammessa)
        seme = piuVicina(fratelli.length ? fratelli : oltreIlSentiero(occupate), vicino)
      }
      const caselle = cresci(seme, gruppo.alberi.length, occupate, ammessa)
      for (const c of caselle) diChi.set(chiaveCasella(c.col, c.riga), famiglia)
      parenti.push(...caselle)
      const centro = piuVicina(caselle, baricentro(caselle))
      lotti.push({
        chiave: gruppo.chiave,
        famiglia,
        nome: gruppo.nome,
        ...centro,
        raggio: Math.sqrt(caselle.length / Math.PI),
        alberi: gruppo.alberi.length,
      })
      pianori.push({ chiave: gruppo.chiave, caselle })
      const sua = specie.get(gruppo.chiave) ?? null
      gruppo.alberi.forEach((albero, i) => piante.push({ chiave: gruppo.chiave, albero, specie: sua, ...caselle[i] }))
    }
  }

  // Il sentiero: le caselle libere che toccano due famiglie diverse.
  const sentieri = new Map<string, Casella>()
  for (const c of occupate.values()) {
    for (const [dc, dr] of ATTORNO) {
      const v = { col: c.col + dc, riga: c.riga + dr }
      const k = chiaveCasella(v.col, v.riga)
      if (occupate.has(k) || sentieri.has(k)) continue
      const accanto = new Set<string>()
      for (const [ec, er] of ATTORNO) {
        const f = diChi.get(chiaveCasella(v.col + ec, v.riga + er))
        if (f !== undefined) accanto.add(f)
      }
      if (accanto.size >= 2) sentieri.set(k, v)
    }
  }

  // Il prato: la foresta più un bordo stretto, allargato finché gli arbusti ci stanno.
  const bordo = [...occupate.values()].reduce(
    (b, c) => ({
      minCol: Math.min(b.minCol, c.col),
      maxCol: Math.max(b.maxCol, c.col),
      minRiga: Math.min(b.minRiga, c.riga),
      maxRiga: Math.max(b.maxRiga, c.riga),
    }),
    { minCol: 0, maxCol: 0, minRiga: 0, maxRiga: 0 },
  )
  let margine = 1
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
    mappa = terreno(limiti, pianori, [...sentieri.values()])
    libere = [...mappa.values()].filter((c) => c.tipo === 'prato')
    if (libere.length >= arbusti * PRATO_PER_ARBUSTO) break
    margine++
  }

  // Gli arbusti prima vicino alla foresta, con un po' di caso perché il margine non sia una riga.
  const zolle = [...occupate.values()]
  const lontananza = (c: Casella) =>
    zolle.reduce((d, z) => Math.min(d, Math.hypot(z.col - c.col, z.riga - c.riga)), Infinity)
  const altezza = (col: number, riga: number) => mappa.get(chiaveCasella(col, riga))?.altezza ?? 0
  const elementi: Elemento[] = [
    ...piante.map((p) => ({ tipo: 'albero' as const, ...p, altezza: altezza(p.col, p.riga) })),
    ...libere
      .map((c) => ({ c, n: (zolle.length ? lontananza(c) : 0) + 2 * sorteggio(c.col, c.riga, SEED_ARBUSTI) }))
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
  bloccati: number
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
  let bloccati = 0
  let settimana = 0
  let ultimo: string | null = null
  for (const a of attivita) {
    if (a.stato === 'completo') {
      alberi++
      if (a.completata_il) {
        if (adesso.getTime() - new Date(a.completata_il).getTime() < SETTIMANA) settimana++
        if (!ultimo || a.completata_il > ultimo) ultimo = a.completata_il
      }
    } else if (a.stato === 'bloccato') bloccati++
    else inCrescita++
  }
  return {
    alberi,
    boschetti: boschetti(attivita).length,
    arbusti,
    inCrescita,
    bloccati,
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

// Ordinamento e sezioni della pagina Per stato (doc/08-interfaccia.md, "Per stato" e
// "Pagina Attività").

import { chiaveProgetto } from './progetto'
import { titoloSenzaTag } from './tag'
import type { Attivita, Stato } from './tipi'

const confrontaTesto = (a: string, b: string) => a.localeCompare(b, 'it', { sensitivity: 'base' })

/** Progetto A→Z (senza progetto in fondo), poi priorità decrescente, poi titolo. */
export function confrontaAttivita(a: Attivita, b: Attivita): number {
  if (a.progetto !== b.progetto) {
    if (a.progetto === null) return 1
    if (b.progetto === null) return -1
    const progetto = confrontaTesto(a.progetto, b.progetto)
    if (progetto !== 0) return progetto
  }
  return (
    b.priorita - a.priorita ||
    confrontaTesto(titoloSenzaTag(a.titolo), titoloSenzaTag(b.titolo)) ||
    a.id - b.id
  )
}

/** Le aperte con l'ordine di sempre; le completate in fondo, dalla più recente. */
export function ordinaAttivita(attivita: readonly Attivita[]): Attivita[] {
  return [...attivita].sort((a, b) => {
    const completaA = a.stato === 'completo'
    const completaB = b.stato === 'completo'
    if (completaA !== completaB) return completaA ? 1 : -1
    if (completaA && a.completata_il !== b.completata_il) {
      if (a.completata_il === null) return 1
      if (b.completata_il === null) return -1
      return b.completata_il.localeCompare(a.completata_il)
    }
    return confrontaAttivita(a, b)
  })
}

export interface SezionePerStato {
  stato: Exclude<Stato, 'completo'>
  titolo: string
  apertaDiDefault: boolean
  attivita: Attivita[]
}

const SEZIONI: readonly Omit<SezionePerStato, 'attivita'>[] = [
  { stato: 'in_corso', titolo: 'In corso', apertaDiDefault: true },
  { stato: 'da_fare', titolo: 'Da fare', apertaDiDefault: false },
  { stato: 'bloccato', titolo: 'Bloccate', apertaDiDefault: false },
]

/** Le tre sezioni della pagina Per stato, ciascuna con le sue attività in ordine. */
export function sezioniPerStato(attivita: readonly Attivita[]): SezionePerStato[] {
  return SEZIONI.map((sezione) => ({
    ...sezione,
    attivita: attivita.filter((a) => a.stato === sezione.stato).sort(confrontaAttivita),
  }))
}

/** Dove sta la card di un progetto nella Dashboard: in cima, in mezzo o in fondo. */
export type Rilievo = 'preferito' | 'normale' | 'accantonato'

const ORDINE_RILIEVI: Record<Rilievo, number> = { preferito: 0, normale: 1, accantonato: 2 }

export interface SchedaProgetto {
  /** Il progetto senza distinzione di maiuscole e minuscole; '' per "senza progetto". */
  chiave: string
  progetto: string | null
  rilievo: Rilievo
  /** Tutte le attività del progetto, completate comprese. */
  attivita: Attivita[]
  /** Quante sono completate: la card mostra "completate/totali". */
  completate: number
}

/** Nella card di un progetto: in corso, da fare, bloccate, e le completate in fondo. */
const ORDINE_STATI: Record<Stato, number> = { in_corso: 0, da_fare: 1, bloccato: 2, completo: 3 }

/** Nello stesso stato come la pagina Per stato; le completate dalla più recente. */
function confrontaInScheda(a: Attivita, b: Attivita): number {
  const stato = ORDINE_STATI[a.stato] - ORDINE_STATI[b.stato]
  if (stato !== 0) return stato
  if (a.stato === 'completo' && a.completata_il !== b.completata_il) {
    if (a.completata_il === null) return 1
    if (b.completata_il === null) return -1
    return b.completata_il.localeCompare(a.completata_il)
  }
  return confrontaAttivita(a, b)
}

/**
 * Le card della Dashboard (doc/08-interfaccia.md): una per progetto con
 * tutte le sue attività, completate in fondo, e il loro conto. Prima i
 * preferiti, poi gli altri, poi gli accantonati; in ogni gruppo progetti A→Z e
 * "senza progetto" in fondo. `rilievi` ha per chiave quella della card.
 */
export function schedeProgetti(
  attivita: readonly Attivita[],
  rilievi: Readonly<Record<string, Rilievo>> = {},
): SchedaProgetto[] {
  const schede = new Map<string, SchedaProgetto>()
  for (const a of attivita) {
    const chiave = a.progetto === null ? '' : chiaveProgetto(a.progetto)
    const scheda = schede.get(chiave) ?? {
      chiave,
      progetto: a.progetto,
      rilievo: rilievi[chiave] ?? 'normale',
      attivita: [],
      completate: 0,
    }
    if (a.stato === 'completo') scheda.completate++
    scheda.attivita.push(a)
    schede.set(chiave, scheda)
  }
  return [...schede.values()]
    .map((scheda) => ({ ...scheda, attivita: scheda.attivita.sort(confrontaInScheda) }))
    .sort((a, b) => {
      const rilievo = ORDINE_RILIEVI[a.rilievo] - ORDINE_RILIEVI[b.rilievo]
      if (rilievo !== 0) return rilievo
      if (a.progetto === null) return 1
      if (b.progetto === null) return -1
      return confrontaTesto(a.progetto, b.progetto)
    })
}

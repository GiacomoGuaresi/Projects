// Ordinamento e sezioni della dashboard (doc/08-interfaccia.md, "Dashboard" e
// "Pagina Attività").

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

export interface SezioneDashboard {
  stato: Exclude<Stato, 'completo'>
  titolo: string
  apertaDiDefault: boolean
  attivita: Attivita[]
}

const SEZIONI: readonly Omit<SezioneDashboard, 'attivita'>[] = [
  { stato: 'in_corso', titolo: 'In corso', apertaDiDefault: true },
  { stato: 'da_fare', titolo: 'Da fare', apertaDiDefault: false },
  { stato: 'bloccato', titolo: 'Bloccate', apertaDiDefault: false },
]

/** Le tre sezioni della dashboard, ciascuna con le sue attività in ordine. */
export function sezioniDashboard(attivita: readonly Attivita[]): SezioneDashboard[] {
  return SEZIONI.map((sezione) => ({
    ...sezione,
    attivita: attivita.filter((a) => a.stato === sezione.stato).sort(confrontaAttivita),
  }))
}

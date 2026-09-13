// I filtri della pagina Attività (doc/08-interfaccia.md, "Pagina Attività").

import { ordinaAttivita } from './ordinamento'
import { chiaveProgetto } from './progetto'
import type { Attivita, Stato } from './tipi'

export interface Filtri {
  /** Cerca nel titolo e nel progetto. */
  testo: string
  stato: Stato | null
  priorita: number | null
  /** Il progetto esatto, a meno di maiuscole e minuscole. */
  progetto: string
  mostraCompletate: boolean
}

export const FILTRI_VUOTI: Filtri = {
  testo: '',
  stato: null,
  priorita: null,
  progetto: '',
  mostraCompletate: false,
}

/** Scegliere "Completo" nel filtro di stato accende da solo "Mostra completate". */
export function conStato(filtri: Filtri, stato: Stato | null): Filtri {
  return { ...filtri, stato, mostraCompletate: filtri.mostraCompletate || stato === 'completo' }
}

/** Se c'è qualcosa da azzerare. */
export function filtriAttivi(filtri: Filtri): boolean {
  return (
    filtri.testo.trim() !== '' ||
    filtri.stato !== null ||
    filtri.priorita !== null ||
    filtri.progetto.trim() !== '' ||
    filtri.mostraCompletate
  )
}

const cercabile = (testo: string) => testo.toLocaleLowerCase('it').replace(/\s+/g, ' ').trim()

/** Le attività che passano i filtri, già ordinate. */
export function filtraAttivita(attivita: readonly Attivita[], filtri: Filtri): Attivita[] {
  const testo = cercabile(filtri.testo)
  const progetto = chiaveProgetto(filtri.progetto)
  return ordinaAttivita(
    attivita.filter((a) => {
      if (a.stato === 'completo' && !filtri.mostraCompletate && filtri.stato !== 'completo') return false
      if (filtri.stato !== null && a.stato !== filtri.stato) return false
      if (filtri.priorita !== null && a.priorita !== filtri.priorita) return false
      if (progetto && chiaveProgetto(a.progetto ?? '') !== progetto) return false
      if (testo && !cercabile(`${a.titolo} ${a.progetto ?? ''}`).includes(testo)) return false
      return true
    }),
  )
}

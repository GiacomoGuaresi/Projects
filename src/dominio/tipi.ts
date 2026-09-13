// Le forme dei dati (doc/04-modello-dati.md), come arrivano dallo schema `projects`.

export const STATI = ['da_fare', 'in_corso', 'bloccato', 'completo'] as const

export type Stato = (typeof STATI)[number]

/** Una riga della vista `attivita_elenco`: la tabella più `ha_diario`. */
export interface Attivita {
  id: number
  titolo: string
  /** Markdown. */
  descrizione: string | null
  /** Etichetta libera; mai stringa vuota (il trigger la porta a NULL). */
  progetto: string | null
  stato: Stato
  /** Da 1 a 5 stelle. */
  priorita: number
  /** Da 0 a 100; 100 quando l'attività è completa. */
  avanzamento: number
  creata_il: string
  modificata_il: string
  completata_il: string | null
  ha_diario: boolean
}

/** I campi che l'interfaccia cambia; il resto lo gestisce il database. */
export type Modifica = Partial<
  Pick<Attivita, 'titolo' | 'descrizione' | 'progetto' | 'stato' | 'priorita' | 'avanzamento'>
>

export type NuovaAttivita = Pick<Attivita, 'titolo' | 'descrizione' | 'progetto' | 'stato' | 'priorita'>

export interface VoceDiario {
  id: number
  attivita_id: number
  /** Markdown. */
  testo: string
  creata_il: string
  modificata_il: string
}

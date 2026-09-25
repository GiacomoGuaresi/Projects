// Le forme dei dati (doc/04-modello-dati.md), come arrivano dallo schema `projects`.

export const STATI = ['da_fare', 'in_corso', 'bloccato', 'completo'] as const

export type Stato = (typeof STATI)[number]

/** Una riga della vista `attivita_elenco`: la tabella più `ha_diario`. */
export interface Attivita {
  id: number
  titolo: string
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
  Pick<Attivita, 'titolo' | 'progetto' | 'stato' | 'priorita' | 'avanzamento'>
>

export type NuovaAttivita = Pick<Attivita, 'titolo' | 'progetto' | 'stato' | 'priorita'>

/**
 * Un'attività veloce e ripetitiva (tabella `faccende`): solo il titolo e se è
 * fatta. Le completate spariscono a fine giornata.
 */
export interface Faccenda {
  id: number
  titolo: string
  completa: boolean
  creata_il: string
  completata_il: string | null
  /** La ricorrenza che l'ha creata, se c'è. */
  ricorrenza_id: number | null
}

export const UNITA = ['giorno', 'settimana', 'mese', 'anno'] as const

export type Unita = (typeof UNITA)[number]

/** Le date di calendario, senza ora: `YYYY-MM-DD`. */
export type Giorno = string

/**
 * Una regola che crea da sola una faccenda (tabella `ricorrenze`): ogni `ogni`
 * giorni, settimane, mesi o anni a partire da `inizio`.
 */
export interface Ricorrenza {
  id: number
  titolo: string
  unita: Unita
  /** Ogni quante unità: 1 = ogni settimana, 2 = ogni due settimane… */
  ogni: number
  /** 1 = lunedì … 7 = domenica. Solo per le settimanali, e lì mai vuoto. */
  giorni: number[] | null
  inizio: Giorno
  /** Il giorno in cui creerà la prossima faccenda. */
  prossima: Giorno
  /** L'ultimo giorno in cui ha creato una faccenda. */
  ultima: Giorno | null
  /** In pausa non crea niente. */
  attiva: boolean
  creata_il: string
}

/** Quello che decide le date. */
export type Regola = Pick<Ricorrenza, 'unita' | 'ogni' | 'giorni' | 'inizio'>

/** Quello che si sceglie nel modale; `prossima` e `ultima` le calcola l'app. */
export type DatiRicorrenza = Pick<Ricorrenza, 'titolo' | 'unita' | 'ogni' | 'giorni' | 'inizio' | 'attiva'>

export interface VoceDiario {
  id: number
  attivita_id: number
  /** Markdown. */
  testo: string
  creata_il: string
  modificata_il: string
}

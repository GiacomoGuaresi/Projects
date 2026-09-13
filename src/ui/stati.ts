import { Ban, Circle, CircleCheck, Play, type LucideIcon } from 'lucide-react'
import type { Stato } from '../dominio/tipi'

/** Etichetta, icona e colori di ogni stato (doc/08-interfaccia.md). */
export const infoStati: Record<Stato, { etichetta: string; icona: LucideIcon; colori: string }> = {
  da_fare: { etichetta: 'Da fare', icona: Circle, colori: 'bg-dafare text-dafare-testo' },
  in_corso: { etichetta: 'In corso', icona: Play, colori: 'bg-incorso text-incorso-testo' },
  bloccato: { etichetta: 'Bloccato', icona: Ban, colori: 'bg-bloccato text-bloccato-testo' },
  completo: { etichetta: 'Completo', icona: CircleCheck, colori: 'bg-completo text-completo-testo' },
}

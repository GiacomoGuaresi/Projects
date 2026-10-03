import { useSyncExternalStore } from 'react'

/**
 * Le pagine, raggiunte con l'hash (doc/03-architettura.md): `#/` è la
 * Dashboard con le card per progetto, `#/faccende` la pagina Faccende,
 * `#/valigia` la lista per fare la valigia, `#/foresta` gli alberi delle attività completate, `#/installa` le istruzioni per installare l'app. Con l'hash GitHub Pages non
 * vede mai le rotte, quindi non serve un 404.html.
 */
export type Rotta = 'dashboard' | 'faccende' | 'valigia' | 'foresta' | 'installa'

export const indirizzi: Record<Rotta, string> = {
  dashboard: '#/',
  faccende: '#/faccende',
  valigia: '#/valigia',
  foresta: '#/foresta',
  installa: '#/installa',
}

/** Qualunque hash sconosciuto (anche i vecchi `#/progetti`, `#/stato` e `#/attivita`) porta alla Dashboard. */
function leggi(): Rotta {
  const hash = window.location.hash
  if (hash.startsWith(indirizzi.faccende)) return 'faccende'
  if (hash.startsWith(indirizzi.valigia)) return 'valigia'
  if (hash.startsWith(indirizzi.foresta)) return 'foresta'
  if (hash.startsWith(indirizzi.installa)) return 'installa'
  return 'dashboard'
}

function iscriviti(avvisa: () => void) {
  window.addEventListener('hashchange', avvisa)
  return () => window.removeEventListener('hashchange', avvisa)
}

export const PANNELLI_SFONDO = ['oggi', 'numeri'] as const
export type PannelloSfondo = (typeof PANNELLI_SFONDO)[number]
export const POSIZIONI_SFONDO = ['basso-sinistra', 'alto-sinistra', 'basso-destra', 'alto-destra'] as const
export type PosizioneSfondo = (typeof POSIZIONI_SFONDO)[number]

export interface OpzioniSfondo {
  /** I pannelli dell'overlay, nell'ordine in cui si disegnano; nessuno = solo la scena. */
  pannelli: PannelloSfondo[]
  posizione: PosizioneSfondo
}

/**
 * `#/foresta?sfondo`: solo la scena della Foresta, senza interfaccia, per la
 * foto che diventa lo sfondo dei dispositivi (repo ProjectsWallpaper, doc/08).
 * Con `pannelli=oggi,numeri` e `posizione=basso-sinistra` sopra c'è l'overlay.
 * Fuori dalla modalità sfondo `null`; i valori sconosciuti si ignorano.
 */
export function opzioniSfondo(hash = window.location.hash): OpzioniSfondo | null {
  if (!hash.startsWith(`${indirizzi.foresta}?`)) return null
  const parametri = new URLSearchParams(hash.slice(hash.indexOf('?') + 1))
  if (!parametri.has('sfondo')) return null
  const scelti = (parametri.get('pannelli') ?? '').split(',')
  const posizione = parametri.get('posizione')
  return {
    pannelli: PANNELLI_SFONDO.filter((p) => scelti.includes(p)),
    posizione: POSIZIONI_SFONDO.find((p) => p === posizione) ?? 'basso-sinistra',
  }
}

export function useRotta(): Rotta {
  return useSyncExternalStore(iscriviti, leggi)
}

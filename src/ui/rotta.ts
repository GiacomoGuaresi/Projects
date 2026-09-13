import { useSyncExternalStore } from 'react'

/**
 * Le pagine, raggiunte con l'hash (doc/03-architettura.md): `#/` è la
 * Dashboard, `#/attivita` la pagina Attività. Con l'hash GitHub Pages non vede
 * mai le rotte, quindi non serve un 404.html.
 */
export type Rotta = 'dashboard' | 'attivita'

export const indirizzi: Record<Rotta, string> = {
  dashboard: '#/',
  attivita: '#/attivita',
}

/** Qualunque hash sconosciuto porta alla Dashboard. */
function leggi(): Rotta {
  return window.location.hash.startsWith(indirizzi.attivita) ? 'attivita' : 'dashboard'
}

function iscriviti(avvisa: () => void) {
  window.addEventListener('hashchange', avvisa)
  return () => window.removeEventListener('hashchange', avvisa)
}

export function useRotta(): Rotta {
  return useSyncExternalStore(iscriviti, leggi)
}

import { useSyncExternalStore } from 'react'

/**
 * Le pagine, raggiunte con l'hash (doc/03-architettura.md): `#/` è la
 * Dashboard, `#/attivita` la pagina Attività, `#/installa` le istruzioni per
 * installare l'app. Con l'hash GitHub Pages non vede mai le rotte, quindi non
 * serve un 404.html.
 */
export type Rotta = 'dashboard' | 'attivita' | 'installa'

export const indirizzi: Record<Rotta, string> = {
  dashboard: '#/',
  attivita: '#/attivita',
  installa: '#/installa',
}

/** Qualunque hash sconosciuto porta alla Dashboard. */
function leggi(): Rotta {
  const hash = window.location.hash
  if (hash.startsWith(indirizzi.attivita)) return 'attivita'
  if (hash.startsWith(indirizzi.installa)) return 'installa'
  return 'dashboard'
}

function iscriviti(avvisa: () => void) {
  window.addEventListener('hashchange', avvisa)
  return () => window.removeEventListener('hashchange', avvisa)
}

export function useRotta(): Rotta {
  return useSyncExternalStore(iscriviti, leggi)
}

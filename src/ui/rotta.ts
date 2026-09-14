import { useSyncExternalStore } from 'react'

/**
 * Le pagine, raggiunte con l'hash (doc/03-architettura.md): `#/` è la
 * Dashboard con le card per progetto, `#/stato` la pagina Per stato con le
 * sezioni, `#/attivita` la pagina Attività, `#/faccende` la pagina Faccende,
 * `#/installa` le istruzioni per installare l'app. Con l'hash GitHub Pages non
 * vede mai le rotte, quindi non serve un 404.html.
 */
export type Rotta = 'dashboard' | 'stato' | 'attivita' | 'faccende' | 'installa'

export const indirizzi: Record<Rotta, string> = {
  dashboard: '#/',
  stato: '#/stato',
  attivita: '#/attivita',
  faccende: '#/faccende',
  installa: '#/installa',
}

/** Qualunque hash sconosciuto (anche il vecchio `#/progetti`) porta alla Dashboard. */
function leggi(): Rotta {
  const hash = window.location.hash
  if (hash.startsWith(indirizzi.stato)) return 'stato'
  if (hash.startsWith(indirizzi.attivita)) return 'attivita'
  if (hash.startsWith(indirizzi.faccende)) return 'faccende'
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

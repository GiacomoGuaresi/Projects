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

export function useRotta(): Rotta {
  return useSyncExternalStore(iscriviti, leggi)
}

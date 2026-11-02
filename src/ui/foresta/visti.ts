import { useEffect, useState, useSyncExternalStore } from 'react'
import { faccende } from '../../dati'

// Le piante e gli arbusti già visti su questo dispositivo: quelli nuovi
// crescono aprendo la Foresta, e finché non la si apre il menu li conta col
// pallino rosso, come le cime e i timbri di Adventures (doc/08-interfaccia.md).

/** Le piante già viste (`id:stato`), per far crescere solo le nuove e quelle cambiate. */
const PIANTE = 'projects_foresta_visti'
/** Quanti arbusti c'erano all'ultima visita. */
const ARBUSTI = 'projects_foresta_arbusti_visti'

const ascoltatori = new Set<() => void>()
/** L'ultima lettura per chiave, così `useSyncExternalStore` riceve sempre lo stesso valore finché non cambia. */
const letti = new Map<string, { testo: string | null; valore: unknown }>()

function leggi<T>(chiave: string, converti: (dato: unknown) => T): T | null {
  let testo: string | null = null
  try {
    testo = window.localStorage.getItem(chiave)
  } catch {
    testo = null
  }
  const prima = letti.get(chiave)
  if (prima && prima.testo === testo) return prima.valore as T | null
  let valore: T | null = null
  try {
    valore = testo ? converti(JSON.parse(testo)) : null
  } catch {
    valore = null
  }
  letti.set(chiave, { testo, valore })
  return valore
}

function salva(chiave: string, valore: unknown) {
  try {
    window.localStorage.setItem(chiave, JSON.stringify(valore))
  } catch {
    // Senza memoria del browser crescono tutti a ogni visita: va bene lo stesso.
  }
  for (const avvisa of ascoltatori) avvisa()
}

function iscriviti(avvisa: () => void) {
  ascoltatori.add(avvisa)
  return () => {
    ascoltatori.delete(avvisa)
  }
}

export const pianta = (a: { id: number; stato: string }) => `${a.id}:${a.stato}`

export const leggiPiante = () => leggi(PIANTE, (dato) => new Set((dato as unknown[]).map(String)))
export const salvaPiante = (piante: readonly string[]) => salva(PIANTE, piante)
const leggiArbusti = () => leggi(ARBUSTI, Number)
export const salvaArbusti = (quanti: number) => salva(ARBUSTI, quanti)

/**
 * Quante piante (nuove o cambiate) e quanti arbusti compariranno alla prossima
 * visita della Foresta: il numero del pallino nel menu.
 */
export function useDaVedere(piante: readonly string[], arbusti: number | null): number {
  const viste = useSyncExternalStore(iscriviti, leggiPiante, () => null)
  const arbustiVisti = useSyncExternalStore(iscriviti, leggiArbusti, () => null)
  const nuove = piante.filter((p) => !viste?.has(p)).length
  return nuove + Math.max(0, (arbusti ?? 0) - (arbustiVisti ?? 0))
}

/**
 * Il conto delle faccende fatte; `null` finché non arriva o se non si riesce a
 * leggerlo. `arrivato` diventa vero alla prima risposta, anche se è un errore.
 * Si rilegge a ogni cambio di `faccende`, così una faccenda fatta conta subito.
 */
export function useArbusti(cambio: unknown): { quanti: number | null; arrivato: boolean } {
  const [stato, setStato] = useState<{ quanti: number | null; arrivato: boolean }>({ quanti: null, arrivato: false })
  useEffect(() => {
    let attivo = true
    faccende()
      .fatte()
      .then((n) => attivo && setStato({ quanti: n, arrivato: true }))
      .catch(() => attivo && setStato((prima) => ({ quanti: prima.quanti, arrivato: true })))
    return () => {
      attivo = false
    }
  }, [cambio])
  return stato
}

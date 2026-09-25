import { useCallback, useEffect, useState } from 'react'
import { ricorrenze } from '../dati'
import { oggi } from '../dominio/ricorrenze'
import type { DatiRicorrenza, Ricorrenza } from '../dominio/tipi'

export type StatoRicorrenze =
  | { fase: 'caricamento' }
  | { fase: 'errore'; messaggio: string }
  | { fase: 'pronto'; ricorrenze: Ricorrenza[] }

/**
 * Le ricorrenze, per la pagina Faccende. Dopo ogni salvataggio `onCambiate`
 * rilegge le faccende: una ricorrenza che parte oggi crea subito la sua, e
 * sposta avanti `prossima`, quindi poi si rileggono anche le ricorrenze.
 * Creare e modificare lanciano l'errore, e il modale lo mostra.
 */
export function useRicorrenze(onCambiate: () => Promise<void>, onAvviso: (messaggio: string) => void) {
  const [stato, setStato] = useState<StatoRicorrenze>({ fase: 'caricamento' })

  const ricarica = useCallback(async () => {
    setStato((prima) => (prima.fase === 'pronto' ? prima : { fase: 'caricamento' }))
    try {
      setStato({ fase: 'pronto', ricorrenze: await ricorrenze().elenco() })
    } catch (errore) {
      setStato({ fase: 'errore', messaggio: (errore as Error).message })
    }
  }, [])

  useEffect(() => {
    void ricarica()
  }, [ricarica])

  const aggiorna = (cambia: (elenco: Ricorrenza[]) => Ricorrenza[]) =>
    setStato((prima) =>
      prima.fase === 'pronto'
        ? { ...prima, ricorrenze: cambia(prima.ricorrenze).sort((a, b) => a.titolo.localeCompare(b.titolo)) }
        : prima,
    )

  const crea = useCallback(
    async (dati: DatiRicorrenza) => {
      const creata = await ricorrenze().crea(dati, oggi())
      aggiorna((elenco) => [...elenco, creata])
      void onCambiate().then(ricarica)
    },
    [onCambiate, ricarica],
  )

  const modifica = useCallback(
    async (ricorrenza: Ricorrenza, dati: DatiRicorrenza) => {
      const salvata = await ricorrenze().modifica(ricorrenza, dati, oggi())
      aggiorna((elenco) => elenco.map((r) => (r.id === salvata.id ? salvata : r)))
      void onCambiate().then(ricarica)
    },
    [onCambiate, ricarica],
  )

  /** Toglie subito la ricorrenza; se non riesce avvisa e rilegge. Le faccende già create restano. */
  const elimina = useCallback(
    async (id: number) => {
      aggiorna((elenco) => elenco.filter((r) => r.id !== id))
      try {
        await ricorrenze().elimina(id)
      } catch (errore) {
        onAvviso((errore as Error).message)
        void ricarica()
      }
    },
    [onAvviso, ricarica],
  )

  return { stato, ricarica, crea, modifica, elimina }
}

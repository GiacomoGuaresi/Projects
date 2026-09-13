import { useCallback, useEffect, useState } from 'react'
import { attivita } from '../dati'
import type { Attivita, NuovaAttivita } from '../dominio/tipi'

export type StatoElenco =
  | { fase: 'caricamento' }
  | { fase: 'errore'; messaggio: string }
  | { fase: 'pronto'; attivita: Attivita[] }

/**
 * Tutte le attività, lette una volta all'apertura: sono poche centinaia, e
 * dashboard e pagina Attività le filtrano in memoria. Le modifiche passano da
 * qui, che aggiorna l'elenco con la riga salvata.
 */
export function useAttivita() {
  const [stato, setStato] = useState<StatoElenco>({ fase: 'caricamento' })

  const ricarica = useCallback(async () => {
    setStato((prima) => (prima.fase === 'pronto' ? prima : { fase: 'caricamento' }))
    try {
      setStato({ fase: 'pronto', attivita: await attivita().elenco() })
    } catch (errore) {
      setStato({ fase: 'errore', messaggio: (errore as Error).message })
    }
  }, [])

  useEffect(() => {
    void ricarica()
  }, [ricarica])

  /** Crea l'attività; se non riesce lancia l'errore, e chi chiama lo mostra. */
  const crea = useCallback(async (nuova: NuovaAttivita) => {
    const creata = await attivita().crea(nuova)
    setStato((prima) => (prima.fase === 'pronto' ? { ...prima, attivita: [...prima.attivita, creata] } : prima))
    return creata
  }, [])

  return { stato, ricarica, crea }
}

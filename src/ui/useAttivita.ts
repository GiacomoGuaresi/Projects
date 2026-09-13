import { useCallback, useEffect, useState } from 'react'
import { attivita } from '../dati'
import type { Attivita } from '../dominio/tipi'

export type StatoElenco =
  | { fase: 'caricamento' }
  | { fase: 'errore'; messaggio: string }
  | { fase: 'pronto'; attivita: Attivita[] }

/**
 * Tutte le attività, lette una volta all'apertura: sono poche centinaia, e
 * dashboard e pagina Attività le filtrano in memoria.
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

  return { stato, ricarica }
}

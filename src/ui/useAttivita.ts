import { useCallback, useEffect, useState } from 'react'
import { attivita } from '../dati'
import { applicaModifica } from '../dominio/attivita'
import { chiaveProgetto } from '../dominio/progetto'
import type { Attivita, Modifica, NuovaAttivita } from '../dominio/tipi'

export type StatoElenco =
  | { fase: 'caricamento' }
  | { fase: 'errore'; messaggio: string }
  | { fase: 'pronto'; attivita: Attivita[] }

/**
 * Tutte le attività, lette una volta all'apertura: sono poche centinaia, e
 * le pagine le filtrano in memoria. Le modifiche passano da
 * qui, che aggiorna l'elenco con la riga salvata.
 */
export function useAttivita() {
  const [stato, setStato] = useState<StatoElenco>({ fase: 'caricamento' })
  /** Una modifica non salvata, da mostrare a chi usa l'app. */
  const [avviso, setAvviso] = useState<string | null>(null)

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

  const aggiorna = (cambia: (elenco: Attivita[]) => Attivita[]) =>
    setStato((prima) => (prima.fase === 'pronto' ? { ...prima, attivita: cambia(prima.attivita) } : prima))

  /** Crea l'attività; se non riesce lancia l'errore, e chi chiama lo mostra. */
  const crea = useCallback(async (nuova: NuovaAttivita) => {
    const creata = await attivita().crea(nuova)
    aggiorna((elenco) => [...elenco, creata])
    return creata
  }, [])

  /**
   * Mostra subito il risultato (con le regole del database), poi lo sostituisce
   * con la riga salvata. Se il salvataggio non riesce avvisa e rilegge tutto.
   */
  const modifica = useCallback(
    async (id: number, cambi: Modifica) => {
      aggiorna((elenco) => elenco.map((a) => (a.id === id ? applicaModifica(a, cambi) : a)))
      try {
        const riga = await attivita().modifica(id, cambi)
        aggiorna((elenco) => elenco.map((a) => (a.id === id ? { ...riga, ha_diario: a.ha_diario } : a)))
      } catch (errore) {
        setAvviso((errore as Error).message)
        void ricarica()
      }
    },
    [ricarica],
  )

  /**
   * Cambia il progetto a tutte le sue attività, completate comprese (`null` lo
   * toglie). Si vede subito; poi si rilegge tutto, date di modifica comprese.
   */
  const rinominaProgetto = useCallback(
    async (vecchio: string, nuovo: string | null) => {
      const chiave = chiaveProgetto(vecchio)
      aggiorna((elenco) =>
        elenco.map((a) => (a.progetto !== null && chiaveProgetto(a.progetto) === chiave ? { ...a, progetto: nuovo } : a)),
      )
      try {
        await attivita().rinominaProgetto(vecchio, nuovo)
      } catch (errore) {
        setAvviso((errore as Error).message)
      }
      await ricarica()
    },
    [ricarica],
  )

  /** Toglie subito l'attività dall'elenco; se non riesce avvisa e rilegge tutto. */
  const elimina = useCallback(
    async (id: number) => {
      aggiorna((elenco) => elenco.filter((a) => a.id !== id))
      try {
        await attivita().elimina(id)
      } catch (errore) {
        setAvviso((errore as Error).message)
        void ricarica()
      }
    },
    [ricarica],
  )

  /** Il diario ha (o non ha più) voci: l'icona nell'elenco lo mostra. */
  const segnaDiario = useCallback((id: number, haDiario: boolean) => {
    aggiorna((elenco) => elenco.map((a) => (a.id === id ? { ...a, ha_diario: haDiario } : a)))
  }, [])

  const chiudiAvviso = useCallback(() => setAvviso(null), [])

  return { stato, ricarica, crea, modifica, rinominaProgetto, elimina, segnaDiario, avviso, chiudiAvviso }
}

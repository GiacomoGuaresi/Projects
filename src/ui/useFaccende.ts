import { useCallback, useEffect, useState } from 'react'
import { faccende } from '../dati'
import { inizioGiornata, segnaCompleta } from '../dominio/faccende'
import { oggi } from '../dominio/ricorrenze'
import type { Faccenda } from '../dominio/tipi'

export type StatoFaccende =
  | { fase: 'caricamento' }
  | { fase: 'errore'; messaggio: string }
  | { fase: 'pronto'; faccende: Faccenda[] }

/**
 * Le faccende, lette all'apertura e ogni volta che l'app torna in primo piano:
 * ogni lettura elimina prima quelle completate prima di oggi e crea quelle
 * delle ricorrenze arrivate.
 */
export function useFaccende(onAvviso: (messaggio: string) => void) {
  const [stato, setStato] = useState<StatoFaccende>({ fase: 'caricamento' })

  const ricarica = useCallback(async () => {
    setStato((prima) => (prima.fase === 'pronto' ? prima : { fase: 'caricamento' }))
    try {
      setStato({ fase: 'pronto', faccende: await faccende().elenco(inizioGiornata(), oggi()) })
    } catch (errore) {
      setStato({ fase: 'errore', messaggio: (errore as Error).message })
    }
  }, [])

  useEffect(() => {
    void ricarica()
    const visibile = () => {
      if (document.visibilityState === 'visible') void ricarica()
    }
    document.addEventListener('visibilitychange', visibile)
    return () => document.removeEventListener('visibilitychange', visibile)
  }, [ricarica])

  const aggiorna = (cambia: (elenco: Faccenda[]) => Faccenda[]) =>
    setStato((prima) => (prima.fase === 'pronto' ? { ...prima, faccende: cambia(prima.faccende) } : prima))

  /** Crea la faccenda; se non riesce lancia l'errore, e l'aggiunta rapida lo mostra. */
  const crea = useCallback(async (titolo: string) => {
    const creata = await faccende().crea(titolo)
    aggiorna((elenco) => [...elenco, creata])
  }, [])

  /** Si vede subito; poi arriva la riga salvata. Se non riesce avvisa e rilegge. */
  const segna = useCallback(
    async (id: number, completa: boolean) => {
      aggiorna((elenco) => elenco.map((f) => (f.id === id ? segnaCompleta(f, completa) : f)))
      try {
        const riga = await faccende().segna(id, completa)
        aggiorna((elenco) => elenco.map((f) => (f.id === id ? riga : f)))
      } catch (errore) {
        onAvviso((errore as Error).message)
        void ricarica()
      }
    },
    [onAvviso, ricarica],
  )

  /** Cambia il titolo: si vede subito; se non riesce avvisa e rilegge. */
  const rinomina = useCallback(
    async (id: number, titolo: string) => {
      aggiorna((elenco) => elenco.map((f) => (f.id === id ? { ...f, titolo } : f)))
      try {
        const riga = await faccende().rinomina(id, titolo)
        aggiorna((elenco) => elenco.map((f) => (f.id === id ? riga : f)))
      } catch (errore) {
        onAvviso((errore as Error).message)
        void ricarica()
      }
    },
    [onAvviso, ricarica],
  )

  /** Toglie subito la faccenda; se non riesce avvisa e rilegge. */
  const elimina = useCallback(
    async (id: number) => {
      aggiorna((elenco) => elenco.filter((f) => f.id !== id))
      try {
        await faccende().elimina(id)
      } catch (errore) {
        onAvviso((errore as Error).message)
        void ricarica()
      }
    },
    [onAvviso, ricarica],
  )

  return { stato, ricarica, crea, segna, rinomina, elimina }
}

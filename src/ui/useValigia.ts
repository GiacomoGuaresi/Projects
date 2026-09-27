import { useCallback, useEffect, useState } from 'react'
import { valigia, type CambioValigia, type StatoValigia } from '../dati'
import type { Viaggio } from '../dominio/valigia'

export type StatoPaginaValigia =
  | { fase: 'caricamento' }
  | { fase: 'errore'; messaggio: string }
  | ({ fase: 'pronto' } & StatoValigia)

/** Applica un cambio arrivato in tempo reale; anche l'eco dei propri non cambia nulla. */
function applica(stato: StatoPaginaValigia, cambio: CambioValigia): StatoPaginaValigia {
  if (stato.fase !== 'pronto') return stato
  if (cambio.tipo === 'viaggio') return { ...stato, viaggio: cambio.viaggio, inLista: cambio.inLista }
  const spunte = new Set(stato.spunte)
  if (cambio.presa) spunte.add(cambio.chiave)
  else spunte.delete(cambio.chiave)
  return { ...stato, spunte }
}

/**
 * La valigia condivisa (doc/08-interfaccia.md, "Valigia"): letta all'apertura,
 * a ogni ritorno in primo piano e a ogni riconnessione, e tenuta aggiornata in
 * tempo reale con quello che fanno gli altri telefoni. Le modifiche si vedono
 * subito; se il salvataggio non riesce avvisa e rilegge.
 */
export function useValigia(onAvviso: (messaggio: string) => void) {
  const [stato, setStato] = useState<StatoPaginaValigia>({ fase: 'caricamento' })

  const ricarica = useCallback(async () => {
    try {
      setStato({ fase: 'pronto', ...(await valigia().leggi()) })
    } catch (errore) {
      setStato({ fase: 'errore', messaggio: (errore as Error).message })
    }
  }, [])

  useEffect(() => {
    void ricarica()
    const smetti = valigia().ascolta(
      (cambio) => setStato((prima) => applica(prima, cambio)),
      () => void ricarica(),
    )
    const visibile = () => {
      if (document.visibilityState === 'visible') void ricarica()
    }
    document.addEventListener('visibilitychange', visibile)
    return () => {
      smetti()
      document.removeEventListener('visibilitychange', visibile)
    }
  }, [ricarica])

  /** Si vede subito, poi si salva; se non riesce avvisa e rilegge. */
  const salva = useCallback(
    async (cambia: (stato: StatoValigia) => StatoValigia, scrivi: () => Promise<void>) => {
      setStato((prima) => (prima.fase === 'pronto' ? { fase: 'pronto', ...cambia(prima) } : prima))
      try {
        await scrivi()
      } catch (errore) {
        onAvviso((errore as Error).message)
        void ricarica()
      }
    },
    [onAvviso, ricarica],
  )

  const pronto = stato.fase === 'pronto' ? stato : null

  const cambiaViaggio = (viaggio: Viaggio) =>
    void salva(
      (s) => ({ ...s, viaggio }),
      () => valigia().salvaViaggio(viaggio, pronto?.inLista ?? false),
    )

  const prepara = () =>
    pronto &&
    void salva(
      (s) => ({ ...s, inLista: true }),
      () => valigia().salvaViaggio(pronto.viaggio, true),
    )

  const segna = (chiave: string, presa: boolean) =>
    void salva(
      (s) => {
        const spunte = new Set(s.spunte)
        if (presa) spunte.add(chiave)
        else spunte.delete(chiave)
        return { ...s, spunte }
      },
      () => valigia().segna(chiave, presa),
    )

  const ricomincia = () =>
    void salva(
      (s) => ({ ...s, spunte: new Set(), inLista: false }),
      () => valigia().nuova(),
    )

  return { stato, ricarica, cambiaViaggio, prepara, segna, ricomincia }
}

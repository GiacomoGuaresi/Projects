import { useCallback, useEffect, useState } from 'react'
import { leggiMeteo, type MeteoLetto } from '../../dati/meteo'
import {
  albaTramonto,
  CASA,
  CIELI,
  daCodiceMeteo,
  FASI,
  faseLunare,
  forzaVento,
  luce,
  luceDi,
  meteoDi,
  stagione,
  STAGIONI,
  type Cielo,
  type Fase,
  type Luce,
  type Meteo,
  type Stagione,
} from '../../dominio/ambiente'

/**
 * Quello che il selettore nascosto (o la console, `foresta.*`) può forzare;
 * il resto segue il vero. Resta solo in questa scheda del browser.
 */
export interface Forzature {
  stagione?: Stagione
  fase?: Fase
  cielo?: Cielo
  /** Da 0 a 1. */
  vento?: number
}

const MEMORIA = 'projects_foresta_prova'

function leggiForzature(): Forzature {
  try {
    return JSON.parse(window.sessionStorage.getItem(MEMORIA) ?? '{}') as Forzature
  } catch {
    return {}
  }
}

function salvaForzature(forza: Forzature) {
  try {
    if (Object.values(forza).every((v) => v === undefined)) window.sessionStorage.removeItem(MEMORIA)
    else window.sessionStorage.setItem(MEMORIA, JSON.stringify(forza))
  } catch {
    // Senza memoria della scheda la prova finisce col ricaricamento: va bene lo stesso.
  }
}

export interface Ambiente {
  stagione: Stagione
  luce: Luce
  meteo: Meteo
  /** Da 0 a 1. */
  vento: number
  /** 0 nuova, 0.5 piena. */
  luna: number
  /** Se il meteo è quello vero (letto da Open-Meteo). */
  meteoVero: boolean
  /** In °C, dal meteo vero; `null` se non c'è. */
  temperatura: number | null
  /** Alba e tramonto di oggi. */
  sole: { alba: Date; tramonto: Date }
}

const OGNI_MINUTO = 60 * 1000
const OGNI_MEZZORA = 30 * 60 * 1000
/** Un filo di vento anche quando non si sa: gli alberi si muovono appena. */
const VENTO_DI_RIPIEGO = 0.2

/** L'ambiente vero, calcolato da ora, meteo letto e forzature. */
export function calcolaAmbiente(ora: Date, letto: MeteoLetto | null, forza: Forzature): Ambiente {
  // Alba e tramonto di Open-Meteo valgono solo per il giorno in cui sono stati letti.
  const delGiorno = letto && new Date(letto.alba).toDateString() === ora.toDateString()
  const sole = delGiorno
    ? { alba: new Date(letto.alba), tramonto: new Date(letto.tramonto) }
    : albaTramonto(ora, CASA.lat, CASA.lon)
  const meteo = forza.cielo ? meteoDi(forza.cielo) : letto ? daCodiceMeteo(letto.codice) : meteoDi('sereno')
  const vento =
    forza.vento ?? (forza.cielo === 'temporale' ? 0.8 : letto ? forzaVento(letto.ventoKmh) : VENTO_DI_RIPIEGO)
  return {
    stagione: forza.stagione ?? stagione(ora),
    luce: forza.fase ? luceDi(forza.fase) : luce(ora, sole.alba, sole.tramonto),
    meteo,
    vento,
    luna: faseLunare(ora),
    meteoVero: letto !== null && !forza.cielo,
    temperatura: letto?.temperatura ?? null,
    sole,
  }
}

/**
 * L'ambiente della Foresta: l'ora si aggiorna ogni minuto, il meteo ogni
 * mezz'ora e quando l'app torna in primo piano.
 */
export function useAmbiente() {
  const [ora, setOra] = useState(() => new Date())
  const [letto, setLetto] = useState<MeteoLetto | null>(null)
  /** Vero dopo la prima risposta di Open-Meteo, anche se non è riuscita. */
  const [meteoCaricato, setMeteoCaricato] = useState(false)
  const [forza, impostaForza] = useState<Forzature>(leggiForzature)
  // Accetta anche una funzione dalla prova di prima: più comandi di fila si sommano.
  const setForza = useCallback((nuova: Forzature | ((prima: Forzature) => Forzature)) => {
    impostaForza((prima) => {
      const forza = typeof nuova === 'function' ? nuova(prima) : nuova
      salvaForzature(forza)
      return forza
    })
  }, [])

  useEffect(() => {
    const timer = window.setInterval(() => setOra(new Date()), OGNI_MINUTO)
    return () => window.clearInterval(timer)
  }, [])

  useEffect(() => {
    let attivo = true
    const leggi = () =>
      void leggiMeteo(CASA.lat, CASA.lon).then((m) => {
        if (!attivo) return
        if (m) setLetto(m)
        setMeteoCaricato(true)
      })
    leggi()
    const timer = window.setInterval(leggi, OGNI_MEZZORA)
    const visibile = () => {
      if (document.visibilityState === 'visible') {
        setOra(new Date())
        leggi()
      }
    }
    document.addEventListener('visibilitychange', visibile)
    return () => {
      attivo = false
      window.clearInterval(timer)
      document.removeEventListener('visibilitychange', visibile)
    }
  }, [])

  return { ...calcolaAmbiente(ora, letto, forza), meteoCaricato, forza, setForza }
}

/** I comandi della console, `foresta.*`, per provare la Foresta dai DevTools. */
export interface ComandiForesta {
  stagione: (valore?: Stagione) => void
  ora: (valore?: Fase) => void
  meteo: (valore?: Cielo) => void
  vento: (valore?: number) => void
  reset: () => void
  stato: () => Ambiente & { forza: Forzature }
}

/**
 * Prepara `window.foresta` finché la pagina è aperta. Senza argomento un
 * comando torna al vero; un valore sbagliato è segnalato in console con quelli
 * ammessi. Le forzature restano solo nella scheda e non vanno a nessun server.
 */
export function comandiConsole(
  ambiente: () => Ambiente & { forza: Forzature },
  setForza: (cambia: (prima: Forzature) => Forzature) => void,
): ComandiForesta {
  const scegli =
    <K extends 'stagione' | 'fase' | 'cielo'>(chiave: K, ammessi: readonly NonNullable<Forzature[K]>[]) =>
    (valore?: Forzature[K]) => {
      if (valore !== undefined && !ammessi.includes(valore as NonNullable<Forzature[K]>)) {
        console.warn(`foresta: "${String(valore)}" non va bene. Si può usare: ${ammessi.join(', ')} (o niente per il vero).`)
        return
      }
      setForza((prima) => ({ ...prima, [chiave]: valore }))
    }
  return {
    stagione: scegli('stagione', STAGIONI),
    ora: scegli('fase', FASI),
    meteo: scegli('cielo', CIELI),
    vento: (valore) => {
      if (valore !== undefined && !(valore >= 0 && valore <= 1)) {
        console.warn('foresta: il vento va da 0 (calma) a 1 (forte), o niente per il vero.')
        return
      }
      setForza((prima) => ({ ...prima, vento: valore }))
    },
    reset: () => setForza(() => ({})),
    stato: ambiente,
  }
}

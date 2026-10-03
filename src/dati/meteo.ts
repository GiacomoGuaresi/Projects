// Il meteo vero per la Foresta, da Open-Meteo (gratis, senza chiave, nessun
// dato personale: solo le coordinate fisse di `CASA`). Si tiene per mezz'ora
// nella memoria del browser; se non risponde, la foresta resta col sereno.

/** Quello che serve alla foresta, con le ore in UTC. */
export interface MeteoLetto {
  /** Il codice WMO del tempo attuale. */
  codice: number
  ventoKmh: number
  /** In °C. Manca nei valori salvati prima che si leggesse. */
  temperatura?: number
  alba: string
  tramonto: string
  /** Quando è stato letto, in ms. */
  letto: number
}

const MEMORIA = 'projects_meteo'
const DURATA = 30 * 60 * 1000
const ATTESA_MASSIMA = 8000

function dallaMemoria(): MeteoLetto | null {
  try {
    const salvato = window.localStorage.getItem(MEMORIA)
    const meteo = salvato ? (JSON.parse(salvato) as MeteoLetto) : null
    return meteo && Date.now() - meteo.letto < DURATA ? meteo : null
  } catch {
    return null
  }
}

function inMemoria(meteo: MeteoLetto) {
  try {
    window.localStorage.setItem(MEMORIA, JSON.stringify(meteo))
  } catch {
    // Senza memoria si rilegge alla prossima apertura: va bene lo stesso.
  }
}

/** Il meteo attuale alle coordinate date; `null` se Open-Meteo non risponde. */
export async function leggiMeteo(lat: number, lon: number): Promise<MeteoLetto | null> {
  const ricordato = dallaMemoria()
  if (ricordato) return ricordato
  const indirizzo =
    `https://api.open-meteo.com/v1/forecast?latitude=${lat}&longitude=${lon}` +
    '&current=weather_code,wind_speed_10m,temperature_2m&daily=sunrise,sunset&timezone=GMT&forecast_days=1'
  try {
    const risposta = await fetch(indirizzo, { signal: AbortSignal.timeout(ATTESA_MASSIMA) })
    if (!risposta.ok) return null
    const dati = (await risposta.json()) as {
      current: { weather_code: number; wind_speed_10m: number; temperature_2m?: number }
      daily: { sunrise: string[]; sunset: string[] }
    }
    const meteo: MeteoLetto = {
      codice: dati.current.weather_code,
      ventoKmh: dati.current.wind_speed_10m,
      temperatura: dati.current.temperature_2m,
      // Con timezone=GMT le ore arrivano senza fuso: sono UTC.
      alba: `${dati.daily.sunrise[0]}Z`,
      tramonto: `${dati.daily.sunset[0]}Z`,
      letto: Date.now(),
    }
    inMemoria(meteo)
    return meteo
  } catch (errore) {
    console.warn('Meteo non letto', errore)
    return null
  }
}

// L'ambiente della Foresta (doc/08-interfaccia.md, "Foresta"): stagione, luce
// del giorno, fase della luna e meteo. La stagione e l'ora sono quelle vere;
// il meteo arriva da Open-Meteo (src/dati/meteo.ts) per la città qui sotto.

/** Dove sta la foresta: il meteo e l'alba sono di qui. */
export const CASA = { nome: 'Milano', lat: 45.4642, lon: 9.19 }

export const STAGIONI = ['primavera', 'estate', 'autunno', 'inverno'] as const
export type Stagione = (typeof STAGIONI)[number]

/** La stagione astronomica (emisfero nord): 21/3, 21/6, 23/9, 21/12. */
export function stagione(data: Date): Stagione {
  const giorno = (data.getMonth() + 1) * 100 + data.getDate()
  if (giorno >= 1221 || giorno < 321) return 'inverno'
  if (giorno < 621) return 'primavera'
  if (giorno < 923) return 'estate'
  return 'autunno'
}

// Luce -------------------------------------------------------------------------------

export const FASI = ['alba', 'giorno', 'tramonto', 'notte'] as const
export type Fase = (typeof FASI)[number]

export interface Luce {
  fase: Fase
  /** 0 in pieno giorno, 1 a notte fonda. */
  buio: number
  /** Quanto è caldo il colore del cielo: 1 a metà di alba e tramonto, 0 altrimenti. */
  tinta: number
}

/** Quanto durano alba e tramonto, centrati sull'ora del sole. */
const TRANSIZIONE = 50 * 60 * 1000

/** La luce di un istante, conoscendo alba e tramonto di quel giorno. */
export function luce(ora: Date, alba: Date, tramonto: Date): Luce {
  const t = ora.getTime()
  const passaggio = (centro: number) => (t - (centro - TRANSIZIONE / 2)) / TRANSIZIONE
  const a = passaggio(alba.getTime())
  const tr = passaggio(tramonto.getTime())
  const tinta = (p: number) => 1 - Math.abs(p - 0.5) * 2
  if (a < 0 || tr >= 1) return { fase: 'notte', buio: 1, tinta: 0 }
  if (a < 1) return { fase: 'alba', buio: 1 - a, tinta: tinta(a) }
  if (tr < 0) return { fase: 'giorno', buio: 0, tinta: 0 }
  return { fase: 'tramonto', buio: tr, tinta: tinta(tr) }
}

/** La luce tipica di una fase, per il selettore che la forza. */
export function luceDi(fase: Fase): Luce {
  if (fase === 'giorno') return { fase, buio: 0, tinta: 0 }
  if (fase === 'notte') return { fase, buio: 1, tinta: 0 }
  return { fase, buio: 0.45, tinta: 1 }
}

const gradi = Math.PI / 180

/**
 * Alba e tramonto approssimati (formula del sole, errore di pochi minuti), per
 * quando Open-Meteo non risponde.
 */
export function albaTramonto(data: Date, lat: number, lon: number): { alba: Date; tramonto: Date } {
  const mezzanotte = Date.UTC(data.getFullYear(), data.getMonth(), data.getDate())
  const n = Math.floor((mezzanotte - Date.UTC(data.getFullYear(), 0, 0)) / 86_400_000)
  const declinazione = -23.44 * Math.cos(((2 * Math.PI) / 365) * (n + 10)) * gradi
  const b = ((2 * Math.PI) / 365) * (n - 81)
  const equazioneDelTempo = 9.87 * Math.sin(2 * b) - 7.53 * Math.cos(b) - 1.5 * Math.sin(b)
  const coseno =
    (Math.sin(-0.833 * gradi) - Math.sin(lat * gradi) * Math.sin(declinazione)) /
    (Math.cos(lat * gradi) * Math.cos(declinazione))
  const angolo = Math.acos(Math.min(1, Math.max(-1, coseno))) / gradi
  const mezzogiorno = 720 - 4 * lon - equazioneDelTempo // minuti UTC
  return {
    alba: new Date(mezzanotte + (mezzogiorno - 4 * angolo) * 60_000),
    tramonto: new Date(mezzanotte + (mezzogiorno + 4 * angolo) * 60_000),
  }
}

// Luna -------------------------------------------------------------------------------

const MESE_LUNARE = 29.530588853
/** Una luna nuova nota: 6 gennaio 2000, 18:14 UTC. */
const LUNA_NUOVA = Date.UTC(2000, 0, 6, 18, 14)

/** La fase della luna: 0 nuova, 0.5 piena, verso 1 di nuovo nuova. */
export function faseLunare(data: Date): number {
  const giorni = (data.getTime() - LUNA_NUOVA) / 86_400_000
  return (((giorni / MESE_LUNARE) % 1) + 1) % 1
}

// Meteo ------------------------------------------------------------------------------

export const CIELI = ['sereno', 'nuvoloso', 'nebbia', 'pioggia', 'temporale', 'neve'] as const
export type Cielo = (typeof CIELI)[number]

export interface Meteo {
  cielo: Cielo
  /** Da 0 a 1: quanto è coperto, quanto piove o nevica. */
  intensita: number
}

/** Il meteo di un codice WMO (quelli di Open-Meteo); i codici sconosciuti sono sereno. */
export function daCodiceMeteo(codice: number): Meteo {
  const tabella: Record<number, Meteo> = {
    0: { cielo: 'sereno', intensita: 0 },
    1: { cielo: 'sereno', intensita: 0.2 },
    2: { cielo: 'nuvoloso', intensita: 0.5 },
    3: { cielo: 'nuvoloso', intensita: 1 },
    45: { cielo: 'nebbia', intensita: 0.7 },
    48: { cielo: 'nebbia', intensita: 1 },
    51: { cielo: 'pioggia', intensita: 0.2 },
    53: { cielo: 'pioggia', intensita: 0.3 },
    55: { cielo: 'pioggia', intensita: 0.4 },
    56: { cielo: 'pioggia', intensita: 0.3 },
    57: { cielo: 'pioggia', intensita: 0.5 },
    61: { cielo: 'pioggia', intensita: 0.4 },
    63: { cielo: 'pioggia', intensita: 0.7 },
    65: { cielo: 'pioggia', intensita: 1 },
    66: { cielo: 'pioggia', intensita: 0.5 },
    67: { cielo: 'pioggia', intensita: 0.8 },
    71: { cielo: 'neve', intensita: 0.4 },
    73: { cielo: 'neve', intensita: 0.7 },
    75: { cielo: 'neve', intensita: 1 },
    77: { cielo: 'neve', intensita: 0.3 },
    80: { cielo: 'pioggia', intensita: 0.5 },
    81: { cielo: 'pioggia', intensita: 0.8 },
    82: { cielo: 'pioggia', intensita: 1 },
    85: { cielo: 'neve', intensita: 0.6 },
    86: { cielo: 'neve', intensita: 1 },
    95: { cielo: 'temporale', intensita: 0.8 },
    96: { cielo: 'temporale', intensita: 0.9 },
    99: { cielo: 'temporale', intensita: 1 },
  }
  return tabella[codice] ?? { cielo: 'sereno', intensita: 0 }
}

/** Il meteo tipico, per il selettore che lo forza. */
export function meteoDi(cielo: Cielo): Meteo {
  return { cielo, intensita: cielo === 'sereno' ? 0 : 0.8 }
}

/** Il vento da 0 a 1, dai km/h (40 km/h è già tanto per una foresta in miniatura). */
export function forzaVento(kmh: number): number {
  return Math.min(Math.max(kmh / 40, 0), 1)
}

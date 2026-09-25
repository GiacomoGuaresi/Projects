// Le faccende ricorrenti (doc/08-interfaccia.md, "Faccende ricorrenti"): le
// date delle occorrenze di una regola, e come descriverla a parole.
//
// Si lavora con giorni di calendario (`YYYY-MM-DD`), contati come giorni dal
// 1970-01-01 in UTC: niente ore, quindi niente sorprese con l'ora legale.

import type { DatiRicorrenza, Giorno, Regola, Ricorrenza, Unita } from './tipi'

const GIORNO_MS = 86_400_000

function numero(giorno: Giorno): number {
  const [a, m, g] = giorno.split('-').map(Number)
  return Date.UTC(a, m - 1, g) / GIORNO_MS
}

function giorno(numero: number): Giorno {
  return new Date(numero * GIORNO_MS).toISOString().slice(0, 10)
}

/** 1 = lunedì … 7 = domenica. Il giorno 0 (1970-01-01) era un giovedì. */
function giornoSettimana(n: number): number {
  return ((((n + 3) % 7) + 7) % 7) + 1
}

/** Il giorno `g` del mese `mese` (contato da gennaio dell'anno 0), o l'ultimo se quel mese è più corto. */
function giornoDelMese(mese: number, g: number): number {
  const anno = Math.floor(mese / 12)
  const m = mese - anno * 12
  const ultimo = new Date(Date.UTC(anno, m + 1, 0)).getUTCDate()
  return Date.UTC(anno, m, Math.min(g, ultimo)) / GIORNO_MS
}

/** Oggi, nel fuso del dispositivo. */
export function oggi(adesso = new Date()): Giorno {
  const a = adesso.getFullYear()
  const m = String(adesso.getMonth() + 1).padStart(2, '0')
  const g = String(adesso.getDate()).padStart(2, '0')
  return `${a}-${m}-${g}`
}

export function giornoDopo(g: Giorno): Giorno {
  return giorno(numero(g) + 1)
}

/** Il giorno della settimana di `g`, 1 = lunedì … 7 = domenica. */
export function giornoSettimanaDi(g: Giorno): number {
  return giornoSettimana(numero(g))
}

/** I giorni di una settimanale, ordinati; se mancano, quello dell'inizio. */
function giorniDi(regola: Regola): number[] {
  const scelti = [...new Set(regola.giorni ?? [])].filter((g) => g >= 1 && g <= 7).sort((a, b) => a - b)
  return scelti.length > 0 ? scelti : [giornoSettimanaDi(regola.inizio)]
}

/** La prima occorrenza della regola nel giorno `da` o dopo (mai prima dell'inizio). */
export function occorrenzaDa(regola: Regola, da: Giorno): Giorno {
  const inizio = numero(regola.inizio)
  const d = Math.max(numero(da), inizio)
  const ogni = Math.max(1, Math.floor(regola.ogni))

  switch (regola.unita) {
    case 'giorno':
      return giorno(inizio + Math.ceil((d - inizio) / ogni) * ogni)

    case 'settimana': {
      // Le settimane contano da lunedì, a partire da quella dell'inizio.
      const lunedi = inizio - (giornoSettimana(inizio) - 1)
      const giorni = giorniDi(regola)
      for (let s = Math.floor((d - lunedi) / 7 / ogni) * ogni; ; s += ogni) {
        for (const g of giorni) {
          const candidato = lunedi + s * 7 + g - 1
          if (candidato >= d) return giorno(candidato)
        }
      }
    }

    case 'mese':
    case 'anno': {
      const passo = regola.unita === 'anno' ? ogni * 12 : ogni
      const i = new Date(inizio * GIORNO_MS)
      const meseInizio = i.getUTCFullYear() * 12 + i.getUTCMonth()
      const f = new Date(d * GIORNO_MS)
      const trascorsi = f.getUTCFullYear() * 12 + f.getUTCMonth() - meseInizio
      for (let k = Math.max(0, Math.floor(trascorsi / passo)); ; k++) {
        const candidato = giornoDelMese(meseInizio + k * passo, i.getUTCDate())
        if (candidato >= d) return giorno(candidato)
      }
    }
  }
}

/** La prima occorrenza dopo il giorno `g`. */
export function occorrenzaDopo(regola: Regola, g: Giorno): Giorno {
  return occorrenzaDa(regola, giornoDopo(g))
}

/** Le prossime `quante` occorrenze da `da` compreso, per l'anteprima del modale. */
export function prossimeOccorrenze(regola: Regola, da: Giorno, quante: number): Giorno[] {
  const elenco: Giorno[] = []
  let g = occorrenzaDa(regola, da)
  while (elenco.length < quante) {
    elenco.push(g)
    g = occorrenzaDopo(regola, g)
  }
  return elenco
}

/** Arrivato il suo giorno, la ricorrenza crea la faccenda (se non è in pausa). */
export function daCreare(ricorrenza: Ricorrenza, g: Giorno): boolean {
  return ricorrenza.attiva && ricorrenza.prossima <= g
}

/**
 * La `prossima` di una regola appena creata o cambiata: da oggi in poi, ma mai
 * un giorno per cui ha già creato la faccenda.
 */
export function prossimaDopoModifica(regola: Regola, g: Giorno, ultima: Giorno | null): Giorno {
  return occorrenzaDa(regola, ultima !== null && ultima >= g ? giornoDopo(ultima) : g)
}

/** I dati da salvare: la regola pulita, con `prossima` calcolata. */
export function daSalvare(
  dati: DatiRicorrenza,
  g: Giorno,
  ultima: Giorno | null = null,
): DatiRicorrenza & Pick<Ricorrenza, 'prossima'> {
  const pulita: DatiRicorrenza = {
    ...dati,
    titolo: dati.titolo.trim(),
    ogni: Math.max(1, Math.floor(dati.ogni)),
    giorni: dati.unita === 'settimana' ? giorniDi(dati) : null,
  }
  return { ...pulita, prossima: prossimaDopoModifica(pulita, g, ultima) }
}

// A parole ----------------------------------------------------------------------

const NOMI_GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']
export const GIORNI_BREVI = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
const NOMI_MESI = [
  'gennaio',
  'febbraio',
  'marzo',
  'aprile',
  'maggio',
  'giugno',
  'luglio',
  'agosto',
  'settembre',
  'ottobre',
  'novembre',
  'dicembre',
]

export const NOMI_UNITA: Record<Unita, { una: string; tante: string }> = {
  giorno: { una: 'giorno', tante: 'giorni' },
  settimana: { una: 'settimana', tante: 'settimane' },
  mese: { una: 'mese', tante: 'mesi' },
  anno: { una: 'anno', tante: 'anni' },
}

export function nomeGiorno(g: number): string {
  return NOMI_GIORNI[g - 1]
}

/** "a, b e c" */
function elenca(parole: string[]): string {
  return parole.length < 2 ? parole.join('') : `${parole.slice(0, -1).join(', ')} e ${parole.at(-1)}`
}

/** "il 15", "l’8", "l’11", "il 1°". */
function ilGiorno(g: number): string {
  if (g === 1) return 'il 1°'
  return g === 8 || g === 11 ? `l’${g}` : `il ${g}`
}

/** "Ogni 2 settimane, lunedì e giovedì", "Ogni mese il 15", "Ogni anno il 25 dicembre". */
export function descrivi(regola: Regola): string {
  const ogni = Math.max(1, Math.floor(regola.ogni))
  const { una, tante } = NOMI_UNITA[regola.unita]
  const quando = ogni === 1 ? `Ogni ${una}` : `Ogni ${ogni} ${tante}`
  const [, mese, g] = regola.inizio.split('-').map(Number)

  switch (regola.unita) {
    case 'giorno':
      return quando
    case 'settimana': {
      const giorni = giorniDi(regola)
      if (giorni.length === 7) return `${quando}, tutti i giorni`
      return `${quando}, ${elenca(giorni.map(nomeGiorno))}`
    }
    case 'mese':
      return `${quando} ${ilGiorno(g)}${g > 28 ? ' (o l’ultimo del mese)' : ''}`
    case 'anno':
      return `${quando} ${ilGiorno(g)} ${NOMI_MESI[mese - 1]}`
  }
}

/** "oggi", "domani", "ieri", oppure "ven 3 ott" (con l'anno se non è quello di `rispetto`). */
export function formattaGiorno(g: Giorno, rispetto: Giorno): string {
  const differenza = numero(g) - numero(rispetto)
  if (differenza === 0) return 'oggi'
  if (differenza === 1) return 'domani'
  if (differenza === -1) return 'ieri'
  const stessoAnno = g.slice(0, 4) === rispetto.slice(0, 4)
  return new Intl.DateTimeFormat('it-IT', {
    weekday: 'short',
    day: 'numeric',
    month: 'short',
    year: stessoAnno ? undefined : 'numeric',
    timeZone: 'UTC',
  }).format(new Date(numero(g) * GIORNO_MS))
}

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

// Le scelte del modale --------------------------------------------------------------
//
// Nel modale non si sceglie la data di inizio: si sceglie "ogni quanto", in che
// giorni (della settimana, del mese, dell'anno) e, se si ripete ogni N, quale
// delle prossime N date è la prima volta. L'inizio si ricava da qui.

/** Il giorno del mese che vale "l'ultimo": i mesi più corti lo portano al loro ultimo. */
export const ULTIMO = 31

export interface Scelte {
  unita: Unita
  ogni: number
  /** Per le settimanali: 1 = lunedì … 7 = domenica. */
  giorni: number[]
  /** Per mensili e annuali: 1–31, 31 = l'ultimo. */
  giornoMese: number
  /** Per le annuali: 1–12. */
  mese: number
  /** Con "ogni N": la prima volta è tra 0 … N−1 unità (giorni, settimane, mesi, anni). */
  sfasamento: number
}

function giorniNelMese(anno: number, mese0: number): number {
  return new Date(Date.UTC(anno, mese0 + 1, 0)).getUTCDate()
}

function componenti(g: Giorno): [number, number, number] {
  const [a, m, d] = g.split('-').map(Number)
  return [a, m, d]
}

function data(anno: number, mese0: number, g: number): Giorno {
  return giorno(Date.UTC(anno, mese0, g) / GIORNO_MS)
}

/** Il primo mese da `mese` (contato da gennaio dell'anno 0) in poi che ha il giorno `g`. */
function meseCon(mese: number, g: number): number {
  let m = mese
  while (giorniNelMese(Math.floor(m / 12), m % 12) < g) m++
  return m
}

/** L'inizio della regola scelta, con `oggi` come riferimento. */
export function inizioDa(scelte: Scelte, oggi: Giorno): Giorno {
  const k = Math.max(0, Math.floor(scelte.sfasamento))
  const n = numero(oggi)
  const [anno, mese] = componenti(oggi)

  switch (scelte.unita) {
    case 'giorno':
      return giorno(n + k)
    case 'settimana':
      // Il lunedì della settimana: i giorni già passati li scarta `occorrenzaDa`.
      return giorno(n - (giornoSettimana(n) - 1) + 7 * k)
    case 'mese': {
      const g = scelte.giornoMese
      let primo = meseCon(anno * 12 + mese - 1, g)
      if (data(Math.floor(primo / 12), primo % 12, g) < oggi) primo = meseCon(primo + 1, g)
      const m = meseCon(primo + k, g)
      return data(Math.floor(m / 12), m % 12, g)
    }
    case 'anno': {
      const g = Math.min(scelte.giornoMese, scelte.mese === 2 ? 29 : giorniNelMese(2001, scelte.mese - 1))
      const valido = (a: number) => g <= giorniNelMese(a, scelte.mese - 1)
      let a = anno
      while (!valido(a) || data(a, scelte.mese - 1, g) < oggi) a++
      a += k
      while (!valido(a)) a++
      return data(a, scelte.mese - 1, g)
    }
  }
}

export function regolaDa(scelte: Scelte, oggi: Giorno): Regola {
  return {
    unita: scelte.unita,
    ogni: Math.max(1, Math.floor(scelte.ogni)),
    giorni: scelte.unita === 'settimana' ? [...scelte.giorni].sort((a, b) => a - b) : null,
    inizio: inizioDa(scelte, oggi),
  }
}

/** Le possibili "prima volta", una per sfasamento: `ogni` date da scegliere. */
export function primeVolte(scelte: Scelte, oggi: Giorno): Giorno[] {
  const ogni = Math.max(1, Math.floor(scelte.ogni))
  return Array.from({ length: ogni }, (_, k) => occorrenzaDa(regolaDa({ ...scelte, sfasamento: k }, oggi), oggi))
}

/** Le scelte per una ricorrenza nuova (`null`) o da modificare, che ne ritrovano le stesse date. */
export function scelteDa(ricorrenza: Ricorrenza | null, oggi: Giorno): Scelte {
  const [, meseOggi, giornoOggi] = componenti(oggi)
  if (!ricorrenza) {
    return {
      unita: 'settimana',
      ogni: 1,
      giorni: [giornoSettimanaDi(oggi)],
      giornoMese: giornoOggi > 28 ? ULTIMO : giornoOggi,
      mese: meseOggi,
      sfasamento: 0,
    }
  }
  const [, mese, g] = componenti(ricorrenza.inizio)
  const scelte: Scelte = {
    unita: ricorrenza.unita,
    ogni: ricorrenza.ogni,
    giorni: ricorrenza.giorni ?? [giornoSettimanaDi(ricorrenza.inizio)],
    giornoMese: g,
    mese,
    sfasamento: 0,
  }
  const prossima = occorrenzaDa(ricorrenza, oggi)
  const k = primeVolte(scelte, oggi).indexOf(prossima)
  return { ...scelte, sfasamento: Math.max(0, k) }
}

// A parole ----------------------------------------------------------------------

const NOMI_GIORNI = ['lunedì', 'martedì', 'mercoledì', 'giovedì', 'venerdì', 'sabato', 'domenica']
export const GIORNI_BREVI = ['L', 'M', 'M', 'G', 'V', 'S', 'D']
export const NOMI_MESI = [
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
      if (g === ULTIMO) return `${quando} l’ultimo giorno`
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

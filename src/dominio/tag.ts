// I tag nel titolo (doc/08-interfaccia.md, "Tag"): parole tra parentesi angolari,
// `<urgente> Chiamare l'idraulico`, da una lista fissa. Qui c'è solo il
// riconoscimento; icone e colori dei badge stanno nell'interfaccia.
//
// Alcuni tag portano una data dopo il nome: `<scadenza 31/12/26>`,
// `<attesa 3/11/2026>` (anno a 2 o 4 cifre). Con una data che non esiste il tag è fuori elenco, quindi neutro.

import type { Giorno } from './tipi'

export type ColoreTag =
  | 'rosso'
  | 'sabbia'
  | 'terracotta'
  | 'giallo'
  | 'viola'
  | 'ardesia'
  | 'blu'
  | 'arancio'
  | 'rosa'
  | 'verde'
  | 'pesca'
  | 'acqua'
  | 'indaco'
  | 'lime'
  | 'cielo'
  | 'ocra'
  | 'corallo'
  | 'muschio'
  | 'grafite'
  | 'bronzo'
  | 'lampone'
  | 'malva'
  | 'lavanda'
  /** Una data passata: fondo rosso acceso e testo bianco, da vedere subito. */
  | 'allarme'

export interface Tag {
  nome: string
  colore: ColoreTag
  uso: string
  /** Non si propone a chi scrive: lo aggiungerà l'assistente IA (fase 4). */
  riservato: boolean
  /** Si scrive con una data dopo il nome: `<scadenza 31/12/26>`, `<attesa 3/11/26>`. */
  data?: true
}

export const TAG: readonly Tag[] = [
  { nome: 'urgente', colore: 'rosso', uso: 'va fatto presto', riservato: false },
  { nome: 'fai da te', colore: 'sabbia', uso: 'lavoro manuale da fare in autonomia', riservato: false },
  { nome: 'guasto', colore: 'terracotta', uso: 'qualcosa da riparare o far riparare', riservato: false },
  { nome: 'idea', colore: 'giallo', uso: 'da valutare, nessun impegno', riservato: false },
  { nome: 'progetto', colore: 'ardesia', uso: 'non ancora definito, da finire di pensare', riservato: false },
  { nome: 'inverno', colore: 'blu', uso: "da fare d'inverno", riservato: false },
  { nome: 'estate', colore: 'arancio', uso: "da fare d'estate", riservato: false },
  { nome: 'cucito', colore: 'rosa', uso: 'lavoro di cucito', riservato: false },
  { nome: 'natalizio', colore: 'verde', uso: 'per Natale', riservato: false },
  { nome: 'cucina', colore: 'pesca', uso: 'ricette e cose da cucinare', riservato: false },
  { nome: 'bug', colore: 'acqua', uso: "un difetto in un programma o in un'app", riservato: false },
  { nome: 'scadenza', colore: 'indaco', uso: 'entro una data: <scadenza 31/12/26>', riservato: false, data: true },
  { nome: 'attesa', colore: 'lavanda', uso: 'si aspetta qualcosa per una data: <attesa 31/12/26>', riservato: false, data: true },
  { nome: 'acquisto', colore: 'lime', uso: 'cose da comprare per finire il lavoro', riservato: false },
  { nome: 'chiamare', colore: 'cielo', uso: 'si risolve con una telefonata', riservato: false },
  { nome: 'pratica', colore: 'ocra', uso: 'burocrazia, bollettini, rinnovi', riservato: false },
  { nome: 'veloce', colore: 'corallo', uso: 'meno di 15 minuti', riservato: false },
  { nome: 'giardino', colore: 'muschio', uso: 'piante, prato e orto', riservato: false },
  { nome: 'auto', colore: 'grafite', uso: "per l'auto", riservato: false },
  { nome: 'moto', colore: 'bronzo', uso: 'per la moto', riservato: false },
  { nome: 'insieme', colore: 'lampone', uso: 'da fare in coppia', riservato: false },
  { nome: 'regalo', colore: 'malva', uso: 'compleanni e regali', riservato: false },
  { nome: 'ia', colore: 'viola', uso: "creata dall'assistente", riservato: true },
]

/**
 * Un pezzo del titolo: testo semplice, oppure un tag (`tag` è null se non è in
 * elenco). Un tag con la data ha anche `giorno`, e il nome comprende la data.
 */
export type Pezzo =
  | { tipo: 'testo'; testo: string }
  | { tipo: 'tag'; nome: string; tag: Tag | null; giorno?: Giorno }

const RACCHIUSO = /<([^<>]+)>/g

const spazi = (testo: string) => testo.replace(/\s+/g, ' ').trim()

/** Il tag in elenco con questo nome, senza distinguere maiuscole, minuscole e spazi. */
export function trovaTag(nome: string): Tag | null {
  const chiave = spazi(nome).toLowerCase()
  return TAG.find((tag) => tag.nome === chiave) ?? null
}

const CON_DATA = /^(.+) (\d{1,2})\/(\d{1,2})\/(\d{2}|\d{4})$/

/** Il giorno `gg/mm/aa` o `gg/mm/aaaa`, se esiste: l'anno a 2 cifre è del 2000. */
function leggiGiorno(gg: string, mm: string, aa: string): Giorno | null {
  const anno = aa.length === 2 ? 2000 + Number(aa) : Number(aa)
  const data = new Date(Date.UTC(anno, Number(mm) - 1, Number(gg)))
  if (data.getUTCFullYear() !== anno || data.getUTCMonth() !== Number(mm) - 1 || data.getUTCDate() !== Number(gg)) {
    return null
  }
  return data.toISOString().slice(0, 10)
}

/** Il tag con la data scritto così (`scadenza 31/12/26`), se nome e data sono validi. */
export function trovaTagConData(nome: string): { tag: Tag; giorno: Giorno; testo: string } | null {
  const trovato = spazi(nome).toLowerCase().match(CON_DATA)
  if (!trovato) return null
  const tag = trovaTag(trovato[1])
  const giorno = leggiGiorno(trovato[2], trovato[3], trovato[4])
  if (!tag?.data || !giorno) return null
  return { tag, giorno, testo: `${tag.nome} ${trovato[2]}/${trovato[3]}/${trovato[4]}` }
}

/** Il titolo diviso in testo e tag, nell'ordine in cui compaiono. */
export function pezziTitolo(titolo: string): Pezzo[] {
  const pezzi: Pezzo[] = []
  const testo = (grezzo: string) => {
    const pulito = spazi(grezzo)
    if (pulito) pezzi.push({ tipo: 'testo', testo: pulito })
  }

  let da = 0
  for (const trovato of titolo.matchAll(RACCHIUSO)) {
    const nome = spazi(trovato[1])
    // "< >" non è un tag: resta nel testo.
    if (!nome) continue
    testo(titolo.slice(da, trovato.index))
    const conData = trovaTagConData(nome)
    const tag = trovaTag(nome)
    if (conData) pezzi.push({ tipo: 'tag', nome: conData.testo, tag: conData.tag, giorno: conData.giorno })
    // Con una data che non esiste (`<scadenza 31/02/26>`) il tag è fuori elenco, quindi neutro.
    else pezzi.push({ tipo: 'tag', nome: tag?.nome ?? nome, tag })
    da = trovato.index + trovato[0].length
  }
  testo(titolo.slice(da))
  return pezzi
}

// Suggerimenti mentre si scrive -----------------------------------------------------

/** Il tag che si sta scrivendo nel titolo: da `da` (il "<") ad `a`, con il testo già scritto. */
export interface TagInCorso {
  da: number
  a: number
  testo: string
}

/**
 * Il tag su cui sta il cursore: un "<" prima del cursore non ancora chiuso. Se
 * più avanti c'è già il ">" (si corregge un tag), il tag arriva fin lì.
 */
export function tagInCorso(titolo: string, cursore: number): TagInCorso | null {
  const prima = titolo.slice(0, cursore)
  const apre = prima.lastIndexOf('<')
  if (apre < 0) return null
  const testo = prima.slice(apre + 1)
  if (testo.includes('>')) return null
  const dopo = titolo.slice(cursore)
  const confine = dopo.search(/[<>]/)
  const a = confine >= 0 && dopo[confine] === '>' ? cursore + confine + 1 : cursore
  return { da: apre, a, testo }
}

/**
 * I tag da proporre per il testo scritto dopo "<": prima quelli che iniziano
 * così. Mai i riservati, e niente mentre si scrive la data di un tag con la data.
 */
export function suggerisciTag(testo: string): Tag[] {
  const cerca = spazi(testo).toLowerCase()
  const scritto = testo.replace(/\s+/g, ' ').trimStart().toLowerCase()
  if (TAG.some((tag) => tag.data && scritto.startsWith(`${tag.nome} `))) return []
  const inizia = (tag: Tag) => (tag.nome.startsWith(cerca) ? 1 : 0)
  return TAG.filter((tag) => !tag.riservato && tag.nome.includes(cerca)).sort((a, b) => inizia(b) - inizia(a))
}

/**
 * Il titolo con il tag scelto al posto di quello in corso, in maiuscolo e
 * seguito da uno spazio, e dove rimettere il cursore: subito dopo lo spazio.
 * Per un tag con la data il cursore resta dentro il tag, pronto per la data.
 */
export function inserisciTag(titolo: string, inCorso: TagInCorso, nome: string): { titolo: string; cursore: number } {
  const prima = titolo.slice(0, inCorso.da)
  const dopo = titolo.slice(inCorso.a)
  if (trovaTag(nome)?.data) {
    const apre = `<${nome.toUpperCase()} `
    return { titolo: `${prima}${apre}>${dopo.startsWith(' ') ? '' : ' '}${dopo}`, cursore: prima.length + apre.length }
  }
  const tag = `<${nome.toUpperCase()}>`
  const spazio = dopo.startsWith(' ') ? '' : ' '
  return { titolo: prima + tag + spazio + dopo, cursore: prima.length + tag.length + 1 }
}

/** Il titolo senza i tag: serve a ordinare per titolo. */
export function titoloSenzaTag(titolo: string): string {
  return pezziTitolo(titolo)
    .flatMap((pezzo) => (pezzo.tipo === 'testo' ? [pezzo.testo] : []))
    .join(' ')
}

// Scadenze e attese -----------------------------------------------------------------

/** Quanti giorni prima la scadenza si fa arancione. */
export const SCADENZA_VICINA = 3

/**
 * Il colore del badge di un tag con la data: `allarme` se la data è passata;
 * una scadenza è anche rossa il giorno stesso e arancio nei giorni prima.
 * Altrimenti il colore del tag.
 */
export function coloreConData(tag: Tag, giorno: Giorno, oggi: Giorno): ColoreTag {
  const giorni = (Date.parse(giorno) - Date.parse(oggi)) / 86_400_000
  if (giorni < 0) return 'allarme'
  if (tag.nome === 'scadenza' && giorni === 0) return 'rosso'
  if (tag.nome === 'scadenza' && giorni <= SCADENZA_VICINA) return 'arancio'
  return tag.colore
}

/** La scadenza più vicina scritta nel titolo, se c'è: serve a ordinare. */
export function scadenzaDi(titolo: string): Giorno | null {
  let prima: Giorno | null = null
  for (const pezzo of pezziTitolo(titolo)) {
    if (pezzo.tipo === 'tag' && pezzo.tag?.nome === 'scadenza' && pezzo.giorno && (!prima || pezzo.giorno < prima)) {
      prima = pezzo.giorno
    }
  }
  return prima
}

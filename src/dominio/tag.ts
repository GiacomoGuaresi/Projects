// I tag nel titolo (doc/08-interfaccia.md, "Tag"): parole tra parentesi angolari,
// `<urgente> Chiamare l'idraulico`, da una lista fissa. Qui c'è solo il
// riconoscimento; icone e colori dei badge stanno nell'interfaccia.

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

export interface Tag {
  nome: string
  colore: ColoreTag
  uso: string
  /** Non si propone a chi scrive: lo aggiungerà l'assistente IA (fase 4). */
  riservato: boolean
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
  { nome: 'ia', colore: 'viola', uso: "creata dall'assistente", riservato: true },
]

/** Un pezzo del titolo: testo semplice, oppure un tag (`tag` è null se non è in elenco). */
export type Pezzo = { tipo: 'testo'; testo: string } | { tipo: 'tag'; nome: string; tag: Tag | null }

const RACCHIUSO = /<([^<>]+)>/g

const spazi = (testo: string) => testo.replace(/\s+/g, ' ').trim()

/** Il tag in elenco con questo nome, senza distinguere maiuscole, minuscole e spazi. */
export function trovaTag(nome: string): Tag | null {
  const chiave = spazi(nome).toLowerCase()
  return TAG.find((tag) => tag.nome === chiave) ?? null
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
    const tag = trovaTag(nome)
    pezzi.push({ tipo: 'tag', nome: tag?.nome ?? nome, tag })
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

/** I tag da proporre per il testo scritto dopo "<": prima quelli che iniziano così. Mai i riservati. */
export function suggerisciTag(testo: string): Tag[] {
  const cerca = spazi(testo).toLowerCase()
  const inizia = (tag: Tag) => (tag.nome.startsWith(cerca) ? 1 : 0)
  return TAG.filter((tag) => !tag.riservato && tag.nome.includes(cerca)).sort((a, b) => inizia(b) - inizia(a))
}

/**
 * Il titolo con il tag scelto al posto di quello in corso, in maiuscolo e
 * seguito da uno spazio, e dove rimettere il cursore: subito dopo lo spazio.
 */
export function inserisciTag(titolo: string, inCorso: TagInCorso, nome: string): { titolo: string; cursore: number } {
  const prima = titolo.slice(0, inCorso.da)
  const dopo = titolo.slice(inCorso.a)
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

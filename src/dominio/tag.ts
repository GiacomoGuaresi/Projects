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

/** Il titolo senza i tag: serve a ordinare per titolo. */
export function titoloSenzaTag(titolo: string): string {
  return pezziTitolo(titolo)
    .flatMap((pezzo) => (pezzo.tipo === 'testo' ? [pezzo.testo] : []))
    .join(' ')
}

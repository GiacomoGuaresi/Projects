// Il progetto è un'etichetta libera sull'attività (doc/04-modello-dati.md), non
// un'entità: qui l'icona, i progetti in uso con i suggerimenti, e la scelta tra
// salvare subito e chiedere "solo questa / tutte" quando lo si cambia.

import type { Attivita } from './tipi'

// Icona ------------------------------------------------------------------------
// doc/08-interfaccia.md, "Icona del progetto": le prime due lettere del nome e
// una tonalità ricavata dal nome stesso, così lo stesso progetto ha sempre lo
// stesso colore.

/** Le iniziali: i primi due caratteri del nome, in maiuscolo ("Casa" → "CA"). */
export function iniziali(progetto: string): string {
  return Array.from(progetto.trim()).slice(0, 2).join('').toUpperCase()
}

/**
 * La tonalità (0–359) del colore del progetto. Non distingue maiuscole e
 * minuscole né gli spazi ai bordi: "casa" e " Casa" hanno lo stesso colore.
 */
export function tonalita(progetto: string): number {
  const chiave = progetto.trim().toLowerCase()
  let hash = 0
  for (const carattere of chiave) {
    hash = (Math.imul(hash, 31) + carattere.codePointAt(0)!) | 0
  }
  return Math.abs(hash) % 360
}

/** Il colore di fondo dell'icona: pastello, con testo scuro leggibile sopra. */
export function coloreProgetto(progetto: string): string {
  return `hsl(${tonalita(progetto)} 45% 82%)`
}

// Progetti in uso -----------------------------------------------------------------

/** Un progetto come lo mostra la vista `projects.progetti`. */
export interface ProgettoInUso {
  /** La grafia più usata. */
  progetto: string
  quante: number
  quanteAperte: number
}

/** Due grafie dello stesso progetto hanno la stessa chiave ("casa", " Casa"). */
export function chiaveProgetto(progetto: string): string {
  return progetto.trim().toLowerCase()
}

/**
 * I progetti delle attività, come la vista `progetti`: raggruppati senza
 * distinguere maiuscole e minuscole, ciascuno con la grafia più usata (a
 * parità, la prima in ordine). L'app li ricava dall'elenco che ha già caricato,
 * così restano allineati a ogni modifica senza rileggere il database.
 */
export function progettiInUso(attivita: readonly Pick<Attivita, 'progetto' | 'stato'>[]): ProgettoInUso[] {
  const gruppi = new Map<string, { grafie: Map<string, number>; quante: number; quanteAperte: number }>()
  for (const { progetto, stato } of attivita) {
    const nome = progetto?.trim()
    if (!nome) continue
    const chiave = chiaveProgetto(nome)
    const gruppo = gruppi.get(chiave) ?? { grafie: new Map(), quante: 0, quanteAperte: 0 }
    gruppo.grafie.set(nome, (gruppo.grafie.get(nome) ?? 0) + 1)
    gruppo.quante++
    if (stato !== 'completo') gruppo.quanteAperte++
    gruppi.set(chiave, gruppo)
  }

  return [...gruppi.values()]
    .map(({ grafie, quante, quanteAperte }) => {
      const [progetto] = [...grafie].reduce((migliore, grafia) =>
        grafia[1] > migliore[1] || (grafia[1] === migliore[1] && grafia[0] < migliore[0]) ? grafia : migliore,
      )
      return { progetto, quante, quanteAperte }
    })
    .sort((a, b) => a.progetto.localeCompare(b.progetto, 'it', { sensitivity: 'base' }))
}

/** Il progetto in uso con questo nome, a meno di maiuscole, minuscole e spazi. */
export function trovaProgetto(nome: string, progetti: readonly ProgettoInUso[]): ProgettoInUso | null {
  const chiave = chiaveProgetto(nome)
  return progetti.find((p) => chiaveProgetto(p.progetto) === chiave) ?? null
}

/**
 * Il progetto da salvare per il testo scritto (doc/04, "Suggerimenti del
 * progetto"): vuoto diventa null, e se corrisponde a un progetto esistente si
 * usa la grafia già presente, così "casa" e "Casa" non diventano due progetti.
 */
export function normalizzaProgetto(testo: string, progetti: readonly ProgettoInUso[]): string | null {
  const nome = testo.trim()
  if (!nome) return null
  return trovaProgetto(nome, progetti)?.progetto ?? nome
}

/**
 * I progetti da suggerire mentre si scrive: quelli che contengono il testo,
 * prima quelli che iniziano così, poi i più usati tra le attività aperte. Il
 * progetto già scritto per intero non si ripropone.
 */
export function suggerisciProgetti(
  testo: string,
  progetti: readonly ProgettoInUso[],
  massimo = 6,
): string[] {
  const cerca = chiaveProgetto(testo)
  const inizia = (p: ProgettoInUso) => (chiaveProgetto(p.progetto).startsWith(cerca) ? 1 : 0)
  return progetti
    .filter((p) => {
      const chiave = chiaveProgetto(p.progetto)
      return chiave.includes(cerca) && chiave !== cerca
    })
    .sort(
      (a, b) =>
        inizia(b) - inizia(a) ||
        b.quanteAperte - a.quanteAperte ||
        b.quante - a.quante ||
        a.progetto.localeCompare(b.progetto, 'it', { sensitivity: 'base' }),
    )
    .slice(0, massimo)
    .map((p) => p.progetto)
}

// Cambio del progetto -----------------------------------------------------------------

/**
 * Cosa fare quando si cambia il progetto di un'attività esistente
 * (doc/08-interfaccia.md, "Cambio del progetto"):
 * - `nessuno`: il progetto non cambia;
 * - `salva`: si salva e basta (partenza vuota, o nessun'altra attività lo usa);
 * - `chiedi`: "solo questa / tutte le `quante` attività di `da`".
 */
export type CambioProgetto =
  | { tipo: 'nessuno' }
  | { tipo: 'salva'; progetto: string | null }
  | { tipo: 'chiedi'; da: string; a: string | null; quante: number }

export function cambioProgetto(
  attuale: string | null,
  testo: string,
  progetti: readonly ProgettoInUso[],
): CambioProgetto {
  const scritto = testo.trim()
  // Cambiare solo maiuscole e minuscole è una correzione: si tiene la grafia
  // scritta, invece di ricondurla a quella già in uso.
  const soloGrafia = attuale !== null && chiaveProgetto(attuale) === chiaveProgetto(scritto)
  const nuovo = soloGrafia ? scritto : normalizzaProgetto(scritto, progetti)

  if (nuovo === attuale) return { tipo: 'nessuno' }
  if (attuale === null) return { tipo: 'salva', progetto: nuovo }

  const partenza = trovaProgetto(attuale, progetti)
  if (!partenza || partenza.quante <= 1) return { tipo: 'salva', progetto: nuovo }
  return { tipo: 'chiedi', da: partenza.progetto, a: nuovo, quante: partenza.quante }
}

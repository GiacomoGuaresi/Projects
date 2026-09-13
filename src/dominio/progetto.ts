// L'icona di un progetto (doc/08-interfaccia.md, "Icona del progetto"): le prime
// due lettere del nome e una tonalità ricavata dal nome stesso, così lo stesso
// progetto ha sempre lo stesso colore.

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

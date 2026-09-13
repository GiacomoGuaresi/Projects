// Checklist scritte di fretta: "[ ] pane" o "[x] latte" senza il trattino
// davanti non sono elenchi per GFM. Qui diventano "- [ ] pane", così si vedono
// come caselle.

export function normalizzaChecklist(testo: string): string {
  return testo
    .split('\n')
    .map((riga) => {
      const trovato = riga.match(/^(\s*)(?:[-*+]\s+)?\[([ xX])\]\s+(.*)$/)
      if (!trovato) return riga
      const [, rientro, segno, resto] = trovato
      return `${rientro}- [${segno === ' ' ? ' ' : 'x'}] ${resto}`
    })
    .join('\n')
}

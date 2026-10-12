// La ricerca della Dashboard (doc/08-interfaccia.md, "Dashboard"): il testo
// scritto si cerca nel nome del progetto e nel titolo delle attività.

/** Minuscolo e senza accenti: "Caffè" e "caffe" sono lo stesso testo. */
function semplifica(testo: string): string {
  return testo
    .normalize('NFD')
    .replace(/\p{M}/gu, '')
    .toLowerCase()
}

/** Le parole da cercare: il testo scritto, diviso agli spazi. Vuoto se non si cerca niente. */
export function paroleRicerca(testo: string): string[] {
  return semplifica(testo).split(/\s+/).filter(Boolean)
}

/**
 * Vero se il testo contiene tutte le parole, in qualsiasi ordine e anche a
 * metà parola ("soft" trova "Software"). Senza parole è sempre vero.
 */
export function contieneParole(testo: string, parole: readonly string[]): boolean {
  const semplice = semplifica(testo)
  return parole.every((parola) => semplice.includes(parola))
}

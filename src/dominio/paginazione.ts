// La paginazione di dashboard (50 per sezione) e pagina Attività (25/50/100).

export interface Pagina<T> {
  elementi: T[]
  /** Da 1; riportato dentro i limiti se l'elenco si è accorciato. */
  numero: number
  pagine: number
  /** Posizione (da 1) del primo e dell'ultimo elemento mostrato; 0 se vuota. */
  da: number
  a: number
  totale: number
}

export function pagina<T>(elenco: readonly T[], numero: number, perPagina: number): Pagina<T> {
  const pagine = Math.max(1, Math.ceil(elenco.length / perPagina))
  const corrente = Math.min(Math.max(1, Math.trunc(numero)), pagine)
  const inizio = (corrente - 1) * perPagina
  const elementi = elenco.slice(inizio, inizio + perPagina)
  return {
    elementi,
    numero: corrente,
    pagine,
    da: elementi.length ? inizio + 1 : 0,
    a: inizio + elementi.length,
    totale: elenco.length,
  }
}

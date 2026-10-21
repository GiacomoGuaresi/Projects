// Il cestino delle attività (doc/08-interfaccia.md, "Cestino"): un'attività
// eliminata resta recuperabile per 30 giorni, poi l'app la elimina per sempre.

import type { Attivita } from './tipi'

export const GIORNI_NEL_CESTINO = 30

const GIORNO_MS = 24 * 60 * 60 * 1000

/** Il momento prima del quale le cestinate sono da eliminare per sempre. */
export function limiteCestino(adesso = new Date()): Date {
  return new Date(adesso.getTime() - GIORNI_NEL_CESTINO * GIORNO_MS)
}

/** I giorni che le restano nel cestino, arrotondati per eccesso: mai sotto 0. */
export function giorniRimasti(attivita: Pick<Attivita, 'eliminata_il'>, adesso = new Date()): number {
  if (attivita.eliminata_il === null) return GIORNI_NEL_CESTINO
  const fine = new Date(attivita.eliminata_il).getTime() + GIORNI_NEL_CESTINO * GIORNO_MS
  return Math.max(0, Math.ceil((fine - adesso.getTime()) / GIORNO_MS))
}

/** Le cestinate ancora recuperabili, dalla più recente. */
export function nelCestino(attivita: readonly Attivita[], adesso = new Date()): Attivita[] {
  const limite = limiteCestino(adesso).toISOString()
  return attivita
    .filter((a) => a.eliminata_il !== null && a.eliminata_il >= limite)
    .sort((a, b) => b.eliminata_il!.localeCompare(a.eliminata_il!) || b.id - a.id)
}

// Le faccende (doc/08-interfaccia.md, "Faccende"): attività veloci che, una
// volta fatte, restano barrate fino a fine giornata e poi spariscono.

import type { Faccenda } from './tipi'

/** La mezzanotte di oggi, nel fuso del dispositivo: le completate prima sono da eliminare. */
export function inizioGiornata(adesso = new Date()): Date {
  const inizio = new Date(adesso)
  inizio.setHours(0, 0, 0, 0)
  return inizio
}

/** Completata prima di oggi: l'app la elimina, e intanto non la mostra. */
export function scaduta(faccenda: Faccenda, adesso = new Date()): boolean {
  return (
    faccenda.completa &&
    faccenda.completata_il !== null &&
    new Date(faccenda.completata_il) < inizioGiornata(adesso)
  )
}

/**
 * Le faccende da mostrare: prima quelle da fare, dalla più vecchia; poi le
 * fatte oggi, dalla più recente. Le scadute non ci sono.
 */
export function faccendeDiOggi(faccende: readonly Faccenda[], adesso = new Date()): Faccenda[] {
  return faccende
    .filter((f) => !scaduta(f, adesso))
    .sort((a, b) => {
      if (a.completa !== b.completa) return a.completa ? 1 : -1
      if (a.completa) return (b.completata_il ?? '').localeCompare(a.completata_il ?? '') || b.id - a.id
      return a.creata_il.localeCompare(b.creata_il) || a.id - b.id
    })
}

/** La regola del database (supabase/sql/002_faccende.sql), per mostrare subito il risultato. */
export function segnaCompleta(faccenda: Faccenda, completa: boolean, adesso = new Date()): Faccenda {
  if (completa === faccenda.completa) return faccenda
  return { ...faccenda, completa, completata_il: completa ? adesso.toISOString() : null }
}

// Le regole che il database applica a ogni salvataggio (trigger in
// supabase/sql/001_schema.sql), ripetute qui per mostrare subito il risultato
// di una modifica, prima che arrivi la riga salvata.

import type { Attivita, Modifica } from './tipi'

export function applicaModifica(attivita: Attivita, modifica: Modifica, adesso = new Date()): Attivita {
  const nuova = { ...attivita, ...modifica }
  if ('progetto' in modifica) nuova.progetto = nuova.progetto?.trim() || null

  if (nuova.stato === 'completo') {
    nuova.avanzamento = 100
    if (attivita.stato !== 'completo') nuova.completata_il = adesso.toISOString()
  } else {
    nuova.completata_il = null
  }

  nuova.modificata_il = adesso.toISOString()
  return nuova
}

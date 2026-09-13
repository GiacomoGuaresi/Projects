// Le regole che il database applica a ogni salvataggio (trigger in
// supabase/sql/001_schema.sql), ripetute qui per mostrare subito il risultato
// di una modifica, prima che arrivi la riga salvata.

import type { Attivita, Modifica, Stato } from './tipi'

/**
 * Lo stato a cui passa un'attività toccando la sua icona nella Dashboard
 * (doc/08-interfaccia.md): da fare → in corso → completo; una completa o
 * bloccata torna in corso.
 */
export function statoSuccessivo(stato: Stato): Stato {
  return stato === 'in_corso' ? 'completo' : 'in_corso'
}

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

// Punto d'ingresso dei dati: un solo client Supabase, sullo schema `projects`
// del progetto di produzione di Grocery (doc/03-architettura.md).

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AccessoSupabase, type Accesso } from './accesso'
import { AttivitaSupabase } from './attivita'
import { DiarioSupabase } from './diario'

export type { Accesso, EsitoAccesso } from './accesso'
export type { AttivitaSupabase, RigaAttivita } from './attivita'
export type { DiarioSupabase } from './diario'

let connessione: { accesso: Accesso; attivita: AttivitaSupabase; diario: DiarioSupabase } | null = null

/**
 * Il client è uno solo: accesso e query condividono la sessione.
 *
 * La sessione sta nei cookie (400 giorni, rinnovati a ogni uso) con percorso `/`:
 * Grocery sta sulla stessa origine e sullo stesso progetto Supabase, quindi con
 * lo stesso percorso le due app condividono la sessione (doc/05-sicurezza.md).
 */
function connetti() {
  if (connessione) return connessione
  const url = import.meta.env.VITE_SUPABASE_URL
  const chiave = import.meta.env.VITE_SUPABASE_PUBLISHABLE_KEY
  const email = import.meta.env.VITE_SUPABASE_EMAIL
  if (!url || !chiave || !email) {
    throw new Error(
      'Mancano VITE_SUPABASE_URL, VITE_SUPABASE_PUBLISHABLE_KEY o VITE_SUPABASE_EMAIL: vedi .env.example',
    )
  }
  const client = createBrowserClient(url, chiave, {
    cookieOptions: { path: '/' },
    db: { schema: 'projects' },
  }) as unknown as SupabaseClient
  connessione = {
    accesso: new AccessoSupabase(client, email),
    attivita: new AttivitaSupabase(client),
    diario: new DiarioSupabase(client),
  }
  return connessione
}

/** Chi può entrare: serve la sessione aperta dalla passphrase. */
export function accesso(): Accesso {
  return connetti().accesso
}

/** Le query sulle attività. */
export function attivita(): AttivitaSupabase {
  return connetti().attivita
}

/** Le query sul diario. */
export function diario(): DiarioSupabase {
  return connetti().diario
}

// Punto d'ingresso dei dati: un solo client Supabase, sullo schema `projects`
// del progetto di produzione di Grocery (doc/03-architettura.md).

import { createBrowserClient } from '@supabase/ssr'
import type { SupabaseClient } from '@supabase/supabase-js'
import { AccessoSupabase, type Accesso } from './accesso'

export type { Accesso, EsitoAccesso } from './accesso'

let connessione: { client: SupabaseClient; accesso: Accesso } | null = null

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
  connessione = { client, accesso: new AccessoSupabase(client, email) }
  return connessione
}

/** Chi può entrare: serve la sessione aperta dalla passphrase. */
export function accesso(): Accesso {
  return connetti().accesso
}

/** Il client per le query sullo schema `projects`. */
export function db(): SupabaseClient {
  return connetti().client
}

// Le query sulle attività, sullo schema `projects` (doc/04-modello-dati.md).
// Le regole (completo ⇒ 100%, date, progetto ripulito) le applica il database:
// chi modifica riceve indietro la riga come è stata salvata.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Attivita, Modifica, NuovaAttivita } from '../dominio/tipi'

/** Una riga della tabella: la vista `attivita_elenco` aggiunge `ha_diario`. */
export type RigaAttivita = Omit<Attivita, 'ha_diario'>

/** Un errore di Supabase, con un messaggio che dice cosa non è riuscito. */
function fallita(cosa: string, errore: { message: string; code?: string }): Error {
  console.error(cosa, errore)
  return new Error(`${cosa}: ${errore.message}`, { cause: errore })
}

export class AttivitaSupabase {
  constructor(private readonly client: SupabaseClient) {}

  /** Tutte le attività, completate comprese: sono al massimo qualche centinaio. */
  async elenco(): Promise<Attivita[]> {
    const { data, error } = await this.client.from('attivita_elenco').select('*')
    if (error) throw fallita('Attività non caricate', error)
    return data as Attivita[]
  }

  async crea(nuova: NuovaAttivita): Promise<Attivita> {
    const { data, error } = await this.client.from('attivita').insert(nuova).select().single()
    if (error) throw fallita('Attività non creata', error)
    return { ...(data as RigaAttivita), ha_diario: false }
  }

  async modifica(id: number, modifica: Modifica): Promise<RigaAttivita> {
    const { data, error } = await this.client
      .from('attivita')
      .update(modifica)
      .eq('id', id)
      .select()
      .single()
    if (error) throw fallita('Modifica non salvata', error)
    return data as RigaAttivita
  }

  /** Elimina anche il diario (ON DELETE CASCADE). */
  async elimina(id: number): Promise<void> {
    const { error } = await this.client.from('attivita').delete().eq('id', id)
    if (error) throw fallita('Attività non eliminata', error)
  }

  /**
   * Cambia il progetto a tutte le sue attività, completate comprese; `null`
   * lo toglie. Restituisce quante attività ha cambiato.
   */
  async rinominaProgetto(vecchio: string, nuovo: string | null): Promise<number> {
    const { data, error } = await this.client.rpc('rinomina_progetto', { vecchio, nuovo: nuovo ?? '' })
    if (error) throw fallita('Progetto non rinominato', error)
    return data as number
  }
}

// Le query sulle attività, sullo schema `projects` (doc/04-modello-dati.md).
// Le regole (completo ⇒ 100%, date, progetto ripulito) le applica il database:
// chi modifica riceve indietro la riga come è stata salvata.

import type { SupabaseClient } from '@supabase/supabase-js'
import { limiteCestino } from '../dominio/cestino'
import type { Attivita, Modifica, NuovaAttivita } from '../dominio/tipi'
import { fallita } from './errore'

/** Una riga della tabella: la vista `attivita_elenco` aggiunge `ha_diario`. */
export type RigaAttivita = Omit<Attivita, 'ha_diario'>

export class AttivitaSupabase {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Tutte le attività, completate e cestinate comprese: sono al massimo qualche
   * centinaio. Prima elimina per sempre quelle nel cestino da più di 30 giorni.
   */
  async elenco(adesso = new Date()): Promise<Attivita[]> {
    const pulizia = await this.client
      .from('attivita')
      .delete()
      .lt('eliminata_il', limiteCestino(adesso).toISOString())
    if (pulizia.error) throw fallita('Cestino non svuotato', pulizia.error)

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

  /** Sposta nel cestino (`true`) o la ripristina (`false`); il diario resta. */
  async cestina(id: number, nelCestino: boolean): Promise<RigaAttivita> {
    const { data, error } = await this.client
      .from('attivita')
      .update({ eliminata_il: nelCestino ? new Date().toISOString() : null })
      .eq('id', id)
      .select()
      .single()
    if (error) throw fallita(nelCestino ? 'Attività non spostata nel cestino' : 'Attività non ripristinata', error)
    return data as RigaAttivita
  }

  /** Per sempre, solo dal cestino; elimina anche il diario (ON DELETE CASCADE). */
  async elimina(ids: number[]): Promise<void> {
    const { error } = await this.client.from('attivita').delete().in('id', ids).not('eliminata_il', 'is', null)
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

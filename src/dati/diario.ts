// Le query sul diario delle attività, tabella `projects.voci_diario`
// (doc/04-modello-dati.md).

import type { SupabaseClient } from '@supabase/supabase-js'
import type { VoceDiario } from '../dominio/tipi'
import { fallita } from './errore'

export class DiarioSupabase {
  constructor(private readonly client: SupabaseClient) {}

  /** Le voci di un'attività, dalla più vecchia alla più recente. */
  async voci(attivitaId: number): Promise<VoceDiario[]> {
    const { data, error } = await this.client
      .from('voci_diario')
      .select('*')
      .eq('attivita_id', attivitaId)
      .order('creata_il')
      .order('id')
    if (error) throw fallita('Diario non caricato', error)
    return data as VoceDiario[]
  }

  async aggiungi(attivitaId: number, testo: string): Promise<VoceDiario> {
    const { data, error } = await this.client
      .from('voci_diario')
      .insert({ attivita_id: attivitaId, testo })
      .select()
      .single()
    if (error) throw fallita('Voce non aggiunta', error)
    return data as VoceDiario
  }

  /** Il database aggiorna `modificata_il`, e la voce risulta "modificata". */
  async modifica(id: number, testo: string): Promise<VoceDiario> {
    const { data, error } = await this.client.from('voci_diario').update({ testo }).eq('id', id).select().single()
    if (error) throw fallita('Voce non modificata', error)
    return data as VoceDiario
  }

  async elimina(id: number): Promise<void> {
    const { error } = await this.client.from('voci_diario').delete().eq('id', id)
    if (error) throw fallita('Voce non eliminata', error)
  }
}

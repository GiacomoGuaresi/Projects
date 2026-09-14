// Le query sulle faccende, tabella `projects.faccende` (doc/04-modello-dati.md).
// La data di completamento la segna il database.

import type { SupabaseClient } from '@supabase/supabase-js'
import type { Faccenda } from '../dominio/tipi'
import { fallita } from './errore'

export class FaccendeSupabase {
  constructor(private readonly client: SupabaseClient) {}

  /** Prima elimina le completate prima di `inizioGiornata`, poi legge le altre. */
  async elenco(inizioGiornata: Date): Promise<Faccenda[]> {
    const pulizia = await this.client
      .from('faccende')
      .delete()
      .eq('completa', true)
      .lt('completata_il', inizioGiornata.toISOString())
    if (pulizia.error) throw fallita('Faccende vecchie non eliminate', pulizia.error)

    const { data, error } = await this.client.from('faccende').select('*')
    if (error) throw fallita('Faccende non caricate', error)
    return data as Faccenda[]
  }

  async crea(titolo: string): Promise<Faccenda> {
    const { data, error } = await this.client.from('faccende').insert({ titolo }).select().single()
    if (error) throw fallita('Faccenda non creata', error)
    return data as Faccenda
  }

  async segna(id: number, completa: boolean): Promise<Faccenda> {
    const { data, error } = await this.client.from('faccende').update({ completa }).eq('id', id).select().single()
    if (error) throw fallita('Faccenda non salvata', error)
    return data as Faccenda
  }
}

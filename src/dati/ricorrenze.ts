// Le query sulle ricorrenze, tabella `projects.ricorrenze` (doc/04-modello-dati.md).
// Le date (`prossima`) le calcola l'app: vedi src/dominio/ricorrenze.ts.

import type { SupabaseClient } from '@supabase/supabase-js'
import { daSalvare } from '../dominio/ricorrenze'
import type { DatiRicorrenza, Giorno, Ricorrenza } from '../dominio/tipi'
import { fallita } from './errore'

export class RicorrenzeSupabase {
  constructor(private readonly client: SupabaseClient) {}

  async elenco(): Promise<Ricorrenza[]> {
    const { data, error } = await this.client.from('ricorrenze').select('*').order('titolo')
    if (error) throw fallita('Ricorrenze non caricate', error)
    return data as Ricorrenza[]
  }

  async crea(dati: DatiRicorrenza, oggi: Giorno): Promise<Ricorrenza> {
    const { data, error } = await this.client.from('ricorrenze').insert(daSalvare(dati, oggi)).select().single()
    if (error) throw fallita('Ricorrenza non creata', error)
    return data as Ricorrenza
  }

  /** Salva la regola cambiata e ricalcola `prossima`, senza ripetere un giorno già creato. */
  async modifica(ricorrenza: Ricorrenza, dati: DatiRicorrenza, oggi: Giorno): Promise<Ricorrenza> {
    const { data, error } = await this.client
      .from('ricorrenze')
      .update(daSalvare(dati, oggi, ricorrenza.ultima))
      .eq('id', ricorrenza.id)
      .select()
      .single()
    if (error) throw fallita('Ricorrenza non salvata', error)
    return data as Ricorrenza
  }

  async elimina(id: number): Promise<void> {
    const { error } = await this.client.from('ricorrenze').delete().eq('id', id)
    if (error) throw fallita('Ricorrenza non eliminata', error)
  }
}

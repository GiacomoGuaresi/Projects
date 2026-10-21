// Le query sulle faccende, tabella `projects.faccende` (doc/04-modello-dati.md).
// La data di completamento la segna il database.

import type { SupabaseClient } from '@supabase/supabase-js'
import { daCreare, dopoCompletamento, occorrenzaDopo } from '../dominio/ricorrenze'
import type { Faccenda, Giorno, Ricorrenza } from '../dominio/tipi'
import { fallita } from './errore'

/** Il codice di Postgres per un valore unico già presente. */
const GIA_PRESENTE = '23505'

export class FaccendeSupabase {
  constructor(private readonly client: SupabaseClient) {}

  /**
   * Prima elimina le completate prima di `inizioGiornata`, poi crea quelle delle
   * ricorrenze arrivate a `oggi`, infine legge tutto.
   */
  async elenco(inizioGiornata: Date, oggi: Giorno): Promise<Faccenda[]> {
    const pulizia = await this.client
      .from('faccende')
      .delete()
      .eq('completa', true)
      .lt('completata_il', inizioGiornata.toISOString())
    if (pulizia.error) throw fallita('Faccende vecchie non eliminate', pulizia.error)

    await this.creaRicorrenti(oggi)

    const { data, error } = await this.client.from('faccende').select('*')
    if (error) throw fallita('Faccende non caricate', error)
    return data as Faccenda[]
  }

  /**
   * Per ogni ricorrenza arrivata: sposta avanti `prossima` e crea la faccenda.
   *
   * `prossima` si sposta solo se è ancora quella letta: se due dispositivi si
   * aprono insieme, solo uno "prende" la ricorrenza e crea la faccenda. Se
   * quella precedente è ancora da fare, il database rifiuta la nuova (indice
   * `faccende_una_aperta_per_ricorrenza`) e va bene così: non si accumulano.
   */
  private async creaRicorrenti(oggi: Giorno): Promise<void> {
    const { data, error } = await this.client
      .from('ricorrenze')
      .select('*')
      .eq('attiva', true)
      .lte('prossima', oggi)
    if (error) throw fallita('Ricorrenze non lette', error)

    for (const r of (data as Ricorrenza[]).filter((r) => daCreare(r, oggi))) {
      const presa = await this.client
        .from('ricorrenze')
        .update({ prossima: occorrenzaDopo(r, oggi), ultima: oggi })
        .eq('id', r.id)
        .eq('prossima', r.prossima)
        .select('id')
      if (presa.error) throw fallita('Ricorrenza non aggiornata', presa.error)
      if (presa.data.length === 0) continue

      const nuova = await this.client.from('faccende').insert({ titolo: r.titolo, ricorrenza_id: r.id })
      if (nuova.error && nuova.error.code !== GIA_PRESENTE) throw fallita('Faccenda ricorrente non creata', nuova.error)
    }
  }

  async crea(titolo: string): Promise<Faccenda> {
    const { data, error } = await this.client.from('faccende').insert({ titolo }).select().single()
    if (error) throw fallita('Faccenda non creata', error)
    return data as Faccenda
  }

  /**
   * Se è fatta e viene da una ricorrenza "dal completamento", la ricorrenza
   * riparte da `oggi`. Togliere la spunta non la riporta indietro.
   */
  async segna(id: number, completa: boolean, oggi: Giorno): Promise<Faccenda> {
    const { data, error } = await this.client.from('faccende').update({ completa }).eq('id', id).select().single()
    if (error) throw fallita('Faccenda non salvata', error)
    const faccenda = data as Faccenda
    if (completa && faccenda.ricorrenza_id !== null) await this.riparte(faccenda.ricorrenza_id, oggi)
    return faccenda
  }

  private async riparte(ricorrenzaId: number, oggi: Giorno): Promise<void> {
    const letta = await this.client.from('ricorrenze').select('*').eq('id', ricorrenzaId).maybeSingle()
    if (letta.error) throw fallita('Ricorrenza non letta', letta.error)
    const r = letta.data as Ricorrenza | null
    if (!r?.dal_completamento) return
    const { error } = await this.client.from('ricorrenze').update(dopoCompletamento(r, oggi)).eq('id', r.id)
    if (error) throw fallita('Ricorrenza non aggiornata', error)
  }

  async rinomina(id: number, titolo: string): Promise<Faccenda> {
    const { data, error } = await this.client.from('faccende').update({ titolo }).eq('id', id).select().single()
    if (error) throw fallita('Faccenda non modificata', error)
    return data as Faccenda
  }

  /** Quante faccende sono state segnate fatte da sempre: gli arbusti della foresta. */
  async fatte(): Promise<number> {
    const { data, error } = await this.client
      .from('contatori')
      .select('valore')
      .eq('nome', 'faccende_fatte')
      .maybeSingle()
    if (error) throw fallita('Arbusti non contati', error)
    return (data as { valore: number } | null)?.valore ?? 0
  }

  async elimina(id: number): Promise<void> {
    const { error } = await this.client.from('faccende').delete().eq('id', id)
    if (error) throw fallita('Faccenda non eliminata', error)
  }
}

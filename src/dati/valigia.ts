// Le query sulla valigia, tabelle `projects.valigia` (il viaggio, una riga sola)
// e `projects.valigia_spunte` (una riga per casella spuntata), doc/04-modello-dati.md.
// Le voci stanno nel codice; qui si controlla solo che i dati letti siano validi.

import type { SupabaseClient } from '@supabase/supabase-js'
import { spunteValide, viaggioDaRiga, type Viaggio } from '../dominio/valigia'
import { fallita } from './errore'

/** Il codice di Postgres per un valore unico già presente. */
const GIA_PRESENTE = '23505'

interface RigaValigia {
  giorni: number
  tipi: string[]
  in_lista: boolean
}

export interface StatoValigia {
  viaggio: Viaggio
  /** Il passo del wizard: false = scelta del viaggio, true = lista. */
  inLista: boolean
  spunte: Set<string>
}

/** Un cambio arrivato da un altro telefono (o l'eco dei propri). */
export type CambioValigia =
  | { tipo: 'viaggio'; viaggio: Viaggio; inLista: boolean }
  | { tipo: 'spunta'; chiave: string; presa: boolean }

export class ValigiaSupabase {
  constructor(private readonly client: SupabaseClient) {}

  async leggi(): Promise<StatoValigia> {
    const [valigia, spunte] = await Promise.all([
      this.client.from('valigia').select('giorni, tipi, in_lista').single(),
      this.client.from('valigia_spunte').select('chiave'),
    ])
    if (valigia.error) throw fallita('Valigia non caricata', valigia.error)
    if (spunte.error) throw fallita('Spunte non caricate', spunte.error)
    const riga = valigia.data as RigaValigia
    return {
      viaggio: viaggioDaRiga(riga),
      inLista: riga.in_lista,
      spunte: spunteValide((spunte.data as { chiave: string }[]).map((s) => s.chiave)),
    }
  }

  async salvaViaggio(viaggio: Viaggio, inLista: boolean): Promise<void> {
    const { error } = await this.client
      .from('valigia')
      .update({ giorni: viaggio.giorni, tipi: viaggio.tipi, in_lista: inLista })
      .eq('id', true)
    if (error) throw fallita('Viaggio non salvato', error)
  }

  /** Spunta o toglie una casella. Già spuntata da un altro telefono va bene lo stesso. */
  async segna(chiave: string, presa: boolean): Promise<void> {
    if (presa) {
      const { error } = await this.client.from('valigia_spunte').insert({ chiave })
      if (error && error.code !== GIA_PRESENTE) throw fallita('Spunta non salvata', error)
    } else {
      const { error } = await this.client.from('valigia_spunte').delete().eq('chiave', chiave)
      if (error) throw fallita('Spunta non tolta', error)
    }
  }

  /** Toglie tutte le spunte e torna alla scelta del viaggio, in un colpo solo. */
  async nuova(): Promise<void> {
    const { error } = await this.client.rpc('nuova_valigia')
    if (error) throw fallita('Nuova valigia non preparata', error)
  }

  /**
   * Ascolta in tempo reale i cambi di viaggio e spunte. `onConnessa` arriva a
   * ogni (ri)connessione: nel frattempo qualcosa può essere sfuggito, e conviene
   * rileggere tutto. Restituisce la funzione che smette di ascoltare.
   */
  ascolta(onCambio: (cambio: CambioValigia) => void, onConnessa: () => void): () => void {
    const canale = this.client
      .channel('valigia')
      .on('postgres_changes', { event: 'UPDATE', schema: 'projects', table: 'valigia' }, ({ new: riga }) => {
        const r = riga as RigaValigia
        onCambio({ tipo: 'viaggio', viaggio: viaggioDaRiga(r), inLista: r.in_lista })
      })
      .on('postgres_changes', { event: 'INSERT', schema: 'projects', table: 'valigia_spunte' }, ({ new: riga }) => {
        onCambio({ tipo: 'spunta', chiave: (riga as { chiave: string }).chiave, presa: true })
      })
      // Di una riga eliminata arriva solo la chiave primaria, che qui è proprio la chiave.
      .on('postgres_changes', { event: 'DELETE', schema: 'projects', table: 'valigia_spunte' }, ({ old: riga }) => {
        const chiave = (riga as { chiave?: string }).chiave
        if (chiave) onCambio({ tipo: 'spunta', chiave, presa: false })
      })
      .subscribe((stato) => {
        if (stato === 'SUBSCRIBED') onConnessa()
      })
    return () => void this.client.removeChannel(canale)
  }
}

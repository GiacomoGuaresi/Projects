import { useState } from 'react'
import { RotateCcw, Search } from 'lucide-react'
import { conStato, filtraAttivita, filtriAttivi, FILTRI_VUOTI, type Filtri } from '../dominio/filtri'
import { pagina } from '../dominio/paginazione'
import type { ProgettoInUso } from '../dominio/progetto'
import { STATI, type Attivita, type Stato } from '../dominio/tipi'
import { ElencoAttivita, type AzioniAttivita } from './ElencoAttivita'
import { InputProgetto } from './InputProgetto'
import { Paginazione } from './Paginazione'
import { infoStati } from './stati'

interface Props {
  attivita: readonly Attivita[]
  progetti: readonly ProgettoInUso[]
  azioni: AzioniAttivita
}

const RIGHE = [25, 50, 100] as const

const campo =
  'min-h-11 w-full rounded-[11px] border border-bordo bg-white px-3 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia'

/**
 * La pagina Attività (doc/08-interfaccia.md): tutte le attività con i filtri
 * (testo, stato, priorità, progetto), "Mostra completate" spento di default,
 * Azzera e paginazione da 25/50/100. Ordine come la dashboard, completate in
 * fondo dalla più recente; qui si può anche eliminare.
 */
export function PaginaAttivita({ attivita, progetti, azioni }: Props) {
  const [filtri, setFiltri] = useState<Filtri>(FILTRI_VUOTI)
  const [numero, setNumero] = useState(1)
  const [perPagina, setPerPagina] = useState<number>(RIGHE[0])

  /** Ogni cambio di filtro riparte dalla prima pagina. */
  const filtra = (nuovi: Filtri) => {
    setFiltri(nuovi)
    setNumero(1)
  }

  const trovate = filtraAttivita(attivita, filtri)
  const corrente = pagina(trovate, numero, perPagina)
  const attivi = filtriAttivi(filtri)

  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-baseline gap-2 px-1 text-lg font-semibold">
        Attività <span className="text-sm font-normal text-testo-tenue">({trovate.length})</span>
      </h2>

      <div className="flex flex-col gap-2 rounded-[11px] border border-bordo bg-white p-3" role="search">
        <div className="grid gap-2 sm:grid-cols-2 xl:grid-cols-[minmax(0,2fr)_repeat(3,minmax(0,1fr))]">
          <div className="relative sm:col-span-2 xl:col-span-1">
            <Search
              className="pointer-events-none absolute top-1/2 left-3 size-4 -translate-y-1/2 text-testo-tenue"
              aria-hidden="true"
            />
            <input
              type="search"
              aria-label="Cerca nel titolo o nel progetto"
              placeholder="Cerca nel titolo o nel progetto"
              className={`${campo} pl-9`}
              value={filtri.testo}
              onChange={(e) => filtra({ ...filtri, testo: e.target.value })}
            />
          </div>
          <select
            aria-label="Stato"
            className={campo}
            value={filtri.stato ?? ''}
            onChange={(e) => filtra(conStato(filtri, (e.target.value || null) as Stato | null))}
          >
            <option value="">Tutti gli stati</option>
            {STATI.map((stato) => (
              <option key={stato} value={stato}>
                {infoStati[stato].etichetta}
              </option>
            ))}
          </select>
          <select
            aria-label="Priorità"
            className={campo}
            value={filtri.priorita ?? ''}
            onChange={(e) => filtra({ ...filtri, priorita: e.target.value ? Number(e.target.value) : null })}
          >
            <option value="">Tutte le priorità</option>
            {[5, 4, 3, 2, 1].map((n) => (
              <option key={n} value={n}>
                {'★'.repeat(n)} {n === 1 ? '1 stella' : `${n} stelle`}
              </option>
            ))}
          </select>
          <InputProgetto
            etichetta="Progetto"
            placeholder="Progetto"
            className={campo}
            valore={filtri.progetto}
            onCambia={(progetto) => filtra({ ...filtri, progetto })}
            progetti={progetti}
          />
        </div>
        <div className="flex flex-wrap items-center justify-between gap-2">
          <label className="flex min-h-9 cursor-pointer items-center gap-2">
            <input
              type="checkbox"
              className="size-4 accent-salvia"
              checked={filtri.mostraCompletate}
              onChange={(e) => filtra({ ...filtri, mostraCompletate: e.target.checked })}
            />
            Mostra completate
          </label>
          {attivi && (
            <button
              type="button"
              className="flex min-h-9 items-center gap-1.5 rounded-lg px-2 text-testo-tenue hover:bg-fondo hover:text-testo"
              onClick={() => filtra(FILTRI_VUOTI)}
            >
              <RotateCcw className="size-4" aria-hidden="true" />
              Azzera
            </button>
          )}
        </div>
      </div>

      {trovate.length === 0 ? (
        <p className="px-2 py-3 text-testo-tenue">
          {attivi
            ? 'Nessuna attività corrisponde ai filtri.'
            : 'Nessuna attività aperta: aggiungine una con il +, o mostra le completate.'}
        </p>
      ) : (
        <>
          <ElencoAttivita attivita={corrente.elementi} progetti={progetti} azioni={azioni} conElimina />
          <Paginazione
            pagina={corrente}
            onPagina={setNumero}
            perPagina={{
              valore: perPagina,
              opzioni: RIGHE,
              onCambia: (valore) => {
                setPerPagina(valore)
                setNumero(1)
              },
            }}
          />
        </>
      )}
    </div>
  )
}

import { ChevronLeft, ChevronRight } from 'lucide-react'
import type { Pagina } from '../dominio/paginazione'

interface Props {
  pagina: Pagina<unknown>
  onPagina: (numero: number) => void
  /** Se c'è, mostra la scelta di quante righe per pagina. */
  perPagina?: { valore: number; opzioni: readonly number[]; onCambia: (valore: number) => void }
}

const freccia =
  'grid size-9 place-items-center rounded-lg border border-bordo bg-white text-testo hover:bg-fondo disabled:opacity-40 disabled:hover:bg-white'

/** "1–25 di 120", pagina precedente e successiva, e righe per pagina. */
export function Paginazione({ pagina, onPagina, perPagina }: Props) {
  return (
    <div className="flex flex-wrap items-center justify-between gap-2 px-1 text-sm text-testo-tenue">
      <span>
        {pagina.da}–{pagina.a} di {pagina.totale}
      </span>
      <div className="flex items-center gap-2">
        {perPagina && (
          <label className="flex items-center gap-1.5">
            Righe
            <select
              className="min-h-9 rounded-lg border border-bordo bg-white px-2 text-sm text-testo"
              value={perPagina.valore}
              onChange={(e) => perPagina.onCambia(Number(e.target.value))}
            >
              {perPagina.opzioni.map((n) => (
                <option key={n} value={n}>
                  {n}
                </option>
              ))}
            </select>
          </label>
        )}
        {pagina.pagine > 1 && (
          <>
            <button
              type="button"
              className={freccia}
              aria-label="Pagina precedente"
              disabled={pagina.numero === 1}
              onClick={() => onPagina(pagina.numero - 1)}
            >
              <ChevronLeft className="size-4" aria-hidden="true" />
            </button>
            <span className="min-w-12 text-center">
              {pagina.numero} / {pagina.pagine}
            </span>
            <button
              type="button"
              className={freccia}
              aria-label="Pagina successiva"
              disabled={pagina.numero === pagina.pagine}
              onClick={() => onPagina(pagina.numero + 1)}
            >
              <ChevronRight className="size-4" aria-hidden="true" />
            </button>
          </>
        )}
      </div>
    </div>
  )
}

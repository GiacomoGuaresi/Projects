import { useState } from 'react'
import { ChevronRight, Pause, Plus, Repeat } from 'lucide-react'
import { descrivi, formattaGiorno, oggi } from '../dominio/ricorrenze'
import type { Ricorrenza } from '../dominio/tipi'
import { ModaleRicorrenza } from './ModaleRicorrenza'
import type { useRicorrenze } from './useRicorrenze'

interface Props {
  ricorrenze: ReturnType<typeof useRicorrenze>
}

/**
 * Le faccende ricorrenti (doc/08-interfaccia.md, "Faccende ricorrenti"): una
 * riga per regola con la frequenza a parole e il giorno in cui tornerà. Toccata
 * apre il modale; in fondo "Nuova ricorrente".
 */
export function CardRicorrenze({ ricorrenze: { stato, ricarica, crea, modifica, elimina } }: Props) {
  // null: chiuso; 'nuova': modale vuoto; un id: modifica di quella.
  const [aperta, setAperta] = useState<'nuova' | number | null>(null)
  const inModifica =
    stato.fase === 'pronto' && typeof aperta === 'number' ? stato.ricorrenze.find((r) => r.id === aperta) : undefined
  const giorno = oggi()

  return (
    <section className="animate-entra rounded-[11px] border border-bordo bg-white">
      <h3 className="flex min-h-10 items-center gap-2 border-b border-bordo py-1 pr-3 pl-3 font-semibold">
        <Repeat className="size-4.5 shrink-0 text-salvia-scura" aria-hidden="true" />
        <span className="min-w-0 flex-1">Ricorrenti</span>
      </h3>

      {stato.fase === 'caricamento' && <p className="px-3 py-2 text-sm text-testo-tenue">Carico le ricorrenze…</p>}
      {stato.fase === 'errore' && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2" role="alert">
          <p className="flex-1 text-sm text-pericolo">{stato.messaggio}</p>
          <button
            type="button"
            className="min-h-9 rounded-[11px] bg-salvia px-3 text-sm font-semibold text-panna hover:bg-salvia-scura"
            onClick={() => void ricarica()}
          >
            Riprova
          </button>
        </div>
      )}

      {stato.fase === 'pronto' && (
        <ul className="divide-y divide-bordo">
          {stato.ricorrenze.map((r) => (
            <li key={r.id}>
              <RigaRicorrenza ricorrenza={r} oggi={giorno} onApri={() => setAperta(r.id)} />
            </li>
          ))}
          <li>
            <button
              type="button"
              className="flex min-h-11 w-full items-center gap-2 px-3 text-left font-semibold text-salvia-scura hover:bg-fondo"
              onClick={() => setAperta('nuova')}
            >
              <Plus className="size-4" aria-hidden="true" />
              Nuova ricorrente
            </button>
          </li>
        </ul>
      )}

      {aperta === 'nuova' && <ModaleRicorrenza onSalva={crea} onChiudi={() => setAperta(null)} />}
      {inModifica && (
        <ModaleRicorrenza
          key={inModifica.id}
          ricorrenza={inModifica}
          onSalva={(dati) => modifica(inModifica, dati)}
          onElimina={() => void elimina(inModifica.id)}
          onChiudi={() => setAperta(null)}
        />
      )}
    </section>
  )
}

function RigaRicorrenza({ ricorrenza: r, oggi, onApri }: { ricorrenza: Ricorrenza; oggi: string; onApri: () => void }) {
  return (
    <button
      type="button"
      className={`flex min-h-12 w-full items-center gap-2 py-1.5 pr-2 pl-3 text-left hover:bg-fondo active:bg-bordo ${
        r.attiva ? '' : 'text-testo-tenue'
      }`}
      onClick={onApri}
    >
      <span className="flex min-w-0 flex-1 flex-col">
        <span className="break-words">{r.titolo}</span>
        <span className="text-sm text-testo-tenue">
          {descrivi(r)} ·{' '}
          {r.attiva ? (
            // Una già creata oggi ha `prossima` nel futuro; una arretrata si crea alla prossima lettura.
            `prossima ${formattaGiorno(r.prossima < oggi ? oggi : r.prossima, oggi)}`
          ) : (
            <span className="inline-flex items-center gap-1">
              <Pause className="size-3.5" aria-hidden="true" />
              in pausa
            </span>
          )}
        </span>
      </span>
      <ChevronRight className="size-4 shrink-0 text-testo-tenue" aria-hidden="true" />
    </button>
  )
}

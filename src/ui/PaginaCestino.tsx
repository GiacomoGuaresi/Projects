import { useState } from 'react'
import { RotateCcw, Trash2, X } from 'lucide-react'
import { giorniRimasti, GIORNI_NEL_CESTINO } from '../dominio/cestino'
import { titoloSenzaTag } from '../dominio/tag'
import type { Attivita } from '../dominio/tipi'
import { Conferma } from './Conferma'
import { dataOra } from './ModaleDiario'
import { ProgettoConIcona } from './ProgettoConIcona'

interface Props {
  /** Le cestinate, dalla più recente. */
  cestino: Attivita[]
  onRipristina: (attivita: Attivita) => void
  onElimina: (ids: number[]) => void
}

/**
 * Il cestino (doc/08-interfaccia.md, "Cestino"): le attività eliminate negli
 * ultimi 30 giorni, con diario. Si ripristinano con un tocco; eliminarle per
 * sempre, una o tutte, chiede conferma.
 */
export function PaginaCestino({ cestino, onRipristina, onElimina }: Props) {
  const [daEliminare, setDaEliminare] = useState<Attivita[] | null>(null)

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <h2 className="flex-1 text-lg font-semibold">Cestino</h2>
        {cestino.length > 0 && (
          <button
            type="button"
            className="flex min-h-9 items-center gap-1.5 rounded-[11px] px-3 text-sm font-semibold text-pericolo hover:bg-white"
            onClick={() => setDaEliminare(cestino)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
            Svuota
          </button>
        )}
      </div>
      <section className="animate-entra rounded-[11px] border border-bordo bg-white">
        {cestino.length === 0 ? (
          <p className="px-3 py-4 text-sm text-testo-tenue">Il cestino è vuoto.</p>
        ) : (
          <ul className="divide-y divide-bordo">
            {cestino.map((a) => (
              <RigaCestino
                key={a.id}
                attivita={a}
                onRipristina={() => onRipristina(a)}
                onElimina={() => setDaEliminare([a])}
              />
            ))}
          </ul>
        )}
      </section>
      <p className="px-2 text-sm text-testo-tenue">
        Le attività eliminate restano qui {GIORNI_NEL_CESTINO} giorni, diario compreso, poi spariscono per sempre.
      </p>
      {daEliminare && (
        <Conferma
          titolo={daEliminare.length === 1 ? "Eliminare per sempre l'attività?" : 'Svuotare il cestino?'}
          conferma="Elimina per sempre"
          pericolo
          onAnnulla={() => setDaEliminare(null)}
          onConferma={() => {
            onElimina(daEliminare.map((a) => a.id))
            setDaEliminare(null)
          }}
        >
          <p>
            {daEliminare.length === 1 ? (
              <>
                Eliminare per sempre <strong>{titoloSenzaTag(daEliminare[0].titolo) || daEliminare[0].titolo}</strong>?
              </>
            ) : (
              <>Eliminare per sempre le {daEliminare.length} attività nel cestino?</>
            )}{' '}
            Si perde anche il diario, e non si può tornare indietro.
          </p>
        </Conferma>
      )}
    </div>
  )
}

interface RigaProps {
  attivita: Attivita
  onRipristina: () => void
  onElimina: () => void
}

function RigaCestino({ attivita: a, onRipristina, onElimina }: RigaProps) {
  const giorni = giorniRimasti(a)
  return (
    <li className="flex items-center gap-2 py-1.5 pr-1.5 pl-3">
      <div className="flex min-w-0 flex-1 flex-col gap-0.5">
        <span className="truncate font-medium">{titoloSenzaTag(a.titolo) || a.titolo}</span>
        <span className="flex min-w-0 items-center gap-2 text-sm text-testo-tenue">
          <ProgettoConIcona progetto={a.progetto} />
          <span className="shrink-0" title={`Eliminata il ${dataOra(a.eliminata_il!)}`}>
            · {giorni <= 1 ? 'sparisce domani' : `ancora ${giorni} giorni`}
          </span>
        </span>
      </div>
      <button
        type="button"
        className="flex min-h-11 shrink-0 items-center gap-1.5 rounded-[11px] px-3 text-sm font-semibold text-salvia-scura hover:bg-fondo"
        onClick={onRipristina}
      >
        <RotateCcw className="size-4" aria-hidden="true" />
        Ripristina
      </button>
      <button
        type="button"
        className="grid size-11 shrink-0 place-items-center rounded-[11px] text-testo-tenue hover:bg-fondo hover:text-pericolo"
        aria-label="Elimina per sempre"
        onClick={onElimina}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}

import { Broom, Circle, CircleCheck } from 'lucide-react'
import { faccendeDiOggi } from '../dominio/faccende'
import { AggiuntaRapida } from './AggiuntaRapida'
import type { useFaccende } from './useFaccende'

type Faccende = ReturnType<typeof useFaccende>

interface Props {
  faccende: Faccende
  /** Nasconde le faccende già fatte oggi (interruttori della Dashboard). */
  soloDaFare?: boolean
}

/**
 * La card delle faccende (doc/08-interfaccia.md, "Faccende"): attività veloci
 * con solo il titolo. Toccare una riga la segna fatta (o di nuovo da fare): le
 * fatte restano barrate in fondo fino a mezzanotte, poi spariscono. In fondo
 * l'aggiunta rapida.
 */
export function CardFaccende({ faccende: { stato, ricarica, crea, segna }, soloDaFare = false }: Props) {
  const tutte = stato.fase === 'pronto' ? faccendeDiOggi(stato.faccende) : []
  const fatte = tutte.filter((f) => f.completa).length
  const visibili = soloDaFare ? tutte.filter((f) => !f.completa) : tutte

  return (
    <section className="animate-entra rounded-[11px] border border-bordo bg-white">
      <h3 className="flex min-h-10 items-center gap-2 border-b border-bordo py-1 pr-3 pl-3 font-semibold">
        <Broom className="size-4.5 shrink-0 text-salvia-scura" aria-hidden="true" />
        <span className="min-w-0 flex-1">Faccende</span>
        {tutte.length > 0 && (
          <span className="text-sm font-normal text-testo-tenue" title="Faccende fatte oggi sul totale">
            {fatte}/{tutte.length}
          </span>
        )}
      </h3>

      {stato.fase === 'caricamento' && <p className="px-3 py-2 text-sm text-testo-tenue">Carico le faccende…</p>}
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
          {visibili.map((f) => {
            const Icona = f.completa ? CircleCheck : Circle
            return (
              <li key={f.id} className="animate-entra">
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={f.completa}
                  title={f.completa ? 'Segna da fare' : 'Segna fatta'}
                  className="flex min-h-11 w-full touch-manipulation items-center gap-1 py-1 pr-2 pl-1.5 text-left hover:bg-fondo active:bg-bordo"
                  onClick={() => void segna(f.id, !f.completa)}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                      f.completa ? 'bg-completo text-completo-testo' : 'bg-dafare text-dafare-testo'
                    }`}
                    aria-hidden="true"
                  >
                    <Icona className="size-4" />
                  </span>
                  <span
                    className={`min-w-0 flex-1 px-1 break-words ${f.completa ? 'text-testo-tenue line-through' : ''}`}
                  >
                    {f.titolo}
                  </span>
                </button>
              </li>
            )
          })}
          <li>
            <AggiuntaRapida placeholder="Aggiungi faccenda" etichetta="Nuova faccenda" onCrea={crea} />
          </li>
        </ul>
      )}
    </section>
  )
}

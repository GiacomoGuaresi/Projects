import { STATI, type Stato } from '../dominio/tipi'
import { infoStati } from './stati'

interface SceltaStatoProps {
  valore: Stato
  onScegli: (stato: Stato) => void
  /** Solo icone, per righe e card; l'etichetta resta come nome accessibile. */
  compatta?: boolean
}

/** Lo stato come gruppo di pulsanti con icona e colore (doc/08-interfaccia.md). */
export function SceltaStato({ valore, onScegli, compatta = false }: SceltaStatoProps) {
  return (
    <div
      className={compatta ? 'inline-flex gap-0.5' : 'grid grid-cols-2 gap-1.5 sm:grid-cols-4'}
      role="radiogroup"
      aria-label="Stato"
    >
      {STATI.map((stato) => {
        const { etichetta, icona: Icona, colori } = infoStati[stato]
        const scelto = stato === valore
        return (
          <button
            key={stato}
            type="button"
            role="radio"
            aria-checked={scelto}
            aria-label={compatta ? etichetta : undefined}
            title={compatta ? etichetta : undefined}
            onClick={() => {
              if (!scelto) onScegli(stato)
            }}
            className={
              compatta
                ? `grid size-8 place-items-center rounded-lg ${scelto ? colori : 'text-testo-tenue hover:bg-fondo'}`
                : `flex min-h-10 items-center justify-center gap-1.5 rounded-[11px] border px-2 text-sm ${
                    scelto
                      ? `border-transparent font-semibold ${colori}`
                      : 'border-bordo bg-white text-testo-tenue hover:bg-fondo'
                  }`
            }
          >
            <Icona className="size-4" aria-hidden="true" />
            {!compatta && etichetta}
          </button>
        )
      })}
    </div>
  )
}

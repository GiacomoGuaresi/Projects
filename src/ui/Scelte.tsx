import { Star } from 'lucide-react'
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

interface SceltaPrioritaProps {
  valore: number
  onScegli: (priorita: number) => void
  compatta?: boolean
}

/** La priorità da 1 a 5: si tocca la stella. */
export function SceltaPriorita({ valore, onScegli, compatta = false }: SceltaPrioritaProps) {
  return (
    <div className="inline-flex" role="radiogroup" aria-label="Priorità">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === valore}
          aria-label={n === 1 ? '1 stella' : `${n} stelle`}
          onClick={() => {
            if (n !== valore) onScegli(n)
          }}
          className={`grid place-items-center rounded-lg hover:bg-fondo ${compatta ? 'size-7' : 'size-10'}`}
        >
          <Star
            className={`${compatta ? 'size-4' : 'size-6'} ${n <= valore ? 'fill-stella text-stella' : 'text-stella-vuota'}`}
            aria-hidden="true"
          />
        </button>
      ))}
    </div>
  )
}

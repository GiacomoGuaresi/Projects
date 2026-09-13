import { Star } from 'lucide-react'
import { STATI, type Stato } from '../dominio/tipi'
import { infoStati } from './stati'

/** Lo stato come gruppo di pulsanti con icona e colore (doc/08-interfaccia.md). */
export function SceltaStato({ valore, onScegli }: { valore: Stato; onScegli: (stato: Stato) => void }) {
  return (
    <div className="grid grid-cols-2 gap-1.5 sm:grid-cols-4" role="radiogroup" aria-label="Stato">
      {STATI.map((stato) => {
        const { etichetta, icona: Icona, colori } = infoStati[stato]
        const scelto = stato === valore
        return (
          <button
            key={stato}
            type="button"
            role="radio"
            aria-checked={scelto}
            onClick={() => onScegli(stato)}
            className={`flex min-h-10 items-center justify-center gap-1.5 rounded-[11px] border px-2 text-sm ${
              scelto ? `border-transparent font-semibold ${colori}` : 'border-bordo bg-white text-testo-tenue hover:bg-fondo'
            }`}
          >
            <Icona className="size-4" aria-hidden="true" />
            {etichetta}
          </button>
        )
      })}
    </div>
  )
}

/** La priorità da 1 a 5: si tocca la stella. */
export function SceltaPriorita({ valore, onScegli }: { valore: number; onScegli: (priorita: number) => void }) {
  return (
    <div className="flex" role="radiogroup" aria-label="Priorità">
      {[1, 2, 3, 4, 5].map((n) => (
        <button
          key={n}
          type="button"
          role="radio"
          aria-checked={n === valore}
          aria-label={n === 1 ? '1 stella' : `${n} stelle`}
          onClick={() => onScegli(n)}
          className="grid size-10 place-items-center rounded-[11px] hover:bg-fondo"
        >
          <Star className={`size-6 ${n <= valore ? 'fill-stella text-stella' : 'text-bordo'}`} aria-hidden="true" />
        </button>
      ))}
    </div>
  )
}

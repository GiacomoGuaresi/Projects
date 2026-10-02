import { useEffect } from 'react'
import { X } from 'lucide-react'
import { CIELI, FASI, STAGIONI } from '../../dominio/ambiente'
import type { Forzature } from './useAmbiente'

/** I nomi da mostrare di stagioni, fasi e cieli. */
export const nomiAmbiente: Record<string, string> = {
  primavera: 'Primavera',
  estate: 'Estate',
  autunno: 'Autunno',
  inverno: 'Inverno',
  alba: 'Alba',
  giorno: 'Giorno',
  tramonto: 'Tramonto',
  notte: 'Notte',
  sereno: 'Sereno',
  nuvoloso: 'Nuvoloso',
  nebbia: 'Nebbia',
  pioggia: 'Pioggia',
  temporale: 'Temporale',
  neve: 'Neve',
}

const VENTI = [
  { nome: 'Vero', valore: undefined },
  { nome: 'Calma', valore: 0 },
  { nome: 'Brezza', valore: 0.4 },
  { nome: 'Forte', valore: 1 },
]

interface Props {
  forza: Forzature
  onForza: (forza: Forzature) => void
  onChiudi: () => void
}

/**
 * Il selettore nascosto della Foresta (doc/08, "Foresta"): si apre tenendo
 * premuto il titolo (o con Alt+Shift+F) e forza stagione, ora, meteo e vento
 * per provarli. "Vero" torna a quello reale. Vale solo in questa scheda del
 * browser e non va a nessun server.
 */
export function SelettoreAmbiente({ forza, onForza, onChiudi }: Props) {
  useEffect(() => {
    const esc = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onChiudi()
    }
    document.addEventListener('keydown', esc)
    return () => document.removeEventListener('keydown', esc)
  }, [onChiudi])

  const gruppo = <K extends 'stagione' | 'fase' | 'cielo'>(chiave: K, titolo: string, valori: readonly NonNullable<Forzature[K]>[]) => (
    <fieldset className="flex flex-col gap-1">
      <legend className="mb-1 text-xs font-semibold text-testo-tenue">{titolo}</legend>
      <div className="flex flex-wrap gap-1">
        {[undefined, ...valori].map((valore) => {
          const scelto = forza[chiave] === valore
          return (
            <button
              key={valore ?? 'vero'}
              type="button"
              aria-pressed={scelto}
              onClick={() => onForza({ ...forza, [chiave]: valore })}
              className={`min-h-8 rounded-full border px-2.5 text-sm ${
                scelto ? 'border-transparent bg-salvia font-semibold text-white' : 'border-bordo bg-white hover:bg-fondo'
              }`}
            >
              {valore ? nomiAmbiente[valore] : 'Vero'}
            </button>
          )
        })}
      </div>
    </fieldset>
  )

  return (
    <section
      aria-label="Prova stagione, ora e meteo"
      className="animate-compari absolute top-2 left-2 z-1 flex max-w-[calc(100%-16px)] flex-col gap-3 rounded-xl bg-white/95 p-3 shadow-lg backdrop-blur-sm sm:max-w-sm"
    >
      <div className="flex items-center justify-between">
        <h3 className="font-semibold">Prova la foresta</h3>
        <button
          type="button"
          className="grid size-9 place-items-center rounded-[11px] hover:bg-fondo"
          aria-label="Chiudi"
          onClick={onChiudi}
        >
          <X className="size-4" aria-hidden="true" />
        </button>
      </div>
      {gruppo('stagione', 'Stagione', STAGIONI)}
      {gruppo('fase', 'Ora', FASI)}
      {gruppo('cielo', 'Meteo', CIELI)}
      <fieldset className="flex flex-col gap-1">
        <legend className="mb-1 text-xs font-semibold text-testo-tenue">Vento</legend>
        <div className="flex flex-wrap gap-1">
          {VENTI.map(({ nome, valore }) => {
            const scelto = forza.vento === valore
            return (
              <button
                key={nome}
                type="button"
                aria-pressed={scelto}
                onClick={() => onForza({ ...forza, vento: valore })}
                className={`min-h-8 rounded-full border px-2.5 text-sm ${
                  scelto ? 'border-transparent bg-salvia font-semibold text-white' : 'border-bordo bg-white hover:bg-fondo'
                }`}
              >
                {nome}
              </button>
            )
          })}
        </div>
      </fieldset>
      <p className="text-xs text-testo-tenue">
        Solo in questa scheda, niente va al server. Si apre anche con Alt+Shift+F; dalla console: <code>foresta.meteo('neve')</code>,{' '}
        <code>foresta.reset()</code>…
      </p>
    </section>
  )
}


import { useId, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { sezioniDashboard, type SezioneDashboard } from '../dominio/ordinamento'
import type { Attivita } from '../dominio/tipi'
import { ElencoAttivita } from './ElencoAttivita'

/**
 * La dashboard (doc/08-interfaccia.md): le attività aperte in tre sezioni
 * collassabili, "In corso" aperta e le altre chiuse.
 */
export function Dashboard({ attivita }: { attivita: readonly Attivita[] }) {
  return (
    <div className="flex flex-col gap-3">
      {sezioniDashboard(attivita).map((sezione) => (
        <Sezione key={sezione.stato} sezione={sezione} />
      ))}
    </div>
  )
}

function Sezione({ sezione }: { sezione: SezioneDashboard }) {
  const [aperta, setAperta] = useState(sezione.apertaDiDefault)
  const contenuto = useId()

  return (
    <section>
      <h2>
        <button
          type="button"
          className="flex min-h-11 w-full items-center gap-1.5 rounded-[11px] px-1 text-left text-base font-semibold hover:bg-white/60"
          aria-expanded={aperta}
          aria-controls={contenuto}
          onClick={() => setAperta(!aperta)}
        >
          <ChevronRight
            className={`size-5 text-testo-tenue transition-transform duration-200 motion-reduce:transition-none ${aperta ? 'rotate-90' : ''}`}
            aria-hidden="true"
          />
          {sezione.titolo} <span className="font-normal text-testo-tenue">({sezione.attivita.length})</span>
        </button>
      </h2>
      <div id={contenuto} hidden={!aperta} className="pt-1">
        {sezione.attivita.length === 0 ? (
          <p className="px-2 py-3 text-testo-tenue">Nessuna attività.</p>
        ) : (
          <ElencoAttivita attivita={sezione.attivita} />
        )}
      </div>
    </section>
  )
}

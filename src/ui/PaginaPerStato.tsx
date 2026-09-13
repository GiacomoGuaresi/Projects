import { useId, useState } from 'react'
import { ChevronRight } from 'lucide-react'
import { sezioniPerStato, type SezionePerStato } from '../dominio/ordinamento'
import { pagina } from '../dominio/paginazione'
import type { ProgettoInUso } from '../dominio/progetto'
import type { Attivita } from '../dominio/tipi'
import { ElencoAttivita, type AzioniAttivita } from './ElencoAttivita'
import { Paginazione } from './Paginazione'

interface Props {
  attivita: readonly Attivita[]
  progetti: readonly ProgettoInUso[]
  azioni: AzioniAttivita
}

/** Righe per pagina in ogni sezione (doc/08-interfaccia.md). */
const PER_SEZIONE = 50

/**
 * La pagina Per stato (doc/08-interfaccia.md): le attività aperte in tre sezioni
 * collassabili, "In corso" aperta e le altre chiuse, 50 righe per pagina.
 */
export function PaginaPerStato({ attivita, progetti, azioni }: Props) {
  return (
    <div className="flex flex-col gap-3">
      {sezioniPerStato(attivita).map((sezione) => (
        <Sezione key={sezione.stato} sezione={sezione} progetti={progetti} azioni={azioni} />
      ))}
    </div>
  )
}

function Sezione({ sezione, progetti, azioni }: Omit<Props, 'attivita'> & { sezione: SezionePerStato }) {
  const [aperta, setAperta] = useState(sezione.apertaDiDefault)
  const [numero, setNumero] = useState(1)
  const contenuto = useId()
  const corrente = pagina(sezione.attivita, numero, PER_SEZIONE)

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
      <div id={contenuto} hidden={!aperta} className="flex flex-col gap-2 pt-1">
        {sezione.attivita.length === 0 ? (
          <p className="px-2 py-3 text-testo-tenue">Nessuna attività.</p>
        ) : (
          <>
            <ElencoAttivita attivita={corrente.elementi} progetti={progetti} azioni={azioni} />
            {corrente.pagine > 1 && <Paginazione pagina={corrente} onPagina={setNumero} />}
          </>
        )}
      </div>
    </section>
  )
}

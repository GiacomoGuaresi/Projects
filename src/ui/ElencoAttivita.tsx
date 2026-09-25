import { BookOpen, Trash2 } from 'lucide-react'
import type { ProgettoInUso } from '../dominio/progetto'
import type { Attivita, Modifica } from '../dominio/tipi'
import { CampoAvanzamento, CampoProgetto, CampoTitolo } from './CampiInline'
import { SceltaPriorita, SceltaStato } from './Scelte'

/** Cosa si può fare su un'attività dalle righe e dalle card. */
export interface AzioniAttivita {
  modifica: (attivita: Attivita, modifica: Modifica) => void
  /** Il testo scritto nel campo progetto. */
  cambiaProgetto: (attivita: Attivita, testo: string) => void
  /** Chiede conferma prima di eliminare. */
  elimina: (attivita: Attivita) => void
  apriDiario: (attivita: Attivita) => void
}

interface Props {
  attivita: readonly Attivita[]
  progetti: readonly ProgettoInUso[]
  azioni: AzioniAttivita
  /** Il pulsante elimina c'è solo nella pagina Attività, non in Per stato. */
  conElimina?: boolean
}

const icona = 'grid size-8 shrink-0 place-items-center rounded-lg'

/**
 * Le attività come tabella da desktop (da 1280px, dove le colonne ci stanno) e
 * come card sotto (doc/08-interfaccia.md, "Riga e card"), con la modifica
 * inline di tutti i campi e le azioni.
 */
export function ElencoAttivita({ attivita, progetti, azioni, conElimina = false }: Props) {
  const campi = (a: Attivita) => ({
    progetto: (
      <CampoProgetto
        progetto={a.progetto}
        progetti={progetti}
        onSalva={(testo) => azioni.cambiaProgetto(a, testo)}
      />
    ),
    titolo: <CampoTitolo titolo={a.titolo} onSalva={(titolo) => azioni.modifica(a, { titolo })} />,
    stato: <SceltaStato compatta valore={a.stato} onScegli={(stato) => azioni.modifica(a, { stato })} />,
    priorita: (
      <SceltaPriorita compatta valore={a.priorita} onScegli={(priorita) => azioni.modifica(a, { priorita })} />
    ),
    avanzamento: (
      <CampoAvanzamento
        valore={a.avanzamento}
        bloccato={a.stato === 'completo'}
        onSalva={(avanzamento) => azioni.modifica(a, { avanzamento })}
      />
    ),
    azioni: (
      <div className="flex items-center gap-0.5">
        {/* Evidenziata se il diario ha delle voci. */}
        <button
          type="button"
          aria-label="Diario"
          title="Diario"
          className={`${icona} ${a.ha_diario ? 'bg-pastello text-salvia-scura' : 'text-testo-tenue hover:bg-fondo'}`}
          onClick={() => azioni.apriDiario(a)}
        >
          <BookOpen className="size-4" aria-hidden="true" />
        </button>
        {conElimina && (
          <button
            type="button"
            aria-label="Elimina"
            title="Elimina"
            className={`${icona} text-testo-tenue hover:bg-fondo hover:text-pericolo`}
            onClick={() => azioni.elimina(a)}
          >
            <Trash2 className="size-4" aria-hidden="true" />
          </button>
        )}
      </div>
    ),
  })

  return (
    <>
      {/* Niente overflow-hidden: l'elenco dei progetti suggeriti deve poter uscire dalla tabella. */}
      <div className="hidden rounded-[11px] border border-bordo bg-white xl:block">
        <table className="w-full border-collapse">
          <thead className="text-left text-xs text-testo-tenue">
            <tr className="border-b border-bordo">
              <th className="w-52 px-3 py-2 font-medium">Progetto</th>
              <th className="px-3 py-2 font-medium">Titolo</th>
              <th className="w-40 px-3 py-2 font-medium">Stato</th>
              <th className="w-40 px-3 py-2 font-medium">Priorità</th>
              <th className="w-56 px-3 py-2 font-medium">Avanzamento</th>
              <th className={`${conElimina ? 'w-32' : 'w-24'} px-3 py-2`}>
                <span className="sr-only">Azioni</span>
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordo">
            {attivita.map((a) => {
              const c = campi(a)
              return (
                // Una riga nuova (o arrivata da un'altra sezione) entra con un'animazione breve.
                <tr key={a.id} className="animate-entra">
                  <td className="max-w-52 px-3 py-1.5">{c.progetto}</td>
                  <td className="px-3 py-1.5">{c.titolo}</td>
                  <td className="px-3 py-1.5">{c.stato}</td>
                  <td className="px-3 py-1.5">{c.priorita}</td>
                  <td className="px-3 py-1.5">{c.avanzamento}</td>
                  <td className="px-2 py-1.5">{c.azioni}</td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2 md:grid-cols-2 xl:hidden">
        {attivita.map((a) => {
          const c = campi(a)
          return (
            <li key={a.id} className="animate-entra flex flex-col gap-1.5 rounded-[11px] border border-bordo bg-white p-3">
              <div className="flex items-center gap-2 text-xs text-testo-tenue">
                <div className="min-w-0 flex-1">{c.progetto}</div>
                {c.azioni}
              </div>
              <div className="font-medium">{c.titolo}</div>
              <div className="flex flex-wrap items-center justify-between gap-2">
                {c.stato}
                {c.priorita}
              </div>
              {c.avanzamento}
            </li>
          )
        })}
      </ul>
    </>
  )
}

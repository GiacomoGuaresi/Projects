import type { Attivita, Modifica } from '../dominio/tipi'
import { CampoAvanzamento, CampoTitolo } from './CampiInline'
import { ProgettoConIcona } from './ProgettoConIcona'
import { SceltaPriorita, SceltaStato } from './Scelte'

interface Props {
  attivita: readonly Attivita[]
  onModifica: (attivita: Attivita, modifica: Modifica) => void
}

/**
 * Le attività come tabella da desktop (da 1280px, dove le colonne ci stanno) e
 * come card sotto (doc/08-interfaccia.md, "Riga e card"), con la modifica
 * inline di titolo, stato, priorità e avanzamento.
 *
 * Il progetto si modifica con lo step 2.7, le azioni arrivano dopo
 * (doc/07-roadmap.md).
 */
export function ElencoAttivita({ attivita, onModifica }: Props) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[11px] border border-bordo bg-white xl:block">
        <table className="w-full border-collapse">
          <thead className="bg-fondo/60 text-left text-xs text-testo-tenue">
            <tr>
              <th className="w-48 px-3 py-2 font-medium">Progetto</th>
              <th className="px-3 py-2 font-medium">Titolo</th>
              <th className="w-40 px-3 py-2 font-medium">Stato</th>
              <th className="w-40 px-3 py-2 font-medium">Priorità</th>
              <th className="w-56 px-3 py-2 font-medium">Avanzamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordo">
            {attivita.map((a) => (
              <tr key={a.id}>
                <td className="max-w-48 px-3 py-1.5">
                  <ProgettoConIcona progetto={a.progetto} />
                </td>
                <td className="px-3 py-1.5">
                  <CampoTitolo titolo={a.titolo} onSalva={(titolo) => onModifica(a, { titolo })} />
                </td>
                <td className="px-3 py-1.5">
                  <SceltaStato compatta valore={a.stato} onScegli={(stato) => onModifica(a, { stato })} />
                </td>
                <td className="px-3 py-1.5">
                  <SceltaPriorita compatta valore={a.priorita} onScegli={(priorita) => onModifica(a, { priorita })} />
                </td>
                <td className="px-3 py-1.5">
                  <CampoAvanzamento
                    valore={a.avanzamento}
                    bloccato={a.stato === 'completo'}
                    onSalva={(avanzamento) => onModifica(a, { avanzamento })}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2 md:grid-cols-2 xl:hidden">
        {attivita.map((a) => (
          <li key={a.id} className="flex flex-col gap-1.5 rounded-[11px] border border-bordo bg-white p-3">
            <div className="text-xs text-testo-tenue">
              <ProgettoConIcona progetto={a.progetto} />
            </div>
            <div className="font-medium">
              <CampoTitolo titolo={a.titolo} onSalva={(titolo) => onModifica(a, { titolo })} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <SceltaStato compatta valore={a.stato} onScegli={(stato) => onModifica(a, { stato })} />
              <SceltaPriorita compatta valore={a.priorita} onScegli={(priorita) => onModifica(a, { priorita })} />
            </div>
            <CampoAvanzamento
              valore={a.avanzamento}
              bloccato={a.stato === 'completo'}
              onSalva={(avanzamento) => onModifica(a, { avanzamento })}
            />
          </li>
        ))}
      </ul>
    </>
  )
}

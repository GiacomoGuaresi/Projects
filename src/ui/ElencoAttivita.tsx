import { Star } from 'lucide-react'
import type { Attivita } from '../dominio/tipi'
import { ProgettoConIcona } from './ProgettoConIcona'
import { infoStati } from './stati'
import { TitoloConTag } from './TitoloConTag'

/**
 * Le attività come tabella da desktop (da 1280px, dove le colonne ci stanno) e
 * come card sotto (doc/08-interfaccia.md, "Riga e card").
 *
 * Step 2.4 (doc/07-roadmap.md): sola lettura. Modifica inline e azioni
 * arrivano con gli step successivi.
 */
export function ElencoAttivita({ attivita }: { attivita: readonly Attivita[] }) {
  return (
    <>
      <div className="hidden overflow-hidden rounded-[11px] border border-bordo bg-white xl:block">
        <table className="w-full border-collapse">
          <thead className="bg-fondo/60 text-left text-xs text-testo-tenue">
            <tr>
              <th className="w-48 px-3 py-2 font-medium">Progetto</th>
              <th className="px-3 py-2 font-medium">Titolo</th>
              <th className="w-32 px-3 py-2 font-medium">Stato</th>
              <th className="w-28 px-3 py-2 font-medium">Priorità</th>
              <th className="w-44 px-3 py-2 font-medium">Avanzamento</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-bordo">
            {attivita.map((a) => (
              <tr key={a.id}>
                <td className="max-w-48 px-3 py-2">
                  <ProgettoConIcona progetto={a.progetto} />
                </td>
                <td className="px-3 py-2">
                  <TitoloConTag titolo={a.titolo} />
                </td>
                <td className="px-3 py-2">
                  <BadgeStato attivita={a} />
                </td>
                <td className="px-3 py-2">
                  <Stelle priorita={a.priorita} />
                </td>
                <td className="px-3 py-2">
                  <Avanzamento valore={a.avanzamento} />
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <ul className="grid gap-2 md:grid-cols-2 xl:hidden">
        {attivita.map((a) => (
          <li key={a.id} className="flex flex-col gap-2 rounded-[11px] border border-bordo bg-white p-3">
            <div className="text-xs text-testo-tenue">
              <ProgettoConIcona progetto={a.progetto} />
            </div>
            <div className="font-medium">
              <TitoloConTag titolo={a.titolo} />
            </div>
            <div className="flex flex-wrap items-center justify-between gap-2">
              <BadgeStato attivita={a} />
              <Stelle priorita={a.priorita} />
            </div>
            <Avanzamento valore={a.avanzamento} />
          </li>
        ))}
      </ul>
    </>
  )
}

function BadgeStato({ attivita }: { attivita: Attivita }) {
  const { etichetta, icona: Icona, colori } = infoStati[attivita.stato]
  return (
    <span className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${colori}`}>
      <Icona className="size-3" aria-hidden="true" />
      {etichetta}
    </span>
  )
}

function Stelle({ priorita }: { priorita: number }) {
  return (
    <span className="inline-flex" role="img" aria-label={`Priorità ${priorita} su 5`}>
      {[1, 2, 3, 4, 5].map((n) => (
        <Star
          key={n}
          className={`size-4 ${n <= priorita ? 'fill-stella text-stella' : 'text-bordo'}`}
          aria-hidden="true"
        />
      ))}
    </span>
  )
}

function Avanzamento({ valore }: { valore: number }) {
  return (
    <span className="flex items-center gap-2">
      <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bordo">
        <span className="block h-full rounded-full bg-salvia" style={{ width: `${valore}%` }} />
      </span>
      <span className="w-9 text-right text-xs text-testo-tenue">{valore}%</span>
    </span>
  )
}

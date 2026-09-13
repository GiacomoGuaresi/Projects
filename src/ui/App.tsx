import { useEffect, useState } from 'react'
import { ListChecks } from 'lucide-react'
import { attivita } from '../dati'
import { progettiInUso } from '../dominio/progetto'
import { ordinaAttivita } from '../dominio/ordinamento'
import type { Attivita } from '../dominio/tipi'

type Verifica =
  | { fase: 'in-corso' }
  | { fase: 'ok'; attivita: Attivita[] }
  | { fase: 'errore'; messaggio: string }

/**
 * Guscio provvisorio (doc/07-roadmap.md, step 2.2): l'intestazione e l'elenco
 * grezzo delle attività lette dallo schema `projects`. Menu e pagine arrivano
 * con gli step successivi.
 */
export function App() {
  const [verifica, setVerifica] = useState<Verifica>({ fase: 'in-corso' })

  useEffect(() => {
    let vivo = true
    attivita()
      .elenco()
      .then((elenco) => {
        if (vivo) setVerifica({ fase: 'ok', attivita: ordinaAttivita(elenco) })
      })
      .catch((errore: Error) => {
        if (vivo) setVerifica({ fase: 'errore', messaggio: errore.message })
      })
    return () => {
      vivo = false
    }
  }, [])

  return (
    <div className="flex min-h-dvh flex-col">
      <header className="sticky top-0 flex items-center gap-2 border-b border-salvia-scura bg-salvia px-3 pt-[env(safe-area-inset-top)] text-white">
        <ListChecks className="size-[22px]" aria-hidden="true" />
        <h1 className="my-3 text-lg font-semibold tracking-[0.01em]">Projects</h1>
      </header>
      <main className="mx-auto w-full max-w-[1200px] flex-1 p-3">
        <section className="rounded-[11px] border border-bordo bg-white p-4">
          <h2 className="mb-2 font-semibold">Verifica dei dati</h2>
          {verifica.fase === 'in-corso' && <p className="text-testo-tenue">Carico…</p>}
          {verifica.fase === 'errore' && (
            <p className="text-pericolo" role="alert">
              {verifica.messaggio}
            </p>
          )}
          {verifica.fase === 'ok' && (
            <>
              <p className="mb-2 text-testo-tenue">
                {verifica.attivita.length} attività, {progettiInUso(verifica.attivita).length} progetti.
              </p>
              <ul className="list-disc pl-5">
                {verifica.attivita.map((a) => (
                  <li key={a.id}>
                    {a.titolo} <span className="text-testo-tenue">· {a.progetto ?? '—'} · {a.stato}</span>
                  </li>
                ))}
              </ul>
            </>
          )}
        </section>
      </main>
    </div>
  )
}

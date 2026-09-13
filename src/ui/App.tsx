import { useEffect, useState } from 'react'
import { ListChecks } from 'lucide-react'
import { db } from '../dati'

type Verifica =
  | { fase: 'in-corso' }
  | { fase: 'ok'; attivita: number; progetti: number }
  | { fase: 'errore'; messaggio: string }

/**
 * Guscio provvisorio della Fase 1 (doc/07-roadmap.md): l'intestazione e una
 * verifica del collegamento allo schema `projects`. Dashboard, pagina Attività
 * e menu arrivano con la Fase 2.
 */
export function App() {
  const [verifica, setVerifica] = useState<Verifica>({ fase: 'in-corso' })

  useEffect(() => {
    let vivo = true
    Promise.all([
      db().from('attivita').select('id', { count: 'exact', head: true }),
      db().from('progetti').select('progetto', { count: 'exact', head: true }),
    ]).then(([attivita, progetti]) => {
      if (!vivo) return
      const errore = attivita.error ?? progetti.error
      setVerifica(
        errore
          ? { fase: 'errore', messaggio: `${errore.code ?? ''} ${errore.message}`.trim() }
          : { fase: 'ok', attivita: attivita.count ?? 0, progetti: progetti.count ?? 0 },
      )
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
          <h2 className="mb-2 font-semibold">Verifica del collegamento</h2>
          {verifica.fase === 'in-corso' && <p className="text-testo-tenue">Controllo…</p>}
          {verifica.fase === 'ok' && (
            <p>
              Schema <code>projects</code> raggiungibile: {verifica.attivita} attività,{' '}
              {verifica.progetti} progetti.
            </p>
          )}
          {verifica.fase === 'errore' && (
            <p className="text-pericolo" role="alert">
              Schema <code>projects</code> non raggiungibile: {verifica.messaggio}
            </p>
          )}
        </section>
      </main>
    </div>
  )
}

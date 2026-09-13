import { useCallback, useState } from 'react'
import { ListChecks, Menu, Plus } from 'lucide-react'
import { MenuLaterale } from './MenuLaterale'
import { useRotta, type Rotta } from './rotta'

const titoli: Record<Rotta, string> = {
  dashboard: 'Dashboard',
  attivita: 'Attività',
}

/**
 * Il guscio dell'app, come Grocery (doc/08-interfaccia.md): intestazione salvia
 * da bordo a bordo con ☰ a sinistra e + a destra, menu laterale, contenuto
 * largo al massimo 1200px. Da 1024px il menu è una colonna fissa e ☰ sparisce.
 *
 * Step 2.3 (doc/07-roadmap.md): le pagine sono ancora vuote e il + non apre
 * nulla; il modale "Nuova attività" arriva con lo step 2.5.
 */
export function App() {
  const rotta = useRotta()
  const [menuAperto, setMenuAperto] = useState(false)
  const chiudiMenu = useCallback(() => setMenuAperto(false), [])

  return (
    <div className="flex min-h-dvh flex-col lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      <header className="sticky top-0 z-1 flex items-center gap-1 border-b border-salvia-scura bg-salvia pt-[env(safe-area-inset-top)] pr-2 pl-1 text-white lg:col-span-full lg:min-h-11 lg:pl-3">
        <button
          className="grid size-11 place-items-center rounded-[11px] active:bg-salvia-scura lg:hidden"
          type="button"
          aria-label="Apri il menu"
          aria-expanded={menuAperto}
          aria-controls="menu"
          onClick={() => setMenuAperto(true)}
        >
          <Menu className="size-[22px]" aria-hidden="true" />
        </button>
        <ListChecks className="size-[22px] shrink-0" aria-hidden="true" />
        <h1 className="ml-1 text-lg font-semibold tracking-[0.01em]">Projects</h1>
        <button
          className="ml-auto flex min-h-9 items-center gap-1.5 rounded-[11px] px-2.5 font-semibold hover:bg-salvia-scura active:bg-salvia-scura disabled:opacity-60 disabled:hover:bg-transparent"
          type="button"
          aria-label="Nuova attività"
          title="Arriva con lo step 2.5"
          disabled
        >
          <Plus className="size-[22px]" aria-hidden="true" />
          <span className="hidden lg:inline">Nuova attività</span>
        </button>
      </header>
      <MenuLaterale aperto={menuAperto} corrente={rotta} onChiudi={chiudiMenu} />
      <main className="mx-auto w-full max-w-[1200px] flex-1 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:col-start-2">
        <h2 className="mb-3 text-lg font-semibold">{titoli[rotta]}</h2>
        <p className="text-testo-tenue">Pagina vuota: il contenuto arriva con i prossimi step.</p>
      </main>
    </div>
  )
}

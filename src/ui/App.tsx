import { useCallback, useState, type ReactNode } from 'react'
import { ListChecks, Menu, Plus } from 'lucide-react'
import { progettiInUso } from '../dominio/progetto'
import { titoloSenzaTag } from '../dominio/tag'
import type { Attivita, Modifica } from '../dominio/tipi'
import { Avviso } from './Avviso'
import { Conferma } from './Conferma'
import { Dashboard } from './Dashboard'
import { MenuLaterale } from './MenuLaterale'
import { ModaleNuova } from './ModaleNuova'
import { useRotta } from './rotta'
import { useAttivita, type StatoElenco } from './useAttivita'

/**
 * Il guscio dell'app, come Grocery (doc/08-interfaccia.md): intestazione salvia
 * da bordo a bordo con ☰ a sinistra e + a destra, menu laterale, contenuto
 * largo al massimo 1200px. Da 1024px il menu è una colonna fissa e ☰ sparisce.
 *
 * Step 2.6 (doc/07-roadmap.md): dashboard con modifica inline e "Nuova
 * attività". La pagina Attività è ancora vuota.
 */
export function App() {
  const rotta = useRotta()
  const [menuAperto, setMenuAperto] = useState(false)
  const [nuovaAperta, setNuovaAperta] = useState(false)
  const [daCompletare, setDaCompletare] = useState<{ attivita: Attivita; modifica: Modifica } | null>(null)
  const chiudiMenu = useCallback(() => setMenuAperto(false), [])
  const { stato, ricarica, crea, modifica, avviso, chiudiAvviso } = useAttivita()
  const progetti = stato.fase === 'pronto' ? progettiInUso(stato.attivita) : []

  /** Passare a "Completo" chiede conferma; il resto si salva subito. */
  const chiediModifica = (attivita: Attivita, cambi: Modifica) => {
    if (cambi.stato === 'completo' && attivita.stato !== 'completo') {
      setDaCompletare({ attivita, modifica: cambi })
    } else {
      void modifica(attivita.id, cambi)
    }
  }

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
          className="ml-auto flex min-h-9 items-center gap-1.5 rounded-[11px] px-2.5 font-semibold hover:bg-salvia-scura active:bg-salvia-scura"
          type="button"
          aria-label="Nuova attività"
          onClick={() => setNuovaAperta(true)}
        >
          <Plus className="size-[22px]" aria-hidden="true" />
          <span className="hidden lg:inline">Nuova attività</span>
        </button>
      </header>
      <MenuLaterale
        aperto={menuAperto}
        corrente={rotta}
        onChiudi={chiudiMenu}
        onNuova={() => {
          setMenuAperto(false)
          setNuovaAperta(true)
        }}
      />
      <main className="mx-auto w-full max-w-[1200px] flex-1 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:col-start-2">
        {rotta === 'dashboard' && (
          <ConAttivita stato={stato} onRiprova={ricarica}>
            {(attivita) => <Dashboard attivita={attivita} onModifica={chiediModifica} />}
          </ConAttivita>
        )}
        {rotta === 'attivita' && (
          <>
            <h2 className="mb-3 text-lg font-semibold">Attività</h2>
            <p className="text-testo-tenue">Pagina vuota: il contenuto arriva con lo step 2.8.</p>
          </>
        )}
      </main>
      {nuovaAperta && <ModaleNuova progetti={progetti} onCrea={crea} onChiudi={() => setNuovaAperta(false)} />}
      {daCompletare && (
        <Conferma
          titolo="Attività completa?"
          conferma="Completa"
          onAnnulla={() => setDaCompletare(null)}
          onConferma={() => {
            void modifica(daCompletare.attivita.id, daCompletare.modifica)
            setDaCompletare(null)
          }}
        >
          <p>
            Segnare <strong>{titoloSenzaTag(daCompletare.attivita.titolo) || daCompletare.attivita.titolo}</strong>{' '}
            come completa? L'avanzamento va al 100% e l'attività esce dalla dashboard.
          </p>
        </Conferma>
      )}
      {avviso && <Avviso messaggio={avviso} onChiudi={chiudiAvviso} />}
    </div>
  )
}

interface ConAttivitaProps {
  stato: StatoElenco
  onRiprova: () => void
  children: (attivita: Attivita[]) => ReactNode
}

/** Caricamento ed errore, uguali per ogni pagina; poi la pagina con le attività. */
function ConAttivita({ stato, onRiprova, children }: ConAttivitaProps) {
  if (stato.fase === 'caricamento') return <p className="p-2 text-testo-tenue">Carico le attività…</p>
  if (stato.fase === 'errore') {
    return (
      <div className="flex flex-col items-start gap-2 p-2" role="alert">
        <p className="text-pericolo">{stato.messaggio}</p>
        <button
          type="button"
          className="min-h-11 rounded-[11px] bg-salvia px-4 font-semibold text-panna hover:bg-salvia-scura"
          onClick={onRiprova}
        >
          Riprova
        </button>
      </div>
    )
  }
  return children(stato.attivita)
}

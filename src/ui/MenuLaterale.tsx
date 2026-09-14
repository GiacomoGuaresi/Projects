import { useEffect, useRef } from 'react'
import { Broom, Download, LayoutDashboard, LayoutList, ListChecks, Plus, X, type LucideIcon } from 'lucide-react'
import { indirizzi, type Rotta } from './rotta'

/** Da questa larghezza il menu è sempre aperto: la stessa soglia di `lg:`. */
const SEMPRE_APERTO = '(min-width: 1024px)'

const sezioni: { rotta: Rotta; etichetta: string; icona: LucideIcon }[] = [
  { rotta: 'dashboard', etichetta: 'Dashboard', icona: LayoutDashboard },
  { rotta: 'stato', etichetta: 'Per stato', icona: LayoutList },
  { rotta: 'attivita', etichetta: 'Attività', icona: ListChecks },
  { rotta: 'faccende', etichetta: 'Faccende', icona: Broom },
]

interface Props {
  aperto: boolean
  corrente: Rotta
  onChiudi: () => void
  /** L'azione "Nuova attività", staccata dalle sezioni. */
  onNuova: () => void
  /** In fondo al menu "Installa l'app", finché l'app non è installata. Se manca, la voce non c'è. */
  onInstalla?: () => void
}

/**
 * Il menu laterale a scomparsa, come in Grocery (doc/08-interfaccia.md,
 * "Navigazione"). Resta sempre montato e scivola dentro da sinistra; si chiude
 * toccando fuori, con la X, con Esc o scegliendo una voce. Da aperto la pagina
 * sotto non scorre, e alla chiusura il fuoco torna dov'era. Da desktop è una
 * colonna fissa, sempre visibile.
 */
export function MenuLaterale({ aperto, corrente, onChiudi, onNuova, onInstalla }: Props) {
  const pannello = useRef<HTMLElement>(null)

  // Se la finestra si allarga col menu aperto lo si chiude, così la pagina
  // torna a scorrere.
  useEffect(() => {
    const desktop = window.matchMedia(SEMPRE_APERTO)
    const chiudi = () => {
      if (desktop.matches) onChiudi()
    }
    desktop.addEventListener('change', chiudi)
    return () => desktop.removeEventListener('change', chiudi)
  }, [onChiudi])

  useEffect(() => {
    if (!aperto) return
    const prima = document.activeElement instanceof HTMLElement ? document.activeElement : null
    pannello.current?.querySelector<HTMLElement>('[aria-current="page"]')?.focus()

    const esc = (evento: KeyboardEvent) => {
      if (evento.key === 'Escape') onChiudi()
    }
    document.addEventListener('keydown', esc)
    const overflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'

    return () => {
      document.removeEventListener('keydown', esc)
      document.body.style.overflow = overflow
      prima?.focus()
    }
  }, [aperto, onChiudi])

  return (
    <>
      <div
        className={`fixed inset-0 z-10 bg-testo/35 transition-[opacity,visibility] duration-200 motion-reduce:transition-none lg:hidden ${
          aperto ? 'visible opacity-100' : 'invisible opacity-0'
        }`}
        aria-hidden="true"
        onClick={onChiudi}
      />
      <nav
        id="menu"
        ref={pannello}
        aria-label="Menu"
        className={`fixed inset-y-0 left-0 z-11 flex w-[min(80vw,256px)] flex-col overflow-y-auto border-r border-bordo bg-white px-2 pt-[env(safe-area-inset-top)] pb-[calc(8px+env(safe-area-inset-bottom))] shadow-[4px_0_16px_rgb(46_58_45/0.12)] transition-[translate,visibility] duration-200 ease-out motion-reduce:transition-none lg:visible lg:sticky lg:top-11 lg:bottom-auto lg:h-[calc(100dvh-44px)] lg:w-auto lg:translate-x-0 lg:pt-2 lg:shadow-none lg:transition-none ${
          aperto ? 'visible translate-x-0' : 'invisible -translate-x-full'
        }`}
      >
        <div className="flex items-center justify-between pl-2 lg:hidden">
          <span className="text-lg font-semibold">Projects</span>
          <button
            className="grid size-11 place-items-center rounded-[11px] text-testo-tenue active:bg-fondo"
            type="button"
            aria-label="Chiudi il menu"
            onClick={onChiudi}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <ul className="flex flex-col gap-0.5">
          {sezioni.map(({ rotta, etichetta, icona: Icona }) => (
            <li key={rotta}>
              <a
                href={indirizzi[rotta]}
                aria-current={rotta === corrente ? 'page' : undefined}
                onClick={onChiudi}
                className="group flex min-h-11 items-center gap-3 rounded-lg px-3 hover:bg-fondo active:bg-bordo aria-[current=page]:bg-pastello aria-[current=page]:font-semibold aria-[current=page]:shadow-[inset_3px_0_0_var(--color-salvia-scura)]"
              >
                <Icona
                  className="size-[18px] text-testo-tenue group-aria-[current=page]:text-salvia-scura"
                  aria-hidden="true"
                />
                {etichetta}
              </a>
            </li>
          ))}
        </ul>
        <hr className="mx-1 my-2 border-bordo" />
        <button
          type="button"
          onClick={onNuova}
          className="flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left font-semibold text-salvia-scura hover:bg-fondo active:bg-bordo"
        >
          <Plus className="size-[18px]" aria-hidden="true" />
          Nuova attività
        </button>
        {/* Le voci di servizio stanno in fondo, lontane dall'uso di tutti i giorni. */}
        {onInstalla && (
          <button
            type="button"
            onClick={onInstalla}
            aria-current={corrente === 'installa' ? 'page' : undefined}
            className="group mt-auto flex min-h-11 w-full items-center gap-3 rounded-lg px-3 text-left hover:bg-fondo active:bg-bordo aria-[current=page]:bg-pastello aria-[current=page]:font-semibold"
          >
            <Download
              className="size-[18px] text-testo-tenue group-aria-[current=page]:text-salvia-scura"
              aria-hidden="true"
            />
            Installa l'app
          </button>
        )}
      </nav>
    </>
  )
}

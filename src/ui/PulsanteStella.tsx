import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Star, StarOff, type LucideIcon } from 'lucide-react'
import type { Rilievo } from '../dominio/ordinamento'
import { usePressioneLunga } from './pressioneLunga'

interface Props {
  rilievo: Rilievo
  /** Il nome del progetto, per le etichette. */
  nome: string
  onScegli: (rilievo: Rilievo) => void
}

const MARGINE_PX = 8

const RILIEVI: readonly Rilievo[] = ['preferito', 'normale', 'accantonato']

const infoRilievi: Record<Rilievo, { etichetta: string; icona: LucideIcon; classi: string }> = {
  preferito: { etichetta: 'Preferito', icona: Star, classi: 'fill-stella text-stella' },
  normale: { etichetta: 'Normale', icona: Star, classi: 'text-stella-vuota' },
  accantonato: { etichetta: 'Accantonato', icona: StarOff, classi: 'text-testo-tenue' },
}

/**
 * La stellina nell'intestazione di una card della Dashboard
 * (doc/08-interfaccia.md). Un tocco mette o toglie il progetto dai preferiti;
 * tenendo premuto si apre il menu Preferito / Normale / Accantonato, che si
 * usa come quello di PulsanteStato: si scorre sulla voce e si rilascia.
 */
export function PulsanteStella({ rilievo, nome, onScegli }: Props) {
  const { etichetta, icona: Icona, classi } = infoRilievi[rilievo]

  const menu = useRef<HTMLDivElement>(null)
  const [aperto, setAperto] = useState(false)
  const [sotto, setSotto] = useState<Rilievo | null>(null)
  const [posizione, setPosizione] = useState<{ left: number; top: number } | null>(null)

  const chiudi = () => {
    setAperto(false)
    setSotto(null)
    setPosizione(null)
  }

  const rilievoNelPunto = (x: number, y: number): Rilievo | null => {
    const voce = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-rilievo]')
    return voce && menu.current?.contains(voce) ? (voce.dataset.rilievo as Rilievo) : null
  }

  const {
    ref: pulsante,
    gestori,
    inCorso,
    clicDaIgnorare,
  } = usePressioneLunga<HTMLButtonElement>({
    onInizio: () => setAperto(true),
    onMuovi: (e) => setSotto(rilievoNelPunto(e.clientX, e.clientY)),
    onRilascia: (e) => {
      const scelto = rilievoNelPunto(e.clientX, e.clientY)
      const punto = document.elementFromPoint(e.clientX, e.clientY)
      if (scelto) {
        chiudi()
        if (scelto !== rilievo) onScegli(scelto)
      } else if (menu.current?.contains(punto) || pulsante.current?.contains(punto)) {
        // Rilasciato senza scegliere: il menu resta aperto per scegliere con un tocco.
        setSotto(null)
      } else {
        chiudi()
      }
    },
  })

  // Il menu sta sopra il pulsante, allineato a destra; sotto se in alto non c'è spazio.
  useLayoutEffect(() => {
    if (!aperto || !pulsante.current || !menu.current) return
    const b = pulsante.current.getBoundingClientRect()
    const m = menu.current.getBoundingClientRect()
    const sopra = b.top - m.height - MARGINE_PX
    setPosizione({
      left: Math.max(MARGINE_PX, Math.min(b.right - m.width, window.innerWidth - m.width - MARGINE_PX)),
      top: sopra >= MARGINE_PX ? sopra : Math.min(b.bottom + MARGINE_PX, window.innerHeight - m.height - MARGINE_PX),
    })
  }, [aperto, pulsante])

  // Aperto, si chiude con Esc, toccando fuori o scorrendo la pagina.
  useEffect(() => {
    if (!aperto) return
    const tasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        chiudi()
        pulsante.current?.focus()
      }
    }
    const fuori = (e: PointerEvent) => {
      const t = e.target as Node
      if (!menu.current?.contains(t) && !pulsante.current?.contains(t)) chiudi()
    }
    const scorri = () => {
      if (!inCorso.current) chiudi()
    }
    document.addEventListener('keydown', tasto)
    document.addEventListener('pointerdown', fuori)
    window.addEventListener('scroll', scorri, true)
    window.addEventListener('resize', chiudi)
    return () => {
      document.removeEventListener('keydown', tasto)
      document.removeEventListener('pointerdown', fuori)
      window.removeEventListener('scroll', scorri, true)
      window.removeEventListener('resize', chiudi)
    }
  }, [aperto, pulsante, inCorso])

  return (
    <>
      <button
        ref={pulsante}
        type="button"
        aria-label={`${nome}: ${etichetta}`}
        aria-haspopup="menu"
        aria-expanded={aperto}
        title={`${rilievo === 'preferito' ? 'Togli dai preferiti' : 'Metti nei preferiti'} (tieni premuto per accantonare)`}
        className="grid size-8 shrink-0 touch-manipulation place-items-center rounded-lg select-none [-webkit-touch-callout:none] hover:bg-fondo active:bg-bordo"
        {...gestori}
        onContextMenu={(e) => {
          e.preventDefault()
          setAperto(true)
        }}
        onClick={() => {
          if (clicDaIgnorare()) return
          if (aperto) chiudi()
          else onScegli(rilievo === 'preferito' ? 'normale' : 'preferito')
        }}
      >
        <Icona className={`size-4.5 ${classi}`} aria-hidden="true" />
      </button>

      {aperto &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label="Posizione del progetto"
            className="animate-compari fixed z-50 flex w-44 flex-col gap-0.5 rounded-[11px] border border-bordo bg-white p-1 font-normal shadow-lg select-none [-webkit-touch-callout:none]"
            style={posizione ?? { left: 0, top: 0, visibility: 'hidden' }}
          >
            {RILIEVI.map((r) => {
              const info = infoRilievi[r]
              const attuale = r === rilievo
              return (
                <button
                  key={r}
                  type="button"
                  role="menuitemradio"
                  aria-checked={attuale}
                  data-rilievo={r}
                  className={`flex min-h-11 items-center gap-2 rounded-lg px-2 text-left ${
                    sotto === r ? 'bg-pastello' : 'hover:bg-fondo'
                  } ${attuale ? 'font-semibold' : ''}`}
                  onClick={() => {
                    chiudi()
                    pulsante.current?.focus()
                    if (!attuale) onScegli(r)
                  }}
                >
                  <info.icona className={`size-4.5 shrink-0 ${info.classi}`} aria-hidden="true" />
                  {info.etichetta}
                </button>
              )
            })}
          </div>,
          document.body,
        )}
    </>
  )
}

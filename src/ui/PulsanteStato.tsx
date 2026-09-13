import { useEffect, useLayoutEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { statoSuccessivo } from '../dominio/attivita'
import { STATI, type Stato } from '../dominio/tipi'
import { usePressioneLunga } from './pressioneLunga'
import { infoStati } from './stati'

interface Props {
  stato: Stato
  /** Chi riceve chiede conferma per *Completo*. */
  onScegli: (stato: Stato) => void
}

const MARGINE_PX = 8

/**
 * L'icona dello stato nella Dashboard (doc/08-interfaccia.md). Un tocco porta
 * allo stato successivo; tenendo premuto si apre il menu di tutti gli stati:
 * si fa scorrere il dito su quello voluto e lo si rilascia. Rilasciato fuori
 * dal menu, o sullo stato attuale, non cambia nulla. Il menu si apre anche con
 * il tasto destro o il tasto menu.
 */
export function PulsanteStato({ stato, onScegli }: Props) {
  const { etichetta, icona: Icona, colori } = infoStati[stato]
  const successivo = infoStati[statoSuccessivo(stato)].etichetta

  const menu = useRef<HTMLDivElement>(null)
  const [aperto, setAperto] = useState(false)
  const [sotto, setSotto] = useState<Stato | null>(null)
  const [posizione, setPosizione] = useState<{ left: number; top: number } | null>(null)

  const chiudi = () => {
    setAperto(false)
    setSotto(null)
    setPosizione(null)
  }

  const statoNelPunto = (x: number, y: number): Stato | null => {
    const voce = document.elementFromPoint(x, y)?.closest<HTMLElement>('[data-stato]')
    return voce && menu.current?.contains(voce) ? (voce.dataset.stato as Stato) : null
  }

  const {
    ref: pulsante,
    gestori,
    inCorso,
    clicDaIgnorare,
  } = usePressioneLunga<HTMLButtonElement>({
    onInizio: () => setAperto(true),
    onMuovi: (e) => setSotto(statoNelPunto(e.clientX, e.clientY)),
    onRilascia: (e) => {
      const scelto = statoNelPunto(e.clientX, e.clientY)
      const punto = document.elementFromPoint(e.clientX, e.clientY)
      if (scelto) {
        chiudi()
        if (scelto !== stato) onScegli(scelto)
      } else if (menu.current?.contains(punto) || pulsante.current?.contains(punto)) {
        // Rilasciato senza scegliere: il menu resta aperto per scegliere con un tocco.
        setSotto(null)
      } else {
        chiudi()
      }
    },
  })

  // Il menu sta sopra il pulsante, dove il dito non lo copre; sotto se in alto non c'è spazio.
  useLayoutEffect(() => {
    if (!aperto || !pulsante.current || !menu.current) return
    const b = pulsante.current.getBoundingClientRect()
    const m = menu.current.getBoundingClientRect()
    const sopra = b.top - m.height - MARGINE_PX
    setPosizione({
      left: Math.max(MARGINE_PX, Math.min(b.left, window.innerWidth - m.width - MARGINE_PX)),
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
        aria-label={`${etichetta}: passa a ${successivo}`}
        aria-haspopup="menu"
        aria-expanded={aperto}
        title={`${etichetta} → ${successivo} (tieni premuto per scegliere)`}
        className="grid size-8 shrink-0 touch-manipulation place-items-center rounded-lg select-none [-webkit-touch-callout:none] hover:bg-fondo active:bg-bordo"
        {...gestori}
        onContextMenu={(e) => {
          // Android apre il menu contestuale con la pressione lunga: qui apre il nostro.
          e.preventDefault()
          setAperto(true)
        }}
        onClick={() => {
          if (clicDaIgnorare()) return
          if (aperto) chiudi()
          else onScegli(statoSuccessivo(stato))
        }}
      >
        <span className={`grid size-6 place-items-center rounded-md ${colori}`}>
          <Icona className="size-3.5" aria-hidden="true" />
        </span>
      </button>

      {aperto &&
        createPortal(
          <div
            ref={menu}
            role="menu"
            aria-label="Stato"
            className="animate-compari fixed z-50 flex w-40 flex-col gap-0.5 rounded-[11px] border border-bordo bg-white p-1 shadow-lg select-none [-webkit-touch-callout:none]"
            // Prima della misura resta invisibile, per non lampeggiare nell'angolo.
            style={posizione ?? { left: 0, top: 0, visibility: 'hidden' }}
          >
            {STATI.map((s) => {
              const info = infoStati[s]
              const attuale = s === stato
              return (
                <button
                  key={s}
                  type="button"
                  role="menuitemradio"
                  aria-checked={attuale}
                  data-stato={s}
                  className={`flex min-h-11 items-center gap-2 rounded-lg px-2 text-left ${
                    sotto === s ? 'bg-pastello' : 'hover:bg-fondo'
                  } ${attuale ? 'font-semibold' : ''}`}
                  onClick={() => {
                    chiudi()
                    pulsante.current?.focus()
                    if (!attuale) onScegli(s)
                  }}
                >
                  <span className={`grid size-6 shrink-0 place-items-center rounded-md ${info.colori}`}>
                    <info.icona className="size-3.5" aria-hidden="true" />
                  </span>
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

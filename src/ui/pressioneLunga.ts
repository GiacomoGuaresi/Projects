import { useEffect, useRef, type PointerEvent as ReactPointerEvent } from 'react'

/** Quanto tenere premuto perché parta il gesto. */
const PRESSIONE_LUNGA_MS = 400
/** Oltre questo spostamento prima della partenza è uno scorrimento, non una pressione. */
const TOLLERANZA_PX = 8

interface Opzioni {
  /** Il dito è rimasto fermo abbastanza: il gesto comincia dal punto premuto. */
  onInizio: (x: number, y: number) => void
  onMuovi?: (e: ReactPointerEvent) => void
  onRilascia?: (e: ReactPointerEvent) => void
  /** Il browser ha interrotto il gesto (per esempio una chiamata in arrivo). */
  onAnnulla?: () => void
  disattiva?: boolean
}

/**
 * Una pressione lunga seguita da un trascinamento, con dito, penna o mouse.
 * Mentre il gesto è in corso la pagina non scorre e il clic che segue il
 * rilascio va ignorato (`clicDaIgnorare`); un tocco breve resta un clic.
 */
export function usePressioneLunga<T extends HTMLElement>(opzioni: Opzioni) {
  const ref = useRef<T>(null)
  const ultime = useRef(opzioni)
  ultime.current = opzioni

  const pressione = useRef<{ x: number; y: number; timer: number } | null>(null)
  const inCorso = useRef(false)
  const ignoraClick = useRef(false)

  const annullaPressione = () => {
    if (pressione.current) window.clearTimeout(pressione.current.timer)
    pressione.current = null
  }

  // Serve un ascoltatore non passivo per fermare lo scorrimento della pagina.
  useEffect(() => {
    const el = ref.current
    if (!el) return
    const blocca = (e: TouchEvent) => {
      if (inCorso.current) e.preventDefault()
    }
    el.addEventListener('touchmove', blocca, { passive: false })
    return () => {
      el.removeEventListener('touchmove', blocca)
      annullaPressione()
    }
  }, [])

  const gestori = {
    onPointerDown: (e: ReactPointerEvent<T>) => {
      ignoraClick.current = false
      annullaPressione()
      if (e.button !== 0 || ultime.current.disattiva) return
      // Con la cattura anche il mouse continua a mandare qui i movimenti fuori dall'elemento.
      e.currentTarget.setPointerCapture(e.pointerId)
      const { clientX: x, clientY: y } = e
      pressione.current = {
        x,
        y,
        timer: window.setTimeout(() => {
          pressione.current = null
          ignoraClick.current = true
          inCorso.current = true
          navigator.vibrate?.(10)
          ultime.current.onInizio(x, y)
        }, PRESSIONE_LUNGA_MS),
      }
    },
    onPointerMove: (e: ReactPointerEvent<T>) => {
      const p = pressione.current
      if (p && Math.hypot(e.clientX - p.x, e.clientY - p.y) > TOLLERANZA_PX) annullaPressione()
      if (inCorso.current) ultime.current.onMuovi?.(e)
    },
    onPointerUp: (e: ReactPointerEvent<T>) => {
      annullaPressione()
      if (!inCorso.current) return
      inCorso.current = false
      ultime.current.onRilascia?.(e)
    },
    onPointerCancel: () => {
      annullaPressione()
      if (!inCorso.current) return
      inCorso.current = false
      ultime.current.onAnnulla?.()
    },
  }

  /** Da chiamare nel clic: vero (una volta sola) se il clic chiude una pressione lunga. */
  const clicDaIgnorare = () => {
    const ignora = ignoraClick.current
    ignoraClick.current = false
    return ignora
  }

  return { ref, gestori, inCorso, clicDaIgnorare }
}

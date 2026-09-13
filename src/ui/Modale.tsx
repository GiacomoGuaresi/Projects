import { useEffect, useRef, type ReactNode } from 'react'
import { X } from 'lucide-react'

interface Props {
  titolo: string
  onChiudi: () => void
  children: ReactNode
  /** I pulsanti in fondo, fuori dalla parte che scorre. */
  piede?: ReactNode
  /** Su mobile occupa tutto lo schermo (es. "Nuova attività"). */
  schermoInteroMobile?: boolean
  /** Più largo, per leggere testi lunghi (descrizione, diario). */
  larga?: boolean
}

/**
 * Un modale su `<dialog>`: il browser pensa a fuoco, Esc e sfondo inerte.
 * È aperto finché è montato; Esc, la X e il tocco fuori chiamano `onChiudi`.
 */
export function Modale({ titolo, onChiudi, children, piede, schermoInteroMobile = false, larga = false }: Props) {
  const dialogo = useRef<HTMLDialogElement>(null)
  const chiudi = useRef(onChiudi)

  useEffect(() => {
    chiudi.current = onChiudi
  })

  useEffect(() => {
    const d = dialogo.current
    if (!d) return
    d.showModal()
    // Esc: chiude chi possiede lo stato, non il browser da solo.
    const annulla = (evento: Event) => {
      evento.preventDefault()
      chiudi.current()
    }
    d.addEventListener('cancel', annulla)
    return () => {
      d.removeEventListener('cancel', annulla)
      d.close()
    }
  }, [])

  return (
    <dialog
      ref={dialogo}
      aria-label={titolo}
      onClick={(evento) => {
        if (evento.target === dialogo.current) onChiudi()
      }}
      className={`open:animate-compari backdrop:animate-dissolvi m-auto max-h-[min(90dvh,800px)] ${larga ? 'w-[min(100%-24px,860px)]' : 'w-[min(100%-24px,640px)]'} max-w-none overflow-hidden rounded-[14px] border border-bordo bg-white p-0 text-testo shadow-xl backdrop:bg-testo/40 ${
        schermoInteroMobile ? 'max-sm:h-dvh max-sm:max-h-dvh max-sm:w-full max-sm:rounded-none max-sm:border-0' : ''
      }`}
    >
      <div className="flex max-h-[inherit] flex-col max-sm:h-full">
        <div className="flex items-center gap-2 border-b border-bordo pt-[env(safe-area-inset-top)] pr-1 pl-4">
          <h2 className="min-w-0 flex-1 truncate text-base font-semibold">{titolo}</h2>
          <button
            type="button"
            className="grid size-11 shrink-0 place-items-center rounded-[11px] text-testo-tenue hover:bg-fondo"
            aria-label="Chiudi"
            onClick={onChiudi}
          >
            <X className="size-5" aria-hidden="true" />
          </button>
        </div>
        <div className="min-h-0 flex-1 overflow-y-auto p-4">{children}</div>
        {piede && (
          <div className="flex flex-wrap justify-end gap-2 border-t border-bordo px-4 pt-3 pb-[calc(12px+env(safe-area-inset-bottom))]">
            {piede}
          </div>
        )}
      </div>
    </dialog>
  )
}

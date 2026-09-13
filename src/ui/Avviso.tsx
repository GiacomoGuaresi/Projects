import { useEffect } from 'react'
import { X } from 'lucide-react'

/** Un messaggio in basso, che sparisce da solo dopo qualche secondo. */
export function Avviso({ messaggio, onChiudi }: { messaggio: string; onChiudi: () => void }) {
  useEffect(() => {
    const timer = window.setTimeout(onChiudi, 6000)
    return () => window.clearTimeout(timer)
  }, [messaggio, onChiudi])

  return (
    <div
      role="alert"
      className="fixed inset-x-3 bottom-[calc(12px+env(safe-area-inset-bottom))] z-20 mx-auto flex max-w-md items-center gap-2 rounded-[11px] bg-testo py-1 pr-1 pl-4 text-panna shadow-lg"
    >
      <p className="flex-1">{messaggio}</p>
      <button
        type="button"
        className="grid size-10 shrink-0 place-items-center rounded-[11px] hover:bg-white/10"
        aria-label="Chiudi l'avviso"
        onClick={onChiudi}
      >
        <X className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

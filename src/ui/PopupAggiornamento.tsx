import { useAggiornamento } from './aggiornamento'

/**
 * L'avviso di una versione nuova, in basso sopra la safe area: "Aggiorna" la
 * carica subito, "Più tardi" lo zittisce fino alla versione dopo. Non sparisce
 * da solo: un aggiornamento perso resta perso fino alla prossima apertura.
 */
export function PopupAggiornamento() {
  const { disponibile, aggiorna, rimanda } = useAggiornamento()
  if (!disponibile) return null

  return (
    <div className="pointer-events-none fixed inset-x-0 bottom-0 z-40 flex justify-center px-3 pb-[calc(16px+env(safe-area-inset-bottom))]">
      <div
        role="status"
        className="animate-entra pointer-events-auto flex min-h-12 w-full max-w-[480px] items-center gap-1 rounded-[14px] bg-testo py-1 pr-1 pl-4 text-panna shadow-lg"
      >
        <span className="min-w-0 flex-1">È disponibile una nuova versione</span>
        <button type="button" className="min-h-10 shrink-0 rounded-[11px] px-3 text-panna/75 active:bg-white/10" onClick={rimanda}>
          Più tardi
        </button>
        <button type="button" className="min-h-10 shrink-0 rounded-[11px] px-3 font-semibold text-girasole active:bg-white/10" onClick={aggiorna}>
          Aggiorna
        </button>
      </div>
    </div>
  )
}

import { coloreProgetto, iniziali } from '../dominio/progetto'

/**
 * Il progetto con la sua icona: iniziali su un colore ricavato dal nome
 * (doc/08-interfaccia.md, "Icona del progetto"). Senza progetto, "—".
 */
export function ProgettoConIcona({ progetto }: { progetto: string | null }) {
  if (progetto === null) return <span className="text-testo-tenue">—</span>
  return (
    <span className="flex min-w-0 items-center gap-1.5">
      <span
        className="grid size-6 shrink-0 place-items-center rounded-md text-[10px] font-semibold text-testo"
        style={{ background: coloreProgetto(progetto) }}
        aria-hidden="true"
      >
        {iniziali(progetto)}
      </span>
      <span className="truncate">{progetto}</span>
    </span>
  )
}

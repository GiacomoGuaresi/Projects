import { BookOpen } from 'lucide-react'

interface Props {
  /** Il diario ha delle voci. */
  pieno: boolean
  onApri: () => void
}

/**
 * Il pulsante del diario nelle righe delle attività. Se il diario ha delle
 * voci compare un pallino, come le notifiche delle app.
 */
export function PulsanteDiario({ pieno, onApri }: Props) {
  return (
    <button
      type="button"
      aria-label={pieno ? 'Diario (con voci)' : 'Diario'}
      title="Diario"
      className="relative grid size-8 shrink-0 place-items-center rounded-lg text-testo-tenue hover:bg-fondo"
      onClick={onApri}
    >
      <BookOpen className="size-4" aria-hidden="true" />
      {pieno && (
        <span
          className="absolute top-1 right-1 size-2 rounded-full bg-salvia ring-2 ring-white"
          aria-hidden="true"
        />
      )}
    </button>
  )
}

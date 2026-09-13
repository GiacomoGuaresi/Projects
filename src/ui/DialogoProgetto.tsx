import { Modale } from './Modale'

interface Props {
  da: string
  a: string | null
  quante: number
  onSoloQuesta: () => void
  onTutte: () => void
  onAnnulla: () => void
}

/**
 * "Solo questa / tutte" al cambio del progetto (doc/08-interfaccia.md, "Cambio
 * del progetto"): "Tutte" è una rinomina, completate comprese, e unisce i due
 * progetti se il nuovo nome esiste già.
 */
export function DialogoProgetto({ da, a, quante, onSoloQuesta, onTutte, onAnnulla }: Props) {
  const pulsante = 'min-h-11 rounded-[11px] px-4 font-semibold'
  return (
    <Modale
      titolo={a === null ? 'Togliere il progetto?' : 'Cambiare il progetto?'}
      onChiudi={onAnnulla}
      piede={
        <>
          <button type="button" className={`${pulsante} text-testo-tenue hover:bg-fondo`} onClick={onAnnulla}>
            Annulla
          </button>
          <button
            type="button"
            className={`${pulsante} border border-salvia text-salvia-scura hover:bg-fondo`}
            onClick={onSoloQuesta}
          >
            Solo questa attività
          </button>
          <button
            type="button"
            autoFocus
            className={`${pulsante} bg-salvia text-panna hover:bg-salvia-scura`}
            onClick={onTutte}
          >
            Tutte le {quante} attività di “{da}”
          </button>
        </>
      }
    >
      <div className="flex flex-col gap-2">
        <p>
          {a === null ? (
            <>
              Togliere il progetto <strong>{da}</strong>?
            </>
          ) : (
            <>
              Cambiare il progetto da <strong>{da}</strong> a <strong>{a}</strong>?
            </>
          )}
        </p>
        <p className="text-sm text-testo-tenue">
          “Tutte” cambia anche le attività completate
          {a !== null && ', e se il progetto nuovo esiste già i due si uniscono'}.
        </p>
      </div>
    </Modale>
  )
}

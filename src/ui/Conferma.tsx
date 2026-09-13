import type { ReactNode } from 'react'
import { Modale } from './Modale'

interface Props {
  titolo: string
  children: ReactNode
  /** L'etichetta del pulsante che conferma. */
  conferma: string
  pericolo?: boolean
  onConferma: () => void
  onAnnulla: () => void
}

/** Una domanda con "Annulla" e un pulsante di conferma. */
export function Conferma({ titolo, children, conferma, pericolo = false, onConferma, onAnnulla }: Props) {
  return (
    <Modale
      titolo={titolo}
      onChiudi={onAnnulla}
      piede={
        <>
          <button
            type="button"
            className="min-h-11 rounded-[11px] px-4 font-semibold text-testo-tenue hover:bg-fondo"
            onClick={onAnnulla}
          >
            Annulla
          </button>
          <button
            type="button"
            autoFocus
            className={`min-h-11 rounded-[11px] px-4 font-semibold text-panna ${
              pericolo ? 'bg-pericolo hover:brightness-90' : 'bg-salvia hover:bg-salvia-scura'
            }`}
            onClick={onConferma}
          >
            {conferma}
          </button>
        </>
      }
    >
      {children}
    </Modale>
  )
}

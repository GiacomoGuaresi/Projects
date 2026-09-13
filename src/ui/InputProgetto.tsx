import { useId, useState } from 'react'
import { suggerisciProgetti, type ProgettoInUso } from '../dominio/progetto'
import { ProgettoConIcona } from './ProgettoConIcona'

interface Props {
  valore: string
  onCambia: (testo: string) => void
  progetti: readonly ProgettoInUso[]
  /** Scelto un suggerimento (col tocco o con Invio). */
  onScegli?: (progetto: string) => void
  /** Invio senza suggerimento evidenziato. Se manca, Invio fa il suo lavoro (es. invia il form). */
  onConferma?: (testo: string) => void
  /** Esc a suggerimenti chiusi. */
  onAnnulla?: () => void
  onBlur?: () => void
  id?: string
  className?: string
  autoFocus?: boolean
  placeholder?: string
  etichetta?: string
}

/**
 * Il campo del progetto con i suggerimenti dei progetti già usati
 * (doc/04-modello-dati.md, "Suggerimenti del progetto"): frecce per scorrere,
 * Invio o tocco per scegliere, Esc per chiudere l'elenco.
 */
export function InputProgetto({
  valore,
  onCambia,
  progetti,
  onScegli,
  onConferma,
  onAnnulla,
  onBlur,
  id,
  className,
  autoFocus,
  placeholder,
  etichetta,
}: Props) {
  const [aperto, setAperto] = useState(false)
  const [evidenziato, setEvidenziato] = useState(-1)
  const elenco = useId()
  const voci = aperto ? suggerisciProgetti(valore, progetti) : []
  const scelta = evidenziato >= 0 && evidenziato < voci.length ? evidenziato : -1

  const scegli = (progetto: string) => {
    onCambia(progetto)
    setAperto(false)
    setEvidenziato(-1)
    onScegli?.(progetto)
  }

  return (
    <div className="relative">
      <input
        id={id}
        role="combobox"
        aria-label={etichetta}
        aria-expanded={voci.length > 0}
        aria-controls={elenco}
        aria-autocomplete="list"
        aria-activedescendant={scelta >= 0 ? `${elenco}-${scelta}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        placeholder={placeholder}
        className={className}
        value={valore}
        onFocus={() => setAperto(true)}
        onBlur={() => {
          setAperto(false)
          onBlur?.()
        }}
        onChange={(e) => {
          onCambia(e.target.value)
          setAperto(true)
          setEvidenziato(-1)
        }}
        onKeyDown={(e) => {
          if (e.key === 'ArrowDown' || e.key === 'ArrowUp') {
            e.preventDefault()
            setAperto(true)
            if (voci.length) {
              // Si gira da -1 (nessuno, cioè il testo scritto) all'ultimo suggerimento.
              const passo = e.key === 'ArrowDown' ? 1 : -1
              const posti = voci.length + 1
              setEvidenziato(((scelta + 1 + passo + posti) % posti) - 1)
            }
          } else if (e.key === 'Enter') {
            if (scelta >= 0) {
              e.preventDefault()
              scegli(voci[scelta])
            } else if (onConferma) {
              e.preventDefault()
              onConferma(valore)
            }
          } else if (e.key === 'Escape') {
            // Esc chiude prima l'elenco, e non il modale che contiene il campo.
            e.preventDefault()
            e.stopPropagation()
            if (voci.length) setAperto(false)
            else onAnnulla?.()
          }
        }}
      />
      {voci.length > 0 && (
        <ul
          id={elenco}
          role="listbox"
          className="absolute inset-x-0 top-full z-5 mt-1 flex max-h-60 flex-col overflow-y-auto rounded-[11px] border border-bordo bg-white py-1 shadow-lg"
        >
          {voci.map((progetto, i) => (
            <li
              key={progetto}
              id={`${elenco}-${i}`}
              role="option"
              aria-selected={i === scelta}
              className={`cursor-pointer px-3 py-2 text-sm ${i === scelta ? 'bg-pastello' : 'hover:bg-fondo'}`}
              // Il tocco non deve togliere il fuoco al campo prima della scelta.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => scegli(progetto)}
            >
              <ProgettoConIcona progetto={progetto} />
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

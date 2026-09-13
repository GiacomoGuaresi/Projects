import { useId, useLayoutEffect, useRef, useState } from 'react'
import { inserisciTag, suggerisciTag, tagInCorso } from '../dominio/tag'
import { TitoloConTag } from './TitoloConTag'

/** La scritta sotto il campo del titolo, al posto dell'elenco dei tag. */
export function AiutoTag() {
  return (
    <p className="text-xs text-testo-tenue">
      Scrivi <kbd className="rounded border border-bordo px-1 font-sans">&lt;</kbd> per aggiungere un tag
    </p>
  )
}

interface Props {
  valore: string
  onCambia: (testo: string) => void
  /** Invio senza suggerimenti aperti. Se manca, Invio fa il suo lavoro (es. invia il form). */
  onConferma?: () => void
  /** Esc a suggerimenti chiusi. Se manca, Esc fa il suo lavoro (es. chiude il modale). */
  onAnnulla?: () => void
  onBlur?: () => void
  id?: string
  className?: string
  autoFocus?: boolean
  etichetta?: string
}

/**
 * Il campo del titolo con i suggerimenti dei tag (doc/08-interfaccia.md, "Tag"):
 * scrivendo "<" compaiono i tag in elenco, filtrati da quello che segue. Frecce
 * per scorrere, Invio, Tab o tocco per scegliere, Esc per chiudere l'elenco.
 */
export function InputTitolo({ valore, onCambia, onConferma, onAnnulla, onBlur, id, className, autoFocus, etichetta }: Props) {
  const campo = useRef<HTMLInputElement>(null)
  const [cursore, setCursore] = useState(valore.length)
  const [aperto, setAperto] = useState(true)
  const [evidenziato, setEvidenziato] = useState(0)
  const elenco = useId()
  // Dove rimettere il cursore dopo aver inserito un tag, quando il nuovo valore è nel campo.
  const daPosizionare = useRef<number | null>(null)

  useLayoutEffect(() => {
    const posizione = daPosizionare.current
    if (posizione === null || !campo.current) return
    daPosizionare.current = null
    campo.current.setSelectionRange(posizione, posizione)
    setCursore(posizione)
  }, [valore])

  const inCorso = aperto ? tagInCorso(valore, cursore) : null
  const voci = inCorso ? suggerisciTag(inCorso.testo) : []
  const scelta = Math.min(evidenziato, voci.length - 1)

  const scegli = (nome: string) => {
    if (!inCorso) return
    const nuovo = inserisciTag(valore, inCorso, nome)
    daPosizionare.current = nuovo.cursore
    setEvidenziato(0)
    onCambia(nuovo.titolo)
  }

  return (
    <div className="relative">
      <input
        ref={campo}
        id={id}
        role="combobox"
        aria-label={etichetta}
        aria-expanded={voci.length > 0}
        aria-controls={elenco}
        aria-autocomplete="list"
        aria-activedescendant={voci.length ? `${elenco}-${scelta}` : undefined}
        autoComplete="off"
        autoFocus={autoFocus}
        className={className}
        value={valore}
        onFocus={() => setAperto(true)}
        onBlur={() => {
          setAperto(false)
          onBlur?.()
        }}
        onSelect={(e) => setCursore(e.currentTarget.selectionStart ?? valore.length)}
        onChange={(e) => {
          onCambia(e.target.value)
          setCursore(e.target.selectionStart ?? e.target.value.length)
          setAperto(true)
          setEvidenziato(0)
        }}
        onKeyDown={(e) => {
          if (voci.length && (e.key === 'ArrowDown' || e.key === 'ArrowUp')) {
            e.preventDefault()
            const passo = e.key === 'ArrowDown' ? 1 : -1
            setEvidenziato((scelta + passo + voci.length) % voci.length)
          } else if (voci.length && (e.key === 'Enter' || e.key === 'Tab')) {
            e.preventDefault()
            scegli(voci[scelta].nome)
          } else if (e.key === 'Enter' && onConferma) {
            e.preventDefault()
            onConferma()
          } else if (e.key === 'Escape') {
            // Esc chiude prima l'elenco, e non il modale che contiene il campo.
            if (voci.length) {
              e.preventDefault()
              e.stopPropagation()
              setAperto(false)
            } else if (onAnnulla) {
              e.preventDefault()
              onAnnulla()
            }
          }
        }}
      />
      {voci.length > 0 && (
        <ul
          id={elenco}
          role="listbox"
          className="absolute inset-x-0 top-full z-5 mt-1 flex max-h-60 flex-col overflow-y-auto rounded-[11px] border border-bordo bg-white py-1 text-left text-sm font-normal shadow-lg"
        >
          {voci.map((tag, i) => (
            <li
              key={tag.nome}
              id={`${elenco}-${i}`}
              role="option"
              aria-selected={i === scelta}
              className={`flex cursor-pointer items-center gap-2 px-3 py-2 ${i === scelta ? 'bg-pastello' : 'hover:bg-fondo'}`}
              // Il tocco non deve togliere il fuoco al campo prima della scelta.
              onPointerDown={(e) => e.preventDefault()}
              onClick={() => scegli(tag.nome)}
            >
              <TitoloConTag titolo={`<${tag.nome}>`} />
              <span className="truncate text-xs text-testo-tenue">{tag.uso}</span>
            </li>
          ))}
        </ul>
      )}
    </div>
  )
}

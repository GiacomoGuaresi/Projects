import { useState } from 'react'
import { Plus } from 'lucide-react'

interface Props {
  placeholder: string
  etichetta: string
  /** Crea con il titolo già ripulito; se non riesce lancia l'errore. */
  onCrea: (titolo: string) => Promise<unknown>
}

/**
 * L'ultima riga di una card (doc/08-interfaccia.md, "Aggiunta rapida"): un
 * titolo e Invio creano. Il campo resta aperto per aggiungerne un altro; Esc lo
 * svuota; un errore compare sotto, con il testo conservato.
 */
export function AggiuntaRapida({ placeholder, etichetta, onCrea }: Props) {
  const [titolo, setTitolo] = useState('')
  const [invio, setInvio] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)

  const crea = async () => {
    const pulito = titolo.trim()
    if (!pulito || invio) return
    setInvio(true)
    setErrore(null)
    try {
      await onCrea(pulito)
      setTitolo('')
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setInvio(false)
    }
  }

  return (
    <form
      className="flex flex-col"
      onSubmit={(e) => {
        e.preventDefault()
        void crea()
      }}
    >
      {/* Allineata alle righe: il + sta sotto le icone dello stato. */}
      <label className="flex items-center gap-1 py-1 pr-2 pl-1.5 text-testo-tenue focus-within:text-testo">
        <span className="grid size-8 shrink-0 place-items-center" aria-hidden="true">
          <Plus className="size-4" />
        </span>
        <input
          aria-label={etichetta}
          placeholder={placeholder}
          enterKeyHint="done"
          className="min-h-9 min-w-0 flex-1 bg-transparent text-base text-testo outline-none placeholder:text-testo-tenue"
          value={titolo}
          // readOnly e non disabled: il fuoco resta nel campo, pronto per la prossima.
          readOnly={invio}
          onChange={(e) => setTitolo(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              e.preventDefault()
              setTitolo('')
              setErrore(null)
            }
          }}
        />
        {titolo.trim() && (
          <button
            type="submit"
            disabled={invio}
            className="grid size-8 shrink-0 place-items-center rounded-lg bg-salvia text-panna hover:bg-salvia-scura"
            aria-label="Aggiungi"
          >
            <Plus className="size-4" aria-hidden="true" />
          </button>
        )}
      </label>
      {errore && (
        <p className="px-3 pb-2 text-sm text-pericolo" role="alert">
          {errore}
        </p>
      )}
    </form>
  )
}

import { useState } from 'react'
import { Pencil } from 'lucide-react'
import { titoloSenzaTag } from '../dominio/tag'
import type { Attivita } from '../dominio/tipi'
import { EditorMarkdown } from './EditorMarkdown'
import { Markdown } from './Markdown'
import { Modale } from './Modale'

interface Props {
  attivita: Attivita
  onSalva: (descrizione: string | null) => void
  onChiudi: () => void
}

const pulsante = 'flex min-h-11 items-center gap-1.5 rounded-[11px] px-4 font-semibold'

/**
 * La descrizione di un'attività (doc/08-interfaccia.md, "Modale descrizione"):
 * il Markdown reso, con le checklist; "Modifica" apre il testo. Se è vuota si
 * apre direttamente in modifica. Cmd/Ctrl+Invio salva.
 */
export function ModaleDescrizione({ attivita, onSalva, onChiudi }: Props) {
  const descrizione = attivita.descrizione?.trim() ? attivita.descrizione : null
  const [bozza, setBozza] = useState<string | null>(descrizione === null ? '' : null)

  const salva = () => {
    if (bozza === null) return
    const nuova = bozza.trim() ? bozza.trimEnd() : null
    if (nuova !== descrizione) onSalva(nuova)
    if (nuova === null) onChiudi()
    else setBozza(null)
  }

  const annulla = () => {
    if (descrizione === null) onChiudi()
    else setBozza(null)
  }

  return (
    <Modale
      titolo={titoloSenzaTag(attivita.titolo) || attivita.titolo}
      onChiudi={onChiudi}
      larga
      piede={
        bozza === null ? (
          <button type="button" className={`${pulsante} bg-salvia text-panna hover:bg-salvia-scura`} onClick={() => setBozza(descrizione ?? '')}>
            <Pencil className="size-4" aria-hidden="true" />
            Modifica
          </button>
        ) : (
          <>
            <button type="button" className={`${pulsante} text-testo-tenue hover:bg-fondo`} onClick={annulla}>
              Annulla
            </button>
            <button type="button" className={`${pulsante} bg-salvia text-panna hover:bg-salvia-scura`} onClick={salva}>
              Salva
            </button>
          </>
        )
      }
    >
      {bozza === null ? (
        <Markdown testo={descrizione ?? ''} />
      ) : (
        <EditorMarkdown
          etichetta="Descrizione"
          autoFocus
          righe={12}
          valore={bozza}
          onCambia={setBozza}
          onKeyDown={(e) => {
            if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
              e.preventDefault()
              salva()
            }
          }}
        />
      )}
    </Modale>
  )
}

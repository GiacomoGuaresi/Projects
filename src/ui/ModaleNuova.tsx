import { useId, useState, type FormEvent } from 'react'
import { normalizzaProgetto, type ProgettoInUso } from '../dominio/progetto'
import type { Attivita, NuovaAttivita, Stato } from '../dominio/tipi'
import { EditorMarkdown } from './EditorMarkdown'
import { InputProgetto } from './InputProgetto'
import { AiutoTag, InputTitolo } from './InputTitolo'
import { Modale } from './Modale'
import { SceltaPriorita, SceltaStato } from './Scelte'

interface Props {
  progetti: readonly ProgettoInUso[]
  onCrea: (nuova: NuovaAttivita) => Promise<Attivita>
  onChiudi: () => void
}

const campo =
  'min-h-11 w-full rounded-[11px] border border-bordo bg-white px-3 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia'

/**
 * Il modale "Nuova attività" (doc/08-interfaccia.md): titolo obbligatorio con
 * i suggerimenti dei tag, progetto facoltativo con i progetti già usati, stato,
 * priorità e descrizione in Markdown. Invio nel titolo crea. A schermo intero
 * su mobile.
 */
export function ModaleNuova({ progetti, onCrea, onChiudi }: Props) {
  const [titolo, setTitolo] = useState('')
  const [progetto, setProgetto] = useState('')
  const [stato, setStato] = useState<Stato>('da_fare')
  const [priorita, setPriorita] = useState(3)
  const [descrizione, setDescrizione] = useState('')
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const id = useId()

  const invia = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!titolo.trim() || inCorso) return
    setInCorso(true)
    setErrore(null)
    try {
      await onCrea({
        titolo: titolo.trim(),
        descrizione: descrizione.trim() ? descrizione.trimEnd() : null,
        progetto: normalizzaProgetto(progetto, progetti),
        stato,
        priorita,
      })
      onChiudi()
    } catch (e) {
      setErrore((e as Error).message)
      setInCorso(false)
    }
  }

  return (
    <Modale
      titolo="Nuova attività"
      onChiudi={onChiudi}
      schermoInteroMobile
      piede={
        <>
          <button
            type="button"
            className="min-h-11 rounded-[11px] px-4 font-semibold text-testo-tenue hover:bg-fondo"
            onClick={onChiudi}
          >
            Annulla
          </button>
          <button
            type="submit"
            form={id}
            disabled={!titolo.trim() || inCorso}
            className="min-h-11 rounded-[11px] bg-salvia px-4 font-semibold text-panna hover:bg-salvia-scura disabled:opacity-50"
          >
            {inCorso ? 'Creo…' : 'Crea'}
          </button>
        </>
      }
    >
      <form id={id} className="flex flex-col gap-4" onSubmit={invia}>
        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-testo-tenue" htmlFor={`${id}-titolo`}>
            Titolo
          </label>
          <InputTitolo id={`${id}-titolo`} className={campo} autoFocus valore={titolo} onCambia={setTitolo} />
          <AiutoTag />
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-testo-tenue" htmlFor={`${id}-progetto`}>
            Progetto <span className="font-normal">(facoltativo)</span>
          </label>
          <InputProgetto
            id={`${id}-progetto`}
            className={campo}
            valore={progetto}
            onCambia={setProgetto}
            progetti={progetti}
          />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-testo-tenue">Stato</span>
          <SceltaStato valore={stato} onScegli={setStato} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-testo-tenue">Priorità</span>
          <SceltaPriorita valore={priorita} onScegli={setPriorita} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-testo-tenue">
            Descrizione <span className="font-normal">(facoltativa)</span>
          </span>
          <EditorMarkdown etichetta="Descrizione" righe={5} valore={descrizione} onCambia={setDescrizione} />
        </div>

        {errore && (
          <p className="text-pericolo" role="alert">
            {errore}
          </p>
        )}
      </form>
    </Modale>
  )
}

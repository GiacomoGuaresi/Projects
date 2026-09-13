import { useId, useRef, useState, type FormEvent } from 'react'
import { normalizzaProgetto, type ProgettoInUso } from '../dominio/progetto'
import { TAG, trovaTag, pezziTitolo } from '../dominio/tag'
import type { Attivita, NuovaAttivita, Stato } from '../dominio/tipi'
import { Modale } from './Modale'
import { SceltaPriorita, SceltaStato } from './Scelte'
import { TitoloConTag } from './TitoloConTag'

interface Props {
  progetti: readonly ProgettoInUso[]
  onCrea: (nuova: NuovaAttivita) => Promise<Attivita>
  onChiudi: () => void
}

const campo =
  'min-h-11 w-full rounded-[11px] border border-bordo bg-white px-3 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia'

/**
 * Il modale "Nuova attività" (doc/08-interfaccia.md): titolo obbligatorio con
 * i tag disponibili, progetto facoltativo con i progetti già usati, stato e
 * priorità. Invio crea. A schermo intero su mobile.
 *
 * La descrizione arriva con lo step 2.10 (doc/07-roadmap.md).
 */
export function ModaleNuova({ progetti, onCrea, onChiudi }: Props) {
  const [titolo, setTitolo] = useState('')
  const [progetto, setProgetto] = useState('')
  const [stato, setStato] = useState<Stato>('da_fare')
  const [priorita, setPriorita] = useState(3)
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const campoTitolo = useRef<HTMLInputElement>(null)
  const id = useId()

  const invia = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!titolo.trim() || inCorso) return
    setInCorso(true)
    setErrore(null)
    try {
      await onCrea({
        titolo: titolo.trim(),
        descrizione: null,
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

  /** Un tocco sul tag lo mette in testa al titolo, se non c'è già. */
  const aggiungiTag = (nome: string) => {
    const presente = pezziTitolo(titolo).some((p) => p.tipo === 'tag' && trovaTag(p.nome)?.nome === nome)
    if (!presente) setTitolo(`<${nome}> ${titolo.trimStart()}`)
    campoTitolo.current?.focus()
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
          <input
            id={`${id}-titolo`}
            ref={campoTitolo}
            className={campo}
            autoFocus
            required
            value={titolo}
            onChange={(e) => setTitolo(e.target.value)}
          />
          <div className="flex flex-wrap items-center gap-1.5 text-xs text-testo-tenue">
            Tag:
            {TAG.filter((tag) => !tag.riservato).map((tag) => (
              <button
                key={tag.nome}
                type="button"
                title={tag.uso}
                className="rounded-full hover:opacity-80"
                onClick={() => aggiungiTag(tag.nome)}
              >
                <TitoloConTag titolo={`<${tag.nome}>`} />
              </button>
            ))}
          </div>
        </div>

        <div className="flex flex-col gap-1.5">
          <label className="text-xs text-testo-tenue" htmlFor={`${id}-progetto`}>
            Progetto <span className="font-normal">(facoltativo)</span>
          </label>
          <input
            id={`${id}-progetto`}
            className={campo}
            list={`${id}-progetti`}
            autoComplete="off"
            value={progetto}
            onChange={(e) => setProgetto(e.target.value)}
          />
          <datalist id={`${id}-progetti`}>
            {progetti.map((p) => (
              <option key={p.progetto} value={p.progetto} />
            ))}
          </datalist>
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-testo-tenue">Stato</span>
          <SceltaStato valore={stato} onScegli={setStato} />
        </div>

        <div className="flex flex-col gap-1.5">
          <span className="text-xs text-testo-tenue">Priorità</span>
          <SceltaPriorita valore={priorita} onScegli={setPriorita} />
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

import { useEffect, useRef, useState } from 'react'
import { Send } from 'lucide-react'
import { diario } from '../dati'
import { titoloSenzaTag } from '../dominio/tag'
import type { Attivita, VoceDiario } from '../dominio/tipi'
import { Markdown } from './Markdown'
import { Modale } from './Modale'

interface Props {
  attivita: Attivita
  /** Per evidenziare l'icona del diario nell'elenco. */
  onVoceAggiunta: () => void
  onChiudi: () => void
}

type StatoVoci =
  | { fase: 'caricamento' }
  | { fase: 'errore'; messaggio: string }
  | { fase: 'pronto'; voci: VoceDiario[] }

/** Data e ora in italiano: "13 set 2026, 10:42". */
export function dataOra(iso: string): string {
  return new Date(iso).toLocaleString('it-IT', {
    day: 'numeric',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
}

/**
 * Il diario di un'attività (doc/08-interfaccia.md, "Modale diario"): le voci in
 * ordine, la più recente in basso ed evidenziata, le precedenti attenuate; in
 * fondo il testo per aggiungerne una, Cmd/Ctrl+Invio invia.
 *
 * Modifica ed eliminazione delle voci arrivano con lo step 2.12.
 */
export function ModaleDiario({ attivita, onVoceAggiunta, onChiudi }: Props) {
  const [stato, setStato] = useState<StatoVoci>({ fase: 'caricamento' })
  const [testo, setTesto] = useState('')
  const [invio, setInvio] = useState(false)
  const [erroreInvio, setErroreInvio] = useState<string | null>(null)
  const fondo = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let vivo = true
    diario()
      .voci(attivita.id)
      .then((voci) => {
        if (vivo) setStato({ fase: 'pronto', voci })
      })
      .catch((errore: Error) => {
        if (vivo) setStato({ fase: 'errore', messaggio: errore.message })
      })
    return () => {
      vivo = false
    }
  }, [attivita.id])

  // La voce più recente è in fondo: la si porta in vista.
  const quante = stato.fase === 'pronto' ? stato.voci.length : 0
  useEffect(() => {
    fondo.current?.scrollIntoView({ block: 'end' })
  }, [quante])

  const invia = async () => {
    const pulito = testo.trim() ? testo.trimEnd() : ''
    if (!pulito || invio || stato.fase !== 'pronto') return
    setInvio(true)
    setErroreInvio(null)
    try {
      const voce = await diario().aggiungi(attivita.id, pulito)
      setStato((prima) => (prima.fase === 'pronto' ? { ...prima, voci: [...prima.voci, voce] } : prima))
      setTesto('')
      onVoceAggiunta()
    } catch (errore) {
      setErroreInvio((errore as Error).message)
    } finally {
      setInvio(false)
      campo.current?.focus()
    }
  }

  return (
    <Modale
      titolo={`Diario · ${titoloSenzaTag(attivita.titolo) || attivita.titolo}`}
      onChiudi={onChiudi}
      larga
      piede={
        <div className="flex w-full flex-col gap-1">
          <div className="flex items-end gap-2">
            <textarea
              ref={campo}
              aria-label="Nuova voce di diario"
              placeholder="Cosa è stato fatto?"
              rows={3}
              value={testo}
              disabled={stato.fase !== 'pronto'}
              onChange={(e) => setTesto(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
                  e.preventDefault()
                  void invia()
                }
              }}
              className="min-w-0 flex-1 resize-y rounded-[11px] border border-bordo bg-white px-3 py-2 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia"
            />
            <button
              type="button"
              aria-label="Invia"
              title="Invia (Cmd/Ctrl+Invio)"
              disabled={!testo.trim() || invio || stato.fase !== 'pronto'}
              onClick={() => void invia()}
              className="grid size-11 shrink-0 place-items-center rounded-[11px] bg-salvia text-panna hover:bg-salvia-scura disabled:opacity-50"
            >
              <Send className="size-5" aria-hidden="true" />
            </button>
          </div>
          {erroreInvio ? (
            <p className="text-xs text-pericolo" role="alert">
              {erroreInvio}
            </p>
          ) : (
            <p className="text-xs text-testo-tenue">Markdown ammesso · Cmd/Ctrl+Invio per inviare</p>
          )}
        </div>
      }
    >
      {stato.fase === 'caricamento' && <p className="text-testo-tenue">Carico il diario…</p>}
      {stato.fase === 'errore' && (
        <p className="text-pericolo" role="alert">
          {stato.messaggio}
        </p>
      )}
      {stato.fase === 'pronto' &&
        (stato.voci.length === 0 ? (
          <p className="py-6 text-center text-testo-tenue">Ancora nessuna voce.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {stato.voci.map((voce, i) => {
              const ultima = i === stato.voci.length - 1
              return (
                <li
                  key={voce.id}
                  className={`rounded-[11px] border px-3 py-2 transition-opacity ${
                    ultima ? 'border-salvia-chiara bg-fondo shadow-sm' : 'border-bordo opacity-60 hover:opacity-100'
                  }`}
                >
                  <time className="mb-1 block text-xs text-testo-tenue" dateTime={voce.creata_il}>
                    {dataOra(voce.creata_il)}
                  </time>
                  <Markdown testo={voce.testo} />
                </li>
              )
            })}
          </ol>
        ))}
      <div ref={fondo} />
    </Modale>
  )
}

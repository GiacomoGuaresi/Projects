import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Pencil, Send, Trash2 } from 'lucide-react'
import { diario } from '../dati'
import { titoloSenzaTag } from '../dominio/tag'
import type { Attivita, VoceDiario } from '../dominio/tipi'
import { Conferma } from './Conferma'
import { Markdown } from './Markdown'
import { Modale } from './Modale'

interface Props {
  attivita: Attivita
  /** Il diario ha (o non ha più) voci: l'icona nell'elenco lo mostra. */
  onDiarioCambiato: (haVoci: boolean) => void
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

const areaTesto =
  'w-full resize-y rounded-[11px] border border-bordo bg-white px-3 py-2 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia'

/**
 * Il diario di un'attività (doc/08-interfaccia.md, "Modale diario"): le voci in
 * ordine, la più recente in basso ed evidenziata, le precedenti attenuate. Ogni
 * voce si modifica sul posto e si elimina con conferma; in fondo il testo per
 * aggiungerne una, Cmd/Ctrl+Invio invia.
 */
export function ModaleDiario({ attivita, onDiarioCambiato, onChiudi }: Props) {
  const [stato, setStato] = useState<StatoVoci>({ fase: 'caricamento' })
  const [testo, setTesto] = useState('')
  const [invio, setInvio] = useState(false)
  /** L'errore dell'ultima operazione (aggiunta, modifica, eliminazione). */
  const [errore, setErrore] = useState<string | null>(null)
  const [inModifica, setInModifica] = useState<{ id: number; testo: string } | null>(null)
  const [daEliminare, setDaEliminare] = useState<VoceDiario | null>(null)
  const [chiusuraDaConfermare, setChiusuraDaConfermare] = useState(false)
  const fondo = useRef<HTMLDivElement>(null)
  const campo = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    let vivo = true
    diario()
      .voci(attivita.id)
      .then((voci) => {
        if (vivo) setStato({ fase: 'pronto', voci })
      })
      .catch((e: Error) => {
        if (vivo) setStato({ fase: 'errore', messaggio: e.message })
      })
    return () => {
      vivo = false
    }
  }, [attivita.id])

  // Una voce nuova sta in fondo: la si porta in vista.
  const ultimaId = stato.fase === 'pronto' ? stato.voci.at(-1)?.id : undefined
  useEffect(() => {
    fondo.current?.scrollIntoView({ block: 'end' })
  }, [ultimaId])

  const voci = stato.fase === 'pronto' ? stato.voci : []
  const cambiaVoci = (cambia: (voci: VoceDiario[]) => VoceDiario[]) =>
    setStato((prima) => (prima.fase === 'pronto' ? { ...prima, voci: cambia(prima.voci) } : prima))

  const invia = async () => {
    const pulito = testo.trim() ? testo.trimEnd() : ''
    if (!pulito || invio || stato.fase !== 'pronto') return
    setInvio(true)
    setErrore(null)
    try {
      const voce = await diario().aggiungi(attivita.id, pulito)
      cambiaVoci((prima) => [...prima, voce])
      setTesto('')
      onDiarioCambiato(true)
    } catch (e) {
      setErrore((e as Error).message)
    } finally {
      setInvio(false)
      campo.current?.focus()
    }
  }

  const salvaModifica = async () => {
    if (!inModifica) return
    const pulito = inModifica.testo.trim() ? inModifica.testo.trimEnd() : ''
    const originale = voci.find((v) => v.id === inModifica.id)
    // Vuota non si salva: per toglierla c'è "elimina".
    if (!pulito) return
    setInModifica(null)
    if (!originale || pulito === originale.testo) return
    setErrore(null)
    try {
      const salvata = await diario().modifica(inModifica.id, pulito)
      cambiaVoci((prima) => prima.map((v) => (v.id === salvata.id ? salvata : v)))
    } catch (e) {
      setErrore((e as Error).message)
    }
  }

  const elimina = async (voce: VoceDiario) => {
    setDaEliminare(null)
    setErrore(null)
    try {
      await diario().elimina(voce.id)
      const rimaste = voci.filter((v) => v.id !== voce.id)
      cambiaVoci((prima) => prima.filter((v) => v.id !== voce.id))
      if (rimaste.length === 0) onDiarioCambiato(false)
    } catch (e) {
      setErrore((e as Error).message)
    }
  }

  // Testo scritto e non inviato, o una voce cambiata e non salvata: chiudere lo perde.
  const voceCambiata =
    inModifica !== null && inModifica.testo.trimEnd() !== voci.find((v) => v.id === inModifica.id)?.testo
  const nonSalvato = testo.trim() !== '' || voceCambiata
  const richiediChiusura = () => {
    if (nonSalvato) setChiusuraDaConfermare(true)
    else onChiudi()
  }

  const tastiModifica = (e: KeyboardEvent<HTMLTextAreaElement>) => {
    if (e.key === 'Enter' && (e.metaKey || e.ctrlKey)) {
      e.preventDefault()
      void salvaModifica()
    }
    if (e.key === 'Escape') {
      // Esc annulla la modifica, e non chiude il diario.
      e.preventDefault()
      e.stopPropagation()
      setInModifica(null)
    }
  }

  return (
    <Modale
      titolo={`Diario · ${titoloSenzaTag(attivita.titolo) || attivita.titolo}`}
      onChiudi={richiediChiusura}
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
              className={`${areaTesto} min-w-0 flex-1`}
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
          {errore ? (
            <p className="text-xs text-pericolo" role="alert">
              {errore}
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
        (voci.length === 0 ? (
          <p className="py-6 text-center text-testo-tenue">Ancora nessuna voce.</p>
        ) : (
          <ol className="flex flex-col gap-2">
            {voci.map((voce, i) => {
              const ultima = i === voci.length - 1
              const modifica = inModifica?.id === voce.id ? inModifica : null
              const modificata = new Date(voce.modificata_il).getTime() !== new Date(voce.creata_il).getTime()
              return (
                <li
                  key={voce.id}
                  className={`rounded-[11px] border px-3 py-2 transition-opacity ${
                    ultima ? 'border-salvia-chiara bg-fondo shadow-sm' : 'border-bordo'
                  } ${ultima || modifica ? '' : 'opacity-60 focus-within:opacity-100 hover:opacity-100'}`}
                >
                  <div className="mb-1 flex items-center gap-2">
                    <time className="flex-1 text-xs text-testo-tenue" dateTime={voce.creata_il}>
                      {dataOra(voce.creata_il)}
                      {modificata && (
                        <span title={`Modificata il ${dataOra(voce.modificata_il)}`}> · modificata</span>
                      )}
                    </time>
                    {!modifica && (
                      <>
                        <button
                          type="button"
                          aria-label="Modifica la voce"
                          title="Modifica"
                          className="grid size-8 place-items-center rounded-lg text-testo-tenue hover:bg-white"
                          onClick={() => setInModifica({ id: voce.id, testo: voce.testo })}
                        >
                          <Pencil className="size-4" aria-hidden="true" />
                        </button>
                        <button
                          type="button"
                          aria-label="Elimina la voce"
                          title="Elimina"
                          className="grid size-8 place-items-center rounded-lg text-testo-tenue hover:bg-white hover:text-pericolo"
                          onClick={() => setDaEliminare(voce)}
                        >
                          <Trash2 className="size-4" aria-hidden="true" />
                        </button>
                      </>
                    )}
                  </div>
                  {modifica ? (
                    <div className="flex flex-col gap-2">
                      <textarea
                        aria-label="Testo della voce"
                        autoFocus
                        rows={4}
                        value={modifica.testo}
                        onChange={(e) => setInModifica({ id: voce.id, testo: e.target.value })}
                        onKeyDown={tastiModifica}
                        className={areaTesto}
                      />
                      <div className="flex justify-end gap-2">
                        <button
                          type="button"
                          className="min-h-9 rounded-[11px] px-3 font-semibold text-testo-tenue hover:bg-white"
                          onClick={() => setInModifica(null)}
                        >
                          Annulla
                        </button>
                        <button
                          type="button"
                          disabled={!modifica.testo.trim()}
                          className="min-h-9 rounded-[11px] bg-salvia px-3 font-semibold text-panna hover:bg-salvia-scura disabled:opacity-50"
                          onClick={() => void salvaModifica()}
                        >
                          Salva
                        </button>
                      </div>
                    </div>
                  ) : (
                    <Markdown testo={voce.testo} />
                  )}
                </li>
              )
            })}
          </ol>
        ))}
      <div ref={fondo} />
      {daEliminare && (
        <Conferma
          titolo="Eliminare la voce?"
          conferma="Elimina"
          pericolo
          onAnnulla={() => setDaEliminare(null)}
          onConferma={() => void elimina(daEliminare)}
        >
          <p>
            La voce del <strong>{dataOra(daEliminare.creata_il)}</strong> sparisce dal diario, e non si può tornare
            indietro.
          </p>
        </Conferma>
      )}
      {chiusuraDaConfermare && (
        <Conferma
          titolo="Chiudere senza salvare?"
          conferma="Chiudi senza salvare"
          pericolo
          onAnnulla={() => setChiusuraDaConfermare(false)}
          onConferma={onChiudi}
        >
          <p>
            {testo.trim() && voceCambiata
              ? 'La nuova voce non è stata inviata e la modifica non è stata salvata: chiudendo si perdono.'
              : testo.trim()
                ? 'La nuova voce non è stata inviata: chiudendo si perde.'
                : 'La modifica alla voce non è stata salvata: chiudendo si perde.'}
          </p>
        </Conferma>
      )}
    </Modale>
  )
}

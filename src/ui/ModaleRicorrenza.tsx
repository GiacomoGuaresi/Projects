import { useId, useState, type FormEvent } from 'react'
import { Trash2 } from 'lucide-react'
import {
  daSalvare,
  descrivi,
  formattaGiorno,
  GIORNI_BREVI,
  giornoSettimanaDi,
  NOMI_UNITA,
  nomeGiorno,
  oggi,
  prossimeOccorrenze,
} from '../dominio/ricorrenze'
import { UNITA, type DatiRicorrenza, type Ricorrenza, type Unita } from '../dominio/tipi'
import { Conferma } from './Conferma'
import { Modale } from './Modale'

interface Props {
  /** Se manca, è una ricorrenza nuova. */
  ricorrenza?: Ricorrenza
  onSalva: (dati: DatiRicorrenza) => Promise<void>
  onElimina?: () => void
  onChiudi: () => void
}

const campo =
  'min-h-11 w-full rounded-[11px] border border-bordo bg-white px-3 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia'

/** Le scelte più comuni, a un tocco: impostano "ogni" e l'unità. */
const RAPIDE: { etichetta: string; ogni: number; unita: Unita }[] = [
  { etichetta: 'Ogni giorno', ogni: 1, unita: 'giorno' },
  { etichetta: 'Ogni settimana', ogni: 1, unita: 'settimana' },
  { etichetta: 'Ogni 2 settimane', ogni: 2, unita: 'settimana' },
  { etichetta: 'Ogni mese', ogni: 1, unita: 'mese' },
  { etichetta: 'Ogni anno', ogni: 1, unita: 'anno' },
]

/**
 * Il modale di una faccenda ricorrente (doc/08-interfaccia.md, "Faccende
 * ricorrenti"): titolo, "ogni N giorni / settimane / mesi / anni", i giorni
 * della settimana per le settimanali, da quando, e in pausa. Sotto, la regola a
 * parole e le prossime date, così si vede subito cosa succederà.
 */
export function ModaleRicorrenza({ ricorrenza, onSalva, onElimina, onChiudi }: Props) {
  const [titolo, setTitolo] = useState(ricorrenza?.titolo ?? '')
  const [ogni, setOgni] = useState(String(ricorrenza?.ogni ?? 1))
  const [unita, setUnita] = useState<Unita>(ricorrenza?.unita ?? 'settimana')
  const [inizio, setInizio] = useState(ricorrenza?.inizio ?? oggi())
  const [giorni, setGiorni] = useState<number[]>(ricorrenza?.giorni ?? [giornoSettimanaDi(inizio)])
  const [attiva, setAttiva] = useState(ricorrenza?.attiva ?? true)
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const id = useId()

  const numero = Number.parseInt(ogni, 10)
  const valida = titolo.trim() !== '' && numero >= 1 && numero <= 365 && inizio !== ''
  const dati: DatiRicorrenza = { titolo, unita, ogni: numero, giorni, inizio, attiva }
  const anteprima = valida ? daSalvare(dati, oggi(), ricorrenza?.ultima ?? null) : null
  const prossime = anteprima ? prossimeOccorrenze(anteprima, anteprima.prossima, 3) : []
  const { una, tante } = NOMI_UNITA[unita]

  const invia = async (evento: FormEvent) => {
    evento.preventDefault()
    if (!valida || inCorso) return
    setInCorso(true)
    setErrore(null)
    try {
      await onSalva(dati)
      onChiudi()
    } catch (e) {
      setErrore((e as Error).message)
      setInCorso(false)
    }
  }

  /** L'ultimo giorno scelto non si toglie: una settimanale ne ha almeno uno. */
  const cambiaGiorno = (g: number) =>
    setGiorni((prima) =>
      prima.includes(g) ? (prima.length > 1 ? prima.filter((x) => x !== g) : prima) : [...prima, g].sort((a, b) => a - b),
    )

  return (
    <>
      <Modale
        titolo={ricorrenza ? 'Faccenda ricorrente' : 'Nuova faccenda ricorrente'}
        onChiudi={onChiudi}
        schermoInteroMobile
        piede={
          <>
            {onElimina && (
              <button
                type="button"
                className="mr-auto flex min-h-11 items-center gap-1.5 rounded-[11px] px-3 font-semibold text-pericolo hover:bg-fondo"
                onClick={() => setEliminando(true)}
              >
                <Trash2 className="size-4" aria-hidden="true" />
                Elimina
              </button>
            )}
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
              disabled={!valida || inCorso}
              className="min-h-11 rounded-[11px] bg-salvia px-4 font-semibold text-panna hover:bg-salvia-scura disabled:opacity-50"
            >
              {inCorso ? 'Salvo…' : ricorrenza ? 'Salva' : 'Crea'}
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
              className={campo}
              autoFocus={!ricorrenza}
              enterKeyHint="done"
              placeholder="Es. Pulire il bagno"
              value={titolo}
              onChange={(e) => setTitolo(e.target.value)}
            />
          </div>

          <div className="flex flex-col gap-1.5">
            <span className="text-xs text-testo-tenue">Ripeti</span>
            <div className="flex flex-wrap gap-1.5">
              {RAPIDE.map((r) => {
                const scelta = r.unita === unita && r.ogni === numero
                return (
                  <button
                    key={r.etichetta}
                    type="button"
                    aria-pressed={scelta}
                    className={`min-h-9 rounded-full border px-3 text-sm ${
                      scelta
                        ? 'border-transparent bg-pastello font-semibold text-salvia-scura'
                        : 'border-bordo bg-white text-testo-tenue hover:bg-fondo'
                    }`}
                    onClick={() => {
                      setOgni(String(r.ogni))
                      setUnita(r.unita)
                    }}
                  >
                    {r.etichetta}
                  </button>
                )
              })}
            </div>
            <div className="flex items-center gap-2">
              <label htmlFor={`${id}-ogni`}>Ogni</label>
              <input
                id={`${id}-ogni`}
                type="number"
                inputMode="numeric"
                min={1}
                max={365}
                className={`${campo} w-20 text-center`}
                value={ogni}
                onChange={(e) => setOgni(e.target.value)}
              />
              <select
                aria-label="Unità"
                className={`${campo} w-auto flex-1`}
                value={unita}
                onChange={(e) => setUnita(e.target.value as Unita)}
              >
                {UNITA.map((u) => (
                  <option key={u} value={u}>
                    {numero === 1 ? NOMI_UNITA[u].una : NOMI_UNITA[u].tante}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {unita === 'settimana' && (
            <div className="flex flex-col gap-1.5">
              <span className="text-xs text-testo-tenue">Nei giorni</span>
              <div className="flex gap-1" role="group" aria-label="Giorni della settimana">
                {GIORNI_BREVI.map((breve, i) => {
                  const g = i + 1
                  const scelto = giorni.includes(g)
                  return (
                    <button
                      key={g}
                      type="button"
                      aria-pressed={scelto}
                      aria-label={nomeGiorno(g)}
                      title={nomeGiorno(g)}
                      className={`grid size-10 place-items-center rounded-full border text-sm ${
                        scelto
                          ? 'border-transparent bg-salvia font-semibold text-panna'
                          : 'border-bordo bg-white text-testo-tenue hover:bg-fondo'
                      }`}
                      onClick={() => cambiaGiorno(g)}
                    >
                      {breve}
                    </button>
                  )
                })}
              </div>
            </div>
          )}

          <div className="flex flex-col gap-1.5">
            <label className="text-xs text-testo-tenue" htmlFor={`${id}-inizio`}>
              A partire dal
            </label>
            <input
              id={`${id}-inizio`}
              type="date"
              className={campo}
              value={inizio}
              onChange={(e) => setInizio(e.target.value)}
            />
            {(unita === 'mese' || unita === 'anno') && (
              <p className="text-xs text-testo-tenue">
                Il giorno {unita === 'anno' ? 'e il mese vengono' : 'viene'} da questa data.
              </p>
            )}
          </div>

          {ricorrenza && (
            <label className="flex min-h-11 items-center gap-3">
              <input
                type="checkbox"
                className="size-5 accent-salvia"
                checked={!attiva}
                onChange={(e) => setAttiva(!e.target.checked)}
              />
              In pausa <span className="text-sm text-testo-tenue">(non aggiunge faccende finché non la riattivi)</span>
            </label>
          )}

          {anteprima && (
            <div className="rounded-[11px] bg-fondo px-3 py-2 text-sm" aria-live="polite">
              <p className="font-semibold">{descrivi(anteprima)}</p>
              <p className="text-testo-tenue">
                {attiva
                  ? `Prossime: ${prossime.map((g) => formattaGiorno(g, oggi())).join(', ')}`
                  : 'In pausa: non aggiunge faccende.'}
              </p>
            </div>
          )}
          {!valida && numero > 365 && (
            <p className="text-sm text-pericolo">Al massimo ogni 365 {numero === 1 ? una : tante}.</p>
          )}

          {errore && (
            <p className="text-pericolo" role="alert">
              {errore}
            </p>
          )}
        </form>
      </Modale>
      {eliminando && onElimina && (
        <Conferma
          titolo="Eliminare la ricorrenza?"
          conferma="Elimina"
          pericolo
          onAnnulla={() => setEliminando(false)}
          onConferma={() => {
            onElimina()
            onChiudi()
          }}
        >
          <p>
            <strong>{ricorrenza?.titolo}</strong> non verrà più aggiunta alle faccende. Quella già in elenco resta.
          </p>
        </Conferma>
      )}
    </>
  )
}

import { useId, useState, type FormEvent, type ReactNode } from 'react'
import { ChevronRight, Minus, Plus, Trash2 } from 'lucide-react'
import {
  daSalvare,
  descrivi,
  formattaGiorno,
  GIORNI_BREVI,
  NOMI_MESI,
  NOMI_UNITA,
  nomeGiorno,
  oggi,
  primeVolte,
  prossimeOccorrenze,
  regolaDa,
  scelteDa,
  ULTIMO,
  type Scelte,
} from '../dominio/ricorrenze'
import { UNITA, type DatiRicorrenza, type Ricorrenza, type Unita } from '../dominio/tipi'
import { Conferma } from './Conferma'
import { Modale } from './Modale'

interface Props {
  /** Se manca, è una ricorrenza nuova: il modale diventa un wizard. */
  ricorrenza?: Ricorrenza
  onSalva: (dati: DatiRicorrenza) => Promise<void>
  onElimina?: () => void
  onChiudi: () => void
}

type Passo = 'cosa' | 'frequenza' | 'quando' | 'riepilogo'

/** Le frequenze più comuni, a un tocco; per il resto "Personalizzata". */
const RAPIDE: { etichetta: string; aiuto: string; ogni: number; unita: Unita }[] = [
  { etichetta: 'Ogni giorno', aiuto: 'tutti i giorni', ogni: 1, unita: 'giorno' },
  { etichetta: 'Ogni settimana', aiuto: 'nei giorni che scegli', ogni: 1, unita: 'settimana' },
  { etichetta: 'Ogni 2 settimane', aiuto: 'a settimane alterne', ogni: 2, unita: 'settimana' },
  { etichetta: 'Ogni mese', aiuto: 'in un giorno del mese', ogni: 1, unita: 'mese' },
  { etichetta: 'Ogni anno', aiuto: 'in un giorno dell’anno', ogni: 1, unita: 'anno' },
]

const MESI_BREVI = NOMI_MESI.map((m) => m.slice(0, 3))

const campo =
  'min-h-11 w-full rounded-[11px] border border-bordo bg-white px-3 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia'

/** Un pulsante che si accende quando è scelto: chip, giorni, mesi. */
function scelta(acceso: boolean, forma = 'rounded-full px-3') {
  return `min-h-10 border text-sm touch-manipulation ${forma} ${
    acceso ? 'border-transparent bg-salvia font-semibold text-panna' : 'border-bordo bg-white hover:bg-fondo'
  }`
}

function rapidaDi(s: Scelte) {
  return RAPIDE.find((r) => r.unita === s.unita && r.ogni === s.ogni)
}

/** Con "ogni N" si propone come prima volta la data più vicina. */
function conPrimaVicina(s: Scelte, giorno: string): Scelte {
  const date = primeVolte(s, giorno)
  const vicina = [...date].sort()[0]
  return { ...s, sfasamento: date.indexOf(vicina) }
}

/**
 * Il modale di una faccenda ricorrente (doc/08-interfaccia.md, "Faccende
 * ricorrenti").
 *
 * Nuova: un wizard a passi, una domanda per volta — cosa, ogni quanto, quando,
 * riepilogo. Le frequenze comuni passano avanti da sole al tocco; "quando" si
 * salta se non c'è niente da scegliere (ogni giorno).
 * In modifica: le stesse sezioni tutte insieme, più la pausa e l'eliminazione.
 */
export function ModaleRicorrenza({ ricorrenza, onSalva, onElimina, onChiudi }: Props) {
  const [giorno] = useState(oggi)
  const [titolo, setTitolo] = useState(ricorrenza?.titolo ?? '')
  const [scelte, setScelte] = useState(() => {
    const iniziali = scelteDa(ricorrenza ?? null, giorno)
    return ricorrenza ? iniziali : conPrimaVicina(iniziali, giorno)
  })
  const [ogniTesto, setOgniTesto] = useState(String(scelte.ogni))
  const [personalizzata, setPersonalizzata] = useState(ricorrenza !== undefined && !rapidaDi(scelte))
  const [attiva, setAttiva] = useState(ricorrenza?.attiva ?? true)
  const [passo, setPasso] = useState(0)
  const [inCorso, setInCorso] = useState(false)
  const [errore, setErrore] = useState<string | null>(null)
  const [eliminando, setEliminando] = useState(false)
  const id = useId()

  const wizard = ricorrenza === undefined
  const serveQuando = scelte.unita !== 'giorno' || scelte.ogni > 1
  const passi: Passo[] = ['cosa', 'frequenza', ...(serveQuando ? (['quando'] as const) : []), 'riepilogo']
  const attuale = passi[Math.min(passo, passi.length - 1)]

  const ogniValido = scelte.ogni >= 1 && scelte.ogni <= 365 && String(scelte.ogni) === ogniTesto.trim()
  const valido = titolo.trim() !== '' && ogniValido
  const passoValido = attuale === 'cosa' ? titolo.trim() !== '' : attuale === 'frequenza' ? ogniValido : valido

  const regola = regolaDa(scelte, giorno)
  const dati: DatiRicorrenza = { titolo, ...regola, attiva }
  const anteprima = daSalvare(dati, giorno, ricorrenza?.ultima ?? null)
  const prossime = prossimeOccorrenze(anteprima, anteprima.prossima, 3)

  /** Ogni cambio della regola riparte dalla prima volta più vicina. */
  const cambia = (campi: Partial<Scelte>) => setScelte((prima) => conPrimaVicina({ ...prima, ...campi }, giorno))

  const scegliRapida = (r: (typeof RAPIDE)[number]) => {
    setPersonalizzata(false)
    setOgniTesto(String(r.ogni))
    cambia({ ogni: r.ogni, unita: r.unita })
    if (wizard) setPasso((p) => p + 1)
  }

  const cambiaOgni = (testo: string) => {
    setOgniTesto(testo)
    const n = Number.parseInt(testo, 10)
    if (n >= 1 && n <= 365) cambia({ ogni: n })
  }

  const salva = async () => {
    if (!valido || inCorso) return
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

  const invia = (evento: FormEvent) => {
    evento.preventDefault()
    if (!passoValido) return
    if (wizard && attuale !== 'riepilogo') setPasso((p) => p + 1)
    else void salva()
  }

  // Le sezioni ------------------------------------------------------------------

  const sezioneCosa = (
    <input
      id={`${id}-titolo`}
      className={campo}
      autoFocus={wizard}
      enterKeyHint={wizard ? 'next' : 'done'}
      placeholder="Es. Pulire il bagno"
      value={titolo}
      onChange={(e) => setTitolo(e.target.value)}
    />
  )

  const controlliPersonalizzata = (
    <div className="flex flex-col gap-3 rounded-[11px] bg-fondo p-3">
      <div className="flex items-center gap-2">
        <label htmlFor={`${id}-ogni`}>Ogni</label>
        <button
          type="button"
          aria-label="Meno"
          disabled={scelte.ogni <= 1}
          className="grid size-11 place-items-center rounded-[11px] border border-bordo bg-white hover:bg-fondo disabled:opacity-40"
          onClick={() => cambiaOgni(String(scelte.ogni - 1))}
        >
          <Minus className="size-4" aria-hidden="true" />
        </button>
        <input
          id={`${id}-ogni`}
          type="number"
          inputMode="numeric"
          min={1}
          max={365}
          className="min-h-11 w-16 rounded-[11px] border border-bordo bg-white text-center focus:outline-2 focus:-outline-offset-1 focus:outline-salvia"
          value={ogniTesto}
          onChange={(e) => cambiaOgni(e.target.value)}
        />
        <button
          type="button"
          aria-label="Più"
          disabled={scelte.ogni >= 365}
          className="grid size-11 place-items-center rounded-[11px] border border-bordo bg-white hover:bg-fondo disabled:opacity-40"
          onClick={() => cambiaOgni(String(scelte.ogni + 1))}
        >
          <Plus className="size-4" aria-hidden="true" />
        </button>
      </div>
      <div className="grid grid-cols-4 gap-1" role="radiogroup" aria-label="Unità">
        {UNITA.map((u) => (
          <button
            key={u}
            type="button"
            role="radio"
            aria-checked={scelte.unita === u}
            className={scelta(scelte.unita === u, 'rounded-[11px] px-1')}
            onClick={() => cambia({ unita: u })}
          >
            {scelte.ogni === 1 ? NOMI_UNITA[u].una : NOMI_UNITA[u].tante}
          </button>
        ))}
      </div>
      {!ogniValido && <p className="text-sm text-pericolo">Scrivi un numero da 1 a 365.</p>}
    </div>
  )

  // Nel wizard: righe grandi, e la scelta passa avanti. In modifica: chip.
  const sezioneFrequenza = wizard ? (
    <div className="flex flex-col gap-2">
      <ul className="flex flex-col gap-1.5" role="radiogroup" aria-label="Ogni quanto">
        {RAPIDE.map((r) => {
          const acceso = !personalizzata && rapidaDi(scelte) === r
          return (
            <li key={r.etichetta}>
              <button
                type="button"
                role="radio"
                aria-checked={acceso}
                className={`flex min-h-13 w-full items-center gap-3 rounded-[11px] border px-3 text-left ${
                  acceso ? 'border-salvia bg-pastello' : 'border-bordo bg-white hover:bg-fondo'
                }`}
                onClick={() => scegliRapida(r)}
              >
                <span className="flex-1">
                  <span className="block font-semibold">{r.etichetta}</span>
                  <span className="block text-sm text-testo-tenue">{r.aiuto}</span>
                </span>
                <ChevronRight className="size-4 text-testo-tenue" aria-hidden="true" />
              </button>
            </li>
          )
        })}
        <li>
          <button
            type="button"
            role="radio"
            aria-checked={personalizzata}
            className={`flex min-h-13 w-full items-center gap-3 rounded-[11px] border px-3 text-left ${
              personalizzata ? 'border-salvia bg-pastello' : 'border-bordo bg-white hover:bg-fondo'
            }`}
            onClick={() => setPersonalizzata(true)}
          >
            <span className="flex-1">
              <span className="block font-semibold">Personalizzata</span>
              <span className="block text-sm text-testo-tenue">ogni 3 giorni, ogni 6 mesi…</span>
            </span>
          </button>
        </li>
      </ul>
      {personalizzata && controlliPersonalizzata}
    </div>
  ) : (
    <div className="flex flex-col gap-2">
      <div className="flex flex-wrap gap-1.5">
        {RAPIDE.map((r) => (
          <button
            key={r.etichetta}
            type="button"
            aria-pressed={!personalizzata && rapidaDi(scelte) === r}
            className={scelta(!personalizzata && rapidaDi(scelte) === r)}
            onClick={() => scegliRapida(r)}
          >
            {r.etichetta}
          </button>
        ))}
        <button
          type="button"
          aria-pressed={personalizzata}
          className={scelta(personalizzata)}
          onClick={() => setPersonalizzata(true)}
        >
          Personalizzata
        </button>
      </div>
      {personalizzata && controlliPersonalizzata}
    </div>
  )

  const giorniSettimana = (
    <div className="flex flex-col gap-2">
      <div className="grid grid-cols-7 gap-1" role="group" aria-label="Giorni della settimana">
        {GIORNI_BREVI.map((breve, i) => {
          const g = i + 1
          const acceso = scelte.giorni.includes(g)
          return (
            <button
              key={g}
              type="button"
              aria-pressed={acceso}
              aria-label={nomeGiorno(g)}
              title={nomeGiorno(g)}
              className={scelta(acceso, 'aspect-square rounded-full')}
              onClick={() =>
                // L'ultimo giorno scelto non si toglie: una settimanale ne ha almeno uno.
                cambia({
                  giorni: acceso
                    ? scelte.giorni.length > 1
                      ? scelte.giorni.filter((x) => x !== g)
                      : scelte.giorni
                    : [...scelte.giorni, g].sort((a, b) => a - b),
                })
              }
            >
              {breve}
            </button>
          )
        })}
      </div>
      <div className="flex flex-wrap gap-1.5">
        {[
          { etichetta: 'Lun–ven', giorni: [1, 2, 3, 4, 5] },
          { etichetta: 'Weekend', giorni: [6, 7] },
          { etichetta: 'Tutti', giorni: [1, 2, 3, 4, 5, 6, 7] },
        ].map((r) => (
          <button
            key={r.etichetta}
            type="button"
            className="min-h-9 rounded-full border border-bordo bg-white px-3 text-sm text-testo-tenue hover:bg-fondo"
            onClick={() => cambia({ giorni: r.giorni })}
          >
            {r.etichetta}
          </button>
        ))}
      </div>
    </div>
  )

  const giorniMese = (
    <div className="grid grid-cols-7 gap-1" role="radiogroup" aria-label="Giorno del mese">
      {Array.from({ length: 30 }, (_, i) => i + 1).map((g) => (
        <button
          key={g}
          type="button"
          role="radio"
          aria-checked={scelte.giornoMese === g}
          className={scelta(scelte.giornoMese === g, 'rounded-[11px] px-0')}
          onClick={() => cambia({ giornoMese: g })}
        >
          {g}
        </button>
      ))}
      <button
        type="button"
        role="radio"
        aria-checked={scelte.giornoMese === ULTIMO}
        className={`col-span-5 ${scelta(scelte.giornoMese === ULTIMO, 'rounded-[11px] px-2')}`}
        onClick={() => cambia({ giornoMese: ULTIMO })}
      >
        L’ultimo del mese
      </button>
    </div>
  )

  const giorniNelMeseScelto = scelte.mese === 2 ? 29 : new Date(Date.UTC(2001, scelte.mese, 0)).getUTCDate()
  const giornoAnno = (
    <div className="flex flex-col gap-3">
      <div className="grid grid-cols-4 gap-1 sm:grid-cols-6" role="radiogroup" aria-label="Mese">
        {MESI_BREVI.map((breve, i) => (
          <button
            key={breve}
            type="button"
            role="radio"
            aria-checked={scelte.mese === i + 1}
            aria-label={NOMI_MESI[i]}
            className={scelta(scelte.mese === i + 1, 'rounded-[11px] px-1 capitalize')}
            onClick={() => {
              const n = i === 1 ? 29 : new Date(Date.UTC(2001, i + 1, 0)).getUTCDate()
              cambia({ mese: i + 1, giornoMese: Math.min(scelte.giornoMese, n) })
            }}
          >
            {breve}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-7 gap-1" role="radiogroup" aria-label="Giorno">
        {Array.from({ length: giorniNelMeseScelto }, (_, i) => i + 1).map((g) => (
          <button
            key={g}
            type="button"
            role="radio"
            aria-checked={scelte.giornoMese === g}
            className={scelta(scelte.giornoMese === g, 'rounded-[11px] px-0')}
            onClick={() => cambia({ giornoMese: g })}
          >
            {g}
          </button>
        ))}
      </div>
    </div>
  )

  // Con "ogni N" si sceglie quale delle prossime N date è la prima; in ordine di data.
  const prime = primeVolte(scelte, giorno)
    .map((data, k) => ({ data, k }))
    .sort((a, b) => a.data.localeCompare(b.data))
  const primaVolta = scelte.ogni > 1 && (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold">La prima volta</span>
      <div className="flex flex-wrap gap-1.5" role="radiogroup" aria-label="La prima volta">
        {prime.map(({ data, k }) => (
          <button
            key={k}
            type="button"
            role="radio"
            aria-checked={scelte.sfasamento === k}
            className={scelta(scelte.sfasamento === k)}
            onClick={() => setScelte((prima) => ({ ...prima, sfasamento: k }))}
          >
            {formattaGiorno(data, giorno)}
          </button>
        ))}
      </div>
    </div>
  )

  const sezioneQuando = (
    <div className="flex flex-col gap-4">
      {scelte.unita === 'settimana' && giorniSettimana}
      {scelte.unita === 'mese' && giorniMese}
      {scelte.unita === 'anno' && giornoAnno}
      {primaVolta}
    </div>
  )

  const riepilogo = (
    <div className="flex flex-col gap-1 rounded-[11px] bg-fondo px-3 py-2.5" aria-live="polite">
      {wizard && <p className="text-lg font-semibold break-words">{titolo.trim()}</p>}
      <p className="font-semibold">{descrivi(regola)}</p>
      <p className="text-sm text-testo-tenue">
        {attiva ? (
          <>
            {wizard ? 'La prima volta' : 'La prossima'}: <strong>{formattaGiorno(prossime[0], giorno)}</strong>, poi{' '}
            {prossime
              .slice(1)
              .map((g) => formattaGiorno(g, giorno))
              .join(', ')}
            …
          </>
        ) : (
          'In pausa: non aggiunge faccende.'
        )}
      </p>
    </div>
  )

  // Il modale ---------------------------------------------------------------------

  const domande: Record<Passo, { titolo: string; aiuto?: string; contenuto: ReactNode }> = {
    cosa: { titolo: 'Cosa c’è da fare?', contenuto: sezioneCosa },
    frequenza: { titolo: 'Ogni quanto?', contenuto: sezioneFrequenza },
    quando: {
      titolo:
        scelte.unita === 'settimana'
          ? 'In quali giorni?'
          : scelte.unita === 'mese'
            ? 'Che giorno del mese?'
            : scelte.unita === 'anno'
              ? 'Che giorno dell’anno?'
              : 'Quando si comincia?',
      contenuto: sezioneQuando,
    },
    riepilogo: {
      titolo: 'Tutto giusto?',
      aiuto: 'Arrivato il giorno, la faccenda compare da sola nell’elenco.',
      contenuto: riepilogo,
    },
  }

  const secondario = 'min-h-11 rounded-[11px] px-4 font-semibold text-testo-tenue hover:bg-fondo'
  const primario =
    'min-h-11 rounded-[11px] bg-salvia px-4 font-semibold text-panna hover:bg-salvia-scura disabled:opacity-50'

  const piede = wizard ? (
    <>
      <button
        type="button"
        className={`mr-auto ${secondario}`}
        onClick={() => (passo === 0 ? onChiudi() : setPasso((p) => Math.min(p, passi.length - 1) - 1))}
      >
        {passo === 0 ? 'Annulla' : 'Indietro'}
      </button>
      <button type="submit" form={id} disabled={!passoValido || inCorso} className={primario}>
        {attuale === 'riepilogo' ? (inCorso ? 'Creo…' : 'Crea') : 'Avanti'}
      </button>
    </>
  ) : (
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
      <button type="button" className={secondario} onClick={onChiudi}>
        Annulla
      </button>
      <button type="submit" form={id} disabled={!valido || inCorso} className={primario}>
        {inCorso ? 'Salvo…' : 'Salva'}
      </button>
    </>
  )

  const indice = passi.indexOf(attuale)

  return (
    <>
      <Modale
        titolo={wizard ? 'Nuova faccenda ricorrente' : 'Faccenda ricorrente'}
        onChiudi={onChiudi}
        schermoInteroMobile
        piede={piede}
      >
        <form id={id} className="flex flex-col gap-5" onSubmit={invia}>
          {wizard ? (
            <>
              <div className="flex flex-col gap-2">
                <div className="flex gap-1" aria-hidden="true">
                  {passi.map((p, i) => (
                    <span key={p} className={`h-1 flex-1 rounded-full ${i <= indice ? 'bg-salvia' : 'bg-bordo'}`} />
                  ))}
                </div>
                <p className="text-xs text-testo-tenue">
                  Passo {indice + 1} di {passi.length}
                </p>
              </div>
              <div key={attuale} className="animate-entra flex flex-col gap-3">
                <h3 className="text-lg font-semibold">
                  {attuale === 'cosa' ? (
                    <label htmlFor={`${id}-titolo`}>{domande.cosa.titolo}</label>
                  ) : (
                    domande[attuale].titolo
                  )}
                </h3>
                {domande[attuale].aiuto && <p className="-mt-2 text-sm text-testo-tenue">{domande[attuale].aiuto}</p>}
                {domande[attuale].contenuto}
              </div>
            </>
          ) : (
            <>
              <Sezione titolo={<label htmlFor={`${id}-titolo`}>Titolo</label>}>{sezioneCosa}</Sezione>
              <Sezione titolo="Ogni quanto">{sezioneFrequenza}</Sezione>
              {serveQuando && <Sezione titolo={domande.quando.titolo}>{sezioneQuando}</Sezione>}
              <label className="flex min-h-11 items-center gap-3">
                <input
                  type="checkbox"
                  className="size-5 accent-salvia"
                  checked={!attiva}
                  onChange={(e) => setAttiva(!e.target.checked)}
                />
                <span>
                  In pausa <span className="text-sm text-testo-tenue">(non aggiunge faccende finché non la riattivi)</span>
                </span>
              </label>
              {valido && riepilogo}
            </>
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

function Sezione({ titolo, children }: { titolo: ReactNode; children: ReactNode }) {
  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-xs text-testo-tenue">{titolo}</span>
      {children}
    </div>
  )
}

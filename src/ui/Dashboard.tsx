import { useRef, useState } from 'react'
import { BookOpen, CircleCheck, Play, type LucideIcon } from 'lucide-react'
import { schedeProgetti } from '../dominio/ordinamento'
import type { Attivita, Modifica, NuovaAttivita } from '../dominio/tipi'
import { AggiuntaRapida } from './AggiuntaRapida'
import { CardFaccende } from './CardFaccende'
import { useInterruttore, useRilievi } from './preferenze'
import { usePressioneLunga } from './pressioneLunga'
import { ProgettoConIcona } from './ProgettoConIcona'
import { PulsanteStato } from './PulsanteStato'
import { PulsanteStella } from './PulsanteStella'
import { TitoloConTag } from './TitoloConTag'
import type { useFaccende } from './useFaccende'

interface Props {
  attivita: readonly Attivita[]
  /** La card delle faccende, in cima. */
  faccende: ReturnType<typeof useFaccende>
  /** Apre il modale con tutti i campi dell'attività. */
  onDettagli: (attivita: Attivita) => void
  onDiario: (attivita: Attivita) => void
  /** Il cambio di stato dall'icona; chi riceve chiede conferma per *Completo*. */
  onModifica: (attivita: Attivita, modifica: Modifica) => void
  /** Crea l'attività; se non riesce lancia l'errore. */
  onCrea: (nuova: NuovaAttivita) => Promise<unknown>
}

/**
 * La Dashboard (doc/08-interfaccia.md): una card per progetto con le sue
 * attività, le completate in fondo grigie e barrate. Ogni attività mostra solo
 * stato, titolo e il pulsante del diario; toccando la riga si aprono i
 * dettagli, dove si modifica tutto. In fondo alla card l'aggiunta rapida.
 * Sopra i progetti, la card delle faccende.
 */
export function Dashboard({ attivita, faccende, onDettagli, onDiario, onModifica, onCrea }: Props) {
  const [soloInCorso, setSoloInCorso] = useInterruttore('projects_in_corso', false)
  const [mostraCompleti, setMostraCompleti] = useInterruttore('projects_completi', true)
  const [rilievi, cambiaRilievo] = useRilievi()
  // "In corso" vince sugli altri interruttori; e mostra solo le card che ne hanno.
  const mostrate = schedeProgetti(attivita, rilievi)
    .map((scheda) => ({
      ...scheda,
      visibili: soloInCorso
        ? scheda.attivita.filter((a) => a.stato === 'in_corso')
        : mostraCompleti
          ? scheda.attivita
          : scheda.attivita.filter((a) => a.stato !== 'completo'),
    }))
    .filter((scheda) => !soloInCorso || scheda.visibili.length > 0)
  // La prima card delle colonne, larga come le altre. Gli interruttori valgono
  // anche qui: "In corso" acceso o "Completi" spento nascondono le fatte.
  const cardFaccende = (
    <CardFaccende
      className="mb-3 break-inside-avoid"
      faccende={faccende}
      soloDaFare={soloInCorso || !mostraCompleti}
    />
  )

  return (
    <div className="flex flex-col gap-3">
      <div className="flex flex-wrap items-center gap-x-3 gap-y-2 px-1">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          Progetti <span className="text-sm font-normal text-testo-tenue">({mostrate.length})</span>
        </h2>
        {/* Gli interruttori della vista, ognuno ricordato in un cookie. */}
        <div className="flex flex-wrap items-center gap-1.5" role="group" aria-label="Mostra">
          <Interruttore etichetta="In corso" icona={Play} acceso={soloInCorso} onCambia={setSoloInCorso} />
          <Interruttore
            etichetta="Completi"
            icona={CircleCheck}
            acceso={mostraCompleti}
            onCambia={setMostraCompleti}
            ignorato={soloInCorso}
          />
        </div>
      </div>

      {mostrate.length === 0 ? (
        <>
          <div className="gap-3 lg:columns-2">{cardFaccende}</div>
          <p className="px-2 py-3 text-testo-tenue">
            {soloInCorso ? 'Nessuna attività in corso.' : 'Nessuna attività: aggiungine una con il +.'}
          </p>
        </>
      ) : (
        // Da PC due colonne sfalsate (come l'icona `layout-dashboard`): ogni card è alta quanto il suo contenuto.
        <div className="gap-3 lg:columns-2">
          {cardFaccende}
          {mostrate.map((scheda) => (
            <section
              key={scheda.chiave}
              className="animate-entra mb-3 break-inside-avoid rounded-[11px] border border-bordo bg-white"
            >
              <h3 className="flex items-center gap-2 border-b border-bordo py-1 pr-1.5 pl-3 font-semibold">
                <span className="min-w-0 flex-1">
                  {scheda.progetto === null ? (
                    <span className="text-testo-tenue">Senza progetto</span>
                  ) : (
                    <ProgettoConIcona progetto={scheda.progetto} />
                  )}
                </span>
                <span
                  className="text-sm font-normal text-testo-tenue"
                  title="Attività completate sul totale del progetto"
                >
                  {scheda.completate}/{scheda.attivita.length}
                </span>
                {/* Tocco: preferito sì/no; pressione lunga: anche "Accantonato", in fondo alla pagina. */}
                <PulsanteStella
                  rilievo={scheda.rilievo}
                  nome={scheda.progetto ?? 'Senza progetto'}
                  onScegli={(rilievo) => cambiaRilievo(scheda.chiave, rilievo)}
                />
              </h3>
              <ul className="divide-y divide-bordo">
                {/* Il conto resta sul totale anche con gli interruttori che nascondono attività. */}
                {scheda.visibili.map((a) => (
                  <RigaAttivita
                    key={a.id}
                    attivita={a}
                    onDettagli={onDettagli}
                    onDiario={onDiario}
                    onModifica={onModifica}
                  />
                ))}
                <li>
                  {/* Con "In corso" acceso la nuova attività nasce in corso, così resta visibile. */}
                  <AggiuntaRapida
                    placeholder={soloInCorso ? 'Aggiungi attività in corso' : 'Aggiungi attività'}
                    etichetta={
                      scheda.progetto === null ? 'Nuova attività senza progetto' : `Nuova attività in ${scheda.progetto}`
                    }
                    onCrea={(titolo) =>
                      onCrea({
                        titolo,
                        descrizione: null,
                        progetto: scheda.progetto,
                        stato: soloInCorso ? 'in_corso' : 'da_fare',
                        priorita: 3,
                      })
                    }
                  />
                </li>
              </ul>
            </section>
          ))}
        </div>
      )}
    </div>
  )
}

/** Ogni tratto del trascinamento vale un multiplo di questo, come il cursore dell'avanzamento. */
const PASSO_AVANZAMENTO = 5

interface RigaAttivitaProps extends Pick<Props, 'onDettagli' | 'onDiario' | 'onModifica'> {
  attivita: Attivita
}

/**
 * Una riga della card. Tenendo premuto il titolo e trascinando in orizzontale
 * si cambia l'avanzamento: tutta la larghezza della riga vale 100%, a passi
 * del 5%, e si salva al rilascio. Non su un'attività completa, ferma al 100%.
 */
function RigaAttivita({ attivita: a, onDettagli, onDiario, onModifica }: RigaAttivitaProps) {
  const [bozza, setBozza] = useState<number | null>(null)
  const inizio = useRef<{ x: number; valore: number; larghezza: number } | null>(null)
  const ultimaBozza = useRef<number | null>(null)

  const aggiorna = (valore: number | null) => {
    ultimaBozza.current = valore
    setBozza(valore)
  }

  const { ref, gestori, clicDaIgnorare } = usePressioneLunga<HTMLButtonElement>({
    disattiva: a.stato === 'completo',
    onInizio: (x) => {
      const larghezza = ref.current?.closest('li')?.getBoundingClientRect().width ?? 0
      if (larghezza <= 0) return
      inizio.current = { x, valore: a.avanzamento, larghezza }
      aggiorna(a.avanzamento)
    },
    onMuovi: (e) => {
      const i = inizio.current
      if (!i) return
      const grezzo = i.valore + ((e.clientX - i.x) / i.larghezza) * 100
      const passo = Math.round(grezzo / PASSO_AVANZAMENTO) * PASSO_AVANZAMENTO
      // Finché il dito non si sposta davvero resta il valore di partenza, anche se non è un multiplo di 5.
      aggiorna(Math.abs(e.clientX - i.x) < 4 ? i.valore : Math.min(100, Math.max(0, passo)))
    },
    onRilascia: () => {
      const valore = ultimaBozza.current
      inizio.current = null
      aggiorna(null)
      if (valore !== null && valore !== a.avanzamento) onModifica(a, { avanzamento: valore })
    },
    onAnnulla: () => {
      inizio.current = null
      aggiorna(null)
    },
  })

  const avanzamento = bozza ?? a.avanzamento

  return (
    // Un'attività che cambia stato si sposta nella card, con un'animazione breve.
    <li className="animate-entra relative flex items-center gap-1 pr-2 pl-1.5">
      {/* Il bordo sotto la riga è l'avanzamento: copre la linea divisoria, sparisce al 100% (non mentre si trascina). */}
      {(avanzamento < 100 || bozza !== null) && (
        <span
          className={`pointer-events-none absolute -bottom-px left-0 z-1 bg-salvia ${
            bozza === null ? 'h-0.5 transition-[width] duration-200 motion-reduce:transition-none' : 'h-1'
          }`}
          style={{ width: `${avanzamento}%` }}
          aria-hidden="true"
        />
      )}
      {bozza !== null && (
        <span
          className="pointer-events-none absolute -top-7 z-10 -translate-x-1/2 rounded-md bg-salvia-scura px-1.5 py-0.5 text-xs font-semibold text-panna shadow"
          style={{ left: `clamp(1.5rem, ${bozza}%, 100% - 1.5rem)` }}
          role="status"
        >
          {bozza}%
        </span>
      )}
      {/* Tocco: stato successivo; pressione lunga: menu degli stati. Completo chiede conferma. */}
      <PulsanteStato stato={a.stato} onScegli={(stato) => onModifica(a, { stato })} />
      {/* Il resto della riga apre i dettagli, tranne il pulsante del diario. */}
      <button
        ref={ref}
        type="button"
        title={a.stato === 'completo' ? 'Dettagli' : "Dettagli (tieni premuto e trascina per l'avanzamento)"}
        className="flex min-w-0 flex-1 touch-manipulation items-center self-stretch rounded-lg px-1 py-1.5 text-left select-none [-webkit-touch-callout:none] hover:bg-fondo active:bg-bordo"
        {...gestori}
        // Android apre il menu contestuale con la pressione lunga, interrompendo il trascinamento.
        onContextMenu={(e) => {
          if (a.stato !== 'completo') e.preventDefault()
        }}
        onClick={() => {
          if (!clicDaIgnorare()) onDettagli(a)
        }}
      >
        {/* Completa: grigia e barrata. I pezzi del titolo sono flex item, quindi la riga va su ognuno. */}
        <span
          className={`min-w-0 flex-1 break-words ${a.stato === 'completo' ? 'text-testo-tenue [&_span]:line-through' : ''}`}
        >
          <TitoloConTag titolo={a.titolo} />
        </span>
      </button>
      {/* Evidenziato se il diario ha delle voci. */}
      <button
        type="button"
        aria-label="Diario"
        title="Diario"
        className={`grid size-8 shrink-0 place-items-center rounded-lg ${a.ha_diario ? 'bg-pastello text-salvia-scura' : 'text-testo-tenue hover:bg-fondo'}`}
        onClick={() => onDiario(a)}
      >
        <BookOpen className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}

interface InterruttoreProps {
  etichetta: string
  icona: LucideIcon
  acceso: boolean
  onCambia: (acceso: boolean) => void
  /** Un altro interruttore ha la precedenza: questo resta com'è ma non conta, e si mostra attenuato. */
  ignorato?: boolean
}

/** Un interruttore on/off a pillola: pieno salvia chiaro quando è acceso. */
function Interruttore({ etichetta, icona: Icona, acceso, onCambia, ignorato = false }: InterruttoreProps) {
  return (
    <button
      type="button"
      aria-pressed={acceso}
      disabled={ignorato}
      title={ignorato ? `Non conta finché "In corso" è acceso` : undefined}
      className={`flex min-h-8 items-center gap-1.5 rounded-full border px-3 text-sm disabled:opacity-50 ${
        acceso
          ? 'border-transparent bg-pastello font-semibold text-salvia-scura'
          : 'border-bordo bg-white text-testo-tenue enabled:hover:bg-fondo'
      }`}
      onClick={() => onCambia(!acceso)}
    >
      <Icona className="size-4" aria-hidden="true" />
      {etichetta}
    </button>
  )
}

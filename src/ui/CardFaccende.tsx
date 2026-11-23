import { useEffect, useRef, useState } from 'react'
import { createPortal } from 'react-dom'
import { Broom, Circle, CircleCheck, Repeat, Trash2 } from 'lucide-react'
import { stagione } from '../dominio/ambiente'
import { faccendeDiOggi } from '../dominio/faccende'
import type { Faccenda } from '../dominio/tipi'
import { AggiuntaRapida } from './AggiuntaRapida'
import { Arbusto } from './foresta/Albero'
import type { useFaccende } from './useFaccende'

type Faccende = ReturnType<typeof useFaccende>

interface Props {
  faccende: Faccende
  /** Nasconde le faccende già fatte oggi (interruttori della Dashboard). */
  soloDaFare?: boolean
  /** Classi in più, per stare nelle colonne della Dashboard. */
  className?: string
}

/**
 * La card delle faccende (doc/08-interfaccia.md, "Faccende"): attività veloci
 * con solo il titolo. L'icona segna fatta (o di nuovo da fare): le fatte restano
 * barrate in fondo fino a mezzanotte, poi spariscono. Il titolo si modifica
 * toccandolo, e lì compare anche il cestino. In fondo l'aggiunta rapida.
 */
export function CardFaccende({
  faccende: { stato, ricarica, crea, segna, rinomina, elimina },
  soloDaFare = false,
  className = '',
}: Props) {
  const tutte = stato.fase === 'pronto' ? faccendeDiOggi(stato.faccende) : []
  const fatte = tutte.filter((f) => f.completa).length
  const visibili = soloDaFare ? tutte.filter((f) => !f.completa) : tutte
  const [arbusti, setArbusti] = useState<ArbustoNuovo[]>([])

  return (
    // Un post-it giallo: si distingue subito dalle card bianche dei progetti.
    <section className={`animate-entra rounded-[11px] border border-postit-bordo bg-postit ${className}`}>
      <h3 className="flex min-h-10 items-center gap-2 border-b border-postit-bordo py-1 pr-3 pl-3 font-semibold">
        <Broom className="size-4.5 shrink-0 text-salvia-scura" aria-hidden="true" />
        <span className="min-w-0 flex-1">Faccende</span>
        {tutte.length > 0 && (
          <span className="text-sm font-normal text-testo-tenue" title="Faccende fatte oggi sul totale">
            {fatte}/{tutte.length}
          </span>
        )}
      </h3>

      {stato.fase === 'caricamento' && <p className="px-3 py-2 text-sm text-testo-tenue">Carico le faccende…</p>}
      {stato.fase === 'errore' && (
        <div className="flex flex-wrap items-center gap-2 px-3 py-2" role="alert">
          <p className="flex-1 text-sm text-pericolo">{stato.messaggio}</p>
          <button
            type="button"
            className="min-h-9 rounded-[11px] bg-salvia px-3 text-sm font-semibold text-panna hover:bg-salvia-scura"
            onClick={() => void ricarica()}
          >
            Riprova
          </button>
        </div>
      )}

      {stato.fase === 'pronto' && (
        <ul className="divide-y divide-postit-bordo">
          {visibili.map((f) => (
            <RigaFaccenda
              key={f.id}
              faccenda={f}
              onSegna={(completa, punto) => {
                void segna(f.id, completa)
                // La Foresta (doc/08): ogni faccenda fatta è un arbusto, e lo si vede spuntare.
                if (completa && punto) setArbusti((prima) => [...prima, { chiave: Date.now(), seed: f.id, ...punto }])
              }}
              onRinomina={(titolo) => void rinomina(f.id, titolo)}
              onElimina={() => void elimina(f.id)}
            />
          ))}
          <li>
            <AggiuntaRapida placeholder="Aggiungi faccenda" etichetta="Nuova faccenda" onCrea={crea} />
          </li>
        </ul>
      )}
      {arbusti.map((a) => (
        <ArbustoCheSpunta
          key={a.chiave}
          arbusto={a}
          onFine={() => setArbusti((prima) => prima.filter((b) => b.chiave !== a.chiave))}
        />
      ))}
    </section>
  )
}

interface ArbustoNuovo {
  chiave: number
  seed: number
  /** Il centro del pulsante che l'ha spuntata, sullo schermo. */
  x: number
  y: number
}

/**
 * Un arbustino che spunta dal pulsante della faccenda appena fatta e vola via.
 * Sta in un portale fisso, così resta anche se la riga sparisce (con "solo da fare").
 */
function ArbustoCheSpunta({ arbusto: { seed, x, y }, onFine }: { arbusto: ArbustoNuovo; onFine: () => void }) {
  const fine = useRef(onFine)
  useEffect(() => {
    fine.current = onFine
  })
  useEffect(() => {
    const t = window.setTimeout(() => fine.current(), 1400)
    return () => window.clearTimeout(t)
  }, [])
  return createPortal(
    <svg
      viewBox="-10 -13 20 16"
      className="animate-spunta pointer-events-none fixed z-50 h-8 w-10"
      style={{ left: x - 20, top: y - 34 }}
      aria-hidden="true"
    >
      <Arbusto seed={seed} stagione={stagione(new Date())} />
    </svg>,
    document.body,
  )
}

interface RigaFaccendaProps {
  faccenda: Faccenda
  /** `punto` è il centro del pulsante, per far spuntare l'arbusto lì. */
  onSegna: (completa: boolean, punto?: { x: number; y: number }) => void
  onRinomina: (titolo: string) => void
  onElimina: () => void
}

/**
 * Una faccenda: l'icona la segna fatta o da fare; il titolo, toccato, diventa un
 * campo (Invio o clic fuori salvano, Esc annulla) con accanto il cestino, che
 * elimina subito.
 */
function RigaFaccenda({ faccenda: f, onSegna, onRinomina, onElimina }: RigaFaccendaProps) {
  const [bozza, setBozza] = useState<string | null>(null)
  // Invio chiude il campo, e il campo che sparisce può perdere il fuoco:
  // senza questo il titolo si salverebbe due volte (come CampoTitolo).
  const aperto = useRef(false)
  const Icona = f.completa ? CircleCheck : Circle

  const apri = () => {
    aperto.current = true
    setBozza(f.titolo)
  }

  const chiudi = (salva: boolean) => {
    if (!aperto.current || bozza === null) return
    aperto.current = false
    const nuovo = bozza.trim()
    setBozza(null)
    // Un titolo svuotato non si salva: per togliere la faccenda c'è il cestino.
    if (salva && nuovo && nuovo !== f.titolo) onRinomina(nuovo)
  }

  return (
    <li className="animate-entra flex min-h-11 items-center gap-1 py-1 pr-2 pl-1.5">
      <button
        type="button"
        role="checkbox"
        aria-checked={f.completa}
        aria-label={f.titolo}
        title={f.completa ? 'Segna da fare' : 'Segna fatta'}
        className={`grid size-8 shrink-0 touch-manipulation place-items-center rounded-lg ${
          f.completa ? 'bg-completo text-completo-testo' : 'bg-dafare text-dafare-testo'
        }`}
        onClick={(e) => {
          const b = e.currentTarget.getBoundingClientRect()
          onSegna(!f.completa, { x: b.left + b.width / 2, y: b.top + b.height / 2 })
        }}
      >
        <Icona className="size-4" aria-hidden="true" />
      </button>

      {bozza === null ? (
        <button
          type="button"
          title="Modifica"
          className={`min-w-0 flex-1 self-stretch rounded-lg px-1 text-left break-words hover:bg-postit-scuro active:bg-postit-bordo ${
            f.completa ? 'text-testo-tenue line-through' : ''
          }`}
          onClick={apri}
        >
          {f.titolo}
          {f.ricorrenza_id !== null && (
            <Repeat className="ml-1.5 inline size-3.5 align-[-2px] text-testo-tenue" aria-label="ricorrente" />
          )}
        </button>
      ) : (
        <input
          aria-label="Titolo della faccenda"
          autoFocus
          enterKeyHint="done"
          className="min-h-9 min-w-0 flex-1 rounded-lg border border-bordo bg-white px-2 text-base focus:outline-2 focus:-outline-offset-1 focus:outline-salvia"
          value={bozza}
          onChange={(e) => setBozza(e.target.value)}
          onBlur={() => chiudi(true)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              e.preventDefault()
              chiudi(true)
            }
            if (e.key === 'Escape') {
              e.preventDefault()
              chiudi(false)
            }
          }}
        />
      )}
      {/* Sempre visibile, come il diario nelle righe delle attività. */}
      <button
        type="button"
        aria-label={`Elimina ${f.titolo}`}
        title="Elimina"
        className="grid size-8 shrink-0 place-items-center rounded-lg text-testo-tenue hover:bg-postit-scuro hover:text-pericolo"
        // Se il titolo è in modifica, il campo non deve perdere il fuoco (e salvare) prima dell'eliminazione.
        onPointerDown={(e) => {
          if (bozza !== null) e.preventDefault()
        }}
        onClick={() => {
          aperto.current = false
          setBozza(null)
          onElimina()
        }}
      >
        <Trash2 className="size-4" aria-hidden="true" />
      </button>
    </li>
  )
}

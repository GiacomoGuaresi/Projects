import { useEffect, useRef, useState, type KeyboardEvent } from 'react'
import { Check } from 'lucide-react'
import type { ProgettoInUso } from '../dominio/progetto'
import { InputProgetto } from './InputProgetto'
import { ProgettoConIcona } from './ProgettoConIcona'
import { TitoloConTag } from './TitoloConTag'

const campo =
  'rounded-lg border border-bordo bg-white px-2 py-1 focus:outline-2 focus:-outline-offset-1 focus:outline-salvia'

/** Il titolo: clic → campo di testo; Invio o clic fuori salva, Esc annulla. */
export function CampoTitolo({ titolo, onSalva }: { titolo: string; onSalva: (titolo: string) => void }) {
  const [bozza, setBozza] = useState<string | null>(null)
  // Invio chiude il campo, e il campo che sparisce può perdere il fuoco:
  // senza questo il titolo si salverebbe due volte.
  const aperto = useRef(false)

  if (bozza === null) {
    return (
      <button
        type="button"
        title="Modifica il titolo"
        className="-mx-1 w-[calc(100%+8px)] rounded-lg px-1 py-0.5 text-left hover:bg-fondo"
        onClick={() => {
          aperto.current = true
          setBozza(titolo)
        }}
      >
        <TitoloConTag titolo={titolo} />
      </button>
    )
  }

  const chiudi = (salva: boolean) => {
    if (!aperto.current) return
    aperto.current = false
    const nuovo = bozza.trim()
    setBozza(null)
    if (salva && nuovo && nuovo !== titolo) onSalva(nuovo)
  }

  return (
    <input
      aria-label="Titolo"
      className={`${campo} w-full`}
      autoFocus
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
  )
}

interface CampoProgettoProps {
  progetto: string | null
  progetti: readonly ProgettoInUso[]
  /** Il testo scritto: decide chi riceve se salvare o chiedere "solo questa / tutte". */
  onSalva: (testo: string) => void
}

/**
 * Il progetto: clic → campo con suggerimenti; scegliere un suggerimento, Invio
 * o clic fuori salvano, Esc annulla.
 */
export function CampoProgetto({ progetto, progetti, onSalva }: CampoProgettoProps) {
  const [bozza, setBozza] = useState<string | null>(null)
  const aperto = useRef(false)

  if (bozza === null) {
    return (
      <button
        type="button"
        title="Modifica il progetto"
        className="-mx-1 flex w-[calc(100%+8px)] min-w-0 rounded-lg px-1 py-0.5 text-left hover:bg-fondo"
        onClick={() => {
          aperto.current = true
          setBozza(progetto ?? '')
        }}
      >
        <ProgettoConIcona progetto={progetto} />
      </button>
    )
  }

  const chiudi = (salva: boolean, testo: string) => {
    if (!aperto.current) return
    aperto.current = false
    setBozza(null)
    if (salva) onSalva(testo)
  }

  return (
    <InputProgetto
      etichetta="Progetto"
      className={`${campo} w-full`}
      autoFocus
      valore={bozza}
      onCambia={setBozza}
      progetti={progetti}
      onScegli={(scelto) => chiudi(true, scelto)}
      onConferma={(testo) => chiudi(true, testo)}
      onAnnulla={() => chiudi(false, bozza)}
      onBlur={() => chiudi(true, bozza)}
    />
  )
}

interface CampoAvanzamentoProps {
  valore: number
  /** Un'attività completa resta al 100%. */
  bloccato: boolean
  onSalva: (avanzamento: number) => void
}

/**
 * L'avanzamento: barra e percentuale; clic → cursore e numero. Invio, ✓ o un
 * tocco fuori salvano, Esc annulla.
 */
export function CampoAvanzamento({ valore, bloccato, onSalva }: CampoAvanzamentoProps) {
  const [bozza, setBozza] = useState<number | null>(null)
  const riquadro = useRef<HTMLDivElement>(null)
  const ultimaBozza = useRef<number | null>(null)
  ultimaBozza.current = bozza

  const chiudi = (salva: boolean) => {
    const nuovo = ultimaBozza.current
    if (nuovo === null) return
    ultimaBozza.current = null
    setBozza(null)
    const pulito = Math.min(100, Math.max(0, Math.round(nuovo)))
    if (salva && pulito !== valore) onSalva(pulito)
  }
  const chiudiRef = useRef(chiudi)
  chiudiRef.current = chiudi

  // Un tocco fuori salva. Si ascolta il tocco invece del fuoco perché su iOS
  // il cursore non prende il fuoco.
  const inModifica = bozza !== null
  useEffect(() => {
    if (!inModifica) return
    const fuori = (evento: PointerEvent) => {
      if (!riquadro.current?.contains(evento.target as Node)) chiudiRef.current(true)
    }
    document.addEventListener('pointerdown', fuori)
    return () => document.removeEventListener('pointerdown', fuori)
  }, [inModifica])

  if (bozza === null) {
    return (
      <button
        type="button"
        disabled={bloccato}
        title={bloccato ? 'Completa: 100%' : "Modifica l'avanzamento"}
        className="-mx-1 flex w-[calc(100%+8px)] items-center gap-2 rounded-lg px-1 py-1.5 enabled:hover:bg-fondo"
        onClick={() => setBozza(valore)}
      >
        <span className="h-1.5 flex-1 overflow-hidden rounded-full bg-bordo">
          <span className="block h-full rounded-full bg-salvia" style={{ width: `${valore}%` }} />
        </span>
        <span className="w-9 text-right text-xs text-testo-tenue">{valore}%</span>
      </button>
    )
  }

  const tasti = (e: KeyboardEvent) => {
    if (e.key === 'Enter') {
      e.preventDefault()
      chiudi(true)
    }
    if (e.key === 'Escape') {
      e.preventDefault()
      chiudi(false)
    }
  }

  return (
    <div ref={riquadro} className="flex items-center gap-2">
      <input
        type="range"
        aria-label="Avanzamento"
        min={0}
        max={100}
        step={5}
        value={bozza}
        onChange={(e) => setBozza(Number(e.target.value))}
        onKeyDown={tasti}
        className="min-w-0 flex-1 accent-salvia"
      />
      <input
        type="number"
        aria-label="Avanzamento in percentuale"
        min={0}
        max={100}
        autoFocus
        value={bozza}
        onChange={(e) => setBozza(e.target.value === '' ? 0 : Number(e.target.value))}
        onKeyDown={tasti}
        className={`${campo} w-16`}
      />
      <button
        type="button"
        aria-label="Salva l'avanzamento"
        className="grid size-8 shrink-0 place-items-center rounded-lg bg-salvia text-panna hover:bg-salvia-scura"
        onClick={() => chiudi(true)}
      >
        <Check className="size-4" aria-hidden="true" />
      </button>
    </div>
  )
}

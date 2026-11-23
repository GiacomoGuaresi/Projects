import { useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { createPortal } from 'react-dom'
import { stagione as stagioneDi } from '../../dominio/ambiente'
import { boschetti, SENZA_PROGETTO, specieBoschetti, verdeZolla } from '../../dominio/foresta'
import { festa as festaDi } from '../../dominio/feste'
import { chiaveProgetto } from '../../dominio/progetto'
import type { Attivita } from '../../dominio/tipi'
import { Albero } from './Albero'

/** Quanto resta l'alberello di prima prima di crescere, e quanto resta tutto aperto. */
const PRIMA_MS = 450
const APERTO_MS = 3200
const USCITA_MS = 250

/** Le foglioline che saltano via quando l'albero cresce: verso (dx, dy) in unità SVG. */
const FOGLIE: [number, number, number][] = [
  [-22, -30, 0],
  [20, -36, 1],
  [-26, -8, 2],
  [24, -12, 0],
  [-8, -46, 1],
  [10, -50, 2],
]

/** Le scintille attorno alla chioma, come quelle delle piante di oggi nella Foresta. */
const SCINTILLE: [number, number][] = [
  [-16, -38],
  [15, -30],
  [-13, -14],
  [9, -50],
]

interface Props {
  /** L'attività appena completata, com'era prima: da lì parte la crescita. */
  attivita: Attivita
  /** Tutte le attività, per specie e numero del boschetto. */
  tutte: readonly Attivita[]
  onChiudi: () => void
}

/**
 * Il momento in cui si pianta un albero (doc/08-interfaccia.md, "Foresta"):
 * completando un'attività compare per qualche secondo la sua pianta, proprio
 * quella della Foresta (stesso seed, specie del boschetto, stagione di oggi),
 * che cresce da com'era ad albero. Si chiude da sola, con un tocco o con Esc.
 */
export function AlberoPiantato({ attivita, tutte, onChiudi }: Props) {
  const [cresciuto, setCresciuto] = useState(false)
  const [esce, setEsce] = useState(false)
  const chiudi = useRef(onChiudi)
  useEffect(() => {
    chiudi.current = onChiudi
  })

  const oggi = useMemo(() => new Date(), [])
  const stagione = stagioneDi(oggi)
  const festa = festaDi(oggi)
  const nome = attivita.progetto?.trim() || SENZA_PROGETTO
  const chiave = attivita.progetto?.trim() ? chiaveProgetto(attivita.progetto) : ''
  const specie = useMemo(() => specieBoschetti(boschetti(tutte)).get(chiave) ?? null, [tutte, chiave])
  const numero = useMemo(
    () =>
      tutte.filter(
        (a) =>
          a.id !== attivita.id &&
          a.stato === 'completo' &&
          (a.progetto?.trim() ? chiaveProgetto(a.progetto) : '') === chiave,
      ).length + 1,
    [tutte, attivita.id, chiave],
  )
  const { h, s, l } = verdeZolla(chiave)
  const inverno = stagione === 'inverno'
  const zolla = inverno ? `hsl(${h}, ${Math.round(s * 0.35)}%, 88%)` : `hsl(${h}, ${s}%, ${l}%)`
  const fianco = `hsl(${h}, ${Math.round(s * 0.6)}%, ${inverno ? 72 : l - 14}%)`
  const fiancoScuro = `hsl(${h}, ${Math.round(s * 0.6)}%, ${inverno ? 64 : l - 22}%)`
  const terra = '#8a6a4a'

  // Germoglio o alberello → albero, poi via da sola.
  useEffect(() => {
    const cresci = window.setTimeout(() => setCresciuto(true), PRIMA_MS)
    const esci = window.setTimeout(() => setEsce(true), APERTO_MS)
    const fine = window.setTimeout(() => chiudi.current(), APERTO_MS + USCITA_MS)
    const tasto = (e: KeyboardEvent) => {
      if (e.key === 'Escape') chiudi.current()
    }
    document.addEventListener('keydown', tasto)
    return () => {
      window.clearTimeout(cresci)
      window.clearTimeout(esci)
      window.clearTimeout(fine)
      document.removeEventListener('keydown', tasto)
    }
  }, [])

  // Da un germoglio si parte più piccoli che da un alberello.
  const da = attivita.stato === 'da_fare' ? 0.35 : 0.6

  return createPortal(
    <div
      className={`fixed inset-0 z-50 grid place-items-center bg-testo/25 p-4 transition-opacity duration-[250ms] ${esce ? 'opacity-0' : 'animate-dissolvi'}`}
      onClick={() => onChiudi()}
      role="status"
      aria-live="polite"
    >
      <div className="animate-compari flex w-full max-w-72 flex-col items-center rounded-[18px] bg-white px-5 pt-3 pb-4 text-center shadow-xl">
        <svg viewBox="-36 -58 72 84" className="h-52 w-full max-w-60 overflow-visible" aria-hidden="true">
          {/* La zolla del boschetto, un cubetto isometrico. */}
          <polygon points="-30,0 0,15 0,24 -30,9" fill={fianco} />
          <polygon points="30,0 0,15 0,24 30,9" fill={fiancoScuro} />
          <polygon points="0,-15 30,0 0,15 -30,0" fill={zolla} />
          <ellipse cx={0} cy={0.5} rx={5} ry={2.4} fill={terra} fillOpacity={0.55} />

          {!cresciuto && (
            <g>
              <Albero seed={attivita.id} stato={attivita.stato} stagione={stagione} specie={specie} festa={festa} />
            </g>
          )}
          {cresciuto && (
            <>
              <g className="animate-pianta" style={{ '--da': da } as CSSProperties}>
                <Albero seed={attivita.id} stato="completo" stagione={stagione} specie={specie} festa={festa} />
              </g>
              <g className="pointer-events-none">
                {FOGLIE.map(([dx, dy, i]) => (
                  <ellipse
                    key={`${dx},${dy}`}
                    cx={0}
                    cy={-20}
                    rx={2.2}
                    ry={1.1}
                    fill={['#7fb35b', '#a5c96b', '#5e9a4a'][i]}
                    className="animate-foglia"
                    style={{ '--dx': `${dx}px`, '--dy': `${dy}px`, animationDelay: `${i * 60}ms` } as CSSProperties}
                  />
                ))}
                {SCINTILLE.map(([x, y], i) => (
                  <g key={i} transform={`translate(${x} ${y})`}>
                    <path
                      d="M0,-3.2 L0.7,-0.7 L3.2,0 L0.7,0.7 L0,3.2 L-0.7,0.7 L-3.2,0 L-0.7,-0.7 Z"
                      fill="#ffe27a"
                      stroke="#e8b830"
                      strokeWidth={0.4}
                      className="animate-scintilla"
                      style={{ animationDelay: `${i * 0.5}s` }}
                    />
                  </g>
                ))}
              </g>
            </>
          )}
        </svg>

        <p className="text-base font-semibold">🌳 Albero piantato</p>
        <p className="mt-0.5 text-sm text-testo-tenue">
          {numero}° albero in <strong className="text-testo">{nome}</strong>
        </p>
        <a
          href="#/foresta"
          className="mt-3 inline-flex min-h-10 items-center rounded-[11px] bg-salvia px-4 text-sm font-semibold text-panna hover:bg-salvia-scura"
        >
          Vedi nella Foresta
        </a>
      </div>
    </div>,
    document.body,
  )
}

import { useEffect, useMemo, useRef, useState, type PointerEvent } from 'react'
import { Minus, Plus, Sprout, X } from 'lucide-react'
import { faccende } from '../../dati'
import {
  boschetti,
  disponi,
  LATO,
  proietta,
  statisticheBosco,
  verdeZolla,
  type AlberoForesta,
} from '../../dominio/foresta'
import { coloreProgetto, iniziali } from '../../dominio/progetto'
import type { Attivita, Stato } from '../../dominio/tipi'
import { infoStati } from '../stati'
import { Albero, Arbusto } from './Albero'

interface Props {
  attivita: readonly Attivita[]
}

/** Le piante già viste (`id:stato`), per far crescere solo le nuove e quelle cambiate. */
const VISTI = 'projects_foresta_visti'
/** Lo spessore della zolla di terra sotto il prato, in px. */
const SPESSORE = 10
/** Spazio sopra il prato per le chiome. */
const CHIOME = 48
/** La vista più piccola: una foresta di pochi alberi non diventa gigante. */
const VISTA_MINIMA = { larga: 560, alta: 320 }
const ZOOM = [1, 1.5, 2, 3] as const
/** Le caselle del bosco scelto: prima quello che è fatto. */
const ORDINE_STATI: Stato[] = ['completo', 'in_corso', 'da_fare', 'bloccato']
const VERTICALE = '(orientation: portrait) and (max-width: 767px)'
/** Oltre questi px un trascinamento col mouse non è più un clic. */
const SOGLIA_TRASCINAMENTO = 4

const pianta = (a: AlberoForesta) => `${a.id}:${a.stato}`

function leggiVisti(): Set<string> | null {
  try {
    const salvati = window.localStorage.getItem(VISTI)
    return salvati ? new Set((JSON.parse(salvati) as unknown[]).map(String)) : null
  } catch {
    return null
  }
}

function salvaVisti(piante: string[]) {
  try {
    window.localStorage.setItem(VISTI, JSON.stringify(piante))
  } catch {
    // Senza memoria del browser crescono tutti a ogni visita: va bene lo stesso.
  }
}

/** Il conto delle faccende fatte; `null` finché non arriva o se non si riesce a leggerlo. */
function useArbusti(): number | null {
  const [quanti, setQuanti] = useState<number | null>(null)
  useEffect(() => {
    let attivo = true
    faccende()
      .fatte()
      .then((n) => attivo && setQuanti(n))
      .catch(() => attivo && setQuanti(null))
    return () => {
      attivo = false
    }
  }, [])
  return quanti
}

const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null

const plurale = (n: number, uno: string, tanti: string) => `${n} ${n === 1 ? uno : tanti}`

/** Le nuvole del cielo, ferme se si è chiesto meno movimento. */
const NUVOLE = [
  { sinistra: '6%', alto: '7%', scala: 1, durata: 70 },
  { sinistra: '58%', alto: '4%', scala: 0.7, durata: 90 },
  { sinistra: '78%', alto: '22%', scala: 1.2, durata: 80 },
  { sinistra: '28%', alto: '30%', scala: 0.55, durata: 110 },
]

function Nuvola({ scala }: { scala: number }) {
  return (
    <svg width={120 * scala} height={48 * scala} viewBox="0 0 120 48" aria-hidden="true">
      <g fill="#fff">
        <ellipse cx={60} cy={34} rx={52} ry={13} />
        <circle cx={40} cy={26} r={16} />
        <circle cx={66} cy={20} r={20} />
        <circle cx={88} cy={30} r={12} />
      </g>
    </svg>
  )
}

/**
 * La Foresta (doc/08-interfaccia.md): un prato isometrico nel cielo, grande
 * quanto la pagina. Ogni attività è una pianta che cresce col suo stato, i progetti sono
 * boschi su una zolla del loro colore, le faccende fatte sono arbusti sparsi.
 * Toccando un albero (o la sua zolla) si illumina il bosco e sotto compaiono
 * i suoi numeri; + e − ingrandiscono, col mouse si trascina.
 */
export function PaginaForesta({ attivita }: Props) {
  const arbusti = useArbusti()
  const gruppi = useMemo(() => boschetti(attivita), [attivita])
  const foresta = useMemo(() => disponi(gruppi, arbusti ?? 0), [gruppi, arbusti])
  const piante = gruppi.flatMap((g) => g.alberi)
  const alberi = piante.filter((a) => a.stato === 'completo').length
  const inCrescita = piante.filter((a) => a.stato === 'in_corso' || a.stato === 'da_fare').length
  const secchi = piante.filter((a) => a.stato === 'bloccato').length

  // In verticale l'isola, larga e bassa, verrebbe piccola: si parte già ingranditi.
  const [zoom, setZoom] = useState(() => (window.matchMedia(VERTICALE).matches ? 1 : 0))
  const [bosco, setBosco] = useState<string | null>(null)
  const scelto = bosco === null ? null : (gruppi.find((g) => g.chiave === bosco) ?? null)
  const statistiche = useMemo(() => (scelto ? statisticheBosco(attivita, scelto.chiave) : null), [attivita, scelto])
  const contenitore = useRef<HTMLDivElement>(null)

  // Le piante nuove o cambiate dall'ultima visita crescono; poi diventano "viste".
  const [visti] = useState(leggiVisti)
  useEffect(() => {
    salvaVisti(gruppi.flatMap((g) => g.alberi.map(pianta)))
  }, [gruppi])

  // Ingrandendo resta al centro.
  useEffect(() => {
    const c = contenitore.current
    if (!c) return
    c.scrollLeft = (c.scrollWidth - c.clientWidth) / 2
    c.scrollTop = (c.scrollHeight - c.clientHeight) / 2
  }, [zoom])

  // Col mouse si trascina il prato; al tocco scorre già da sé.
  const trascina = useRef<{ x: number; y: number; sx: number; sy: number; mosso: boolean } | null>(null)
  const giu = (e: PointerEvent) => {
    const c = contenitore.current
    if (e.pointerType !== 'mouse' || !c) return
    trascina.current = { x: e.clientX, y: e.clientY, sx: c.scrollLeft, sy: c.scrollTop, mosso: false }
  }
  const muovi = (e: PointerEvent) => {
    const t = trascina.current
    const c = contenitore.current
    if (!t || !c) return
    const dx = e.clientX - t.x
    const dy = e.clientY - t.y
    if (Math.hypot(dx, dy) > SOGLIA_TRASCINAMENTO) t.mosso = true
    c.scrollLeft = t.sx - dx
    c.scrollTop = t.sy - dy
  }
  const su = () => {
    // Il clic arriva dopo: lo si lascia passare solo se non si è trascinato.
    window.setTimeout(() => (trascina.current = null))
  }
  const scegli = (chiave: string | null) => {
    if (trascina.current?.mosso) return
    setBosco(chiave)
  }

  const { minCol, maxCol, minRiga, maxRiga } = foresta.limiti
  const alto = proietta(minCol - 0.5, minRiga - 0.5)
  const destra = proietta(maxCol + 0.5, minRiga - 0.5)
  const basso = proietta(maxCol + 0.5, maxRiga + 0.5)
  const sinistra = proietta(minCol - 0.5, maxRiga + 0.5)
  const contenuto = {
    x: sinistra.x - 8,
    y: alto.y - CHIOME,
    larga: destra.x - sinistra.x + 16,
    alta: basso.y - alto.y + CHIOME + SPESSORE + 32,
  }
  // Con pochi alberi la vista si allarga attorno al prato, che resta al centro.
  const larga = Math.max(contenuto.larga, VISTA_MINIMA.larga)
  const alta = Math.max(contenuto.alta, VISTA_MINIMA.alta)
  const vista = {
    x: contenuto.x - (larga - contenuto.larga) / 2,
    y: contenuto.y - (alta - contenuto.alta) / 2,
    larga,
    alta,
  }
  const punti = (...p: { x: number; y: number }[]) => p.map(({ x, y }) => `${x},${y}`).join(' ')
  const sotto = (p: { x: number; y: number }) => ({ x: p.x, y: p.y + SPESSORE })

  // Le caselle a scacchiera, per dare il senso della griglia.
  const caselle: { col: number; riga: number }[] = []
  for (let col = minCol; col <= maxCol; col++) {
    for (let riga = minRiga; riga <= maxRiga; riga++) {
      if ((col + riga) % 2 === 0) caselle.push({ col, riga })
    }
  }
  const rombo = (col: number, riga: number) =>
    punti(
      proietta(col - 0.5, riga - 0.5),
      proietta(col + 0.5, riga - 0.5),
      proietta(col + 0.5, riga + 0.5),
      proietta(col - 0.5, riga + 0.5),
    )
  /** Con un bosco scelto, il resto si spegne. */
  const spento = (chiave: string | null) => bosco !== null && chiave !== bosco

  let ordine = 0
  const vuota = piante.length === 0 && !arbusti

  return (
    <div className="relative h-[calc(100dvh-45px-env(safe-area-inset-top))] min-h-[360px] lg:h-[calc(100dvh-44px)] overflow-hidden bg-linear-to-b from-cielo via-cielo-chiaro to-fondo">
      {NUVOLE.map((n) => (
        <div
          key={n.sinistra}
          className="animate-deriva pointer-events-none absolute opacity-80"
          style={{ left: n.sinistra, top: n.alto, animationDuration: `${n.durata}s` }}
        >
          <Nuvola scala={n.scala} />
        </div>
      ))}

      <div
        ref={contenitore}
        className="absolute inset-0 overflow-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        onPointerDown={giu}
        onPointerMove={muovi}
        onPointerUp={su}
        onPointerLeave={su}
      >
        <svg
          viewBox={`${vista.x} ${vista.y} ${vista.larga} ${vista.alta}`}
          preserveAspectRatio="xMidYMid meet"
          className="block select-none"
          style={{ width: `${ZOOM[zoom] * 100}%`, height: `${ZOOM[zoom] * 100}%` }}
          role="img"
          aria-label={`La foresta: ${plurale(alberi, 'albero', 'alberi')} in ${plurale(gruppi.length, 'boschetto', 'boschetti')}${arbusti ? ` e ${plurale(arbusti, 'arbusto', 'arbusti')}` : ''}.`}
          onClick={() => scegli(null)}
        >
          <defs>
            <filter id="sfuma-ombra" x="-50%" y="-200%" width="200%" height="500%">
              <feGaussianBlur stdDeviation={10} />
            </filter>
          </defs>

          {/* L'ombra dell'isola, la terra, poi il prato sopra. */}
          <ellipse
            cx={(sinistra.x + destra.x) / 2}
            cy={basso.y + SPESSORE + 6}
            rx={(destra.x - sinistra.x) * 0.32}
            ry={6 + (basso.y - alto.y) * 0.04}
            fill="#2e3a2d"
            fillOpacity={0.18}
            filter="url(#sfuma-ombra)"
          />
          <polygon points={punti(sinistra, basso, sotto(basso), sotto(sinistra))} fill="#8f6a47" />
          <polygon points={punti(basso, destra, sotto(destra), sotto(basso))} fill="#76563a" />
          <polygon points={punti(alto, destra, basso, sinistra)} fill="#b7d5a4" />
          {caselle.map(({ col, riga }) => (
            <polygon key={`${col},${riga}`} points={rombo(col, riga)} fill="#c1dcb0" />
          ))}

          {foresta.elementi.map((e) => {
            const { x, y } = proietta(e.col, e.riga)
            if (e.tipo === 'zolla') {
              const acceso = bosco === e.chiave
              const { h, s, l } = verdeZolla(e.chiave)
              return (
                <polygon
                  key={`z${e.col},${e.riga}`}
                  points={rombo(e.col, e.riga)}
                  fill={`hsl(${h}, ${s}%, ${acceso ? l + 8 : l}%)`}
                  fillOpacity={acceso ? 1 : spento(e.chiave) ? 0.3 : 0.8}
                  className="cursor-pointer transition-[fill-opacity] duration-200"
                  onClick={(evento) => {
                    evento.stopPropagation()
                    scegli(e.chiave)
                  }}
                />
              )
            }
            if (e.tipo === 'arbusto') {
              return (
                <g
                  key={`a${e.seed}`}
                  transform={`translate(${x} ${y})`}
                  opacity={bosco !== null ? 0.45 : 1}
                  className="pointer-events-none transition-opacity duration-200"
                >
                  <Arbusto seed={e.seed} />
                </g>
              )
            }
            const nuovo = !visti?.has(pianta(e.albero))
            return (
              <g
                key={`t${e.albero.id}`}
                transform={`translate(${x} ${y})`}
                opacity={spento(e.chiave) ? 0.3 : 1}
                className="cursor-pointer transition-opacity duration-200"
                onClick={(evento) => {
                  evento.stopPropagation()
                  scegli(e.chiave)
                }}
              >
                <g
                  className={nuovo ? 'animate-cresci' : undefined}
                  style={nuovo ? { animationDelay: `${Math.min(ordine++ * 40, 1500)}ms` } : undefined}
                >
                  <Albero seed={e.albero.id} stato={e.albero.stato} frutti={e.albero.priorita >= 4} />
                </g>
              </g>
            )
          })}

          {/* I nomi dei boschi, sopra tutto. */}
          {foresta.lotti.map((l) => {
            const { x, y } = proietta(l.col, l.riga)
            return (
              <text
                key={l.chiave}
                x={x}
                y={y + (l.raggio * Math.SQRT2 * LATO) / 4 + 14}
                textAnchor="middle"
                fontSize={bosco === l.chiave ? 11 : 9}
                fontWeight={600}
                fill="var(--color-testo)"
                opacity={spento(l.chiave) ? 0.4 : 1}
                stroke="#fff"
                strokeWidth={3}
                strokeLinejoin="round"
                paintOrder="stroke"
                className="pointer-events-none transition-opacity duration-200"
              >
                {l.nome}
              </text>
            )
          })}
        </svg>
      </div>

      {/* Il titolo, in alto a sinistra. */}
      <div className="pointer-events-none absolute top-2 left-2 max-w-[calc(100%-64px)] rounded-xl bg-white/85 px-3 py-2 shadow-sm backdrop-blur-sm">
        <h2 className="text-lg leading-tight font-semibold">Foresta</h2>
        <p className="text-testo-tenue">
          {plurale(alberi, 'albero', 'alberi')} · {plurale(gruppi.length, 'boschetto', 'boschetti')}
          {arbusti !== null && ` · ${plurale(arbusti, 'arbusto', 'arbusti')}`}
        </p>
        {(inCrescita > 0 || secchi > 0) && (
          <p className="text-xs text-testo-tenue">
            {[inCrescita && `${inCrescita} in crescita`, secchi && plurale(secchi, 'secco', 'secchi')]
              .filter(Boolean)
              .join(' · ')}
          </p>
        )}
      </div>

      {/* Lo zoom, in alto a destra. */}
      <div className="absolute top-2 right-2 flex flex-col gap-1">
        <button
          type="button"
          className="grid size-10 place-items-center rounded-[11px] bg-white/85 shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-40"
          aria-label="Ingrandisci"
          disabled={zoom === ZOOM.length - 1}
          onClick={() => setZoom((z) => Math.min(z + 1, ZOOM.length - 1))}
        >
          <Plus className="size-5" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="grid size-10 place-items-center rounded-[11px] bg-white/85 shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-40"
          aria-label="Rimpicciolisci"
          disabled={zoom === 0}
          onClick={() => setZoom((z) => Math.max(z - 1, 0))}
        >
          <Minus className="size-5" aria-hidden="true" />
        </button>
      </div>

      {vuota && (
        <div className="pointer-events-none absolute inset-0 grid place-items-center p-4">
          <p className="flex max-w-xs flex-col items-center gap-2 rounded-xl bg-white/85 p-4 text-center backdrop-blur-sm">
            <Sprout className="size-8 text-salvia" aria-hidden="true" />
            Completa un'attività per piantare il primo albero, o fai una faccenda per un arbusto.
          </p>
        </div>
      )}

      {/* Il bosco scelto, in basso. */}
      {scelto && statistiche && (
        <section
          key={scelto.chiave}
          aria-label={`Il bosco ${scelto.nome}`}
          className="animate-entra absolute inset-x-2 bottom-[calc(8px+env(safe-area-inset-bottom))] mx-auto max-w-lg rounded-xl bg-white/90 p-3 shadow-lg backdrop-blur-sm"
        >
          <div className="flex items-center gap-2">
            {scelto.chiave ? (
              <span
                className="grid size-8 shrink-0 place-items-center rounded-lg text-xs font-semibold"
                style={{ background: coloreProgetto(scelto.nome) }}
                aria-hidden="true"
              >
                {iniziali(scelto.nome)}
              </span>
            ) : (
              <span className="grid size-8 shrink-0 place-items-center rounded-lg bg-pastello" aria-hidden="true">
                <Sprout className="size-4 text-salvia-scura" />
              </span>
            )}
            <div className="min-w-0 flex-1">
              <h3 className="truncate font-semibold">{scelto.nome}</h3>
              <p className="text-sm text-testo-tenue">
                {plurale(statistiche.perStato.completo, 'albero', 'alberi')} su{' '}
                {plurale(statistiche.totale, 'attività', 'attività')}
              </p>
            </div>
            <button
              type="button"
              className="grid size-10 shrink-0 place-items-center rounded-[11px] hover:bg-fondo"
              aria-label="Chiudi"
              onClick={() => setBosco(null)}
            >
              <X className="size-4" aria-hidden="true" />
            </button>
          </div>

          <div
            className="mt-2 h-2 overflow-hidden rounded-full bg-bordo"
            role="progressbar"
            aria-label="Completate"
            aria-valuenow={statistiche.percentuale}
            aria-valuemin={0}
            aria-valuemax={100}
          >
            <div className="h-full rounded-full bg-completo" style={{ width: `${statistiche.percentuale}%` }} />
          </div>
          <p className="mt-0.5 text-right text-xs text-testo-tenue">{statistiche.percentuale}% completato</p>

          <ul className="mt-1 grid grid-cols-4 gap-1.5">
            {ORDINE_STATI.map((stato) => {
              const { etichetta, icona: Icona, colori } = infoStati[stato]
              return (
                <li key={stato} className={`flex flex-col items-center rounded-lg px-1 py-1.5 ${colori}`}>
                  <span className="flex items-center gap-1 text-lg leading-tight font-semibold">
                    <Icona className="size-3.5" aria-hidden="true" />
                    {statistiche.perStato[stato]}
                  </span>
                  <span className="text-[11px]">{etichetta}</span>
                </li>
              )
            })}
          </ul>

          {statistiche.primo && (
            <p className="mt-2 text-xs text-testo-tenue">
              Primo albero il {data(statistiche.primo)}
              {statistiche.ultimo !== statistiche.primo && ` · ultimo il ${data(statistiche.ultimo)}`}
            </p>
          )}
        </section>
      )}
    </div>
  )
}

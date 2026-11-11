import type { Luce } from '../../dominio/ambiente'
import { generatore } from '../../dominio/caso'
import type { Specie } from '../../dominio/foresta'
import type { Festa } from '../../dominio/feste'

// Le decorazioni delle feste (doc/08-interfaccia.md, "Feste"): sugli alberi,
// sul prato, in cielo e sopra la scena. Come gli alberi, tutto viene dal seed:
// la stessa foresta nella stessa festa è sempre decorata uguale, e la foto
// dello sfondo non cambia da un'ora all'altra. Con meno movimento (lo sfondo)
// quello che si muove resta fermo dov'è, ma si vede.

const cifra = (n: number) => Math.round(n * 10) / 10

/** Dove sta la chioma di ogni specie, nelle coordinate dell'albero (prima della scala): centro, raggi e cima. */
const CHIOME: Record<Specie, { cy: number; rx: number; ry: number; cima: number }> = {
  conifera: { cy: -17, rx: 6, ry: 10, cima: -30 },
  tonda: { cy: -18, rx: 7, ry: 7, cima: -26 },
  betulla: { cy: -20, rx: 5.5, ry: 8, cima: -30 },
  cipresso: { cy: -17, rx: 3.5, ry: 11, cima: -31 },
  quercia: { cy: -17, rx: 10, ry: 6, cima: -27.5 },
  salice: { cy: -15, rx: 7.5, ry: 7, cima: -25.5 },
  pioppo: { cy: -20, rx: 3.5, ry: 11, cima: -32 },
  pino: { cy: -21, rx: 9, ry: 2.5, cima: -25 },
  acero: { cy: -19, rx: 7, ry: 8, cima: -30 },
  larice: { cy: -16, rx: 5, ry: 10, cima: -29 },
  ciliegio: { cy: -16, rx: 8, ry: 5, cima: -24 },
  ulivo: { cy: -18, rx: 8, ry: 4, cima: -24 },
}

/** Quanti alberi, su cento, si decorano in ogni festa (la stella di Natale a parte). */
const DECORATI: Partial<Record<Festa, number>> = {
  natale: 0.4,
  epifania: 0.3,
  carnevale: 0.4,
  san_valentino: 0.35,
  halloween: 0.3,
}

const PALLINE = ['#d63c3c', '#f2c14e', '#3c7dd6', '#e8e8f0']
const FILANTI = ['#ff5d8f', '#ffd23f', '#3bceac', '#5e60ce', '#ff8c42']

/** Un cuore con la punta in basso, centrato in (0, 0). */
const CUORE = 'M0,1.6 C-2.4,0 -2,-1.8 -0.9,-1.8 C-0.4,-1.8 0,-1.4 0,-1 C0,-1.4 0.4,-1.8 0.9,-1.8 C2,-1.8 2.4,0 0,1.6 Z'

/** Una stella a cinque punte di raggio `r`. */
function stella(r: number): string {
  return Array.from({ length: 10 }, (_, i) => {
    const a = (Math.PI / 5) * i - Math.PI / 2
    const d = i % 2 ? r * 0.45 : r
    return `${cifra(Math.cos(a) * d)},${cifra(Math.sin(a) * d)}`
  }).join(' ')
}

/**
 * Le decorazioni di un albero vivo nella festa, nelle sue coordinate (dentro
 * la sua scala). Solo alcuni alberi, scelti dal seed; la stella di Natale la
 * sceglie la scena, una per famiglia. `accese`: di notte le luci brillano.
 */
export function DecoroAlbero({
  festa,
  seed,
  specie,
  stella: conStella,
  accese,
}: {
  festa: Festa
  seed: number
  specie: Specie
  stella: boolean
  accese: boolean
}) {
  const caso = generatore(seed + 404)
  const decorato = caso() < (DECORATI[festa] ?? 0)
  const { cy, rx, ry, cima } = CHIOME[specie]
  /** Un punto a caso dentro la chioma, non troppo sul bordo. */
  const punto = (): [number, number] => {
    const a = caso() * Math.PI * 2
    const d = Math.sqrt(caso()) * 0.8
    return [cifra(Math.cos(a) * rx * d), cifra(cy + Math.sin(a) * ry * d)]
  }

  if (festa === 'natale') {
    const palline = decorato ? Array.from({ length: 5 }, punto) : []
    const lucine = decorato ? Array.from({ length: 6 }, punto) : []
    return (
      <g className="pointer-events-none">
        {lucine.map(([x, y], i) => (
          <g key={`l${i}`}>
            {accese && <circle cx={x} cy={y} r={2.6} fill="#fff2a0" opacity={0.6} />}
            <circle cx={x} cy={y} r={0.7} fill={accese ? '#fff6c2' : '#f3e6a0'} />
          </g>
        ))}
        {palline.map(([x, y], i) => (
          <g key={`p${i}`}>
            <circle cx={x} cy={y} r={1.3} fill={PALLINE[(i + seed) % PALLINE.length]} />
            <circle cx={x - 0.4} cy={y - 0.4} r={0.4} fill="#ffffff" opacity={0.7} />
          </g>
        ))}
        {conStella && (
          <g transform={`translate(0 ${cima - 1.5})`}>
            {accese && <circle r={6} fill="#fff2a0" opacity={0.55} />}
            <polygon points={stella(3.2)} fill="#f6c63c" stroke="#d9a21b" strokeWidth={0.4} />
          </g>
        )}
      </g>
    )
  }
  if (!decorato) return null

  switch (festa) {
    case 'epifania': {
      // Una o due calze appese ai rami bassi.
      const calze = Array.from({ length: caso() < 0.5 ? 1 : 2 }, (_, i) => [cifra((i ? 1 : -1) * rx * 0.45), cifra(cy + ry * 0.35)])
      return (
        <g className="pointer-events-none">
          {calze.map(([x, y], i) => (
            <g key={i} transform={`translate(${x} ${y})`}>
              <line x1={0} y1={-1.5} x2={0} y2={0.5} stroke="#6b5440" strokeWidth={0.3} />
              <path d="M-1,0.5 L1,0.5 L1,3.5 L2.4,4.4 L2.2,5.6 L-1,5 Z" fill={i ? '#2f7d4f' : '#c8323a'} />
              <rect x={-1.2} y={0.3} width={2.4} height={1.1} rx={0.3} fill="#f6f2ea" />
            </g>
          ))}
        </g>
      )
    }
    case 'carnevale': {
      // Due stelle filanti che girano attorno alla chioma.
      return (
        <g className="pointer-events-none" fill="none" strokeWidth={0.6} strokeLinecap="round">
          {[0, 1].map((i) => {
            const y = cifra(cy - ry * 0.4 + i * ry * 0.7)
            const onda = cifra(1.5 + caso() * 1.5)
            return (
              <path
                key={i}
                d={`M${-rx},${y} q${cifra(rx / 2)},${-onda} ${rx},0 t${rx},0`}
                stroke={FILANTI[(seed + i * 2) % FILANTI.length]}
              />
            )
          })}
        </g>
      )
    }
    case 'san_valentino': {
      const cuori = Array.from({ length: 2 + Math.floor(caso() * 2) }, punto)
      return (
        <g className="pointer-events-none">
          {cuori.map(([x, y], i) => (
            <path key={i} d={CUORE} transform={`translate(${x} ${y}) scale(1.1)`} fill={i % 2 ? '#f78fb3' : '#e8476f'} />
          ))}
        </g>
      )
    }
    case 'halloween': {
      // Una ragnatela su un fianco della chioma.
      const lato = caso() < 0.5 ? -1 : 1
      const cx = cifra(lato * rx * 0.55)
      const raggi = Array.from({ length: 6 }, (_, i) => (Math.PI / 3) * i)
      const anello = (r: number) => raggi.map((a) => `${cifra(cx + Math.cos(a) * r)},${cifra(cy + Math.sin(a) * r)}`).join(' ')
      return (
        <g className="pointer-events-none" fill="none" stroke="#f4f4f4" strokeWidth={0.25} opacity={0.85}>
          {raggi.map((a) => (
            <line key={a} x1={cx} y1={cy} x2={cifra(cx + Math.cos(a) * 4)} y2={cifra(cy + Math.sin(a) * 4)} />
          ))}
          <polygon points={anello(1.6)} />
          <polygon points={anello(3)} />
          <circle cx={cx} cy={cifra(cy + 1)} r={0.6} fill="#2b2b2b" stroke="none" />
        </g>
      )
    }
    default:
      return null
  }
}

// Sul prato --------------------------------------------------------------------------

/** L'ombra sul prato, come quella degli alberi. */
function Ombra({ rx }: { rx: number }) {
  return <ellipse cx={1.5} cy={0.5} rx={rx} ry={rx / 2} fill="#2e3a2d" fillOpacity={0.18} />
}

const CARTE = ['#c8323a', '#2f7d4f', '#3c6fd6', '#d9a21b', '#8e44ad']
const GUSCI = ['#f7c6d9', '#bfe3f7', '#fff1a8', '#c9f0c1', '#e3cdf7']

/** Un pacco regalo con il nastro e il fiocco. */
function Pacco({ seed }: { seed: number }) {
  const caso = generatore(seed + 17)
  const carta = CARTE[Math.floor(caso() * CARTE.length)]
  const nastro = carta === '#d9a21b' ? '#c8323a' : '#f6c63c'
  const l = cifra(3 + caso() * 1.5)
  const h = cifra(4 + caso() * 2)
  return (
    <g>
      <Ombra rx={l + 1} />
      {/* Due facce in vista: quella a destra più scura. */}
      <polygon points={`${-l},${-h} 0,${cifra(-h + l / 2)} 0,${cifra(l / 2)} ${-l},0`} fill={carta} />
      <polygon points={`0,${cifra(-h + l / 2)} ${l},${-h} ${l},0 0,${cifra(l / 2)}`} fill={carta} opacity={0.8} />
      <polygon points={`${-l},${-h} 0,${cifra(-h - l / 2)} ${l},${-h} 0,${cifra(-h + l / 2)}`} fill={carta} />
      <polygon points={`${-l},${-h} 0,${cifra(-h - l / 2)} ${l},${-h} 0,${cifra(-h + l / 2)}`} fill="#ffffff" opacity={0.18} />
      <line x1={0} y1={cifra(-h - l / 2)} x2={0} y2={cifra(l / 2)} stroke={nastro} strokeWidth={0.8} />
      <line x1={cifra(-l / 2)} y1={cifra(-h - l / 4)} x2={cifra(l / 2)} y2={cifra(-h + l / 4)} stroke={nastro} strokeWidth={0.8} />
      <circle cx={-1} cy={-h - 0.6} r={1} fill={nastro} />
      <circle cx={1} cy={-h - 0.6} r={1} fill={nastro} />
    </g>
  )
}

/** Due o tre uova colorate, a righe o a pois. */
function Uova({ seed }: { seed: number }) {
  const caso = generatore(seed + 29)
  const posti: [number, number][] = [
    [-3, 0],
    [2.5, -1],
    [0, 1.5],
  ]
  const quante = caso() < 0.5 ? 2 : 3
  return (
    <g>
      <Ombra rx={5} />
      {posti.slice(0, quante).map(([x, y], i) => {
        const guscio = GUSCI[Math.floor(caso() * GUSCI.length)]
        const decoro = CARTE[Math.floor(caso() * CARTE.length)]
        return (
          <g key={i} transform={`translate(${x} ${y})`}>
            <ellipse cx={0} cy={-2.6} rx={2} ry={2.7} fill={guscio} />
            {caso() < 0.5 ? (
              <path d="M-1.9,-2.6 L-1,-3.2 L0,-2.6 L1,-3.2 L1.9,-2.6" fill="none" stroke={decoro} strokeWidth={0.5} />
            ) : (
              <>
                <circle cx={-0.7} cy={-3.2} r={0.4} fill={decoro} />
                <circle cx={0.8} cy={-2.2} r={0.4} fill={decoro} />
              </>
            )}
            <ellipse cx={-0.6} cy={-3.6} rx={0.5} ry={0.8} fill="#ffffff" opacity={0.5} />
          </g>
        )
      })}
    </g>
  )
}

/** Un coniglietto bianco seduto, con le orecchie dritte. */
function Coniglio() {
  return (
    <g>
      <Ombra rx={4.5} />
      <ellipse cx={0} cy={-3} rx={3.4} ry={3} fill="#f4f1ec" />
      <circle cx={3} cy={-2} r={1} fill="#ffffff" />
      <circle cx={-2} cy={-6.2} r={2.2} fill="#f4f1ec" />
      <ellipse cx={-2.8} cy={-10} rx={0.7} ry={2.4} fill="#f4f1ec" />
      <ellipse cx={-1.4} cy={-10.2} rx={0.7} ry={2.4} fill="#e9e4dc" />
      <ellipse cx={-2.8} cy={-10} rx={0.3} ry={1.6} fill="#f2b8c6" />
      <circle cx={-2.8} cy={-6.6} r={0.35} fill="#3a3a3a" />
      <circle cx={-3.9} cy={-6} r={0.35} fill="#f2a0b4" />
    </g>
  )
}

/** Una zucca intagliata; di notte la candela dentro la accende. */
function Zucca({ seed, accesa }: { seed: number; accesa: boolean }) {
  const caso = generatore(seed + 41)
  const r = cifra(3.6 + caso() * 1.4)
  const occhi = accesa ? '#ffd65a' : '#5a2a10'
  return (
    <g>
      <Ombra rx={r + 1} />
      {accesa && <circle cx={0} cy={-r} r={r * 2.6} fill="#ffc46b" opacity={0.45} />}
      <ellipse cx={-r * 0.45} cy={-r} rx={r * 0.65} ry={r} fill="#e8782a" />
      <ellipse cx={r * 0.45} cy={-r} rx={r * 0.65} ry={r} fill="#d4661f" />
      <ellipse cx={0} cy={-r} rx={r * 0.6} ry={r * 1.02} fill="#f08a36" />
      <rect x={-0.5} y={-r * 2 - 1.6} width={1} height={1.9} rx={0.4} fill="#5b7a2e" />
      <polygon points={`${cifra(-r * 0.55)},${cifra(-r * 1.25)} ${cifra(-r * 0.25)},${cifra(-r * 1.25)} ${cifra(-r * 0.4)},${cifra(-r * 1.55)}`} fill={occhi} />
      <polygon points={`${cifra(r * 0.25)},${cifra(-r * 1.25)} ${cifra(r * 0.55)},${cifra(-r * 1.25)} ${cifra(r * 0.4)},${cifra(-r * 1.55)}`} fill={occhi} />
      <path
        d={`M${cifra(-r * 0.55)},${cifra(-r * 0.75)} L${cifra(-r * 0.3)},${cifra(-r * 0.55)} L0,${cifra(-r * 0.75)} L${cifra(r * 0.3)},${cifra(-r * 0.55)} L${cifra(r * 0.55)},${cifra(-r * 0.75)} L${cifra(r * 0.35)},${cifra(-r * 0.4)} L${cifra(-r * 0.35)},${cifra(-r * 0.4)} Z`}
        fill={occhi}
      />
    </g>
  )
}

/**
 * Una decorazione sul prato: pacchi a Natale, uova (e un coniglietto, il
 * primo) a Pasqua, zucche ad Halloween. Le altre feste non ne hanno.
 */
export function DecoroPrato({ festa, seed, primo, notte }: { festa: Festa; seed: number; primo: boolean; notte: boolean }) {
  // Più grandi del vero, o tra gli alberi non si vedrebbero.
  switch (festa) {
    case 'natale':
      return (
        <g transform="scale(1.25)">
          <Pacco seed={seed} />
        </g>
      )
    case 'pasqua':
      return <g transform="scale(1.7)">{primo ? <Coniglio /> : <Uova seed={seed} />}</g>
    case 'halloween':
      return (
        <g transform="scale(1.15)">
          <Zucca seed={seed} accesa={notte} />
        </g>
      )
    default:
      return null
  }
}

/** Le feste che mettono qualcosa sul prato, col seed dei loro posti. */
export const SEED_PRATO: Partial<Record<Festa, number>> = { natale: 1225, pasqua: 404, halloween: 1031 }

// In cielo -----------------------------------------------------------------------------

const COLORI_FUOCHI = ['#ff5d5d', '#ffd23f', '#5ec8ff', '#b388ff', '#7dff9a', '#ffffff']

/** I fuochi d'artificio: dove scoppiano (in % del cielo), quanto grandi e quando. */
const FUOCHI = Array.from({ length: 6 }, (_, i) => {
  const caso = generatore(2027 + i)
  return {
    x: 8 + caso() * 80,
    y: 6 + caso() * 30,
    r: 34 + caso() * 30,
    colore: COLORI_FUOCHI[i % COLORI_FUOCHI.length],
    ritardo: caso() * 3,
  }
})

/** Uno scoppio: raggi con una scintilla in punta. */
function Scoppio({ r, colore }: { r: number; colore: string }) {
  const raggi = Array.from({ length: 16 }, (_, i) => (Math.PI / 8) * i)
  return (
    <svg width={r * 2} height={r * 2} viewBox="-50 -50 100 100" aria-hidden="true">
      <circle r={16} fill={colore} opacity={0.15} />
      {raggi.map((a) => (
        <g key={a}>
          <line
            x1={cifra(Math.cos(a) * 12)}
            y1={cifra(Math.sin(a) * 12)}
            x2={cifra(Math.cos(a) * 40)}
            y2={cifra(Math.sin(a) * 40)}
            stroke={colore}
            strokeWidth={2}
            strokeLinecap="round"
            opacity={0.85}
          />
          <circle cx={cifra(Math.cos(a) * 44)} cy={cifra(Math.sin(a) * 44)} r={2.6} fill={colore} />
        </g>
      ))}
    </svg>
  )
}

/** La Befana a cavallo della scopa, col sacco: una sagoma scura. */
function Befana() {
  return (
    <svg width={86} height={44} viewBox="0 0 86 44" aria-hidden="true">
      <g fill="#2d2433">
        <path d="M4,30 L66,24 L66,27 L4,33 Z" fill="#6b4a2e" />
        <path d="M66,22 L84,16 L82,24 L84,34 L66,28 Z" fill="#c9a24a" />
        <path d="M30,30 Q28,18 34,12 L42,12 Q46,20 44,29 Z" />
        <circle cx={38} cy={9} r={4.5} fill="#e8c9a8" />
        <path d="M30,8 L46,6 L39,-4 Z" />
        <path d="M28,8 L48,6 L48,8 L28,10 Z" />
        <path d="M44,18 L52,26 L49,28 L42,22 Z" />
        <ellipse cx={22} cy={24} rx={7} ry={6} fill="#7a5a3a" />
      </g>
    </svg>
  )
}

/** Un pipistrello con le ali aperte: viola scuro, non nero, se no di notte sparisce. */
function Pipistrello() {
  return (
    <svg className="animate-batti" width={22} height={11} viewBox="0 0 22 11" aria-hidden="true">
      <path
        d="M11,4 L13,1 L13.5,4 Q17,1 21,3 Q18,4 18,7 Q16,5.5 14.5,7.5 Q12.5,6 11,8.5 Q9.5,6 7.5,7.5 Q6,5.5 4,7 Q4,4 1,3 Q5,1 8.5,4 L9,1 Z"
        fill="#5b4a72"
      />
    </svg>
  )
}

const PIPISTRELLI = Array.from({ length: 5 }, (_, i) => {
  const caso = generatore(1310 + i)
  return { alto: 6 + caso() * 32, partenza: caso(), durata: 26 + caso() * 20, scala: 0.8 + caso() * 0.6 }
})

/**
 * Quello che le feste mettono in cielo, sotto l'isola: i fuochi di Capodanno
 * (di notte), la Befana in volo, i pipistrelli di Halloween (dalla sera).
 */
export function CieloDiFesta({ festa, luce }: { festa: Festa | null; luce: Luce }) {
  if (festa === 'capodanno' && luce.buio > 0.5) {
    return (
      <>
        {FUOCHI.map((f, i) => (
          <div
            key={i}
            className="animate-scoppia absolute -translate-x-1/2 -translate-y-1/2"
            style={{ left: `${f.x}%`, top: `${f.y}%`, animationDelay: `${-f.ritardo}s` }}
          >
            <Scoppio r={f.r} colore={f.colore} />
          </div>
        ))}
      </>
    )
  }
  if (festa === 'epifania') {
    return (
      <div className="animate-viaggio absolute" style={{ top: '14%', left: '30%', animationDuration: '70s', animationDelay: '-21s' }}>
        <Befana />
      </div>
    )
  }
  if (festa === 'halloween' && luce.buio > 0.3) {
    return (
      <>
        {PIPISTRELLI.map((p, i) => (
          <div
            key={i}
            className="animate-viaggio absolute"
            style={{
              top: `${p.alto}%`,
              left: `${p.partenza * 100}%`,
              scale: p.scala,
              animationDuration: `${p.durata}s`,
              animationDelay: `${-p.partenza * p.durata}s`,
            }}
          >
            <Pipistrello />
          </div>
        ))}
      </>
    )
  }
  return null
}

// Sopra la scena ---------------------------------------------------------------------

const CORIANDOLI = ['#ff5d8f', '#ffd23f', '#3bceac', '#5e60ce', '#ff8c42', '#4cc9f0']
const DORATI = ['#f6c63c', '#ffe08a', '#e8e8f0', '#d9a21b']

/** Coriandoli e cuori: dove sono (in %), quanto in fretta e la forma. */
const PEZZI = Array.from({ length: 48 }, (_, i) => {
  const caso = generatore(4801 + i)
  return { x: caso() * 100, y: caso() * 100, durata: 9 + caso() * 9, giro: caso() * 360, tondo: caso() < 0.4 }
})

/**
 * Quello che cade o sale sopra la scena: coriandoli a Carnevale, coriandoli
 * dorati di giorno a Capodanno, cuoricini che salgono a San Valentino.
 */
export function PioggiaDiFesta({ festa, luce }: { festa: Festa | null; luce: Luce }) {
  const coriandoli = festa === 'carnevale' ? CORIANDOLI : festa === 'capodanno' && luce.buio <= 0.5 ? DORATI : null
  if (coriandoli) {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {PEZZI.map((p, i) => (
          <span
            key={i}
            className={`animate-cade absolute ${p.tondo ? 'rounded-full' : 'rounded-[1px]'}`}
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              width: p.tondo ? 6 : 5,
              height: p.tondo ? 6 : 9,
              background: coriandoli[i % coriandoli.length],
              rotate: `${p.giro}deg`,
              animationDuration: `${p.durata}s`,
              animationDelay: `${(-p.y / 100) * p.durata}s`,
            }}
          />
        ))}
      </div>
    )
  }
  if (festa === 'san_valentino') {
    return (
      <div className="pointer-events-none absolute inset-0 overflow-hidden" aria-hidden="true">
        {PEZZI.slice(0, 18).map((p, i) => (
          <svg
            key={i}
            className="animate-sale absolute"
            style={{
              left: `${p.x}%`,
              top: `${p.y}%`,
              animationDuration: `${p.durata * 1.6}s`,
              animationDelay: `${(-(100 - p.y) / 100) * p.durata * 1.6}s`,
            }}
            width={14}
            height={12}
            viewBox="-2.5 -2 5 4"
          >
            <path d={CUORE} fill={i % 2 ? '#f78fb3' : '#e8476f'} opacity={0.85} />
          </svg>
        ))}
      </div>
    )
  }
  return null
}

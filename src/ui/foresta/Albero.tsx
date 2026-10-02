import { generatore } from '../../dominio/caso'
import type { Stato } from '../../dominio/tipi'

// Alberi e arbusti disegnati in SVG (doc/08-interfaccia.md, "Foresta"): niente
// immagini, solo poche forme scelte dal seed. Lo stesso seed dà sempre lo
// stesso albero. La base è (0, 0), il centro della casella; si cresce verso
// l'alto (y negative). La luce viene da sinistra: lato destro più scuro.

const SPECIE = ['conifera', 'tonda', 'betulla', 'cipresso'] as const

const verde = (h: number, s: number, l: number) => `hsl(${h}, ${s}%, ${l}%)`
const cifra = (n: number) => Math.round(n * 10) / 10

/** L'ombra sul prato, uguale per tutti. */
function Ombra({ rx }: { rx: number }) {
  return <ellipse cx={1.5} cy={0.5} rx={rx} ry={rx / 2} fill="#2e3a2d" fillOpacity={0.18} />
}

/**
 * La pianta di un'attività, che cresce col suo stato: germoglio da fare,
 * alberello in corso, albero completo (con qualche frutto se `frutti`),
 * albero secco bloccato. Specie e colori vengono dal seed (l'id
 * dell'attività), quindi l'alberello diventa proprio quell'albero.
 */
export function Albero({ seed, stato, frutti = false }: { seed: number; stato: Stato; frutti?: boolean }) {
  if (stato === 'da_fare') return <Germoglio seed={seed} />
  if (stato === 'bloccato') return <AlberoSecco seed={seed} />
  return <AlberoVivo seed={seed} crescita={stato === 'completo' ? 1 : 0.55} frutti={stato === 'completo' && frutti} />
}

/** Un albero con le foglie; `crescita` < 1 è un alberello. */
function AlberoVivo({ seed, crescita, frutti }: { seed: number; crescita: number; frutti: boolean }) {
  const caso = generatore(seed)
  const specie = SPECIE[Math.floor(caso() * SPECIE.length)]
  const scala = cifra((0.85 + caso() * 0.35) * crescita)
  const h = Math.round(95 + caso() * 40)
  const s = Math.round(28 + caso() * 18)
  const l = Math.round(34 + caso() * 12)
  const base = verde(h, s, l)
  const scuro = verde(h, s, l - 9)
  const chiaro = verde(h, s, l + 10)
  const tronco = '#7a5a3c'
  const coloreFrutti = caso() < 0.5 ? '#d8573f' : '#e9a23b'

  return (
    <g>
      <Ombra rx={7 * scala} />
      <g transform={`scale(${scala})`}>
        {specie === 'conifera' && (
          <>
            <rect x={-1.5} y={-5} width={3} height={5} fill={tronco} />
            {[0, 1, 2].map((i) => {
              const larga = 10 - i * 2.5
              const sotto = -4 - i * 7
              const cima = sotto - 12
              return (
                <g key={i}>
                  <polygon points={`${-larga},${sotto} 0,${cima} ${larga},${sotto}`} fill={base} />
                  <polygon points={`0,${sotto} 0,${cima} ${larga},${sotto}`} fill={scuro} />
                </g>
              )
            })}
          </>
        )}
        {specie === 'tonda' && (
          <>
            <rect x={-1.5} y={-10} width={3} height={10} fill={tronco} />
            <circle cx={0} cy={-17} r={9} fill={scuro} />
            <circle cx={-2} cy={-19} r={7} fill={base} />
            <circle cx={-4} cy={-21} r={3} fill={chiaro} />
            {frutti && <Frutti colore={coloreFrutti} punti={[[-4, -14], [3, -18], [-1, -23]]} />}
          </>
        )}
        {specie === 'betulla' && (
          <>
            <rect x={-1.25} y={-14} width={2.5} height={14} fill="#efebe4" />
            <rect x={-1.25} y={-5} width={1.5} height={1} fill="#4a4a46" />
            <rect x={-0.25} y={-10} width={1.5} height={1} fill="#4a4a46" />
            <ellipse cx={0} cy={-20} rx={7} ry={10} fill={verde(h - 15, s, l + 6)} />
            <ellipse cx={-2} cy={-22} rx={4.5} ry={7} fill={verde(h - 15, s, l + 13)} />
            {frutti && <Frutti colore={coloreFrutti} punti={[[-3, -16], [3, -21], [0, -26]]} />}
          </>
        )}
        {specie === 'cipresso' && (
          <>
            <rect x={-1} y={-4} width={2} height={4} fill={tronco} />
            <ellipse cx={0} cy={-17} rx={5} ry={14} fill={scuro} />
            <ellipse cx={-1.2} cy={-18} rx={3.2} ry={12} fill={base} />
          </>
        )}
      </g>
    </g>
  )
}

/** Un'attività da fare: un germoglio con due foglie su un po' di terra smossa. */
function Germoglio({ seed }: { seed: number }) {
  const caso = generatore(seed)
  caso() // la specie: il germoglio non ce l'ha ancora
  caso()
  const h = Math.round(95 + caso() * 40)
  const verso = caso() < 0.5 ? 1 : -1
  return (
    <g>
      <ellipse cx={0} cy={0} rx={4.5} ry={2.2} fill="#8f6a47" />
      <path d={`M0,0 Q${verso * 0.8},-3 0,-6`} fill="none" stroke={verde(h, 40, 34)} strokeWidth={1} strokeLinecap="round" />
      <ellipse cx={-2.2} cy={-6.2} rx={2.4} ry={1.2} transform="rotate(-25 -2.2 -6.2)" fill={verde(h, 45, 44)} />
      <ellipse cx={2.2} cy={-6.6} rx={2.4} ry={1.2} transform="rotate(25 2.2 -6.6)" fill={verde(h, 45, 52)} />
    </g>
  )
}

/** Un'attività bloccata: un albero secco, rami spogli e qualche foglia secca. */
function AlberoSecco({ seed }: { seed: number }) {
  const caso = generatore(seed)
  const alto = 15 + caso() * 6
  const rami = [0.45, 0.65, 0.85].map((quota, i) => {
    const lato = i % 2 ? 1 : -1
    const lungo = 5 + caso() * 4
    const y = -alto * quota
    return { x1: 0, y1: cifra(y), x2: cifra(lato * lungo), y2: cifra(y - 3 - caso() * 4) }
  })
  const legno = '#7d6a58'
  return (
    <g>
      <Ombra rx={5} />
      <path d={`M-1.6,0 L-0.6,${cifra(-alto)} L0.6,${cifra(-alto)} L1.6,0 Z`} fill={legno} />
      {rami.map((r) => (
        <line key={r.y1} {...r} stroke={legno} strokeWidth={1.2} strokeLinecap="round" />
      ))}
      {rami.map((r) => (
        <line
          key={`r${r.y1}`}
          x1={cifra((r.x1 + r.x2) / 2)}
          y1={cifra((r.y1 + r.y2) / 2)}
          x2={cifra(r.x2 * 0.5)}
          y2={cifra(r.y2 - 3)}
          stroke={legno}
          strokeWidth={0.8}
          strokeLinecap="round"
        />
      ))}
      <ellipse cx={rami[0].x2} cy={rami[0].y2} rx={1.3} ry={0.8} fill="#b4823f" />
      <ellipse cx={rami[2].x2} cy={rami[2].y2 + 1} rx={1.3} ry={0.8} fill="#a0672e" />
    </g>
  )
}

function Frutti({ colore, punti }: { colore: string; punti: [number, number][] }) {
  return punti.map(([cx, cy]) => <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={1.4} fill={colore} />)
}

const FIORI = ['#f4c2d7', '#fff3b0', '#ffffff', '#e2c4f2']

/** Un cespuglio basso, a volte fiorito: una faccenda fatta. */
export function Arbusto({ seed }: { seed: number }) {
  const caso = generatore(seed + 7919)
  const h = Math.round(85 + caso() * 40)
  const l = Math.round(42 + caso() * 10)
  const fiore = caso() < 0.4 ? FIORI[Math.floor(caso() * FIORI.length)] : null
  const palle: [number, number, number][] = [
    [-3, -3, 3.2 + caso()],
    [3, -3, 3 + caso()],
    [0, -5.5, 3.5 + caso()],
  ]

  return (
    <g>
      <Ombra rx={6} />
      {palle.map(([cx, cy, r]) => (
        <circle key={cx * 10 + cy} cx={cx} cy={cy} r={cifra(r)} fill={verde(h, 35, l)} />
      ))}
      <circle cx={-1.5} cy={-6.5} r={1.8} fill={verde(h, 35, l + 10)} />
      {fiore &&
        [
          [-3, -5],
          [2.5, -6],
          [0, -3],
        ].map(([cx, cy]) => <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={1.1} fill={fiore} />)}
    </g>
  )
}

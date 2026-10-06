import type { Stagione } from '../../dominio/ambiente'
import { generatore } from '../../dominio/caso'
import type { Stato } from '../../dominio/tipi'

// Alberi, arbusti e rocce disegnati in SVG (doc/08-interfaccia.md, "Foresta"):
// niente immagini, solo poche forme scelte dal seed. Lo stesso seed dà sempre
// lo stesso albero; la stagione ne cambia solo i colori (e d'inverno le
// latifoglie perdono le foglie). La base è (0, 0), il centro della casella; si
// cresce verso l'alto (y negative). La luce viene da sinistra: lato destro più
// scuro.

const SPECIE = ['conifera', 'tonda', 'betulla', 'cipresso'] as const

const hsl = (h: number, s: number, l: number) => `hsl(${Math.round(h)}, ${Math.round(s)}%, ${Math.round(l)}%)`
const cifra = (n: number) => Math.round(n * 10) / 10
const NEVE = '#f7fafc'
const NEVE_OMBRA = '#dfe8f0'

/** L'ombra sul prato, uguale per tutti. */
function Ombra({ rx }: { rx: number }) {
  return <ellipse cx={1.5} cy={0.5} rx={rx} ry={rx / 2} fill="#2e3a2d" fillOpacity={0.18} />
}

interface PropsAlbero {
  seed: number
  stato: Stato
  stagione: Stagione
  frutti?: boolean
}

/**
 * La pianta di un'attività, che cresce col suo stato: germoglio da fare,
 * alberello in corso, albero completo (con qualche frutto se `frutti`),
 * albero secco bloccato. Specie e colori vengono dal seed (l'id
 * dell'attività), quindi l'alberello diventa proprio quell'albero.
 */
export function Albero({ seed, stato, stagione, frutti = false }: PropsAlbero) {
  if (stato === 'da_fare') return <Germoglio seed={seed} stagione={stagione} />
  if (stato === 'bloccato') return <AlberoSecco seed={seed} />
  return (
    <AlberoVivo
      seed={seed}
      stagione={stagione}
      crescita={stato === 'completo' ? 1 : 0.55}
      frutti={stato === 'completo' && frutti && (stagione === 'estate' || stagione === 'autunno')}
    />
  )
}

interface Chioma {
  base: string
  scuro: string
  chiaro: string
}

/**
 * I colori della chioma di una latifoglia nella stagione, o `null` d'inverno
 * (niente foglie). `caso` è il generatore delle stagioni, separato da quello
 * della forma.
 */
function chiomaLatifoglia(stagione: Stagione, h: number, s: number, l: number, caso: () => number): Chioma | null {
  switch (stagione) {
    case 'inverno':
      return null
    case 'autunno': {
      // Dal rosso all'ambra, ogni albero il suo; per lo più arancio.
      const t = 8 + caso() * 36
      const sa = 60 + caso() * 15
      const lu = 42 + caso() * 10
      return { base: hsl(t, sa, lu), scuro: hsl(t - 6, sa, lu - 10), chiaro: hsl(t + 8, sa, lu + 12) }
    }
    case 'primavera':
      // Qualche ciliegio in fiore; gli altri di un verde tenero.
      if (caso() < 0.3) return { base: '#f3b8ca', scuro: '#e597b0', chiaro: '#fbdbe5' }
      return { base: hsl(h - 8, s + 12, l + 8), scuro: hsl(h - 8, s + 12, l - 1), chiaro: hsl(h - 8, s + 12, l + 18) }
    default:
      return { base: hsl(h, s, l), scuro: hsl(h, s, l - 9), chiaro: hsl(h, s, l + 10) }
  }
}

/** Rami spogli a V, per le latifoglie d'inverno; con un filo di neve sopra. */
function RamiSpogli({ alto, legno, neve }: { alto: number; legno: string; neve: boolean }) {
  const rami: [number, number, number, number][] = [
    [0, -alto * 0.55, -6, -alto - 2],
    [0, -alto * 0.6, 6, -alto - 1],
    [0, -alto * 0.75, -2, -alto - 7],
    [-3, -alto * 0.85, -8, -alto * 0.95],
    [3, -alto * 0.8, 8, -alto - 5],
  ]
  return (
    <>
      {rami.map(([x1, y1, x2, y2]) => (
        <line key={`${x2},${y2}`} x1={x1} y1={cifra(y1)} x2={x2} y2={cifra(y2)} stroke={legno} strokeWidth={1.1} strokeLinecap="round" />
      ))}
      {neve &&
        rami.map(([, , x2, y2]) => <circle key={`n${x2},${y2}`} cx={x2} cy={cifra(y2)} r={1.1} fill={NEVE} />)}
    </>
  )
}

/** Un albero con le foglie; `crescita` < 1 è un alberello. */
function AlberoVivo({
  seed,
  stagione,
  crescita,
  frutti,
}: {
  seed: number
  stagione: Stagione
  crescita: number
  frutti: boolean
}) {
  const caso = generatore(seed)
  const specie = SPECIE[Math.floor(caso() * SPECIE.length)]
  const scala = cifra((0.85 + caso() * 0.35) * crescita)
  const h = Math.round(95 + caso() * 40)
  const s = Math.round(28 + caso() * 18)
  const l = Math.round(34 + caso() * 12)
  const coloreFrutti = caso() < 0.5 ? '#d8573f' : '#e9a23b'
  // Un generatore a parte per le stagioni: forma e colore d'estate non cambiano.
  const casoStagione = generatore(seed + 101)
  const inverno = stagione === 'inverno'
  // Le sempreverdi: in primavera un verde più fresco, d'inverno coperte di neve.
  const sempre = {
    base: hsl(h, s, l + (stagione === 'primavera' ? 4 : 0)),
    scuro: hsl(h, s, l - 9),
  }
  const tronco = '#7a5a3c'

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
              const cappello = 5
              const mezzo = (larga * cappello) / 12
              return (
                <g key={i}>
                  <polygon points={`${-larga},${sotto} 0,${cima} ${larga},${sotto}`} fill={sempre.base} />
                  <polygon points={`0,${sotto} 0,${cima} ${larga},${sotto}`} fill={sempre.scuro} />
                  {inverno && (
                    <>
                      <polygon
                        points={`0,${cima} ${cifra(mezzo)},${cima + cappello} ${cifra(mezzo / 3)},${cima + cappello - 1} ${cifra(-mezzo / 3)},${cima + cappello} ${cifra(-mezzo)},${cima + cappello - 0.5}`}
                        fill={NEVE}
                      />
                      <polygon points={`${-larga},${sotto} ${larga},${sotto} ${larga - 1},${sotto - 1.2} ${-larga + 1},${sotto - 1.2}`} fill={NEVE_OMBRA} />
                    </>
                  )}
                </g>
              )
            })}
          </>
        )}
        {specie === 'tonda' && <Tonda chioma={chiomaLatifoglia(stagione, h, s, l, casoStagione)} frutti={frutti} coloreFrutti={coloreFrutti} />}
        {specie === 'betulla' && (
          <Betulla chioma={chiomaLatifoglia(stagione, h - 15, s, l + 6, casoStagione)} frutti={frutti} coloreFrutti={coloreFrutti} />
        )}
        {specie === 'cipresso' && (
          <>
            <rect x={-1} y={-4} width={2} height={4} fill={tronco} />
            <ellipse cx={0} cy={-17} rx={5} ry={14} fill={sempre.scuro} />
            <ellipse cx={-1.2} cy={-18} rx={3.2} ry={12} fill={sempre.base} />
            {inverno && <path d="M-3.4,-26 Q0,-33 3.4,-26 Q1.5,-24.5 0,-25.5 Q-1.5,-24.5 -3.4,-26 Z" fill={NEVE} />}
          </>
        )}
      </g>
    </g>
  )
}

function Tonda({ chioma, frutti, coloreFrutti }: { chioma: Chioma | null; frutti: boolean; coloreFrutti: string }) {
  const tronco = '#7a5a3c'
  if (!chioma) {
    return (
      <>
        <rect x={-1.5} y={-10} width={3} height={10} fill={tronco} />
        <RamiSpogli alto={20} legno={tronco} neve />
      </>
    )
  }
  return (
    <>
      <rect x={-1.5} y={-10} width={3} height={10} fill={tronco} />
      <circle cx={0} cy={-17} r={9} fill={chioma.scuro} />
      <circle cx={-2} cy={-19} r={7} fill={chioma.base} />
      <circle cx={-4} cy={-21} r={3} fill={chioma.chiaro} />
      {frutti && <Frutti colore={coloreFrutti} punti={[[-4, -14], [3, -18], [-1, -23]]} />}
    </>
  )
}

function Betulla({ chioma, frutti, coloreFrutti }: { chioma: Chioma | null; frutti: boolean; coloreFrutti: string }) {
  const corteccia = (
    <>
      <rect x={-1.25} y={-14} width={2.5} height={14} fill="#efebe4" />
      <rect x={-1.25} y={-5} width={1.5} height={1} fill="#4a4a46" />
      <rect x={-0.25} y={-10} width={1.5} height={1} fill="#4a4a46" />
    </>
  )
  if (!chioma) {
    return (
      <>
        {corteccia}
        <RamiSpogli alto={24} legno="#d9d3c8" neve />
      </>
    )
  }
  return (
    <>
      {corteccia}
      <ellipse cx={0} cy={-20} rx={7} ry={10} fill={chioma.base} />
      <ellipse cx={-2} cy={-22} rx={4.5} ry={7} fill={chioma.chiaro} />
      {frutti && <Frutti colore={coloreFrutti} punti={[[-3, -16], [3, -21], [0, -26]]} />}
    </>
  )
}

/** Un'attività da fare: un germoglio con due foglie su un po' di terra smossa (o di neve). */
function Germoglio({ seed, stagione }: { seed: number; stagione: Stagione }) {
  const caso = generatore(seed)
  caso() // la specie: il germoglio non ce l'ha ancora
  caso()
  const h = stagione === 'autunno' ? 48 : Math.round(95 + caso() * 40)
  const verso = caso() < 0.5 ? 1 : -1
  return (
    <g>
      <ellipse cx={0} cy={0} rx={4.5} ry={2.2} fill={stagione === 'inverno' ? NEVE_OMBRA : '#8f6a47'} />
      <path d={`M0,0 Q${verso * 0.8},-3 0,-6`} fill="none" stroke={hsl(h, 40, 34)} strokeWidth={1} strokeLinecap="round" />
      <ellipse cx={-2.2} cy={-6.2} rx={2.4} ry={1.2} transform="rotate(-25 -2.2 -6.2)" fill={hsl(h, 45, 44)} />
      <ellipse cx={2.2} cy={-6.6} rx={2.4} ry={1.2} transform="rotate(25 2.2 -6.6)" fill={hsl(h, 45, 52)} />
    </g>
  )
}

/** Un'attività bloccata: un albero secco, rami spogli e qualche foglia secca. Uguale in ogni stagione. */
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

/** Due sassi grigi, uno grande e uno piccolo, girati dal seed; d'inverno con la neve sopra. */
export function Roccia({ seed, stagione }: { seed: number; stagione: Stagione }) {
  const caso = generatore(seed)
  const verso = caso() < 0.5 ? 1 : -1
  const grande = cifra(3.5 + caso() * 2)
  return (
    <g transform={`scale(${verso} 1)`}>
      <Ombra rx={grande + 1.5} />
      <polygon
        points={`${-grande},0 ${-grande * 0.7},${-grande * 0.9} ${grande * 0.2},${-grande * 1.1} ${grande},${-grande * 0.3} ${grande * 0.8},0`}
        fill="#a3a49c"
      />
      <polygon points={`${grande * 0.2},${-grande * 1.1} ${grande},${-grande * 0.3} ${grande * 0.8},0 ${grande * 0.1},0`} fill="#86877f" />
      <polygon points={`${grande + 1},0 ${grande + 1.8},-2 ${grande + 3.2},-1.6 ${grande + 3.4},0`} fill="#97988f" />
      {stagione === 'inverno' && (
        <polygon
          points={`${-grande * 0.75},${-grande * 0.8} ${grande * 0.2},${-grande * 1.12} ${grande * 0.9},${-grande * 0.4} ${grande * 0.3},${-grande * 0.65} ${-grande * 0.3},${-grande * 0.6}`}
          fill={NEVE}
        />
      )}
    </g>
  )
}

const FIORI = ['#f4c2d7', '#fff3b0', '#ffffff', '#e2c4f2']

/** Un cespuglio basso: una faccenda fatta. Fiorito in primavera, rosso in autunno, innevato d'inverno. */
export function Arbusto({ seed, stagione }: { seed: number; stagione: Stagione }) {
  const caso = generatore(seed + 7919)
  const autunno = stagione === 'autunno'
  const inverno = stagione === 'inverno'
  const h = autunno ? Math.round(8 + caso() * 28) : Math.round(85 + caso() * 40)
  const s = autunno ? 58 : inverno ? 25 : 35
  const l = Math.round((autunno ? 41 : 42) + caso() * 10) - (inverno ? 6 : 0)
  const fiorisce = caso() < (stagione === 'primavera' ? 0.85 : stagione === 'estate' ? 0.4 : 0)
  const fiore = fiorisce ? FIORI[Math.floor(caso() * FIORI.length)] : null
  const palle: [number, number, number][] = [
    [-3, -3, 3.2 + caso()],
    [3, -3, 3 + caso()],
    [0, -5.5, 3.5 + caso()],
  ]

  return (
    <g>
      <Ombra rx={6} />
      {palle.map(([cx, cy, r]) => (
        <circle key={cx * 10 + cy} cx={cx} cy={cy} r={cifra(r)} fill={hsl(h, s, l)} />
      ))}
      <circle cx={-1.5} cy={-6.5} r={1.8} fill={hsl(h, s, l + 10)} />
      {inverno && (
        <>
          <ellipse cx={0} cy={-8} rx={3.4} ry={1.6} fill={NEVE} />
          <ellipse cx={-3.2} cy={-5.4} rx={2.4} ry={1.1} fill={NEVE} />
          <ellipse cx={3.2} cy={-5.2} rx={2.2} ry={1} fill={NEVE} />
        </>
      )}
      {fiore &&
        [
          [-3, -5],
          [2.5, -6],
          [0, -3],
        ].map(([cx, cy]) => <circle key={`${cx},${cy}`} cx={cx} cy={cy} r={1.1} fill={fiore} />)}
    </g>
  )
}

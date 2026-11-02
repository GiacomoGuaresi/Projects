import type { Stagione } from '../../dominio/ambiente'
import { generatore } from '../../dominio/caso'
import { SPECIE, type Specie } from '../../dominio/foresta'
import type { Stato } from '../../dominio/tipi'

// Alberi, arbusti e rocce disegnati in SVG (doc/08-interfaccia.md, "Foresta"):
// niente immagini, solo poche forme scelte dal seed. Lo stesso seed dà sempre
// lo stesso albero; la stagione ne cambia solo i colori (e d'inverno le
// latifoglie perdono le foglie). La base è (0, 0), il centro della casella; si
// cresce verso l'alto (y negative). La luce viene da sinistra: lato destro più
// scuro.

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
  /** La specie del boschetto; `null` (gli Sparsi) la sceglie il seed. */
  specie: Specie | null
}

/**
 * La pianta di un'attività, che cresce col suo stato: germoglio da fare,
 * alberello in corso o bloccato, albero completo (circa uno su tre con
 * qualche frutto). La specie è quella del boschetto; forma e colori vengono
 * dal seed (l'id dell'attività), quindi l'alberello diventa proprio
 * quell'albero.
 */
export function Albero({ seed, stato, stagione, specie }: PropsAlbero) {
  if (stato === 'da_fare') return <Germoglio seed={seed} stagione={stagione} />
  return (
    <AlberoVivo
      seed={seed}
      specie={specie}
      stagione={stagione}
      crescita={stato === 'completo' ? 1 : 0.55}
      frutti={stato === 'completo' && generatore(seed + 202)() < 0.35 && (stagione === 'estate' || stagione === 'autunno')}
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
  specie: delBoschetto,
  stagione,
  crescita,
  frutti,
}: {
  seed: number
  specie: Specie | null
  stagione: Stagione
  crescita: number
  frutti: boolean
}) {
  const caso = generatore(seed)
  // Il numero si estrae sempre, così altezza e colori dell'albero non cambiano con la specie.
  const aCaso = SPECIE[Math.floor(caso() * SPECIE.length)]
  const specie = delBoschetto ?? aCaso
  const scala = cifra((1.1 + caso() * 0.35) * crescita)
  const h = Math.round(95 + caso() * 40)
  const s = Math.round(28 + caso() * 18)
  const l = Math.round(34 + caso() * 12)
  const coloreFrutti = caso() < 0.5 ? '#d8573f' : '#e9a23b'
  // Un generatore a parte per le stagioni: forma e colore d'estate non cambiano.
  const casoStagione = generatore(seed + 101)
  const inverno = stagione === 'inverno'
  // Le sempreverdi: in primavera un verde più fresco, d'inverno coperte di neve.
  const sempreverde = (dh: number, ds: number, dl: number) => ({
    base: hsl(h + dh, s + ds, l + dl + (stagione === 'primavera' ? 4 : 0)),
    scuro: hsl(h + dh, s + ds, l + dl - 9),
  })
  const sempre = sempreverde(0, 0, 0)
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
        {specie === 'quercia' && <Quercia chioma={chiomaLatifoglia(stagione, h - 5, s - 4, l - 4, casoStagione)} />}
        {specie === 'salice' && <Salice chioma={chiomaLatifoglia(stagione, h - 25, s + 8, l + 8, casoStagione)} />}
        {specie === 'pioppo' && <Pioppo chioma={chiomaLatifoglia(stagione, h - 15, s + 4, l + 5, casoStagione)} />}
        {specie === 'pino' && <Pino colori={sempreverde(15, -6, -3)} inverno={inverno} />}
        {specie === 'acero' && <Acero chioma={chiomaAcero(stagione, h, s, l, casoStagione)} />}
        {specie === 'larice' && <Larice stagione={stagione} h={h} s={s} l={l} />}
        {specie === 'ciliegio' && <Ciliegio chioma={chiomaCiliegio(stagione, h, s, l, casoStagione)} frutti={frutti} />}
        {specie === 'ulivo' && <Ulivo inverno={inverno} frutti={frutti} chiaro={l - 34} />}
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

/** L'acero: d'autunno sempre rosso acceso, dal vermiglio al cremisi. */
function chiomaAcero(stagione: Stagione, h: number, s: number, l: number, caso: () => number): Chioma | null {
  if (stagione !== 'autunno') return chiomaLatifoglia(stagione, h - 20, s + 6, l, caso)
  const t = caso() * 12
  return { base: hsl(t, 74, 48), scuro: hsl(t - 6, 72, 38), chiaro: hsl(t + 10, 82, 60) }
}

/** Il ciliegio: in primavera sempre in fiore. */
function chiomaCiliegio(stagione: Stagione, h: number, s: number, l: number, caso: () => number): Chioma | null {
  if (stagione === 'primavera') return { base: '#f6c1d1', scuro: '#e99ab4', chiaro: '#fde3ea' }
  return chiomaLatifoglia(stagione, h - 5, s, l + 2, caso)
}

/** La quercia: tronco grosso e chioma larga e bassa, a nuvole. */
function Quercia({ chioma }: { chioma: Chioma | null }) {
  const tronco = '#6f5236'
  const fusto = <path d="M-2.5,0 L-1.6,-11 L1.6,-11 L2.5,0 Z" fill={tronco} />
  if (!chioma) {
    return (
      <>
        {fusto}
        <RamiSpogli alto={19} legno={tronco} neve />
      </>
    )
  }
  return (
    <>
      {fusto}
      <circle cx={-6} cy={-14} r={6} fill={chioma.scuro} />
      <circle cx={6.5} cy={-14} r={6} fill={chioma.scuro} />
      <circle cx={0} cy={-19} r={8.5} fill={chioma.scuro} />
      <circle cx={-6.5} cy={-15.5} r={4.8} fill={chioma.base} />
      <circle cx={-1.5} cy={-20.5} r={6.5} fill={chioma.base} />
      <circle cx={4.5} cy={-16} r={4} fill={chioma.base} />
      <circle cx={-4} cy={-23} r={3} fill={chioma.chiaro} />
    </>
  )
}

/** Le fronde del salice, da sinistra a destra. */
const FRONDE = [-7.5, -4.5, -1.5, 1.5, 4.5, 7.5]

/** Il salice piangente: una cupola con le fronde che pendono; d'inverno restano i rametti gialli. */
function Salice({ chioma }: { chioma: Chioma | null }) {
  const tronco = '#7a5a3c'
  const fusto = <path d="M-1.6,0 L-0.8,-15 L1,-15 L1.6,0 Z" fill={tronco} />
  if (!chioma) {
    return (
      <>
        {fusto}
        <RamiSpogli alto={20} legno={tronco} neve />
        {FRONDE.map((x) => (
          <path key={x} d={`M${cifra(x * 0.6)},-19 Q${x},-17 ${x},-7`} fill="none" stroke="#b8a36a" strokeWidth={0.7} />
        ))}
      </>
    )
  }
  return (
    <>
      {fusto}
      <ellipse cx={0} cy={-19} rx={9} ry={6.5} fill={chioma.scuro} />
      {FRONDE.map((x, i) => (
        <path
          key={x}
          d={`M${x - 1.4},-18 Q${x},-12 ${x - 1},-6 L${x + 1},-6 Q${x + 1.6},-12 ${x + 1.4},-18 Z`}
          fill={i >= 3 ? chioma.scuro : chioma.base}
        />
      ))}
      <ellipse cx={-1.5} cy={-20.5} rx={6.5} ry={4.5} fill={chioma.base} />
      <ellipse cx={-3} cy={-22} rx={2.8} ry={1.8} fill={chioma.chiaro} />
    </>
  )
}

/** Il pioppo: alto e stretto a ciuffi, a differenza del cipresso perde le foglie. */
function Pioppo({ chioma }: { chioma: Chioma | null }) {
  const tronco = '#8a7a66'
  const fusto = <rect x={-1} y={-9} width={2} height={9} fill={tronco} />
  if (!chioma) {
    const rami: [number, number][] = [
      [-2.5, -28],
      [0, -32],
      [2.5, -27],
      [-1.8, -21],
      [1.8, -19],
    ]
    return (
      <>
        {fusto}
        {rami.map(([x, y]) => (
          <line key={`${x},${y}`} x1={0} y1={-8} x2={x} y2={y} stroke={tronco} strokeWidth={0.9} strokeLinecap="round" />
        ))}
        {rami.map(([x, y]) => (
          <circle key={`n${x},${y}`} cx={x} cy={y} r={0.9} fill={NEVE} />
        ))}
      </>
    )
  }
  return (
    <>
      {fusto}
      <ellipse cx={0} cy={-13} rx={4.2} ry={5} fill={chioma.scuro} />
      <ellipse cx={0} cy={-20} rx={4.6} ry={6} fill={chioma.scuro} />
      <ellipse cx={0} cy={-27} rx={3.4} ry={5} fill={chioma.scuro} />
      <ellipse cx={-1} cy={-14} rx={2.8} ry={4} fill={chioma.base} />
      <ellipse cx={-1.2} cy={-21} rx={3.1} ry={5} fill={chioma.base} />
      <ellipse cx={-0.8} cy={-28} rx={2.2} ry={3.8} fill={chioma.base} />
      <ellipse cx={-2} cy={-23} rx={1} ry={2.4} fill={chioma.chiaro} />
    </>
  )
}

/** Il pino domestico: fusto alto e un po' storto, chioma a ombrello in cima. Sempreverde. */
function Pino({ colori, inverno }: { colori: { base: string; scuro: string }; inverno: boolean }) {
  return (
    <>
      <path d="M-1.4,0 Q-0.5,-9 0.6,-19 L2,-19 Q1.4,-9 1.4,0 Z" fill="#8b5b3e" />
      <ellipse cx={1} cy={-20.5} rx={11} ry={4.6} fill={colori.scuro} />
      <ellipse cx={-0.2} cy={-22} rx={9} ry={3.6} fill={colori.base} />
      {inverno && <ellipse cx={-0.5} cy={-24.6} rx={7.5} ry={1.6} fill={NEVE} />}
    </>
  )
}

/** L'acero: chioma piena a lobi, d'autunno rossa. */
function Acero({ chioma }: { chioma: Chioma | null }) {
  const tronco = '#6e5440'
  const fusto = <rect x={-1.6} y={-11} width={3.2} height={11} fill={tronco} />
  if (!chioma) {
    return (
      <>
        {fusto}
        <RamiSpogli alto={21} legno={tronco} neve />
      </>
    )
  }
  return (
    <>
      {fusto}
      <circle cx={0} cy={-18} r={8.5} fill={chioma.scuro} />
      <circle cx={5.5} cy={-14.5} r={5} fill={chioma.scuro} />
      <circle cx={-5.5} cy={-14.5} r={5} fill={chioma.scuro} />
      <circle cx={0} cy={-25} r={5} fill={chioma.scuro} />
      <circle cx={-1.5} cy={-19.5} r={6.5} fill={chioma.base} />
      <circle cx={-5.5} cy={-15.5} r={3.8} fill={chioma.base} />
      <circle cx={-1.5} cy={-25.5} r={3.6} fill={chioma.base} />
      <circle cx={-4} cy={-22} r={2.4} fill={chioma.chiaro} />
    </>
  )
}

/** Il larice: una conifera che in autunno si fa d'oro e d'inverno perde gli aghi. */
function Larice({ stagione, h, s, l }: { stagione: Stagione; h: number; s: number; l: number }) {
  const tronco = '#7d5a40'
  if (stagione === 'inverno') {
    const rametti = [0, 1, 2, 3, 4, 5].map((i) => ({ y: -8 - i * 4, mezzo: 6 - i }))
    return (
      <>
        <path d="M-1.2,0 L-0.3,-31 L0.3,-31 L1.2,0 Z" fill={tronco} />
        {rametti.map(({ y, mezzo }) => (
          <g key={y}>
            <line x1={-mezzo} y1={y + 2} x2={0} y2={y} stroke="#9a7a5a" strokeWidth={0.8} strokeLinecap="round" />
            <line x1={mezzo} y1={y + 2} x2={0} y2={y} stroke="#9a7a5a" strokeWidth={0.8} strokeLinecap="round" />
            <circle cx={-mezzo} cy={y + 2} r={0.8} fill={NEVE} />
            <circle cx={mezzo} cy={y + 2} r={0.8} fill={NEVE} />
          </g>
        ))}
      </>
    )
  }
  const [th, ts, tl] =
    stagione === 'autunno' ? [44, 72, 52] : stagione === 'primavera' ? [95, 55, 52] : [h - 10, s + 5, l + 6]
  return (
    <>
      <rect x={-1} y={-6} width={2} height={6} fill={tronco} />
      {[0, 1, 2, 3].map((i) => {
        const larga = 7.5 - i * 1.5
        const sotto = -5 - i * 6
        const cima = sotto - 9
        return (
          <g key={i}>
            <polygon points={`${-larga},${sotto} 0,${cima} ${larga},${sotto}`} fill={hsl(th, ts, tl)} />
            <polygon points={`0,${sotto} 0,${cima} ${larga},${sotto}`} fill={hsl(th, ts, tl - 10)} />
          </g>
        )
      })}
    </>
  )
}

/** Il ciliegio: basso e allargato, fiorito in primavera, con le ciliegie d'estate. */
function Ciliegio({ chioma, frutti }: { chioma: Chioma | null; frutti: boolean }) {
  const tronco = '#5e4136'
  const fusto = (
    <>
      <rect x={-1.4} y={-9} width={2.8} height={9} fill={tronco} />
      <line x1={0} y1={-8} x2={-4} y2={-13} stroke={tronco} strokeWidth={1.6} strokeLinecap="round" />
      <line x1={0} y1={-8} x2={4} y2={-12.5} stroke={tronco} strokeWidth={1.6} strokeLinecap="round" />
    </>
  )
  if (!chioma) {
    return (
      <>
        {fusto}
        <RamiSpogli alto={18} legno={tronco} neve />
      </>
    )
  }
  return (
    <>
      {fusto}
      <circle cx={-6} cy={-15} r={5} fill={chioma.scuro} />
      <circle cx={5} cy={-15} r={5.5} fill={chioma.scuro} />
      <circle cx={0} cy={-18} r={6.5} fill={chioma.scuro} />
      <circle cx={-6.5} cy={-16} r={4} fill={chioma.base} />
      <circle cx={-1} cy={-19} r={5} fill={chioma.base} />
      <circle cx={-4} cy={-20} r={2.2} fill={chioma.chiaro} />
      {frutti && <Frutti colore="#c4243b" punti={[[-6, -12], [3, -13], [-1, -16], [6, -17]]} />}
    </>
  )
}

/** L'ulivo: tronco contorto e chioma grigio-verde a ciuffi, sempreverde, con le olive. */
function Ulivo({ inverno, frutti, chiaro }: { inverno: boolean; frutti: boolean; chiaro: number }) {
  // `chiaro` da 0 a 12: ogni ulivo un filo diverso.
  const l = 40 + chiaro / 2
  return (
    <>
      <path
        d="M-2.4,0 Q-1,-4 -2,-8 Q-2.5,-11 -4.5,-13 L-3,-13.5 Q-0.8,-11 0,-9 Q1.2,-12 3.5,-13.5 L4.5,-12.5 Q2,-10 1.6,-6 Q1.4,-3 2.6,0 Z"
        fill="#7b6a55"
      />
      <ellipse cx={-5} cy={-16} rx={5.5} ry={3.8} fill={hsl(88, 16, l)} />
      <ellipse cx={4.5} cy={-16.5} rx={5.5} ry={3.8} fill={hsl(88, 16, l)} />
      <ellipse cx={0} cy={-20} rx={6.5} ry={4.2} fill={hsl(88, 16, l)} />
      <ellipse cx={-5.5} cy={-17} rx={4} ry={2.8} fill={hsl(84, 17, l + 12)} />
      <ellipse cx={-0.8} cy={-21} rx={5} ry={3} fill={hsl(84, 17, l + 12)} />
      <ellipse cx={-3} cy={-22} rx={2.4} ry={1.4} fill={hsl(80, 16, l + 26)} />
      <ellipse cx={3} cy={-18} rx={2} ry={1.1} fill={hsl(80, 16, l + 22)} />
      {inverno && (
        <>
          <ellipse cx={0} cy={-23.6} rx={4} ry={1.1} fill={NEVE} />
          <ellipse cx={-5} cy={-19.8} rx={3} ry={0.9} fill={NEVE} />
          <ellipse cx={4.5} cy={-19.7} rx={3} ry={0.9} fill={NEVE} />
        </>
      )}
      {frutti && <Frutti colore="#3d3b2a" punti={[[-6, -14.5], [3, -14], [0, -17.5], [5.5, -15.5]]} />}
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

import { memo, useMemo, useState, type ReactNode, type SVGProps } from 'react'
import { GRADINO, inProfondita, LATO, proietta, verdeZolla, type Foresta } from '../../dominio/foresta'
import type { Stagione } from '../../dominio/ambiente'
import { LIVELLI, sorteggio, type CasellaTerreno } from '../../dominio/terreno'
import { Albero, Arbusto, Roccia } from './Albero'

// La scena della Foresta (doc/08-interfaccia.md, "Foresta"): l'isola in
// rilievo con le sue caselle, e sopra alberi, arbusti e rocce. Caselle e
// oggetti si disegnano in un solo ordine di profondità, così una collina
// davanti copre la base di un albero dietro.

/** Lo spessore della terra sotto il livello 0, in px. */
const SPESSORE = 10
/** Spazio sopra il prato per le chiome. */
const CHIOME = 48
/** La vista più piccola: una foresta di pochi alberi non diventa gigante. */
const VISTA_MINIMA = { larga: 560, alta: 320 }

type Punto = { x: number; y: number }
const punti = (...p: Punto[]) => p.map(({ x, y }) => `${Math.round(x * 10) / 10},${Math.round(y * 10) / 10}`).join(' ')
const giu = (p: Punto, px: number) => ({ x: p.x, y: p.y + px })

/**
 * Un poligono del terreno. Il bordo dello stesso colore copre le sottili
 * giunture che l'antialiasing lascia tra due caselle vicine.
 */
function Faccia({ punti, colore, ...resto }: { punti: string; colore: string } & SVGProps<SVGPolygonElement>) {
  return <polygon points={punti} fill={colore} stroke={colore} strokeWidth={0.6} strokeLinejoin="round" {...resto} />
}

/** L'erba di ogni stagione: tonalità, saturazione, luminosità (le caselle pari un filo più chiare). */
const ERBA: Record<Stagione, [number, number, number]> = {
  primavera: [104, 46, 72],
  estate: [97, 37, 74],
  autunno: [68, 36, 70],
  inverno: [205, 30, 95],
}

/** Il colore del piano di una casella. */
function colorePiano(c: CasellaTerreno, bosco: string | null, stagione: Stagione): string {
  const pari = (c.col + c.riga) % 2 === 0
  const inverno = stagione === 'inverno'
  switch (c.tipo) {
    case 'zolla': {
      const { h, s, l } = verdeZolla(c.chiave ?? '')
      // D'inverno la zolla è innevata, con appena il colore del boschetto.
      const [sa, lu] = inverno ? [Math.round(s * 0.35), 86] : stagione === 'autunno' ? [s, l + 2] : [s, l]
      const tinta = stagione === 'autunno' ? h - 18 : h
      if (bosco === null) return `hsl(${tinta}, ${sa}%, ${lu}%)`
      return bosco === c.chiave ? `hsl(${tinta}, ${sa + 5}%, ${lu + (inverno ? 4 : 8)}%)` : `hsl(${tinta}, ${Math.round(sa * 0.45)}%, ${Math.min(lu + 14, 94)}%)`
    }
    case 'acqua':
      if (inverno) return pari ? '#d3e8f3' : '#c8e1ef'
      return pari ? '#86bfdc' : '#7db7d6'
    case 'sentiero':
      if (inverno) return pari ? '#e4dfd6' : '#ddd7cc'
      return pari ? '#dcc79d' : '#d5bf93'
    default: {
      // Più in alto, un filo più chiaro: aiuta a leggere le colline.
      const [h, s, l] = ERBA[stagione]
      return `hsl(${h}, ${s}%, ${Math.min((pari ? l + 2 : l - 1) + c.altezza * 1.5, 98)}%)`
    }
  }
}

/** Le pareti tra due livelli di prato, a sinistra e a destra. */
const PARETI: Record<Stagione, [string, string]> = {
  primavera: ['#8db878', '#78a365'],
  estate: ['#93b07f', '#7e9a6b'],
  autunno: ['#a9a86e', '#93915c'],
  inverno: ['#c7d3de', '#b2c0cd'],
}

/** Sul prato: fiorellini in primavera, foglie cadute in autunno. Una casella su sei. */
function Decoro({ c, stagione, x, y }: { c: CasellaTerreno; stagione: Stagione; x: number; y: number }) {
  if (c.tipo !== 'prato' || (stagione !== 'primavera' && stagione !== 'autunno')) return null
  const n = sorteggio(c.col, c.riga, 77)
  if (n > 0.17) return null
  const colori = stagione === 'primavera' ? ['#ffffff', '#f6c6d8', '#fff0a6'] : ['#d9822b', '#c4532f', '#e6b33c']
  const punti: [number, number][] = [
    [-5, -1],
    [3, -2.5],
    [6, 1],
    [-1, 2],
  ]
  return (
    <g transform={`translate(${x} ${y})`} className="pointer-events-none">
      {punti.slice(0, 2 + Math.floor(n * 12)).map(([dx, dy], i) => (
        <ellipse key={i} cx={dx} cy={dy} rx={1.1} ry={0.7} fill={colori[(i + Math.floor(n * 30)) % 3]} />
      ))}
    </g>
  )
}

/**
 * Fa ondeggiare quello che contiene, dalla base. Ritmo e partenza vengono dal
 * seed, così gli alberi non si muovono tutti insieme; l'ampiezza la dà la
 * variabile CSS --vento, impostata dalla pagina.
 */
function Vento({ seed, children }: { seed: number; children: ReactNode }) {
  const n = sorteggio(seed, 0, 31)
  return (
    <g className="animate-ondeggia" style={{ animationDuration: `${3 + n * 2.5}s`, animationDelay: `${-n * 5}s` }}>
      {children}
    </g>
  )
}

const COLORI_FARFALLE = ['#f6d04d', '#f29ac0', '#ffffff', '#9fc3f5', '#f5a35c']

/** Una farfalla che gira lungo un anello battendo le ali (animazioni SVG, nascoste con meno movimento). */
function Farfalla({ percorso, colore, durata }: { percorso: string; colore: string; durata: number }) {
  return (
    <g className="farfalla pointer-events-none">
      <animateMotion path={percorso} dur={`${durata}s`} repeatCount="indefinite" rotate="auto" />
      {[-1, 1].map((lato) => (
        <ellipse key={lato} cx={0} cy={lato * 2.1} rx={2.4} ry={2.1} fill={colore} stroke="#5b4a3a" strokeWidth={0.3}>
          <animate attributeName="ry" values="2.1;0.4;2.1" dur="0.3s" repeatCount="indefinite" />
        </ellipse>
      ))}
      <ellipse cx={0} cy={0} rx={2.1} ry={0.5} fill="#4a3b2e" />
    </g>
  )
}

interface Props {
  foresta: Foresta
  /** Il boschetto scelto: il resto si spegne. */
  bosco: string | null
  /** Le piante già viste (`id:stato`): le altre crescono. */
  visti: Set<string> | null
  onScegli: (chiave: string | null) => void
  stagione: Stagione
  /** Di giorno in primavera ed estate, senza pioggia. */
  farfalle: boolean
  etichetta: string
  /** Quanto è ingrandita: 1 riempie lo spazio. */
  ingrandimento: number
}

/** L'isola: il disegno è pesante, quindi si rifà solo se cambia qualcosa che conta. */
export const Scena = memo(function Scena({ foresta, bosco, visti, onScegli, stagione, farfalle, etichetta, ingrandimento }: Props) {
  const { minCol, maxCol, minRiga, maxRiga } = foresta.limiti
  const alto = proietta(minCol - 0.5, minRiga - 0.5)
  const destra = proietta(maxCol + 0.5, minRiga - 0.5)
  const basso = proietta(maxCol + 0.5, maxRiga + 0.5)
  const sinistra = proietta(minCol - 0.5, maxRiga + 0.5)
  const contenuto = {
    x: sinistra.x - 8,
    y: alto.y - CHIOME - LIVELLI * GRADINO,
    larga: destra.x - sinistra.x + 16,
    alta: basso.y - alto.y + CHIOME + LIVELLI * GRADINO + SPESSORE + 32,
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

  const spento = (chiave: string) => bosco !== null && chiave !== bosco
  // Col mouse, il boschetto sotto il puntatore: se ne mostra il nome.
  const [sopra, setSopra] = useState<string | null>(null)

  // L'isola si ridisegna solo se cambia qualcosa che conta: passare col mouse non la tocca.
  const disegno = useMemo(() => {
    const altezze = new Map(foresta.caselle.map((c) => [`${c.col},${c.riga}`, c.altezza]))
    const scegli = (chiave: string) => (evento: { stopPropagation: () => void }) => {
      evento.stopPropagation()
      onScegli(chiave)
    }

    /** Una casella: il piano alla sua altezza e le pareti verso le caselle davanti più basse. */
    const casella = (c: CasellaTerreno): ReactNode => {
      const { col, riga, altezza } = c
      const sx = proietta(col - 0.5, riga + 0.5, altezza)
      const su = proietta(col - 0.5, riga - 0.5, altezza)
      const dx = proietta(col + 0.5, riga - 0.5, altezza)
      const gi = proietta(col + 0.5, riga + 0.5, altezza)
      // Quanto scende la parete: fino alla casella davanti, o fino al fondo dell'isola.
      const caduta = (vicina: number | undefined) =>
        vicina === undefined ? altezza * GRADINO + SPESSORE : (altezza - vicina) * GRADINO
      const sinistraGiu = caduta(altezze.get(`${col},${riga + 1}`))
      const destraGiu = caduta(altezze.get(`${col + 1},${riga}`))
      const bordo = (vicina: number | undefined) => vicina === undefined
      const zolla = c.tipo === 'zolla' && c.chiave !== undefined
      return (
        <g key={`c${col},${riga}`}>
          {sinistraGiu > 0 && (
            <Faccia
              punti={punti(sx, gi, giu(gi, sinistraGiu), giu(sx, sinistraGiu))}
              colore={bordo(altezze.get(`${col},${riga + 1}`)) ? '#8f6a47' : PARETI[stagione][0]}
            />
          )}
          {destraGiu > 0 && (
            <Faccia
              punti={punti(gi, dx, giu(dx, destraGiu), giu(gi, destraGiu))}
              colore={bordo(altezze.get(`${col + 1},${riga}`)) ? '#76563a' : PARETI[stagione][1]}
            />
          )}
          <Faccia
            punti={punti(su, dx, gi, sx)}
            colore={colorePiano(c, bosco, stagione)}
            className={zolla ? 'cursor-pointer' : undefined}
            onClick={zolla ? scegli(c.chiave!) : undefined}
            data-bosco={zolla ? c.chiave : undefined}
          />
          <Decoro c={c} stagione={stagione} {...proietta(col, riga, altezza)} />
        </g>
      )
    }

    let ordine = 0
    const oggetto = (e: Foresta['elementi'][number]): ReactNode => {
      const { x, y } = proietta(e.col, e.riga, e.altezza)
      if (e.tipo === 'roccia') {
        return (
          <g key={`r${e.col},${e.riga}`} transform={`translate(${x} ${y})`} className="pointer-events-none">
            <Roccia seed={e.seed} stagione={stagione} />
          </g>
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
            <Vento seed={e.seed + 13}>
              <Arbusto seed={e.seed} stagione={stagione} />
            </Vento>
          </g>
        )
      }
      const nuovo = !visti?.has(`${e.albero.id}:${e.albero.stato}`)
      return (
        <g
          key={`t${e.albero.id}`}
          transform={`translate(${x} ${y})`}
          opacity={spento(e.chiave) ? 0.3 : 1}
          className="cursor-pointer transition-opacity duration-200"
          onClick={scegli(e.chiave)}
          data-bosco={e.chiave}
        >
          <g
            className={nuovo ? 'animate-cresci' : undefined}
            style={nuovo ? { animationDelay: `${Math.min(ordine++ * 40, 1500)}ms` } : undefined}
          >
            <Vento seed={e.albero.id}>
              <Albero seed={e.albero.id} stato={e.albero.stato} stagione={stagione} frutti={e.albero.priorita >= 4} />
            </Vento>
          </g>
        </g>
      )
    }

    // Caselle e oggetti insieme, da dietro in avanti; a parità, prima la casella.
    const strati = [
      ...foresta.caselle.map((c) => ({ c, o: 0 as const, disegna: () => casella(c) })),
      ...foresta.elementi.map((e) => ({ c: e, o: 1 as const, disegna: () => oggetto(e) })),
    ].sort((a, b) => inProfondita(a.c, b.c) || a.o - b.o)
    return strati.map((s) => s.disegna())
  }, [foresta, bosco, visti, stagione, onScegli])

  return (
    <svg
      viewBox={`${vista.x} ${vista.y} ${vista.larga} ${vista.alta}`}
      preserveAspectRatio="xMidYMid meet"
      className="block select-none"
      style={{ width: `${ingrandimento * 100}%`, height: `${ingrandimento * 100}%` }}
      role="img"
      aria-label={etichetta}
      onClick={() => onScegli(null)}
      onPointerOver={(e) => {
        if (e.pointerType !== 'mouse') return
        setSopra((e.target as Element).closest('[data-bosco]')?.getAttribute('data-bosco') ?? null)
      }}
      onPointerLeave={() => setSopra(null)}
    >
      <defs>
        <filter id="sfuma-ombra" x="-50%" y="-200%" width="200%" height="500%">
          <feGaussianBlur stdDeviation={10} />
        </filter>
      </defs>

      {/* L'ombra dell'isola sospesa. */}
      <ellipse
        cx={(sinistra.x + destra.x) / 2}
        cy={basso.y + SPESSORE + 6}
        rx={(destra.x - sinistra.x) * 0.32}
        ry={6 + (basso.y - alto.y) * 0.04}
        fill="#2e3a2d"
        fillOpacity={0.18}
        filter="url(#sfuma-ombra)"
      />

      {disegno}

      {/* Le farfalle girano attorno ai boschetti. */}
      {farfalle &&
        foresta.lotti.slice(0, 6).map((l, i) => {
          const { x, y } = proietta(l.col, l.riga, l.altezza)
          const rx = 10 + l.raggio * 8
          const ry = 5 + l.raggio * 4
          const n = sorteggio(l.col, l.riga, 53)
          return (
            <Farfalla
              key={l.chiave}
              percorso={`M${x - rx},${y - 22} a${rx},${ry} 0 1,0 ${rx * 2},0 a${rx},${ry} 0 1,0 ${-rx * 2},0`}
              colore={COLORI_FARFALLE[i % COLORI_FARFALLE.length]}
              durata={9 + n * 6}
            />
          )
        })}

      {/* Il nome del boschetto scelto o sotto il mouse, sopra tutto. */}
      {foresta.lotti.filter((l) => l.chiave === bosco || l.chiave === sopra).map((l) => {
        const { x, y } = proietta(l.col, l.riga, l.altezza)
        return (
          <text
            key={l.chiave}
            x={x}
            y={y + (l.raggio * Math.SQRT2 * LATO) / 4 + 14}
            textAnchor="middle"
            fontSize={bosco === l.chiave ? 11 : 10}
            fontWeight={600}
            fill="var(--color-testo)"
            stroke="#fff"
            strokeWidth={3}
            strokeLinejoin="round"
            paintOrder="stroke"
            className="animate-dissolvi pointer-events-none"
          >
            {l.nome}
          </text>
        )
      })}
    </svg>
  )
})

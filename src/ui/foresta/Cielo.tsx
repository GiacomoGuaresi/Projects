import { memo } from 'react'
import type { Luce, Meteo } from '../../dominio/ambiente'
import { generatore } from '../../dominio/caso'
import { mescola } from '../../dominio/colori'

// Il cielo della Foresta (doc/08-interfaccia.md, "Foresta"): colore dall'ora
// e dal meteo, sole di giorno, luna con la sua fase e stelle di notte, nuvole
// quante ne vuole il meteo, spinte dal vento.

/** Sopra e sotto del cielo, nelle varie condizioni. */
const CIELO = {
  giorno: ['#8ec9ee', '#e4f2fa'],
  coperto: ['#a3afb9', '#d9dfe3'],
  temporale: ['#6f7a86', '#aab3bb'],
  tramonto: ['#e98a8a', '#fbcf9c'],
  notte: ['#0d1b36', '#2a3d63'],
} as const

/** Quanto il meteo copre il cielo, da 0 a 1. */
export function copertura(meteo: Meteo): number {
  if (meteo.cielo === 'sereno') return 0
  if (meteo.cielo === 'nuvoloso') return meteo.intensita * 0.7
  return 0.6 + meteo.intensita * 0.4
}

/** I colori del cielo, sopra e sotto. */
export function coloriCielo(luce: Luce, meteo: Meteo): [string, string] {
  const coperto = copertura(meteo)
  const grigio = meteo.cielo === 'temporale' ? CIELO.temporale : CIELO.coperto
  return [0, 1].map((i) => {
    const diGiorno = mescola(CIELO.giorno[i], grigio[i], coperto)
    const caldo = mescola(diGiorno, CIELO.tramonto[i], luce.tinta * (1 - coperto * 0.6))
    // Ad alba e tramonto il buio pesa meno: il cielo resta rosa invece di diventare marrone.
    return mescola(caldo, CIELO.notte[i], luce.buio * 0.95 * (1 - luce.tinta * 0.7))
  }) as [string, string]
}

/** Quante nuvole e di che grigio, dal meteo. */
function nuvole(meteo: Meteo): { quante: number; colore: string } {
  switch (meteo.cielo) {
    case 'sereno':
      return { quante: meteo.intensita > 0 ? 3 : 2, colore: '#ffffff' }
    case 'nuvoloso':
      return { quante: 4 + Math.round(meteo.intensita * 5), colore: mescola('#ffffff', '#c9d0d6', meteo.intensita) }
    case 'nebbia':
      return { quante: 3, colore: '#e3e7ea' }
    case 'temporale':
      return { quante: 9, colore: '#8a939c' }
    default:
      return { quante: 8, colore: mescola('#d4dade', '#a9b2ba', meteo.intensita) }
  }
}

/** Le nuvole possibili: posizione, grandezza e tempo, fissi. */
const POSTI_NUVOLE = Array.from({ length: 10 }, (_, i) => {
  const caso = generatore(900 + i)
  return { alto: 3 + caso() * 30, scala: 0.5 + caso() * 0.8, partenza: caso(), lentezza: 0.75 + caso() * 0.5 }
})

const STELLE = Array.from({ length: 60 }, (_, i) => {
  const caso = generatore(300 + i)
  return { x: caso() * 100, y: caso() * 55, r: 0.6 + caso() * 1.1, ritardo: caso() * 4, durata: 2 + caso() * 3 }
})

function Nuvola({ scala, colore }: { scala: number; colore: string }) {
  return (
    <svg width={120 * scala} height={48 * scala} viewBox="0 0 120 48" aria-hidden="true">
      <g fill={colore}>
        <ellipse cx={60} cy={34} rx={52} ry={13} />
        <circle cx={40} cy={26} r={16} />
        <circle cx={66} cy={20} r={20} />
        <circle cx={88} cy={30} r={12} />
      </g>
    </svg>
  )
}

/**
 * La luna con la sua fase: la parte illuminata a destra mentre cresce, a
 * sinistra mentre cala. In cielo è grande 40px; l'overlay dello sfondo la usa più piccola.
 */
export function Luna({ fase, dimensione = 40 }: { fase: number; dimensione?: number }) {
  const r = 14
  const k = Math.cos(2 * Math.PI * fase)
  const terminatore = Math.abs(k) * r
  // Falce (k > 0): il terminatore curva verso il lato illuminato; gobba: verso l'altro.
  const illuminata = `M0,${-r} A${r},${r} 0 0 1 0,${r} A${terminatore},${r} 0 0 ${k > 0 ? 0 : 1} 0,${-r} Z`
  return (
    <svg width={dimensione} height={dimensione} viewBox="-20 -20 40 40" aria-hidden="true">
      <circle r={r + 5} fill="#fff8e1" opacity={0.12} />
      <circle r={r} fill="#3a4865" />
      <path d={illuminata} fill="#fdf6dc" transform={fase > 0.5 ? 'scale(-1 1)' : undefined} />
    </svg>
  )
}

/** Gli stormi: altezza, quanti uccelli, partenza nel giro. */
const STORMI = [
  { alto: 14, quanti: 4, partenza: 0.1, durata: 45 },
  { alto: 24, quanti: 3, partenza: 0.65, durata: 60 },
]

/** Uno stormo a V di piccoli uccelli che battono le ali. */
function Stormo({ quanti }: { quanti: number }) {
  return (
    <div className="relative h-8 w-16">
      {Array.from({ length: quanti }, (_, i) => (
        <svg
          key={i}
          className="animate-batti absolute"
          style={{ left: i * 11, top: Math.abs(i - 1) * 6, animationDelay: `${i * 0.11}s` }}
          width={14}
          height={8}
          viewBox="0 0 14 8"
          aria-hidden="true"
        >
          <path d="M1,5 Q4,0 7,5 Q10,0 13,5" fill="none" stroke="#3b4652" strokeWidth={1.4} strokeLinecap="round" />
        </svg>
      ))}
    </div>
  )
}

interface Props {
  luce: Luce
  meteo: Meteo
  /** Da 0 a 1: le nuvole corrono di più. */
  vento: number
  luna: number
}

/** Lo sfondo della scena: sta sotto l'isola e non si tocca. */
export const Cielo = memo(function Cielo({ luce, meteo, vento, luna }: Props) {
  const [sopra, sotto] = coloriCielo(luce, meteo)
  const coperto = copertura(meteo)
  const { quante, colore } = nuvole(meteo)
  const coloreNuvole = mescola(colore, '#3b4763', luce.buio * 0.75)
  // Una nuvola attraversa il cielo in 2–4 minuti, meno col vento.
  const traversata = 240 - vento * 150
  const stelle = luce.buio * (1 - coperto)
  const sole = (1 - luce.buio) * (1 - coperto)

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-hidden transition-[background] duration-1000"
      style={{ background: `linear-gradient(to bottom, ${sopra}, ${sotto})` }}
      aria-hidden="true"
    >
      {stelle > 0.05 &&
        STELLE.map((s, i) => (
          <span
            key={i}
            className="animate-brilla absolute rounded-full bg-white"
            style={{
              left: `${s.x}%`,
              top: `${s.y}%`,
              width: s.r * 2,
              height: s.r * 2,
              opacity: stelle,
              animationDelay: `${s.ritardo}s`,
              animationDuration: `${s.durata}s`,
            }}
          />
        ))}

      {sole > 0.05 && (
        <div
          className="absolute size-16 rounded-full transition-[top,opacity] duration-1000"
          style={{
            right: '14%',
            top: luce.tinta > 0 ? '26%' : '9%',
            opacity: sole,
            background: luce.tinta > 0 ? '#ffb46b' : '#fff3b8',
            boxShadow: `0 0 40px 18px ${luce.tinta > 0 ? 'rgb(255 170 100 / 0.45)' : 'rgb(255 243 184 / 0.55)'}`,
          }}
        />
      )}

      {luce.buio > 0.4 && (
        <div className="absolute" style={{ right: '12%', top: '8%', opacity: (luce.buio - 0.4) / 0.6 * (1 - coperto * 0.8) }}>
          <Luna fase={luna} />
        </div>
      )}

      {luce.buio < 0.5 &&
        (meteo.cielo === 'sereno' || meteo.cielo === 'nuvoloso') &&
        STORMI.map((s, i) => (
          <div
            key={i}
            className="animate-volo absolute"
            style={{ top: `${s.alto}%`, animationDuration: `${s.durata}s`, animationDelay: `${-s.partenza * s.durata}s` }}
          >
            <Stormo quanti={s.quanti} />
          </div>
        ))}

      {POSTI_NUVOLE.slice(0, quante).map((n, i) => (
        <div
          key={i}
          className="animate-attraversa absolute"
          style={{
            top: `${n.alto}%`,
            // Il posto da ferma, se si è chiesto meno movimento.
            left: `${n.partenza * 100 - 10}%`,
            animationDuration: `${traversata * n.lentezza}s`,
            // Ritardo negativo: all'apertura ogni nuvola è già a un punto diverso del viaggio.
            animationDelay: `${-n.partenza * traversata * n.lentezza}s`,
            opacity: 0.85,
          }}
        >
          <Nuvola scala={n.scala} colore={coloreNuvole} />
        </div>
      ))}
    </div>
  )
})

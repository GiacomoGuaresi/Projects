import type { ReactNode } from 'react'
import { Cloud, CloudFog, CloudLightning, CloudRain, CloudSnow, Moon, Sun, Sunrise, Sunset, Trees } from 'lucide-react'
import { CASA, nomeFaseLunare, type Cielo } from '../../dominio/ambiente'
import { quandoFa, type NumeriForesta } from '../../dominio/foresta'
import type { OpzioniSfondo, PosizioneSfondo } from '../rotta'
import { Luna } from './Cielo'
import { nomiAmbiente } from './SelettoreAmbiente'
import type { Ambiente } from './useAmbiente'

// L'overlay dello sfondo (doc/08-interfaccia.md, "Modalità sfondo"): una card a
// vetro scuro sopra la scena, con i pannelli chiesti nell'hash. La foto è
// pubblica, quindi solo numeri, meteo e date: niente titoli né nomi di progetti.
// La foto cambia ogni ora: niente orologio, ma "aggiornato alle".

interface Props {
  opzioni: OpzioniSfondo
  ambiente: Ambiente
  numeri: NumeriForesta
}

/**
 * Lontano dai bordi (barra dei menu del Mac, Dock, barra di Windows), e
 * rimpicciolita verso il suo angolo: così resta alla stessa distanza dai bordi.
 */
const POSIZIONI: Record<PosizioneSfondo, string> = {
  'basso-sinistra': 'bottom-24 left-8 origin-bottom-left',
  'alto-sinistra': 'top-12 left-8 origin-top-left',
  'basso-destra': 'bottom-24 right-8 origin-bottom-right',
  'alto-destra': 'top-12 right-8 origin-top-right',
}

/** La card è disegnata a 380px di larghezza e mostrata a 2/3: discreta, sullo sfondo. */
const SCALA = 2 / 3

const ICONE_CIELO: Record<Cielo, typeof Sun> = {
  sereno: Sun,
  nuvoloso: Cloud,
  nebbia: CloudFog,
  pioggia: CloudRain,
  temporale: CloudLightning,
  neve: CloudSnow,
}

const plurale = (n: number, uno: string, tanti: string) => `${n} ${n === 1 ? uno : tanti}`
const ora = (d: Date) => d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' })

export function OverlaySfondo({ opzioni, ambiente, numeri }: Props) {
  const adesso = new Date()
  return (
    <div
      className={`pointer-events-none absolute ${POSIZIONI[opzioni.posizione]} flex w-[380px] flex-col gap-3 rounded-2xl bg-[#0f1a14]/55 p-4 text-white shadow-lg backdrop-blur-md`}
      // Inter dopo Avenir: sul runner Linux della pipeline Avenir non c'è.
      style={{ fontFamily: "'Avenir Next', Inter, 'Segoe UI', system-ui, sans-serif", scale: SCALA }}
    >
      {opzioni.pannelli.map((pannello) =>
        pannello === 'oggi' ? (
          <Oggi key={pannello} ambiente={ambiente} adesso={adesso} />
        ) : (
          <Numeri key={pannello} numeri={numeri} adesso={adesso} />
        ),
      )}
      <p className="text-xs text-white/60">aggiornato alle {ora(adesso)}</p>
    </div>
  )
}

function Riga({ children, className = '' }: { children: ReactNode; className?: string }) {
  return <p className={`flex items-center gap-1.5 ${className}`}>{children}</p>
}

function Oggi({ ambiente, adesso }: { ambiente: Ambiente; adesso: Date }) {
  const giorno = adesso.toLocaleDateString('it-IT', { weekday: 'long', day: 'numeric', month: 'long' })
  // Di notte col cielo sereno la luna, non il sole.
  const Icona = ambiente.meteo.cielo === 'sereno' && ambiente.luce.buio > 0.5 ? Moon : ICONE_CIELO[ambiente.meteo.cielo]
  const luna = nomeFaseLunare(ambiente.luna)
  return (
    <section className="flex flex-col gap-1">
      <h2 className="text-lg leading-tight font-semibold first-letter:uppercase">
        {giorno} · {nomiAmbiente[ambiente.stagione]}
      </h2>
      <Riga>
        <Icona className="size-5 shrink-0" aria-hidden="true" />
        {ambiente.temperatura !== null && <strong>{Math.round(ambiente.temperatura)}°</strong>}
        <span>
          {ambiente.temperatura !== null && '· '}
          {nomiAmbiente[ambiente.meteo.cielo].toLowerCase()}
          {ambiente.meteoVero && ` a ${CASA.nome}`}
        </span>
      </Riga>
      <Riga className="text-sm text-white/85">
        <Sunrise className="size-4 shrink-0" aria-hidden="true" />
        {ora(ambiente.sole.alba)}
        <Sunset className="ml-2 size-4 shrink-0" aria-hidden="true" />
        {ora(ambiente.sole.tramonto)}
        <span className="ml-2 flex items-center gap-1">
          <Luna fase={ambiente.luna} dimensione={18} />
          {luna.nome}
        </span>
      </Riga>
    </section>
  )
}

function Numeri({ numeri, adesso }: { numeri: NumeriForesta; adesso: Date }) {
  const piante = [
    numeri.inCrescita > 0 && `${numeri.inCrescita} in crescita`,
    numeri.secchi > 0 && plurale(numeri.secchi, 'secco', 'secchi'),
  ].filter(Boolean)
  return (
    <section className="flex flex-col gap-1 border-t border-white/20 pt-3 first:border-0 first:pt-0">
      <Riga className="font-semibold">
        <Trees className="size-5 shrink-0" aria-hidden="true" />
        {plurale(numeri.alberi, 'albero', 'alberi')} · {plurale(numeri.boschetti, 'boschetto', 'boschetti')}
        {numeri.arbusti !== null && ` · ${plurale(numeri.arbusti, 'arbusto', 'arbusti')}`}
      </Riga>
      <div className="flex items-center gap-2">
        <div className="h-2 flex-1 overflow-hidden rounded-full bg-white/20">
          <div className="h-full rounded-full bg-completo" style={{ width: `${numeri.percentuale}%` }} />
        </div>
        <span className="text-sm">{numeri.percentuale}% completato</span>
      </div>
      {numeri.settimana > 0 && (
        <p className="text-sm text-white/85">+{plurale(numeri.settimana, 'albero', 'alberi')} questa settimana</p>
      )}
      {piante.length > 0 && <p className="text-sm text-white/85">{piante.join(' · ')}</p>}
      {numeri.ultimo && (
        <p className="text-sm text-white/85">Ultimo albero piantato {quandoFa(numeri.ultimo, adesso)}</p>
      )}
    </section>
  )
}

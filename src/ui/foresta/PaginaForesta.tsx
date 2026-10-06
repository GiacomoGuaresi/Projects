import { useCallback, useEffect, useMemo, useRef, useState, type CSSProperties } from 'react'
import { Minus, Plus, Sprout, X } from 'lucide-react'
import { faccende } from '../../dati'
import { boschetti, disponi, numeriForesta, statisticheBosco, type AlberoForesta } from '../../dominio/foresta'
import { coloreProgetto, iniziali } from '../../dominio/progetto'
import type { Attivita, Stato } from '../../dominio/tipi'
import type { OpzioniSfondo } from '../rotta'
import { infoStati } from '../stati'
import { CASA } from '../../dominio/ambiente'
import { usePressioneLunga } from '../pressioneLunga'
import { Cielo, copertura } from './Cielo'
import { OverlaySfondo } from './OverlaySfondo'
import { Particelle } from './Particelle'
import { Scena } from './Scena'
import { nomiAmbiente, SelettoreAmbiente } from './SelettoreAmbiente'
import { useGesti, ZOOM_MASSIMO, ZOOM_MINIMO } from './useGesti'
import { comandiConsole, useAmbiente, type ComandiForesta } from './useAmbiente'

interface Props {
  attivita: readonly Attivita[]
  /**
   * Solo la scena, ferma e senza interfaccia: è la foto che diventa lo sfondo
   * dei dispositivi (`#/foresta?sfondo`, repo ProjectsWallpaper). Quando è
   * tutto caricato segna `data-sfondo-pronto` su `<html>`. Con dei pannelli,
   * sopra la scena c'è l'overlay coi numeri e il meteo.
   */
  sfondo?: OpzioniSfondo
}

/** Le piante già viste (`id:stato`), per far crescere solo le nuove e quelle cambiate. */
const VISTI = 'projects_foresta_visti'
/** Le caselle del bosco scelto: prima quello che è fatto. */
const ORDINE_STATI: Stato[] = ['completo', 'in_corso', 'da_fare', 'bloccato']
const VERTICALE = '(orientation: portrait) and (max-width: 767px)'

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

/**
 * Il conto delle faccende fatte; `null` finché non arriva o se non si riesce a
 * leggerlo. `arrivato` diventa vero alla risposta, anche se è un errore.
 */
function useArbusti(): { quanti: number | null; arrivato: boolean } {
  const [stato, setStato] = useState<{ quanti: number | null; arrivato: boolean }>({ quanti: null, arrivato: false })
  useEffect(() => {
    let attivo = true
    faccende()
      .fatte()
      .then((n) => attivo && setStato({ quanti: n, arrivato: true }))
      .catch(() => attivo && setStato({ quanti: null, arrivato: true }))
    return () => {
      attivo = false
    }
  }, [])
  return stato
}

const data = (iso: string | null) =>
  iso ? new Date(iso).toLocaleDateString('it-IT', { day: 'numeric', month: 'long', year: 'numeric' }) : null

const plurale = (n: number, uno: string, tanti: string) => `${n} ${n === 1 ? uno : tanti}`

/**
 * La Foresta (doc/08-interfaccia.md): un prato isometrico nel cielo, grande
 * quanto la pagina. Ogni attività è una pianta che cresce col suo stato, i progetti sono
 * boschi su una zolla del loro colore, le faccende fatte sono arbusti sparsi.
 * Toccando un albero (o la sua zolla) si illumina il bosco e sotto compaiono
 * i suoi numeri; si trascina col dito o col mouse, si ingrandisce con due dita
 * (o rotella, o + e −).
 */
export function PaginaForesta({ attivita, sfondo: opzioniSfondo }: Props) {
  const sfondo = opzioniSfondo !== undefined
  const { quanti: arbusti, arrivato: arbustiArrivati } = useArbusti()
  const gruppi = useMemo(() => boschetti(attivita), [attivita])
  const foresta = useMemo(() => disponi(gruppi, arbusti ?? 0), [gruppi, arbusti])
  const piante = gruppi.flatMap((g) => g.alberi)
  const numeri = useMemo(() => numeriForesta(attivita, arbusti), [attivita, arbusti])
  const { alberi, inCrescita, secchi } = numeri

  // In verticale l'isola, larga e bassa, verrebbe piccola: si parte già ingranditi.
  const gesti = useGesti(!sfondo && window.matchMedia(VERTICALE).matches ? 1.5 : 1)
  const [bosco, setBosco] = useState<string | null>(null)
  const ambiente = useAmbiente()
  // Tenendo premuto il titolo si apre il selettore nascosto di stagione, ora e meteo.
  const [selettore, setSelettore] = useState(false)
  const chiudiSelettore = useCallback(() => setSelettore(false), [])
  const titolo = usePressioneLunga<HTMLDivElement>({ onInizio: () => setSelettore(true) })

  // Lo stesso selettore con Alt+Shift+F, e dalla console dei DevTools con `foresta.*`.
  const ultimo = useRef(ambiente)
  ultimo.current = ambiente
  const { setForza } = ambiente
  useEffect(() => {
    if (sfondo) return
    const tasto = (e: KeyboardEvent) => {
      if (e.altKey && e.shiftKey && e.code === 'KeyF') {
        e.preventDefault()
        setSelettore((aperto) => !aperto)
      }
    }
    document.addEventListener('keydown', tasto)
    const finestra = window as typeof window & { foresta?: ComandiForesta }
    finestra.foresta = comandiConsole(() => ultimo.current, setForza)
    console.info(
      "Foresta: prova stagione, ora, meteo e vento con foresta.stagione('inverno'), foresta.ora('notte'), " +
        "foresta.meteo('temporale'), foresta.vento(0.8), foresta.reset(), foresta.stato(). Solo in questa scheda.",
    )
    return () => {
      document.removeEventListener('keydown', tasto)
      delete finestra.foresta
    }
  }, [setForza, sfondo])
  const scelto = bosco === null ? null : (gruppi.find((g) => g.chiave === bosco) ?? null)
  const statistiche = useMemo(() => (scelto ? statisticheBosco(attivita, scelto.chiave) : null), [attivita, scelto])

  // Le piante nuove o cambiate dall'ultima visita crescono; poi diventano "viste".
  // Nello sfondo sono tutte già viste: la foto le vuole cresciute.
  const [vistiPrima] = useState(leggiVisti)
  const tutte = useMemo(() => new Set(gruppi.flatMap((g) => g.alberi.map(pianta))), [gruppi])
  const visti = sfondo ? tutte : vistiPrima
  useEffect(() => {
    if (!sfondo) salvaVisti([...tutte])
  }, [tutte, sfondo])

  // Le piante create o cambiate oggi hanno alone e scintille; non nello sfondo.
  const diOggi = useMemo(() => {
    if (sfondo) return null
    const oggi = new Date().toDateString()
    return new Set(
      gruppi.flatMap((g) => g.alberi.filter((a) => new Date(a.modificata_il).toDateString() === oggi).map((a) => a.id)),
    )
  }, [gruppi, sfondo])

  // Nello sfondo: quando arbusti e meteo sono arrivati e la scena è disegnata, la foto si può scattare.
  const { meteoCaricato } = ambiente
  useEffect(() => {
    if (!sfondo || !arbustiArrivati || !meteoCaricato) return
    let fotogramma = requestAnimationFrame(() => {
      fotogramma = requestAnimationFrame(() => {
        document.documentElement.dataset.sfondoPronto = '1'
      })
    })
    return () => {
      cancelAnimationFrame(fotogramma)
      delete document.documentElement.dataset.sfondoPronto
    }
  }, [sfondo, arbustiArrivati, meteoCaricato])

  // Il click che chiude un trascinamento o un pinch non sceglie niente.
  const { trascinato } = gesti
  const scegli = useCallback(
    (chiave: string | null) => {
      if (trascinato()) return
      setBosco(chiave)
    },
    [trascinato],
  )

  const vuota = piante.length === 0 && !arbusti

  return (
    <div
      className={`relative overflow-hidden bg-fondo ${sfondo ? 'h-dvh' : 'h-[calc(100dvh-45px-env(safe-area-inset-top))] min-h-[360px] lg:h-[calc(100dvh-44px)]'}`}
    >
      <Cielo luce={ambiente.luce} meteo={ambiente.meteo} vento={ambiente.vento} luna={ambiente.luna} />

      <div
        ref={gesti.contenitore}
        // Niente gesti del browser qui: trascinamento e pinch li gestisce useGesti, e la pagina non si ingrandisce.
        className="absolute inset-0 touch-none overflow-auto overscroll-contain [scrollbar-width:none] [&::-webkit-scrollbar]:hidden"
        style={{ '--vento': ambiente.vento } as CSSProperties}
        {...gesti.gestori}
      >
        <Scena
          foresta={foresta}
          bosco={bosco}
          visti={visti}
          diOggi={diOggi}
          onScegli={scegli}
          stagione={ambiente.stagione}
          farfalle={
            ambiente.luce.buio < 0.5 &&
            (ambiente.stagione === 'primavera' || ambiente.stagione === 'estate') &&
            (ambiente.meteo.cielo === 'sereno' || ambiente.meteo.cielo === 'nuvoloso')
          }
          ingrandimento={gesti.zoom}
          etichetta={`La foresta: ${plurale(alberi, 'albero', 'alberi')} in ${plurale(gruppi.length, 'boschetto', 'boschetti')}${arbusti ? ` e ${plurale(arbusti, 'arbusto', 'arbusti')}` : ''}.`}
        />
      </div>

      {/* La luce sulla foresta: blu di notte, grigia col brutto tempo, rosa ad alba e tramonto. */}
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply transition-opacity duration-1000"
        style={{ background: '#28407a', opacity: ambiente.luce.buio * 0.5 * (1 - ambiente.luce.tinta * 0.6) }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-multiply transition-opacity duration-1000"
        style={{ background: '#7d8794', opacity: copertura(ambiente.meteo) * 0.3 }}
        aria-hidden="true"
      />
      <div
        className="pointer-events-none absolute inset-0 mix-blend-soft-light transition-opacity duration-1000"
        style={{ background: '#ff7a6b', opacity: ambiente.luce.tinta * 0.4 }}
        aria-hidden="true"
      />

      {/* La nebbia: un velo bianco, più fitto in basso. */}
      {ambiente.meteo.cielo === 'nebbia' && (
        <div
          className="pointer-events-none absolute inset-0 bg-linear-to-b from-white/20 via-white/45 to-white/70 transition-opacity duration-1000"
          style={{ opacity: 0.5 + ambiente.meteo.intensita * 0.5 }}
          aria-hidden="true"
        />
      )}
      <Particelle meteo={ambiente.meteo} stagione={ambiente.stagione} luce={ambiente.luce} vento={ambiente.vento} />

      {opzioniSfondo && opzioniSfondo.pannelli.length > 0 && (
        <OverlaySfondo opzioni={opzioniSfondo} ambiente={ambiente} numeri={numeri} />
      )}

      {/* Il titolo, in alto a sinistra. */}
      {!sfondo && (
        <div
          ref={titolo.ref}
          {...titolo.gestori}
          className="absolute top-2 left-2 max-w-[calc(100%-64px)] touch-none rounded-xl bg-white/85 px-3 py-2 shadow-sm backdrop-blur-sm select-none"
        >
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
          <p className="text-xs text-testo-tenue">
            {nomiAmbiente[ambiente.stagione]} · {nomiAmbiente[ambiente.meteo.cielo].toLowerCase()}
            {ambiente.meteoVero && ` a ${CASA.nome}`}
          </p>
        </div>
      )}
      {selettore && (
        <SelettoreAmbiente forza={ambiente.forza} onForza={ambiente.setForza} onChiudi={chiudiSelettore} />
      )}

      {/* Lo zoom, in alto a destra. */}
      {!sfondo && (
        <div className="absolute top-2 right-2 flex flex-col gap-1">
          <button
            type="button"
            className="grid size-10 place-items-center rounded-[11px] bg-white/85 shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-40"
            aria-label="Ingrandisci"
            disabled={gesti.zoom >= ZOOM_MASSIMO}
            onClick={gesti.piu}
          >
            <Plus className="size-5" aria-hidden="true" />
          </button>
          <button
            type="button"
            className="grid size-10 place-items-center rounded-[11px] bg-white/85 shadow-sm backdrop-blur-sm hover:bg-white disabled:opacity-40"
            aria-label="Rimpicciolisci"
            disabled={gesti.zoom <= ZOOM_MINIMO}
            onClick={gesti.meno}
          >
            <Minus className="size-5" aria-hidden="true" />
          </button>
        </div>
      )}

      {vuota && !sfondo && (
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

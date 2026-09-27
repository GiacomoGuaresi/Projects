import { useState } from 'react'
import {
  ArrowRight,
  Check,
  EyeOff,
  Landmark,
  House,
  Minus,
  Mountain,
  Plus,
  RotateCcw,
  Sun,
  Tent,
  type LucideIcon,
} from 'lucide-react'
import {
  caselle,
  giorniValidi,
  GIORNI_MAX,
  GIORNI_MIN,
  listaPerViaggio,
  TIPI_VIAGGIO,
  type Casella,
  type CategoriaDaPrendere,
  type TipoViaggio,
  type Viaggio,
} from '../dominio/valigia'
import { Conferma } from './Conferma'
import { Interruttore } from './Dashboard'
import { useInterruttore } from './preferenze'
import { useValigia } from './useValigia'

const infoTipi: Record<TipoViaggio, { etichetta: string; icona: LucideIcon }> = {
  mare: { etichetta: 'Mare', icona: Sun },
  montagna: { etichetta: 'Montagna', icona: Mountain },
  rifugio: { etichetta: 'Rifugio', icona: House },
  citta: { etichetta: 'Città', icona: Landmark },
  campeggio: { etichetta: 'Campeggio', icona: Tent },
}

/** Nome, sigla e colori delle caselle, come il pulsante dello stato: solo il fondo, chiaro da vuota e pieno da presa. */
const infoCaselle: Record<
  Casella['persona'],
  { nome: string; sigla: string; vuota: string; presa: string; pallino: string }
> = {
  jack: {
    nome: 'Jack',
    sigla: 'J',
    vuota: 'bg-jack-chiaro text-jack',
    presa: 'bg-jack text-white',
    pallino: 'bg-jack',
  },
  ale: {
    nome: 'Ale',
    sigla: 'A',
    vuota: 'bg-ale-chiaro text-ale',
    presa: 'bg-ale text-white',
    pallino: 'bg-ale',
  },
  comune: {
    nome: 'Comuni',
    sigla: 'Com',
    vuota: 'bg-comune-chiaro text-tag-giallo-testo',
    presa: 'bg-comune text-white',
    pallino: 'bg-comune',
  },
}

const pulsanteGiorni =
  'grid size-11 place-items-center rounded-[11px] border border-bordo bg-white text-testo-tenue enabled:hover:bg-fondo disabled:opacity-40'

/**
 * La pagina Valigia (doc/08-interfaccia.md, "Valigia"), un wizard in due passi:
 * prima giorni e tipi di viaggio, poi la lista da spuntare, una card per
 * categoria. In fondo alla lista "Nuova valigia" toglie le spunte e riporta al
 * primo passo. Viaggio e spunte stanno nel database, condivisi in tempo reale
 * tra i telefoni; solo "Nascondi prese" resta nel cookie di ciascuno.
 */
export function PaginaValigia({ onAvviso }: { onAvviso: (messaggio: string) => void }) {
  const { stato, ricarica, cambiaViaggio, segna, prepara, ricomincia } = useValigia(onAvviso)

  if (stato.fase === 'caricamento') return <p className="p-2 text-testo-tenue">Carico la valigia…</p>
  if (stato.fase === 'errore') {
    return (
      <div className="flex flex-col items-start gap-2 p-2" role="alert">
        <p className="text-pericolo">{stato.messaggio}</p>
        <button
          type="button"
          className="min-h-11 rounded-[11px] bg-salvia px-4 font-semibold text-panna hover:bg-salvia-scura"
          onClick={() => void ricarica()}
        >
          Riprova
        </button>
      </div>
    )
  }

  const { viaggio, spunte, inLista } = stato
  const lista = listaPerViaggio(viaggio)

  return inLista ? (
    <PassoLista viaggio={viaggio} lista={lista} spunte={spunte} onSegna={segna} onRicomincia={ricomincia} />
  ) : (
    <PassoViaggio viaggio={viaggio} lista={lista} onCambia={cambiaViaggio} onPrepara={prepara} />
  )
}

interface PassoViaggioProps {
  viaggio: Viaggio
  lista: readonly CategoriaDaPrendere[]
  onCambia: (viaggio: Viaggio) => void
  onPrepara: () => void
}

/** Primo passo: quanti giorni e che tipo di viaggio, con quante voci verranno. */
function PassoViaggio({ viaggio, lista, onCambia, onPrepara }: PassoViaggioProps) {
  const voci = lista.reduce((n, c) => n + c.voci.length, 0)
  const cambiaGiorni = (giorni: number) => onCambia({ ...viaggio, giorni: giorniValidi(giorni) })
  const cambiaTipo = (tipo: TipoViaggio, acceso: boolean) =>
    onCambia({
      ...viaggio,
      // Sempre nell'ordine della lista, così il cookie non cambia a seconda dei clic.
      tipi: TIPI_VIAGGIO.filter((t) => (t === tipo ? acceso : viaggio.tipi.includes(t))),
    })

  return (
    <div className="mx-auto flex w-full max-w-[720px] flex-col gap-3">
      <h2 className="px-1 text-lg font-semibold">Valigia</h2>
      <section className="flex flex-col gap-4 rounded-[11px] border border-bordo bg-white p-4" aria-label="Il viaggio">
        <div className="flex flex-col gap-2">
          <span className="font-semibold" id="giorni">
            Quanti giorni?
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              className={pulsanteGiorni}
              aria-label="Un giorno in meno"
              disabled={viaggio.giorni <= GIORNI_MIN}
              onClick={() => cambiaGiorni(viaggio.giorni - 1)}
            >
              <Minus className="size-4" aria-hidden="true" />
            </button>
            <input
              type="number"
              inputMode="numeric"
              aria-labelledby="giorni"
              min={GIORNI_MIN}
              max={GIORNI_MAX}
              className="min-h-11 w-16 rounded-[11px] border border-bordo bg-white px-2 text-center focus:outline-2 focus:-outline-offset-1 focus:outline-salvia"
              value={viaggio.giorni}
              onChange={(e) => {
                if (e.target.value !== '') cambiaGiorni(Number(e.target.value))
              }}
            />
            <button
              type="button"
              className={pulsanteGiorni}
              aria-label="Un giorno in più"
              disabled={viaggio.giorni >= GIORNI_MAX}
              onClick={() => cambiaGiorni(viaggio.giorni + 1)}
            >
              <Plus className="size-4" aria-hidden="true" />
            </button>
          </div>
        </div>
        <div className="flex flex-col gap-2">
          <span className="font-semibold" id="tipi">
            Che viaggio è? <span className="font-normal text-testo-tenue">Anche più d'uno</span>
          </span>
          <div className="flex flex-wrap gap-1.5" role="group" aria-labelledby="tipi">
            {TIPI_VIAGGIO.map((tipo) => (
              <Interruttore
                key={tipo}
                etichetta={infoTipi[tipo].etichetta}
                icona={infoTipi[tipo].icona}
                acceso={viaggio.tipi.includes(tipo)}
                onCambia={(acceso) => cambiaTipo(tipo, acceso)}
              />
            ))}
          </div>
        </div>
        <div className="flex flex-wrap items-center justify-end gap-3 border-t border-bordo pt-3">
          <span className="text-sm text-testo-tenue">{voci} voci in lista</span>
          <button
            type="button"
            className="flex min-h-11 items-center gap-1.5 rounded-[11px] bg-salvia px-4 font-semibold text-panna hover:bg-salvia-scura"
            onClick={onPrepara}
          >
            Prepara la lista
            <ArrowRight className="size-4" aria-hidden="true" />
          </button>
        </div>
      </section>
    </div>
  )
}

interface PassoListaProps {
  viaggio: Viaggio
  lista: readonly CategoriaDaPrendere[]
  spunte: ReadonlySet<string>
  onSegna: (chiave: string, presa: boolean) => void
  onRicomincia: () => void
}

/**
 * Secondo passo: in cima il riepilogo del viaggio, l'avanzamento e la legenda;
 * poi le card delle categorie; in fondo "Nuova valigia", con conferma.
 */
function PassoLista({ viaggio, lista, spunte, onSegna, onRicomincia }: PassoListaProps) {
  const [nascondiPrese, setNascondiPrese] = useInterruttore('projects_valigia_nascondi', false)
  const [conferma, setConferma] = useState(false)

  // Si conta per casella: una voce di tutti e due vale due spunte.
  const tutte = lista.flatMap((c) => c.voci.flatMap(caselle))
  const totale = tutte.length
  const prese = tutte.filter((k) => spunte.has(k.chiave)).length
  const conteggi = (['jack', 'ale', 'comune'] as const).map((persona) => {
    const sue = tutte.filter((k) => k.persona === persona)
    return {
      persona,
      prese: sue.filter((k) => spunte.has(k.chiave)).length,
      totale: sue.length,
    }
  })

  return (
    <div className="flex flex-col gap-3">
      <h2 className="flex items-baseline gap-2 px-1 text-lg font-semibold">
        Valigia{' '}
        <span className="text-sm font-normal text-testo-tenue" title="Caselle spuntate sul totale">
          {prese}/{totale}
        </span>
      </h2>

      <section className="flex flex-col gap-3 rounded-[11px] border border-bordo bg-white p-3" aria-label="Il viaggio">
        <p className="flex flex-wrap items-center gap-x-3 gap-y-1">
          <span className="font-semibold">{viaggio.giorni === 1 ? '1 giorno' : `${viaggio.giorni} giorni`}</span>
          {viaggio.tipi.map((tipo) => {
            const { etichetta, icona: Icona } = infoTipi[tipo]
            return (
              <span key={tipo} className="flex items-center gap-1 text-testo-tenue">
                <Icona className="size-4" aria-hidden="true" />
                {etichetta}
              </span>
            )
          })}
        </p>
        <div className="flex items-center gap-3">
          <div
            className="h-2 flex-1 overflow-hidden rounded-full bg-bordo"
            role="progressbar"
            aria-label="Voci prese"
            aria-valuemin={0}
            aria-valuemax={totale}
            aria-valuenow={prese}
          >
            <div
              className="h-full rounded-full bg-salvia transition-[width] duration-200"
              style={{ width: `${totale ? (prese / totale) * 100 : 0}%` }}
            />
          </div>
          <Interruttore etichetta="Nascondi prese" icona={EyeOff} acceso={nascondiPrese} onCambia={setNascondiPrese} />
        </div>
        {/* La legenda dei colori, con quante caselle ha preso ciascuno. */}
        <ul className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-testo-tenue">
          {conteggi.map(({ persona, prese, totale }) => (
            <li key={persona} className="flex items-center gap-1.5">
              <span className={`size-3 rounded-full ${infoCaselle[persona].pallino}`} aria-hidden="true" />
              <span className="font-semibold text-testo">{infoCaselle[persona].nome}</span>
              {prese}/{totale}
            </li>
          ))}
        </ul>
      </section>

      <div className="columns-1 gap-3 md:columns-2">
        {lista.map((categoria) => (
          <CardCategoria
            key={categoria.id}
            categoria={categoria}
            spunte={spunte}
            nascondiPrese={nascondiPrese}
            onSegna={onSegna}
          />
        ))}
      </div>

      <button
        type="button"
        // Molto evidente: largo quanto la lista, pieno e alto, come l'azione principale della pagina.
        className="mt-2 flex min-h-14 w-full items-center justify-center gap-2 rounded-[11px] bg-salvia px-4 text-lg font-semibold text-panna shadow-[0_2px_8px_rgb(46_58_45/0.2)] hover:bg-salvia-scura active:bg-salvia-scura"
        onClick={() => setConferma(true)}
      >
        <RotateCcw className="size-5" aria-hidden="true" />
        Nuova valigia
      </button>

      {conferma && (
        <Conferma
          titolo="Preparare una nuova valigia?"
          conferma="Nuova valigia"
          pericolo
          onAnnulla={() => setConferma(false)}
          onConferma={() => {
            setConferma(false)
            onRicomincia()
            window.scrollTo({ top: 0 })
          }}
        >
          <p>Si tolgono tutte le spunte e si torna a scegliere giorni e tipo di viaggio.</p>
        </Conferma>
      )}
    </div>
  )
}

interface CardCategoriaProps {
  categoria: CategoriaDaPrendere
  spunte: ReadonlySet<string>
  nascondiPrese: boolean
  onSegna: (chiave: string, presa: boolean) => void
}

/**
 * Una categoria: titolo con le caselle spuntate sul totale e una riga per voce.
 * A sinistra due colonne di caselle, Jack e Ale, allineate tra le righe: una
 * voce di uno solo lascia vuoto il posto dell'altro, una voce comune ha una
 * casella sola, larga quanto le due. Una voce è presa quando lo sono tutte le
 * sue caselle.
 */
function CardCategoria({ categoria, spunte, nascondiPrese, onSegna }: CardCategoriaProps) {
  const righe = categoria.voci.map((voce) => {
    const sue = caselle(voce)
    return {
      voce,
      caselle: sue,
      presa: sue.every((k) => spunte.has(k.chiave)),
    }
  })
  const tutte = righe.flatMap((r) => r.caselle)
  const prese = tutte.filter((k) => spunte.has(k.chiave)).length
  const visibili = nascondiPrese ? righe.filter((r) => !r.presa) : righe
  const completa = prese === tutte.length

  return (
    <section className="mb-3 break-inside-avoid rounded-[11px] border border-bordo bg-white">
      <h3 className="flex min-h-10 items-center gap-2 border-b border-bordo px-3 py-1 font-semibold">
        <span className="min-w-0 flex-1">
          {categoria.titolo}
          <IconeTipi tipi={categoria.tipi} />
        </span>
        <span className={`text-sm ${completa ? 'font-semibold text-completo' : 'font-normal text-testo-tenue'}`}>
          {prese}/{tutte.length}
        </span>
      </h3>
      {visibili.length === 0 ? (
        <p className="px-3 py-2 text-sm text-testo-tenue">Tutto in valigia.</p>
      ) : (
        <ul className="divide-y divide-bordo">
          {visibili.map(({ voce, caselle: sue, presa }) => (
            <li key={voce.id} className="flex min-h-11 items-center gap-2 px-1.5 py-1">
              <div className="grid shrink-0 grid-cols-[repeat(2,--spacing(8))] gap-1">
                {sue.map((casella) => (
                  <CasellaVoce
                    key={casella.chiave}
                    casella={casella}
                    etichetta={voce.etichetta}
                    presa={spunte.has(casella.chiave)}
                    onSegna={(nuova) => onSegna(casella.chiave, nuova)}
                  />
                ))}
              </div>
              <span className="min-w-0 flex-1 break-words">
                <span className={presa ? 'text-testo-tenue line-through' : ''}>{voce.etichetta}</span>
                <IconeTipi tipi={voce.tipi} />
                {voce.dettaglio && <span className="block text-sm text-testo-tenue">{voce.dettaglio}</span>}
              </span>
              {voce.quantita !== undefined && (
                <span className="shrink-0 pr-1.5 text-sm font-semibold text-testo-tenue">×{voce.quantita}</span>
              )}
            </li>
          ))}
        </ul>
      )}
    </section>
  )
}

/** I simbolini dei tipi di viaggio che hanno fatto comparire una voce o una categoria. */
function IconeTipi({ tipi }: { tipi: readonly TipoViaggio[] }) {
  return tipi.map((tipo) => {
    const { etichetta, icona: Icona } = infoTipi[tipo]
    return (
      <Icona
        key={tipo}
        className="ml-1.5 inline size-3.5 align-[-2px] text-testo-tenue"
        aria-label={etichetta}
        role="img"
      >
        <title>{etichetta}</title>
      </Icona>
    )
  })
}

interface CasellaVoceProps {
  casella: Casella
  etichetta: string
  presa: boolean
  onSegna: (presa: boolean) => void
}

/**
 * Una casella nel colore di chi la spunta, con la sigla (J, A, Com) da vuota e
 * la spunta da presa; quella comune occupa le due colonne. Jack sta a sinistra, Ale a destra.
 */
function CasellaVoce({ casella, etichetta, presa, onSegna }: CasellaVoceProps) {
  const { nome, sigla, vuota, presa: piena } = infoCaselle[casella.persona]
  const posto = {
    jack: 'col-start-1',
    ale: 'col-start-2',
    comune: 'col-span-2',
  }[casella.persona]
  return (
    <button
      type="button"
      role="checkbox"
      aria-checked={presa}
      aria-label={casella.persona === 'comune' ? etichetta : `${etichetta}, ${nome}`}
      title={nome}
      className={`flex h-8 touch-manipulation items-center justify-center rounded-lg text-xs font-bold ${posto} ${presa ? piena : vuota}`}
      onClick={() => onSegna(!presa)}
    >
      {presa ? (
        <Check className="size-4 shrink-0" strokeWidth={3} aria-hidden="true" />
      ) : (
        <span aria-hidden="true">{sigla}</span>
      )}
    </button>
  )
}

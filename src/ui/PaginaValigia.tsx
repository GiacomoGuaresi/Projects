import { useState } from 'react'
import {
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
} from '../dominio/valigia'
import { Conferma } from './Conferma'
import { Interruttore } from './Dashboard'
import { useInterruttore, useValigia } from './preferenze'

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
 * La pagina Valigia (doc/08-interfaccia.md, "Valigia"): la lista delle cose da
 * mettere in valigia, nata dalla lista di controllo di Action. In cima i giorni e i
 * tipi di viaggio, che decidono le voci e le quantità; sotto una card per
 * categoria con le voci da spuntare. Tutto resta nei cookie, niente database.
 */
export function PaginaValigia() {
  const { viaggio, cambiaViaggio, spunte, segna, azzera } = useValigia()
  const [nascondiPrese, setNascondiPrese] = useInterruttore('projects_valigia_nascondi', false)
  const [conferma, setConferma] = useState(false)

  const lista = listaPerViaggio(viaggio)
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

  const cambiaGiorni = (giorni: number) => cambiaViaggio({ ...viaggio, giorni: giorniValidi(giorni) })
  const cambiaTipo = (tipo: TipoViaggio, acceso: boolean) =>
    cambiaViaggio({
      ...viaggio,
      // Sempre nell'ordine della lista, così il cookie non cambia a seconda dei clic.
      tipi: TIPI_VIAGGIO.filter((t) => (t === tipo ? acceso : viaggio.tipi.includes(t))),
    })

  return (
    <div className="flex flex-col gap-3">
      <div className="flex items-center gap-2 px-1">
        <h2 className="flex items-baseline gap-2 text-lg font-semibold">
          Valigia{' '}
          <span className="text-sm font-normal text-testo-tenue" title="Caselle spuntate sul totale">
            {prese}/{totale}
          </span>
        </h2>
        <button
          type="button"
          className="ml-auto flex min-h-9 items-center gap-1.5 rounded-[11px] px-2.5 font-semibold text-testo-tenue hover:bg-white disabled:opacity-40"
          disabled={spunte.size === 0}
          onClick={() => setConferma(true)}
        >
          <RotateCcw className="size-4" aria-hidden="true" />
          Reset
        </button>
      </div>

      <section className="flex flex-col gap-3 rounded-[11px] border border-bordo bg-white p-3" aria-label="Il viaggio">
        <div className="flex items-center gap-2">
          <span className="font-semibold" id="giorni">
            Giorni
          </span>
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
        <div className="flex flex-wrap gap-1.5" role="group" aria-label="Tipo di viaggio">
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
            onSegna={segna}
          />
        ))}
      </div>

      {conferma && (
        <Conferma
          titolo="Ricominciare la valigia?"
          conferma="Reset"
          pericolo
          onAnnulla={() => setConferma(false)}
          onConferma={() => {
            azzera()
            setConferma(false)
          }}
        >
          <p>Si tolgono tutte le spunte. Giorni e tipo di viaggio restano come sono.</p>
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

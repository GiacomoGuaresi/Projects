import { useState } from 'react'
import {
  Circle,
  CircleCheck,
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
  giorniValidi,
  GIORNI_MAX,
  GIORNI_MIN,
  listaPerViaggio,
  TIPI_VIAGGIO,
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
  const totale = lista.reduce((n, c) => n + c.voci.length, 0)
  const prese = lista.reduce((n, c) => n + c.voci.filter((v) => spunte.has(v.id)).length, 0)

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
          <span className="text-sm font-normal text-testo-tenue" title="Voci prese sul totale">
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
          <Interruttore
            etichetta="Nascondi prese"
            icona={EyeOff}
            acceso={nascondiPrese}
            onCambia={setNascondiPrese}
          />
        </div>
      </section>

      <div className="columns-1 gap-3 md:columns-2 xl:columns-3">
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
  onSegna: (id: string, presa: boolean) => void
}

/** Una categoria: titolo con le prese sul totale e una riga per voce, tutta da toccare. */
function CardCategoria({ categoria, spunte, nascondiPrese, onSegna }: CardCategoriaProps) {
  const prese = categoria.voci.filter((v) => spunte.has(v.id)).length
  const visibili = nascondiPrese ? categoria.voci.filter((v) => !spunte.has(v.id)) : categoria.voci
  const completa = prese === categoria.voci.length

  return (
    <section className="mb-3 break-inside-avoid rounded-[11px] border border-bordo bg-white">
      <h3 className="flex min-h-10 items-center gap-2 border-b border-bordo px-3 py-1 font-semibold">
        <span className="min-w-0 flex-1">{categoria.titolo}</span>
        <span className={`text-sm ${completa ? 'font-semibold text-completo' : 'font-normal text-testo-tenue'}`}>
          {prese}/{categoria.voci.length}
        </span>
      </h3>
      {visibili.length === 0 ? (
        <p className="px-3 py-2 text-sm text-testo-tenue">Tutto in valigia.</p>
      ) : (
        <ul className="divide-y divide-bordo">
          {visibili.map((voce) => {
            const presa = spunte.has(voce.id)
            const Icona = presa ? CircleCheck : Circle
            return (
              <li key={voce.id}>
                <button
                  type="button"
                  role="checkbox"
                  aria-checked={presa}
                  className="flex min-h-11 w-full touch-manipulation items-center gap-2 px-1.5 py-1 text-left hover:bg-fondo active:bg-bordo"
                  onClick={() => onSegna(voce.id, !presa)}
                >
                  <span
                    className={`grid size-8 shrink-0 place-items-center rounded-lg ${
                      presa ? 'bg-completo text-completo-testo' : 'bg-dafare text-dafare-testo'
                    }`}
                  >
                    <Icona className="size-4" aria-hidden="true" />
                  </span>
                  <span className="min-w-0 flex-1 break-words">
                    <span className={presa ? 'text-testo-tenue line-through' : ''}>{voce.etichetta}</span>
                    {voce.dettaglio && <span className="block text-sm text-testo-tenue">{voce.dettaglio}</span>}
                  </span>
                  {voce.quantita !== undefined && (
                    <span className="shrink-0 pr-1.5 text-sm font-semibold text-testo-tenue">×{voce.quantita}</span>
                  )}
                </button>
              </li>
            )
          })}
        </ul>
      )}
    </section>
  )
}

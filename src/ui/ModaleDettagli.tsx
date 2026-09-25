import type { ReactNode } from 'react'
import { BookOpen, Trash2 } from 'lucide-react'
import type { ProgettoInUso } from '../dominio/progetto'
import { titoloSenzaTag } from '../dominio/tag'
import type { Attivita } from '../dominio/tipi'
import { CampoAvanzamento, CampoProgetto, CampoTitolo } from './CampiInline'
import type { AzioniAttivita } from './ElencoAttivita'
import { AiutoTag } from './InputTitolo'
import { Modale } from './Modale'
import { dataOra } from './ModaleDiario'
import { SceltaPriorita, SceltaStato } from './Scelte'

interface Props {
  attivita: Attivita
  progetti: readonly ProgettoInUso[]
  azioni: AzioniAttivita
  onChiudi: () => void
}

const pulsante =
  'flex min-h-9 items-center gap-1.5 rounded-lg px-2.5 text-sm font-semibold text-salvia-scura hover:bg-fondo'

/**
 * I dettagli di un'attività, aperti dalla Dashboard (doc/08-interfaccia.md,
 * "Modale dettagli"): tutti i campi modificabili come nelle righe, con le stesse
 * regole (conferma di *Completo*, "solo questa / tutte" sul progetto).
 * Il diario si modifica nel suo modale, che si apre sopra.
 */
export function ModaleDettagli({ attivita: a, progetti, azioni, onChiudi }: Props) {
  return (
    <Modale
      titolo={titoloSenzaTag(a.titolo) || a.titolo}
      onChiudi={onChiudi}
      larga
      piede={
        // Chiede conferma; eliminata l'attività il modale si chiude da solo, perché segue l'id.
        <button
          type="button"
          className="mr-auto flex min-h-11 items-center gap-1.5 rounded-[11px] px-4 font-semibold text-pericolo hover:bg-fondo"
          onClick={() => azioni.elimina(a)}
        >
          <Trash2 className="size-4" aria-hidden="true" />
          Elimina
        </button>
      }
    >
      <div className="flex flex-col gap-4">
        <Campo nome="Titolo">
          <div className="text-base font-medium">
            <CampoTitolo titolo={a.titolo} onSalva={(titolo) => azioni.modifica(a, { titolo })} />
          </div>
          <AiutoTag />
        </Campo>

        <div className="grid gap-4 sm:grid-cols-2">
          <Campo nome="Progetto">
            <CampoProgetto
              progetto={a.progetto}
              progetti={progetti}
              onSalva={(testo) => azioni.cambiaProgetto(a, testo)}
            />
          </Campo>
          <Campo nome="Priorità">
            <SceltaPriorita valore={a.priorita} onScegli={(priorita) => azioni.modifica(a, { priorita })} />
          </Campo>
        </div>

        <Campo nome="Stato">
          <SceltaStato valore={a.stato} onScegli={(stato) => azioni.modifica(a, { stato })} />
        </Campo>

        <Campo nome="Avanzamento">
          <CampoAvanzamento
            valore={a.avanzamento}
            bloccato={a.stato === 'completo'}
            onSalva={(avanzamento) => azioni.modifica(a, { avanzamento })}
          />
        </Campo>

        <div className="flex flex-wrap items-center justify-between gap-2 border-t border-bordo pt-3">
          <p className="text-xs text-testo-tenue">
            Creata il {dataOra(a.creata_il)}
            {a.modificata_il !== a.creata_il && <> · modificata il {dataOra(a.modificata_il)}</>}
            {a.completata_il && <> · completata il {dataOra(a.completata_il)}</>}
          </p>
          <button
            type="button"
            className={`${pulsante} relative`}
            onClick={() => azioni.apriDiario(a)}
          >
            {/* Come PulsanteDiario: un pallino se ha voci. */}
            <BookOpen className="size-4" aria-hidden="true" />
            Diario
            {a.ha_diario && (
              <span
                className="absolute -top-1 -right-1 size-2.5 rounded-full bg-salvia ring-2 ring-white"
                aria-hidden="true"
              />
            )}
          </button>
        </div>
      </div>
    </Modale>
  )
}

function Campo({ nome, children }: { nome: string; children: ReactNode }) {
  return (
    <div className="flex min-w-0 flex-col gap-1">
      <span className="text-xs font-medium text-testo-tenue">{nome}</span>
      {children}
    </div>
  )
}

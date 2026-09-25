import { useCallback, useState, type ReactNode } from 'react'
import { ListChecks, Menu, Plus } from 'lucide-react'
import { cambioProgetto, progettiInUso } from '../dominio/progetto'
import { titoloSenzaTag } from '../dominio/tag'
import type { Attivita, Modifica } from '../dominio/tipi'
import { Avviso } from './Avviso'
import { Conferma } from './Conferma'
import { Dashboard } from './Dashboard'
import { Installa } from './Installa'
import { installa, useInstallazione } from './installazione'
import { DialogoProgetto } from './DialogoProgetto'
import type { AzioniAttivita } from './ElencoAttivita'
import { MenuLaterale } from './MenuLaterale'
import { ModaleDescrizione } from './ModaleDescrizione'
import { ModaleDettagli } from './ModaleDettagli'
import { ModaleDiario } from './ModaleDiario'
import { ModaleNuova } from './ModaleNuova'
import { PaginaAttivita } from './PaginaAttivita'
import { PaginaFaccende } from './PaginaFaccende'
import { PaginaPerStato } from './PaginaPerStato'
import { indirizzi, useRotta } from './rotta'
import { useAttivita, type StatoElenco } from './useAttivita'
import { useFaccende } from './useFaccende'

/**
 * Il guscio dell'app, come Grocery (doc/08-interfaccia.md): intestazione salvia
 * da bordo a bordo con ☰ a sinistra e + a destra, menu laterale, contenuto
 * largo al massimo 1200px. Da 1024px il menu è una colonna fissa e ☰ sparisce.
 *
 * Qui stanno anche i dialoghi che partono dalle righe: conferma di "Completo",
 * "solo questa / tutte" sul progetto, conferma dell'eliminazione.
 */
export function App() {
  const rotta = useRotta()
  const [menuAperto, setMenuAperto] = useState(false)
  const [nuovaAperta, setNuovaAperta] = useState(false)
  const [daCompletare, setDaCompletare] = useState<{ attivita: Attivita; modifica: Modifica } | null>(null)
  const [cambio, setCambio] = useState<{ attivita: Attivita; da: string; a: string | null; quante: number } | null>(
    null,
  )
  const [daEliminare, setDaEliminare] = useState<Attivita | null>(null)
  const chiudiMenu = useCallback(() => setMenuAperto(false), [])
  const statoInstallazione = useInstallazione()
  const { stato, ricarica, crea, modifica, rinominaProgetto, elimina, segnaDiario, avviso, mostraAvviso, chiudiAvviso } =
    useAttivita()
  const faccende = useFaccende(mostraAvviso)
  const progetti = stato.fase === 'pronto' ? progettiInUso(stato.attivita) : []
  // I modali seguono l'attività per id, così mostrano sempre la versione aggiornata.
  const [descrizioneDi, setDescrizioneDi] = useState<number | null>(null)
  const [diarioDi, setDiarioDi] = useState<number | null>(null)
  const [dettagliDi, setDettagliDi] = useState<number | null>(null)
  const trova = (id: number | null) =>
    stato.fase === 'pronto' && id !== null ? (stato.attivita.find((a) => a.id === id) ?? null) : null
  const descrizioneAperta = trova(descrizioneDi)
  const diarioAperto = trova(diarioDi)
  const dettagliAperti = trova(dettagliDi)

  const azioni: AzioniAttivita = {
    /** Passare a "Completo" chiede conferma; il resto si salva subito. */
    modifica: (attivita, cambi) => {
      if (cambi.stato === 'completo' && attivita.stato !== 'completo') {
        setDaCompletare({ attivita, modifica: cambi })
      } else {
        void modifica(attivita.id, cambi)
      }
    },
    /** Salva subito, oppure chiede "solo questa / tutte" (doc/08, "Cambio del progetto"). */
    cambiaProgetto: (attivita, testo) => {
      const esito = cambioProgetto(attivita.progetto, testo, progetti)
      if (esito.tipo === 'salva') void modifica(attivita.id, { progetto: esito.progetto })
      if (esito.tipo === 'chiedi') setCambio({ attivita, da: esito.da, a: esito.a, quante: esito.quante })
    },
    elimina: setDaEliminare,
    apriDescrizione: (attivita) => setDescrizioneDi(attivita.id),
    apriDiario: (attivita) => setDiarioDi(attivita.id),
  }

  return (
    <div className="sfondo-casa flex min-h-dvh flex-col lg:grid lg:grid-cols-[256px_minmax(0,1fr)] lg:grid-rows-[auto_1fr]">
      <header className="sticky top-0 z-1 flex items-center gap-1 border-b border-salvia-scura bg-salvia pt-[env(safe-area-inset-top)] pr-2 pl-1 text-white lg:col-span-full lg:min-h-11 lg:pl-3">
        <button
          className="grid size-11 place-items-center rounded-[11px] active:bg-salvia-scura lg:hidden"
          type="button"
          aria-label="Apri il menu"
          aria-expanded={menuAperto}
          aria-controls="menu"
          onClick={() => setMenuAperto(true)}
        >
          <Menu className="size-[22px]" aria-hidden="true" />
        </button>
        <ListChecks className="size-[22px] shrink-0" aria-hidden="true" />
        <h1 className="ml-1 text-lg font-semibold tracking-[0.01em]">Projects</h1>
        <button
          className="ml-auto flex min-h-9 items-center gap-1.5 rounded-[11px] px-2.5 font-semibold hover:bg-salvia-scura active:bg-salvia-scura"
          type="button"
          aria-label="Nuova attività"
          onClick={() => setNuovaAperta(true)}
        >
          <Plus className="size-[22px]" aria-hidden="true" />
          <span className="hidden lg:inline">Nuova attività</span>
        </button>
      </header>
      <MenuLaterale
        aperto={menuAperto}
        corrente={rotta}
        onChiudi={chiudiMenu}
        onNuova={() => {
          setMenuAperto(false)
          setNuovaAperta(true)
        }}
        onInstalla={
          statoInstallazione === 'installata'
            ? undefined
            : () => {
                setMenuAperto(false)
                // Con il prompt del browser basta un tocco; altrimenti le istruzioni.
                if (statoInstallazione === 'pronta') void installa()
                else window.location.hash = indirizzi.installa
              }
        }
      />
      <main className="mx-auto w-full max-w-[1200px] flex-1 p-3 pb-[calc(12px+env(safe-area-inset-bottom))] lg:col-start-2">
        {rotta === 'dashboard' && (
          <ConAttivita stato={stato} onRiprova={ricarica}>
            {(attivita) => (
              <Dashboard
                attivita={attivita}
                faccende={faccende}
                onDettagli={(a) => setDettagliDi(a.id)}
                onDiario={azioni.apriDiario}
                onModifica={azioni.modifica}
                onCrea={crea}
              />
            )}
          </ConAttivita>
        )}
        {rotta === 'stato' && (
          <ConAttivita stato={stato} onRiprova={ricarica}>
            {(attivita) => <PaginaPerStato attivita={attivita} progetti={progetti} azioni={azioni} />}
          </ConAttivita>
        )}
        {rotta === 'attivita' && (
          <ConAttivita stato={stato} onRiprova={ricarica}>
            {(attivita) => <PaginaAttivita attivita={attivita} progetti={progetti} azioni={azioni} />}
          </ConAttivita>
        )}
        {rotta === 'faccende' && <PaginaFaccende faccende={faccende} onAvviso={mostraAvviso} />}
        {rotta === 'installa' && <Installa stato={statoInstallazione} />}
      </main>
      {nuovaAperta && <ModaleNuova progetti={progetti} onCrea={crea} onChiudi={() => setNuovaAperta(false)} />}
      {/* Descrizione, diario e conferme si aprono dopo, quindi sopra i dettagli. */}
      {dettagliAperti && (
        <ModaleDettagli
          key={dettagliAperti.id}
          attivita={dettagliAperti}
          progetti={progetti}
          azioni={azioni}
          onChiudi={() => setDettagliDi(null)}
        />
      )}
      {daCompletare && (
        <Conferma
          titolo="Attività completa?"
          conferma="Completa"
          onAnnulla={() => setDaCompletare(null)}
          onConferma={() => {
            void modifica(daCompletare.attivita.id, daCompletare.modifica)
            setDaCompletare(null)
          }}
        >
          <p>
            Segnare <strong>{titoloSenzaTag(daCompletare.attivita.titolo) || daCompletare.attivita.titolo}</strong>{' '}
            come completa? L'avanzamento va al 100%.
          </p>
        </Conferma>
      )}
      {cambio && (
        <DialogoProgetto
          da={cambio.da}
          a={cambio.a}
          quante={cambio.quante}
          onAnnulla={() => setCambio(null)}
          onSoloQuesta={() => {
            void modifica(cambio.attivita.id, { progetto: cambio.a })
            setCambio(null)
          }}
          onTutte={() => {
            void rinominaProgetto(cambio.da, cambio.a)
            setCambio(null)
          }}
        />
      )}
      {descrizioneAperta && (
        <ModaleDescrizione
          key={descrizioneAperta.id}
          attivita={descrizioneAperta}
          onSalva={(descrizione) => void modifica(descrizioneAperta.id, { descrizione })}
          onChiudi={() => setDescrizioneDi(null)}
        />
      )}
      {diarioAperto && (
        <ModaleDiario
          key={diarioAperto.id}
          attivita={diarioAperto}
          onDiarioCambiato={(haVoci) => segnaDiario(diarioAperto.id, haVoci)}
          onChiudi={() => setDiarioDi(null)}
        />
      )}
      {daEliminare && (
        <Conferma
          titolo="Eliminare l'attività?"
          conferma="Elimina"
          pericolo
          onAnnulla={() => setDaEliminare(null)}
          onConferma={() => {
            void elimina(daEliminare.id)
            // Se l'eliminazione non riesce l'attività torna: i dettagli non devono riaprirsi da soli.
            if (dettagliDi === daEliminare.id) setDettagliDi(null)
            setDaEliminare(null)
          }}
        >
          <p>
            Eliminare <strong>{titoloSenzaTag(daEliminare.titolo) || daEliminare.titolo}</strong>? Si perdono anche
            descrizione e diario, e non si può tornare indietro.
          </p>
        </Conferma>
      )}
      {avviso && <Avviso messaggio={avviso} onChiudi={chiudiAvviso} />}
    </div>
  )
}

interface ConAttivitaProps {
  stato: StatoElenco
  onRiprova: () => void
  children: (attivita: Attivita[]) => ReactNode
}

/** Caricamento ed errore, uguali per ogni pagina; poi la pagina con le attività. */
function ConAttivita({ stato, onRiprova, children }: ConAttivitaProps) {
  if (stato.fase === 'caricamento') return <p className="p-2 text-testo-tenue">Carico le attività…</p>
  if (stato.fase === 'errore') {
    return (
      <div className="flex flex-col items-start gap-2 p-2" role="alert">
        <p className="text-pericolo">{stato.messaggio}</p>
        <button
          type="button"
          className="min-h-11 rounded-[11px] bg-salvia px-4 font-semibold text-panna hover:bg-salvia-scura"
          onClick={onRiprova}
        >
          Riprova
        </button>
      </div>
    )
  }
  return children(stato.attivita)
}

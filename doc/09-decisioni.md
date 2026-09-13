# 09 · Decisioni

| Data | Decisione | Esito |
|---|---|---|
| 2026-09-13 | Riscrittura **da zero**; il vecchio progetto resta in `OLD/` solo come riferimento locale, escluso da git | deciso |
| 2026-09-13 | Nome **Projects**, repository pubblico, licenza **MIT** | deciso |
| 2026-09-13 | Hosting **GitHub Pages** su `giacomoguaresi.github.io/Projects` | deciso |
| 2026-09-13 | Stack **Vite + React + TypeScript** | deciso |
| 2026-09-13 | Utenti: proprietario e partner allo stesso livello, nessun filtro per utente, nessun assegnatario | deciso |
| 2026-09-13 | Uso da mobile **e** desktop | deciso |
| 2026-09-13 | ~~Accesso con **passkey**~~ (equivoco: si intendeva passphrase) | superata |
| 2026-09-13 | Accesso con **lo stesso account di Grocery** e **solo passphrase**, come Grocery | deciso |
| 2026-09-13 | **Sessione condivisa** con Grocery: cookie con percorso `/` in entrambe le app (una riga da cambiare in Grocery) | deciso |
| 2026-09-13 | Nessun pulsante "Esci", come Grocery | deciso |
| 2026-09-13 | Interfaccia solo in **italiano**, solo **tema chiaro**, palette **verde salvia e verde pastello** | deciso |
| 2026-09-13 | **Coerenza estetica con Grocery**: stessa struttura (intestazione piena, menu laterale), stesso font, stesse icone Lucide, colori diversi | deciso |
| 2026-09-13 | Navigazione con **menu laterale a scomparsa** (☰), sempre aperto da 1024px, come Grocery | deciso |
| 2026-09-13 | Icona dell'app: stesso sistema di Grocery, disegno `list-checks` panna su salvia `#587654` | deciso |
| 2026-09-13 | Le voci si chiamano **"Attività"** nell'interfaccia | deciso |
| 2026-09-13 | **Niente entità "progetto"**: il progetto è un campo di testo libero e facoltativo sull'attività, con suggerimenti | deciso |
| 2026-09-13 | Icona del progetto generata dal nome: iniziali + colore da hash, niente immagini | deciso |
| 2026-09-13 | Stati dell'attività: **da fare, in corso, bloccato, completo**. Niente backlog; un'attività annullata si elimina | deciso |
| 2026-09-13 | Priorità **1–5 stelle** | deciso |
| 2026-09-13 | Avanzamento % **manuale**, portato a 100 automaticamente quando l'attività è completa | deciso |
| 2026-09-13 | Niente scadenze, ricorrenze, kanban, calendario, pagina di dettaglio | deciso |
| 2026-09-13 | Voci di diario **modificabili**; **nessun autore** (account condiviso) | deciso |
| 2026-09-13 | Tag: **lista fissa nel codice**, ridotta: **urgente, fai da te, guasto, idea**, più `ia` riservato all'assistente | deciso |
| 2026-09-13 | Dashboard con **In corso**, **Da fare** e **Bloccate** in tre sezioni, UX simile alla vecchia | deciso |
| 2026-09-13 | La **Dashboard** diventa la vista a card per progetto; le tre sezioni per stato passano alla pagina **Per stato** (`#/stato`) | deciso |
| 2026-09-13 | Pagina Attività: completate **nascoste di default**, interruttore "Mostra completate" | deciso |
| 2026-09-13 | Cambio del progetto su un'attività esistente: dialogo **"solo questa / tutte"**; "tutte" = rinomina (anche unione con un progetto esistente) | deciso |
| 2026-09-13 | **Nessun selettore delle colonne** (poche colonne; eventualmente in futuro) | deciso |
| 2026-09-13 | Stile con **Tailwind CSS** (Grocery usa CSS a mano: la coerenza è visiva, non di implementazione) | deciso |
| 2026-09-13 | Contenuto su PC più largo di Grocery (max ~1200px) per le tabelle | deciso |
| 2026-09-13 | Niente offline, notifiche, allegati, spese, esportazione, backup, import dal vecchio DB | deciso |
| 2026-09-13 | Assistente IA **in una fase successiva**, con un provider a tier gratuito ancora da scegliere | deciso |
| 2026-09-13 | **Progetto Supabase di produzione di Grocery**; sviluppo direttamente sui dati veri | deciso |
| 2026-09-13 | Tabelle in uno **schema Postgres dedicato `projects`**, nomi in italiano come Grocery | deciso |
| 2026-09-13 | Script SQL numerati e applicati a mano, non con `supabase db push`, per non entrare in conflitto con lo storico migrazioni di Grocery | deciso |
| 2026-09-13 | Policy RLS "solo la sessione autenticata", come Grocery | deciso |
| 2026-09-13 | Sessione nei **cookie** (`@supabase/ssr`), come Grocery | deciso |
| 2026-09-13 | Nessun keep-alive: il progetto resta attivo grazie a Grocery | deciso |
| 2026-09-13 | Test con **Vitest** sulla logica pura; nessun test di componenti o end-to-end | deciso |
| 2026-09-13 | Routing con hash (`#/`, `#/attivita`) | deciso |
| 2026-09-13 | **Sfondo doodle a tema casa**, come Grocery, generato da script con seed fisso | deciso |
| 2026-09-13 | Pulsante **+ Nuova attività** a destra nell'intestazione, oltre alla voce nel menu | deciso |
| 2026-09-13 | Documentazione completa: si passa all'implementazione | deciso |
| 2026-09-13 | Nuovi tag: **progetto** (da finire di pensare), **inverno** ed **estate** (stagionali), **cucito**, **natalizio**, **cucina** | deciso |

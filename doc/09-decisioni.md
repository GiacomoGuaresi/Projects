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
| 2026-09-14 | **Faccende**: attività veloci con solo titolo e da fare / fatta, in una **tabella separata** `faccende`; card in cima alla Dashboard e pagina nel menu; le fatte si eliminano **a fine giornata** | deciso |
| 2026-09-25 | **Faccende ricorrenti**: tabella `ricorrenze` con regola "ogni N giorni / settimane (giorni scelti) / mesi / anni"; le faccende si creano **dall'app alla lettura**, niente job nel database; **una sola aperta per ricorrenza** (indice univoco), le occorrenze saltate non si recuperano | deciso |
| 2026-09-25 | **Via la descrizione** delle attività: non si usava, bastano titolo e diario. Colonna tolta con `004_senza_descrizione.sql` | deciso |
| 2026-09-27 | **Valigia**: lista di Action nel codice, filtrata per **tipi di viaggio combinabili** e con quantità per **giorni**; spunte nei **cookie**, niente database; **Reset** toglie le spunte e lascia il viaggio | deciso |
| 2026-09-27 | Valigia: via la sezione **bambini** e il tipo di viaggio *Bambini* (lista solo per noi) | deciso |
| 2026-09-27 | Valigia ritagliata su di noi: tipi **mare, montagna, rifugio, città, campeggio** (via lavoro, aereo, auto, estero); voci **raggruppate con un sottotitolo** (portafogli, farmaci, trucchi, letture, giochi, tenda, cucina); categoria **Beauty** al posto di farmaci e cura personale; via snack, "prima di partire" e parte di spiaggia e campeggio | deciso |
| 2026-09-27 | Valigia a due: ogni voce è **di tutti e due** (una casella a testa, Jack blu e Ale rossa), **di uno solo** o **comune** (una casella larga, gialla/arancione); categorie al massimo su **2 colonne** | deciso |
| 2026-09-27 | Valigia a **wizard**: passo 1 giorni e tipi, passo 2 la lista; il vecchio Reset diventa **Nuova valigia** in fondo alla lista, che toglie le spunte e riporta al passo 1 tenendo il viaggio di prima come punto di partenza | deciso |
| 2026-09-27 | Valigia **nel database**, al contrario di prima: tabelle `valigia` (una riga, il viaggio e il passo) e `valigia_spunte` (una riga per casella spuntata, così le spunte di due telefoni non si sovrascrivono); **Supabase Realtime** per vederle subito sugli altri telefoni; "Nuova valigia" con la funzione `nuova_valigia()`. Solo "Nascondi prese" resta nel cookie | deciso |
| 2026-09-27 | Via le pagine **Per stato** e **Attività** (con filtri e paginazione): non si usavano, basta la Dashboard. I vecchi indirizzi `#/stato` e `#/attivita` portano alla Dashboard | deciso |
| 2026-10-02 | **Foresta**: prato isometrico con un albero per attività completata (boschetti per progetto) e un arbusto per faccenda fatta; alberi in **SVG generati dal codice** con seed, niente immagini. Gli alberi si leggono da `attivita` (se si riapre l'attività l'albero sparisce, contano anche le completate di prima); per gli arbusti basta un **contatore** `contatori.faccende_fatte` aggiornato da trigger, anche se approssimato, perché le faccende fatte si eliminano a fine giornata | deciso |
| 2026-10-02 | Foresta: **tutte le attività** sono piante (germoglio da fare, alberello in corso, albero completo, albero secco bloccato), in ordine di **creazione** perché restino al loro posto crescendo; riaprire un'attività la riporta alberello invece di farla sparire. Zolle sempre in **toni di verde** | deciso |
| 2026-10-02 | **Foresta viva**: stagione e giorno/notte dal **calendario e dall'ora reali**; meteo **reale da Open-Meteo** per **Milano** (coordinate fisse, niente geolocalizzazione; se non risponde, sereno); terreno con **colline, laghetti, sentieri e rocce** da un rumore con seed fisso; vento, uccelli, farfalle, lucciole, foglie che cadono, stelle e luna in fase reale; **nessuna libreria di animazione** (CSS, SVG e un solo canvas); con "riduci movimento" tutto fermo | deciso |
| 2026-10-03 | **Foresta come sfondo** dei dispositivi: un repo a parte (**ProjectsWallpaper**) fotografa ogni ora `#/foresta?sfondo` con Playwright in GitHub Actions, entrando con la passphrase tenuta come **secret** di quel repo, e pubblica le PNG su **GitHub Pages** (pubbliche: solo alberi e colori, niente titoli); PC e telefono scaricano solo la PNG. In Projects basta la modalità sfondo, non un renderer a parte | deciso |
| 2026-10-03 | **Overlay sullo sfondo**: resta una PNG statica (niente app di sfondi web); pannelli **oggi** (data, meteo con temperatura, alba e tramonto, luna) e **numeri** della foresta, scelti con parametri nell'hash formato per formato. Siccome la PNG è pubblica, **solo dati non sensibili**: niente titoli né nomi di progetti. Niente orologio, perché la foto è oraria: "aggiornato alle" | deciso |

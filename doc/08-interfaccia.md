# 08 · Interfaccia

Due riferimenti:
- **Contenuti** simili al vecchio progetto: tabelle con modifica inline su desktop, card su mobile, modali per descrizione e diario.
- **Stile e navigazione** coerenti con **Grocery**: stessa struttura, stesse icone, stesso font, colori diversi.

Interfaccia solo in italiano, solo tema chiaro, stile con **Tailwind CSS**. Le voci si chiamano **Attività**.

## Coerenza con Grocery

| Aspetto | Grocery | Projects |
|---|---|---|
| Intestazione | terracotta piena, scritte bianche, icona dell'app + titolo | **salvia** piena, scritte bianche, icona dell'app + "Projects" |
| Barra di stato del telefono (`theme-color`) | terracotta | salvia (`#587654`) |
| Fondo | panna | verde pastello chiarissimo |
| Menu laterale | bianco | bianco |
| Icone | disegni Lucide a tratto, colore del testo, mai emoji | uguale (lucide-react) |
| Font | `'Avenir Next', 'Segoe UI', system-ui, -apple-system, sans-serif` | uguale |
| Scala | compatta; campi di testo a 16px (niente zoom su iOS) | uguale |
| Animazioni | brevi (~200ms), rispettano "riduci movimento" | uguale |
| Sfondo | doodle a tema cucina | **doodle a tema casa**, stesso sistema (vedi "Sfondo") |
| Larghezza del contenuto su PC | max 720px | **più larga** (tabelle): max ~1200px, intestazione sempre da bordo a bordo |

## Navigazione

Come Grocery: un **menu laterale a scomparsa**, aperto dal pulsante ☰ nell'intestazione. **Da desktop** (almeno 1024px) il menu è **sempre aperto**, come colonna fissa a sinistra, senza ☰ e senza ✕. Si chiude toccando fuori, con ✕, con Esc o scegliendo una voce.

| Gruppo | Voce | Icona Lucide |
|---|---|---|
| Sezioni | **Dashboard** | `layout-dashboard` |
| Sezioni | **Per stato** | `layout-list` |
| Sezioni | **Attività** | `list-checks` |
| Sezioni | **Faccende** | `broom` |
| Azioni (staccate) | **Nuova attività** → apre il modale | `plus` |
| Piede | **Installa l'app** (sparisce se già installata; apre il prompt del browser o le istruzioni) | `download` |

**Scorciatoia "Nuova attività"**: un pulsante **+** (`plus`) **a destra nell'intestazione**, sempre visibile, così su mobile non serve aprire il menu. Su mobile mostra solo l'icona, da desktop anche l'etichetta "Nuova attività".

## Sfondo

Come Grocery: uno sfondo "doodle" dietro il contenuto.
- Poche icone grandi, **bianche**, sparse e ruotate sul fondo verde pastello, su un riquadro che si ripete senza giunture.
- Icone a tema casa, dallo stesso set Lucide dell'app: `house`, `hammer`, `wrench`, `lightbulb`, `paint-roller`, `key-round`.
- Generato da `scripts/genera-sfondo.ts` (`npm run sfondo`), sul modello dello script di Grocery: seed fisso quindi risultato riproducibile, riquadro 480px, 12 icone, 64–104px, rotazione ±25°, tratto 3px, distanza minima tra le icone. Il risultato è `src/ui/sfondo-casa.svg`, versionato.
- Tabelle, card e modali restano su superficie bianca piena, quindi lo sfondo si vede solo ai margini e non disturba la lettura.

## Accesso

Stessa schermata di Grocery:
- icona dell'app, titolo "Projects", campo **Passphrase**, pulsante **Entra**;
- messaggi distinti per "Passphrase sbagliata" e per l'errore di connessione;
- se Supabase non è raggiungibile per mancanza di configurazione, un avviso dedicato;
- con la sessione condivisa, chi è già entrato in Grocery non vede questa schermata.

## Per stato

Tre sezioni collassabili, ciascuna con il conteggio tra parentesi:

| Sezione | Stato mostrato | Aperta di default |
|---|---|---|
| **In corso** | `in_corso` | sì |
| **Da fare** | `da_fare` | no |
| **Bloccate** | `bloccato` | no |

- Ordinamento dentro ogni sezione: progetto (A→Z, senza progetto in fondo), poi priorità decrescente, poi titolo.
- Paginazione da 50 per sezione.
- Righe e card identiche alla pagina Attività, ma senza il pulsante elimina.
- Quando un'attività cambia stato, passa subito nella sezione giusta (o sparisce, se completata) con un'animazione breve.

## Dashboard

La pagina iniziale (`#/`).

- In alto il titolo **"Progetti"** con il numero di card e, accanto, una fila di **interruttori on/off** a pillola (acceso: salvia chiaro; spento: bianco con bordo). Ognuno è ricordato in un **cookie** (percorso `/Projects/`, durata un anno).
  - **In corso** (`play`, cookie `projects_in_corso`, spento di default): acceso mostra **solo** le attività in corso e **ha la precedenza** sugli altri interruttori, che restano com'erano ma attenuati e non toccabili. Le card senza attività in corso spariscono; l'aggiunta rapida crea l'attività già *In corso* ("Aggiungi attività in corso"). Spento, la vista torna normale.
  - **Completi** (`circle-check`, cookie `projects_completi`, acceso di default): spento nasconde le attività completate dalle card; il conto `completate/totale` non cambia e le card restano, con l'aggiunta rapida.

- Una **card per progetto** con **tutte** le sue attività, completate comprese.
- Card in tre gruppi: prima i **preferiti**, poi gli altri, poi gli **accantonati**; in ogni gruppo ordine di progetto (A→Z, senza distinguere maiuscole e minuscole), la card **"Senza progetto"** in fondo al suo gruppo.
- **Stellina** a destra nell'intestazione della card: piena (`star`, colore stella) se preferito, vuota se normale, `star-off` se accantonato. **Toccarla** mette o toglie il progetto dai preferiti (un accantonato diventa preferito). **Tenerla premuta** (~400ms) apre un menu *Preferito* / *Normale* / *Accantonato* che si usa come quello dello stato. La scelta è per progetto (senza distinguere maiuscole e minuscole) e ricordata nel cookie `projects_rilievi` (percorso `/Projects/`, durata un anno), quindi vale solo su quel dispositivo. Da PC (almeno 1024px) **due colonne sfalsate**, come il disegno di `layout-dashboard`: ogni card è alta quanto il suo contenuto e quella sotto le sta subito sotto, senza allinearsi alle righe dell'altra colonna. Sotto, una colonna sola.
- Intestazione della card: icona e nome del progetto, attività **completate sul totale** del progetto (es. `4/10`).
- Dentro la card: prima *In corso*, poi *Da fare*, poi *Bloccate*; a parità di stato priorità decrescente, poi titolo.
- **Toccare l'icona dello stato** a inizio riga lo fa avanzare: *Da fare* → *In corso* → *Completo* (con la solita conferma); *Completo* e *Bloccato* → *In corso*.
- **Tenere premuta l'icona dello stato** (~400ms, con una breve vibrazione dove supportata) apre un **menu con tutti gli stati** sopra l'icona (sotto, se in alto non c'è spazio): facendo scorrere il dito sullo stato voluto questo si evidenzia, e **rilasciando lo si imposta** (*Completo* con la solita conferma). Rilasciato fuori dal menu o sullo stato attuale non cambia nulla; rilasciato senza muovere il dito il menu resta aperto e si sceglie con un tocco. Si chiude toccando fuori, con Esc o scorrendo la pagina. Da desktop si apre anche con il tasto destro.
- Ogni attività mostra **solo** l'icona dello stato (con i colori dello stato), il titolo con i badge e il pulsante **Diario** (`book-open`, evidenziato se ha voci, apre il modale diario); **toccare un punto qualsiasi della riga** fuori dal pulsante apre il modale dettagli; ogni modifica, stato compreso, si fa nel modale dettagli.
- Il **bordo inferiore** di ogni riga è l'**avanzamento**: una linea salvia larga quanto la percentuale, sopra la linea divisoria; al 100% non si mostra.
- **Tenere premuto il titolo** (~400ms) e poi **trascinare in orizzontale** cambia l'avanzamento: si parte dal valore attuale, tutta la larghezza della riga vale 100%, a passi del 5%. Mentre si trascina la linea si ingrossa e sopra la riga compare la percentuale; al rilascio si salva, e non si aprono i dettagli. Non vale per le attività completate, ferme al 100%.
- Le **completate** stanno in fondo alla card, dalla più recente, con il titolo **grigio e barrato**.
- **Aggiunta rapida** come ultima riga di ogni card: campo "Aggiungi attività" (`plus`); Invio (o il pulsante + che compare scrivendo) crea un'attività *Da fare*, 3 stelle, nel **progetto della card** (nessun progetto nella card "Senza progetto"). Il campo si svuota e resta pronto per la successiva; Esc lo svuota. Un errore di salvataggio compare sotto il campo, con il testo conservato.

## Faccende

Attività veloci e ripetitive che si spiegano da sole ("Passare l'aspirapolvere"): **solo il titolo** e **da fare / fatta**. Niente progetto, priorità, avanzamento, descrizione, diario o tag.

- Una **card "Faccende"** (`broom`) in cima alla **Dashboard**, sotto gli interruttori e sopra le card dei progetti, e la stessa card da sola nella pagina **Faccende** (`#/faccende`).
- Intestazione con le faccende **fatte oggi sul totale** (es. `2/5`).
- Prima le **da fare**, dalla più vecchia; poi le **fatte**, dalla più recente, **grigie e barrate**.
- **Toccare la riga** la segna fatta, senza conferma; toccarla di nuovo la riporta da fare.
- Le fatte restano visibili **fino a mezzanotte**, poi si **eliminano da sole** (all'apertura dell'app o al ritorno in primo piano).
- Gli interruttori della Dashboard valgono anche qui: con **In corso** acceso o **Completi** spento le fatte si nascondono. Nella pagina Faccende si vedono sempre.
- **Aggiunta rapida** come ultima riga, uguale a quella delle card dei progetti: "Aggiungi faccenda".
- Le faccende non compaiono nelle pagine Per stato e Attività, né nel modale "Nuova attività".

## Modale dettagli

Aperto toccando una riga della Dashboard; titolo del modale = titolo senza tag.
- Campi modificabili con le stesse regole delle righe: **Titolo** (con sotto la scritta "Scrivi < per aggiungere un tag", come in "Nuova attività"), **Progetto** (con "solo questa / tutte"), **Priorità**, **Stato** (conferma per *Completo*), **Avanzamento**.
- **Descrizione** resa in Markdown, con *Modifica* / *Aggiungi* che apre il modale descrizione sopra.
- Date di creazione, modifica e completamento; pulsante **Diario** (evidenziato se ha voci) che apre il modale diario sopra.
- In fondo, pulsante **Elimina** (`trash-2`, rosso) con la stessa conferma della pagina Attività; eliminata l'attività, il modale si chiude.

## Pagina Attività

- **Filtri**: testo (cerca nel titolo e nel progetto), stato, priorità, progetto (con suggerimenti), pulsante *Azzera*.
- Interruttore **"Mostra completate"**, spento di default. Scegliere *Completo* nel filtro di stato lo accende da solo.
- Ordinamento: come la pagina Per stato. Con le completate visibili, queste vanno in fondo, dalla più recente.
- Paginazione con scelta di 25 / 50 / 100 righe.
- Colonne fisse, senza selettore.

## Riga (desktop) e card (mobile)

| Campo | Visualizzazione | Modifica |
|---|---|---|
| Progetto | icona (iniziali e colore) + nome | clic → campo con suggerimenti; vedi "Cambio del progetto" |
| Titolo | testo con tag come badge | clic → campo di testo, Invio salva, Esc annulla |
| Stato | gruppo di pulsanti con icona e colore | clic sul pulsante; passare a *Completo* chiede conferma |
| Priorità | 5 stelle (`star`) | clic sulla stella |
| Avanzamento | barra + % | clic → slider / numero |
| Azioni | `file-text` descrizione · `book-open` diario · `trash-2` elimina (solo nella pagina Attività) | icone evidenziate se descrizione o diario non sono vuoti |

Icone degli stati: *Da fare* `circle` · *In corso* `play` · *Bloccato* `ban` · *Completo* `circle-check`.

## Cambio del progetto

Quando si modifica il progetto di un'attività **esistente**:

1. Se il progetto di partenza è vuoto, oppure nessun'altra attività lo usa → si salva e basta.
2. Altrimenti compare un dialogo:

   > Cambiare il progetto da **Bagnio** a **Bagno**?
   > **[Solo questa attività]** · **[Tutte le 12 attività di "Bagnio"]** · [Annulla]

   - *Solo questa*: l'attività **passa a un altro progetto**.
   - *Tutte*: è una **rinomina** (o la correzione di un errore di battitura). Chiama `rinomina_progetto` e aggiorna tutte le attività, completate comprese. Se il nuovo nome esiste già, i due progetti si uniscono.
3. Svuotare il campo segue la stessa logica: *Solo questa* toglie il progetto all'attività, *Tutte* lo toglie a tutte.

Nel modale "Nuova attività" non c'è nessun dialogo.

## Modale "Nuova attività"

Campi: **Titolo** (obbligatorio, con i suggerimenti dei tag e sotto la sola scritta "Scrivi < per aggiungere un tag"), **Progetto** (facoltativo, con suggerimenti), **Stato** (default *Da fare*), **Priorità** (default 3 stelle), **Descrizione** (Markdown, con anteprima e aiuto sulla sintassi). Invio nel titolo crea l'attività. A schermo intero su mobile.

## Modale descrizione

Titolo dell'attività; vista Markdown resa, con checklist; pulsante *Modifica* → textarea con *Salva*. Se la descrizione è vuota si apre direttamente in modifica.

## Modale diario

- Elenco cronologico, la voce più recente in basso ed evidenziata; le precedenti attenuate.
- Ogni voce mostra data e ora (formato italiano), più "modificata" se è stata cambiata. Nessun autore.
- Azioni sulla voce: **modifica** (inline, Salva/Annulla) ed **elimina** (con conferma).
- In basso: textarea e pulsante *Invia*; Cmd/Ctrl+Invio invia.

## Icona del progetto

- **Iniziali**: i primi due caratteri del nome, in maiuscolo ("Casa" → **CA**).
- **Colore**: tonalità ricavata da un hash del nome in minuscolo, quindi sempre uguale per lo stesso progetto.
- Saturazione e luminosità adattate alla palette pastello, con testo scuro leggibile.
- Nessun progetto → nessuna icona, testo "—".

## Icona dell'app (PWA)

Stesso sistema di Grocery, colori diversi:
- `public/icona.svg` 512×512, rettangolo con angoli arrotondati (`rx="112"`) pieno;
- disegno Lucide a tratto al centro, color panna `#fffbf6`, spessore 1.8, stessa trasformazione di Grocery;
- **sfondo salvia `#587654`**, disegno **`list-checks`** (lista con spunte);
- stesso disegno, in piccolo, nell'intestazione accanto al titolo;
- icone PWA generate con `@vite-pwa/assets-generator` (`npm run icone`), sfondo salvia per le versioni maskable e Apple.

## Tag

Lista fissa nel codice (`src/dominio/tag.ts`).
- Nel titolo si scrivono tra parentesi angolari (`<urgente> Chiamare l'idraulico`) e compaiono come badge con icona e colore.
- Il riconoscimento ignora maiuscole e minuscole; più tag nello stesso titolo sono ammessi.
- I badge si mostrano sempre in **maiuscolo**, e il modale "Nuova attività" inserisce il tag in maiuscolo (`<URGENTE>`).

| Tag | Icona Lucide | Colore | Uso |
|---|---|---|---|
| `urgente` | `flame` | rosso tenue | va fatto presto |
| `fai da te` | `hammer` | sabbia | lavoro manuale da fare in autonomia |
| `guasto` | `wrench` | terracotta tenue | qualcosa da riparare o far riparare |
| `idea` | `lightbulb` | giallo | da valutare, nessun impegno |
| `progetto` | `drafting-compass` | ardesia | non ancora definito, da finire di pensare |
| `inverno` | `snowflake` | blu | da fare d'inverno |
| `estate` | `sun` | arancio | da fare d'estate |
| `cucito` | `scissors` | rosa | lavoro di cucito |
| `natalizio` | `gift` | verde | per Natale |
| `cucina` | `chef-hat` | pesca | ricette e cose da cucinare |
| `ia` | `sparkles` | viola | *riservato*: lo aggiungerà l'assistente IA (fase 4) |

- Un tag non in elenco appare come badge neutro (`tag`, grigio).
- **Suggerimenti**: in ogni campo del titolo (modale "Nuova attività", modifica inline, modale dettagli), scrivendo `<` compare l'elenco dei tag (badge e uso), filtrato da ciò che segue, prima quelli che iniziano così; mai i riservati. Frecce per scorrere, Invio, Tab o tocco per scegliere, Esc per chiudere l'elenco. Il tag scelto sostituisce quello in corso, in maiuscolo e seguito da uno spazio.
- Scartati: tag che duplicano uno stato (bloccato, in attesa) o un progetto (casa, giardino, auto), e acquisto, appuntamento, pratiche, pagamento.

## Palette *(colori del tema Tailwind, da rifinire in fase di UI)*

| Ruolo | Colore | Note |
|---|---|---|
| Salvia (intestazione, pulsanti principali, icona dell'app) | `#587654` | testo panna/bianco con contrasto ≥ 4.5:1 |
| Salvia scura (hover, testo attivo nel menu) | `#445D41` | |
| Salvia chiara (accenti, stati selezionati) | `#7E9F7A` | |
| Verde pastello (evidenziazioni, badge) | `#D6E8CF` | |
| Fondo (verde pastello chiarissimo) | `#F3F8F0` | |
| Superficie (card, tabelle, menu) | `#FFFFFF` | |
| Panna (testo su salvia, disegno dell'icona) | `#FFFBF6` | come Grocery |
| Testo | `#2E3A2D` | |
| Testo secondario | `#63725F` | contrasto ≥ 4.5:1 anche sul fondo |
| Bordi | `#DDE6D8` | |
| Pericolo (elimina) | `#A8333A` | lo stesso "pomodoro" di Grocery |

Colori degli stati:

| Stato | Colore |
|---|---|
| Da fare | grigio-azzurro tenue |
| In corso | salvia chiara |
| Bloccato | terracotta tenue |
| Completo | verde pieno |

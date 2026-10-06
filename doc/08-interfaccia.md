# 08 · Interfaccia

Due riferimenti:
- **Contenuti** simili al vecchio progetto: tabelle con modifica inline su desktop, card su mobile, modale per il diario.
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
| Sezioni | **Faccende** | `broom` |
| Sezioni | **Valigia** | `luggage` |
| Sezioni | **Foresta** | `trees` |
| Azioni (staccate) | **Nuova attività** → apre il modale | `plus` |
| Piede | **Widget Android**: apre in una nuova scheda l'ultima Release di ProjectsWallpaper, con l'APK del widget della Foresta | `smartphone` |
| Piede | **Installa l'app** (sparisce se già installata; apre il prompt del browser o le istruzioni) | `download` |

**"Vai alla foresta"**: nell'intestazione, subito a sinistra del **+**, un pulsante con l'icona `trees` che apre `#/foresta`; su mobile solo l'icona, da desktop anche l'etichetta. Sulla Foresta non c'è.

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

## Dashboard

La pagina iniziale (`#/`).

- In alto il titolo **"Progetti"** con il numero di card e, accanto, una fila di **interruttori on/off** a pillola (acceso: salvia chiaro; spento: bianco con bordo). Ognuno è ricordato in un **cookie** (percorso `/Projects/`, durata un anno).
  - **In corso** (`play`, cookie `projects_in_corso`, spento di default): acceso mostra **solo** le attività in corso e **ha la precedenza** sugli altri interruttori, che restano com'erano ma attenuati e non toccabili. Le card senza attività in corso spariscono; l'aggiunta rapida crea l'attività già *In corso* ("Aggiungi attività in corso"). Spento, la vista torna normale.
  - **Completi** (`circle-check`, cookie `projects_completi`, acceso di default): spento nasconde le attività completate dalle card; il conto `completate/totale` non cambia e le card restano, con l'aggiunta rapida. Fanno eccezione i progetti con **tutte** le attività completate: la loro card compare solo con *Completi* acceso.

- Una **card per progetto** con **tutte** le sue attività, completate comprese.
- Card in tre gruppi: prima i **preferiti**, poi gli altri, poi gli **accantonati**; in ogni gruppo ordine di progetto (A→Z, senza distinguere maiuscole e minuscole), la card **"Senza progetto"** in fondo al suo gruppo.
- **Stellina** a destra nell'intestazione della card: piena (`star`, colore stella) se preferito, vuota se normale, `star-off` se accantonato. **Toccarla** mette o toglie il progetto dai preferiti (un accantonato diventa preferito). **Tenerla premuta** (~400ms) apre un menu *Preferito* / *Normale* / *Accantonato* che si usa come quello dello stato. La scelta è per progetto (senza distinguere maiuscole e minuscole) e ricordata nel cookie `projects_rilievi` (percorso `/Projects/`, durata un anno), quindi vale solo su quel dispositivo. Da PC (almeno 1024px) **due colonne sfalsate**, come il disegno di `layout-dashboard`: ogni card è alta quanto il suo contenuto e quella sotto le sta subito sotto, senza allinearsi alle righe dell'altra colonna. Sotto, una colonna sola.
- Intestazione della card: icona e nome del progetto, attività **completate sul totale** del progetto (es. `4/10`).
- Dentro la card: prima *In corso*, poi *Da fare*, poi *Bloccate*; a parità di stato priorità decrescente, poi titolo.
- **Toccare l'icona dello stato** a inizio riga lo fa avanzare: *Da fare* → *In corso* → *Completo* (con la solita conferma); *Completo* e *Bloccato* → *In corso*.
- **Tenere premuta l'icona dello stato** (~400ms, con una breve vibrazione dove supportata) apre un **menu con tutti gli stati** sopra l'icona (sotto, se in alto non c'è spazio): facendo scorrere il dito sullo stato voluto questo si evidenzia, e **rilasciando lo si imposta** (*Completo* con la solita conferma). Rilasciato fuori dal menu o sullo stato attuale non cambia nulla; rilasciato senza muovere il dito il menu resta aperto e si sceglie con un tocco. Si chiude toccando fuori, con Esc o scorrendo la pagina. Da desktop si apre anche con il tasto destro.
- Ogni attività mostra **solo** l'icona dello stato (con i colori dello stato), il titolo con i badge e il pulsante **Diario** (`book-open`, con un pallino di notifica se ha voci; apre il modale diario); **toccare un punto qualsiasi della riga** fuori dal pulsante apre il modale dettagli; ogni modifica, stato compreso, si fa nel modale dettagli.
- Il **bordo inferiore** di ogni riga è l'**avanzamento**: una linea salvia larga quanto la percentuale, sopra la linea divisoria; al 100% non si mostra.
- **Tenere premuto il titolo** (~400ms) e poi **trascinare in orizzontale** cambia l'avanzamento: si parte dal valore attuale, tutta la larghezza della riga vale 100%, a passi del 5%. Mentre si trascina la linea si ingrossa e sopra la riga compare la percentuale; al rilascio si salva, e non si aprono i dettagli. Non vale per le attività completate, ferme al 100%.
- Le **completate** stanno in fondo alla card, dalla più recente, con il titolo **grigio e barrato**.
- **Aggiunta rapida** come ultima riga di ogni card: campo "Aggiungi attività" (`plus`); Invio (o il pulsante + che compare scrivendo) crea un'attività *Da fare*, 3 stelle, nel **progetto della card** (nessun progetto nella card "Senza progetto"). Il campo si svuota e resta pronto per la successiva; Esc lo svuota. Un errore di salvataggio compare sotto il campo, con il testo conservato.

## Faccende

Attività veloci e ripetitive che si spiegano da sole ("Passare l'aspirapolvere"): **solo il titolo** e **da fare / fatta**. Niente progetto, priorità, avanzamento, diario o tag.

- Una **card "Faccende"** (`broom`) nella **Dashboard**: è la **prima card delle colonne**, larga come quelle dei progetti (mezza pagina da PC). La stessa card, da sola, nella pagina **Faccende** (`#/faccende`).
- Colore **post-it giallo**: fondo `#FFFBE3` (molto chiaro), bordi e divisori `#EFE4B0`, così si distingue dalle card bianche dei progetti.
- Intestazione con le faccende **fatte oggi sul totale** (es. `2/5`).
- Prima le **da fare**, dalla più vecchia; poi le **fatte**, dalla più recente, **grigie e barrate**.
- **Toccare l'icona** a inizio riga (`circle` / `circle-check`) la segna fatta, senza conferma; toccarla di nuovo la riporta da fare.
- **Toccare il titolo** lo rende modificabile: Invio o clic fuori salvano, Esc annulla; un titolo svuotato non si salva.
- A fine riga il **cestino** (`trash-2`), **sempre visibile** come il pulsante Diario delle attività: elimina subito la faccenda, **senza conferma** (è un'attività usa e getta).
- Le fatte restano visibili **fino a mezzanotte**, poi si **eliminano da sole** (all'apertura dell'app o al ritorno in primo piano).
- Gli interruttori della Dashboard valgono anche qui: con **In corso** acceso o **Completi** spento le fatte si nascondono. Nella pagina Faccende si vedono sempre.
- **Aggiunta rapida** come ultima riga, uguale a quella delle card dei progetti: "Aggiungi faccenda".
- Le faccende non compaiono nel modale "Nuova attività".
- Una faccenda creata da una ricorrenza ha accanto al titolo una piccola icona `repeat`.

## Faccende ricorrenti

Pulizie e attività periodiche che si aggiungono da sole alle faccende ([04](04-modello-dati.md), `ricorrenze`).

- Nella pagina **Faccende**, sotto la card, una card bianca **"Ricorrenti"** (`repeat`): una riga per regola con titolo, frequenza a parole ("Ogni 2 settimane, lunedì e giovedì", "Ogni mese il 15", "Ogni anno l'8 dicembre") e **prossima** data ("oggi", "domani", "ven 3 ott"); quelle in pausa grigie con `pause`. Ultima riga **"Nuova ricorrente"**.
- **"Nuova ricorrente"** apre un **wizard** (a schermo intero su mobile), una domanda per passo, con la barra di avanzamento e *Indietro* / *Avanti*:
  1. **Cosa c'è da fare?** il titolo (Invio passa avanti);
  2. **Ogni quanto?** righe grandi *Ogni giorno · Ogni settimana · Ogni 2 settimane · Ogni mese · Ogni anno*, che al tocco passano avanti da sole; *Personalizzata* apre "Ogni [− N +]" con *giorni / settimane / mesi / anni*;
  3. **Quando?** i giorni della settimana (L M M G V S D, con *Lun–ven*, *Weekend*, *Tutti*), il giorno del mese (1–30 o *L'ultimo del mese*) o mese e giorno dell'anno; con "ogni N" anche **la prima volta**, tra le prossime N date. Si salta per *Ogni giorno*;
  4. **Tutto giusto?** titolo, regola a parole, prima volta e le due dopo; *Crea*.
- Toccare una riga apre lo stesso modale **in modifica**, con tutte le sezioni insieme (le frequenze come chip), **In pausa**, il riepilogo con le prossime date ed **Elimina** (rosso, con conferma): la faccenda già in elenco resta.
- Non si sceglie una data di inizio: la ricava l'app dalle scelte, e in modifica ritrova quella che dà le stesse date.
- Arrivato il giorno, la faccenda compare nella card (all'apertura dell'app o al ritorno in primo piano). Se quella precedente è ancora da fare **non se ne aggiunge un'altra**.

## Valigia

La lista delle cose da mettere in valigia (`#/valigia`), nata dalla [lista di controllo per le vacanze di Action](https://www.action.com/it-it/blog/vacanza/lista-di-controllo-per-le-vacanze/) e poi ritagliata su di noi. Le voci stanno nel codice (`src/dominio/valigia.ts`); viaggio, passo e spunte stanno nel **database**, condivisi tra i telefoni ([04](04-modello-dati.md), `valigia`).

Un **wizard in due passi**, lo stesso su tutti i telefoni: se uno prepara la lista, anche gli altri passano alla lista. Riaprendo l'app a metà valigia si torna lì.

1. **Il viaggio**: una card bianca stretta con **Quanti giorni?** (− N +, da 1 a 30) e **Che viaggio è?**, i tipi come pillole da accendere e spegnere, anche più d'uno: *Mare* (`sun`), *Montagna* (`mountain`), *Rifugio* (`house`), *Città* (`landmark`), *Campeggio* (`tent`). In fondo quante voci avrà la lista e il pulsante salvia **Prepara la lista** (`arrow-right`). Giorni e tipi partono da quelli dell'ultimo viaggio.
2. **La lista**: intestazione "Valigia" con le **caselle spuntate sul totale** (es. `12/80`); una card col riepilogo del viaggio (giorni e tipi con le loro icone), la barra di avanzamento, l'interruttore **Nascondi prese** (`eye-off`) e la legenda dei colori con le caselle prese da ciascuno: **Jack** (blu), **Ale** (rossa), **Comuni** (arancioni). Poi le card delle categorie e **in fondo** il pulsante **Nuova valigia** (`rotate-ccw`), molto evidente: pieno salvia, alto e largo quanto la lista. Chiede conferma con un modale, toglie tutte le spunte e torna al passo 1.

- Una card per **categoria**, in colonne (1 su mobile, 2 da tablet e PC), con le prese sul totale nel titolo (verde quando è completa): bagaglio a mano, abbigliamento, beauty, tecnologia, giochi e letture, spiaggia, escursioni, per dormire in rifugio, campeggio. Le voci senza tipo servono sempre; le altre se il viaggio ha almeno uno dei loro tipi (quelle da escursione valgono per *Montagna* e per *Rifugio*). Le categorie senza voci spariscono.
- Accanto al nome di una voce, i **simbolini dei tipi** scelti che l'hanno fatta comparire, piccoli e grigi, con le stesse icone delle pillole: uno per tipo (la protezione solare con *Mare* e *Rifugio* accesi ne ha due). Le categorie che dipendono per intero da un tipo (spiaggia, escursioni, rifugio, campeggio) hanno il simbolino nel titolo della card, non su ogni riga.
- Alcune voci **raggruppano** più cose e le elencano sotto l'etichetta, in piccolo (es. **Portafogli**: carta d'identità, patente, tessera sanitaria, bancomat / carta di credito, contanti; **Farmaci**; **Trucchi**; **Letture**; **Giochi**). Si spuntano con un tocco solo.
- Le voci che dipendono dalla durata mostrano la **quantità** (`×4`): un capo al giorno più uno, fino a 8 (oltre si lava); pantaloni uno ogni 3 giorni, pigiama uno ogni 4.
- **Di chi è ogni voce**: di tutti e due, una casella a testa (il predefinito, es. le mutande); di uno solo (es. il rasoio è di Jack, le lenti di Ale); oppure **comune**, una casella sola per la coppia (es. le chiavi di casa, i giochi, la tenda).
- A inizio riga **due colonne di caselle**, allineate tra le righe: a sinistra **Jack** (blu), a destra **Ale** (rossa). Una voce di uno solo lascia vuoto il posto dell'altro; una voce comune ha una **casella rettangolare larga quanto le due**, gialla da vuota e arancione da presa. Ogni casella porta la sigla **J**, **A** o **Com**; come il pulsante dello stato hanno **solo il fondo, senza bordo**: chiaro con la sigla colorata da vuote, pieno con solo `check` bianco, senza sigla, da prese.
- Una voce è **presa** quando lo sono tutte le sue caselle: allora il testo diventa grigio e barrato, e "Nascondi prese" la toglie. I conteggi, delle card e in cima, sono per casella.
- **Sincronizzata in tempo reale**: una spunta, un cambio di giorni o tipi, "Prepara la lista" e "Nuova valigia" compaiono subito sugli altri telefoni aperti (Supabase Realtime). La pagina rilegge tutto anche all'apertura, al ritorno in primo piano e quando la connessione torna.
- Ogni modifica si vede subito; se il salvataggio non riesce compare l'avviso e la valigia si rilegge. Durante il primo caricamento "Carico la valigia…", in caso di errore il messaggio e **Riprova**.
- Solo **"Nascondi prese"** resta sul telefono, nel cookie `projects_valigia_nascondi`. Una voce tolta dal catalogo sparisce anche dalle spunte.

## Foresta

Una piccola gamification (`#/foresta`), ispirata a Forest e Treedom: un'**isola isometrica in rilievo** sospesa nel cielo, grande quanto tutta la pagina, che cresce con quello che si completa e **vive col tempo vero**: stagione, ora del giorno e meteo di Milano. In alto a sinistra un pannello col titolo e i numeri ("Foresta · 32 alberi · 10 boschetti · 1 arbusto"), in alto a destra **+** e **−**.

- Ogni **attività** è una pianta che cresce col suo stato: **da fare** un germoglio, **in corso** un alberello, **completa** un albero, **bloccata** un albero secco. Le attività dello stesso progetto formano un **boschetto** su una zolla di un **verde suo** (dall'oliva al verde acqua, ricavato dal nome con `verdeZolla()`, sempre lo stesso per lo stesso progetto); il **nome** del boschetto non si vede sempre, compare sotto la zolla solo passandoci sopra col mouse o toccandolo. Quelle senza progetto stanno nel boschetto **Sparsi**. La foresta si legge sempre da `attivita`: se un'attività si riapre, il suo albero torna alberello; se si elimina, la pianta sparisce. Le piante stanno in ordine di creazione, quindi crescendo restano al loro posto.
- Ogni **faccenda fatta** è un **arbusto** sparso sul prato, dal conto `contatori.faccende_fatte` ([04](04-modello-dati.md)).
- Gli alberi sono **SVG disegnati nel codice** (`src/ui/foresta/Albero.tsx`): quattro specie (abete, chioma tonda, betulla, cipresso), altezza e verde scelti dall'id dell'attività, quindi l'alberello diventa proprio quell'albero. Le attività completate con priorità 4–5 portano qualche frutto. Nel pannello del titolo, sotto i numeri, quante piante sono in crescita e quante secche.
- La disposizione è nella logica pura (`src/dominio/foresta.ts`): gli alberi di un boschetto riempiono una spirale dal centro, in ordine di creazione, così un albero nuovo non sposta gli altri; i boschetti più vecchi stanno al centro; gli arbusti finiscono sempre negli stessi posti liberi.
- **Terreno** (`src/dominio/terreno.ts`): colline a gradini (4 livelli) da un rumore con seed fisso sulle coordinate, quindi allargandosi la foresta non cambia le colline che c'erano; **laghetti** nelle conche, **sentieri** di terra battuta da ogni boschetto al più vicino, qualche **roccia** in alto. Ogni boschetto sta su un **pianoro** alla quota del suo centro, raccordato al resto di un livello al massimo, senza acqua attorno. Caselle e oggetti si disegnano in un solo ordine di profondità (`src/ui/foresta/Scena.tsx`), così una collina davanti copre la base di un albero dietro.
- Toccando un albero (o la sua zolla) si **illumina il suo boschetto**, il resto si spegne, e in basso compare un pannello col nome del progetto, la barra delle completate e le attività per stato (completate, in corso, da fare, bloccate), con la data del primo e dell'ultimo albero. Toccando il prato vuoto o ✕ si torna a tutta la foresta.
- **Gesti** (`src/ui/foresta/useGesti.ts`): un dito o il mouse **trascinano** il prato, con un po' di inerzia; **due dita** (pinch) ingrandiscono e rimpiccioliscono attorno al punto tra le dita, da 1× a 4×; da PC lo stesso col **pinch del trackpad** o **Ctrl+rotella**, attorno al puntatore; **+** e **−** ingrandiscono di 1,5× attorno al centro. Sulla Foresta il browser **non ingrandisce la pagina** (`touch-action: none` e, su Safari, gli eventi `gesture` bloccati); nel resto dell'app lo zoom del browser resta, per l'accessibilità. Su telefono in verticale si parte da 1,5×.
- Le piante nuove o cambiate di stato dall'ultima visita **spuntano** con una breve animazione (le coppie id e stato già viste stanno in `localStorage`).
- Le piante create o modificate **oggi** (`modificata_il` di oggi) hanno un **bordo bianco** per tutta la giornata; non nello sfondo.
- Confermando *Completo* compare l'avviso "🌳 Albero piantato in …".

### Tempo e stagioni

L'ambiente (`src/dominio/ambiente.ts`, `src/ui/foresta/useAmbiente.ts`) segue il **calendario e l'ora del telefono** e il **meteo vero** di Milano (costante `CASA`), letto da [Open-Meteo](https://open-meteo.com/) (gratis, senza chiave, nessun dato personale: solo le coordinate fisse), tenuto mezz'ora in `localStorage` e riletto ogni mezz'ora e quando l'app torna in primo piano. Se Open-Meteo non risponde: sereno, alba e tramonto calcolati con la formula del sole. Nel pannello del titolo l'ultima riga dice stagione e meteo ("Autunno · pioggia a Milano").

- **Stagioni** (astronomiche: 21/3, 21/6, 23/9, 21/12): **primavera** verde tenero, qualche ciliegio rosa, fiorellini sul prato e petali che volano; **estate** come d'origine, lucciole di notte; **autunno** chiome dal rosso all'ambra (per lo più arancio), prato verde muschio smorzato con pareti bruno-oliva, boschetti dall'arancio all'oro, foglie a terra e foglie che cadono; **inverno** neve sul prato, laghetti ghiacciati, latifoglie spoglie con la neve sui rami, abeti, cipressi, rocce e arbusti innevati. Gli alberi secchi (bloccati) restano uguali in ogni stagione, con le loro foglie secche arancio.
- **Giorno e notte** dall'alba e dal tramonto veri: transizioni di 50 minuti con cielo rosa, sole di giorno, di notte cielo blu con **stelle** che brillano e la **luna nella sua fase reale**; un velo blu sull'isola in proporzione al buio.
- **Meteo**: nuvole quante ne vuole il cielo (grigie con pioggia e temporale), **pioggia** obliqua col vento, **neve**, **lampi** col temporale, velo di **nebbia**; col brutto tempo l'isola si scurisce un po'.
- **Vento**: alberi e arbusti ondeggiano dalla base, ognuno col suo ritmo; l'ampiezza e la velocità delle nuvole vengono dal vento vero (`--vento`, 0–1).
- **Animaletti**: stormi di uccelli che attraversano il cielo di giorno quando non piove; farfalle attorno ai boschetti in primavera ed estate.
- Pioggia, neve, foglie, petali, lucciole e lampi sono un solo `<canvas>` (`src/ui/foresta/Particelle.tsx`); il resto sono animazioni CSS e SVG. Con **"riduci movimento"** il canvas non parte, nuvole e stelle stanno ferme, uccelli e farfalle spariscono.
- **Prova la foresta** (override temporaneo, mai inviato al server): tenendo premuto il pannello del titolo, o con **Alt+Shift+F**, si apre un selettore con stagione, ora (alba, giorno, tramonto, notte), meteo e vento (calma, brezza, forte) da forzare; "Vero" torna al reale. Dalla **console dei DevTools**, finché la Foresta è aperta: `foresta.stagione('inverno')`, `foresta.ora('notte')`, `foresta.meteo('temporale')`, `foresta.vento(0.8)` (da 0 a 1); senza argomento un comando torna al vero, `foresta.reset()` toglie tutto, `foresta.stato()` mostra l'ambiente attuale. Un valore sbagliato è segnalato in console con quelli ammessi. L'override sta in `sessionStorage`: sopravvive al ricaricamento ma finisce chiudendo la scheda.

### Modalità sfondo

`#/foresta?sfondo` mostra **solo la scena**, a tutto schermo e senza intestazione, menu, pannelli né pulsanti; le piante sono tutte già cresciute (niente animazione) e lo zoom parte da 1×. Quando attività, arbusti e meteo sono arrivati segna `data-sfondo-pronto` su `<html>`. Serve al repo **ProjectsWallpaper**, che ogni ora la fotografa (con "riduci movimento" e l'ora di Roma) e pubblica la PNG usata come sfondo da PC e telefono. Senza sessione chiede la passphrase come il resto dell'app.

**Overlay** (`src/ui/foresta/OverlaySfondo.tsx`): con `pannelli=oggi,numeri` sopra la scena c'è una card a vetro scuro, in una delle quattro posizioni (`posizione=basso-sinistra`, il valore predefinito, oppure `alto-sinistra`, `basso-destra`, `alto-destra`), staccata dai bordi per non finire sotto la barra dei menu, il Dock o la barra di Windows. Senza `pannelli` c'è solo la scena.
- **oggi**: giorno e stagione; icona del cielo, temperatura e meteo di Milano (la temperatura è `temperature_2m` di Open-Meteo); alba, tramonto e fase della luna col suo nome (`nomeFaseLunare`).
- **numeri**: alberi, boschetti e arbusti; la barra delle completate su tutte le attività; gli alberi piantati negli ultimi 7 giorni, le piante in crescita e quelle secche, quando è stato piantato l'ultimo albero ("ieri", "3 giorni fa"). I numeri vengono da `numeriForesta()`, la stessa funzione del pannello del titolo.
- In fondo, "aggiornato alle": la foto cambia ogni ora, quindi **niente orologio**.
- La PNG è pubblica: **solo numeri, meteo e date**, mai titoli di attività o faccende né nomi di progetti.

## Modale dettagli

Aperto toccando una riga della Dashboard; titolo del modale = titolo senza tag.
- Campi modificabili con le regole descritte in "Campi di un'attività": **Titolo** (con sotto la scritta "Scrivi < per aggiungere un tag", come in "Nuova attività"), **Progetto** (con "solo questa / tutte"), **Priorità**, **Stato** (conferma per *Completo*), **Avanzamento**.
- Date di creazione, modifica e completamento; pulsante **Diario** (con un pallino di notifica se ha voci) che apre il modale diario sopra.
- In fondo, pulsante **Elimina** (`trash-2`, rosso) con conferma; eliminata l'attività, il modale si chiude.

## Campi di un'attività

| Campo | Visualizzazione | Modifica |
|---|---|---|
| Progetto | icona (iniziali e colore) + nome | clic → campo con suggerimenti; vedi "Cambio del progetto" |
| Titolo | testo con tag come badge | clic → campo di testo, Invio salva, Esc annulla |
| Stato | gruppo di pulsanti con icona e colore | clic sul pulsante; passare a *Completo* chiede conferma |
| Priorità | 5 stelle (`star`) | clic sulla stella |
| Avanzamento | barra + % | clic → slider / numero |
| Azioni | `book-open` diario · `trash-2` elimina (nel modale dettagli) | pallino di notifica sul diario se ha voci |

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

Campi: **Titolo** (obbligatorio, con i suggerimenti dei tag e sotto la sola scritta "Scrivi < per aggiungere un tag"), **Progetto** (facoltativo, con suggerimenti), **Stato** (default *Da fare*), **Priorità** (default 3 stelle). Invio nel titolo crea l'attività. A schermo intero su mobile.

## Modale diario

- Elenco cronologico, la voce più recente in basso ed evidenziata; le precedenti attenuate.
- Ogni voce mostra data e ora (formato italiano), più "modificata" se è stata cambiata. Nessun autore.
- Azioni sulla voce: **modifica** (inline, Salva/Annulla) ed **elimina** (con conferma).
- In basso: textarea e pulsante *Invia*; Cmd/Ctrl+Invio invia.
- Chiudere (X, Esc, tocco fuori) con una voce scritta e non inviata, o una modifica non salvata, chiede conferma (*Chiudi senza salvare*).

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

# 07 · Roadmap

## Fase 0 · Progettazione ✅
- [x] Vecchio progetto spostato in `OLD/`
- [x] Bozza della documentazione
- [x] Quattro giri di Q&A
- [x] Scelta dei tag
- [x] Documentazione senza punti aperti

## Fase 1 · Fondamenta ✅
- [x] `git init`, LICENSE MIT
- [x] Repository pubblico `Projects` su GitHub, variabili impostate, Pages attivo, primo deploy riuscito
- [x] Scaffold Vite + React + TS + Tailwind, Vitest
- [x] `.env.local` con le variabili di produzione di Grocery
- [x] `supabase/sql/001_schema.sql`: schema `projects`, tabelle, viste, trigger, funzione di rinomina, RLS, grant
- [x] Script applicato al progetto di produzione e verificato (RLS, policy, permessi di `anon`)
- [x] Schema `projects` esposto nella Data API
- [x] Accesso con passphrase verificato in locale
- [x] Sessione condivisa con Grocery verificata online (cookie di Grocery portato su `/`)
- [x] **Nel repo Grocery**: cookie di sessione da `/Grocery/` a `/`, per condividere la sessione ([05](05-sicurezza.md))

## Fase 2 · MVP ← *in corso*

Step piccoli e incrementali: ognuno si chiude con test verdi, build riuscita, **prova in locale** e un commit. Si passa al successivo solo dopo la prova.

- [x] **2.1 · Dominio puro con test**: tag, icona e suggerimenti del progetto, "solo questa / tutte", ordinamento e sezioni, filtri, paginazione, checklist Markdown (`src/dominio/`)
- [x] **2.2 · Dati**: query tipizzate su `attivita_elenco` (elenco, crea, modifica, elimina, rinomina progetto). Prova: la verifica provvisoria della Fase 1 elenca i titoli veri
- [x] **2.3 · Guscio**: intestazione salvia con ☰ e +, menu laterale (Dashboard, Attività), routing con hash, pagine vuote. Prova: navigazione su mobile e desktop
- [x] **2.4 · Dashboard in sola lettura**: tre sezioni collassabili con conteggio; riga (desktop) e card (mobile) con icona del progetto, titolo con badge dei tag, stato, stelle, barra
- [x] **2.5 · Nuova attività**: modale con titolo, progetto, stato, priorità; dal + e dal menu
- [x] **2.6 · Modifica inline**: titolo, stato (conferma per *Completo*), priorità, avanzamento
- [ ] **2.7 · Cambio del progetto**: campo con suggerimenti e dialogo "solo questa / tutte"
- [ ] **2.8 · Pagina Attività**: elenco completo, elimina con conferma
- [ ] **2.9 · Filtri**: testo, stato, priorità, progetto, "Mostra completate", *Azzera*, paginazione 25/50/100 (e 50 per sezione in dashboard)
- [ ] **2.10 · Descrizione**: modale Markdown con checklist, modifica; descrizione e aiuto sintassi nel modale "Nuova attività"
- [ ] **2.11 · Diario, lettura e aggiunta**: modale con le voci in ordine, la più recente evidenziata, Cmd/Ctrl+Invio
- [ ] **2.12 · Diario, modifica ed eliminazione** delle voci ("modificata")
- [ ] **2.13 · Sfondo doodle** a tema casa (`npm run sfondo`)
- [ ] **2.14 · "Installa l'app"** nel menu, come Grocery
- [ ] **2.15 · Rifinitura**: colori di stati e tag, animazioni brevi, controllo responsive

## Fase 3 · Pubblicazione
- [x] Workflow `pubblica.yml`
- [ ] PWA: `public/icona.svg` e icone generate con `@vite-pwa/assets-generator`, come Grocery
- [ ] Checklist di sicurezza ([05](05-sicurezza.md))
- [ ] README con screenshot

## Fase 4 · Assistente IA
- [ ] Scelta del provider con tier gratuito
- [ ] Edge Function con i tool: crea, modifica, elimina attività; aggiungi voce di diario
- [ ] Voce nel menu, pagina chat, tag `<ia>` sulle attività create dall'assistente

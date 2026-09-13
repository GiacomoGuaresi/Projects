# 07 · Roadmap

## Fase 0 · Progettazione ✅
- [x] Vecchio progetto spostato in `OLD/`
- [x] Bozza della documentazione
- [x] Quattro giri di Q&A
- [x] Scelta dei tag
- [x] Documentazione senza punti aperti

## Fase 1 · Fondamenta ← *prossima*
- [x] `git init`, LICENSE MIT
- [ ] Repository pubblico `Projects` su GitHub
- [x] Scaffold Vite + React + TS + Tailwind, Vitest
- [x] `.env.local` con le variabili di produzione di Grocery
- [x] `supabase/sql/001_schema.sql`: schema `projects`, tabelle, viste, trigger, funzione di rinomina, RLS, grant
- [x] Script applicato al progetto di produzione e verificato (RLS, policy, permessi di `anon`)
- [x] Schema `projects` esposto nella Data API
- [x] Accesso con passphrase verificato in locale
- [ ] Sessione condivisa con Grocery verificata online
- [ ] **Nel repo Grocery**: cookie di sessione da `/Grocery/` a `/`, per condividere la sessione ([05](05-sicurezza.md))

## Fase 2 · MVP
- [ ] Dominio puro con test: tag, icona progetto, ordinamento, filtri, suggerimenti, rinomina
- [ ] Layout come Grocery: intestazione salvia con + a destra, menu laterale a scomparsa, "Installa l'app"
- [ ] Sfondo doodle a tema casa (`npm run sfondo`)
- [ ] Dashboard (In corso / Da fare / Bloccate)
- [ ] Pagina Attività con filtri, "Mostra completate", paginazione
- [ ] Modifica inline con dialogo "solo questa / tutte" sul progetto
- [ ] Modale descrizione, modale diario con modifica delle voci
- [ ] Palette salvia, responsive mobile/desktop, animazioni brevi

## Fase 3 · Pubblicazione
- [x] Workflow `pubblica.yml`
- [ ] PWA: `public/icona.svg` e icone generate con `@vite-pwa/assets-generator`, come Grocery
- [ ] Checklist di sicurezza ([05](05-sicurezza.md))
- [ ] README con screenshot

## Fase 4 · Assistente IA
- [ ] Scelta del provider con tier gratuito
- [ ] Edge Function con i tool: crea, modifica, elimina attività; aggiungi voce di diario
- [ ] Voce nel menu, pagina chat, tag `<ia>` sulle attività create dall'assistente

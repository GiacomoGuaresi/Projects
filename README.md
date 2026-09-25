# Projects

Lista delle attività di casa, raggruppate per progetto, con un diario per ogni attività. Si usa da smartphone e da PC.

> **Stato: MVP completo, online su [giacomoguaresi.github.io/Projects](https://giacomoguaresi.github.io/Projects/)** (vedi [roadmap](doc/07-roadmap.md)).

## Cosa fa

- **Dashboard** con una card per progetto e i dettagli in un modale, pagina **Per stato** con le attività divise in sezioni collassabili, **pagina Attività** con l'elenco completo
- Titolo con **tag** (`<urgente>`, `<fai da te>`, `<guasto>`, `<idea>`, `<progetto>`, `<inverno>`, `<estate>`, `<cucito>`, `<natalizio>`, `<cucina>`), progetto, stato, priorità a stelle, avanzamento: tutto modificabile al volo
- **Diario** con le voci datate per ogni attività
- Filtri per testo, stato, priorità e progetto; rinomina di un progetto su tutte le sue attività
- Accesso con la sola **passphrase**, sessione condivisa con Grocery; installabile sulla schermata Home

## Per iniziare

```sh
cp .env.example .env.local   # e riempi le tre variabili (doc/06)
npm install
npm run dev                  # http://localhost:5173/Projects/
npm test
npm run build
```

Script di supporto: `npm run icone` rigenera le icone della PWA da `public/icona.svg`, `npm run sfondo` rigenera lo sfondo doodle. Il risultato di entrambi è versionato.

A ogni push su `main` il workflow [`pubblica.yml`](.github/workflows/pubblica.yml) esegue i test e pubblica su GitHub Pages.

## In breve

- **Frontend**: Vite + React + TypeScript, sito statico installabile come PWA
- **Dati e accesso**: [Supabase](https://supabase.com) (Postgres + Auth), sullo stesso progetto e con lo stesso account di Grocery
- **Stile**: Tailwind CSS, palette verde salvia
- **Hosting**: GitHub Pages → `giacomoguaresi.github.io/Projects/`
- **Lingua**: italiano · **Costo**: 0 € · **Licenza**: MIT

## Documentazione

| Documento | Contenuto |
|---|---|
| [doc/01-visione.md](doc/01-visione.md) | Scopo, utenti, cosa è e cosa non è |
| [doc/02-funzionalita.md](doc/02-funzionalita.md) | Funzionalità previste |
| [doc/03-architettura.md](doc/03-architettura.md) | Stack, flusso dati, struttura cartelle |
| [doc/04-modello-dati.md](doc/04-modello-dati.md) | Tabelle, regole nel database |
| [doc/05-sicurezza.md](doc/05-sicurezza.md) | Passphrase, sessione condivisa con Grocery, permessi, chiavi |
| [doc/06-deploy.md](doc/06-deploy.md) | Pubblicazione e manutenzione |
| [doc/07-roadmap.md](doc/07-roadmap.md) | Fasi di sviluppo |
| [doc/08-interfaccia.md](doc/08-interfaccia.md) | Schermate, interazioni, palette |
| [doc/09-decisioni.md](doc/09-decisioni.md) | Registro delle decisioni |
| [Q&A.md](Q&A.md) | Domande ancora aperte |

## Origine

Riscrittura da zero di un project manager usato in precedenza al lavoro, ripreso con permesso. Del vecchio progetto si riprendono solo le idee di interfaccia.

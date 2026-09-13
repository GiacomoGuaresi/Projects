# 06 · Deploy e manutenzione

## Repository

- Pubblico, `github.com/GiacomoGuaresi/Projects`, licenza **MIT**
- Branch principale `main`

## Frontend → GitHub Pages

Workflow `.github/workflows/pubblica.yml`, sul modello di Grocery. A ogni push su `main`:
1. `npm ci`
2. controllo che le variabili Supabase siano presenti (senza, la build riesce ma l'app si rompe all'apertura)
3. `npm test`
4. `npm run build`
5. pubblicazione di `dist/` con `actions/upload-pages-artifact` + `actions/deploy-pages`

Variabili del repository (Settings → Secrets and variables → Actions → **Variables**, perché finiscono nel bundle pubblico), con gli stessi valori di Grocery:
- `VITE_SUPABASE_URL`
- `VITE_SUPABASE_PUBLISHABLE_KEY`
- `VITE_SUPABASE_EMAIL`

URL: `https://giacomoguaresi.github.io/Projects/`. Vite ha `base: '/Projects/'`; il routing usa l'hash, quindi non serve `404.html`.

## Sviluppo locale

`.env.local` con le stesse tre variabili, prese dalla configurazione di **produzione** di Grocery (non dal suo `.env.local`, che punta al progetto DEV). `npm run dev` lavora sui dati veri.

## Database → Supabase

| Aspetto | Decisione |
|---|---|
| Progetto | **produzione di Grocery** |
| Schema | `projects`, esposto nell'API |
| Script SQL | `supabase/sql/NNN_*.sql`, applicati a mano (SQL Editor o `psql`), vedi [03](03-architettura.md) |
| Keep-alive | non serve: il progetto resta attivo grazie a Grocery |
| Backup | nessuno (dati non critici) |
| Tipi TypeScript | `supabase gen types typescript --schema projects` |

## Configurazioni sulla dashboard Supabase (una tantum)

1. Settings → Data API → aggiungere `projects` agli *Exposed schemas*
2. Authentication → URL Configuration → aggiungere `https://giacomoguaresi.github.io/Projects/` e `http://localhost:5173`
3. Eseguire gli script di `supabase/sql/` in ordine

⚠️ Il progetto è quello di produzione di Grocery: ogni modifica alla configurazione va fatta senza toccare le impostazioni che usa Grocery.

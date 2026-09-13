# 05 · Sicurezza

## Contesto

Il repository e il sito sono **pubblici**. I dati devono essere visibili solo a chi ha fatto accesso. Il progetto Supabase è quello **di produzione di Grocery**, e l'account e il modo di accesso sono **gli stessi di Grocery**.

## Chiavi e variabili

| Variabile | Dove sta | Pubblica? |
|---|---|---|
| `VITE_SUPABASE_URL` | `.env.local` in locale, *Variables* del repo GitHub in CI | sì, finisce nel bundle |
| `VITE_SUPABASE_PUBLISHABLE_KEY` | stessa gestione | sì, per design: da sola non concede nulla con RLS attiva |
| `VITE_SUPABASE_EMAIL` | stessa gestione | sì: è l'email dell'account condiviso, come in Grocery; senza passphrase non basta |
| Secret / service role key | **mai nel repo, né nel frontend, né nelle variabili di Actions** | no |
| Password del database | solo in locale, per applicare gli script SQL | no |

## Autenticazione

### Account e passphrase
- Un solo utente Supabase Auth, **condiviso con Grocery** e usato da entrambi.
- L'email è fissata nella build; chi entra scrive solo la **passphrase**, cioè la password dell'account.
- La schermata e la logica sono le stesse di Grocery (`signInWithPassword`). Una passphrase sbagliata e un errore di rete mostrano messaggi distinti.
- Niente passkey e niente pulsante "Esci", come Grocery.

### Sessione condivisa con Grocery
Grocery e Projects hanno la stessa origine (`giacomoguaresi.github.io`), lo stesso progetto Supabase e quindi lo stesso nome del cookie di sessione. Condividono la sessione se il cookie ha lo stesso **percorso**:

| App | Oggi | Obiettivo |
|---|---|---|
| Grocery | `cookieOptions: { path: import.meta.env.BASE_URL }` → `/Grocery/` | `path: '/'` |
| Projects | — | `path: '/'` |

- La modifica in Grocery è di una riga, nel suo repo (vedi [07](07-roadmap.md)).
- Effetto collaterale: al primo avvio dopo il cambio, Grocery non trova il vecchio cookie e **chiede la passphrase una volta** su ogni dispositivo.
- Da quel momento chi entra in una app è dentro anche nell'altra.
- Durata: 400 giorni, rinnovati a ogni uso, come in Grocery.
- Se la sessione finisce (revocata o scaduta), l'app torna alla schermata di accesso.

## Autorizzazione (RLS)

- RLS attiva su `projects.attivita` e `projects.voci_diario`.
- Policy: `for all to authenticated using (true) with check (true)`.
- `revoke all … from anon`; `grant usage on schema projects to authenticated` e grant su tabelle, viste, sequenze e funzioni.
- Viste con `security_invoker = true`; funzioni `security invoker` con `search_path = ''`, come in Grocery.

⚠️ Con un progetto condiviso, **qualunque utente autenticato vede sia Grocery sia Projects**. Oggi l'utente è uno solo, quindi va bene. Se un giorno se ne aggiungessero altri, le policy andrebbero ristrette.

## Checklist prima di pubblicare

- [ ] Registrazioni pubbliche **spente** sul progetto (già così per Grocery: da verificare)
- [ ] RLS attiva su ogni tabella dello schema `projects`
- [ ] Una query con la sola publishable key e senza sessione restituisce zero righe e non esegue funzioni
- [ ] Nessun file `.env*` committato; `OLD/` escluso da git
- [ ] Secret key e password del DB assenti dal repo
- [ ] URL di redirect di Auth: aggiunti `https://giacomoguaresi.github.io/Projects/` e `http://localhost:5173`
- [ ] Sessione condivisa verificata: accesso a Grocery → Projects aperto senza passphrase

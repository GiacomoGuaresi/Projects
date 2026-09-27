# 02 · Funzionalità

Legenda: ✅ confermata · 🔜 fase successiva · ❌ esclusa

## Accesso

| Funzione | Stato |
|---|---|
| **Stesso account e stesso modo di accesso di Grocery**: solo la **passphrase** | ✅ |
| Sessione persistente (cookie, 400 giorni rinnovati a ogni uso) | ✅ |
| **Sessione condivisa con Grocery**: entri in una app, sei dentro anche nell'altra | ✅ (richiede una piccola modifica a Grocery, vedi [05](05-sicurezza.md)) |
| Pulsante "Esci" | ❌ (come Grocery; uscirebbe anche da Grocery) |
| Passkey | ❌ |
| Registrazione pubblica | ❌ |

## Attività

| Funzione | Stato |
|---|---|
| Crea, modifica, elimina (con conferma) | ✅ |
| Titolo, con tag `<tag>` da una lista fissa | ✅ urgente, fai da te, guasto, idea, progetto, inverno, estate, cucito, natalizio, cucina (+ `ia` riservato), vedi [08](08-interfaccia.md) |
| **Progetto**: campo di testo libero, facoltativo, con suggerimenti dai progetti già usati | ✅ |
| Stato: **da fare · in corso · bloccato · completo** | ✅ |
| Priorità da 1 a 5 stelle | ✅ |
| Avanzamento % manuale; va a 100% da solo quando l'attività è completa | ✅ |
| Annullare un'attività = eliminarla | ✅ |
| Scadenze, ricorrenze, assegnatario | ❌ |

## Faccende

| Funzione | Stato |
|---|---|
| Attività veloci con **solo titolo** e **da fare / fatta** | ✅ |
| Modifica del titolo ed eliminazione (senza conferma) | ✅ |
| Card in cima alla Dashboard e pagina **Faccende** nel menu | ✅ |
| Le fatte restano barrate **fino a mezzanotte**, poi si eliminano da sole | ✅ |
| **Ricorrenti**: ogni N giorni, settimane (con i giorni scelti), mesi o anni; si aggiungono da sole, senza accumularsi; pausa | ✅ |
| Notifiche o promemoria a un orario | ❌ |
| Progetto, priorità, diario, tag | ❌ |

## Diario

| Funzione | Stato |
|---|---|
| Voci in Markdown con data e ora | ✅ |
| Aggiungi, **modifica**, elimina (con conferma) | ✅ |
| Autore della voce | ❌ (account condiviso) |

## Progetti (etichette)

| Funzione | Stato |
|---|---|
| Icona con iniziali e colore ricavato dal nome | ✅ |
| Filtro e ricerca per progetto | ✅ |
| **Cambio del progetto con scelta "solo questa / tutte"**: vale da rinomina quando si sceglie "tutte" | ✅ (vedi [08](08-interfaccia.md)) |
| Pagina di dettaglio o elenco progetti | ❌ |
| Stato, date, avanzamento calcolato | ❌ |

## Valigia

| Funzione | Stato |
|---|---|
| Lista per fare la valigia, nata dalla lista di controllo di Action e ritagliata su di noi, divisa in categorie | ✅ |
| Voci che raggruppano più cose, elencate sotto l'etichetta (portafogli, farmaci, trucchi…) | ✅ |
| Giorni del viaggio (quantità dei vestiti) e tipi combinabili: mare, montagna, rifugio, città, campeggio | ✅ |
| Caselle per **Jack** e **Ale**: voci di tutti e due, di uno solo o **comuni** (una casella sola) | ✅ |
| **Wizard**: prima giorni e tipi, poi la lista; in fondo **Nuova valigia** toglie le spunte e torna all'inizio | ✅ |
| Viaggio, passo e spunte **nel database**, sincronizzati **in tempo reale** tra i telefoni; "Nascondi prese" nel cookie di ciascuno | ✅ |
| Voci personalizzate o liste salvate nel database | ❌ |

## Viste

| Funzione | Stato |
|---|---|
| **Dashboard**: una card per progetto, dettagli in un modale | ✅ |
| Pagine **Per stato** e **Attività** (elenco con filtri e paginazione) | ❌ (tolte il 2026-09-27, non si usavano) |
| Selettore delle colonne visibili | ❌ (eventualmente in futuro) |
| Kanban, calendario | ❌ |

## Altro

| Funzione | Stato |
|---|---|
| PWA installabile, responsive (mobile e desktop), voce "Installa l'app" nel menu come Grocery | ✅ |
| Interfaccia solo in italiano, solo tema chiaro; le voci si chiamano **"Attività"** | ✅ |
| Offline, notifiche, allegati, spese, esportazione, backup | ❌ |
| Assistente IA (provider con tier gratuito, da scegliere) | 🔜 |

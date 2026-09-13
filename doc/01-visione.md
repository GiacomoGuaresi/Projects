# 01 · Visione

## Scopo

**Projects** è la lista delle cose da fare in casa: lavori, manutenzioni, acquisti, pratiche. Ogni attività ha:
- uno stato;
- una priorità;
- una percentuale di avanzamento;
- una descrizione con checklist;
- un diario che ricorda cosa è stato fatto e quando.

Le attività si raggruppano per **progetto**: un'etichetta libera (es. "Casa", "Bagno", "Auto"), non un'entità da creare e gestire a parte.

## Principi

1. **Semplice**: si apre e si aggiunge un'attività in pochi secondi, da telefono o da PC.
2. **Gratuito**: nessun costo di hosting o database.
3. **Privato**: il codice è pubblico, i dati li vede solo chi accede.
4. **Zero manutenzione**: nessun server, stesso progetto Supabase di Grocery.
5. **Essenziale**: solo ciò che serve davvero. Niente scadenze, notifiche, spese o allegati.

## Utenti

Il proprietario e la partner, **allo stesso livello**: vedono e modificano tutto, senza filtri per utente e senza assegnatari.

## Volumi attesi

- Attività in corso: **decine**
- Archivio (attività completate): **centinaia**, nel tempo

Serve quindi una ricerca e un filtro efficaci nella pagina delle attività. La pagina Per stato mostra solo quelle attive.

## Cosa NON è

- Un gestionale con progetti strutturati (niente stati, date o budget sui progetti)
- Un calendario o un sistema di promemoria
- Uno strumento offline: serve la rete
- Un'app multi-utente con permessi differenziati

## Cosa si riprende dal vecchio progetto (solo come idea)

Il vecchio codice è in `OLD/`, solo come riferimento locale.
- Dashboard con una card per progetto, pagina Per stato a sezioni collassabili
- Tabella su desktop e card su mobile, con modifica inline dei campi
- Stelle di priorità e barra di avanzamento
- Modali per descrizione (Markdown) e diario
- Tag nel titolo (`<urgente>`) mostrati come badge
- Icona del progetto con iniziali e colore ricavato dal nome

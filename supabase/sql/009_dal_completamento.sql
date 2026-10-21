-- Projects · 009 · Ricorrenze che contano da quando le fai (doc/04-modello-dati.md).
--
-- Con `dal_completamento` la ricorrenza non segue il calendario: quando si
-- spunta la sua faccenda, l'app sposta `inizio` al giorno in cui è fatta e
-- ricalcola `prossima` da lì (src/dominio/ricorrenze.ts, `dopoCompletamento`).
-- Innaffiare le piante ogni 2 settimane, fatto con una settimana di ritardo:
-- la volta dopo arriva 2 settimane dopo, non 1.
--
-- Si applica a mano dal SQL Editor, come le altre. Rilanciabile.

alter table projects.ricorrenze
  add column if not exists dal_completamento boolean not null default false;

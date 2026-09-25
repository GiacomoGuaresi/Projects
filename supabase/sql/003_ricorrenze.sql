-- Projects · 003 · Faccende ricorrenti (doc/04-modello-dati.md, doc/08-interfaccia.md).
--
-- Una ricorrenza è una regola ("ogni 2 settimane, lunedì e giovedì") che crea
-- da sola una faccenda quando arriva il suo giorno. Il calcolo delle date sta
-- nell'app (src/dominio/ricorrenze.ts): all'apertura crea le faccende delle
-- ricorrenze con `prossima` arrivata e sposta `prossima` avanti. Nessun job
-- nel database, come per la pulizia delle faccende.
--
-- Si applica a mano dal SQL Editor, come 001 e 002. Rilanciabile.

create table if not exists projects.ricorrenze (
  id             bigint generated always as identity primary key,
  titolo         text not null check (btrim(titolo) <> ''),
  unita          text not null check (unita in ('giorno', 'settimana', 'mese', 'anno')),
  ogni           smallint not null default 1 check (ogni between 1 and 365),
  -- 1 = lunedì … 7 = domenica. Solo per le settimanali, e lì mai vuoto.
  giorni         smallint[],
  inizio         date not null,
  prossima       date not null,
  ultima         date,
  attiva         boolean not null default true,
  creata_il      timestamptz not null default now(),
  constraint giorni_solo_settimanali check (
    case when unita = 'settimana'
      then giorni is not null and cardinality(giorni) > 0 and giorni <@ array[1, 2, 3, 4, 5, 6, 7]::smallint[]
      else giorni is null
    end
  )
);

-- La faccenda ricorda da quale ricorrenza viene. Eliminata la ricorrenza, le
-- sue faccende restano come faccende normali.
alter table projects.faccende
  add column if not exists ricorrenza_id bigint references projects.ricorrenze (id) on delete set null;

-- Una sola faccenda aperta per ricorrenza: se quella di ieri non è fatta, oggi
-- non se ne aggiunge un'altra. Protegge anche da due dispositivi aperti insieme.
create unique index if not exists faccende_una_aperta_per_ricorrenza
  on projects.faccende (ricorrenza_id) where not completa;

-- Accesso: come le altre tabelle, solo la sessione autenticata.

alter table projects.ricorrenze enable row level security;

drop policy if exists "solo la sessione autenticata" on projects.ricorrenze;
create policy "solo la sessione autenticata" on projects.ricorrenze
  for all to authenticated using (true) with check (true);

revoke all on projects.ricorrenze from public, anon;
grant select, insert, update, delete on projects.ricorrenze to authenticated;

revoke all on all sequences in schema projects from public, anon;
grant usage, select on all sequences in schema projects to authenticated;

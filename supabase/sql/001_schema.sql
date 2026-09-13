-- Projects · 001 · Schema iniziale (doc/04-modello-dati.md, doc/05-sicurezza.md).
--
-- Gira sul progetto Supabase di produzione di Grocery, in uno schema dedicato:
-- nessuna tabella di Grocery (schema public) viene toccata. Si applica a mano
-- dal SQL Editor della dashboard, non con `supabase db push`, che andrebbe in
-- conflitto con lo storico migrazioni di Grocery (doc/03).
--
-- Rilanciabile: ogni oggetto è creato "se non esiste" o sostituito.

create schema if not exists projects;

-- Attività --------------------------------------------------------------------

create table if not exists projects.attivita (
  id             bigint generated always as identity primary key,
  titolo         text not null check (btrim(titolo) <> ''),
  descrizione    text,
  progetto       text,
  stato          text not null default 'da_fare'
                 check (stato in ('da_fare', 'in_corso', 'bloccato', 'completo')),
  priorita       smallint not null default 3 check (priorita between 1 and 5),
  avanzamento    smallint not null default 0 check (avanzamento between 0 and 100),
  creata_il      timestamptz not null default now(),
  modificata_il  timestamptz not null default now(),
  completata_il  timestamptz
);

create index if not exists attivita_stato on projects.attivita (stato);
create index if not exists attivita_progetto on projects.attivita (lower(progetto));

-- Diario ----------------------------------------------------------------------

create table if not exists projects.voci_diario (
  id             bigint generated always as identity primary key,
  attivita_id    bigint not null references projects.attivita (id) on delete cascade,
  testo          text not null check (btrim(testo) <> ''),
  creata_il      timestamptz not null default now(),
  modificata_il  timestamptz not null default now()
);

create index if not exists voci_diario_attivita on projects.voci_diario (attivita_id);

-- Regole (trigger) --------------------------------------------------------------

/**
 * Prima di salvare un'attività:
 * - il progetto perde gli spazi ai bordi, e vuoto diventa NULL;
 * - completa ⇒ avanzamento 100, e completata_il segna quando lo è diventata;
 * - non completa ⇒ completata_il torna NULL (l'avanzamento resta com'è);
 * - a ogni modifica si aggiorna modificata_il.
 */
create or replace function projects.prima_di_salvare_attivita() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.progetto := nullif(btrim(new.progetto), '');

  if new.stato = 'completo' then
    new.avanzamento := 100;
    if tg_op = 'INSERT' or old.stato <> 'completo' then
      new.completata_il := now();
    end if;
  else
    new.completata_il := null;
  end if;

  if tg_op = 'UPDATE' then
    new.modificata_il := now();
  end if;

  return new;
end;
$$;

drop trigger if exists prima_di_salvare on projects.attivita;
create trigger prima_di_salvare
  before insert or update on projects.attivita
  for each row execute function projects.prima_di_salvare_attivita();

/** Una voce di diario modificata lo ricorda (l'interfaccia mostra "modificata"). */
create or replace function projects.prima_di_modificare_voce() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.testo is distinct from old.testo then
    new.modificata_il := now();
  end if;
  return new;
end;
$$;

drop trigger if exists prima_di_modificare on projects.voci_diario;
create trigger prima_di_modificare
  before update on projects.voci_diario
  for each row execute function projects.prima_di_modificare_voce();

-- Viste -----------------------------------------------------------------------
-- security_invoker: la vista legge con i permessi di chi chiede, quindi valgono
-- le policy delle tabelle sotto (come in Grocery).

/** Le attività con l'indicazione "ha voci di diario", per dashboard ed elenco. */
create or replace view projects.attivita_elenco with (security_invoker = true) as
select a.*,
       exists (select 1 from projects.voci_diario v where v.attivita_id = a.id) as ha_diario
from projects.attivita a;

/**
 * I progetti in uso, senza distinguere maiuscole e minuscole: "casa" e "Casa"
 * sono lo stesso progetto, mostrato con la grafia più usata.
 */
create or replace view projects.progetti with (security_invoker = true) as
select mode() within group (order by progetto)      as progetto,
       count(*)::integer                            as quante,
       count(*) filter (where stato <> 'completo')::integer as quante_aperte
from projects.attivita
where progetto is not null
group by lower(progetto);

-- Funzioni --------------------------------------------------------------------

/**
 * Rinomina un progetto su tutte le sue attività, completate comprese (doc/08,
 * "Cambio del progetto"). Se il nuovo nome esiste già i due progetti si
 * uniscono; un nome vuoto toglie il progetto. Restituisce quante attività ha
 * cambiato. Una sola istruzione: tutto o niente.
 */
create or replace function projects.rinomina_progetto(vecchio text, nuovo text) returns integer
language plpgsql
security invoker
set search_path = ''
as $$
declare
  cambiate integer;
begin
  update projects.attivita
  set progetto = nuovo
  where lower(progetto) = lower(btrim(vecchio));
  get diagnostics cambiate = row_count;
  return cambiate;
end;
$$;

-- Accesso ---------------------------------------------------------------------
-- Un solo account condiviso con Grocery: basta essere la sessione autenticata.
-- Chi non lo è non vede, non scrive e non esegue niente.

alter table projects.attivita enable row level security;
alter table projects.voci_diario enable row level security;

drop policy if exists "solo la sessione autenticata" on projects.attivita;
create policy "solo la sessione autenticata" on projects.attivita
  for all to authenticated using (true) with check (true);

drop policy if exists "solo la sessione autenticata" on projects.voci_diario;
create policy "solo la sessione autenticata" on projects.voci_diario
  for all to authenticated using (true) with check (true);

revoke all on schema projects from public, anon;
grant usage on schema projects to authenticated;

revoke all on all tables in schema projects from public, anon;
grant select, insert, update, delete on projects.attivita, projects.voci_diario to authenticated;
grant select on projects.attivita_elenco, projects.progetti to authenticated;

revoke all on all sequences in schema projects from public, anon;
grant usage, select on all sequences in schema projects to authenticated;

revoke execute on all functions in schema projects from public, anon;
grant execute on function projects.rinomina_progetto(text, text) to authenticated;

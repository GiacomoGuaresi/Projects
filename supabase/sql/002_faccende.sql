-- Projects · 002 · Faccende (doc/04-modello-dati.md, doc/08-interfaccia.md).
--
-- Attività veloci e ripetitive ("passare l'aspirapolvere"): solo un titolo e
-- "fatta / non fatta". Nessun progetto, priorità, descrizione o diario.
-- Le completate restano fino a fine giornata; poi l'app le elimina all'apertura.
--
-- Si applica a mano dal SQL Editor, come 001. Rilanciabile.

create table if not exists projects.faccende (
  id             bigint generated always as identity primary key,
  titolo         text not null check (btrim(titolo) <> ''),
  completa       boolean not null default false,
  creata_il      timestamptz not null default now(),
  completata_il  timestamptz
);

/** Completa ⇒ completata_il segna quando lo è diventata; riaperta ⇒ NULL. */
create or replace function projects.prima_di_salvare_faccenda() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  if new.completa then
    if tg_op = 'INSERT' or not old.completa then
      new.completata_il := now();
    end if;
  else
    new.completata_il := null;
  end if;
  return new;
end;
$$;

drop trigger if exists prima_di_salvare on projects.faccende;
create trigger prima_di_salvare
  before insert or update on projects.faccende
  for each row execute function projects.prima_di_salvare_faccenda();

-- Accesso: come le altre tabelle, solo la sessione autenticata.

alter table projects.faccende enable row level security;

drop policy if exists "solo la sessione autenticata" on projects.faccende;
create policy "solo la sessione autenticata" on projects.faccende
  for all to authenticated using (true) with check (true);

revoke all on projects.faccende from public, anon;
grant select, insert, update, delete on projects.faccende to authenticated;

revoke all on all sequences in schema projects from public, anon;
grant usage, select on all sequences in schema projects to authenticated;

revoke execute on all functions in schema projects from public, anon;

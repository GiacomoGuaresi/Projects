-- Projects · 006 · Foresta (doc/04-modello-dati.md, doc/08-interfaccia.md).
--
-- Gli alberi della foresta sono le attività completate e si leggono da
-- `attivita`. Gli arbusti sono le faccende fatte, che però spariscono a fine
-- giornata: qui basta contarle. Il conto è approssimato per scelta (doc/09):
-- togliere la spunta lo abbassa, eliminare una faccenda fatta no.
--
-- Si applica a mano dal SQL Editor, come gli altri. Rilanciabile.

create table if not exists projects.contatori (
  nome    text primary key,
  valore  integer not null default 0 check (valore >= 0)
);

-- Si parte dalle faccende già spuntate oggi; rilanciando non si azzera.
insert into projects.contatori (nome, valore)
select 'faccende_fatte', count(*) from projects.faccende where completa
on conflict (nome) do nothing;

/** Spuntata ⇒ +1; spunta tolta ⇒ −1, senza scendere sotto zero. */
create or replace function projects.dopo_aver_segnato_faccenda() returns trigger
language plpgsql
security definer
set search_path = ''
as $$
begin
  if new.completa and not old.completa then
    update projects.contatori set valore = valore + 1 where nome = 'faccende_fatte';
  elsif old.completa and not new.completa then
    update projects.contatori set valore = greatest(valore - 1, 0) where nome = 'faccende_fatte';
  end if;
  return null;
end;
$$;

drop trigger if exists dopo_aver_segnato on projects.faccende;
create trigger dopo_aver_segnato
  after update of completa on projects.faccende
  for each row execute function projects.dopo_aver_segnato_faccenda();

-- Accesso: la sessione autenticata legge e basta, scrive solo il trigger.

alter table projects.contatori enable row level security;

drop policy if exists "solo la sessione autenticata" on projects.contatori;
create policy "solo la sessione autenticata" on projects.contatori
  for select to authenticated using (true);

revoke all on projects.contatori from public, anon, authenticated;
grant select on projects.contatori to authenticated;

revoke execute on all functions in schema projects from public, anon;

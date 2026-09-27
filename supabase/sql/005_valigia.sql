-- Projects · 005 · Valigia (doc/04-modello-dati.md, doc/08-interfaccia.md).
--
-- La lista per fare la valigia, condivisa tra i telefoni: le voci stanno nel
-- codice (src/dominio/valigia.ts), qui solo il viaggio scelto e le caselle
-- spuntate. C'è una valigia sola alla volta.
--
-- Si applica a mano dal SQL Editor, come 001. Rilanciabile.

-- Il viaggio: una riga sola (id sempre true), creata qui.
create table if not exists projects.valigia (
  id             boolean primary key default true check (id),
  giorni         smallint not null default 7 check (giorni between 1 and 30),
  -- I tipi scelti (mare, montagna, …); quelli che l'app non conosce li ignora.
  tipi           text[] not null default '{}',
  -- Il passo del wizard: false = scelta del viaggio, true = lista da spuntare.
  in_lista       boolean not null default false,
  modificata_il  timestamptz not null default now()
);

insert into projects.valigia default values on conflict do nothing;

-- Una riga per casella spuntata: la chiave è l'id della voce per le comuni,
-- `id_j` / `id_a` per quelle di Jack e Ale. Spuntare inserisce, togliere elimina:
-- due telefoni che spuntano insieme non si sovrascrivono.
create table if not exists projects.valigia_spunte (
  chiave    text primary key check (chiave ~ '^[a-z0-9-]+(_[ja])?$'),
  presa_il  timestamptz not null default now()
);

/** Ogni modifica del viaggio aggiorna modificata_il. */
create or replace function projects.prima_di_salvare_valigia() returns trigger
language plpgsql
set search_path = ''
as $$
begin
  new.modificata_il := now();
  return new;
end;
$$;

drop trigger if exists prima_di_salvare on projects.valigia;
create trigger prima_di_salvare
  before update on projects.valigia
  for each row execute function projects.prima_di_salvare_valigia();

/** "Nuova valigia": toglie tutte le spunte e torna alla scelta del viaggio, insieme. */
create or replace function projects.nuova_valigia() returns void
language sql
security invoker
set search_path = ''
as $$
  delete from projects.valigia_spunte where true;
  update projects.valigia set in_lista = false where id;
$$;

-- Accesso: come le altre tabelle, solo la sessione autenticata. Il viaggio si
-- legge e si modifica soltanto, non si crea né si elimina.

alter table projects.valigia enable row level security;
alter table projects.valigia_spunte enable row level security;

drop policy if exists "solo la sessione autenticata" on projects.valigia;
create policy "solo la sessione autenticata" on projects.valigia
  for all to authenticated using (true) with check (true);

drop policy if exists "solo la sessione autenticata" on projects.valigia_spunte;
create policy "solo la sessione autenticata" on projects.valigia_spunte
  for all to authenticated using (true) with check (true);

revoke all on projects.valigia, projects.valigia_spunte from public, anon;
grant select, update on projects.valigia to authenticated;
grant select, insert, delete on projects.valigia_spunte to authenticated;

revoke execute on all functions in schema projects from public, anon;
grant execute on function projects.nuova_valigia() to authenticated;

-- Tempo reale: i telefoni aperti ricevono subito spunte e cambi di viaggio.
do $$
begin
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'projects' and tablename = 'valigia'
  ) then
    alter publication supabase_realtime add table projects.valigia;
  end if;
  if not exists (
    select 1 from pg_publication_tables
    where pubname = 'supabase_realtime' and schemaname = 'projects' and tablename = 'valigia_spunte'
  ) then
    alter publication supabase_realtime add table projects.valigia_spunte;
  end if;
end;
$$;

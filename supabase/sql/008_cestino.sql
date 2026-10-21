-- Projects · 008 · Cestino delle attività (doc/04-modello-dati.md, doc/08-interfaccia.md).
--
-- Eliminare un'attività la sposta nel cestino: `eliminata_il` segna quando.
-- Da lì si ripristina, o si elimina per sempre; dopo 30 giorni la elimina
-- l'app a ogni lettura, come le faccende fatte (nessun job nel database).
-- La vista `attivita_elenco` prende `a.*`, quindi va ricreata con la colonna.
--
-- Si applica a mano dal SQL Editor, come le precedenti. Rilanciabile.

alter table projects.attivita add column if not exists eliminata_il timestamptz;

create index if not exists attivita_eliminata on projects.attivita (eliminata_il)
  where eliminata_il is not null;

drop view if exists projects.attivita_elenco;

/** Le attività con l'indicazione "ha voci di diario", cestinate comprese: le separa l'app. */
create view projects.attivita_elenco with (security_invoker = true) as
select a.*,
       exists (select 1 from projects.voci_diario v where v.attivita_id = a.id) as ha_diario
from projects.attivita a;

grant select on projects.attivita_elenco to authenticated;

/** I progetti in uso: quelli che restano solo nel cestino non si propongono. */
create or replace view projects.progetti with (security_invoker = true) as
select mode() within group (order by progetto)      as progetto,
       count(*)::integer                            as quante,
       count(*) filter (where stato <> 'completo')::integer as quante_aperte
from projects.attivita
where progetto is not null and eliminata_il is null
group by lower(progetto);

/**
 * Come in 001, ma spostare nel cestino (o ripristinare) non è una modifica:
 * `modificata_il` resta com'era, e la Foresta non fa "ricrescere" l'albero.
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

  if tg_op = 'UPDATE' and (to_jsonb(new) - 'eliminata_il' - 'modificata_il')
                       is distinct from (to_jsonb(old) - 'eliminata_il' - 'modificata_il') then
    new.modificata_il := now();
  end if;

  return new;
end;
$$;

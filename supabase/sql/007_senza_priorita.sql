-- Projects · 007 · Via la priorità delle attività (doc/04-modello-dati.md).
--
-- Non si usava: nella card contano stato, scadenza e titolo. La vista
-- `attivita_elenco` prende `a.*`, quindi va ricreata senza la colonna.
--
-- Si applica a mano dal SQL Editor, come le precedenti. Rilanciabile.

drop view if exists projects.attivita_elenco;

alter table projects.attivita drop column if exists priorita;

/** Le attività con l'indicazione "ha voci di diario", per dashboard ed elenco. */
create view projects.attivita_elenco with (security_invoker = true) as
select a.*,
       exists (select 1 from projects.voci_diario v where v.attivita_id = a.id) as ha_diario
from projects.attivita a;

grant select on projects.attivita_elenco to authenticated;

-- pro_survey_responses : sondage de découverte pros BTP (douleurs + liste à rappeler)
-- Formulaire public /enquete-pro (insert anon) + vue admin /admin/enquete (lecture authentifiée).

create table if not exists pro_survey_responses (
  id            uuid primary key default gen_random_uuid(),
  created_at    timestamptz not null default now(),
  metier        text not null,
  taille        text,
  departement   text,
  taches_chrono text[] not null default '{}',
  heures_admin  text,
  corvee_libre  text,
  outils_actuels text,
  outils_detail text,
  outils_essayes text,
  prenom        text,
  contact       text,
  consent       boolean not null default false,
  source        text
);

-- Sécurité : INSERT public (anon, formulaire), lecture réservée aux comptes connectés (admin).
alter table pro_survey_responses enable row level security;

drop policy if exists "survey_anon_insert" on pro_survey_responses;
create policy "survey_anon_insert" on pro_survey_responses
  for insert to anon with check (true);

drop policy if exists "survey_authenticated_select" on pro_survey_responses;
create policy "survey_authenticated_select" on pro_survey_responses
  for select to authenticated using (true);

-- Grants explicites : anon écrit, authenticated lit. service_role bypasse la RLS (admin).
grant insert on pro_survey_responses to anon;
grant select on pro_survey_responses to authenticated;

create index if not exists idx_pro_survey_created_at
  on pro_survey_responses (created_at desc);

-- Recharge le cache PostgREST (sinon "column not found in schema cache").
notify pgrst, 'reload schema';

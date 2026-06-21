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

-- Sécurité : INSERT public (visiteurs anon ET utilisateurs connectés), lecture
-- réservée au service role (vue admin via getAdminServiceClient, bypass RLS).
-- NB : on N'autorise PAS le SELECT au rôle "authenticated" — ça exposerait
-- toutes les réponses (dont les contacts) à n'importe quel pro connecté.
alter table pro_survey_responses enable row level security;

drop policy if exists "survey_public_insert" on pro_survey_responses;
create policy "survey_public_insert" on pro_survey_responses
  for insert to anon, authenticated with check (true);

-- Grant d'insert pour les deux rôles publics. service_role bypasse la RLS (admin).
grant insert on pro_survey_responses to anon, authenticated;

create index if not exists idx_pro_survey_created_at
  on pro_survey_responses (created_at desc);

-- Recharge le cache PostgREST (sinon "column not found in schema cache").
notify pgrst, 'reload schema';

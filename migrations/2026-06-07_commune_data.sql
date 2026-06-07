-- Enrichissement des communes avec de la VRAIE donnée ouverte (data.gouv.fr).
-- Table dédiée keyée par insee_code. TOUTES sources Licence Ouverte, par commune.
--
-- IDEMPOTENT : `ADD COLUMN IF NOT EXISTS` → ré-appliquer cette migration ajoute
-- les colonnes manquantes même si la table existe déjà (le `CREATE TABLE IF NOT
-- EXISTS` seul n'ajoute PAS de colonnes à une table pré-existante).
--
-- À appliquer dans Supabase → SQL Editor (ré-applicable sans risque).

create table if not exists public.commune_data (
  insee_code text primary key,
  source     text default 'data.gouv.fr (Licence Ouverte)',
  updated_at timestamptz default now()
);

-- ── Source #1 : DVF prix immobilier (data.gouv 63dd1cc4…, 2024) ──
alter table public.commune_data add column if not exists prix_m2_moyen     integer;
alter table public.commune_data add column if not exists prix_moyen_bien   integer;
alter table public.commune_data add column if not exists nb_mutations      integer;
alter table public.commune_data add column if not exists surface_moy       integer;
alter table public.commune_data add column if not exists prop_maison       integer;
alter table public.commune_data add column if not exists dvf_annee         integer;

-- ── Source #2 : Revenus FiLoSoFi (data.gouv 693975a1…, 2021) ──
alter table public.commune_data add column if not exists revenu_median        integer;
alter table public.commune_data add column if not exists revenu_q1            integer;
alter table public.commune_data add column if not exists revenu_q3            integer;
alter table public.commune_data add column if not exists part_menages_imposes numeric;
alter table public.commune_data add column if not exists filosofi_annee       integer;

-- ── Source #3 : Logements vacants LOVAC (data.gouv 61816c6e…, 2024) ──
alter table public.commune_data add column if not exists logements_prive_total  integer;
alter table public.commune_data add column if not exists logements_vacants      integer;
alter table public.commune_data add column if not exists logements_vacants_2ans integer;
alter table public.commune_data add column if not exists taux_vacance           numeric;
alter table public.commune_data add column if not exists lovac_annee            integer;

-- ── Source #4 : Construction SITADEL (SDES 689c42f4…, 2024) ──
alter table public.commune_data add column if not exists logements_autorises integer;
alter table public.commune_data add column if not exists logements_commences integer;
alter table public.commune_data add column if not exists sitadel_annee       integer;

-- ── Source #5 : Équipements + densité (data.gouv 6745d9ae…, 2025) ──
alter table public.commune_data add column if not exists niveau_equipements smallint;
alter table public.commune_data add column if not exists grille_densite     smallint;
alter table public.commune_data add column if not exists densite_hab_km2    integer;

-- RLS : données ouvertes publiques → lecture pour tous ; écriture service_role.
alter table public.commune_data enable row level security;
drop policy if exists "commune_data public read" on public.commune_data;
create policy "commune_data public read"
  on public.commune_data for select using (true);

comment on table public.commune_data is
  'Enrichissement communes data.gouv.fr : DVF prix, revenus FiLoSoFi, vacance LOVAC, construction SITADEL, équipements/densité. Keyé insee_code. Licence Ouverte.';

-- Force PostgREST à recharger son cache de schéma (sinon "column not found in
-- schema cache" sur les colonnes fraîchement ajoutées).
notify pgrst, 'reload schema';

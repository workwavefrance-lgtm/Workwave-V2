-- Enrichissement des communes avec de la VRAIE donnée ouverte (data.gouv.fr).
-- Table dédiée keyée par insee_code (ne pollue pas `cities`, extensible).
-- TOUTES les sources validées par sous-agents le 07/06/2026, par commune,
-- Licence Ouverte (réutilisation commerciale OK). ZÉRO donnée inventée.
--
-- À appliquer dans Supabase → SQL Editor.

create table if not exists public.commune_data (
  insee_code        text primary key,

  -- ── Source #1 : DVF prix immobilier (data.gouv 63dd1cc4…, millésime 2024) ──
  prix_m2_moyen     integer,   -- €/m² moyen (toutes ventes)
  prix_moyen_bien   integer,   -- € prix moyen d'un bien vendu
  nb_mutations      integer,   -- nombre de transactions sur l'année
  surface_moy       integer,   -- m² surface moyenne des biens vendus
  prop_maison       integer,   -- % de maisons dans les ventes
  dvf_annee         integer,

  -- ── Source #2 : Revenus FiLoSoFi (data.gouv 693975a1…, millésime 2021) ──
  revenu_median        integer,   -- médiane du revenu disponible par UC (€/an)
  revenu_q1            integer,   -- 1er quartile (€) — nullable (secret stat petites communes)
  revenu_q3            integer,   -- 3e quartile (€) — nullable
  part_menages_imposes numeric,   -- % ménages fiscaux imposés — nullable
  filosofi_annee       integer,

  -- ── Source #3 : Logements vacants LOVAC (data.gouv 61816c6e…, millésime 2024) ──
  logements_prive_total integer,  -- nb logements parc privé
  logements_vacants     integer,  -- nb logements vacants
  logements_vacants_2ans integer, -- nb vacants > 2 ans (vacance structurelle = rénovation lourde)
  taux_vacance          numeric,  -- % calculé = 100 * vacants / total
  lovac_annee           integer,

  -- ── Source #4 : Construction SITADEL (SDES 689c42f4…, millésime 2024) ──
  logements_autorises   integer,  -- permis accordés sur l'année (dynamisme construction)
  logements_commences   integer,  -- mises en chantier sur l'année
  sitadel_annee         integer,

  -- ── Source #5 : Équipements + densité (data.gouv 6745d9ae…, millésime 2025) ──
  niveau_equipements    smallint, -- centralité d'équipements 0..3+ (dérivé BPE)
  grille_densite        smallint, -- grille densité INSEE 1 (dense) .. 7 (très peu dense)
  densite_hab_km2       integer,  -- hab/km²

  source            text default 'data.gouv.fr (Licence Ouverte)',
  updated_at        timestamptz default now()
);

-- RLS : données ouvertes publiques → lecture pour tous ; écriture service_role.
alter table public.commune_data enable row level security;
drop policy if exists "commune_data public read" on public.commune_data;
create policy "commune_data public read"
  on public.commune_data for select using (true);

comment on table public.commune_data is
  'Enrichissement communes via data.gouv.fr : DVF prix immobilier, revenus FiLoSoFi, logements vacants LOVAC, construction SITADEL, équipements/densité. Keyé insee_code. Toutes sources Licence Ouverte.';

-- Enrichissement des communes avec de la VRAIE donnée ouverte (data.gouv.fr).
-- Table dédiée keyée par insee_code (ne pollue pas `cities`, extensible pour
-- ajouter d'autres datasets : revenus, logements, etc.).
--
-- Source #1 : DVF — Indicateurs Immobiliers par commune 2024 (data.gouv.fr,
-- dataset 63dd1cc420bf925d5d1d8b1e, Licence Ouverte). Prix immobilier réels.
--
-- À appliquer dans Supabase → SQL Editor.

create table if not exists public.commune_data (
  insee_code        text primary key,

  -- DVF immobilier (dernière année dispo)
  prix_m2_moyen     integer,   -- €/m² moyen (toutes ventes)
  prix_moyen_bien   integer,   -- € prix moyen d'un bien vendu
  nb_mutations      integer,   -- nombre de transactions sur l'année
  surface_moy       integer,   -- m² surface moyenne des biens vendus
  prop_maison       integer,   -- % de maisons dans les ventes (vs appartements)
  dvf_annee         integer,   -- année de référence des données DVF

  -- (extensible : revenus médians, parc de logements, etc. — colonnes à
  --  ajouter au fil des datasets, sans recréer la table)

  source            text default 'data.gouv.fr',
  updated_at        timestamptz default now()
);

-- RLS : données ouvertes publiques → lecture pour tous ; écriture service_role
-- uniquement (les scripts d'ETL bypassent RLS via la clé service_role).
alter table public.commune_data enable row level security;

drop policy if exists "commune_data public read" on public.commune_data;
create policy "commune_data public read"
  on public.commune_data for select
  using (true);

-- Index pour les jointures depuis cities (insee_code = PK, déjà indexé).
comment on table public.commune_data is
  'Enrichissement communes via data.gouv.fr (DVF prix immobilier, etc.). Keyé insee_code.';

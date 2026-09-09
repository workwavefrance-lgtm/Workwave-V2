-- Table `stats_jour` : UNE ligne par jour, source de verite partagee des mesures
-- d'audience et de crawl de Workwave.fr. Creee le 09/09/2026.
--
-- POURQUOI : jusqu'ici chaque mesure vivait dans un outil different (Umami sur
-- le VPS, journal du proxy Traefik, Search Console sur le Mac de Willy) et
-- chaque comparaison demandait de tout recalculer a la main. Ici, trois
-- producteurs independants ecrivent chacun LEURS colonnes dans la meme ligne :
--   - ops/stats-jour.py (VPS, cron)     : colonnes Umami + robots ;
--   - script Search Console (Mac)       : colonnes *_gsc, avec 2 jours de retard ;
--   - route POST /api/cron/stats-jour   : le seul point d'ecriture, upsert partiel.
--
-- CONTRAT (a respecter a la lettre par tous les producteurs) :
--   - toutes les colonnes sauf `jour` sont NULLABLE ;
--   - NULL signifie « pas encore mesure », JAMAIS zero ;
--   - chaque producteur n'envoie QUE ses colonnes (upsert partiel sur `jour`),
--     pour ne jamais ecraser celles d'un autre producteur.
--
-- IDEMPOTENT : `ADD COLUMN IF NOT EXISTS` pour chaque colonne apres un CREATE
-- minimal, car `CREATE TABLE IF NOT EXISTS` n'ajoute AUCUNE colonne a une table
-- deja existante (lecon du 07/06/2026 sur commune_data).
--
-- A appliquer dans Supabase : SQL Editor (re-applicable sans risque).

create table if not exists public.stats_jour (
  jour   date primary key,
  maj_at timestamptz not null default now()
);

-- Visiteurs reels, JS execute (Umami, event_type = 1, site workwave.fr)
alter table public.stats_jour add column if not exists sessions         integer;
alter table public.stats_jour add column if not exists vues             integer;
alter table public.stats_jour add column if not exists sessions_depot   integer;
alter table public.stats_jour add column if not exists sessions_listing integer;
alter table public.stats_jour add column if not exists sessions_fiche   integer;
alter table public.stats_jour add column if not exists sessions_accueil integer;
alter table public.stats_jour add column if not exists src_google       integer;
alter table public.stats_jour add column if not exists src_bing         integer;
alter table public.stats_jour add column if not exists src_instagram    integer;
alter table public.stats_jour add column if not exists src_direct       integer;
alter table public.stats_jour add column if not exists src_autre        integer;

-- Robots, journal d'acces du proxy Traefik
alter table public.stats_jour add column if not exists robots_declares     integer;
alter table public.stats_jour add column if not exists google_passages     integer;
alter table public.stats_jour add column if not exists google_5xx          integer;
alter table public.stats_jour add column if not exists aspirateur_pages    integer;
alter table public.stats_jour add column if not exists aspirateur_adresses integer;
alter table public.stats_jour add column if not exists err_5xx_total       integer;

-- Search Console (script Mac, decalage de 2 jours)
alter table public.stats_jour add column if not exists clics_gsc         integer;
alter table public.stats_jour add column if not exists impressions_gsc   integer;
alter table public.stats_jour add column if not exists clics_listing_gsc integer;
alter table public.stats_jour add column if not exists clics_fiche_gsc   integer;

-- RLS : table interne, aucune page publique ne la lit. RLS active SANS AUCUNE
-- policy = refus total pour `anon` et `authenticated`. Le role `service_role`
-- ignore toujours la RLS : la route cron (getServiceClient) ecrit normalement.
alter table public.stats_jour enable row level security;

-- Ceinture et bretelles (meme pattern que admin_logs, 04/08/2026) : meme si une
-- policy trop permissive etait ajoutee un jour par erreur, la table resterait
-- injoignable depuis la cle publique.
revoke all on table public.stats_jour from anon;
revoke all on table public.stats_jour from authenticated;

comment on table public.stats_jour is
  'Une ligne par jour : audience Umami (humains, JS execute), robots du journal Traefik, Search Console (J-2). NULL = pas encore mesure, jamais zero. Upsert partiel par producteur via POST /api/cron/stats-jour.';

-- Force PostgREST a recharger son cache de schema (sinon "column not found in
-- schema cache" sur les colonnes fraichement ajoutees).
notify pgrst, 'reload schema';

-- Verification attendue apres execution :
--   select column_name, data_type, is_nullable from information_schema.columns
--   where table_schema = 'public' and table_name = 'stats_jour' order by ordinal_position;
--   -> 23 colonnes, toutes nullable sauf jour et maj_at
--   select tablename, rowsecurity from pg_tables where tablename = 'stats_jour';
--   -> rowsecurity doit valoir true

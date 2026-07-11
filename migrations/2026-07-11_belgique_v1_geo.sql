-- ============================================================================
-- BELGIQUE V1 — Phase 1 : fondations géographiques
-- ============================================================================
-- Date  : 2026-07-11
-- Auteur: Willy + Claude
-- ----------------------------------------------------------------------------
-- Contexte : extension de l'annuaire BTP à la Belgique francophone (Wallonie +
-- Bruxelles-Capitale, PAS la Flandre). Modèle identique à la France :
-- fiches issues du registre officiel (BCE open data) + SEO + pay-per-lead.
--
-- Ce que cette migration fait :
--   1. Colonne `country` (char 2, DEFAULT 'FR') sur departments + cities.
--      → Toutes les rows existantes deviennent 'FR' automatiquement, AUCUNE
--        requête existante ne change de résultat (elles ne filtrent pas par
--        country). Les futures rows belges seront insérées avec 'BE'.
--      → Désambiguïse cities.insee_code : les codes NIS belges (5 chiffres)
--        chevauchent les plages INSEE françaises (ex. 21004 = Dijon FR
--        ET Bruxelles-ville BE). La clé logique devient (country, insee_code).
--   2. Étend pros_source_check avec 'bce' (registre belge) — leçon 26/05 :
--      TOUJOURS aligner le CHECK SQL avant le type TS, sinon INSERT silencieux
--      en échec sur tous les pros belges.
--   3. Index pour les filtres par pays.
--
-- Idempotente : ADD COLUMN IF NOT EXISTS + DROP CONSTRAINT IF EXISTS.
-- À exécuter dans le SQL Editor Supabase (Dashboard → SQL Editor → Run).
-- ============================================================================

-- ─── 1. Colonne country ────────────────────────────────────────────────────
ALTER TABLE departments ADD COLUMN IF NOT EXISTS country char(2) NOT NULL DEFAULT 'FR';
ALTER TABLE cities      ADD COLUMN IF NOT EXISTS country char(2) NOT NULL DEFAULT 'FR';

COMMENT ON COLUMN departments.country IS
  'ISO 3166-1 alpha-2 : FR (défaut) ou BE. Les provinces belges sont des rows departments avec code alpha 3 lettres (wht, wlg, wna, wbr, wlx, bru).';
COMMENT ON COLUMN cities.country IS
  'ISO 3166-1 alpha-2 : FR (défaut) ou BE. Pour BE, insee_code contient le code NIS (5 chiffres) — la clé logique est (country, insee_code).';

-- ─── 2. Index ───────────────────────────────────────────────────────────────
CREATE INDEX IF NOT EXISTS idx_departments_country ON departments(country);
CREATE INDEX IF NOT EXISTS idx_cities_country ON cities(country);
-- Lookup commune belge par NIS pendant le scrape BCE :
CREATE INDEX IF NOT EXISTS idx_cities_country_insee ON cities(country, insee_code) WHERE insee_code IS NOT NULL;

-- ─── 3. Source 'bce' ────────────────────────────────────────────────────────
ALTER TABLE pros DROP CONSTRAINT IF EXISTS pros_source_check;
ALTER TABLE pros ADD CONSTRAINT pros_source_check
  CHECK (source IN ('sirene', 'pagesjaunes', 'manual', 'ai_signup', 'bce'));

-- ─── 4. PostgREST : recharger le cache du schéma (leçon 07/06) ──────────────
NOTIFY pgrst, 'reload schema';

-- ─── Vérifications post-migration ───────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'cities' AND column_name = 'country'
  ) THEN
    RAISE EXCEPTION 'Migration failed: cities.country not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'departments' AND column_name = 'country'
  ) THEN
    RAISE EXCEPTION 'Migration failed: departments.country not added';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM pg_constraint
    WHERE conname = 'pros_source_check'
      AND pg_get_constraintdef(oid) LIKE '%bce%'
  ) THEN
    RAISE EXCEPTION 'Migration failed: pros_source_check missing bce';
  END IF;
  RAISE NOTICE 'Migration 2026-07-11_belgique_v1_geo OK';
END $$;

-- Sanity : tout l'existant doit être FR
SELECT country, COUNT(*) FROM departments GROUP BY country;
SELECT country, COUNT(*) FROM cities GROUP BY country;

-- ============================================================================
-- Migration : Init Workwave AI (vertical='tech')
-- ============================================================================
-- Etend Workwave BTP pour supporter le nouveau vertical "tech" :
--   - categories.vertical accepte 'tech' (en plus de 'btp', 'domicile',
--     'personne')
--   - pros : nouvelles colonnes specifiques tech (github_username, tarifs,
--     skills, annees d'experience, dispo remote)
--   - projects : vertical pour distinguer BTP vs tech (defaut 'btp' =
--     retro-compat)
--   - Index sur (category_id, city_id) pour accelerer les listings
--
-- Idempotent : ALTER TABLE ... ADD COLUMN IF NOT EXISTS partout.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. categories.vertical : ajout de la valeur 'tech' au CHECK constraint
--    (le constraint a un nom auto-genere style "categories_vertical_check",
--    on le drop dynamiquement par introspection pour etre robuste).
-- ----------------------------------------------------------------------------

DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT con.conname INTO v_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'categories'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%vertical%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE categories DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END $$;

ALTER TABLE categories
  ADD CONSTRAINT categories_vertical_check
  CHECK (vertical IN ('btp', 'domicile', 'personne', 'tech'));

-- ----------------------------------------------------------------------------
-- 2. pros : nouvelles colonnes tech-specific (idempotent)
-- ----------------------------------------------------------------------------

ALTER TABLE pros
  ADD COLUMN IF NOT EXISTS github_username     text,
  ADD COLUMN IF NOT EXISTS hourly_rate_min     numeric(6, 2),
  ADD COLUMN IF NOT EXISTS hourly_rate_max     numeric(6, 2),
  ADD COLUMN IF NOT EXISTS years_experience    smallint,
  ADD COLUMN IF NOT EXISTS skills              jsonb NOT NULL DEFAULT '[]'::jsonb,
  ADD COLUMN IF NOT EXISTS available_for_remote boolean NOT NULL DEFAULT true;

COMMENT ON COLUMN pros.github_username IS 'Workwave AI : compte GitHub du freelance (pour skills auto-import + verification)';
COMMENT ON COLUMN pros.hourly_rate_min IS 'Workwave AI : taux horaire min en EUR HT';
COMMENT ON COLUMN pros.hourly_rate_max IS 'Workwave AI : taux horaire max en EUR HT';
COMMENT ON COLUMN pros.years_experience IS 'Workwave AI : annees experience tech';
COMMENT ON COLUMN pros.skills IS 'Workwave AI : array de skills (ex: ["React", "Node.js", "Claude API"])';
COMMENT ON COLUMN pros.available_for_remote IS 'Workwave AI : disponible pour mission remote';

-- ----------------------------------------------------------------------------
-- 3. projects : vertical pour distinguer BTP vs tech
-- ----------------------------------------------------------------------------

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS vertical text NOT NULL DEFAULT 'btp';

-- CHECK constraint pour vertical (on drop d'abord au cas ou un re-run)
DO $$
DECLARE
  v_constraint_name text;
BEGIN
  SELECT con.conname INTO v_constraint_name
  FROM pg_constraint con
  JOIN pg_class rel ON rel.oid = con.conrelid
  WHERE rel.relname = 'projects'
    AND con.contype = 'c'
    AND pg_get_constraintdef(con.oid) LIKE '%vertical%';

  IF v_constraint_name IS NOT NULL THEN
    EXECUTE format('ALTER TABLE projects DROP CONSTRAINT %I', v_constraint_name);
  END IF;
END $$;

ALTER TABLE projects
  ADD CONSTRAINT projects_vertical_check CHECK (vertical IN ('btp', 'tech'));

-- ----------------------------------------------------------------------------
-- 4. Index sur (category_id, city_id) pour acceleration listings
--    Critique sur les pages /[metier]/[ville] et futur /ai/[skill]
-- ----------------------------------------------------------------------------

CREATE INDEX IF NOT EXISTS idx_pros_category_city_active
  ON pros (category_id, city_id)
  WHERE is_active = true AND deleted_at IS NULL;

-- Index secondaire : recherche par skills (jsonb GIN pour @> queries)
CREATE INDEX IF NOT EXISTS idx_pros_skills_gin
  ON pros USING gin (skills)
  WHERE is_active = true AND deleted_at IS NULL;

-- ----------------------------------------------------------------------------
-- DONE
-- ----------------------------------------------------------------------------
-- Apres execution :
--   SELECT * FROM categories WHERE vertical = 'tech'; -- 0 rows (a creer)
--   SELECT column_name FROM information_schema.columns
--     WHERE table_name = 'pros' AND column_name LIKE 'github%';
--     -- doit lister github_username

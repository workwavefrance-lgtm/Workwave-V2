-- ============================================================================
-- Migration : Workwave AI Phase 9 bis — extension SEO programmatique skills
-- ============================================================================
-- Permet d'ajouter ~50 sous-skills tech (React, Vue, Python, Wordpress,
-- AWS, etc.) dans la table categories existante, avec parent_category_id
-- pointant vers l'une des 6 macro-categories existantes (ids 43-48).
--
-- Strategie : pas de nouvelle table. On etend categories pour supporter
-- une hierarchie macro → skill. La route /ai/[skill] existante continue
-- de marcher : si slug matche une macro → filtre pros par category_id ;
-- si slug matche un skill → filtre pros par parent_category_id (= macro).
--
-- Volume cible : 50 skills × 60 villes = 3000+ pages SEO programmatiques
-- additionnelles + 50 pages root skill France-wide.
--
-- Run :
--   psql $DATABASE_URL -f migrations/2026-05-25_workwave_ai_skills_extension.sql
-- ou via Supabase Dashboard SQL editor.
-- ============================================================================

-- 1. Ajout colonnes hierarchie + popularity
ALTER TABLE categories
  ADD COLUMN IF NOT EXISTS parent_category_id INT REFERENCES categories(id),
  ADD COLUMN IF NOT EXISTS popularity INT DEFAULT 50;

-- 2. Index pour speed up les queries par parent
CREATE INDEX IF NOT EXISTS categories_parent_category_id_idx
  ON categories(parent_category_id);

-- 3. Index pour speed up listing par vertical + popularity (pour seo tris)
CREATE INDEX IF NOT EXISTS categories_vertical_popularity_idx
  ON categories(vertical, popularity DESC) WHERE deleted_at IS NULL;

-- Verification :
--   SELECT id, slug, name, vertical, parent_category_id, popularity
--   FROM categories WHERE vertical='tech' ORDER BY parent_category_id, popularity DESC;
-- Avant seed : 6 rows avec parent_category_id NULL (les macros).
-- Apres seed : 6 macros + 30-50 skills avec parent_category_id IN (43..48).

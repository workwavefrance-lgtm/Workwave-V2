-- ============================================================================
-- 12/06/2026 — RPC sitemap_batch_start_id : le lookup OFFSET du point de
-- départ des sous-sitemaps pros timeoutait (~8s statement_timeout PostgREST)
-- au-delà de ~1,5M de skip depuis que la base est à 2,3M pros.
-- Conséquence : findBatchStartId ignorait l'erreur → sitemaps 125+ VIDES
-- servis et cachés 24h (45k fiches invisibles par sous-sitemap).
--
-- Fix : (1) index partiel couvrant (id, category_id) pour un index-only scan,
--       (2) RPC SECURITY DEFINER avec statement_timeout 120s.
-- ============================================================================

-- 1. Index partiel couvrant : OFFSET 1,7M = simple parcours d'index (rapide)
CREATE INDEX IF NOT EXISTS idx_pros_active_id_cat
  ON pros (id, category_id)
  WHERE is_active = true AND deleted_at IS NULL;

-- 2. RPC avec timeout large (filtre tech dérivé de categories.vertical,
--    pas d'IDs hardcodés — source de vérité unique, cf. leçon 26/05)
CREATE OR REPLACE FUNCTION sitemap_batch_start_id(skip_count integer, tech_mode boolean)
RETURNS bigint
LANGUAGE sql
STABLE
SECURITY DEFINER
SET statement_timeout = '120s'
SET search_path = public
AS $$
  SELECT p.id
  FROM pros p
  WHERE p.is_active = true
    AND p.deleted_at IS NULL
    AND (
      (tech_mode AND p.category_id IN (SELECT c.id FROM categories c WHERE c.vertical = 'tech'))
      OR
      (NOT tech_mode AND p.category_id NOT IN (SELECT c.id FROM categories c WHERE c.vertical = 'tech'))
    )
  ORDER BY p.id
  OFFSET skip_count
  LIMIT 1
$$;

REVOKE EXECUTE ON FUNCTION sitemap_batch_start_id(integer, boolean) FROM anon, authenticated, public;
GRANT EXECUTE ON FUNCTION sitemap_batch_start_id(integer, boolean) TO service_role;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 2026-06-08 — RPC d'agrégat pour le sitemap (cat×ville BTP + cat×ville tech)
-- ============================================================================
-- Contexte : les sous-sitemaps /sitemap/2.xml (cat×ville) et /sitemap/4.xml
-- (/ai) sortaient VIDES (0 URL). Cause : les builders chargeaient des CENTAINES
-- DE MILLIERS de lignes `pros` en JS pour les compter → timeout → 0 URL.
--
-- Fix : déplacer le comptage en base (GROUP BY server-side) via 2 fonctions.
--
-- ⚠️ Les fonctions renvoient un **jsonb** (un seul tableau), PAS un SETOF/TABLE.
-- Raison : PostgREST plafonne TOUT résultat de RPC qui renvoie des LIGNES à
-- `max-rows` (1000 par défaut) → la version TABLE tronquait cat×ville à 1000
-- combos (≈806 BTP affichés au lieu de plusieurs milliers). En renvoyant une
-- valeur scalaire jsonb, le cap ne s'applique pas → tableau complet.
--
-- Clés du jsonb : { "c": category_id, "v": city_id, "n": count }.
--
-- Idempotent : DROP IF EXISTS + CREATE. Réexécutable sans risque.
-- ============================================================================

-- Le type de retour change (TABLE -> jsonb) => DROP obligatoire avant CREATE.
DROP FUNCTION IF EXISTS sitemap_city_cat_counts(int[]);
DROP FUNCTION IF EXISTS sitemap_ai_city_cat_counts();

-- 1) Comptage (cat, ville) des pros actifs pour une liste de villes, >= 3 pros
--    (en dessous, la page cat×ville redirige 308 vers le département — Phase D).
CREATE FUNCTION sitemap_city_cat_counts(p_city_ids int[])
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET statement_timeout = '120s'
AS $$
  SELECT coalesce(
    jsonb_agg(jsonb_build_object('c', t.category_id, 'v', t.city_id, 'n', t.cnt)),
    '[]'::jsonb
  )
  FROM (
    SELECT p.category_id, p.city_id, count(*) AS cnt
    FROM pros p
    WHERE p.is_active = true
      AND p.deleted_at IS NULL
      AND p.city_id = ANY(p_city_ids)
    GROUP BY p.category_id, p.city_id
    HAVING count(*) >= 3
  ) t;
$$;

-- 2) Comptage (cat, ville) des pros TECH (toutes villes, >= 1 pro).
--    ⚠️ Liste alignée avec AI_CATEGORY_IDS (lib/ai/helpers.ts).
CREATE FUNCTION sitemap_ai_city_cat_counts()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET statement_timeout = '120s'
AS $$
  SELECT coalesce(
    jsonb_agg(jsonb_build_object('c', t.category_id, 'v', t.city_id, 'n', t.cnt)),
    '[]'::jsonb
  )
  FROM (
    SELECT p.category_id, p.city_id, count(*) AS cnt
    FROM pros p
    WHERE p.is_active = true
      AND p.deleted_at IS NULL
      AND p.city_id IS NOT NULL
      AND p.category_id IN (43,44,45,46,47,48,79,80,81,82,83,85,86,87)
    GROUP BY p.category_id, p.city_id
  ) t;
$$;

GRANT EXECUTE ON FUNCTION sitemap_city_cat_counts(int[]) TO service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION sitemap_ai_city_cat_counts() TO service_role, anon, authenticated;

-- Index couvrant pour l'agrégat (city_id = ANY(<300 villes>) sur 1,78M lignes).
-- Index-only scan → comptage en quelques secondes au lieu de >120s.
-- ⚠️ Verrou bref (~30s) sur les écritures de `pros` à la création (heure creuse).
CREATE INDEX IF NOT EXISTS idx_pros_active_city_cat
  ON pros (city_id, category_id)
  WHERE is_active = true AND deleted_at IS NULL;

NOTIFY pgrst, 'reload schema';

-- ============================================================================
-- 2026-06-08 — RPC d'agrégat pour le sitemap (cat×ville BTP + cat×ville tech)
-- ============================================================================
-- Contexte : les sous-sitemaps /sitemap/2.xml (cat×ville) et /sitemap/4.xml
-- (/ai) sortaient VIDES (0 URL). Cause : les builders chargeaient des CENTAINES
-- DE MILLIERS de lignes `pros` en JS pour les compter (top 300 villes × tous
-- métiers ≈ 700k lignes ; 510k pros tech) → la 1re requête timeoutait, la boucle
-- cassait sur data=null → 0 URL servie, puis mise en cache 24h. Google ne
-- découvrait donc AUCUNE page métier×ville ni /ai.
--
-- Fix : déplacer le comptage en base (GROUP BY server-side, 1 passe rapide) via
-- 2 fonctions. Le builder fait alors 1 seul appel RPC au lieu de ~140 round-trips.
--
-- Idempotent : CREATE OR REPLACE. Réexécutable sans risque.
-- ============================================================================

-- 1) Comptage (category_id, city_id) des pros actifs pour une liste de villes.
--    HAVING >= 3 : le listing cat×ville n'est émis qu'à partir de 3 pros (en
--    dessous, la page redirige 308 vers le département — cf. Phase D).
CREATE OR REPLACE FUNCTION sitemap_city_cat_counts(p_city_ids int[])
RETURNS TABLE(category_id int, city_id int, cnt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET statement_timeout = '120s'
AS $$
  SELECT p.category_id, p.city_id, count(*)::bigint
  FROM pros p
  WHERE p.is_active = true
    AND p.deleted_at IS NULL
    AND p.city_id = ANY(p_city_ids)
  GROUP BY p.category_id, p.city_id
  HAVING count(*) >= 3;
$$;

-- 2) Comptage (category_id, city_id) des pros TECH (toutes villes, >= 1 pro).
--    ⚠️ La liste d'IDs doit rester alignée avec AI_CATEGORY_IDS
--    (lib/ai/helpers.ts) : 6 tech (43-48) + 8 business/créatif (79-87, sauf 84).
CREATE OR REPLACE FUNCTION sitemap_ai_city_cat_counts()
RETURNS TABLE(category_id int, city_id int, cnt bigint)
LANGUAGE sql
STABLE
SECURITY DEFINER
SET statement_timeout = '120s'
AS $$
  SELECT p.category_id, p.city_id, count(*)::bigint
  FROM pros p
  WHERE p.is_active = true
    AND p.deleted_at IS NULL
    AND p.city_id IS NOT NULL
    AND p.category_id IN (43,44,45,46,47,48,79,80,81,82,83,85,86,87)
  GROUP BY p.category_id, p.city_id;
$$;

-- Droits d'exécution. Le sitemap tourne en service_role (getAdminServiceClient),
-- mais on autorise large (lecture publique non sensible : juste des comptages).
GRANT EXECUTE ON FUNCTION sitemap_city_cat_counts(int[]) TO service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION sitemap_ai_city_cat_counts() TO service_role, anon, authenticated;

-- Index couvrant pour accélérer sitemap_city_cat_counts : sans lui,
-- city_id = ANY(<300 villes>) sur 1,78M lignes timeoutait (>120s). Avec cet
-- index partiel (city_id, category_id), un index-only scan ramène le comptage à
-- quelques secondes. ⚠️ Pose un verrou bref (~30s) sur les écritures de `pros`
-- pendant la création — à lancer à une heure creuse.
CREATE INDEX IF NOT EXISTS idx_pros_active_city_cat
  ON pros (city_id, category_id)
  WHERE is_active = true AND deleted_at IS NULL;

-- Recharge le cache de schéma PostgREST pour exposer les 2 RPC immédiatement.
NOTIFY pgrst, 'reload schema';

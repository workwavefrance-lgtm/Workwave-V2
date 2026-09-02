-- ============================================================================
-- 2026-09-02 : les RPC de comptage du sitemap n'incluent plus les
-- etablissements FERMES (etat_admin = 'F').
-- ============================================================================
-- POURQUOI : mesure du 02/09/2026, 45 % des fiches actives sont des
-- etablissements fermes d'apres les fichiers Stock Sirene (ecrit par
-- scripts/classer-etablissements.ts dans pros.etat_admin). Decision Willy :
-- la page d'une fiche fermee reste en ligne, mais un etablissement ferme ne
-- doit plus etre compte comme un pro disponible. Les listings /[metier]/[ville]
-- appliquent desormais ce filtre (lib/queries/pros.ts, FILTRE_OUVERTS) et
-- redirigent en 308 vers le departement quand il ne reste aucun pro ouvert.
-- Le sitemap cat x ville doit compter avec la MEME regle, sinon il declare des
-- adresses qui redirigent (« Page avec redirection » dans Search Console).
--
-- QUOI : CREATE OR REPLACE des 2 fonctions de migrations/2026-06-08_sitemap_count_rpcs.sql
-- (meme signature, meme type de retour jsonb, seul le WHERE change) avec
--   AND (p.etat_admin IS NULL OR p.etat_admin <> 'F')
-- Le NULL reste compte : une fiche jamais verifiee est presumee ouverte, comme
-- cote PostgREST (`neq` exclurait les null, d'ou le `or` dans FILTRE_OUVERTS).
--
-- INDEX : ces agregats reposent sur idx_pros_ouverts_city_cat, cree A PART dans
-- migrations/2026-09-02_index_pros_ouverts.sql (CREATE INDEX CONCURRENTLY ne
-- peut pas tourner dans une transaction). En attendant l'index, le planificateur
-- utilise idx_pros_active_city_cat puis filtre etat_admin ligne par ligne ;
-- correct, seulement plus lent. Le statement_timeout de 120 s est conserve.
--
-- Idempotent : CREATE OR REPLACE. Rejouable sans risque.
-- ============================================================================

-- 1) Comptage (cat, ville) des pros OUVERTS pour une liste de villes, >= 3 pros
--    (en dessous, la page cat x ville redirige 308 vers le departement, Phase D).
CREATE OR REPLACE FUNCTION sitemap_city_cat_counts(p_city_ids int[])
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
      AND (p.etat_admin IS NULL OR p.etat_admin <> 'F')
      AND p.city_id = ANY(p_city_ids)
    GROUP BY p.category_id, p.city_id
    HAVING count(*) >= 3
  ) t;
$$;

-- 2) Comptage (cat, ville) des pros TECH OUVERTS (toutes villes, >= 1 pro).
--    Liste alignee avec AI_CATEGORY_IDS (lib/ai/helpers.ts), inchangee.
CREATE OR REPLACE FUNCTION sitemap_ai_city_cat_counts()
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
      AND (p.etat_admin IS NULL OR p.etat_admin <> 'F')
      AND p.city_id IS NOT NULL
      AND p.category_id IN (43,44,45,46,47,48,79,80,81,82,83,85,86,87)
    GROUP BY p.category_id, p.city_id
  ) t;
$$;

-- Les GRANT survivent a un CREATE OR REPLACE ; repetes pour l'idempotence.
GRANT EXECUTE ON FUNCTION sitemap_city_cat_counts(int[]) TO service_role, anon, authenticated;
GRANT EXECUTE ON FUNCTION sitemap_ai_city_cat_counts() TO service_role, anon, authenticated;

NOTIFY pgrst, 'reload schema';

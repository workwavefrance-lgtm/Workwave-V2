-- Baromètre artisans : compte des pros actifs (BTP/domicile/personne) par
-- département FR + population, en UNE requête. Renvoie du jsonb (contourne le
-- cap PostgREST 1000, cf. leçon sitemap 08/06).
--
-- PERF : on agrège D'ABORD par city_id (l'index partiel idx_pros_active_city_cat
-- a city_id en tête → index-only scan rapide, PAS de jointure sur 2,4M lignes),
-- PUIS on joint le résultat par ville (~30k lignes) aux départements. La v1 qui
-- joignait pros→cities directement sur 2,4M lignes dépassait le statement_timeout.

DROP FUNCTION IF EXISTS barometre_dept_artisans();

CREATE FUNCTION barometre_dept_artisans()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET statement_timeout = '120s'
AS $$
  WITH per_city AS (
    SELECT p.city_id AS cid, count(*) AS n
    FROM pros p
    WHERE p.is_active AND p.deleted_at IS NULL
      AND p.category_id IN (
        SELECT id FROM categories WHERE vertical IN ('btp','domicile','personne')
      )
    GROUP BY p.city_id
  ),
  per_dept AS (
    SELECT c.department_id AS did,
           sum(pc.n) AS pros,
           sum(coalesce(c.population,0)) AS pop
    FROM cities c
    LEFT JOIN per_city pc ON pc.cid = c.id
    GROUP BY c.department_id
  )
  SELECT jsonb_agg(jsonb_build_object(
    'code', d.code,
    'name', d.name,
    'region', d.region,
    'pros', coalesce(pd.pros, 0),
    'pop_cities', coalesce(pd.pop, 0)
  ) ORDER BY d.code)
  FROM departments d
  LEFT JOIN per_dept pd ON pd.did = d.id
  WHERE d.country = 'FR';
$$;

GRANT EXECUTE ON FUNCTION barometre_dept_artisans() TO service_role, anon, authenticated;

NOTIFY pgrst, 'reload schema';

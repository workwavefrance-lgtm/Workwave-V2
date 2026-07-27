-- Baromètre « déserts d'artisans » : compte des pros actifs par MÉTIER × DÉPARTEMENT
-- FR, en une requête. Renvoie jsonb [{c: slug_metier, d: code_dept, n: count}].
-- Perf : agrège d'abord par (city_id, category_id) via l'index partiel, puis joint
-- au département (cf. leçon RPC dept 27/07 — pas de jointure directe sur 2,4M lignes).

DROP FUNCTION IF EXISTS barometre_cat_dept();

CREATE FUNCTION barometre_cat_dept()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET statement_timeout = '120s'
AS $$
  WITH per_city AS (
    SELECT p.city_id AS cid, p.category_id AS cat, count(*) AS n
    FROM pros p
    WHERE p.is_active AND p.deleted_at IS NULL
      AND p.category_id IN (
        SELECT id FROM categories WHERE vertical IN ('btp','domicile','personne')
      )
    GROUP BY p.city_id, p.category_id
  ),
  per_cat_dept AS (
    SELECT pc.cat AS cat, c.department_id AS did, sum(pc.n) AS n
    FROM per_city pc
    JOIN cities c ON c.id = pc.cid
    GROUP BY pc.cat, c.department_id
  )
  SELECT jsonb_agg(jsonb_build_object('c', cat.slug, 'd', d.code, 'n', t.n))
  FROM per_cat_dept t
  JOIN categories cat ON cat.id = t.cat
  JOIN departments d ON d.id = t.did
  WHERE d.country = 'FR';
$$;

GRANT EXECUTE ON FUNCTION barometre_cat_dept() TO service_role, anon, authenticated;

NOTIFY pgrst, 'reload schema';

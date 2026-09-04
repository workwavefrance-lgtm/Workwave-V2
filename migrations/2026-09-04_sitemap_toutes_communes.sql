-- Le sitemap ne couvrait qu une fraction des pages qui existent.
--
-- MESURES DU 04/09/2026 (scripts/_mesure-couverture-listings.ts et
-- scripts/_audit-familles.ts, contre le sitemap servi en production) :
--   metier x ville avec au moins 3 artisans OUVERTS : 83 406 sur 13 665
--   communes. Le sitemap n en declarait que 8 405, parce que
--   TOP_CITIES_FOR_LISTINGS = 300 dans app/sitemap.ts ne regarde que les 300
--   plus grandes villes sur 35 163. Il manque 74 999 pages qui existent et
--   repondent en HTTP 200.
--   Meme plafond sur les sous-specialites : TOP_CITIES_FOR_SPECIALTIES = 100.
--
-- Ces fonctions remplacent la boucle par un agregat unique, servi par l index
-- partiel idx_pros_ouverts_city_cat (city_id, category_id) WHERE ouvert.
-- Elles renvoient du jsonb SCALAIRE pour echapper au plafond PostgREST de
-- 1 000 lignes (lecon du 08/06), et une PAGE a la fois pour tenir sous la
-- limite de 50 000 adresses par sitemap.
--
-- ORDRE STABLE (category_id, city_id) : indispensable. Sans lui, deux appels
-- successifs ne decoupent pas le meme ensemble et des pages disparaissent
-- silencieusement entre deux sous-sitemaps.
--
-- Le seuil est un PARAMETRE : p_min = 3 aujourd hui (une page avec un seul
-- artisan est trop maigre), p_min = 1 pour mesurer ce qui existe vraiment.

CREATE OR REPLACE FUNCTION sitemap_city_cat_page(p_offset integer, p_limit integer, p_min integer DEFAULT 3)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('c', c, 'v', v, 'n', n)), '[]'::jsonb)
  FROM (
    SELECT category_id AS c, city_id AS v, count(*) AS n
    FROM pros
    WHERE is_active = true
      AND deleted_at IS NULL
      AND city_id IS NOT NULL
      AND (etat_admin IS NULL OR etat_admin <> 'F')
    GROUP BY category_id, city_id
    HAVING count(*) >= p_min
    ORDER BY category_id, city_id
    OFFSET p_offset
    LIMIT p_limit
  ) t;
$$;

-- Combien de pages metier x ville existent, pour dimensionner les sous-sitemaps.
CREATE OR REPLACE FUNCTION sitemap_city_cat_total(p_min integer DEFAULT 3)
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM (
    SELECT 1
    FROM pros
    WHERE is_active = true
      AND deleted_at IS NULL
      AND city_id IS NOT NULL
      AND (etat_admin IS NULL OR etat_admin <> 'F')
    GROUP BY category_id, city_id
    HAVING count(*) >= p_min
  ) t;
$$;

-- Metier x departement : combien d artisans OUVERTS par couple, pour savoir
-- quelles pages departement ont de la matiere et lesquelles sont vides.
-- Le sitemap en declare 6 031 aujourd hui, sans verifier qu il y ait un pro.
CREATE OR REPLACE FUNCTION sitemap_dept_cat_counts(p_min integer DEFAULT 1)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('c', c, 'd', d, 'n', n)), '[]'::jsonb)
  FROM (
    SELECT p.category_id AS c, v.department_id AS d, count(*) AS n
    FROM pros p
    JOIN cities v ON v.id = p.city_id
    WHERE p.is_active = true
      AND p.deleted_at IS NULL
      AND (p.etat_admin IS NULL OR p.etat_admin <> 'F')
    GROUP BY p.category_id, v.department_id
    HAVING count(*) >= p_min
  ) t;
$$;

REVOKE ALL ON FUNCTION sitemap_city_cat_page(integer, integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION sitemap_city_cat_total(integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION sitemap_dept_cat_counts(integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION sitemap_city_cat_page(integer, integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION sitemap_city_cat_total(integer) TO service_role;
GRANT EXECUTE ON FUNCTION sitemap_dept_cat_counts(integer) TO service_role;

NOTIFY pgrst, 'reload schema';

-- Controle. Attendu : environ 83 400 pour min 3, davantage pour min 1.
SELECT sitemap_city_cat_total(3) AS pages_metier_ville_min3,
       sitemap_city_cat_total(1) AS pages_metier_ville_min1,
       jsonb_array_length(sitemap_dept_cat_counts(1)) AS pages_metier_dept_avec_pros,
       jsonb_array_length(sitemap_dept_cat_counts(3)) AS pages_metier_dept_min3;

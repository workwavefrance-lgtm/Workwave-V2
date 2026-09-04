-- Meme fonction, mais elle rend directement les SLUGS.
--
-- Pourquoi : sans cela, le sitemap doit charger les 35 163 communes en JS pour
-- traduire les identifiants en slugs, et ce a chaque sous-sitemap. La jointure
-- cote base coute quelques millisecondes et evite 36 allers-retours par page
-- pendant le build, la ou cinq deploiements ont deja echoue le 03/09 sur des
-- requetes trop lentes.
--
-- A appliquer APRES 2026-09-04_sitemap_toutes_communes.sql.

CREATE OR REPLACE FUNCTION sitemap_city_cat_page(p_offset integer, p_limit integer, p_min integer DEFAULT 3)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('m', metier, 'v', ville, 'n', n)), '[]'::jsonb)
  FROM (
    SELECT cat.slug AS metier, v.slug AS ville, t.n AS n
    FROM (
      SELECT category_id AS c, city_id AS vid, count(*) AS n
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
    ) t
    JOIN categories cat ON cat.id = t.c
    JOIN cities v ON v.id = t.vid
    WHERE cat.vertical IN ('btp', 'domicile', 'personne')
  ) x;
$$;

REVOKE ALL ON FUNCTION sitemap_city_cat_page(integer, integer, integer) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION sitemap_city_cat_page(integer, integer, integer) TO service_role;

NOTIFY pgrst, 'reload schema';

-- Controle : doit renvoyer 45 000 lignes et un exemple lisible.
SELECT jsonb_array_length(sitemap_city_cat_page(0, 45000, 3)) AS lignes_page_1,
       sitemap_city_cat_page(0, 1, 3) AS exemple;

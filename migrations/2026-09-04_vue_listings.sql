-- Vue materialisee des pages metier x ville qui ont de la matiere.
--
-- POURQUOI UNE VUE ET PAS UN AGREGAT A LA DEMANDE (mesure du 04/09/2026) :
-- l agregat GROUP BY sur 1,23 million de lignes ouvertes depasse le delai
-- autorise aux scripts et au build (le statement_timeout qui s applique est
-- celui du role authenticator, pas celui de service_role). Il tourne dans
-- l editeur SQL, qui n a pas ce plafond, mais pas depuis l application.
-- Le build appelle cet agregat quatre fois, une par tranche de sitemap :
-- il doit etre instantane, sinon c est le sixieme deploiement echoue de la
-- semaine sur une requete trop lente.
--
-- La vue est calculee une fois, indexee, et relue en quelques millisecondes.
-- Elle se rafraichit CONCURRENTLY (sans bloquer les lectures) apres chaque
-- scrape ou classement, par la fonction rafraichir_listings().
--
-- Contenu : un couple (metier, ville) par ligne, avec le nombre d artisans
-- OUVERTS, seuil a 3. Mesure du jour : 83 406 lignes sur 13 665 communes,
-- la ou le sitemap n en declarait que 8 405 (plafond des 300 plus grandes
-- villes sur 35 163, jamais rouvert depuis que la base est passee de
-- 226 000 a 2,4 millions de fiches).

DROP MATERIALIZED VIEW IF EXISTS listing_cat_ville;

CREATE MATERIALIZED VIEW listing_cat_ville AS
SELECT cat.slug::text AS metier,
       v.slug::text   AS ville,
       count(*)::int  AS n
FROM pros p
JOIN categories cat ON cat.id = p.category_id
JOIN cities v       ON v.id = p.city_id
WHERE p.is_active = true
  AND p.deleted_at IS NULL
  AND (p.etat_admin IS NULL OR p.etat_admin <> 'F')
  AND cat.vertical IN ('btp', 'domicile', 'personne')
GROUP BY cat.slug, v.slug
HAVING count(*) >= 3;

-- Index UNIQUE : indispensable pour REFRESH ... CONCURRENTLY.
CREATE UNIQUE INDEX listing_cat_ville_cle ON listing_cat_ville (metier, ville);
-- Index de parcours : l ordre de lecture des tranches du sitemap doit etre
-- stable, sinon deux tranches ne decoupent pas le meme ensemble et des pages
-- disparaissent en silence entre deux fichiers.
CREATE INDEX listing_cat_ville_ordre ON listing_cat_ville (n DESC, metier, ville);

-- Une tranche du sitemap. Les pages les plus fournies d abord : si un jour une
-- tranche n est pas lue par Google, ce sont les pages les plus pauvres qui
-- sautent, pas les meilleures.
CREATE OR REPLACE FUNCTION sitemap_listings_page(p_offset integer, p_limit integer)
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT COALESCE(jsonb_agg(jsonb_build_object('m', metier, 'v', ville, 'n', n)), '[]'::jsonb)
  FROM (
    SELECT metier, ville, n
    FROM listing_cat_ville
    ORDER BY n DESC, metier, ville
    OFFSET p_offset
    LIMIT p_limit
  ) t;
$$;

CREATE OR REPLACE FUNCTION sitemap_listings_total()
RETURNS integer
LANGUAGE sql
STABLE
SECURITY DEFINER
SET search_path = public
AS $$
  SELECT count(*)::integer FROM listing_cat_ville;
$$;

-- A appeler apres tout scrape ou classement qui change l etat des fiches.
CREATE OR REPLACE FUNCTION rafraichir_listings()
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE n integer;
BEGIN
  REFRESH MATERIALIZED VIEW CONCURRENTLY listing_cat_ville;
  SELECT count(*) INTO n FROM listing_cat_ville;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION sitemap_listings_page(integer, integer) FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION sitemap_listings_total() FROM PUBLIC, anon, authenticated;
REVOKE ALL ON FUNCTION rafraichir_listings() FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION sitemap_listings_page(integer, integer) TO service_role;
GRANT EXECUTE ON FUNCTION sitemap_listings_total() TO service_role;
GRANT EXECUTE ON FUNCTION rafraichir_listings() TO service_role;
GRANT SELECT ON listing_cat_ville TO service_role;

NOTIFY pgrst, 'reload schema';

-- Controle : doit afficher environ 83 400, et une premiere ligne lisible.
SELECT sitemap_listings_total() AS pages_metier_ville,
       sitemap_listings_page(0, 2) AS deux_premieres;

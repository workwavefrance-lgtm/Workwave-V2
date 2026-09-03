-- ============================================================================
-- 2026-09-03 : comptes par metier x departement selon l'etat Sirene des
-- fiches (ouvertes / fermees / entreprises disparues), pour les compteurs
-- publics, lib/data/metier-stats.ts et les barometres.
-- ============================================================================
-- POURQUOI : le classement par les fichiers Stock Sirene (scripts/
-- classer-etablissements.ts, termine le 03/09/2026) donne, sur les fiches
-- actives (is_active AND deleted_at IS NULL) :
--     total 2 439 976 · ouvertes 1 233 038 · fermees 1 206 938 (dont 785 154
--     entreprises disparues, etat_admin = 'F' ET entreprise_etat = 'C').
-- Les compteurs publics comptaient tout. Decision Willy : ils comptent les
-- fiches OUVERTES, soit (etat_admin IS NULL OR etat_admin <> 'F'), la regle
-- de FILTRE_OUVERTS dans lib/queries/pros.ts. Les barometres publient en plus
-- la part d'etablissements fermes et la part d'entreprises disparues, par
-- departement et par metier.
--
-- POURQUOI UNE VUE MATERIALISEE et pas un agregat a la demande : mesure du
-- 03/09/2026 a 15 h, la RPC barometre_cat_dept() du 27/07 (meme agregat, sans
-- les etats) depasse le statement_timeout de 120 s ; barometre_dept_artisans()
-- repond en 11,3 s. Apres 2,3 M de lignes reecrites en trois jours, la table
-- est gonflee et la carte de visibilite n'est plus a jour : un agregat qui lit
-- etat_admin / entreprise_etat / etat_verifie_at doit toucher le tas, aucun
-- index ne les porte. Le calcul se fait donc UNE fois, ici, dans l'editeur SQL
-- (pas de delai PostgREST), et les scripts lisent le resultat (~10 000 lignes)
-- en quelques millisecondes.
--
-- A APPLIQUER par Willy dans l'editeur SQL Supabase (ou psql). Le CREATE
-- MATERIALIZED VIEW calcule les comptes au passage : compter plusieurs
-- minutes. Si l'editeur coupe la requete, lancer d'abord
--     SET statement_timeout = 0;
-- dans la meme session (psql), puis ce fichier.
--
-- A RAFRAICHIR apres chaque nouveau classement ou gros scrape :
--     REFRESH MATERIALIZED VIEW stats_etats_cat_dept;
-- (ou SELECT stats_etats_cat_dept_rafraichir(); qui pose 600 s de delai).
-- Puis relancer les trois scripts :
--     npx tsx scripts/build-metier-stats.ts
--     npx tsx scripts/build-barometre.ts
--     npx tsx scripts/build-penurie.ts
--
-- Idempotent : IF NOT EXISTS + CREATE OR REPLACE. Rejouable sans risque.
-- Aucune donnee personnelle : uniquement des comptes agreges.
-- ============================================================================

CREATE MATERIALIZED VIEW IF NOT EXISTS stats_etats_cat_dept AS
WITH per_city AS (
  -- Agregat d'abord par (commune, metier), comme les RPC du 27/07 : PAS de
  -- jointure sur 2,4 M de lignes.
  SELECT p.city_id AS cid,
         p.category_id AS cat,
         count(*) AS t,
         count(*) FILTER (WHERE p.etat_admin IS NULL OR p.etat_admin <> 'F') AS o,
         count(*) FILTER (WHERE p.etat_verifie_at IS NOT NULL) AS v,
         count(*) FILTER (WHERE p.etat_admin = 'F') AS f,
         count(*) FILTER (WHERE p.etat_admin = 'F' AND p.entreprise_etat = 'C') AS x
  FROM pros p
  WHERE p.is_active = true
    AND p.deleted_at IS NULL
  GROUP BY p.city_id, p.category_id
)
SELECT cat.id            AS category_id,
       cat.slug          AS category_slug,
       cat.vertical      AS vertical,
       d.id              AS department_id,
       d.code            AS dept_code,
       d.country         AS country,
       sum(pc.t)::int    AS actifs,     -- fiches actives
       sum(pc.o)::int    AS ouverts,    -- etat_admin null ou <> 'F' (FILTRE_OUVERTS)
       sum(pc.v)::int    AS verifies,   -- etat connu par les fichiers Stock Sirene
       sum(pc.f)::int    AS fermes,     -- etablissements fermes
       sum(pc.x)::int    AS disparus,   -- fermes ET entreprise cessee
       now()             AS calcule_le
FROM per_city pc
JOIN categories cat ON cat.id = pc.cat
LEFT JOIN cities ci ON ci.id = pc.cid            -- LEFT : fiches sans commune gardees (dept_code null)
LEFT JOIN departments d ON d.id = ci.department_id
GROUP BY cat.id, cat.slug, cat.vertical, d.id, d.code, d.country
WITH DATA;

-- Lecture reservee au serveur : Supabase donne par defaut SELECT a anon et
-- authenticated sur tout objet nouveau du schema public (lecon RLS du 22/05).
-- Une vue materialisee n'a pas de RLS : on retire le droit.
REVOKE ALL ON stats_etats_cat_dept FROM anon, authenticated;

-- 1) Lecture de la vue en UN jsonb (le cap PostgREST de 1000 lignes ne
--    s'applique pas a une valeur scalaire, lecon du 08/06).
--    Cles : c slug metier, vertical, d code dept (null si sans commune),
--    k pays (FR/BE), t actifs, o ouverts, v verifies, f fermes, x disparus,
--    calcule_le date de la vue.
CREATE OR REPLACE FUNCTION stats_etats_cat_dept_json()
RETURNS jsonb
LANGUAGE sql
STABLE
SECURITY DEFINER
AS $$
  SELECT coalesce(
    jsonb_agg(jsonb_build_object(
      'c', category_slug, 'vertical', vertical, 'd', dept_code, 'k', country,
      't', actifs, 'o', ouverts, 'v', verifies, 'f', fermes, 'x', disparus,
      'calcule_le', calcule_le
    )),
    '[]'::jsonb
  )
  FROM stats_etats_cat_dept;
$$;

REVOKE EXECUTE ON FUNCTION stats_etats_cat_dept_json() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION stats_etats_cat_dept_json() TO service_role;

-- 2) Rafraichissement (a lancer apres un classement ou un scrape). Renvoie la
--    date de calcul. 600 s de delai : l'agregat lit tout le tas de `pros`.
CREATE OR REPLACE FUNCTION stats_etats_cat_dept_rafraichir()
RETURNS timestamptz
LANGUAGE plpgsql
SECURITY DEFINER
SET statement_timeout = '600s'
AS $$
BEGIN
  REFRESH MATERIALIZED VIEW stats_etats_cat_dept;
  RETURN (SELECT max(calcule_le) FROM stats_etats_cat_dept);
END
$$;

REVOKE EXECUTE ON FUNCTION stats_etats_cat_dept_rafraichir() FROM public, anon, authenticated;
GRANT EXECUTE ON FUNCTION stats_etats_cat_dept_rafraichir() TO service_role;

NOTIFY pgrst, 'reload schema';

-- Controle apres application (les totaux doivent retrouver la mesure SQL de
-- Willy du 03/09/2026 : 2 439 976 / 1 233 038 / 1 206 938 / 785 154) :
--   SELECT sum(actifs), sum(ouverts), sum(fermes), sum(disparus), max(calcule_le)
--   FROM stats_etats_cat_dept;

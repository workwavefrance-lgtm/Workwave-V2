-- Perf admin /admin/pros sur la table pros (1,08M lignes).
--
-- Le tri par defaut est deja passe sur "id" (PK indexe) cote code -> landing
-- 7,2s -> 0,3s. Cette migration regle les 2 derniers points lents :
--   1. onglet "Workwave AI" (filtre category_id IN (~145) + tri id) : 1,3s
--      -> index composite (category_id, id) = scan d'index direct.
--   2. recherche "Nom, SIRET, email" (ILIKE '%x%') : 3,7s (seq scan)
--      -> trigram GIN sur name = ILIKE indexe.
--
-- NB : on n'utilise PAS CREATE INDEX CONCURRENTLY car le SQL Editor Supabase
-- enveloppe le script dans une transaction (CONCURRENTLY y est interdit :
-- ERROR 25001). Un CREATE INDEX normal pose un bref verrou en ecriture
-- pendant la construction (quelques secondes a ~1 min pour le GIN). La table
-- pros est tres peu ecrite en live (claims/signups rares) -> impact negligeable.
-- => Lancer de preference a un moment calme. Tout le script passe d'un coup.

-- 1) Tri par vertical (AI/BTP) instantane
CREATE INDEX IF NOT EXISTS idx_pros_category_id_id
  ON pros (category_id, id DESC);

-- 2) Recherche ILIKE rapide (nom)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX IF NOT EXISTS idx_pros_name_trgm
  ON pros USING gin (name gin_trgm_ops);

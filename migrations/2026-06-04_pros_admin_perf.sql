-- Perf admin /admin/pros sur la table pros (1,08M lignes).
--
-- Le tri par defaut est deja passe sur "id" (PK indexe) cote code -> landing
-- 7,2s -> 0,3s. Cette migration regle les 2 derniers points lents :
--   1. onglet "Workwave AI" (filtre category_id IN (~145) + tri id) : 1,3s
--      -> index composite (category_id, id) = scan d'index direct.
--   2. recherche "Nom, SIRET, email" (ILIKE '%x%') : 3,7s (seq scan)
--      -> trigram GIN sur name = ILIKE indexe.
--
-- ⚠️ CREATE INDEX CONCURRENTLY ne doit PAS tourner dans une transaction.
--    Dans le SQL Editor Supabase : lancer chaque instruction SEPAREMENT
--    (ou laisser l'autocommit, qui execute statement par statement).
--    CONCURRENTLY = aucun verrou en ecriture pendant la creation (table live).

-- 1) Tri par vertical (AI/BTP) instantane
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pros_category_id_id
  ON pros (category_id, id DESC);

-- 2) Recherche ILIKE rapide (nom)
CREATE EXTENSION IF NOT EXISTS pg_trgm;

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pros_name_trgm
  ON pros USING gin (name gin_trgm_ops);

-- (optionnel) si la recherche par email/siret doit aussi etre rapide :
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pros_email_trgm
--   ON pros USING gin (email gin_trgm_ops);

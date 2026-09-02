-- ============================================================================
-- 2026-09-02 : index partiel des etablissements OUVERTS, pour les listings,
-- les compteurs et les RPC du sitemap qui excluent etat_admin = 'F'.
-- ============================================================================
-- FICHIER A PART, VOLONTAIREMENT : CREATE INDEX CONCURRENTLY ne peut pas
-- s'executer dans une transaction (erreur « CREATE INDEX CONCURRENTLY cannot
-- run inside a transaction block »). A lancer SEUL, hors BEGIN/COMMIT : psql
-- sans transaction englobante, ou l'editeur SQL Supabase avec cette seule
-- commande. CONCURRENTLY ne bloque ni les lectures ni les ecritures sur
-- `pros` (contrairement au CREATE INDEX classique de la migration du 08/06).
--
-- QUAND : de preference APRES la fin de scripts/classer-etablissements.ts
-- (sinon l'index se construit sur 2,5 M de lignes dont 45 % vont changer de
-- predicat pendant le classement ; correct, mais du travail pour rien).
-- Il reste valide s'il est cree avant : Postgres maintient le predicat a
-- chaque UPDATE.
--
-- POURQUOI CE PREDICAT (et pas etat_admin = 'A' comme l'esquisse commentee de
-- migrations/2026-09-02_pros_etat_etablissements.sql) : le code filtre avec
-- (etat_admin IS NULL OR etat_admin <> 'F'), cf. FILTRE_OUVERTS dans
-- lib/queries/pros.ts et migrations/2026-09-02_sitemap_rpcs_ouverts.sql. Le
-- predicat de l'index doit etre EXACTEMENT celui des requetes pour que le
-- planificateur puisse s'en servir (index-only scan sur (city_id, category_id)).
--
-- Idempotent : IF NOT EXISTS. Duree estimee : quelques minutes sur 2,5 M de
-- lignes (l'index du 08/06 sur le meme couple de colonnes a pris ~30 s en
-- mode bloquant ; CONCURRENTLY fait deux passes, compter le double ou plus).
-- ============================================================================

CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pros_ouverts_city_cat
  ON pros (city_id, category_id)
  WHERE is_active = true AND deleted_at IS NULL AND (etat_admin IS NULL OR etat_admin <> 'F');

-- Verification apres creation (l'index doit etre valide, sinon le relancer
-- apres un DROP INDEX : un CONCURRENTLY interrompu laisse un index INVALID) :
--   SELECT indexrelid::regclass, indisvalid FROM pg_index
--   WHERE indexrelid = 'idx_pros_ouverts_city_cat'::regclass;

-- ============================================================================
-- Migration : Workwave AI Phase 7 — projects.city_id + phone nullable
-- ============================================================================
-- Necessaire pour les projets tech (vertical='tech') qui n'ont pas de ville
-- client (le brief est remote ou national) ni de telephone obligatoire.
--
-- Pas de risque pour Workwave BTP : le form /deposer-projet definit toujours
-- city_id et phone, donc les NOT NULL etaient redondants pour les rows BTP.
-- On retire juste la contrainte au niveau schema pour permettre l'insertion
-- de rows tech sans ces champs.
--
-- Run : Supabase Dashboard → SQL Editor → copy-paste + Run
-- ============================================================================

ALTER TABLE projects ALTER COLUMN city_id DROP NOT NULL;
ALTER TABLE projects ALTER COLUMN phone DROP NOT NULL;

-- Verification :
--   SELECT column_name, is_nullable FROM information_schema.columns
--   WHERE table_name='projects' AND column_name IN ('city_id', 'phone');
-- Attendu : is_nullable = YES sur les 2.

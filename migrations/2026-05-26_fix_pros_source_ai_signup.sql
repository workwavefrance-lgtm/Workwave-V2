-- Fix critique Phase 11 : autoriser source='ai_signup' dans pros
-- Date : 2026-05-26
--
-- Probleme : depuis Phase 8 (Workwave AI inscription), activate-signup.ts
-- inserait des rows pros avec source='ai_signup'. MAIS le CHECK constraint
-- en BDD n'autorisait QUE ('sirene', 'pagesjaunes', 'manual').
--
-- Consequence : TOUTES les inscriptions AI echouaient silencieusement avec
--   new row for relation "pros" violates check constraint "pros_source_check"
--
-- Le auth.users etait cree, le mail welcome envoye, l'ai_signups bien insere,
-- mais la row pros JAMAIS creee → le freelance ne peut pas se connecter
-- (signin-code.ts filtre par claimed_by_user_id IS NOT NULL sur pros tech).
--
-- Bug latent depuis Phase 8 (26/05/2026), decouvert via debug Ludivine +
-- contact.redhouseops@gmail.com qui n'arrivaient pas a se connecter.
--
-- Fix : etendre le constraint pour autoriser 'ai_signup'.

ALTER TABLE pros DROP CONSTRAINT IF EXISTS pros_source_check;

ALTER TABLE pros ADD CONSTRAINT pros_source_check
  CHECK (source IN ('sirene', 'pagesjaunes', 'manual', 'ai_signup'));

COMMENT ON CONSTRAINT pros_source_check ON pros IS
  'Whitelist des sources legitimes : sirene (scraping INSEE), pagesjaunes (scraping enrichissement), manual (admin), ai_signup (inscription via /ai/inscription Workwave AI).';

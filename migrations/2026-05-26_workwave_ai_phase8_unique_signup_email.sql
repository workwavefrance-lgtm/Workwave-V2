-- ============================================================================
-- Phase 8 fix #6 — UNIQUE constraint sur ai_signups.email
-- ============================================================================
-- Avant : 2 POST simultanes sur /ai/inscription avec le meme email creaient
-- 2 rows ai_signups, puis 2x activateAiSignup tentait createUser, et en
-- pratique on pouvait creer 2 fiches pros distinctes (race condition).
--
-- Cette contrainte garantit qu'a chaque email correspond AU PLUS 1 signup.
-- Si l'user re-soumet le form, Supabase retourne une erreur 23505 et le
-- Server Action peut soit (a) retourner l'erreur (l'user voit "email deja
-- inscrit"), soit (b) detecter et rediriger vers /ai/connexion.
--
-- Note : on n'utilise PAS LOWER(email) car le code applicatif fait deja
-- .trim().toLowerCase() avant insert. Si jamais une row ancienne n'a pas
-- ete lowercase-d, il faut soit un cleanup, soit un index sur LOWER(email).
--
-- A executer dans Supabase Dashboard SQL Editor.
-- ============================================================================

-- Cleanup eventuel : si des duplicates existent deja, on garde le plus
-- ancien (cas peu probable car la table est recente)
WITH ranked AS (
  SELECT id, email,
         ROW_NUMBER() OVER (PARTITION BY LOWER(email) ORDER BY created_at ASC) AS rn
  FROM ai_signups
)
DELETE FROM ai_signups WHERE id IN (
  SELECT id FROM ranked WHERE rn > 1
);

-- UNIQUE case-insensitive index (LOWER) pour matcher le code applicatif
CREATE UNIQUE INDEX IF NOT EXISTS ai_signups_email_unique_lower_idx
  ON ai_signups ((LOWER(email)));

COMMENT ON INDEX ai_signups_email_unique_lower_idx IS
  'Fix #6 race inscription duplicate. case-insensitive pour matcher le code applicatif qui lowercase l''email avant insert.';

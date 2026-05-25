-- ============================================================================
-- Migration : Workwave AI — table ai_signups
-- ============================================================================
-- Stocke les inscriptions freelance via /ai/inscription en attendant
-- l'activation complete (Phase 8 avec Supabase Auth + Stripe).
--
-- Workflow MVP :
--   1. User remplit /ai/inscription
--   2. Server Action submitInscription cree une row dans ai_signups
--      (status='pending')
--   3. Email admin + email welcome user
--   4. Phase 8 : admin valide manuellement et convertit en row 'pros'
--      avec auth user Supabase + Stripe customer
--
-- A executer dans Supabase Dashboard SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_signups (
  id SERIAL PRIMARY KEY,
  first_name TEXT NOT NULL,
  last_name TEXT NOT NULL,
  email TEXT NOT NULL,
  github_username TEXT,
  linkedin_url TEXT,
  category_slug TEXT NOT NULL,
  skills_raw TEXT,
  bio TEXT,
  tjm_indicatif INT,
  experience_years INT,
  availability TEXT CHECK (availability IN ('remote', 'hybrid', 'onsite') OR availability IS NULL),
  location TEXT,
  plan TEXT NOT NULL CHECK (plan IN ('free', 'premium')) DEFAULT 'free',
  status TEXT NOT NULL CHECK (status IN ('pending', 'validated', 'rejected')) DEFAULT 'pending',
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  admin_notified_at TIMESTAMPTZ,
  admin_notification_error TEXT,
  welcome_sent_at TIMESTAMPTZ,
  validated_at TIMESTAMPTZ,
  pro_id INT REFERENCES pros(id) -- set when converted to pro (Phase 8)
);

CREATE INDEX IF NOT EXISTS ai_signups_email_idx ON ai_signups(email);
CREATE INDEX IF NOT EXISTS ai_signups_status_idx ON ai_signups(status);

-- RLS : table interne admin only, anon n'a aucun acces
ALTER TABLE ai_signups ENABLE ROW LEVEL SECURITY;
-- (no policies = deny all for anon. service_role bypasse.)

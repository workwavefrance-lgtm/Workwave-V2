-- ============================================================================
-- SPRINT 13 — BTP PAY-PER-LEAD MODEL
-- ============================================================================
-- Date  : 2026-05-27
-- Auteur: Willy + Claude (Phase A)
-- ----------------------------------------------------------------------------
-- Contexte : on switch BTP du modele abonnement (39€/mois) au pay-per-lead
-- (9,90€ TTC par unlock). 0 abonne actuellement (5 trials gratuits) donc
-- aucune migration douloureuse.
--
-- Ce que cette migration fait :
--   1. Cree la table `lead_unlocks` qui trace chaque deblocage de lead par
--      un pro via paiement Stripe one-time.
--   2. Ajoute les colonnes `has_contact_in_description` + `cleaned_description`
--      sur `projects` pour gerer l'anti-PII bypass.
--
-- RLS strict sur lead_unlocks :
--   - Lecture par le pro proprietaire (claimed_by_user_id = auth.uid())
--   - Aucune ecriture cote anon/authenticated : seul service_role peut INSERT
--     via le webhook Stripe (idempotent par UNIQUE (project_id, pro_id))
-- ============================================================================

-- ─── Table lead_unlocks ───────────────────────────────────────────────────
CREATE TABLE IF NOT EXISTS lead_unlocks (
  id BIGSERIAL PRIMARY KEY,
  project_id INTEGER NOT NULL REFERENCES projects(id) ON DELETE CASCADE,
  pro_id INTEGER NOT NULL REFERENCES pros(id) ON DELETE CASCADE,
  stripe_payment_intent_id TEXT NOT NULL,
  stripe_checkout_session_id TEXT,
  amount_cents INTEGER NOT NULL,
  currency VARCHAR(3) NOT NULL DEFAULT 'eur',
  paid_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  -- 1 unlock par couple project x pro (idempotence webhook)
  CONSTRAINT lead_unlocks_unique_project_pro UNIQUE (project_id, pro_id)
);

CREATE INDEX IF NOT EXISTS idx_lead_unlocks_pro_id ON lead_unlocks(pro_id);
CREATE INDEX IF NOT EXISTS idx_lead_unlocks_project_id ON lead_unlocks(project_id);
CREATE INDEX IF NOT EXISTS idx_lead_unlocks_paid_at ON lead_unlocks(paid_at DESC);
CREATE INDEX IF NOT EXISTS idx_lead_unlocks_stripe_pi ON lead_unlocks(stripe_payment_intent_id);

-- ─── RLS sur lead_unlocks ─────────────────────────────────────────────────
ALTER TABLE lead_unlocks ENABLE ROW LEVEL SECURITY;

-- Le pro peut lire ses propres unlocks (via auth.uid() -> pros.claimed_by_user_id)
CREATE POLICY "lead_unlocks_select_own"
  ON lead_unlocks FOR SELECT
  TO authenticated
  USING (
    pro_id IN (
      SELECT id FROM pros WHERE claimed_by_user_id = auth.uid()
    )
  );

-- Pas de policy INSERT/UPDATE/DELETE pour anon/authenticated :
-- seul service_role peut ecrire (via webhook Stripe).
-- service_role bypasse RLS par defaut.

-- ─── Colonnes anti-PII sur projects ───────────────────────────────────────
-- has_contact_in_description : flag IA si tel/email detecte dans la description
-- cleaned_description : version masquee a afficher aux pros non-Premium / non-unlock
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS has_contact_in_description BOOLEAN NOT NULL DEFAULT FALSE,
  ADD COLUMN IF NOT EXISTS cleaned_description TEXT;

COMMENT ON COLUMN projects.has_contact_in_description IS
  'TRUE si le particulier a tente de mettre tel/email dans la description (anti-bypass paywall). Setter par lib/ai/detect-pii.ts au submit.';
COMMENT ON COLUMN projects.cleaned_description IS
  'Version PII-redacted de la description, affichee aux pros qui n''ont pas unlock le lead. NULL si pas de PII detectee.';

-- ─── Verifications post-migration ─────────────────────────────────────────
DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM information_schema.tables WHERE table_name = 'lead_unlocks') THEN
    RAISE EXCEPTION 'Migration failed: lead_unlocks table not created';
  END IF;
  IF NOT EXISTS (
    SELECT 1 FROM information_schema.columns
    WHERE table_name = 'projects' AND column_name = 'has_contact_in_description'
  ) THEN
    RAISE EXCEPTION 'Migration failed: projects.has_contact_in_description not added';
  END IF;
  RAISE NOTICE 'Migration 2026-05-27_btp_pay_per_lead OK';
END $$;

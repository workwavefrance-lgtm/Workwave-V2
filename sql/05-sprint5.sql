-- ============================================
-- Workwave V2 — Sprint 5 Phase 1 : Fondations
-- À exécuter dans l'éditeur SQL de Supabase
-- ============================================
--
-- IMPORTANT : faire un backup Supabase avant d'exécuter ce script.
-- Dashboard Supabase > Project Settings > Database > Backups
-- Ce script modifie la table pros (27 nouvelles colonnes, suppression de is_subscribed),
-- modifie la table projects, et crée 3 nouvelles tables.
-- En cas de problème, le backup permet de restaurer l'état précédent.
--
-- ============================================

BEGIN;

-- ============================================
-- 1. ALTER TABLE pros — ajout de colonnes
-- ============================================
-- Colonnes déjà existantes (NE PAS recréer) :
-- description, logo_url, website, photos, claimed_by_user_id, stripe_customer_id

-- Réclamation
ALTER TABLE pros ADD COLUMN claimed_at TIMESTAMPTZ;

-- Abonnement Stripe
ALTER TABLE pros ADD COLUMN stripe_subscription_id TEXT;
ALTER TABLE pros ADD COLUMN subscription_status TEXT NOT NULL DEFAULT 'none'
  CHECK (subscription_status IN ('none', 'trialing', 'active', 'past_due', 'canceled', 'free', 'suspended'));
ALTER TABLE pros ADD COLUMN subscription_plan TEXT
  CHECK (subscription_plan IN ('monthly', 'annual'));
ALTER TABLE pros ADD COLUMN trial_ends_at TIMESTAMPTZ;
ALTER TABLE pros ADD COLUMN current_period_end TIMESTAMPTZ;

-- Profil enrichi
ALTER TABLE pros ADD COLUMN founded_year INT;
ALTER TABLE pros ADD COLUMN instagram TEXT;
ALTER TABLE pros ADD COLUMN facebook TEXT;
ALTER TABLE pros ADD COLUMN linkedin TEXT;
ALTER TABLE pros ADD COLUMN opening_hours JSONB;
ALTER TABLE pros ADD COLUMN languages JSONB;
ALTER TABLE pros ADD COLUMN certifications JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE pros ADD COLUMN rge_number TEXT;
ALTER TABLE pros ADD COLUMN has_rc_pro BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pros ADD COLUMN has_decennale BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pros ADD COLUMN payment_methods JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE pros ADD COLUMN free_quote BOOLEAN NOT NULL DEFAULT true;

-- Services et catégories
ALTER TABLE pros ADD COLUMN secondary_category_ids INT[];
ALTER TABLE pros ADD COLUMN specialties JSONB NOT NULL DEFAULT '[]'::jsonb;
ALTER TABLE pros ADD COLUMN hourly_rate NUMERIC;
ALTER TABLE pros ADD COLUMN travel_fee NUMERIC;
ALTER TABLE pros ADD COLUMN min_budget NUMERIC;
ALTER TABLE pros ADD COLUMN urgency_available BOOLEAN NOT NULL DEFAULT false;

-- Préférences leads
ALTER TABLE pros ADD COLUMN intervention_radius_km INT NOT NULL DEFAULT 20;
ALTER TABLE pros ADD COLUMN enabled_category_ids INT[];
ALTER TABLE pros ADD COLUMN paused_until TIMESTAMPTZ;

-- Champs calculés (mis à jour côté application)
ALTER TABLE pros ADD COLUMN profile_completion INT NOT NULL DEFAULT 0;
ALTER TABLE pros ADD COLUMN response_rate NUMERIC;

-- ============================================
-- 2. Migration is_subscribed → subscription_status
-- ============================================

UPDATE pros SET subscription_status = 'active' WHERE is_subscribed = true;
ALTER TABLE pros DROP COLUMN is_subscribed;

-- ============================================
-- 3. FK sur claimed_by_user_id → auth.users
-- ============================================
-- La colonne existe déjà (UUID, nullable), mais sans contrainte FK.
-- Tous les valeurs sont NULL actuellement, la FK passera sans problème.

ALTER TABLE pros ADD CONSTRAINT fk_pros_claimed_by_user
  FOREIGN KEY (claimed_by_user_id) REFERENCES auth.users(id);

-- ============================================
-- 4. ALTER TABLE projects — extension status + nouvelles colonnes
-- ============================================

-- Supprimer l'ancien CHECK et recréer avec les nouveaux statuts
ALTER TABLE projects DROP CONSTRAINT projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN ('new', 'routed', 'unrouted', 'suspicious', 'closed', 'deleted'));

-- Nouvelles colonnes
ALTER TABLE projects ADD COLUMN suspicion_score INT;
ALTER TABLE projects ADD COLUMN deletion_token TEXT UNIQUE;

-- ============================================
-- 5. CREATE TABLE project_leads
-- ============================================
-- project_id est INTEGER car projects.id est SERIAL (integer)
-- pro_id est BIGINT car pros.id est BIGINT GENERATED ALWAYS AS IDENTITY

CREATE TABLE project_leads (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  project_id      INTEGER     NOT NULL REFERENCES projects(id),
  pro_id          BIGINT      NOT NULL REFERENCES pros(id),
  sent_at         TIMESTAMPTZ NOT NULL DEFAULT now(),
  opened_at       TIMESTAMPTZ,
  contacted_at    TIMESTAMPTZ,
  not_relevant    BOOLEAN     NOT NULL DEFAULT false,
  status          TEXT        NOT NULL DEFAULT 'sent'
                  CHECK (status IN ('sent', 'opened', 'contacted', 'not_relevant', 'expired'))
);

-- ============================================
-- 6. CREATE TABLE claim_attempts
-- ============================================

CREATE TABLE claim_attempts (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  siret           TEXT        NOT NULL,
  email           TEXT        NOT NULL,
  ip              TEXT,
  success         BOOLEAN     NOT NULL DEFAULT false,
  error_reason    TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 7. CREATE TABLE cancellation_feedback
-- ============================================

CREATE TABLE cancellation_feedback (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  pro_id          BIGINT      NOT NULL REFERENCES pros(id),
  reason          TEXT        NOT NULL
                  CHECK (reason IN ('too_expensive', 'not_enough_leads', 'lead_quality', 'other')),
  feedback        TEXT,
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- ============================================
-- 8. Row Level Security
-- ============================================

-- Nouvelles tables
ALTER TABLE project_leads ENABLE ROW LEVEL SECURITY;
ALTER TABLE claim_attempts ENABLE ROW LEVEL SECURITY;
ALTER TABLE cancellation_feedback ENABLE ROW LEVEL SECURITY;

-- project_leads : le pro peut lire ses propres leads
CREATE POLICY "project_leads_pro_select" ON project_leads
  FOR SELECT USING (
    pro_id IN (SELECT id FROM pros WHERE claimed_by_user_id = auth.uid())
  );

-- project_leads : le pro peut modifier ses propres leads (marquer comme contacté, etc.)
CREATE POLICY "project_leads_pro_update" ON project_leads
  FOR UPDATE USING (
    pro_id IN (SELECT id FROM pros WHERE claimed_by_user_id = auth.uid())
  );

-- claim_attempts : aucun accès public (service_role uniquement)
-- Pas de policy = accès bloqué pour anon et authenticated, service_role bypass RLS

-- cancellation_feedback : le pro peut insérer son propre feedback
CREATE POLICY "cancellation_feedback_pro_insert" ON cancellation_feedback
  FOR INSERT WITH CHECK (
    pro_id IN (SELECT id FROM pros WHERE claimed_by_user_id = auth.uid())
  );

-- pros : le pro peut modifier sa propre fiche (après réclamation)
CREATE POLICY "pros_owner_update" ON pros
  FOR UPDATE USING (
    claimed_by_user_id = auth.uid()
  );

-- ============================================
-- 9. Index de performance
-- ============================================

-- project_leads (requêtes dashboard et routing)
CREATE INDEX idx_project_leads_pro_id ON project_leads(pro_id);
CREATE INDEX idx_project_leads_project_id ON project_leads(project_id);
CREATE INDEX idx_project_leads_status ON project_leads(status);
CREATE INDEX idx_project_leads_sent_at ON project_leads(sent_at DESC);

-- pros (routing, filtrage abonnement, réclamation)
CREATE INDEX idx_pros_subscription_status ON pros(subscription_status);
CREATE INDEX idx_pros_claimed_by_user ON pros(claimed_by_user_id);
CREATE INDEX idx_pros_paused_until ON pros(paused_until);

-- claim_attempts (rate limiting par email et IP)
CREATE INDEX idx_claim_attempts_email ON claim_attempts(email);
CREATE INDEX idx_claim_attempts_created_at ON claim_attempts(created_at DESC);

-- projects (suppression RGPD par token)
CREATE INDEX idx_projects_deletion_token ON projects(deletion_token)
  WHERE deletion_token IS NOT NULL;

COMMIT;

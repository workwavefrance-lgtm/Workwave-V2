-- ============================================================================
-- Migration Phase 8 Workwave AI : table ai_signin_attempts
-- ============================================================================
-- Stocke les tentatives de connexion freelance via /ai/connexion :
--   1. User entre email -> on genere code 6 chiffres + temp_password
--   2. Hash du code stocke ici (jamais le code en clair)
--   3. Email avec code envoye au freelance
--   4. User entre code sur /ai/connexion/verifier
--   5. Si code OK, signInWithPassword(email, temp_password) -> session
--   6. temp_password nullify immediatement apres usage
--
-- Pattern strictement identique a claim_attempts (BTP). Voir
-- app/(public)/pro/reclamer/[slug]/actions.ts pour reference.
--
-- A executer dans Supabase Dashboard SQL Editor.
-- ============================================================================

CREATE TABLE IF NOT EXISTS ai_signin_attempts (
  id SERIAL PRIMARY KEY,
  email TEXT NOT NULL,
  verification_code_hash TEXT,
  temp_password TEXT,  -- nullify apres usage, jamais expose
  expires_at TIMESTAMPTZ NOT NULL,
  attempts INT NOT NULL DEFAULT 0,
  status TEXT NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'verified', 'expired', 'blocked')),
  ip TEXT,
  user_agent TEXT,
  success BOOLEAN DEFAULT FALSE,
  error_reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Index pour requete rapide lors verify code
CREATE INDEX IF NOT EXISTS ai_signin_attempts_email_status_idx
  ON ai_signin_attempts(email, status)
  WHERE status = 'pending';

-- Index pour purge attempts expirees
CREATE INDEX IF NOT EXISTS ai_signin_attempts_expires_at_idx
  ON ai_signin_attempts(expires_at)
  WHERE status = 'pending';

-- Index pour rate limiting par IP (max 3 attempts / 15 min / IP)
CREATE INDEX IF NOT EXISTS ai_signin_attempts_ip_created_idx
  ON ai_signin_attempts(ip, created_at);

-- ============================================================================
-- RLS strict : table interne admin only, anon n'a aucun acces
-- service_role bypass automatique
-- ============================================================================
ALTER TABLE ai_signin_attempts ENABLE ROW LEVEL SECURITY;
-- (no policies = deny all for anon/authenticated)

COMMENT ON TABLE ai_signin_attempts IS
  'Tentatives connexion Workwave AI via /ai/connexion. Pattern identique a claim_attempts (BTP). temp_password nullify apres usage, jamais expose au client.';

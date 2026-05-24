-- ============================================================================
-- Migration : Désinscription des sollicitations d'avis
-- ============================================================================
-- Permet aux particuliers de se désinscrire des emails de demande d'avis
-- (RGPD-safe + bonne UX + meilleur taux de delivery Resend).
--
-- Table simple : email comme PK, timestamp. Si un email est present →
-- le cron skip l'envoi.
--
-- Pas de table user_id ou particulier_id : on travaille uniquement avec
-- l'email parce que les particuliers n'ont pas de compte chez Workwave
-- (pas d'authentification cote particulier).
-- ============================================================================

CREATE TABLE IF NOT EXISTS review_unsubscribes (
  email           text PRIMARY KEY,
  unsubscribed_at timestamptz NOT NULL DEFAULT NOW(),
  source          text DEFAULT 'email_link'
    CHECK (source IN ('email_link', 'manual_admin', 'rgpd_request'))
);

-- Index pour le check rapide cron
CREATE INDEX IF NOT EXISTS idx_review_unsubscribes_email
  ON review_unsubscribes (email);

-- ----------------------------------------------------------------------------
-- RLS — lecture publique non, l'unsub passe par service_role + token HMAC
-- ----------------------------------------------------------------------------
ALTER TABLE review_unsubscribes ENABLE ROW LEVEL SECURITY;
-- Aucune policy → deny implicite pour anon/authenticated. Le code passe
-- exclusivement par service_role.

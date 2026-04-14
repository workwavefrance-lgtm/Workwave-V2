-- ============================================
-- Migration 06 : Systeme d'emailing cold mail
-- A executer dans Supabase SQL Editor
-- ============================================

BEGIN;

-- 1. Nouvelles colonnes sur pros
ALTER TABLE pros ADD COLUMN IF NOT EXISTS do_not_contact BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS email_bounced BOOLEAN NOT NULL DEFAULT false;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS first_email_sent_at TIMESTAMPTZ;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS prenom_dirigeant TEXT;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS nom_dirigeant TEXT;

CREATE INDEX IF NOT EXISTS idx_pros_cold_email_eligible
  ON pros (email, do_not_contact, email_bounced, claimed_by_user_id, is_active, deleted_at)
  WHERE email IS NOT NULL
    AND do_not_contact = false
    AND email_bounced = false
    AND claimed_by_user_id IS NULL
    AND is_active = true
    AND deleted_at IS NULL;

-- 2. Table campagnes
CREATE TABLE email_campaigns (
  id              BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  name            TEXT        NOT NULL,
  description     TEXT,
  status          TEXT        NOT NULL DEFAULT 'draft'
                  CHECK (status IN ('draft', 'active', 'paused', 'completed')),
  total_steps     INT         NOT NULL DEFAULT 3,
  daily_limit     INT         NOT NULL DEFAULT 200,
  subject_variant TEXT        NOT NULL DEFAULT 'b'
                  CHECK (subject_variant IN ('a', 'b', 'c', 'd', 'e')),
  created_at      TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at      TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 3. Table sequences (1 par pro par campagne)
CREATE TABLE email_sequences (
  id           BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  campaign_id  BIGINT      NOT NULL REFERENCES email_campaigns(id),
  pro_id       BIGINT      NOT NULL REFERENCES pros(id),
  current_step INT         NOT NULL DEFAULT 0,
  status       TEXT        NOT NULL DEFAULT 'pending'
               CHECK (status IN ('pending', 'active', 'paused', 'completed', 'unsubscribed', 'bounced', 'error')),
  next_send_at TIMESTAMPTZ,
  last_sent_at TIMESTAMPTZ,
  created_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  updated_at   TIMESTAMPTZ NOT NULL DEFAULT now(),
  UNIQUE(campaign_id, pro_id)
);

CREATE INDEX idx_email_sequences_next_send ON email_sequences (next_send_at, status)
  WHERE status = 'active';
CREATE INDEX idx_email_sequences_campaign ON email_sequences (campaign_id);
CREATE INDEX idx_email_sequences_pro ON email_sequences (pro_id);

-- 4. Table logs (1 par email envoye)
CREATE TABLE email_logs (
  id                BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  sequence_id       BIGINT      NOT NULL REFERENCES email_sequences(id),
  pro_id            BIGINT      NOT NULL REFERENCES pros(id),
  campaign_id       BIGINT      NOT NULL REFERENCES email_campaigns(id),
  step              INT         NOT NULL,
  brevo_message_id  TEXT,
  subject           TEXT,
  recipient_email   TEXT,
  status            TEXT        NOT NULL DEFAULT 'sent'
                    CHECK (status IN ('sent', 'delivered', 'opened', 'clicked', 'bounced', 'complained', 'failed')),
  error_message     TEXT,
  sent_at           TIMESTAMPTZ NOT NULL DEFAULT now(),
  delivered_at      TIMESTAMPTZ,
  opened_at         TIMESTAMPTZ,
  clicked_at        TIMESTAMPTZ,
  bounced_at        TIMESTAMPTZ,
  retry_count       INT         NOT NULL DEFAULT 0,
  created_at        TIMESTAMPTZ NOT NULL DEFAULT now()
);

CREATE INDEX idx_email_logs_sequence ON email_logs (sequence_id);
CREATE INDEX idx_email_logs_pro ON email_logs (pro_id);
CREATE INDEX idx_email_logs_brevo_msg ON email_logs (brevo_message_id);
CREATE INDEX idx_email_logs_sent_at ON email_logs (sent_at DESC);

-- 5. Blacklist globale (RGPD : ne jamais recontacter)
CREATE TABLE email_blacklist (
  id         BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
  email      TEXT        NOT NULL UNIQUE,
  reason     TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- 6. RLS (service role only, pas d'acces public)
ALTER TABLE email_campaigns ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_sequences ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_logs ENABLE ROW LEVEL SECURITY;
ALTER TABLE email_blacklist ENABLE ROW LEVEL SECURITY;

-- 7. Triggers updated_at (reutilise update_updated_at() de 01-schema.sql)
CREATE TRIGGER set_updated_at_email_campaigns
  BEFORE UPDATE ON email_campaigns
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

CREATE TRIGGER set_updated_at_email_sequences
  BEFORE UPDATE ON email_sequences
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

COMMIT;

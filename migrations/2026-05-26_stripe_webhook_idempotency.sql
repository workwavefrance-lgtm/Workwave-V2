-- Migration : table stripe_webhook_events pour idempotence
-- Date : 2026-05-26
--
-- Probleme : Stripe peut retry un webhook event jusqu'a 24h en cas de
-- 5xx response ou timeout. Sans dedup, le meme event.id est traite N fois :
-- - double update du subscription_status
-- - double email "paiement echec" envoye au pro
-- - double track() dans analytics
-- - double processing checkout.session.completed = double trial activation
--
-- Solution : INSERT du event.id en debut de handler. Si conflit (deja vu),
-- retourne 200 OK sans processing. Sinon, traite normalement.
--
-- Stripe garantit que chaque event a un id unique. La cle primaire sur
-- stripe_event_id assure l'idempotence atomique au niveau Postgres.

CREATE TABLE IF NOT EXISTS stripe_webhook_events (
  -- ID du Stripe event (evt_XXXXX), garanti unique par Stripe
  stripe_event_id text PRIMARY KEY,

  -- Type d'event ("checkout.session.completed", "invoice.payment_failed", etc.)
  event_type text NOT NULL,

  -- API version Stripe au moment de l'event (utile pour debug breaking changes)
  api_version text,

  -- Timestamp Stripe d'origine (peut etre dans le passe si retry)
  event_created_at timestamptz,

  -- Timestamp local de premiere reception (= heure de cette insertion)
  received_at timestamptz NOT NULL DEFAULT NOW(),

  -- Heure de fin de processing (NULL tant que pas traite, set si handler OK)
  processed_at timestamptz,

  -- Erreur eventuelle si le handler a fail (pour debug + alerte admin)
  processing_error text,

  -- Pro_id concerne si extractible (metadata.pro_id Stripe Checkout), null sinon
  pro_id integer
);

-- Index sur received_at pour purger les anciennes lignes
-- (recommande : delete WHERE received_at < NOW() - INTERVAL '90 days' via cron)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_received
  ON stripe_webhook_events (received_at DESC);

-- Index sur event_type + processed_at IS NULL pour monitoring (events en erreur)
CREATE INDEX IF NOT EXISTS idx_stripe_webhook_events_failed
  ON stripe_webhook_events (event_type, processed_at)
  WHERE processed_at IS NULL;

-- RLS : seul service_role peut acceder (audit interne, pas expose au frontend)
ALTER TABLE stripe_webhook_events ENABLE ROW LEVEL SECURITY;

-- Pas de policies pour anon/authenticated = deny total. service_role bypass RLS
-- nativement, donc le webhook route fonctionne.

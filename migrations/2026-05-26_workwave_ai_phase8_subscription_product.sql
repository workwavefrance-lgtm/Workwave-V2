-- ============================================================================
-- Migration Phase 8 Workwave AI : distinguer abonnement BTP vs AI
-- ============================================================================
-- Workwave AI Premium (29,90€/mois) vs Workwave BTP Pro (39€/mois). Un pro
-- a 1 seul abonnement actif a la fois, donc on ajoute juste une colonne
-- pour distinguer le PRODUIT Stripe sous-jacent (les Prices sont different
-- entre BTP et AI).
--
-- Avant Phase 8 : tous les abonnements sont BTP par defaut.
-- Apres Phase 8 : on classifie chaque souscription via subscription_product.
--
-- A executer dans Supabase Dashboard SQL Editor.
-- ============================================================================

-- Colonne nullable, check contraint sur les valeurs autorisees
ALTER TABLE pros
  ADD COLUMN IF NOT EXISTS subscription_product TEXT
    CHECK (subscription_product IS NULL OR subscription_product IN ('btp', 'ai'));

-- Index pour requetes filter rapides (admin dashboard, billing reports)
CREATE INDEX IF NOT EXISTS pros_subscription_product_idx
  ON pros(subscription_product)
  WHERE subscription_product IS NOT NULL;

-- Backfill : pros existants ayant un abonnement actif sont marques 'btp'
-- (parce que jusqu'a maintenant seul BTP avait une integration Stripe live).
UPDATE pros
  SET subscription_product = 'btp'
  WHERE subscription_product IS NULL
    AND stripe_customer_id IS NOT NULL
    AND subscription_status IN ('trialing', 'active', 'past_due', 'canceled');

-- ============================================================================
-- RLS : on garde le pattern actuel (service_role bypass, anon read-only
-- via les vues publiques). Pas de change sur les policies.
-- ============================================================================
COMMENT ON COLUMN pros.subscription_product IS
  'Type de produit Stripe : btp (Workwave BTP Pro 39€/mois) | ai (Workwave AI Premium 29,90€/mois). NULL si pas d''abonnement actif.';

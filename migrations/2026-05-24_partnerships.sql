-- ============================================================================
-- Migration : Demarchage partenariats locaux (mairies, offices de tourisme,
-- notaires, agences immo, CCI, Chambres des Metiers, syndics, associations)
-- ============================================================================
-- Objectif : suivi du demarchage manuel pour acquerir des partenariats
-- backlinks + recommandations locales. Pas de blast : l'user envoie 5-20
-- mails par jour depuis /admin/partnerships en personnalisant chaque
-- envoi.
--
-- Donnees seeds via :
--   - data.gouv.fr (API publique annuaire-administration) pour mairies
--     et offices de tourisme
--   - Liste en dur pour CCI + Chambres des Metiers (12 + 12)
--   - Saisie manuelle via UI pour notaires, syndics, agences immo,
--     associations
-- ============================================================================

CREATE TABLE IF NOT EXISTS partnerships (
  id            bigserial PRIMARY KEY,

  -- Type de partenariat (defini la template email + le pitch)
  type text NOT NULL CHECK (type IN (
    'mairie',
    'office_tourisme',
    'notaire',
    'agence_immo',
    'syndic',
    'cci',
    'chambre_metiers',
    'association_quartier',
    'autre'
  )),

  -- Identite
  name              text NOT NULL,                    -- "Mairie de Poitiers"
  organization      text,                              -- "Ville de Poitiers" si different de name
  contact_first_name text,                             -- "Madame le Maire"
  contact_last_name  text,
  contact_role       text,                             -- "Maire", "Directeur"
  contact_email      text NOT NULL,
  contact_phone      text,
  website            text,

  -- Localisation
  postal_code text,
  city        text,
  department_code text,                                -- "86", "16", "17", etc.

  -- Workflow demarchage
  status text NOT NULL DEFAULT 'to_contact'
    CHECK (status IN (
      'to_contact',       -- non-contacte, dans la liste
      'contacted',        -- email envoye, en attente
      'follow_up_due',    -- relance prevue (J+7 sans reponse)
      'responded',        -- a repondu (intéresse ou non)
      'partnership',      -- partenariat actif (lien posé, backlink, etc.)
      'declined',         -- refus explicite ou ghosted final
      'invalid'           -- email invalide / bounce
    )),

  -- Tracking
  first_contacted_at timestamptz,
  last_contacted_at  timestamptz,
  responded_at       timestamptz,
  partnership_active_since timestamptz,
  emails_sent_count  integer NOT NULL DEFAULT 0,

  -- Notes libres (pour l'user, ex. "M. Dupont a répondu favorablement,
  -- doit valider avec le DGS")
  notes text,
  response_summary text,

  -- Backlink obtenu (si partenariat actif)
  backlink_url text,
  backlink_observed_at timestamptz,

  created_at timestamptz NOT NULL DEFAULT NOW(),
  updated_at timestamptz NOT NULL DEFAULT NOW()
);

-- Indexes
CREATE INDEX IF NOT EXISTS idx_partnerships_status_type
  ON partnerships (status, type);

CREATE INDEX IF NOT EXISTS idx_partnerships_dept
  ON partnerships (department_code) WHERE department_code IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_partnerships_followup
  ON partnerships (last_contacted_at)
  WHERE status = 'contacted' AND last_contacted_at IS NOT NULL;

-- Unicite : meme email = meme partnership (anti-doublon insertion)
CREATE UNIQUE INDEX IF NOT EXISTS idx_partnerships_email_unique
  ON partnerships (LOWER(contact_email));

-- ----------------------------------------------------------------------------
-- Trigger updated_at
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION trg_partnerships_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS partnerships_updated_at ON partnerships;
CREATE TRIGGER partnerships_updated_at
  BEFORE UPDATE ON partnerships
  FOR EACH ROW EXECUTE FUNCTION trg_partnerships_updated_at();

-- ----------------------------------------------------------------------------
-- RLS strict : service_role uniquement (admin/cron). Aucun acces public.
-- ----------------------------------------------------------------------------
ALTER TABLE partnerships ENABLE ROW LEVEL SECURITY;
-- Pas de policy → deny implicite pour anon/authenticated.

-- ----------------------------------------------------------------------------
-- Vue stats agregees pour le dashboard admin
-- ----------------------------------------------------------------------------
CREATE OR REPLACE VIEW partnerships_stats AS
SELECT
  type,
  COUNT(*)                                                   AS total,
  COUNT(*) FILTER (WHERE status = 'to_contact')             AS to_contact,
  COUNT(*) FILTER (WHERE status = 'contacted')              AS contacted,
  COUNT(*) FILTER (WHERE status = 'responded')              AS responded,
  COUNT(*) FILTER (WHERE status = 'partnership')            AS partnership,
  COUNT(*) FILTER (WHERE status = 'declined')               AS declined
FROM partnerships
GROUP BY type;

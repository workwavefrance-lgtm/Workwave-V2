-- ============================================================================
-- Migration : Système d'avis natifs Workwave
-- ============================================================================
-- Crée la table pro_reviews pour les avis laissés par les particuliers
-- après prestation, sollicités automatiquement par cron J+7 après dépôt
-- projet. Différencie les avis Workwave (natifs) des avis Google (importés
-- via Apify/Places sur pros.google_rating + pros.google_reviews_count).
--
-- Stratégie :
--   - Avis token-based : pas de compte requis, lien unique dans l'email
--   - Modération : status pending par défaut, alerte admin si < 3 étoiles
--   - Agrégat dénormalisé sur pros (workwave_reviews_avg + count) pour
--     éviter de recalculer à chaque rendu de liste (227k pros).
--   - Trigger qui recalcule l'agrégat à chaque INSERT/UPDATE/DELETE
--     publié, pour rester cohérent sans cron de refresh.
-- ============================================================================

-- ----------------------------------------------------------------------------
-- 1. Table principale pro_reviews
-- ----------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS pro_reviews (
  id              bigserial PRIMARY KEY,
  pro_id          bigint NOT NULL REFERENCES pros(id) ON DELETE CASCADE,
  -- project_id : lien optionnel vers le projet d'origine. Quand l'avis est
  -- sollicité automatiquement, on stocke la trace pour 'verified=true'.
  -- Nullable pour permettre des avis ajoutés manuellement (rare) ou
  -- importés (futur).
  project_id      bigint REFERENCES projects(id) ON DELETE SET NULL,

  -- Identité du particulier (jamais affichée intégralement publiquement)
  particulier_email text NOT NULL,
  particulier_name  text NOT NULL,

  -- Notation
  rating int NOT NULL CHECK (rating >= 1 AND rating <= 5),
  comment text,

  -- Token unique pour la page de soumission /avis/[token]
  token text NOT NULL UNIQUE,

  -- Statut modération
  status text NOT NULL DEFAULT 'pending'
    CHECK (status IN ('pending', 'published', 'rejected', 'expired')),

  -- Marqueur "vérifié" : true si l'avis provient d'un vrai projet routé
  -- via Workwave (donc qu'on a la preuve qu'il y a eu mise en relation).
  verified boolean NOT NULL DEFAULT false,

  -- Timestamps
  requested_at  timestamptz NOT NULL DEFAULT NOW(),
  submitted_at  timestamptz,
  published_at  timestamptz,
  created_at    timestamptz NOT NULL DEFAULT NOW(),
  updated_at    timestamptz NOT NULL DEFAULT NOW()
);

-- ----------------------------------------------------------------------------
-- 2. Indexes
-- ----------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_pro_reviews_pro_id_status
  ON pro_reviews (pro_id, status) WHERE status = 'published';

CREATE INDEX IF NOT EXISTS idx_pro_reviews_token
  ON pro_reviews (token);

CREATE INDEX IF NOT EXISTS idx_pro_reviews_project_id
  ON pro_reviews (project_id) WHERE project_id IS NOT NULL;

CREATE INDEX IF NOT EXISTS idx_pro_reviews_status_pending
  ON pro_reviews (created_at DESC) WHERE status = 'pending';

-- ----------------------------------------------------------------------------
-- 3. Colonnes denormalisees sur pros pour l'aggregat (lecture rapide)
-- ----------------------------------------------------------------------------
ALTER TABLE pros
  ADD COLUMN IF NOT EXISTS workwave_reviews_avg numeric(2, 1),
  ADD COLUMN IF NOT EXISTS workwave_reviews_count integer NOT NULL DEFAULT 0;

-- ----------------------------------------------------------------------------
-- 4. Fonction trigger : recalcule l'aggregat a chaque changement publie
-- ----------------------------------------------------------------------------
CREATE OR REPLACE FUNCTION recompute_pro_reviews_stats(target_pro_id bigint)
RETURNS void AS $$
DECLARE
  v_avg numeric(2,1);
  v_count integer;
BEGIN
  SELECT
    ROUND(AVG(rating)::numeric, 1),
    COUNT(*)::integer
  INTO v_avg, v_count
  FROM pro_reviews
  WHERE pro_id = target_pro_id AND status = 'published';

  UPDATE pros
  SET
    workwave_reviews_avg = v_avg,
    workwave_reviews_count = COALESCE(v_count, 0)
  WHERE id = target_pro_id;
END;
$$ LANGUAGE plpgsql;

-- Trigger qui appelle recompute apres tout changement
CREATE OR REPLACE FUNCTION trg_pro_reviews_recompute()
RETURNS trigger AS $$
BEGIN
  -- INSERT : on recompute sur le NEW.pro_id
  IF (TG_OP = 'INSERT') THEN
    IF NEW.status = 'published' THEN
      PERFORM recompute_pro_reviews_stats(NEW.pro_id);
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE : on recompute sur l'OLD.pro_id
  IF (TG_OP = 'DELETE') THEN
    IF OLD.status = 'published' THEN
      PERFORM recompute_pro_reviews_stats(OLD.pro_id);
    END IF;
    RETURN OLD;
  END IF;

  -- UPDATE : on recompute sur OLD et NEW (au cas ou le pro_id ait
  -- change, ou le status soit passe entre publie/non-publie)
  IF (TG_OP = 'UPDATE') THEN
    IF OLD.status = 'published' OR NEW.status = 'published' THEN
      PERFORM recompute_pro_reviews_stats(NEW.pro_id);
      IF OLD.pro_id IS DISTINCT FROM NEW.pro_id THEN
        PERFORM recompute_pro_reviews_stats(OLD.pro_id);
      END IF;
    END IF;
    NEW.updated_at = NOW();
    RETURN NEW;
  END IF;

  RETURN NULL;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS pro_reviews_recompute ON pro_reviews;
CREATE TRIGGER pro_reviews_recompute
  AFTER INSERT OR UPDATE OR DELETE ON pro_reviews
  FOR EACH ROW EXECUTE FUNCTION trg_pro_reviews_recompute();

-- ----------------------------------------------------------------------------
-- 5. RLS — Row Level Security (lecon CLAUDE.md du 22/05/2026)
-- ----------------------------------------------------------------------------
ALTER TABLE pro_reviews ENABLE ROW LEVEL SECURITY;

-- Lecture publique des avis publies (pour les afficher sur les fiches +
-- agreger sur les listings)
DROP POLICY IF EXISTS pro_reviews_select_published ON pro_reviews;
CREATE POLICY pro_reviews_select_published
  ON pro_reviews FOR SELECT
  USING (status = 'published');

-- L'insertion / mise a jour / suppression passe TOUJOURS par le
-- service_role (Server Actions cote serveur). Pas de policy pour
-- anon/authenticated → deny implicite.

-- ----------------------------------------------------------------------------
-- 6. Trace de la sollicitation cote projects (anti-doublon cron)
-- ----------------------------------------------------------------------------
-- review_requested_at : timestamp de la derniere sollicitation auto-cron
--   envoyee au particulier pour ce projet. Permet d'eviter de spammer si
--   le cron tourne plusieurs fois.
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS review_requested_at timestamptz;

-- Index partiel pour le cron qui cherche les projets a solliciter
CREATE INDEX IF NOT EXISTS idx_projects_review_not_requested
  ON projects (created_at DESC)
  WHERE review_requested_at IS NULL;

-- ----------------------------------------------------------------------------
-- DONE
-- ----------------------------------------------------------------------------
-- Apres execution dans Supabase SQL Editor :
--   - Verifier table pro_reviews creee : SELECT * FROM pro_reviews LIMIT 1;
--   - Verifier colonnes pros : SELECT workwave_reviews_avg, workwave_reviews_count FROM pros LIMIT 1;
--   - Verifier trigger : INSERT test + DELETE test, voir si pros.workwave_reviews_count bouge

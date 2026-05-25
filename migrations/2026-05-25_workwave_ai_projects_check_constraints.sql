-- ============================================================================
-- Migration : Workwave AI — etendre les CHECK constraints de projects
-- ============================================================================
-- Le table projects a 3 CHECK constraints heritees de Workwave BTP qui
-- ne reconnaissent pas les valeurs tech. Quand /ai/deposer submit, les
-- inserts plantent silencieusement (Server Action redirect echoue car
-- le insert throw violation 23514).
--
-- Erreur reproduite cote user 25/05/2026 :
--   "j'ai pas de page merci votre projet a ete transmis"
--
-- 3 CHECK a etendre :
--   - projects_budget_check  : ajout 'lt5k', '5k-15k', '15k-50k', 'gt50k', 'tbd'
--   - projects_urgency_check : ajout 'asap', '1month', '3months', 'flexible'
--   - projects_status_check  : ajout 'unrouted', 'suspicious'
--
-- Aucun risque pour le BTP : les valeurs BTP sont preservees.
--
-- Run : Supabase Dashboard → SQL Editor → copy-paste + Run
-- ============================================================================

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_budget_check;
ALTER TABLE projects ADD CONSTRAINT projects_budget_check
  CHECK (budget IN (
    -- BTP existant
    'lt500', '500_2000', '2000_5000', '5000_15000', 'gt15000', 'unknown',
    -- Workwave AI tech
    'lt5k', '5k-15k', '15k-50k', 'gt50k', 'tbd'
  ));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_urgency_check;
ALTER TABLE projects ADD CONSTRAINT projects_urgency_check
  CHECK (urgency IN (
    -- BTP existant
    'today', 'this_week', 'this_month', 'not_urgent',
    -- Workwave AI tech (timeline form deposer)
    'asap', '1month', '3months', 'flexible'
  ));

ALTER TABLE projects DROP CONSTRAINT IF EXISTS projects_status_check;
ALTER TABLE projects ADD CONSTRAINT projects_status_check
  CHECK (status IN (
    -- BTP existant
    'new', 'routed', 'closed',
    -- Workwave AI ajout
    'unrouted', 'suspicious'
  ));

-- Verification post-migration :
--   SELECT conname, pg_get_constraintdef(oid)
--   FROM pg_constraint
--   WHERE conname IN ('projects_budget_check', 'projects_urgency_check', 'projects_status_check');
-- Attendu : 3 lignes, chacune avec les valeurs tech en + des BTP.

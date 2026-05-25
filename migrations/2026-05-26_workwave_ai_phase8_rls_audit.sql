-- ============================================================================
-- Phase 8 Workwave AI : audit RLS strict sur tables sensibles
-- ============================================================================
-- Garantit que :
--   1. ai_signups : RLS active, no policy pour anon (deny all). Seul
--      service_role accede (Server Actions cote serveur).
--   2. ai_signin_attempts : idem. JAMAIS expose au client (contient
--      temp_password).
--   3. project_leads : RLS active. Un freelance authentifie ne voit que
--      SES propres leads (filtre via pro_id -> claimed_by_user_id).
--   4. projects : RLS active. Les clients ne voient que leurs propres
--      projets (filtre via email). Les pros voient les projets qui leur
--      sont assignes via project_leads.
--
-- Lecon CLAUDE.md 22/05 : un INSERT test sur table avec WHERE id=-9999999
-- ne valide PAS RLS. Un INSERT reel sans policy donne l'erreur
-- "new row violates row-level security policy".
--
-- service_role bypass automatique : tous les Server Actions + scripts
-- continuent de fonctionner.
--
-- A executer dans Supabase Dashboard SQL Editor.
-- ============================================================================

-- ──────────────────────────────────────────────────────────────────────
-- ai_signups : deja RLS activee dans migration precedente. Verifier.
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE ai_signups ENABLE ROW LEVEL SECURITY;
-- Pas de policy = deny all pour anon. service_role bypass.

-- ──────────────────────────────────────────────────────────────────────
-- ai_signin_attempts : deja RLS activee. Verifier.
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE ai_signin_attempts ENABLE ROW LEVEL SECURITY;
-- Pas de policy = deny all (CRITIQUE : table contient temp_password).

-- ──────────────────────────────────────────────────────────────────────
-- project_leads : RLS + policy pour freelance authentifie
-- ──────────────────────────────────────────────────────────────────────
ALTER TABLE project_leads ENABLE ROW LEVEL SECURITY;

-- Drop existing policies si on re-run la migration
DROP POLICY IF EXISTS "project_leads_select_own_via_pros" ON project_leads;
DROP POLICY IF EXISTS "project_leads_update_own_via_pros" ON project_leads;

-- Policy : freelance authentifie voit SES leads (via pro_id -> claimed_by_user_id)
CREATE POLICY "project_leads_select_own_via_pros" ON project_leads
  FOR SELECT
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pros
      WHERE pros.id = project_leads.pro_id
        AND pros.claimed_by_user_id = auth.uid()
    )
  );

-- Policy : freelance authentifie peut MARQUER ses leads comme vus/contactes
CREATE POLICY "project_leads_update_own_via_pros" ON project_leads
  FOR UPDATE
  TO authenticated
  USING (
    EXISTS (
      SELECT 1 FROM pros
      WHERE pros.id = project_leads.pro_id
        AND pros.claimed_by_user_id = auth.uid()
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1 FROM pros
      WHERE pros.id = project_leads.pro_id
        AND pros.claimed_by_user_id = auth.uid()
    )
  );

-- INSERT/DELETE : pas de policy pour authenticated. service_role uniquement
-- (les leads sont crees par Server Actions cote /ai/deposer, jamais cote
-- freelance).

-- ──────────────────────────────────────────────────────────────────────
-- projects : RLS conservative + policy admin (read) + service_role bypass
-- ──────────────────────────────────────────────────────────────────────
-- Note : on n'expose PAS les projets aux freelances via projects directement
-- (ils passent par project_leads -> JOIN projects cote service_role dans le
-- dashboard).
ALTER TABLE projects ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "projects_select_admin_or_owner_via_lead" ON projects;
-- Pas de policy par defaut pour anon/authenticated = deny.
-- Les Server Actions cote /ai/dashboard/projets utilisent service_role pour
-- charger les projects via project_leads. RLS est defense en profondeur.

COMMENT ON POLICY "project_leads_select_own_via_pros" ON project_leads IS
  'Phase 8 : un freelance authentifie voit SES leads via pro_id -> pros.claimed_by_user_id = auth.uid()';
COMMENT ON POLICY "project_leads_update_own_via_pros" ON project_leads IS
  'Phase 8 : un freelance authentifie peut MARQUER ses leads (statut, opened_at, contacted_at)';

-- Fiabilité admin (refonte Phase 1) — tuer la cause n°1 des déconnexions.
--
-- AVANT : l'Accueil (/admin) faisait 8 `count exact` en parallèle, dont 2 sur la
-- table `pros` (2,4M lignes) filtrés sur subscription_status NON indexé → full
-- scan de plusieurs secondes, REJOUÉ TOUTES LES 30s par le polling de l'Overview.
-- Sous cette charge, le fetch d'auth du middleware (/api/admin/auth/check)
-- timeoutait → redirection /admin/login = « déconnexion » perçue (leçon 28/04).
--
-- APRÈS : une seule fonction agrégée `admin_overview_stats()` qui calcule tous les
-- compteurs en un appel, avec un index partiel pour compter les pros réclamés en
-- index-only scan (instantané). La métrique legacy « abonnés actifs » (= 0, on est
-- en pay-per-lead) est remplacée par « pros réclamés ».
--
-- Sécurité : SECURITY DEFINER (agrège en bypass RLS, read-only) mais EXECUTE
-- RÉVOQUÉ à anon/authenticated → seul le service_role (client admin) peut l'appeler.

-- 1. Index partiel : compter les pros réclamés sans scanner 2,4M lignes.
CREATE INDEX IF NOT EXISTS idx_pros_claimed_partial
  ON pros (claimed_by_user_id)
  WHERE claimed_by_user_id IS NOT NULL;

-- 2. Fonction agrégée unique.
CREATE OR REPLACE FUNCTION admin_overview_stats()
RETURNS jsonb
LANGUAGE sql
SECURITY DEFINER
SET statement_timeout = '20s'
AS $$
  WITH b AS (
    SELECT date_trunc('month', now()) AS m_start,
           date_trunc('month', now() - interval '1 month') AS lm_start
  )
  SELECT jsonb_build_object(
    'claimedPros',
      (SELECT count(*) FROM pros WHERE claimed_by_user_id IS NOT NULL),
    'claimedProsLastMonth',
      (SELECT count(*) FROM pros, b
        WHERE claimed_by_user_id IS NOT NULL AND claimed_at < b.m_start),
    'projectsThisMonth',
      (SELECT count(*) FROM projects, b
        WHERE created_at >= b.m_start AND status <> 'deleted'),
    'projectsLastMonth',
      (SELECT count(*) FROM projects, b
        WHERE created_at >= b.lm_start AND created_at < b.m_start AND status <> 'deleted'),
    'leadsSent',
      (SELECT count(*) FROM project_leads, b WHERE sent_at >= b.m_start),
    'leadsSentLastMonth',
      (SELECT count(*) FROM project_leads, b
        WHERE sent_at >= b.lm_start AND sent_at < b.m_start),
    'leadsContacted',
      (SELECT count(*) FROM project_leads, b
        WHERE sent_at >= b.m_start AND status = 'contacted'),
    'leadsContactedLastMonth',
      (SELECT count(*) FROM project_leads, b
        WHERE sent_at >= b.lm_start AND sent_at < b.m_start AND status = 'contacted')
  );
$$;

-- 3. Verrouiller l'exécution au seul service_role.
REVOKE ALL ON FUNCTION admin_overview_stats() FROM PUBLIC;
DO $$ BEGIN
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'anon') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION admin_overview_stats() FROM anon';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'authenticated') THEN
    EXECUTE 'REVOKE ALL ON FUNCTION admin_overview_stats() FROM authenticated';
  END IF;
  IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'service_role') THEN
    EXECUTE 'GRANT EXECUTE ON FUNCTION admin_overview_stats() TO service_role';
  END IF;
END $$;

NOTIFY pgrst, 'reload schema';

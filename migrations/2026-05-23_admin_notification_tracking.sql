-- ============================================================
-- Migration — tracking des notifications admin sur les projets
-- Date : 2026-05-23
-- ============================================================
--
-- DECLENCHEUR : projet #19 (13/05/2026) classe "suspicious" par
-- l'IA, aucune notification admin recue (et idem pour le projet
-- #18 du 27/04). Le .catch non bloquant de
-- app/(public)/deposer-projet/actions.ts ligne 223 masquait
-- silencieusement TOUS les echecs Resend -> impossible de savoir
-- si un mail est parti, parti en spam, ou n'est jamais parti.
--
-- OBJECTIF : audit trail systematique de chaque tentative
-- d'envoi de notification admin. Plus jamais de "perte
-- silencieuse" possible.
--
-- COMPLEMENT : couche 2 (UI admin) affichera un badge sur les
-- projets ou admin_notified_at IS NULL apres un grace period,
-- avec un bouton "Renvoyer la notif".
--
-- APPLICATION : Supabase Dashboard > SQL Editor > coller + Run.
-- Idempotent (re-executable sans erreur).
-- ============================================================

-- Timestamp de l'envoi reussi (NULL si echec / non envoye)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS admin_notified_at timestamptz;

-- Message d'erreur du dernier echec Resend (NULL si jamais d'echec
-- ou si l'envoi a finalement reussi)
ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS admin_notification_error text;

-- Index partiel sur les projets sans notif envoyee : query rapide
-- pour le badge admin "X projets en attente"
CREATE INDEX IF NOT EXISTS idx_projects_admin_not_notified
  ON projects (created_at DESC)
  WHERE admin_notified_at IS NULL;

-- ============================================================
-- BACKFILL pour les projets existants
-- ============================================================
--
-- Les projets crees AVANT cette migration n'ont evidemment pas
-- admin_notified_at set. Mais on ne sait pas retroactivement
-- lesquels ont ete notifies ou pas. Strategie : on les marque
-- TOUS comme "non notifies" (admin_notified_at IS NULL) pour
-- forcer une revue manuelle par l'admin via la couche 2 UI.
-- Le user peut ensuite cliquer "Marquer comme traite" pour les
-- projets qu'il a deja vus, ou "Renvoyer la notif" pour ceux
-- qu'il veut vraiment re-notifier.
--
-- Aucun update SQL necessaire ici : la colonne est NULL par
-- defaut, donc tous les projets existants apparaitront comme
-- "non notifies" dans l'UI, ce qui est exactement le
-- comportement voulu (audit retroactif).
-- ============================================================

-- VERIFICATION (a executer apres le Run) :
--
--   SELECT
--     COUNT(*) FILTER (WHERE admin_notified_at IS NOT NULL) AS notified,
--     COUNT(*) FILTER (WHERE admin_notified_at IS NULL)     AS pending,
--     COUNT(*) FILTER (WHERE admin_notification_error IS NOT NULL) AS failed
--   FROM projects;

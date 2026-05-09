-- ============================================================
-- Migration : ajouter les champs RGE officiels (source ADEME)
-- ============================================================
-- Source : data.gouv.fr / ADEME — "Liste des entreprises RGE"
-- Dataset : https://data.ademe.fr/datasets/liste-des-entreprises-rge-2
-- Maj : 15/04/2026 (165 202 entreprises)
--
-- Distinction importante :
--   - pros.certifications : user-input quand le pro complete sa fiche
--     (cocher RGE/Qualibat/etc dans le dashboard)
--   - pros.rge_certified + rge_qualifications : data OFFICIELLE
--     ADEME, sourcee automatiquement (badge bleu credible)
--
-- A executer dans le SQL editor Supabase :
--   https://supabase.com/dashboard/project/_/sql
-- ============================================================

ALTER TABLE pros
  ADD COLUMN IF NOT EXISTS rge_certified boolean DEFAULT false NOT NULL,
  ADD COLUMN IF NOT EXISTS rge_qualifications jsonb DEFAULT '[]'::jsonb NOT NULL,
  ADD COLUMN IF NOT EXISTS rge_synced_at timestamptz;

-- Index partiel : seulement sur les pros RGE certifies (= petit ensemble)
-- pour accelerer les requetes "afficher les pros RGE de cette categorie/ville"
CREATE INDEX IF NOT EXISTS idx_pros_rge_certified
  ON pros (rge_certified)
  WHERE rge_certified = true;

-- Commentaires pour documentation auto-generee
COMMENT ON COLUMN pros.rge_certified IS
  'Officiel ADEME. True si au moins 1 qualification RGE valide a la date de sync. Sync via scripts/match-rge-pros.ts.';
COMMENT ON COLUMN pros.rge_qualifications IS
  'Officiel ADEME. Array de objets {nom, code, organisme, domaine, meta_domaine, date_fin}. Filtre uniquement les qualifs valides au moment du sync.';
COMMENT ON COLUMN pros.rge_synced_at IS
  'Date du dernier sync avec le dataset ADEME. NULL = jamais sync.';

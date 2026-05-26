-- Migration : modele Broadcast Workwave AI (Phase 11)
-- Date : 2026-05-26
--
-- Changement business model : on passe du "routing IA top 3 freelances"
-- (Phase 8) au "broadcast a 100% de la communauté freelances tech".
--
-- Inspiration : Codeur.com / Free-Work. Tous les freelances inscrits sont
-- alertes en temps reel par email. Seuls les Premium peuvent voir les
-- coordonnees client et marquer "j'ai contacte".
--
-- Cette migration ajoute 2 colonnes sur projects pour tracker les
-- broadcasts (audit + monitoring) :
--   - broadcast_count : nombre de freelances joins par mail
--   - broadcasted_at : timestamp du dernier broadcast (1er broadcast en pratique)

ALTER TABLE projects
  ADD COLUMN IF NOT EXISTS broadcast_count integer,
  ADD COLUMN IF NOT EXISTS broadcasted_at timestamptz;

COMMENT ON COLUMN projects.broadcast_count IS
  'Nombre de freelances tech qui ont recu le mail de broadcast (Phase 11).';

COMMENT ON COLUMN projects.broadcasted_at IS
  'Timestamp du broadcast (envoi mails). NULL si pas encore broadcast (suspicious ou erreur).';

-- Index sur broadcasted_at pour monitoring (combien de projets non-broadcastes)
CREATE INDEX IF NOT EXISTS idx_projects_broadcasted_at
  ON projects (broadcasted_at DESC)
  WHERE broadcasted_at IS NOT NULL;

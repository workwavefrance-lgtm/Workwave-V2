-- Relance "projet toujours disponible" à J+3 (cron quotidien).
-- relance_sent_at : garantit qu'un projet n'est relancé qu'UNE SEULE fois.
ALTER TABLE projects ADD COLUMN IF NOT EXISTS relance_sent_at timestamptz;

-- Index partiel : accélère la sélection des projets en attente de relance.
CREATE INDEX IF NOT EXISTS idx_projects_relance_pending
  ON projects (broadcasted_at)
  WHERE relance_sent_at IS NULL;

NOTIFY pgrst, 'reload schema';

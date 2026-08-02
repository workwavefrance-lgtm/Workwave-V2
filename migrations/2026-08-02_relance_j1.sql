-- Relance J+1 aux pros (decision Willy 02/08/2026)
--
-- Sequence cible pour un projet BTP :
--   J0    -> broadcast initial aux pros de la zone      (broadcasted_at)
--   J+1   -> 1re relance "un projet vous attend"        (relance_j1_sent_at)  <-- NOUVEAU
--   J+3   -> 2e relance "toujours disponible"           (relance_sent_at)
--
-- Pourquoi une colonne dediee plutot que reutiliser relance_sent_at : sans elle,
-- une seule des deux relances pourrait partir (la 1re remplirait la colonne et
-- bloquerait la 2e). Chaque relance a besoin de SA propre trace d'idempotence
-- pour qu'un pro ne recoive jamais deux fois le meme message.
--
-- Idempotent : re-executable sans risque.

ALTER TABLE projects ADD COLUMN IF NOT EXISTS relance_j1_sent_at timestamptz;

COMMENT ON COLUMN projects.relance_j1_sent_at IS
  'Horodatage de la relance J+1 aux pros ("un projet vous attend dans votre dashboard"). NULL = pas encore relance. Garantit une seule relance J+1 par projet.';

-- Index partiel : le cron ne cherche QUE les projets pas encore relances.
-- Sans lui, le balayage scanne toute la table a chaque passage.
CREATE INDEX IF NOT EXISTS idx_projects_relance_j1_pending
  ON projects (broadcasted_at)
  WHERE relance_j1_sent_at IS NULL AND broadcast_count > 0;

-- PostgREST met son schema en cache : sans ce rechargement, la nouvelle colonne
-- reste invisible cote application ("column not found in schema cache").
NOTIFY pgrst, 'reload schema';

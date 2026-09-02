-- Index pour le flux de fraicheur (lib/queries/fraicheur.ts) : les fiches
-- modifiees recemment, triees par date. Sans lui, la requete parcourt les
-- 2,4 millions de lignes et depasse le delai de la base (build du 02/09/2026
-- casse sur /flux-mises-a-jour.xml ; 5,3 s mesurees hors charge).
--
-- CONCURRENTLY : pas de verrou d'ecriture pendant la creation (le site
-- continue de tourner). Doit etre lance SEUL, hors transaction : dans
-- l'editeur SQL Supabase, executer cette seule instruction.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pros_updated_at_actifs
  ON pros (updated_at DESC)
  WHERE is_active = true AND deleted_at IS NULL;

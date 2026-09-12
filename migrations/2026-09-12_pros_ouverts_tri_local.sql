-- Recherche des alternatives en activité sur une fiche fermée.
-- Le 12/09, getProsEnActiviteProches dépasse ponctuellement le délai SQL.
-- Plan observé : lecture de 7 265 lignes + tri pour afficher 10 résultats.
-- Cet index fournit directement l'ordre existant, sans changer les filtres.
-- INCLUDE(slug) permet aussi de tester l'exclusion lors du compte exact
-- sans lire chaque fiche lorsque la visibilité permet un index-only scan.
--
-- Exécuter cette instruction SEULE, hors transaction (CONCURRENTLY).
-- Ne bloque pas les écritures comme un CREATE INDEX ordinaire.
-- Aucun index existant n'est supprimé ; aucun droit ni délai SQL n'est changé.
-- Vérifier indisvalid ET indisready après exécution : IF NOT EXISTS ne
-- répare pas un index invalide laissé par une construction interrompue.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pros_ouverts_city_cat_claim_name
  ON public.pros (city_id, category_id, claimed_by_user_id DESC NULLS LAST, name ASC)
  INCLUDE (slug)
  WHERE is_active = true
    AND deleted_at IS NULL
    AND (etat_admin IS NULL OR etat_admin <> 'F');

-- Migration : empecher 2 rows pros tech actives par user
-- Date : 2026-05-26
-- Fix : race condition activate-signup.ts decouverte au polish 8 sprint AI
--
-- Probleme : si 2 requetes d'activation arrivent en parallele (mac vs mobile
-- sur le meme signup ou retry network), le check SELECT (ligne 173 de
-- activate-signup.ts) passe pour les deux car aucune n'a encore insere.
-- Resultat : 2 rows pros actives pour le meme auth user, dont 1 fantome
-- qui recoit les leads sans etre lie au compte qui se connecte.
--
-- Defense en profondeur : UNIQUE INDEX partiel. On indexe seulement les
-- rows "vivantes" (deleted_at IS NULL, is_active = true, claim renseigne)
-- pour ne pas bloquer les fiches soft-deleted ni les fiches Sirene non
-- revendiquees (claimed_by_user_id IS NULL).
--
-- Filtres :
--   - claimed_by_user_id IS NOT NULL : on s'en fout des fiches non
--     revendiquees (Sirene seed, etc.)
--   - is_active = true : seules les fiches actives comptent
--   - deleted_at IS NULL : on tolere une re-creation apres soft-delete
--
-- Cela permet :
--   - Un meme auth user peut avoir 1 fiche tech ET 1 fiche BTP (categories
--     differentes, pas de conflit)
--   - Un user soft-deleted peut re-creer sa fiche apres (deleted_at est
--     remplie sur l'ancienne, donc pas dans l'index unique)
--
-- En cas de conflit, l'INSERT cote app catchera l'erreur 23505 et
-- retournera la fiche existante (cf. activate-signup.ts).

CREATE UNIQUE INDEX IF NOT EXISTS idx_pros_claim_unique_active
  ON pros (claimed_by_user_id, category_id)
  WHERE claimed_by_user_id IS NOT NULL
    AND is_active = true
    AND deleted_at IS NULL;

-- Verification post-migration : combien de violations potentielles
-- existent deja en BDD ? Si > 0, l'INDEX echouera et on devra nettoyer
-- avant de l'appliquer.
--
-- SELECT claimed_by_user_id, category_id, COUNT(*) AS dupes
-- FROM pros
-- WHERE claimed_by_user_id IS NOT NULL AND is_active = true AND deleted_at IS NULL
-- GROUP BY claimed_by_user_id, category_id
-- HAVING COUNT(*) > 1;
--
-- Si la requete retourne 0 rows, l'INDEX se cree sans erreur.
-- Si elle retourne des rows, identifier la fiche "officielle" (celle qui
-- est claimed_at la plus recente) et soft-delete les autres avant de
-- relancer la migration.

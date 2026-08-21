-- Photo de couverture et legendes de realisations sur la fiche pro.
--
-- Choix de conception (21/08/2026), apres cartographie des 34 endroits qui
-- lisent ou ecrivent `pros.photos` :
--
-- 1. `photos` GARDE sa forme actuelle, un tableau d'URL en chaines. Le faire
--    passer a un tableau d'objets {url, legende} casserait trois choses EN
--    SILENCE : le filtre `typeof url === "string"` de la fiche publique
--    viderait la galerie de toutes les fiches sans lever d'erreur, et les
--    comparaisons `includes` / `!==` des quatre actions de suppression
--    renverraient "succes" sans rien supprimer.
--
-- 2. Les legendes vont donc dans une colonne separee, sous forme de table de
--    correspondance CLEF = URL de la photo. Pas d'index numerique : une
--    correspondance par position se decalerait a la premiere suppression et
--    collerait la legende d'un chantier sur la photo d'un autre.
--
-- 3. La couverture est une simple URL. Elle vit dans le compartiment existant
--    `pro-photos` (5 Mo, memes types autorises), sous un prefixe `cover-`,
--    donc aucun nouveau compartiment ni nouvelle regle d'acces.

ALTER TABLE pros ADD COLUMN IF NOT EXISTS cover_url text;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS photo_captions jsonb NOT NULL DEFAULT '{}'::jsonb;

COMMENT ON COLUMN pros.cover_url IS
  'Photo de couverture affichee en haut de la fiche. 2048x460 px conseille. Envoyee par le pro, jamais fabriquee.';
COMMENT ON COLUMN pros.photo_captions IS
  'Legendes des realisations, {"url_de_la_photo": "legende"}. Clef = URL, pas index : resiste aux suppressions et reordonnancements.';

-- PostgREST doit relire son cache de schema, sinon les colonnes fraichement
-- ajoutees remontent en "column not found in schema cache" (lecon du 07/06).
NOTIFY pgrst, 'reload schema';

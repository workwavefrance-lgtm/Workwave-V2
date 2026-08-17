-- Forme juridique de l'entreprise (entreprise individuelle, SARL, SAS...).
--
-- POURQUOI. Mesure du 17/08/2026 : deux artisans du meme metier dans la meme
-- ville partagent 80 % de texte identique sur leur fiche, ce qui empeche
-- Google d'indexer la seconde (218 870 pages "exploree, actuellement non
-- indexee"). La forme juridique change d'une entreprise a l'autre, y compris
-- entre voisins : c'est une des rares donnees gratuites qui distingue
-- vraiment deux fiches.
--
-- SOURCE : fichier StockUniteLegale du repertoire Sirene (INSEE), colonne
-- `categorieJuridiqueUniteLegale`, publie en libre acces sur data.gouv.fr et
-- mis a jour chaque mois. On stocke le CODE a 4 chiffres ; le libelle vient
-- de la table figee lib/data/formes-juridiques.ts (nomenclature INSEE).
--
-- Idempotent : ADD COLUMN IF NOT EXISTS. Lecon du 07/06 : ne jamais compter
-- sur CREATE TABLE pour faire evoluer un schema existant.

ALTER TABLE pros ADD COLUMN IF NOT EXISTS forme_juridique text;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS sirene_synced_at timestamptz;

COMMENT ON COLUMN pros.forme_juridique IS
  'Code categorie juridique INSEE a 4 chiffres (ex. 1000 = entrepreneur individuel, 5710 = SAS). Libelle dans lib/data/formes-juridiques.ts.';
COMMENT ON COLUMN pros.sirene_synced_at IS
  'Date du dernier rapprochement avec les fichiers Stock du repertoire Sirene.';

-- Index partiel : sert aux comptages de couverture et a la reprise du
-- chargement la ou il s'est arrete. Ne pese que sur les lignes renseignees.
CREATE INDEX IF NOT EXISTS idx_pros_forme_juridique
  ON pros (forme_juridique) WHERE forme_juridique IS NOT NULL;

-- PostgREST garde son propre cache du schema : sans ce signal, les colonnes
-- fraichement ajoutees restent invisibles ("column not found in schema
-- cache") meme si elles existent bien en base. Lecon du 07/06.
NOTIFY pgrst, 'reload schema';

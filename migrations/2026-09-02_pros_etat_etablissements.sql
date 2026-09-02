-- Etat reel des etablissements et des entreprises (fichiers Stock Sirene).
--
-- POURQUOI (02/09/2026). Mesure sur 200 fiches actives prises au hasard :
-- 45 % sont des etablissements FERMES (34 % d'entreprises disparues, 11 %
-- d'entreprises qui ont demenage). Cause : scraping/sirene_par_departement.py
-- filtre periode(etatAdministratifEtablissement:A), qui matche n'importe quelle
-- periode HISTORIQUE ; etat_admin n'a jamais ete ecrit (valeur par defaut A).
-- Decision Willy (02/09) : la page d'un etablissement ferme reste en ligne,
-- dit la verite (date de fermeture, registre officiel) et renvoie vers des
-- pros en activite. Rien n'est supprime, aucun noindex.
--
-- Idempotent (ALTER ... IF NOT EXISTS), rejouable sans risque.

ALTER TABLE pros ADD COLUMN IF NOT EXISTS date_fermeture date;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS entreprise_etat text;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS entreprise_date_fermeture date;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS etat_verifie_at timestamptz;

COMMENT ON COLUMN pros.date_fermeture IS
  'Date de fermeture de l''etablissement (debut de sa periode F dans Sirene). Null si ouvert. Ecrit par scripts/classer-etablissements.ts.';
COMMENT ON COLUMN pros.entreprise_etat IS
  'Etat de l''unite legale (Sirene) : A = active (a demenage ou possede d''autres etablissements), C = cessee.';
COMMENT ON COLUMN pros.entreprise_date_fermeture IS
  'Date de cessation de l''unite legale (debut de sa periode C). Null si active.';
COMMENT ON COLUMN pros.etat_verifie_at IS
  'Date du dernier controle de l''etat par les fichiers Stock Sirene. Null = jamais verifie (etat_admin vaut alors la valeur par defaut, non fiable).';

-- Index pour les listings et compteurs qui ne doivent montrer que des
-- etablissements OUVERTS. A creer APRES le passage du script de classement
-- (sinon il indexe 2,5 M de lignes qui changeront toutes). CONCURRENTLY :
-- ne bloque pas les lectures ; ne peut pas tourner dans une transaction.
-- CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pros_ouverts_city_cat
--   ON pros (city_id, category_id)
--   WHERE is_active = true AND deleted_at IS NULL AND etat_admin = 'A';

NOTIFY pgrst, 'reload schema';

-- Enrichissement des fiches pros avec l'annuaire des entreprises
-- (API publique recherche-entreprises.api.gouv.fr, gratuite, sans cle).
-- Script : scripts/enrichir-fiches-sirene.ts
--
-- POURQUOI. Regle du 07/06/2026 : chaque fiche doit porter de la VRAIE donnee
-- officielle, jamais de donnee inventee. Et mesure du 20/08 : la date de
-- creation complete est le meilleur fait gratuit qui distingue deux fiches
-- voisines (300 jours distincts pour 1000 fiches). L'API fournit en plus, par
-- etablissement, des faits uniques : coordonnees exactes de l'adresse, metier
-- declare a la Chambre des metiers, enseignes, nom commercial, convention
-- collective, et par entreprise : comptes deposes, categorie, labels.
--
-- COLONNES DEJA EXISTANTES, REUTILISEES (verifie par SELECT le 02/09/2026,
-- aucune n'est recreee ici) :
--   founding_date   date  <- date_creation de l'unite legale
--   founded_year    int   <- annee de founding_date, seulement si vide
--   forme_juridique text  <- nature_juridique (code INSEE 4 chiffres)
--   effectif_range  text  <- tranche_effectif_salarie (code INSEE : NN, 00, 01, 03...)
--   etat_admin      text  <- etat_administratif de l'etablissement (A / F)
--   naf_code        text  <- activite_principale de l'etablissement, sans point (4322A)
--
-- NOUVEAU MARQUEUR DE REPRISE : sirene_enrichi_at. On ne reutilise PAS
-- sirene_synced_at : il est pose par deux autres chaines (fichiers Stock du
-- 17/08 et scripts/enrich-sirene-v3.ts) sur 71 880 fiches, avec un perimetre
-- de colonnes different. Un marqueur par chaine, sinon on saute des fiches
-- qui n'ont jamais recu ces donnees-ci.
--
-- Idempotent : ADD COLUMN IF NOT EXISTS partout (lecon du 07/06 : ne jamais
-- compter sur CREATE TABLE pour faire evoluer un schema existant).

-- Marqueur de reprise de CETTE chaine d'enrichissement.
ALTER TABLE pros ADD COLUMN IF NOT EXISTS sirene_enrichi_at timestamptz;

-- Niveau ETABLISSEMENT (l'entree de matching_etablissements dont le siret est
-- celui de la fiche, sinon le siege).
ALTER TABLE pros ADD COLUMN IF NOT EXISTS etab_latitude double precision;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS etab_longitude double precision;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS activite_registre_metier text;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS liste_rge jsonb;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS enseignes jsonb;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS nom_commercial text;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS date_debut_activite date;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS caractere_employeur text;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS liste_idcc jsonb;

-- Niveau ENTREPRISE (unite legale).
ALTER TABLE pros ADD COLUMN IF NOT EXISTS nombre_etablissements integer;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS categorie_entreprise text;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS finances jsonb;
ALTER TABLE pros ADD COLUMN IF NOT EXISTS labels_officiels jsonb;

COMMENT ON COLUMN pros.sirene_enrichi_at IS
  'Date du dernier passage de scripts/enrichir-fiches-sirene.ts (API recherche-entreprises). Posee meme si le SIRET est introuvable, pour ne pas le redemander.';
COMMENT ON COLUMN pros.etab_latitude IS
  'Latitude de l''adresse exacte de l''etablissement (annuaire des entreprises), pas le centre de la commune.';
COMMENT ON COLUMN pros.etab_longitude IS
  'Longitude de l''adresse exacte de l''etablissement (annuaire des entreprises), pas le centre de la commune.';
COMMENT ON COLUMN pros.activite_registre_metier IS
  'Code NAFA du metier declare a la Chambre des metiers (ex. 4322AZ), plus precis que le NAF. Null si l''etablissement n''est pas inscrit au registre des metiers.';
COMMENT ON COLUMN pros.liste_rge IS
  'Certifications RGE de l''etablissement telles que renvoyees par l''annuaire (tableau). Distinct de rge_certified / rge_qualifications (rapprochement ADEME par SIRET, plus riche).';
COMMENT ON COLUMN pros.enseignes IS
  'Enseignes declarees de l''etablissement (tableau de chaines).';
COMMENT ON COLUMN pros.nom_commercial IS
  'Nom commercial declare de l''etablissement.';
COMMENT ON COLUMN pros.date_debut_activite IS
  'Debut de la periode ACTUELLE de l''etablissement dans Sirene. Attention : pour un etablissement ferme, c''est la date de fermeture, pas le debut d''activite (mesure le 02/09 sur 3 SIRET de Poitiers).';
COMMENT ON COLUMN pros.caractere_employeur IS
  'O = etablissement employeur, N = non employeur (Sirene).';
COMMENT ON COLUMN pros.liste_idcc IS
  'Identifiants de convention collective (IDCC) de l''etablissement, ou a defaut de l''entreprise (tableau de chaines).';
COMMENT ON COLUMN pros.nombre_etablissements IS
  'Nombre total d''etablissements de l''entreprise (ouverts et fermes).';
COMMENT ON COLUMN pros.categorie_entreprise IS
  'Categorie INSEE de l''entreprise : PME, ETI ou GE. Null pour la plupart des entrepreneurs individuels.';
COMMENT ON COLUMN pros.finances IS
  'Comptes deposes, par annee : {"2024": {"ca": ..., "resultat_net": ...}}. Null pour les entreprises qui ne deposent pas (entrepreneurs individuels), c''est normal.';
COMMENT ON COLUMN pros.labels_officiels IS
  'Drapeaux officiels a true uniquement, ex. {"est_rge": true}. Cles possibles : est_rge, est_qualiopi, est_organisme_formation, est_ess, est_patrimoine_vivant, est_association. {} si aucun.';

-- Documentation des colonnes reutilisees (COMMENT est idempotent).
COMMENT ON COLUMN pros.founding_date IS
  'Date de creation de l''UNITE LEGALE (annuaire des entreprises), YYYY-MM-DD. Coherente avec founded_year.';
COMMENT ON COLUMN pros.effectif_range IS
  'Tranche d''effectif salarie, code INSEE (NN = non employeur, 00, 01, 02, 03, 11, 12...). Etablissement d''abord, entreprise a defaut.';
COMMENT ON COLUMN pros.etat_admin IS
  'Etat administratif de l''etablissement dans Sirene : A = actif, F = ferme. Seulement enregistre, jamais utilise pour desactiver une fiche automatiquement.';
COMMENT ON COLUMN pros.naf_code IS
  'Activite principale (NAF) de l''etablissement, sans point : 4322A.';

-- Index partiel : sert au comptage de couverture et a la preuve de fin de
-- script (sirene_enrichi_at IS NOT NULL). Ne pese que sur les lignes traitees.
CREATE INDEX IF NOT EXISTS idx_pros_sirene_enrichi_at
  ON pros (sirene_enrichi_at) WHERE sirene_enrichi_at IS NOT NULL;

-- PostgREST garde son propre cache du schema : sans ce signal, les colonnes
-- fraichement ajoutees restent invisibles ("column not found in schema
-- cache") meme si elles existent bien en base. Lecon du 07/06.
NOTIFY pgrst, 'reload schema';

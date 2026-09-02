-- Ecriture par lot de l'etat Sirene : une requete pour 1 000 fiches, quelles
-- que soient leurs valeurs.
--
-- POURQUOI (02/09/2026, 22 h). Le classement ecrivait par UPDATE ... WHERE
-- siret IN (...) regroupes par valeurs identiques. Parfait pour les fiches
-- ouvertes (un seul groupe), catastrophique pour les fermees : chaque date de
-- fermeture distincte fait un groupe, donc ~176 000 requetes de 5 fiches pour
-- 1,1 million de fiches, a 3 ou 4 requetes par seconde et avec des delais
-- depasses qui s'accumulent (23 lots en erreur a la 4 400e requete). Ici, le
-- script envoie un tableau JSON de 1 000 fiches et Postgres fait la jointure :
-- ~1 100 requetes au lieu de 176 000.
--
-- Le trigger zz_pros_updated_at_conditionnel s'applique (updated_at inchange).
-- SECURITY DEFINER : execute avec les droits du proprietaire, appelee par le
-- script avec la cle de service uniquement (REVOKE pour anon et authenticated).

CREATE OR REPLACE FUNCTION classer_etats_lot(lot jsonb, verifie_at timestamptz)
RETURNS integer
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  n integer;
BEGIN
  SET LOCAL statement_timeout = '120s';
  UPDATE pros p
     SET etat_admin = r.etat_admin,
         date_fermeture = r.date_fermeture,
         entreprise_etat = r.entreprise_etat,
         entreprise_date_fermeture = r.entreprise_date_fermeture,
         etat_verifie_at = verifie_at
    FROM jsonb_to_recordset(lot) AS r(
           siret text,
           etat_admin text,
           date_fermeture date,
           entreprise_etat text,
           entreprise_date_fermeture date)
   WHERE p.siret = r.siret
     AND p.is_active = true
     AND p.deleted_at IS NULL;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END;
$$;

REVOKE ALL ON FUNCTION classer_etats_lot(jsonb, timestamptz) FROM PUBLIC, anon, authenticated;
GRANT EXECUTE ON FUNCTION classer_etats_lot(jsonb, timestamptz) TO service_role;

NOTIFY pgrst, 'reload schema';

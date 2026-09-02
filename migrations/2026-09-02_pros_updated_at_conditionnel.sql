-- updated_at de pros : ne bouge PAS quand seul l'etat Sirene change.
--
-- POURQUOI (02/09/2026). Un trigger BEFORE UPDATE sur pros (cree hors de ce
-- dossier, au tout debut du projet) pose updated_at = now() a chaque UPDATE.
-- Le classement des etablissements fermes (scripts/classer-etablissements.ts)
-- va ecrire 2,3 millions de lignes en ne touchant que l'etat. Or le flux de
-- fraicheur (lib/queries/fraicheur.ts, sitemap et flux Atom relus par Google)
-- lit updated_at : 1,1 million de fiches fermees y entreraient d'un coup et
-- noieraient les vraies mises a jour. Le script s'est arrete tout seul apres
-- une fiche, comme prevu par son garde-fou.
--
-- SOLUTION sans toucher au trigger existant (nom inconnu ici) : un second
-- trigger BEFORE UPDATE, nomme pour passer EN DERNIER (Postgres execute les
-- triggers BEFORE dans l'ordre alphabetique de leur nom). Si rien d'autre que
-- les colonnes d'etat n'a change, il remet updated_at a sa valeur d'avant.
-- Toute autre modification (fiche editee, photo, description, reclamation)
-- garde le comportement actuel : updated_at = now().
--
-- Rejouable sans risque.

CREATE OR REPLACE FUNCTION zz_pros_updated_at_conditionnel() RETURNS trigger AS $$
BEGIN
  IF (to_jsonb(NEW) - 'updated_at' - 'etat_admin' - 'date_fermeture'
        - 'entreprise_etat' - 'entreprise_date_fermeture' - 'etat_verifie_at')
     = (to_jsonb(OLD) - 'updated_at' - 'etat_admin' - 'date_fermeture'
        - 'entreprise_etat' - 'entreprise_date_fermeture' - 'etat_verifie_at') THEN
    NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS zz_pros_updated_at_conditionnel ON pros;
CREATE TRIGGER zz_pros_updated_at_conditionnel
  BEFORE UPDATE ON pros
  FOR EACH ROW EXECUTE FUNCTION zz_pros_updated_at_conditionnel();

-- Controle : lister les triggers BEFORE UPDATE de pros, le notre doit etre le
-- dernier dans l'ordre alphabetique.
SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.pros'::regclass AND NOT tgisinternal
ORDER BY tgname;

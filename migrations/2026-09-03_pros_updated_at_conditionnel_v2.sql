-- updated_at de pros : version 2 du trigger conditionnel, sans to_jsonb.
--
-- POURQUOI (03/09/2026, 8 h). La version 1 (migration du 02/09) comparait la
-- ligne entiere en jsonb (to_jsonb(NEW) et to_jsonb(OLD), moins les colonnes
-- d'etat) a CHAQUE UPDATE. Sur les fiches aux colonnes jsonb volumineuses
-- (photos, horaires, enrichissements), cette conversion coute jusqu'a des
-- centaines de millisecondes par ligne. Le classement des etablissements
-- fermes (scripts/classer-etablissements.ts) a fini par ne traiter QUE ces
-- lignes lourdes (les legeres etaient passees) : 1 117 fiches par minute et
-- un paquet de 50 sur vingt en delai depasse, contre 30 000 par minute au
-- debut.
--
-- Regle simplifiee, equivalente en pratique : seul le script de classement
-- ecrit etat_verifie_at. Si etat_verifie_at change, c'est lui, et updated_at
-- est conserve. Toute autre modification (fiche editee, photo, reclamation,
-- enrichissement) garde updated_at = now() pose par le trigger existant
-- set_updated_at.
--
-- Rejouable sans risque. Remplace la fonction en place, le trigger reste.

CREATE OR REPLACE FUNCTION zz_pros_updated_at_conditionnel() RETURNS trigger AS $$
BEGIN
  IF NEW.etat_verifie_at IS DISTINCT FROM OLD.etat_verifie_at THEN
    NEW.updated_at := OLD.updated_at;
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

SELECT tgname FROM pg_trigger
WHERE tgrelid = 'public.pros'::regclass AND NOT tgisinternal
ORDER BY tgname;

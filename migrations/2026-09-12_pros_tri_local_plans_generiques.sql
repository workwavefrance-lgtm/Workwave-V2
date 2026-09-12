-- Les plans génériques PostgREST ne
-- peuvent pas déduire is_active=true / etat_admin<>'F' de paramètres SQL.
-- Le 12/09, force_generic_plan reproduit 5,1 s avec idx_pros_city :
-- 128 298 fiches lues, dont 127 510 éliminées (ville 12133, catégorie 7).
--
-- L'égalité is_active devient une clé, le seul prédicat est IS NULL
-- (littéral dans la requête). L'état et le slug restent disponibles pour
-- filtrer/compter dans l'index. Le tri existant est conservé.
-- Exécuter cette instruction SEULE, hors transaction.
-- Vérifier ensuite indisvalid ET indisready dans pg_index : IF NOT EXISTS
-- ne répare pas un index invalide laissé par une construction interrompue.
CREATE INDEX CONCURRENTLY IF NOT EXISTS idx_pros_local_tri_generique
  ON public.pros (city_id, category_id, is_active, claimed_by_user_id DESC NULLS LAST, name ASC)
  INCLUDE (slug, etat_admin)
  WHERE deleted_at IS NULL;

-- Les anciens index de production utilisés par les listings et sitemaps
-- restent en place. L'index provisoire du diagnostic a été retiré une fois
-- cet index définitif validé ; il ne fait pas partie des migrations à rejouer.

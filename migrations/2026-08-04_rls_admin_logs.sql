-- Faille signalee par le Security Advisor Supabase le 04/08/2026 : `admin_logs`
-- n'avait AUCUNE Row Level Security. Elle etait donc lisible ET modifiable par
-- quiconque possede la cle anonyme — laquelle est publique par nature, puisqu'elle
-- est incluse dans le bundle JavaScript du site.
--
-- Verifie avant correctif, avec la cle publique :
--   lecture : les 45 lignes remontaient (actions d'administration, entites visees)
--   ecriture : POST accepte, refuse uniquement par une contrainte NOT NULL
--              — donc RIEN ne protegeait la table, seule sa structure genait.
--
-- `admin_logs` est un journal d'audit purement interne : aucune page publique ne
-- le lit. On active donc RLS SANS AUCUNE POLICY = refus total pour les roles
-- `anon` et `authenticated`.
--
-- Le role `service_role` IGNORE TOUJOURS la RLS : les Server Actions et scripts
-- qui passent par getServiceClient()/getAdminServiceClient() continuent d'ecrire
-- normalement. Rien a changer dans le code applicatif.
--
-- Rappel (lecon 22/05/2026) : toute nouvelle table doit recevoir son ENABLE ROW
-- LEVEL SECURITY dans la migration qui la cree. Celle-ci avait ete creee ensuite,
-- en SQL brut, et etait passee entre les mailles.

ALTER TABLE admin_logs ENABLE ROW LEVEL SECURITY;

-- Ceinture et bretelles : on retire aussi les droits accordes par defaut au role
-- anon sur le schema public. Meme si une policy trop permissive etait ajoutee par
-- erreur un jour, la table resterait injoignable depuis la cle publique.
REVOKE ALL ON TABLE admin_logs FROM anon;
REVOKE ALL ON TABLE admin_logs FROM authenticated;

-- PostgREST met son schema en cache : sans ce signal, le changement peut mettre
-- plusieurs minutes a etre pris en compte.
NOTIFY pgrst, 'reload schema';

-- Verification attendue apres execution :
--   SELECT tablename, rowsecurity FROM pg_tables
--   WHERE schemaname='public' AND tablename='admin_logs';
--   -> rowsecurity doit valoir true

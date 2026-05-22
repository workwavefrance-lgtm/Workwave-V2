-- ============================================================
-- Migration RLS — securisation des tables Supabase exposees
-- Date : 2026-05-22
-- ============================================================
--
-- DECLENCHEUR : alerte Supabase Security Advisor.
-- Plusieurs tables ont ete creees sans "ENABLE ROW LEVEL SECURITY"
-- -> elles etaient lisibles (et potentiellement modifiables) par
-- n'importe qui via la cle anon publique (presente dans le bundle
-- JS du site, donc recuperable par tout visiteur).
--
-- DIAGNOSTIC (test via cle anon) :
--   - LISIBLES via anon : pros, categories, cities, departments,
--     blog_posts, seo_pages, seo_guides, admins, blog_queue, events
--   - DEJA PROTEGEES : projects, project_leads, claim_attempts,
--     cancellation_feedback, email_* (RLS deja active) -> non touchees ici
--
-- PRINCIPE :
--   - Le role `service_role` BYPASSE RLS. Tous les scripts, les
--     webhooks Stripe/Brevo, les crons, et les Server Actions qui
--     utilisent un client service_role (getServiceClient /
--     getAdminServiceClient) continuent de fonctionner SANS CHANGEMENT.
--   - On ajoute des policies UNIQUEMENT pour ce que le site doit
--     pouvoir faire via le client de session (anon / authenticated).
--
-- ANALYSE D'ACCES (verifiee dans le code app/ et lib/) :
--   pros .......... lu par pages publiques (annuaire) ; ecrit par
--                   service_role partout SAUF le dashboard
--                   "Preferences leads" (preferences/actions.ts) qui
--                   passe par le client de session du pro connecte.
--   categories .... lu par pages publiques ; ecrit par scripts only.
--   cities ........ lu par pages publiques ; ecrit par scripts only.
--   departments ... lu par pages publiques ; ecrit par scripts only.
--   blog_posts .... lu par /blog (articles publies) ; ecrit par cron.
--   seo_pages ..... lu par pages metier/ville ; ecrit par scripts.
--   seo_guides .... lu par pages /[metier]/guide ; ecrit par scripts.
--   admins ........ acces service_role uniquement (login admin).
--   blog_queue .... acces service_role uniquement (cron daily-blog).
--   events ........ acces service_role uniquement (analytics).
--
-- APPLICATION : Supabase Dashboard > SQL Editor > coller + Run.
-- Script idempotent (re-executable sans erreur).
-- ============================================================


-- ============================================================
-- 1. pros — annuaire public
-- ============================================================
-- Lecture : publique (l'annuaire doit rester consultable).
-- Ecriture : le pro proprietaire peut modifier SA fiche (dashboard
-- preferences). Le reste (dashboard fiche, claim, suppression,
-- webhooks, routing, scripts) passe par service_role -> bypass RLS.
ALTER TABLE pros ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "pros_public_select" ON pros;
CREATE POLICY "pros_public_select" ON pros
  FOR SELECT
  USING (true);

DROP POLICY IF EXISTS "pros_owner_update" ON pros;
CREATE POLICY "pros_owner_update" ON pros
  FOR UPDATE
  TO authenticated
  USING (claimed_by_user_id = auth.uid())
  WITH CHECK (claimed_by_user_id = auth.uid());
-- Pas de policy INSERT / DELETE : anon et authenticated ne peuvent
-- ni inserer ni supprimer. service_role bypasse -> scripts OK.


-- ============================================================
-- 2. Donnees de reference — lecture publique
-- ============================================================
-- categories / cities / departments : affichees sur tout le site
-- public. Ecriture uniquement par les scripts (service_role).
ALTER TABLE categories ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "categories_public_select" ON categories;
CREATE POLICY "categories_public_select" ON categories
  FOR SELECT
  USING (true);

ALTER TABLE cities ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "cities_public_select" ON cities;
CREATE POLICY "cities_public_select" ON cities
  FOR SELECT
  USING (true);

ALTER TABLE departments ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "departments_public_select" ON departments;
CREATE POLICY "departments_public_select" ON departments
  FOR SELECT
  USING (true);


-- ============================================================
-- 3. Contenu editorial — lecture publique
-- ============================================================
-- blog_posts : seuls les articles "published" sont visibles du
-- public. Les brouillons (draft) restent caches. Le sitemap utilise
-- service_role -> bypass RLS, voit tout.
ALTER TABLE blog_posts ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "blog_posts_published_select" ON blog_posts;
CREATE POLICY "blog_posts_published_select" ON blog_posts
  FOR SELECT
  USING (status = 'published');

-- seo_pages / seo_guides : contenu SEO affiche sur les pages
-- publiques metier/ville et les guides. Lecture publique.
ALTER TABLE seo_pages ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seo_pages_public_select" ON seo_pages;
CREATE POLICY "seo_pages_public_select" ON seo_pages
  FOR SELECT
  USING (true);

ALTER TABLE seo_guides ENABLE ROW LEVEL SECURITY;
DROP POLICY IF EXISTS "seo_guides_public_select" ON seo_guides;
CREATE POLICY "seo_guides_public_select" ON seo_guides
  FOR SELECT
  USING (true);


-- ============================================================
-- 4. Tables internes — verrouillage total
-- ============================================================
-- admins / blog_queue / events : aucun acces legitime via le
-- client de session. RLS activee SANS aucune policy => anon et
-- authenticated sont totalement bloques (lecture ET ecriture).
-- Seul service_role (qui bypasse RLS) continue d'y acceder.
ALTER TABLE admins ENABLE ROW LEVEL SECURITY;
ALTER TABLE blog_queue ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;


-- ============================================================
-- VERIFICATION (a executer apres le Run ci-dessus)
-- ============================================================
-- Cette requete liste toutes les tables du schema public et leur
-- statut RLS. La colonne rowsecurity doit etre `true` partout.
--
--   SELECT tablename, rowsecurity
--   FROM pg_tables
--   WHERE schemaname = 'public'
--   ORDER BY rowsecurity, tablename;
--
-- Et pour lister les policies creees :
--
--   SELECT tablename, policyname, cmd
--   FROM pg_policies
--   WHERE schemaname = 'public'
--   ORDER BY tablename, policyname;
-- ============================================================

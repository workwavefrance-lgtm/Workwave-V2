# CLAUDE.md — Workwave V2

Ce fichier est lu automatiquement par Claude Code à chaque session. Il contient tout le contexte nécessaire pour travailler sur ce projet. À mettre à jour au fil des sprints.

---

## 1. Vision du projet

Workwave est une plateforme qui met en relation les particuliers avec des professionnels locaux dans trois verticaux complémentaires : BTP et artisanat, services à domicile, et aide à la personne. Zone de lancement : département de la Vienne (86), puis extension progressive au Poitou-Charentes (Deux-Sèvres 79, Charente 16, Charente-Maritime 17), puis le reste de la Nouvelle-Aquitaine.

Le positionnement est double. D'abord un annuaire SEO massif qui capte du trafic organique grâce à des pages locales générées automatiquement. Ensuite une plateforme de mise en relation où les particuliers déposent un projet et où l'IA route automatiquement la demande vers les professionnels pertinents.

L'avantage concurrentiel repose sur l'automatisation par l'IA : génération de contenu SEO à l'échelle, qualification intelligente des projets, enrichissement automatique des fiches professionnelles. Cette automatisation permet de proposer des tarifs disruptifs face à des concurrents comme Habitatpresto qui facturent 100 à 150 euros par mois aux artisans.

Vision long terme : devenir un hybride local de Fiverr, Malt et Travaux.com, en ajoutant progressivement des verticaux (services digitaux, bien-être, etc.) une fois le cœur validé.

## 2. Modèle économique

Modèle freemium hybride.

Les professionnels sont tous listés gratuitement dans l'annuaire, qu'ils soient clients ou non. Les fiches de base sont créées automatiquement via scraping des données publiques (API Sirene, Pages Jaunes). Chaque professionnel peut réclamer sa fiche gratuitement pour la compléter, ajouter des photos, modifier la description.

Pour recevoir les leads des projets déposés par les particuliers, le professionnel doit souscrire à un abonnement à 39 euros par mois. Cet abonnement donne accès au routing automatique des projets dans ses catégories et sa zone.

Upsells possibles à ajouter plus tard : badge Pro Vérifié, mise en avant premium dans les listings, pack photo professionnel, etc.

Côté particulier, le service est et reste entièrement gratuit.

## 3. Stack technique

Framework frontend et backend : Next.js 14 ou supérieur, avec App Router et Server Components. Le SSR est critique pour le SEO, c'est pour ça qu'on prend Next.js et pas une autre solution client-side.

Base de données et authentification : Supabase (PostgreSQL managé, auth intégrée, stockage de fichiers). Plan gratuit suffisant au début.

Hébergement : Vercel. Déploiement automatique à chaque push sur la branche main.

Paiements : Stripe, avec Stripe Checkout pour les abonnements récurrents.

Emails transactionnels : Resend ou Postmark pour l'envoi des leads aux pros et des confirmations.

IA : API Anthropic (Claude) pour la génération de contenu SEO et la qualification des projets.

Scraping : Python scripts séparés du projet Next.js, hébergés localement ou sur un petit VPS si besoin. Données injectées dans Supabase via l'API.

Styling : Tailwind CSS. Pas de framework de composants lourd comme Material UI. Éventuellement shadcn/ui pour les composants de base.

Langage : TypeScript partout sur le frontend et backend Next.js. Python pour le scraping.

## 4. Conventions de code

Toutes les conventions ci-dessous doivent être respectées strictement pour garder le code maintenable.

Nommage des fichiers : kebab-case pour les dossiers et fichiers non-composants, PascalCase pour les composants React.

Les composants React sont en Server Components par défaut. On n'utilise "use client" que quand c'est strictement nécessaire (interactivité, hooks React).

Les appels à Supabase côté serveur passent par un client créé dans lib/supabase/server.ts. Les appels côté client passent par lib/supabase/client.ts.

Pas de logique métier dans les composants. Toute la logique va dans des fonctions pures dans lib/ ou dans des Server Actions.

Les types TypeScript sont générés automatiquement depuis Supabase via la commande npx supabase gen types et mis à jour à chaque modification du schéma.

Les variables d'environnement sensibles vont dans .env.local et jamais dans le repo. Un fichier .env.example est maintenu à jour avec les noms des variables nécessaires.

Commits : messages en français, au présent, concis. Exemple : "ajoute la page listing par métier".

## 5. Architecture des URLs

La structure d'URL est critique pour le SEO. Voici les routes prévues :

- / : page d'accueil avec recherche rapide par métier et ville
- /recherche : résultats de recherche
- /[metier]/[departement] : liste des pros d'un métier dans un département (ex. /plombier/vienne-86)
- /[metier]/[ville] : liste des pros d'un métier dans une ville (ex. /plombier/poitiers)
- /artisan/[slug] : fiche détaillée d'un professionnel (ex. /artisan/id-renov-latille)
- /deposer-projet : formulaire de dépôt de projet
- /pro : landing page pour les professionnels
- /pro/tarifs : page tarifs abonnement
- /pro/connexion : connexion pro
- /pro/dashboard : dashboard du pro connecté
- /pro/reclamer/[slug] : réclamation de fiche

Les slugs sont générés à partir du nom de l'entreprise plus un identifiant court, pour éviter les collisions tout en restant lisibles.

## 6. Schéma de base de données (version initiale)

Table categories : id, slug, name, vertical (btp, domicile, personne), parent_id (pour hiérarchie), description, seo_keywords.

Table departments : id, code (86, 79, 16, 17), name, region.

Table cities : id, department_id, name, slug, population, latitude, longitude.

Table pros : id, slug, name, siret, category_id, address, city_id, postal_code, phone, email, website, description, logo_url, photos (jsonb), claimed_by_user_id (nullable), is_subscribed (boolean), stripe_customer_id, created_at, updated_at, source (sirene, pagesjaunes, manual).

Table users : gérée par Supabase Auth. Table profil utilisateur liée : id (= auth user id), email, role (pro, admin), created_at.

Table projects : id, particulier_name, particulier_email, particulier_phone, category_id, city_id, description, budget_estimated, urgency, ai_qualification (jsonb), status (new, routed, closed), created_at.

Table project_leads : id, project_id, pro_id, sent_at, opened_at, status (sent, viewed, contacted).

Table seo_pages : id, slug, type (metier_ville, metier_dept), category_id, city_id (nullable), department_id (nullable), title, meta_description, content (markdown généré par IA), generated_at.

Ce schéma évoluera au fil des sprints, à mettre à jour dans ce fichier à chaque modification.

## 7. Les trois verticaux et leurs catégories

Vertical BTP : plombier, électricien, maçon, peintre, menuisier, carreleur, plaquiste, couvreur, charpentier, façadier, serrurier, chauffagiste, climaticien, terrassier, paysagiste, élagueur, architecte, décorateur intérieur.

Vertical services à domicile : ménage, repassage, jardinage, petit bricolage, nettoyage vitres, débarras, déménagement, livraison de courses, lavage voiture à domicile.

Vertical aide à la personne : garde d'enfants, soutien scolaire, aide aux seniors, aide administrative, cours particuliers, accompagnement handicap, promenade animaux, garde animaux.

Les codes NAF correspondants sont à mapper dans le script de scraping Sirene pour filtrer les bons établissements.

## 8. Stratégie SEO

La stratégie repose sur du SEO programmatique local. On génère des milliers de pages uniques en combinant nos catégories avec nos villes et départements.

Pour éviter le duplicate content, chaque page a un contenu unique généré par Claude. Le prompt de génération doit inclure des spécificités locales (population de la ville, quartiers, contexte économique) et des informations métier (fourchettes de prix, questions fréquentes, conseils). Un cache est obligatoire : on génère une fois et on stocke en base dans la table seo_pages, on ne régénère pas à chaque requête.

Chaque page doit avoir : un title optimisé (ex. "Plombier à Poitiers — 24 artisans disponibles"), une meta description unique, un H1 unique, des données structurées schema.org (LocalBusiness pour les fiches pros, ItemList pour les listings), et un maillage interne dense entre les pages (catégories liées, villes voisines).

Le sitemap XML est généré dynamiquement via une route /sitemap.xml qui liste toutes les URLs depuis la base.

## 9. État d'avancement

Sprint 0 — Setup : à démarrer.
Sprint 1 — Base de données et scraping : à démarrer.
Sprint 2 — Pages annuaire publiques : à démarrer.
Sprint 3 — Génération SEO programmatique : à démarrer.
Sprint 4 — Dépôt de projet et routing IA : à démarrer.
Sprint 5 — Comptes pros et abonnements : à démarrer.
Sprint 6 — Switch DNS : à démarrer.
Sprint 7 — Moat IA (superpouvoirs) : à démarrer après sprint 6.

À chaque fin de sprint, mettre à jour cette section avec la date et un résumé de ce qui a été fait.

## 10. Sprint 0 — Setup détaillé

Objectif : avoir une application Next.js vide déployée sur Vercel, connectée à Supabase, accessible sur une URL de test.

Étapes dans l'ordre :

Créer un nouveau projet Next.js avec TypeScript, Tailwind CSS et App Router. Commande : npx create-next-app@latest workwave-v2 --typescript --tailwind --app --eslint.

Initialiser un repo Git et le pousser sur GitHub dans un repo privé workwave-v2.

Créer un projet Supabase sur supabase.com (région Europe), récupérer l'URL et la clé anon, les mettre dans .env.local.

Installer le client Supabase : npm install @supabase/supabase-js @supabase/ssr.

Créer les fichiers lib/supabase/client.ts et lib/supabase/server.ts avec les helpers de connexion.

Créer un compte Vercel si besoin, connecter le repo GitHub, configurer les variables d'environnement, déployer.

Vérifier que l'application est accessible publiquement et affiche une page d'accueil minimale avec le texte Workwave V2 et un lien vers une page de test qui fait un simple select vide dans Supabase pour vérifier la connexion.

Livrable : URL Vercel fonctionnelle + repo GitHub à jour + connexion Supabase testée.

## 11. Sprint 1 — Base de données et scraping détaillé

Objectif : avoir entre 3000 et 5000 fiches de pros de la Vienne dans la base Supabase, prêtes à être affichées.

Étapes dans l'ordre :

Créer les tables categories, departments, cities, pros dans Supabase via l'éditeur SQL ou via migration. Utiliser le schéma de la section 6.

Remplir la table categories avec les métiers listés en section 7. Remplir la table departments avec au minimum la Vienne (86). Remplir la table cities avec toutes les communes de la Vienne (environ 270 communes, source INSEE).

Écrire un script Python scraping/sirene_vienne.py qui interroge l'API Sirene de l'INSEE, filtre par département 86 et par codes NAF correspondant à nos catégories, et insère les résultats dans la table pros de Supabase. L'API Sirene est gratuite et documentée sur api.insee.fr.

Tester le script sur une seule catégorie (plombier par exemple) pour valider le flux avant de lancer sur toutes les catégories.

Lancer le script complet, vérifier le volume de fiches récupérées, nettoyer les doublons éventuels.

Optionnel pour enrichir : script scraping/pagesjaunes.py qui enrichit les fiches existantes avec le téléphone et le site web quand disponibles. À faire avec des délais entre requêtes et rotation d'user-agent pour éviter le blocage.

Livrable : base Supabase remplie avec un volume significatif de fiches pros, et requête de contrôle qui montre la répartition par catégorie.

## 11 bis. Sprint 7 — Moat IA (à faire après le sprint 6)

Objectif : empiler les fonctionnalités IA qui créent un avantage concurrentiel durable et difficile à rattraper. Ce sprint ne doit surtout pas être fait avant les sprints 1 à 6. Sans trafic, sans pros, sans flux de projets, ces fonctionnalités sont inutiles. Elles prennent tout leur sens une fois la plateforme vivante.

Fonctionnalité 1 : chat de qualification conversationnel pour le dépôt de projet. Remplacer le formulaire classique par un chat en langage naturel où l'IA pose 3 à 4 questions intelligentes pour extraire la catégorie, l'urgence, le budget, la zone, et les contraintes spécifiques. L'objectif est de passer d'un taux de complétion de formulaire classique (souvent 30 à 40 pourcent) à plus de 70 pourcent grâce à une expérience plus fluide. Techniquement, c'est un composant React côté client qui parle à une route API /api/chat qui utilise l'API Anthropic avec un system prompt dédié à la qualification.

Fonctionnalité 2 : enrichissement automatique des fiches pros. Pour chaque fiche scrappée, lancer un job qui va chercher le site web du pro s'il en a un, analyse les avis Google accessibles publiquement, et génère une description riche, une liste de spécialités, et des points forts. Claude fait tout le travail éditorial. Résultat : des fiches beaucoup plus qualitatives que celles des concurrents qui ont juste nom, adresse, téléphone.

Fonctionnalité 3 : matching sémantique des projets. Quand un projet arrive, au lieu de chercher des mots-clés dans les catégories, on utilise Claude pour comprendre sémantiquement le besoin et le matcher aux pros les plus pertinents. Exemple : "j'ai une infiltration dans ma cuisine" matche correctement à un plombier ou un couvreur selon le contexte, pas juste à la présence du mot "infiltration".

Fonctionnalité 4 : générateur de contenu blog SEO automatique. Créer une route /blog et un système qui génère automatiquement des articles SEO sur des requêtes de longue traîne (ex. "comment choisir son plombier à Poitiers", "prix moyen d'une femme de ménage en Vienne", "checklist avant de signer un devis d'artisan"). Un article par jour publié automatiquement. Cela démultiplie la surface SEO et renforce l'autorité du domaine.

Fonctionnalité 5 : estimations de prix dynamiques par zone. Pour chaque catégorie et chaque ville, Claude génère des fourchettes de prix indicatives basées sur les données disponibles. Affiché sur les pages listing, ça améliore le SEO (requêtes type "prix plombier Poitiers") et l'engagement utilisateur.

Livrable : une plateforme où chaque interaction clé est enrichie par l'IA, où le contenu SEO continue de croître automatiquement, et où les concurrents doivent copier 5 fonctionnalités distinctes pour rattraper le retard.

## 12. Points d'attention transversaux

RGPD : prévoir dès le début un lien "Supprimer ma fiche" sur chaque page de pro, qui envoie une demande de suppression traitée sous 48h. Ajouter une mention légale claire sur l'origine des données (sources publiques).

Performance : chaque page doit charger en moins de 2 secondes. Utiliser les mécanismes de cache de Next.js (ISR, revalidation) pour les pages listing.

Mobile first : la majorité du trafic viendra du mobile. Chaque écran doit être testé sur une largeur de 375px avant d'être considéré comme fini.

Accessibilité : contrastes corrects, attributs alt sur les images, navigation clavier fonctionnelle.

## 13. Commandes utiles

npm run dev : lancement du serveur de développement local.
npm run build : build de production.
npm run lint : vérification du code.
npx supabase gen types typescript --project-id XXX : génération des types TypeScript depuis le schéma Supabase.
vercel : déploiement manuel depuis le CLI.

## 14. Liens et ressources

Repo GitHub : à créer.
Hébergement actuel (à remplacer au sprint 6) : Hostinger.
Nom de domaine : workwave.fr, géré via Hostinger.
URL de prod : workwave.fr (après switch DNS au sprint 6).
URL de test : à définir lors du sprint 0.
Dashboard Supabase : à renseigner après création du projet.
Dashboard Vercel : à renseigner après création du projet.
Dashboard Stripe : à renseigner au sprint 5.
API Sirene : api.insee.fr/entreprises/sirene/V3
Documentation Next.js : nextjs.org/docs
Documentation Supabase : supabase.com/docs

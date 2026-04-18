# CLAUDE.md — Workwave V2

Ce fichier est lu automatiquement par Claude Code à chaque session. Il contient tout le contexte nécessaire pour travailler sur ce projet. À mettre à jour au fil des sprints.

---

## 0. Règles de travail Claude — PRIORITÉ ABSOLUE

Les 4 règles ci-dessous viennent de Boris Cherny, créateur de Claude Code. Elles s'appliquent SYSTÉMATIQUEMENT à toutes les sessions Workwave, sans exception, et passent avant toute autre instruction de ce fichier.

### Règle 1 — Mode plan d'abord
Écrire le plan AVANT toute ligne de code.

- Avant chaque tâche non-triviale : rédiger le plan complet (fichiers concernés, étapes ordonnées, vérification finale, risques).
- Si la session dérape en cours de route : STOP, refais le plan.
- Pas de code sans plan validé d'abord.
- Sur Workwave : utiliser ExitPlanMode pour soumettre les plans à l'utilisateur sur les changements d'architecture, ajouts de tables Supabase, modifications de routing, ou tout nouveau sprint.

### Règle 2 — Sous-agents pour le complexe
Déléguer aux sous-agents pour garder le contexte principal propre.

- Tâche complexe = toujours un sous-agent dédié (outil Agent avec subagent_type Explore, Plan, ou general-purpose).
- Garder le contexte principal léger et focus sur la décision.
- 1 tâche complexe = 1 sous-agent dédié.
- Sur Workwave, bons cas d'usage : audit SEO concurrentiel, exploration des queries Supabase existantes avant de modifier, recherche de tous les usages d'un composant avant un refactor, vérification de migration SQL.

### Règle 3 — Boucle d'auto-amélioration
Chaque erreur devient une règle persistante dans ce fichier.

- Erreur détectée → la transformer immédiatement en règle écrite.
- Sauvegarder la règle dans la section "Leçons apprises" ci-dessous.
- Session suivante : -80% d'erreurs sur le même sujet.
- Avant tout nouveau sprint : relire la section "Leçons apprises".

### Règle 4 — Prouve que ça marche
Pas de "done" sans preuve concrète.

- Ne JAMAIS marquer une tâche terminée sans preuve.
- Exécuter les tests + vérifier les logs à chaque fois.
- Pas de supposition : démontrer que ça fonctionne.
- Sur Workwave, preuves obligatoires selon le type de tâche :
  - **Code TS/React** : `npm run build` qui passe + `npx tsc --noEmit` (après `rm -rf .next` si erreurs dans `.next/types/`)
  - **SEO/UI** : vérification visuelle de la page rendue (capture ou description précise)
  - **Emails** : envoi en mode dry-run vers `workwave.france@gmail.com`
  - **Migrations Supabase** : test de la requête générée + vérification du schéma
  - **Commits** : `git status` après commit pour confirmer + `git log --oneline -3`
  - **Push** : confirmation du push réussi vers `origin/main`

---

## 0 bis. Leçons apprises (enrichir à chaque erreur détectée — Règle 3)

Section vivante. Avant chaque nouveau sprint, relire pour ne PAS reproduire les mêmes erreurs.

- **18/04/2026 — Bug espace dans BASE_URL** : un espace invisible (notamment nbsp `\u00A0`) dans `NEXT_PUBLIC_BASE_URL` casse les liens emails (`https://workwave.fr /artisan/...`). Toujours nettoyer avec `.replace(/\s+/g, "")` côté serveur, pas juste `.trim()`. Ne jamais supposer qu'une variable d'env est propre.
- **18/04/2026 — Vérification TypeScript** : `npx tsc --noEmit` peut remonter de fausses erreurs venant de `.next/types/` (cache Next 16). Réflexe : `rm -rf .next && npx tsc --noEmit` avant de conclure qu'il y a un problème de typage.
- **18/04/2026 — Audit sans données** : ne jamais affirmer une tendance d'un concurrent SEO sur la base d'une seule page. Échantillonner au moins 3-5 pages OU être explicite sur la limite ("vu sur 1 page seulement, à reconfirmer").
- **18/04/2026 — Logs scraping trompeurs** : le script `sirene_vienne.py` affiche "X pros insérés" mais ce X = nombre envoyés à upsert, PAS insertions nettes. Avec `ignore_duplicates=True`, beaucoup sont rejetés en silence. Toujours requêter Supabase APRÈS le scraping pour le vrai count net (`SELECT COUNT(*) FROM pros WHERE category_id = X`). Exemple réel : "1214 vitriers insérés" → 19 nets en base car NAF 4334Z déjà absorbé par peintres.
- **18/04/2026 — NAF Sirene trop génériques pour scraper précisément** : un seul code NAF couvre souvent plusieurs métiers (4329B = pisciniste + ascensoriste + autres ; 4334Z = peintre + vitrier ; 4321A = électricien + vidéosurveillance ; 8121Z = ménage + nettoyage pro). Conséquence : faux positifs massifs ("REGIONAL ASCENSEURS" classé pisciniste). Pour un scraping précis, soit (a) filtrer en post-traitement par regex sur le nom (PISCIN, VITRER, RAMON…), soit (b) enrichir via Apify Google Maps (le métier réel sort des avis), soit (c) accepter pour le SEO mais marquer la donnée comme "à valider". JAMAIS supposer qu'un NAF correspond 1:1 à un métier.
- **18/04/2026 — dotenv + tsx → toujours `override: true`** : `tsx` pré-injecte certaines variables `.env.local` en chaîne vide AU DÉMARRAGE du script (avant que `dotenv.config()` tourne). Sans `override: true`, dotenv refuse d'écraser ces vars vides (comportement par défaut). Symptôme : log "injected env (12) from .env.local" alors qu'il y en a 13 dans le fichier ; appel API qui échoue avec "Could not resolve authentication method" pour ANTHROPIC_API_KEY. Pattern obligatoire dans tous les scripts : `dotenv.config({ path: path.resolve(process.cwd(), ".env.local"), override: true })`. Le script `scripts/generate-seo-content.ts` utilise déjà ce pattern — l'utiliser comme référence quand on crée un nouveau script.
- **18/04/2026 — Next.js routes : un seul nom de param dynamique par position d'URL** : Next.js refuse `app/[metier]/[location]/page.tsx` ET `app/[metier]/[specialite]/[ville]/page.tsx` côte à côte. Erreur fatale au boot du dev server : `You cannot use different slug names for the same dynamic path ('location' !== 'specialite')`. La règle : à chaque NIVEAU d'URL, le segment dynamique doit avoir EXACTEMENT le même nom dans toutes les routes. Solution : nommer pareil partout (ex. garder `[location]` au niveau 2) et aliaser à l'intérieur de la page (`const specialite = location;` avec un commentaire). Toujours vérifier l'arborescence existante AVANT de créer un nouveau dossier dynamique. Le `npm run build` ne détecte PAS cette erreur — seul le dev server crash. Réflexe : démarrer le dev server après création d'une route dynamique.
- *(à enrichir au fil des sessions)*

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

## 8 bis. Philosophie de design

Workwave n'est pas un énième annuaire en bleu ciel. L'objectif visuel est de créer une expérience au niveau de Qonto, Linear, Stripe ou Apple, dans un secteur (les annuaires d'artisans) où tous les concurrents ont 10 ans de retard esthétique. Cette section est la référence absolue pour toutes les décisions de design sur tous les sprints. Claude Code doit la respecter scrupuleusement.

Principe général : moins c'est plus. Beaucoup d'espace blanc, typographie forte, couleur d'accent rare et ciblée, micro-interactions soignées. Un site qui respire.

Couleurs en mode clair :
- Fond principal : blanc pur (#FFFFFF)
- Fond secondaire : gris très clair (#FAFAFA) pour les sections alternées et les cards
- Texte principal : noir (#0A0A0A, pas du pur #000 pour la lisibilité)
- Texte secondaire : gris moyen (#6B7280)
- Bordures : gris très clair (#E5E7EB)
- Accent primaire : coral (#FF5A36) — utilisé uniquement pour les boutons primaires, liens actifs, badges importants, micro-animations. Jamais pour remplir des blocs entiers.
- Accent hover : coral foncé (#E63E1A)

Couleurs en mode sombre :
- Fond principal : noir profond (#0A0A0A, pas du pur #000)
- Fond secondaire : gris très foncé (#111111) pour les cards et sections
- Fond tertiaire : gris foncé (#1A1A1A) pour les éléments surélevés
- Texte principal : blanc cassé (#FAFAFA)
- Texte secondaire : gris clair (#9CA3AF)
- Bordures : gris foncé (#27272A)
- Accent primaire : coral légèrement désaturé (#FF6B4A) pour ne pas brûler les yeux
- Accent hover : coral (#FF5A36)

Typographie :
- Font principale : Geist Sans (déjà installée via Next.js)
- Font monospace : Geist Mono pour les SIRET, codes, identifiants
- Titres massifs : taille généreuse, tracking serré (letter-spacing négatif), font-weight 600 à 800
- Corps de texte : 16px minimum, line-height 1.6 pour la lisibilité
- Petits textes : 14px minimum, jamais en dessous

Espacements et rythme :
- Utiliser l'échelle Tailwind (4, 8, 12, 16, 24, 32, 48, 64, 96, 128)
- Privilégier les grands espaces : une section hero a du padding vertical de 96px ou plus sur desktop
- Les cards ont du padding interne de 24 à 32px
- Les grilles ont des gaps de 24 à 32px
- Ne jamais coller deux éléments, toujours de la respiration

Coins arrondis :
- Boutons : rounded-full ou rounded-xl (12px)
- Cards : rounded-2xl (16px)
- Inputs : rounded-xl (12px)
- Images : rounded-2xl (16px) ou rounded-3xl (24px) pour les grandes images hero

Ombres :
- Très subtiles en mode clair : shadow-sm par défaut, shadow-md au hover
- En mode sombre, remplacer les ombres par des bordures plus marquées (les ombres ne se voient pas sur fond noir)
- Jamais d'ombres dures ou dramatiques

Micro-interactions et animations :
- Toutes les transitions durent 200ms à 300ms avec un easing ease-out
- Les boutons ont un léger scale au hover (scale-[1.02]) et un changement de couleur
- Les cards ont une élévation subtile au hover (translate-y de -2 ou -4px)
- Les liens ont une underline qui apparaît en slide from left
- Les icônes peuvent avoir une rotation ou translation légère au hover
- Les transitions de page utilisent les view transitions de Next.js
- Les chiffres importants (ex. "20 330 professionnels") s'animent en compteur au scroll

États de chargement :
- Jamais de spinner tournant générique
- Toujours des skeletons qui miment la forme du contenu final
- Les skeletons ont une animation shimmer subtile (animate-pulse suffit au début)

États vides :
- Une illustration simple ou une icône grande
- Un message clair et humain, jamais technique ("Aucun pro trouvé" plutôt que "Empty result set")
- Une action de rebond (bouton pour élargir la recherche par exemple)

Boutons :
- Primaire : fond coral, texte blanc, rounded-full ou rounded-xl, padding généreux, font-weight 600
- Secondaire : fond transparent, bordure grise, texte noir (ou blanc en mode sombre)
- Tertiaire : pas de fond, pas de bordure, juste du texte avec underline au hover
- Taille minimum : 44px de haut pour l'accessibilité mobile

Mode sombre :
- Switch accessible via un bouton dans le header (icône soleil/lune)
- Persistance en localStorage
- Détection automatique de la préférence système au premier chargement
- Transition douce entre les deux modes (300ms)
- Implémentation via next-themes

Composants signature à soigner particulièrement :
- Le header : logo à gauche, nav au centre, switch mode + CTA à droite. Background transparent qui devient blanc/noir avec blur au scroll.
- Le hero de la page d'accueil : titre massif (text-6xl ou 7xl sur desktop), sous-titre élégant, barre de recherche proéminente, et un compteur animé ("20 330 professionnels disponibles en Vienne").
- Les cards de pros : photo ou initiale dans un cercle coloré, nom en gras, catégorie en badge, ville en texte secondaire, description tronquée, hover avec élévation.
- La barre de recherche : large, arrondie, avec une icône de loupe, placeholder engageant ("Plombier à Poitiers ?"), et des suggestions qui apparaissent en dropdown élégant.

Ce qu'on ne fait jamais :
- Pas de gradients criards (les seuls gradients autorisés sont très subtils)
- Pas d'emoji dans l'interface (sauf cas très particulier validé)
- Pas de stock photos génériques de chantiers ou d'artisans qui sourient
- Pas de témoignages inventés
- Pas d'ombres dramatiques ou colorées
- Pas de plus de 2 polices différentes
- Pas de texte en dessous de 14px
- Pas de contrastes insuffisants (tous les textes doivent passer WCAG AA minimum)

## 9. État d'avancement

Sprint 0 — Setup : terminé.
Sprint 1 — Base de données et scraping : terminé (20 330 pros, 265 villes, 35 catégories, Vienne 86).
Sprint 2 — Pages annuaire publiques : terminé.
Sprint 2.5 — Polish UX premium : terminé (mode clair/sombre, design premium).
Sprint 3 — Génération SEO programmatique : terminé (588 pages générées, coût 12 dollars).
Sprint 4 — Dépôt de projet et qualification IA : terminé (formulaire, qualification Claude, email admin via Resend).
Sprint 5 — Comptes pros et abonnements : cadré en détail (voir section 11 quater), à démarrer.
Sprint 6 — Switch DNS : à démarrer.
Sprint 7 — Moat IA (superpouvoirs) : à démarrer après sprint 6.

Mini-sprint à faire : re-scraping Sirene pour les catégories non-BTP (services à domicile et aide à la personne). Le scraping initial (Sprint 1) ne couvrait que les codes NAF du BTP. Il faut relancer le script scraping/sirene_vienne.py avec les codes NAF correspondant aux catégories "domicile" et "personne" (ménage, garde d'enfants, soutien scolaire, aide aux seniors, jardinage, etc.) pour remplir ces verticaux qui sont actuellement vides ou quasi-vides.

### Phase A SEO (cours) — état au 18/04/2026

Branche de travail SEO additionnelle pour densifier la couverture organique avant le sprint 5.

- ✓ A0 (commit 419c564) : 7 nouvelles catégories (pisciniste, vitrier, ramoneur, vidéosurveillance, nettoyage-pro, cuisiniste, cheministe).
- ✓ A1 (commit 9b447c6) : page racine `/[metier]` proximity (géoloc + fallback ville, 35 pages).
- ✓ A2 (commit a7da115) : 40 sous-spécialités × top 10 villes Vienne = 395 pages indexables (`/[metier]/[location]/[ville]`, schema Service+ItemList+FAQPage+BreadcrumbList).
- ✓ A3 (commit 206e844) : 15 articles blog "prix" long-tail (~123k vol/mois cible, ex. "prix construction piscine 2026").
- ⏸ **PAUSE 18/04/2026** : interruption pour investiguer 8140 URLs noindex remontées par Google Search Console (URL marquée "noindex" dans le rapport d'indexation). Suspicion : pages `/[metier]/[ville]` pour petites communes sans pros (logique noindex auto si `prosCount === 0` dans `app/(public)/[metier]/[location]/page.tsx` et la nouvelle route spécialités). À confirmer en GSC.

Au reprise après l'investigation noindex :
- A4 (à définir) : nouvelle vague long-tail (plus de guides prix ? autres types d'articles ? expansion sous-spécialités à d'autres métiers ?).
- Décider du sort des 8140 URLs noindex (laisser tel quel = signal qualité OK, ou les transformer en 404 pour deindex plus rapide, ou les sortir complètement du sitemap).
- Mini-sprint scraping Sirene non-BTP (cf. ci-dessus).
- Apify enrichment des emails pros (sur pause depuis "on fait option c phase seo on vera ensuite pour apify").

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

## 11 ter. Sprint 2.5 — Polish UX premium

Objectif : transformer l'annuaire fonctionnel du Sprint 2 en une expérience premium au niveau de Qonto, Linear ou Apple. Ce sprint ne change rien aux fonctionnalités, il change la qualité perçue. Toutes les décisions de design doivent respecter la section 8 bis Philosophie de design.

Étape 1 : installer et configurer next-themes pour le mode sombre. Créer un ThemeProvider dans app/providers.tsx et l'envelopper autour de children dans app/layout.tsx. Créer un composant ThemeToggle avec icônes soleil et lune, animation de rotation au switch, persistance automatique.

Étape 2 : créer le fichier lib/design-tokens.ts qui exporte toutes les valeurs de design (couleurs clair et sombre, espacements, durées de transition, rayons, ombres). Ce fichier est la source de vérité. Adapter tailwind.config.ts pour utiliser ces tokens.

Étape 3 : refondre le Header. Logo Workwave à gauche (noir en mode clair, blanc en mode sombre), navigation au centre (Accueil, Rechercher, Déposer un projet, Pro), et à droite le ThemeToggle plus un bouton CTA coral "Trouver un pro". Background transparent au chargement, puis background blanc/noir avec backdrop-blur quand on scroll. Hauteur 72px. Animation fluide.

Étape 4 : refondre la page d'accueil. Hero avec titre massif (text-7xl sur desktop, text-4xl sur mobile), "Trouvez un pro de confiance près de chez vous." sur deux lignes avec le point en coral. Sous-titre élégant en gris. Barre de recherche proéminente (rounded-full, h-16, shadow subtile) avec placeholder engageant et icône de loupe. Compteur animé sous la recherche "20 330 professionnels disponibles en Vienne" qui défile en count-up au premier affichage. Section catégories avec cards minimalistes arrondies. Section top villes avec un design épuré.

Étape 5 : refondre le composant ProCard. Cercle avec l'initiale du pro sur fond coral désaturé (ou photo si disponible), nom en font-semibold text-lg, badge de catégorie en coral discret (bg-coral/10 text-coral), ville en gris, description tronquée à 2 lignes. Hover : translate-y -4px, shadow-md, bordure qui passe en coral. Transition 250ms ease-out.

Étape 6 : refondre les pages listing [metier]/[location]. H1 massif, fil d'Ariane élégant avec séparateurs chevron fins, filtres propres (pas des selects moches, des boutons pills ou un dropdown custom), grille responsive (1 col mobile, 2 tablet, 3 desktop), pagination minimaliste en bas.

Étape 7 : refondre la fiche pro /artisan/[slug]. Layout en deux colonnes sur desktop : à gauche les infos (nom massif, catégorie en badge, description, infos de contact dans des cards élégantes), à droite une colonne sticky avec un CTA "Contacter ce pro" et les infos essentielles (SIRET, date de création). Mobile : une seule colonne. Section "Pros similaires dans la zone" en bas avec 3 ProCard.

Étape 8 : créer les skeletons. ProCardSkeleton élégant (cercle, lignes de texte), PageListingSkeleton, PageProSkeleton. Utiliser animate-pulse avec des fonds gris qui respectent le mode actuel.

Étape 9 : créer les états vides. Une illustration SVG minimaliste (un cercle avec une icône dedans suffit), un message humain, un CTA pour rebondir.

Étape 10 : ajouter les micro-interactions. Toutes les transitions à 250ms ease-out. Tous les boutons avec hover scale et changement de couleur. Tous les liens avec underline slide. Toutes les cards avec élévation au hover.

Étape 11 : refondre le Footer. Minimal, noir en mode clair inversé en mode sombre, avec logo Workwave en gros, colonnes de liens (Particuliers, Pros, Entreprise, Légal), et une petite ligne en bas avec le copyright.

Étape 12 : tester toute l'application en mode clair et mode sombre sur mobile (375px), tablet (768px) et desktop (1280px). Vérifier que rien ne casse, que les contrastes passent WCAG AA, que les animations sont fluides, que le switch de thème est instantané sans flash blanc.

Livrable : une application qui donne immédiatement le sentiment "wow, c'est pas comme les autres" dès l'arrivée sur la page d'accueil. Un visiteur doit pouvoir dire "on dirait Qonto ou Linear" en regardant le site.

## 11 quater. Sprint 5 — Comptes pros, réclamation, abonnements Stripe, dashboard pro

Ce sprint est le plus important du projet. Il transforme Workwave d'annuaire passif en plateforme qui génère des revenus. Toutes les règles ci-dessous ont été décidées en amont et doivent être respectées strictement par Claude Code.

### Objectif global

Permettre à un professionnel de réclamer sa fiche scrappée, créer un compte, configurer ses préférences, recevoir les leads routés automatiquement, et souscrire un abonnement payant via Stripe. Créer un dashboard pro premium à la hauteur de la philosophie de design (section 8 bis). Le dashboard doit donner l'impression d'un produit fini et complet, pas d'un MVP.

### Bloc A — Parcours de réclamation de fiche

Niveau de sécurité : vérification SIRET + code email (niveau 2).

Flux complet :
1. Sur la fiche publique d'un pro non réclamé, un bouton visible "C'est mon entreprise — Réclamer cette fiche" en coral.
2. Au clic, ouverture d'un formulaire de réclamation demandant : email professionnel, SIRET (pré-rempli avec celui de la fiche à des fins d'affichage mais l'utilisateur doit le saisir pour prouver qu'il le connaît), nom du gérant, téléphone.
3. Validation serveur : le SIRET saisi doit matcher exactement le SIRET en base pour cette fiche. Si non-match, erreur claire sans révéler la valeur attendue.
4. Envoi d'un code de vérification à 6 chiffres par email via Resend. Le code expire au bout de 15 minutes.
5. Page de saisie du code. 3 tentatives maximum avant blocage pendant 1h.
6. Si code correct, création automatique d'un compte utilisateur Supabase Auth (magic link pour l'email de login futur). Liaison de la fiche via claimed_by_user_id. Redirection vers l'onboarding du dashboard pro.

Gardes-fous :
- Si une fiche est déjà réclamée (claimed_by_user_id non null), blocage immédiat avec message "Cette fiche a déjà été réclamée. Si vous pensez qu'il y a une erreur, contactez le support" et alerte email admin.
- Si un même email tente de réclamer plus de 3 fiches avec des SIRET différents en moins de 7 jours, alerte admin et blocage temporaire du compte en attente de validation manuelle.
- Log de toutes les tentatives de réclamation (succès et échecs) dans une table claim_attempts pour audit.

### Bloc B — Modèle d'abonnement Stripe

Un seul tarif au démarrage, sans paliers.

Offre unique :
- Workwave Pro : 39 euros par mois, leads illimités, toutes les fonctionnalités incluses.

Deux formules de facturation :
- Mensuel : 39 euros par mois, sans engagement, résiliation libre et instantanée effective à la fin de la période en cours.
- Annuel : 390 euros par an (équivalent 32,50 euros par mois, soit 2 mois offerts). Résiliation possible à tout moment avec remboursement au prorata des mois non utilisés calculé automatiquement par Stripe.

Essai gratuit :
- 14 jours d'essai gratuit à l'inscription, sans carte bancaire requise.
- Pendant l'essai, le pro reçoit les leads normalement.
- Email automatique au jour 13 : "Votre essai se termine demain, ajoutez votre carte pour continuer à recevoir les leads."
- Au jour 14 sans CB ajoutée : le pro passe en statut "free" (fiche reste en ligne, mais plus de leads reçus).
- Le pro peut à tout moment activer son abonnement depuis le dashboard.

Moyens de paiement :
- Carte bancaire uniquement au démarrage (Stripe Checkout).
- SEPA à ajouter plus tard.

Intégration Stripe :
- Utiliser Stripe Checkout pour la souscription initiale (hébergé par Stripe, conformité PCI automatique).
- Utiliser Stripe Customer Portal pour la gestion (changement de carte, changement de formule, résiliation, téléchargement de factures). Stripe gère toute l'UI nativement, ne pas réinventer.
- Webhooks Stripe à écouter : checkout.session.completed, customer.subscription.updated, customer.subscription.deleted, invoice.payment_failed, invoice.payment_succeeded.
- Smart Retries activées sur les échecs de paiement (3 tentatives étalées sur 7 jours).
- Stockage en base : stripe_customer_id, stripe_subscription_id, subscription_status (trialing, active, past_due, canceled, free), current_period_end dans la table pros.

### Bloc C — Routing des leads

Objectif : à chaque projet déposé, envoyer automatiquement le lead à 3 pros sélectionnés parmi ceux qui matchent.

Règles d'éligibilité (filtres durs) :
- Le pro doit être abonné actif (subscription_status in trialing ou active).
- Le pro doit couvrir la catégorie du projet (catégorie principale ou une des catégories secondaires activées).
- Le pro doit couvrir géographiquement la ville du projet (distance en km depuis son adresse inférieure ou égale à son rayon d'intervention configuré).
- Le pro ne doit pas être en pause (statut paused_until dans le futur).
- Le budget du projet doit être supérieur ou égal au budget minimum accepté du pro.

Score composite pour classer les pros éligibles et sélectionner les 3 meilleurs :
- Distance géographique : 50% du score. Plus le pro est proche, plus le score est élevé. Formule proposée : score_distance = 1 - (distance / rayon_intervention).
- Équité des leads reçus : 30% du score. Un pro qui a reçu peu de leads dans les 30 derniers jours est priorisé. Formule : score_equite = 1 - (leads_recus_30j / leads_recus_max_30j_du_pool).
- Ancienneté de l'abonnement : 20% du score. Un pro abonné depuis plus longtemps a une légère priorité. Formule : score_anciennete = min(1, mois_depuis_abonnement / 12).

Score final : score = 0,5 * score_distance + 0,3 * score_equite + 0,2 * score_anciennete.

Les 3 pros avec le score le plus élevé reçoivent le lead en parallèle.

Cas particulier : si moins de 3 pros éligibles, envoyer à tous ceux qui matchent. Si zéro pro éligible, le projet passe en statut "unrouted", email d'alerte admin envoyé, et message neutre au particulier "Votre demande est en cours de traitement, un professionnel vous contactera dans les 24h".

Chaque envoi de lead est enregistré dans la table project_leads avec timestamp, statut initial "sent", et référence au projet et au pro.

### Bloc D — Paramètres et profil du pro

Tous les champs ci-dessous sont éditables depuis la section "Ma fiche" du dashboard pro, sauf mention contraire.

Identité et présentation publique :
- Nom commercial (obligatoire)
- Nom du gérant
- SIRET (non modifiable, vérifié à la réclamation)
- Description riche (max 500 caractères)
- Logo ou photo de profil
- Galerie photos de réalisations (max 10 photos au Sprint 5)
- Année de création de l'entreprise
- Adresse du siège
- Téléphone principal (obligatoire)
- Email de contact public (obligatoire)
- Site web
- Réseaux sociaux (Instagram, Facebook, LinkedIn)
- Horaires d'ouverture (par jour de la semaine)
- Langues parlées
- Certifications et labels (liste prédéfinie à cocher : RGE, Qualibat, Qualigaz, QualiPAC, QualiPV, QualiSol, QualiBois, Artisan d'Art, Eco-Artisan, Handibat, PRO de la Performance Énergétique)
- Numéro de certification RGE (optionnel, champ texte)
- Assurance responsabilité civile professionnelle (oui/non)
- Garantie décennale (oui/non)
- Modes de paiement acceptés (CB, virement, chèque, espèces)
- Devis gratuit (oui/non)

Services proposés :
- Catégorie principale (une seule)
- Catégories secondaires (jusqu'à 3)
- Spécialités par catégorie (liste prédéfinie cochable, à construire par métier)
- Tarif horaire indicatif (optionnel)
- Tarif de déplacement (optionnel)
- Budget minimum accepté pour un projet (filtre de routing)
- Disponibilité urgences (oui/non)

Préférences leads (Sprint 5 minimum) :
- Rayon d'intervention en km depuis l'adresse (slider 5-100 km, défaut 20 km)
- Catégories activées/désactivées pour la réception de leads (parmi ses catégories)
- Bouton "Mettre en pause mes leads" avec sélecteur de date de reprise automatique

Badge "Profil complet" affiché sur la fiche publique quand au moins 80% des champs sont remplis.

Modération : publication directe, tracking admin a posteriori.

Labels et certifications : confiance au démarrage, mention dans les CGU engageant le pro sur la véracité de ses déclarations. Vérification renforcée plus tard.

### Bloc E — Dashboard pro en 6 sections

Navigation : sidebar latérale sur desktop, bottom-bar fixe sur mobile. Respect strict de la section 8 bis Philosophie de design.

Section 1 — Accueil (tableau de bord)

Message de bienvenue personnalisé "Bonjour prénom, voici votre activité cette semaine".

Trois cartes de stats en haut avec compteurs animés : leads reçus ce mois, leads contactés, taux de réponse en pourcentage. Évolution vs mois précédent en petit.

Section "Derniers leads reçus" avec les 5 derniers projets et badges de statut (nouveau en coral, vu en gris, contacté en vert). Clic mène à la section Leads.

Card "Statut de votre abonnement" à droite : statut actuel, date de prochaine facturation, CTA contextuel.

Card "Conseil du moment" avec tip motivant.

Section 2 — Leads reçus

Liste chronologique avec filtres : statut, période, catégorie.

Chaque lead en card avec badge statut, prénom du particulier (coordonnées complètes cachées tant qu'on n'a pas ouvert le lead), ville, catégorie, urgence, budget, date, aperçu description.

Page détail du lead : description intégrale, coordonnées complètes (nom, email, téléphone), qualification IA, boutons "Marquer comme contacté" et "Marquer comme non pertinent".

Analytics important : le clic d'ouverture d'un lead est tracé (lead vu), ainsi que les actions qui suivent.

Section 3 — Ma fiche

Formulaire d'édition de tous les champs du Bloc D, organisé par sections pliables.

Barre de progression "Profil complété à X%".

Suggestions contextuelles d'amélioration : "Ajoutez une description pour augmenter votre visibilité".

Aperçu en temps réel de la fiche publique, avec lien "Prévisualiser en grand" qui ouvre dans un nouvel onglet.

Section 4 — Préférences leads

Rayon d'intervention (slider 5-100 km).

Catégories activées/désactivées.

Budget minimum accepté.

Disponibilité urgences.

Bouton "Mettre en pause mes leads" avec sélecteur de date de reprise automatique.

Zone d'aperçu dynamique : "Avec vos réglages actuels, vous auriez reçu X leads le mois dernier" (basé sur l'historique des projets dans la zone). C'est un différenciateur fort, à soigner particulièrement.

Section 5 — Abonnement et facturation

Statut actuel (essai gratuit, abonné mensuel, abonné annuel, suspendu, gratuit).

Date de prochaine facturation, montant de la prochaine facture.

Bouton "Changer de formule" pour basculer mensuel/annuel avec le gain affiché.

Bouton "Mettre à jour ma carte" qui ouvre le Stripe Customer Portal.

Historique des factures avec téléchargement PDF (fourni par Stripe).

Bouton "Résilier mon abonnement" en bas, accessible mais pas mis en avant. Modale de confirmation avec enquête de sortie ("Pourquoi partez-vous ?") : choix rapides (trop cher, pas assez de leads, qualité des leads, autre raison) et champ libre. Cette data est stockée en base. La résiliation prend effet à la fin de la période en cours. La fiche publique reste en ligne gratuitement après résiliation.

Section 6 — Paramètres du compte

Email de connexion (modifiable avec vérification).

Mot de passe (ou Magic Link Supabase).

Préférences de notifications (au Sprint 5 : simple toggle email activé/désactivé, plus fin plus tard).

Suppression du compte (action dangereuse, double confirmation).

Exigences transversales du dashboard :
- Design premium strict selon section 8 bis.
- Mode clair et sombre fonctionnels.
- Responsive mobile first, testé à 375px.
- Animations douces, skeletons de chargement, pas de formulaires moches.
- Le dashboard doit être totalement utilisable depuis un smartphone.

### Bloc F — Gestion des cas tordus

Tous ces cas doivent être codés dès le Sprint 5, pas traités en correctif plus tard.

Cas 1 — Échec de paiement Stripe
Activer Stripe Smart Retries (3 tentatives sur 7 jours). Envoyer des emails automatiques à J1, J3, J7 au pro (templates Resend). Alerter l'admin en parallèle. À J7 si échec, passer le pro en subscription_status = "past_due" puis "canceled" : fiche reste en ligne, arrêt des leads. Le pro peut réactiver à tout moment.

Cas 2 — Résiliation anticipée d'un abonnement annuel
Flux automatisé via Stripe. Affichage du montant remboursé calculé au prorata avant confirmation. Validation du pro, remboursement automatique via Stripe Refunds API, mise à jour du statut en base.

Cas 3 — Fiche réclamée par plusieurs personnes
Si une fiche est déjà claimed_by_user_id non null, blocage immédiat de toute nouvelle tentative. Alerte email admin avec les deux profils (premier réclamant et nouveau tentant). Arbitrage manuel via dashboard admin. Le premier arrivé est prioritaire par défaut.

Cas 4 — Fraude pro (faux labels, faux SIRET, description mensongère)
Politique en 3 niveaux : 
- Niveau 1 (fraude mineure) : retrait du label frauduleux par l'admin + email d'avertissement au pro.
- Niveau 2 (fraude modérée) : suspension temporaire de la réception des leads + demande de justificatifs par email.
- Niveau 3 (fraude grave, usurpation) : suspension définitive du compte + passage de la fiche en brouillon + remboursement de l'abonnement en cours.
Toutes ces actions sont manuelles par l'admin au Sprint 5. Automatisation IA au Sprint 7.

Cas 5 — Spam de projets par un particulier
Rate limiting et honeypot déjà en place depuis le Sprint 4. En plus au Sprint 5 : la qualification IA retourne un champ "suspicion_score" (0-100) basé sur la cohérence de la description. Si score supérieur à 70, le projet est stocké mais avec un flag "suspicious" et n'est PAS routé automatiquement. Il apparaît dans le dashboard admin pour validation manuelle.

Cas 6 — Pro non réactif
Calculer automatiquement le "taux de réponse" du pro : pourcentage de leads marqués "contacté" dans les 48h après réception, sur les 10 derniers leads. Si taux inférieur à 50% : déclassement du pro dans le score de routing (multiplicateur 0,5 sur son score). Si taux inférieur à 25% : suspension temporaire de la réception + email d'alerte au pro. Le pro peut contester ou réactiver manuellement.

Cas 7 — Suppression projet particulier (RGPD)
Lien "Supprimer ma demande" dans la page de confirmation du Sprint 4 ET dans l'email de confirmation au particulier. Le lien contient un token sécurisé unique qui permet la suppression sans login. Clic = suppression immédiate du projet en base + rétractation automatique vers les pros qui l'ont reçu ("Ce projet a été retiré par le demandeur, merci de ne pas le contacter" via email Resend).

Cas 8 — Suppression fiche pro (RGPD)
Sur chaque fiche publique, lien "Supprimer ma fiche". Formulaire de vérification : SIRET + email. Code de vérification envoyé. Si validé, la fiche est désactivée dans les 48h (statut soft-deleted). Notification admin pour contrôle. Si le pro avait un abonnement actif, l'abonnement est résilié automatiquement avec remboursement au prorata.

Cas 9 — Conflits pro/particulier après mise en relation
Workwave n'arbitre pas. Mention explicite dans les CGU et dans chaque email de lead : "Workwave est un simple intermédiaire d'information. Les devis, contrats, paiements et prestations sont de la responsabilité exclusive du professionnel et du particulier. En cas de litige, merci de vous référer aux recours classiques (médiateur de la consommation, tribunal de proximité)."

### Schéma de base de données pour le Sprint 5

Nouvelles tables à créer ou colonnes à ajouter :

Table pros (modifier, ajouter colonnes) :
- claimed_by_user_id uuid references auth.users, nullable
- claimed_at timestamptz, nullable
- stripe_customer_id text, nullable
- stripe_subscription_id text, nullable
- subscription_status text, default 'none', check in (none, trialing, active, past_due, canceled, free, suspended)
- subscription_plan text, nullable, check in (monthly, annual)
- trial_ends_at timestamptz, nullable
- current_period_end timestamptz, nullable
- description text
- logo_url text
- photos jsonb default '[]'
- founded_year int
- website text
- instagram text
- facebook text
- linkedin text
- opening_hours jsonb
- languages jsonb
- certifications jsonb default '[]'
- rge_number text
- has_rc_pro boolean default false
- has_decennale boolean default false
- payment_methods jsonb default '[]'
- free_quote boolean default true
- secondary_category_ids int[]
- specialties jsonb default '[]'
- hourly_rate numeric, nullable
- travel_fee numeric, nullable
- min_budget numeric, nullable
- urgency_available boolean default false
- intervention_radius_km int default 20
- enabled_category_ids int[]
- paused_until timestamptz, nullable
- profile_completion int default 0 (calculé)
- response_rate numeric, nullable (calculé)

Table claim_attempts (nouvelle) :
- id serial
- siret text
- email text
- ip text
- success boolean
- error_reason text
- created_at timestamptz

Table project_leads (existante, à enrichir) :
- Ajouter colonne opened_at timestamptz nullable
- Ajouter colonne contacted_at timestamptz nullable
- Ajouter colonne not_relevant boolean default false
- Ajouter colonne status text check in (sent, opened, contacted, not_relevant, expired)

Table projects (existante, à enrichir) :
- Ajouter colonne status check in (new, routed, unrouted, suspicious, deleted)
- Ajouter colonne suspicion_score int, nullable
- Ajouter colonne deletion_token text, nullable (pour suppression RGPD)

Table cancellation_feedback (nouvelle) :
- id serial
- pro_id int references pros(id)
- reason text (trop cher, pas assez de leads, qualité, autre)
- feedback text
- created_at timestamptz

### Ordre d'implémentation recommandé pour Claude Code

Phase 1 — Fondations
- Migrations SQL pour enrichir pros, projects, project_leads, créer claim_attempts et cancellation_feedback.
- Installation des dépendances (stripe, @stripe/stripe-js).
- Variables d'environnement (STRIPE_SECRET_KEY, STRIPE_WEBHOOK_SECRET, STRIPE_PRICE_MONTHLY_ID, STRIPE_PRICE_ANNUAL_ID).
- Configuration Supabase Auth (magic link).

Phase 2 — Réclamation de fiche
- Page /pro/reclamer/[slug]
- Server Action de vérification SIRET et envoi du code
- Page de saisie du code
- Création automatique du compte et liaison de la fiche

Phase 3 — Dashboard pro structure
- Layout /pro/dashboard avec sidebar et bottom-bar
- Middleware d'authentification pour toutes les routes /pro/dashboard/*
- Pages vides des 6 sections

Phase 4 — Dashboard pro contenu
- Section Accueil avec stats
- Section Leads avec filtres et détail
- Section Ma fiche avec tous les champs éditables
- Section Préférences leads avec l'aperçu dynamique
- Section Paramètres

Phase 5 — Stripe
- Création des produits et prix dans Stripe (manuellement par l'admin au début)
- Intégration Stripe Checkout pour la souscription
- Intégration Stripe Customer Portal pour la gestion
- Webhooks Stripe (route /api/stripe/webhook)
- Section Abonnement du dashboard
- Essai gratuit automatique à la réclamation
- Emails automatiques J13

Phase 6 — Routing des leads
- Fonction de matching avec score composite
- Intégration dans le flux du Sprint 4 (remplacer l'email admin par l'envoi automatique aux pros)
- Email de lead aux pros sélectionnés
- Statut "unrouted" si aucun pro éligible

Phase 7 — Cas tordus
- Gestion des échecs de paiement (webhooks)
- Suppression RGPD projets et fiches
- Calcul du taux de réponse et déclassement auto
- Flag suspicious sur qualification IA

Phase 8 — Polish et tests
- Vérification de chaque parcours utilisateur de bout en bout
- Tests en mode clair et sombre
- Tests responsive 375px / 768px / 1280px
- Tests des cas d'erreur (carte refusée, SIRET invalide, etc.)

### Prérequis avant de démarrer

- Créer un compte Stripe en mode test (https://dashboard.stripe.com/register)
- Récupérer les clés API de test (publishable et secret)
- Créer un produit "Workwave Pro" avec deux prix (mensuel 39 EUR et annuel 390 EUR)
- Activer les Smart Retries dans les paramètres de facturation
- Configurer l'URL du webhook (sera fournie par Claude Code au moment de la Phase 5)
- Supabase Auth activé et configuré en mode magic link

### Livrable final du Sprint 5

Un pro peut :
1. Trouver sa fiche via Google, cliquer "C'est mon entreprise", la réclamer.
2. Accéder à son dashboard premium avec ses stats.
3. Compléter sa fiche publique avec tous les champs.
4. Configurer ses préférences de leads (rayon, catégories, budget min).
5. Recevoir automatiquement 3 leads pertinents quand un particulier dépose un projet qui matche.
6. Activer son abonnement en un clic avec essai gratuit 14 jours sans CB.
7. Gérer son abonnement (changer de formule, mettre à jour sa carte, résilier) via Stripe Customer Portal.
8. Mettre en pause sa réception temporairement.
9. Accéder à toutes les fonctionnalités depuis son smartphone.

Un particulier peut :
1. Déposer un projet (flux Sprint 4 inchangé côté UI).
2. Son projet est automatiquement routé aux 3 pros les mieux matchés.
3. Être contacté directement par les pros (hors plateforme).

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

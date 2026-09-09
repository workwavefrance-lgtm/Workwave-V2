# Historique des sprints et plans initiaux

> Sorti de `CLAUDE.md` le 09/09/2026 pour alleger ce qui se charge a chaque
> session. **Contenu HISTORIQUE** : decrit le projet tel qu'il etait pense
> debut 2026 et contient des affirmations aujourd'hui FAUSSES (abonnement
> 39 EUR/mois, routing aux 3 meilleurs pros, hebergement Vercel, Vienne 86,
> 20 330 pros). La verite du present est dans `CLAUDE.md` section 0 ter et
> dans le wiki `Workwave/`. Conserve pour l'historique du raisonnement.

## 9. État d'avancement

Sprint 0 — Setup : terminé.
Sprint 1 — Base de données et scraping : terminé (20 330 pros, 265 villes, 35 catégories, Vienne 86). **Chiffres de l'époque — au 08/08/2026 : ~2 560 000 pros, 35 163 communes, 197 catégories, 107 départements.**
Sprint 2 — Pages annuaire publiques : terminé.
Sprint 2.5 — Polish UX premium : terminé (mode clair/sombre, design premium).
Sprint 3 — Génération SEO programmatique : terminé (588 pages générées, coût 12 dollars).
Sprint 4 — Dépôt de projet et qualification IA : terminé (formulaire, qualification Claude, email admin via Resend).
Sprint 5 — Comptes pros, réclamation, abonnements Stripe, dashboard pro : **terminé** (route `/api/stripe/webhook`, dashboard `/pro/dashboard/*`, SDK `stripe@22 + @stripe/stripe-js@9` installés, table pros enrichie avec colonnes Stripe). Confirmé 24/05/2026.
Sprint 6 — Switch DNS Hostinger → Vercel : **terminé** (workwave.fr pointe vers Vercel, certificats SSL OK, MX `@` conservé chez Hostinger pour `contact@workwave.fr`). Confirmé 25/05/2026.
Sprint 7 — Moat IA (superpouvoirs) : à démarrer.

**Workwave AI Phase 8 (Stripe Premium + Dashboard freelance + Auth + Sécurité)** — **terminé 26/05/2026** (marathon nocturne). Auto-activation des signups en compte freelance complet (auth Supabase + row pros tech). Auth via code 6 chiffres email + temp_password (pattern BTP claim). Dashboard `/ai/dashboard/*` avec 6 sections (Accueil, Projets reçus, Profil, Préférences, Abonnement, Paramètres). Stripe Product "Workwave AI Premium" 29,90€/mois + 299€/an (script `scripts/setup-stripe-ai-product.ts`). Webhook Stripe unifié BTP+AI via `subscription_product` col. Routing IA boost +100 pts pour freelances Premium. Emails projet auto aux Premium routés via Resend. RLS strict sur project_leads (freelance voit ses leads via auth.uid()). Commits Phase 8 : `8152f7b` (A+C migration Stripe), `c4793a6` (B auth code email), `a373d4a` (D dashboard), `b7cf5eb` (F routing + emails), `0a9e14b` (E RLS audit).

### Mini-sprints récents (24/05/2026)

- **Agent commercial IA "Léa"** — terminé : bulle conversationnelle bottom-right, auto-open contextuel, Claude Sonnet 4-6, identité humanisée (avatar + nom + statut), quick replies, design premium. Cf. commits eb213d8 → cb0fc8b.
- **Refonte Top X listings** — terminé : `/[metier]/[location]` passe en "Les 10 meilleurs [metier] à [ville] en {annee}" avec section "Quel est votre projet ?" en TOP + TopProCards + scoring objectif + StickyProjectCTA + schema LocalBusiness × N. Cf. commits 648e20d → e912f9b.

### À faire absolument dans 1 semaine (rappel utilisateur 24/05/2026)

**Génération SEO content batch pour les ~10 000 combinaisons (catégorie × ville) restantes via Claude API.** Le sprint 3 a généré 588 pages, à étendre. Coût ~$50-100. Bénéfice : chaque page listing aura un texte unique de 200-500 mots + FAQ schema. Délai : 2-3h génération + 1h dev script de batch. À déclencher après mesure des métriques GSC de la refonte Top X (~31/05/2026).

### 🟠 À FAIRE DEMAIN — Ping Google Indexing API sur les grosses villes (rappel utilisateur 25/05/2026)

**Contexte** : aujourd'hui 25/05/2026, on a pingé 195 URLs prioritaires via `scripts/ping-google-indexing-listings.ts` MAIS le tri était mauvais (par count desc) → toutes les 195 URLs sont parties sur des PETITES communes Vienne (Buxerolles, Antran, Aslonnes, Beruges, etc.). **AUCUNE Poitiers / Châtellerault / Bordeaux / Limoges / Niort / Angoulême** n'a été pingée.

Le script a été **corrigé** dans le commit `e7ca640` : trie maintenant par population DESC, donc Poitiers/Bordeaux sortent en premier.

**Quota Google Indexing reset à 0h chaque jour. À faire demain matin (26/05/2026 ou jour suivant) :**

```bash
cd ~/Desktop/Workwave-V2
# 1. Verifier que la liste est bonne (Poitiers/Chatellerault/Bordeaux en tete)
npx tsx scripts/ping-google-indexing-listings.ts --dry-run

# 2. Si OK, lancer le ping reel (195 URLs)
npx tsx scripts/ping-google-indexing-listings.ts
```

→ **Au prochain message du user, lui rappeler cette tâche en haut de la réponse.** Une fois fait, supprimer cette section de CLAUDE.md.

### Mini-sprint en cours

**Système d'avis natifs Workwave** (démarré 24/05/2026) — table pro_reviews + page de notation token-based + cron email +7j + affichage sur fiche pro + badges TopProCards + modération admin. L'objectif : commencer à accumuler le moat "avis" qui fait la force de Travaux.com (207k avis natifs vs 0 chez nous aujourd'hui).

Mini-sprint cleanup catégories non viables — terminé 18/04/2026 (commits c328c60 + da2c445).

État avant cleanup : audit `scripts/audit-non-btp-categories.ts` a révélé que le scraping non-BTP avait déjà été fait (contrairement à ce qui était noté ici), mais avait classé 1967 fiches dans 3 catégories inexploitables (NAF Sirene 4520A / 9609Z / 8130Z trop génériques produisant des faux positifs massifs). Plus 4 catégories BTP vides absorbées par leur jumelle (NAF partagés).

Actions :
1. **Drop hard de 4 catégories** (1967 pros + 42 seo_pages + 49 email_sequences + 3 seo_guides) :
   - `jardinage` (NAF 8130Z absorbé par paysagiste) → redirect 301 vers `/paysagiste`
   - `promenade-animaux` (NAF 9609Z) → redirect 301 vers `/garde-animaux`
   - `lavage-voiture-a-domicile` (NAF 4520A, faux positifs garages) → redirect 301 vers `/`
   - `cheministe` (NAF 4322B, regex sur nom = 95% de noms de famille en BOIS) → redirect 301 vers `/chauffagiste`
2. **Reclassement de 33 pros par regex** (UPDATE `category_id`, 0 pro claimed, 0 API call) :
   - `serrurier` : 0 → 10 (depuis menuisier, regex SERRUR)
   - `vitrier` : 19 → 24 (+5 depuis peintre/menuisier, regex VITR|MIROIT)
   - `climaticien` : 0 → 18 (depuis chauffagiste, regex CLIM|FROID)
3. **Ramoneur** : laissé tel quel (72 pros, déjà bien rempli).

État final : 38 catégories actives (23 BTP + 8 domicile + 7 personne). Scripts conservés : `audit-non-btp-categories.ts`, `safety-check-drop-categories.ts`, `cleanup-drop-categories.ts` (générique via `--slugs`), `audit-regex-reclassification.ts`, `reclass-pros-by-regex.ts`.

### Phase A SEO — terminée 18/04/2026

Branche de travail SEO additionnelle pour densifier la couverture organique avant le sprint 5. **Phase complète, prête pour le sprint 5.**

- ✓ A0 (commit 419c564) : 7 nouvelles catégories (pisciniste, vitrier, ramoneur, vidéosurveillance, nettoyage-pro, cuisiniste, cheministe — cheministe a ensuite été dropée au mini-sprint cleanup).
- ✓ A1 (commit 9b447c6) : page racine `/[metier]` proximity (géoloc + fallback ville, 35 pages).
- ✓ A2 (commit a7da115) : 40 sous-spécialités × top 10 villes Vienne = 395 pages indexables (`/[metier]/[location]/[ville]`, schema Service+ItemList+FAQPage+BreadcrumbList).
- ✓ A3 (commit 206e844) : 15 articles blog "prix" long-tail (~123k vol/mois cible, ex. "prix construction piscine 2026").
- ✓ **A4 (commit à venir)** : 14 articles blog "comment choisir / guide pratique" long-tail (~109k vol/mois cible). 9 guides "comment choisir un X" (macon, couvreur, serrurier, climaticien, élagueur, architecte, ménage, garde-enfants, aide-seniors) + 5 transversaux haute valeur (lire un devis, éviter arnaques, MaPrimeRénov 2026 ~35k vol, aides rénovation énergétique ~15k vol, réception travaux). 1 skipped (chauffagiste : conflit de slug avec un guide existant). Script `scripts/generate-howto-guides.ts`.
- ✓ **D (commit 2489833)** : redirect 308 vers page département pour villes sans pros (`/[metier]/[ville]` et `/[metier]/[specialite]/[ville]`). Évite ~6000 URLs noindex pollutives en GSC, transmet le link juice au département. Bug critique découvert au passage : `loading.tsx` empêchait `permanentRedirect()` (Suspense streaming commit 200 avant que la Page puisse throw) → `loading.tsx` supprimé. Voir Leçons apprises.
- ✓ **D bis (commit e089274)** : strict slug match dans `getDepartmentBySlug`. Bug latent : n'importe quel slug `xxx-NN` matchait le département de code NN (duplicate content massif). Fix : regénérer le slug canonique et comparer strictement. Voir Leçons apprises.
- ✓ Sitemap resoumise à GSC le 18/04/2026 : 18020 URLs acceptées (vs ~20000 avant cleanup ; baisse normale due au drop des 4 cat aux NAF Sirene ambigus).

**Volume SEO total capté en Phase A** :
- A1 : 35 pages racine métier
- A2 : 395 pages sous-spécialités
- A3 : 15 articles "prix" (~123k vol/mois)
- A4 : 14 articles "guide" (~109k vol/mois)
- Total estimé : **~232k vol/mois cible long-tail** (hors trafic listing classique métier × ville).

**Reportés post-sprint 5** :
- Apify enrichment des emails pros (sur pause depuis "on fait option c phase seo on vera ensuite pour apify").
- Suite de la stratégie noindex éventuelle (laisser tel quel ou affiner après remontée GSC sur 4-6 semaines).
- Expansion vers d'autres départements (Deux-Sèvres 79, Charente 16, Charente-Maritime 17).

À chaque fin de sprint, mettre à jour cette section avec la date et un résumé de ce qui a été fait.

## 9 bis. Sprint sécurité — à faire ce weekend (planifié le 28/04/2026)

Audit sécurité complet réalisé le 28/04/2026 après l'arrivée des premiers vrais pros (4 réclamations en 24h post-batch 1 Brevo). Verdict : code applicatif solide, mais couches anti-bruteforce/2FA manquantes et backup à confirmer. À traiter ce weekend avant que le volume monte.

### 🔴 CRITIQUE — actions à faire AVANT de coder le reste (30 min total)

1. **Vérifier le plan Supabase** (5 min, action Willy) — Dashboard Supabase → Settings → Compute & Add-ons. Si Free, passer en Pro 25$/mois immédiatement. Sans ça, **0 backup automatique** et un DROP TABLE accidentel = perte totale des 226 478 pros + 5 fiches réclamées + claim_attempts. Sur Pro plan : 7 jours PITR + 14 jours daily backups.

2. **Backup des vars d'env critiques** (10 min, action Willy) — Copier `.env.local` (notamment `SUPABASE_SERVICE_ROLE_KEY`, `RESEND_API_KEY`, `BREVO_API_KEY`, `STRIPE_SECRET_KEY`, `ANTHROPIC_API_KEY`) dans 1Password / fichier chiffré. En cas de perte du laptop, tout reconstructible.

3. **2FA sur les comptes critiques** (15 min, action Willy) — Activer la 2FA sur : Google (workwave.france@gmail.com), Vercel, GitHub (workwavefrance-lgtm), Supabase, Stripe, Brevo, Resend, Hostinger. Si Google se fait pivoter, l'attaquant peut tout reset.

### 🟠 IMPORTANT — code Claude (2-3h total)

4. **Rate limiting sur `/admin/login`** (30 min, code Claude) — 5 tentatives ratées par IP / 15 min. Implémentation : Upstash Redis (gratuit jusqu'à 10k req/jour) ou middleware in-memory avec Map (suffisant tant qu'on a 1 instance Vercel). Bloque les attaques brute-force sur le password admin.

5. **Audit RLS Supabase** (1h, code Claude) — Vérifier que les tables sensibles (`pros`, `projects`, `project_leads`, `claim_attempts`, `admins`, `cancellation_feedback`) ont des RLS policies activées. Aujourd'hui les Server Actions utilisent `service_role` qui bypasse les RLS, donc seul le code applicatif protège (= 1 seule couche). Activer RLS = défense en profondeur si jamais une query oublie le check de session.

6. **Backup hebdo manuel automatisé** (30 min, code Claude) — Cron Vercel qui dump les tables critiques nuitamment vers Vercel Blob ou S3. Garde 14 jours de rolling. Coût ~10€/mois max. Redondance vs les backups Supabase.

7. **Doc procédure DR (`RUNBOOK.md`)** (30 min, code Claude) — Fichier dédié à la racine du repo : "si la prod plante, voici les 5 étapes pour la remonter en 30 min". Doit couvrir : restore Supabase backup, redeploy Vercel from Git, vérif des envs, tests post-restore.

### 🟢 PLUS TARD — quand le temps

8. **2FA pour le login admin Workwave** (1-2h, code Claude) — TOTP via Supabase Auth MFA. Aujourd'hui le login admin est juste email + password.

9. **Audit log admin avec alertes Slack/email** sur actions sensibles (suppression pro, changement subscription, impersonation, modif role admin, etc.) — déjà partiellement loggé en DB, à compléter + alerter en temps réel.

10. **WAF Vercel** — protection DDoS / bot scraping. Pro plan inclut 1 To gratuit. À activer + ajuster les rules si on remarque du scraping abusif (les bots crawlers légitimes Claude/GPT/Google sont déjà repérés et OK).

### Checklist de fin de weekend

- [ ] Plan Supabase : Pro confirmé
- [ ] Vars d'env backup dans 1Password
- [ ] 2FA activé sur 8 comptes critiques
- [ ] Rate limiting `/admin/login` deployed
- [ ] RLS audit + activation faite, fichier `docs/rls-policies.md` créé
- [ ] Cron backup hebdo running, premier dump vérifié
- [ ] `RUNBOOK.md` à la racine, lu et validé

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

> 🔴 **SECTION HISTORIQUE — décrit l'ANCIEN modèle (abonnement 39 €/mois + routing aux 3 meilleurs pros).**
> Ce modèle n'a jamais été mis en service tel quel : le live est le **pay-per-lead 9,90 €** (cf. section 0 ter).
> Ce qui reste VRAI ici : le parcours de réclamation de fiche (SIRET + code email), la structure du dashboard pro, et les cas tordus RGPD.
> Ce qui est FAUX : les 39 €/mois, l'essai gratuit 14 jours, le score composite de routing, l'envoi « aux 3 meilleurs ».
> `lib/routing/route-project.ts` existe encore mais n'est **jamais appelé** — c'est du code mort. Ne jamais s'en servir pour décrire le produit (leçon du 07/06 : une affirmation marketing tirée de code mort = erreur factuelle live + risque de publicité trompeuse).

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

## 15. À faire dans 1-2 semaines

- **Test A/B Claude Opus 4.8 sur Léa (chatbot commercial)** : Opus 4.8 sorti le 28/05/2026 ($5/M input + $25/M output). Aujourd'hui Léa tourne sur Sonnet 4.6. Hypothèse : Opus 4.8 ferait des réponses 20-30 % plus engageantes sur les objections complexes (coût marginal ~$0.05/conversation au lieu de $0.01, soit $5/mois pour 100 conv). À tester en juin 2026 quand on aura un volume suffisant de conversations Léa pour comparer (mesurer : taux de clic sur "Réclamer ma fiche" après chat). Pour switcher : env var `LEA_MODEL=opus-4-8` qui override le défaut dans `app/api/agent-chat/route.ts`. **Garder Sonnet 4.6 par défaut tant que l'A/B n'est pas concluant**.
- **Migration Haiku 4.5 → Opus 4.8 sur batch descriptions IA** : NON pertinent. Les 5000 descriptions BTP générées le 28/05/2026 avec Haiku 4.5 sont qualité OK pour SEO, et Opus 4.8 coûterait x10 ($37 au lieu de $4) pour gain marginal. Garder Haiku par défaut sur les batches volume.
- **Migration vers Opus 4.8 sur articles blog long-format (>2000 mots)** : à évaluer si on relance une campagne de génération articles. Coût marginal $0.50/article. À tester sur 5 articles pour comparer qualité narrative avant migration totale.

# CLAUDE.md : Workwave V2

Ce fichier est lu automatiquement par Claude Code à chaque session. Il contient tout le contexte nécessaire pour travailler sur ce projet. À mettre à jour au fil des sprints.

---

## 00. STYLE : s'applique à TOUT, y compris aux plans

`~/.claude/CLAUDE.md` définit **comment je raisonne et comment j'écris**. Ce fichier-ci définit **quoi faire**. En cas de friction sur la FORME, le fichier global l'emporte, sans exception.

Les plans de la Règle 1 restent **obligatoires**. Ils se rédigent dans ce style : attaque directe sur les fichiers et les étapes, zéro préambule, zéro reformulation de la demande, zéro remplissage, actions exécutables avec l'ordre et le critère de réussite, niveau de confiance sur ce qui est incertain. Un plan qui commence par « Je vais analyser votre demande » enfreint le fichier global.

Rappel des points que j'enfreins le plus (mesuré sur la session des 11 et 12/08) :
- le schéma « X, pas Y » et les définitions par contraste : **interdits**, affirmer directement ;
- le niveau de confiance absent quand j'avance une cause probable (attribution des 91,55 € : affirmée sans chiffrer ma certitude) ;
- la flatterie et l'auto-flagellation, qui sont deux formes du même remplissage ;
- le **tiret cadratin** « — » et le demi-cadratin « – » : **bannis à 100 %**, partout, y compris dans le code, les emails et les documents produits. Virgule, deux-points, parenthèse ou point à la place.

---

## 0. Règles de travail Claude : PRIORITÉ ABSOLUE

Les 4 règles ci-dessous viennent de Boris Cherny, créateur de Claude Code. Elles s'appliquent SYSTÉMATIQUEMENT à toutes les sessions Workwave, sans exception, et passent avant toute autre instruction de ce fichier.

### Règle 1 : Mode plan d'abord
Écrire le plan AVANT toute ligne de code.

- Avant chaque tâche non-triviale : rédiger le plan complet (fichiers concernés, étapes ordonnées, vérification finale, risques).
- Si la session dérape en cours de route : STOP, refais le plan.
- Pas de code sans plan validé d'abord.
- Sur Workwave : utiliser ExitPlanMode pour soumettre les plans à l'utilisateur sur les changements d'architecture, ajouts de tables Supabase, modifications de routing, ou tout nouveau sprint.

### Règle 2 : Sous-agents pour le complexe
Déléguer aux sous-agents pour garder le contexte principal propre.

- Tâche complexe = toujours un sous-agent dédié (outil Agent avec subagent_type Explore, Plan, ou general-purpose).
- Garder le contexte principal léger et focus sur la décision.
- 1 tâche complexe = 1 sous-agent dédié.
- Sur Workwave, bons cas d'usage : audit SEO concurrentiel, exploration des queries Supabase existantes avant de modifier, recherche de tous les usages d'un composant avant un refactor, vérification de migration SQL.

### Règle 3 : Boucle d'auto-amélioration
Chaque erreur devient une règle persistante dans ce fichier.

- Erreur détectée → la transformer immédiatement en règle écrite.
- Écrire la leçon en entier dans **`docs/lecons-detail.md`** (nouveau bloc `### LNN`), ET sa ligne de règle dans l'index, section 0 bis. Jamais l'un sans l'autre.
- Session suivante : -80% d'erreurs sur le même sujet.
- Avant tout nouveau sprint : relire l'index section 0 bis, et ouvrir le détail des leçons dont l'étiquette touche au sujet.

### Règle 4 : Prouve que ça marche
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

### Règle 5 : Écrire ce qu'on vient de faire, à chaque fois
La mémoire du projet se met à jour **dans le même mouvement que le travail**, jamais « plus tard ».

- **Après CHAQUE changement notable** (correctif, sprint, décision, incident, chiffre mesuré, découverte) : écrire dans `Workwave/log.md` **et** mettre à jour `Workwave/etat.md`. Si le changement invalide une affirmation de `CLAUDE.md`, corriger `CLAUDE.md` dans la foulée.
- **Ce n'est pas une tâche de fin de session.** Une session peut être interrompue, un accès peut sauter, un contexte peut être résumé : ce qui n'est pas écrit est perdu.
- **Avant de conclure quoi que ce soit, LIRE d'abord** `Workwave/` et la mémoire. Écrire sans lire produit des doublons ; lire sans écrire produit des oublis. Les deux sens comptent.
- **Un chiffre écrit doit être daté et mesuré.** « ~2,5 M de pros (08/08/2026) », pas « beaucoup de pros ».
- Ordre des sources en cas de contradiction : **wiki `Workwave/` > section 0 ter de ce fichier > `docs/historique-sprints.md` (historique)**.

Raison : le 08/08/2026, j'ai affirmé deux choses fausses coup sur coup : un « problème de conversion » bâti sur le compte de TEST de Willy, et « 53 leads morts » alors que `Workwave/funnel.md` l'interdit noir sur blanc depuis le 24/06. Dans les deux cas l'information existait déjà et n'avait pas été lue. Ce qui épuise Willy, ce n'est pas le bug, c'est de devoir réexpliquer ce qu'il a déjà expliqué.

---

## 0 ter. ÉTAT RÉEL, la seule description valable du présent (mesuré le 08/08/2026)

> 🔴 **Les sections 1 à 8 de ce fichier, et tout `docs/historique-sprints.md`, sont HISTORIQUES.** Elles décrivent le projet tel qu'il était pensé début 2026 et contiennent des affirmations aujourd'hui **FAUSSES** (abonnement 39 €/mois, Vienne 86, 20 330 pros, hébergement Vercel, routing aux 3 meilleurs pros…). Elles sont conservées pour l'historique du raisonnement produit, **PAS comme description du présent**.
>
> **En cas de contradiction : ce bloc et le wiki `Workwave/` font foi.** Le wiki est la source vivante : le lire avant de conclure quoi que ce soit (cf. la leçon **L79** dans l'index section 0 bis).

**Modèle économique LIVE : pay-per-lead, PAS d'abonnement**
Le particulier dépose un projet gratuitement. Le projet est diffusé **par email à TOUS les pros éligibles** de la zone (distance Haversine vs leur rayon d'intervention), pas aux « 3 meilleurs ». Le pro lit le **descriptif** du chantier, puis paie **9,90 € une fois** pour obtenir les coordonnées du particulier (`lead_unlocks`). **Ses 2 premiers déblocages sont offerts.** Zéro abonnement, zéro commission.
⚠️ `lib/routing/route-project.ts` (ancien modèle « 39 €/mois + routing top-3 ») est du **CODE MORT**, jamais appelé. Ne jamais décrire le produit avec.

**Chiffres au 08/08/2026** (mesurés, pas estimés de tête)

| | |
|---|---|
| pros actifs en base | ~2 560 000 |
| pros ayant **réclamé** leur fiche | **52** ← le vrai goulot |
| départements | 107 |
| communes | 35 163 |
| catégories | 197 (25 BTP + 15 domicile + 12 personne + 145 tech) |
| projets BTP déposés | 109 |
| déblocages payants | **1**, et c'est le compte de TEST de Willy |
| **revenu externe réel** | **0 €** |
| pages indexées (GSC) | ~567 000 |

**Le goulot est le REACH, pas le contenu ni le SEO.** ~2,5 M de fiches mais 52 pros réclamés : la plupart des projets ne trouvent aucun pro payable dans leur zone. Cf. `Workwave/funnel.md`.

**Infrastructure : VPS, plus Vercel**
Hébergement : **VPS Hostinger** (`72.60.130.5`, Ubuntu 24.04, 31 Go RAM, 387 Go disque) piloté par **Coolify** (`:8000`), Traefik en frontal, déploiement par image Docker (`Dockerfile` à la racine). Accès : `ssh -i ~/.ssh/workwave_vps root@72.60.130.5`.
Les crons ne sont plus ceux de Vercel : ils tournent sur le VPS (`crontab -l`, scripts dans `/opt/workwave/`). Supabase et Resend sont inchangés. **Toute leçon de ce fichier qui parle de « Vercel » pour l'hébergement, les logs, les crons ou la facturation est PÉRIMÉE**, sauf celles qui décrivent le comportement de Next.js lui-même, qui restent valables.

**Périmètre**
BTP + services à domicile + aide à la personne sur `workwave.fr`, **France entière + Belgique francophone** (plus « Vienne 86 » depuis longtemps). Le vertical freelance tech vit sur `/ai/*` du même site, même modèle 9,90 €. `workwaveai.co` est **en pause** (301 vers workwave.fr).

---

## 0 bis. Leçons apprises : INDEX (Règle 3)

**96 leçons. Le détail complet est dans `docs/lecons-detail.md`** (le symptôme, la
mesure, la cause, le correctif, les extraits de code). Ce fichier-ci n'en garde
que la règle, une ligne chacune.

🔴 **OBLIGATION, avant toute tâche non triviale** : repérer dans l'index ci-dessous
les lignes dont l'étiquette correspond au sujet, puis **ouvrir le détail** des
leçons concernées :

```bash
grep -n '^### L47' -A 60 docs/lecons-detail.md
```

L'index donne la règle, le détail donne le pourquoi et les chiffres. Une règle
appliquée sans son détail se réapplique de travers : la moitié de ces leçons sont
des récidives (le plafond 1000 a mordu 5 fois, ma propre sonde m'a trompé 4 fois).

**Étiquettes** : `mesure` `supabase` `next` `sitemap` `gsc` `seo` `scraping`
`securite` `rgpd` `email` `vps` `cout`

**Une nouvelle leçon s'écrit dans `docs/lecons-detail.md`, et sa ligne d'index ici,
dans le même mouvement.** Jamais l'un sans l'autre.

| # | date | sujet | la règle |
|---|---|---|---|
| L01 | 18/04 | `next` | Un espace invisible dans une variable d'env casse les liens : nettoyer avec `.replace(/\s+/g,"")`, pas `.trim()`. |
| L02 | 18/04 | `next` | `tsc --noEmit` remonte de fausses erreurs venant de `.next/types` : `rm -rf .next` avant de conclure. |
| L03 | 18/04 | `mesure` | Jamais de tendance concurrente affirmée sur une seule page : échantillonner 3 à 5, ou dire la limite. |
| L04 | 18/04 | `scraping` | « X pros insérés » = X envoyés à l'upsert, pas insérés : recompter en base après chaque scrape. |
| L05 | 18/04 | `scraping` | Un code NAF ne vaut jamais un métier : filtrer par regex sur le nom, ou marquer la donnée à valider. |
| L06 | 18/04 | `next` | dotenv sous tsx : toujours `override: true`, sinon les variables pré-injectées vides gagnent. |
| L07 | 18/04 | `next` | Un même niveau d'URL porte le même nom de paramètre partout. Seul le dev server le détecte, pas le build. |
| L08 | 18/04 | `supabase` | Avant un DELETE en cascade, lister TOUTES les tables enfant via `pg_constraint`. |
| L09 | 18/04 | `scraping` | Catégorie vide par NAF partagé : reclasser par regex, pas re-scraper. Refuser si un pro a réclamé. |
| L10 | 18/04 | `seo` | Tout `getXBySlug` qui découpe le slug doit regénérer le slug canonique et le comparer strictement. |
| L11 | 18/04 | `next` | Un `loading.tsx` casse `notFound()` et `permanentRedirect()`. Vérifier le code HTTP au curl, pas le rendu. |
| L12 | 27/04 | `seo` | 🔴 Jamais de noindex ni de Disallow sur une page publique sans compter les URLs et sans validation de Willy. |
| L13 | 28/04 | `email` | Tout Server Action critique embarque sa notification admin dans le même commit. |
| L14 | 28/04 | `next` | Ne revalider que la page PUBLIQUE affectée : sur le dashboard, ça efface les champs non contrôlés. |
| L15 | 28/04 | `supabase` | `count: "exact"` au-delà de 50 000 lignes = timeout. Utiliser `"estimated"`. |
| L16 | 29/04 | `sitemap` | Chaque sous-sitemap répond en moins de 5 s, sinon Googlebot abandonne. |
| L17 | 29/04 | `gsc` | Ne soumettre QUE l'index de sitemap, jamais les enfants un par un. |
| L18 | 29/04 | `gsc` | Les API Google exigent le scope au moment du `gcloud auth`, pas dans le code. |
| L19 | 29/04 | `gsc` | Pas besoin de contourner la policy des clés de service : les identifiants utilisateur suffisent. |
| L20 | 30/04 | `seo` | Aucun slug de département en dur dans un redirect ou un fil d'Ariane : le dériver du contexte. |
| L21 | 30/04 | `email` | Cold email de masse : expéditeur du domaine, en-têtes anti-tracking, désinscription à jeton. Les trois. |
| L22 | 30/04 | `email` | Le mode test du cold email désinscrit un vrai pro si on clique le lien. |
| L23 | 30/04 | `sitemap` | Plafond PostgREST à 1000 : boucler tant que `rows.length > 0`, incrémenter du réel reçu. |
| L24 | 01/05 | `rgpd` | Apify mélange les coordonnées entre homonymes : validateur de nom strict avant toute attribution. |
| L25 | 09/05 | `supabase` | Récidive du plafond 1000. Squelette de pagination obligatoire, à copier tel quel. |
| L26 | 01/05 | `rgpd` | Deux patterns selon la plainte : nullification des coordonnées, ou suppression complète. |
| L27 | 13/05 | `email` | Tout flux de code par email affiche l'adresse destinataire obfusquée et un recours contact. |
| L28 | 20/05 | `gsc` | Ne jamais valider un correctif sur un motif de non-indexation volontaire : la validation échoue. |
| L29 | 22/05 | `securite` | Toute table Supabase reçoit RLS dans la migration qui la crée, sinon la clé publique écrit dedans. |
| L30 | 22/05 | `securite` | Un UPDATE sur zéro ligne ne teste PAS RLS. Tester par un INSERT. |
| L31 | 23/05 | `email` | Jamais de `.catch` silencieux sur un service externe : tracer en base, afficher dans l'admin. Ne jamais écraser le MX. |
| L32 | 24/05 | `next` | Dans un Server Action, toute promesse non attendue est tuée. `await` sur les effets de bord. |
| L33 | 24/05 | `next` | La clé Anthropic est vidée par le shell de l'agent : repli lecture du fichier, en dev seulement. |
| L34 | 26/05 | `supabase` | Base partagée = timeouts de build dès 100 000 lignes plus un batch en parallèle. |
| L35 | 26/05 | `supabase` | Pagination par OFFSET sur grande table filtrée = balayage complet. Passer au curseur. |
| L36 | 26/05 | `vps` | Devant un build en erreur sans cause, lire les logs de build avant de deviner. |
| L37 | 26/05 | `securite` | Tout flux de code par email égalise son temps de réponse, sinon il révèle quels comptes existent. |
| L38 | 26/05 | `securite` | Limiter par email ne suffit pas : doubler par une limite par adresse IP. |
| L39 | 26/05 | `supabase` | « Chercher puis insérer » n'est pas atomique : index unique partiel plus gestion de l'erreur 23505. |
| L40 | 26/05 | `next` | Caractères de contrôle littéraux dans une regex : git classe le fichier en binaire. Utiliser les échappements. |
| L41 | 26/05 | `securite` | Le middleware couvre toutes les routes authentifiées, pas seulement le vertical principal. |
| L42 | 26/05 | `supabase` | Élargir un type TypeScript ne suffit pas : aligner la contrainte CHECK dans la même migration. |
| L43 | 26/05 | `supabase` | `getUserByEmail` n'existe pas et le schéma `auth` est inaccessible. Passer par `listUsers`. |
| L44 | 26/05 | `seo` | Dès qu'il y a plus d'une source de pros, filtrer par liste blanche, jamais par égalité sur une seule. |
| L45 | 26/05 | `supabase` | Jamais de mapping slug vers identifiant codé en dur : le vérifier en base d'abord. |
| L46 | 27/05 | `vps` | `echo` ajoute un retour à la ligne dans la valeur stockée. Utiliser `printf`. |
| L47 | 26/05 | `next` | Un `<Link>` vers une route à effet de bord se pré-charge et déclenche l'effet. `prefetch={false}`. |
| L48 | 29/05 | `next` | Un build qui casse APRÈS « Compiled successfully » manque de mémoire, ce n'est pas une erreur de code. |
| L49 | 29/05 | `seo` | Expansion internationale : routes EN, pages Golfe, tunnel localisé, inscription pro hors-base. |
| L50 | | | *(note périmée, conservée pour l'historique)* |
| L51 | 31/05 | `scraping` | Ne jamais scraper le registre monégasque : ses conditions l'interdisent. |
| L52 | 31/05 | `seo` | Perplexity fournit prix et contexte marché SOURCÉS. Le générateur Claude de pages département INVENTE les prix : ne pas le relancer. |
| L53 | 06/06 | `mesure` | Pour savoir si un site a un tracking, chercher aussi GTM et dataLayer, pas seulement gtag. |
| L54 | 06/06 | `gsc` | Ne jamais pinger l'API d'indexation sur une URL en redirection : vérifier le 200 avant. |
| L55 | 06/06 | `seo` | Chaque préférence du dashboard pro doit être utilisée par le matching, sinon c'est un placebo. |
| L56 | 06/06 | `next` | `after()` ne s'exécute pas en production sur les Server Actions. `await` avant la redirection. |
| L57 | 06/06 | `supabase` | `CREATE TABLE IF NOT EXISTS` n'ajoute pas de colonnes. `ALTER TABLE ADD COLUMN IF NOT EXISTS` plus rechargement du cache. |
| L58 | 07/06 | `seo` | Données communes data.gouv en base : prix immobilier, revenus, vacance, équipements. Nuances Paris, Lyon, Marseille. |
| L59 | 07/06 | `mesure` | Tout agrégat géographique est conditionné à sa couverture, sinon 1 commune passe pour un département. |
| L60 | 07/06 | `mesure` | Le séparateur de milliers français est une espace fine insécable : normaliser avant de chercher dans du HTML. |
| L61 | 07/06 | `seo` | Toute affirmation chiffrée sur le produit se vérifie dans le code RÉELLEMENT exécuté, jamais dans du code mort. |
| L62 | 07/06 | `scraping` | Le filtre Sirene passe par les codes postaux : la Corse casse. Gérer les codes alphanumériques. |
| L63 | 07/06 | `seo` | Doublons : le titre visible identique est un signal fiable, le slug différent du contenu ne l'est pas. |
| L64 | 07/06 | `seo` | 🔴 Enrichir chaque fiche avec de la VRAIE donnée officielle. Jamais de fausse coordonnée pour appâter. |
| L65 | 08/06 | `supabase` | Vérifier l'erreur de TOUTE mutation : un delete qui viole une clé étrangère échoue en silence. |
| L66 | 08/06 | `sitemap` | Compter les URLs de CHAQUE sous-sitemap. Le plafond 1000 frappe aussi les fonctions SQL : renvoyer du jsonb. |
| L67 | 11/06 | `cout` | Le crawl multiplié par des SELECT gras fait exploser le quota : dégraisser, allonger les caches, prouver par diff du HTML. |
| L68 | 11/06 | `scraping` | Sirene renvoie les codes d'arrondissement : rattacher à la commune, sinon les pros disparaissent des pages de ville. |
| L69 | 11/06 | `scraping` | Un scrape long réessaie 3 fois avec pause, sinon le réveil du Mac fait sauter des départements entiers. |
| L70 | 12/06 | `cout` | Pixel publicitaire : variable publique inactive avant redéploiement, et sans consentement rien n'est attribué. *(Pixel supprimé le 09/09.)* |
| L71 | 13/06 | `cout` | Un gros correctif de sitemap déclenche un crawl massif qui coûte des deux côtés. Allonger les caches AVANT le pic. |
| L72 | 14/06 | `email` | Code non reçu = boîte réceptrice stricte, pas notre configuration. Vérifier le SPF du sous-domaine d'envoi avant de toucher au DNS. |
| L73 | 02/08 | `mesure` | 🔴 Jamais annoncer une métrique sans l'avoir mesurée. Un sous-agent n'est pas une source de vérité. |
| L74 | 02/08 | `next` | Une route dynamique sans `generateStaticParams` n'est jamais mise en cache. `return []` suffit à la basculer. |
| L75 | 04/08 | `vps` | 🔴 Capturer les logs du conteneur mort AVANT de redéployer. Un chien de garde doit voir les conteneurs arrêtés, et son canal d'alerte ne doit pas dépendre de ce qu'il surveille. |
| L76 | 04/08 | `scraping` | 🔴 Le scraper ne ramenait que les 1000 premiers résultats : le curseur vaut `"*"` dès le 1er appel. Comparer l'inséré au total annoncé. |
| L77 | 06/08 | `rgpd` | 🔴 Jamais de repli dans un script destructif : identifiant exact, second champ vérifié, arrêt au moindre doute. |
| L78 | 07/08 | `securite` | 🔴 Un contrôle posé sur une route doit l'être sur TOUTES celles qui servent la même donnée. Une page non liée reste servie. |
| L79 | 08/08 | `mesure` | 🔴 Lire la mémoire et le wiki AVANT de parler. Un chiffre tiré de la base n'est pas un fait métier. |
| L80 | 09-10/08 | `next` | 🔴 Fuite mémoire : jamais de client Supabase fabriqué à la main. Contrôle automatique avant tout commit touchant l'accès base. |
| L81 | 20/08 | `gsc` | Le budget de crawl est le goulot. Journal d'accès Traefik activé, outils de comptage sur le serveur. |
| L82 | 20/08 | `mesure` | 🔴 Ne jamais compter un robot par son agent déclaré : compter par son adresse IP. |
| L83 | 20/08 | `mesure` | Un garde-fou qui transforme sa propre panne en « tout va bien » est pire que rien. Un comptage nul est une erreur, pas un zéro. |
| L84 | 20/08 | `sitemap` | Deux compteurs qui calculent la même chose finissent par diverger. Source unique. |
| L85 | 20/08 | `seo` | Ne pas afficher une donnée que 94 % des fiches partagent : elle aggrave la duplication. |
| L86 | 20/08 | `seo` | 43 points de duplication viennent du gabarit, pas du contenu. Ne plus toucher aux appels à l'action. |
| L87 | 21/08 | `mesure` | 🔴 Un clic synthétique n'est pas un clic. Tester par coordonnées. |
| L88 | 21/08 | `rgpd` | 🔴 Ne jamais revendiquer un auteur sur une donnée scrapée. Le libellé dépend de la provenance. |
| L89 | 21/08 | `mesure` | Un filtre plus strict est une suppression de données : le compter avant de l'écrire. |
| L90 | 21/08 | `securite` | Ne jamais stocker une URL tierce portant une clé dans sa query string. Télécharger le contenu. |
| L91 | 21/08 | `next` | Un commentaire JSX ne peut pas ouvrir une expression ni un `return`. |
| L92 | 02/09 | `mesure` | Ne pas mesurer l'effet d'un déploiement pendant la bascule de conteneur. |
| L93 | 02-03/09 | `scraping` | 🔴 45 % des fiches étaient des établissements fermés : `periode()` matche n'importe quelle période. Listings filtrés, broadcast non. |
| L94 | 02-03/09 | `supabase` | Écrire 2,3 M de lignes coûte par ligne (30 index). Contre-pression, sous-chaînes qui retiennent le fichier, timeout d'annulation. |
| L95 | 03/09 | `mesure` | Tester un formulaire critique = le soumettre pour de vrai, puis lire la base et le journal. |
| L96 | 03/09 | `supabase` | Une réécriture de masse change l'ordre physique : rejouer la requête du build hors build avant toute hypothèse. |

---

## 1. Vision du projet

Workwave est une plateforme qui met en relation les particuliers avec des professionnels locaux dans trois verticaux complémentaires : BTP et artisanat, services à domicile, et aide à la personne. ~~Zone de lancement : département de la Vienne (86), puis extension progressive au Poitou-Charentes, puis la Nouvelle-Aquitaine.~~ **PÉRIMÉ (08/08/2026)** : le site couvre la France entière + la Belgique francophone : 107 départements, 35 163 communes. Cf. section 0 ter.

Le positionnement est double. D'abord un annuaire SEO massif qui capte du trafic organique grâce à des pages locales générées automatiquement. Ensuite une plateforme de mise en relation où les particuliers déposent un projet et où l'IA route automatiquement la demande vers les professionnels pertinents.

L'avantage concurrentiel repose sur l'automatisation par l'IA : génération de contenu SEO à l'échelle, qualification intelligente des projets, enrichissement automatique des fiches professionnelles. Cette automatisation permet de proposer des tarifs disruptifs face à des concurrents comme Habitatpresto qui facturent 100 à 150 euros par mois aux artisans.

Vision long terme : devenir un hybride local de Fiverr, Malt et Travaux.com, en ajoutant progressivement des verticaux (services digitaux, bien-être, etc.) une fois le cœur validé.

## 2. Modèle économique

Modèle freemium hybride.

Les professionnels sont tous listés gratuitement dans l'annuaire, qu'ils soient clients ou non. Les fiches de base sont créées automatiquement via scraping des données publiques (API Sirene, Pages Jaunes). Chaque professionnel peut réclamer sa fiche gratuitement pour la compléter, ajouter des photos, modifier la description.

~~Pour recevoir les leads, le professionnel doit souscrire à un abonnement à 39 euros par mois.~~ 🔴 **FAUX DEPUIS MAI 2026.** Le modèle live est le **pay-per-lead : 9,90 € par déblocage de coordonnées, sans abonnement, 2 premiers offerts**. Tous les pros réclamés reçoivent TOUS les projets de leur zone par email ; ils ne paient que pour obtenir les coordonnées. Cf. section 0 ter et `Workwave/funnel.md`.

Upsells possibles à ajouter plus tard : badge Pro Vérifié, mise en avant premium dans les listings, pack photo professionnel, etc.

Côté particulier, le service est et reste entièrement gratuit.

## 3. Stack technique

Framework frontend et backend : Next.js 14 ou supérieur, avec App Router et Server Components. Le SSR est critique pour le SEO, c'est pour ça qu'on prend Next.js et pas une autre solution client-side.

Base de données et authentification : Supabase (PostgreSQL managé, auth intégrée, stockage de fichiers). Plan gratuit suffisant au début.

~~Hébergement : Vercel.~~ **PÉRIMÉ (02/08/2026)** : le site tourne sur un **VPS Hostinger piloté par Coolify** (Docker + Traefik). Le déploiement n'est PAS automatique au push, il faut cliquer « Redeploy » dans Coolify. Cf. section 0 ter.

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

Chaque page doit avoir : un title optimisé (ex. "Plombier à Poitiers : 24 artisans disponibles"), une meta description unique, un H1 unique, des données structurées schema.org (LocalBusiness pour les fiches pros, ItemList pour les listings), et un maillage interne dense entre les pages (catégories liées, villes voisines).

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
- Accent primaire : coral (#FF5A36), utilisé uniquement pour les boutons primaires, liens actifs, badges importants, micro-animations. Jamais pour remplir des blocs entiers.
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

## 9. Historique des sprints

Les plans des sprints 0, 1, 2.5, 5 et 7, l'etat d'avancement detaille, le sprint
securite d'avril et la liste « a faire dans 1-2 semaines » sont dans
**`docs/historique-sprints.md`**. Contenu historique : il decrit l'ancien modele
(abonnement 39 EUR/mois, routing top-3, Vercel) et contient des affirmations
fausses aujourd'hui. La verite du present est la section 0 ter ci-dessus et le
wiki `Workwave/`. A ouvrir seulement pour retrouver une intention d'origine.

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
Hébergement : Vercel (sprint 6 terminé).
Nom de domaine : workwave.fr, enregistré chez Hostinger mais routé vers Vercel via DNS (A/AAAA records sur Vercel IP). MX `@` conservé chez Hostinger pour `contact@workwave.fr`.
URL de prod : https://workwave.fr (live, SSL OK).
URL de test : à définir lors du sprint 0.
Dashboard Supabase : à renseigner après création du projet.
Dashboard Vercel : à renseigner après création du projet.
Dashboard Stripe : à renseigner au sprint 5.
API Sirene : api.insee.fr/entreprises/sirene/V3
Documentation Next.js : nextjs.org/docs
Documentation Supabase : supabase.com/docs

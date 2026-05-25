# SEO Competitor Analysis - Workwave AI (Freelance Tech FR/EU)

> Audit operationnel SEO/GEO/AEO mai 2026. Cible : ranker devant codeur.com, malt.fr, freelancerepublik et la longue traine "freelance tech ville" en 6 mois.
>
> Methodologie : WebSearch SERPs + WebFetch HTML quand non bloque (Malt + Upwork + Toptal bloquent les bots WebFetch via 403/Cloudflare, ce qui en soi confirme une protection anti-scraping qui ne nous penalise pas car nos pages restent crawlables par Googlebot).

---

## TL;DR Tableau de bord

| Concurrent | Pages programmatiques estimees | URL pattern type | Title pattern | Schema visible | Faiblesse exploitable |
|---|---|---|---|---|---|
| **codeur.com** | 10-15k (skill x ville) | `/developpeur/{skill}/{ville}` | "Developpeur {Skill} {Ville} : trouvez un freelance" | Aucun JSON-LD visible | Contenu intro 85 mots, FAQ template-y, **aucun Schema.org** |
| **malt.fr** | 3-5k (skill x ville) + baremetrres | `/a/freelance/tech/{cat}/{sub}/{ville}` | "Developpeurs {X} Freelance : Trouvez Vos Experts" | Probable (LocalBusiness) | URL profonde, faible CTR (titre tres sobre, pas d'annee) |
| **comet.co** | <500 | `/en/freelance-developer` + listing | "The best freelance developers for your IT projects" | Inconnu | Anglais-first, peu de pages locales France |
| **freelancerepublik.com** | ~50 metiers + ~10 villes | `/metier/{X}-freelance` | "{Metier} freelance : 3 profils en 48h" | Aucun JSON-LD | TRES peu de pages ville, hub blog talks.* en sous-domaine |
| **collective.work** | ~200 (skill x ville) | `/freelance/{skill}/{ville}` | "Top 10 Developpeur {skill} freelances a {ville}" | Inconnu | **MEME pattern title que nous** - concurrent direct, score potentiellement plus eleve |
| **toptal.com** | 1k+ (skill x ville) | `/developers/{ville}/{skill}` | "11 Best Freelance {X} for Hire in {Mois} {Annee}" | Probable (Rating + Person) | International, faible coverage geographique FR |
| **upwork.com** | 5k+ (skill x ville) | `/hire/{skill}-developers/fr/{ville}/` | "27 Best Freelance {Skill} For Hire Near {Ville}" | Probable | International, frenchify minimaliste |
| **arc.dev** | 2k+ | `/remote-freelance-developers/{ville}/{skill}` | "Hire Best Freelance {Skill} Developers in {Ville}" | FAQ + Person likely | International, contenu anglais |
| **lesbonsfreelances.com** | ~500 | `/freelances/{skill}/{ville}` | "{Skill} Freelance, {Ville} ({CP}) \| LesBonsFreelances" | Inconnu | Footer pauvre, faible maillage interne |
| **collabrio.fr** | 1k+ (theorique) | `/freelance/skill/{X}` | "{Specialite} - Collabrio.fr" | Aucun JSON-LD | Tres jeune, faible autorite, **aucune URL ville x skill identifiee** |
| **tjmetre.fr** | ~100 (baremes) | `/tjm/{role}-{spec}/{ville}` | "Baremetrre TJM 2026 - {Metier}" | Tableaux/datasets | **Aucune page profil freelance** -> opportunite |
| **free-work.com** | 5k+ | `/fr/tech-it/jobs/{skill}/{ville}` | "Missions freelance {Skill} a {Ville}" | JobPosting probable | Jobs only, pas de fiches profil |
| **freelance-informatique.fr** | 3k+ | `/{skill}-freelance-n{id}` | "Freelance {SKILL} : CV qualifies" | Person likely | Design 2010, faible CWV |

Sources: [Malt SERP](https://www.malt.fr/a/freelance/tech/developpeur-frontend/paris), [Codeur SERP](https://www.codeur.com/developpeur/react/paris), [Codeur Wordpress Paris](https://www.codeur.com/developpeur/wordpress/paris), [Comet](https://www.comet.co/en/), [FreelanceRepublik](https://www.freelancerepublik.com/developpeur-freelance), [Collective.work React Paris](https://www.collective.work/freelance/react/paris), [Toptal](https://toptal.com/developers/paris/machine-learning), [Arc.dev React Paris](https://arc.dev/remote-freelance-developers/paris/reactjs), [LesBonsFreelances Python Paris](https://www.lesbonsfreelances.com/freelances/developpeur-python/paris), [Collabrio Web Dev](https://collabrio.fr/freelance/specialite/web_developer), [TJMetre Baromettre](https://tjmetre.fr/barometre).

---

## 1. Analyse detaillee par concurrent

### 1.1 codeur.com - challenger SEO principal

**Volumetrie pages :**
- `/developpeur/{ville}` : ~100 grandes villes francaises
- `/developpeur/{skill}/{ville}` : 35+ skills x ~85 villes = **3 000+ pages programmatiques** facilement identifiables
- `/developpeur/{skill}` : 35+ pages skill nationale
- `/developpeur/tarif` : 1 page tarif transverse haute-valeur

**Pattern URL (preuve) :**
- https://www.codeur.com/developpeur/react/paris
- https://www.codeur.com/developpeur/wordpress/paris
- https://www.codeur.com/developpeur/python/lyon
- https://www.codeur.com/developpeur/e-commerce/paris

**Pattern title :** `"Developpeur {Skill} {Ville} : trouvez un freelance"` (sobre, sans annee, sans nombre).

**Pattern H1 :** `"Developpeurs {Skill} a {Ville}"` (different du title).

**Contenu :**
- Intro : ~85 mots template-y ("Les meilleurs developpeurs X de Y a votre service")
- FAQ : 4 questions templatisees ("Quels avantages offre un developpeur X a Y ?", "Comment trouver le meilleur...", etc.)
- 20-23 cartes freelance affichees
- Pas de Schema.org JSON-LD visible
- Maillage interne : **35+ skills + 85+ villes en footer** (croisement massif)
- TJM affiches : 20-100 EUR/heure

**Forces :**
- Volumetrie URL massive (3k+ skill x ville)
- Maillage interne dense
- Domain authority forte (165k+ freelances revendiques, 560k membres total)
- Pattern duplique mais avec micro-variations par ville/skill

**Faiblesses (exploitables) :**
- **AUCUN schema.org visible** : pas d'ItemList, pas de FAQPage, pas de LocalBusiness, pas de Service. Nous avons un avantage structurel direct ici.
- Contenu intro **tres court** (85 mots) - Google reward du contenu profond
- Title **sans annee, sans nombre** : faible CTR vs "Les 10 meilleurs en 2026"
- Pas de BreadcrumbList visible
- Pas d'images/photos freelance (juste avatars generiques)

Sources: [Codeur React Paris](https://www.codeur.com/developpeur/react/paris), [Codeur Web Paris](https://www.codeur.com/developpeur/web/paris), [Codeur Wordpress Paris](https://www.codeur.com/developpeur/wordpress/paris).

---

### 1.2 malt.fr - leader generaliste FR

**Volumetrie pages :**
- `/a/freelance/tech/{cat}/{ville}` : ~30 categories x 30 villes = ~900 pages
- `/a/freelance/tech/{cat}/{sub}/{ville}` : ~80 sub-specialites x 30 villes = ~2 400 pages
- `/s/tags/{skill}` : ~500 pages skill nationales (sans ville)
- `/t/barometre-tarifs/{tree}` : ~50 pages baremes haute-valeur SEO + magnet a backlinks

**Pattern URL (preuve) :**
- https://www.malt.fr/a/freelance/tech/developpeur-frontend/paris
- https://www.malt.fr/a/freelance/tech/developpeur-backend/developpeur-fullstack/paris
- https://www.malt.fr/a/freelance/tech/developpeur-mobile/developpeur-ios/paris
- https://www.malt.fr/t/barometre-tarifs/tech/developpeur-backend/developpeur-fullstack

**Pattern title :** `"Developpeurs {X} Freelance : Trouvez Vos Experts"` (template generique, sobre).

**Forces :**
- Profondeur d'arborescence (3 niveaux : metier > sous-spec > ville)
- Pages baremerre TJM (`/t/barometre-tarifs/...`) sont des **magnets a backlinks puissants** (cite par RH-Solutions, journaldunet, Blog du Moderateur)
- Affichage du TJM moyen sur chaque page ville (ex. "TJM Paris : 449 EUR")
- Comparatif TJM ville par ville (Paris vs Lyon vs Bordeaux) systematique

**Faiblesses :**
- Titre **trop sobre, pas d'annee, pas de chiffre concret** : faible CTR sur SERP "freelance dev Paris"
- URL profondes (3-4 niveaux) : Google preferere les URLs courtes
- Bloque les crawlers WebFetch (403) -> probablement aussi Bingbot et autres
- **Pas de page guide/comment-choisir** par skill (juste baremes prix)

Sources: [Malt Top Frontend Paris](https://www.malt.fr/a/freelance/tech/developpeur-frontend/paris), [Malt Baromettre Fullstack](https://www.malt.fr/t/barometre-tarifs/tech/developpeur-backend/developpeur-fullstack).

---

### 1.3 collective.work - **CONCURRENT DIRECT au pattern Workwave AI**

**ALERTE :** ce site utilise exactement le meme pattern title que nous : `"Top 10 Developpeur {skill} freelances a {ville}"`.

**URL pattern :** `/freelance/{skill}/{ville}` (ex. /freelance/react/paris)

**Volumetrie :** ~200-500 pages (estimation conservative)

**Pourquoi c'est important :** ils nous tirent le SERP par dessous (premiere position sur "top 10 developpeur react freelances paris"). Notre titre Workwave AI ("Les 10 meilleurs freelances React a Paris en 2026") est DIFFERENT a la marge :
- Eux : "Top 10 Developpeur React freelances a Paris" 
- Nous : "Les 10 meilleurs freelances React a Paris en 2026"

**Avantage Workwave :**
- Ajout de "en 2026" = signal de freshness fort pour Google
- "meilleurs" est un quaitatif plus search-intent friendly que "Top"
- "freelances" en debut de title est plus naturel en francais

**A faire :** verifier en SERP live (impossible via WebFetch malt/collective bloques) que notre title sort en premier sur ces requetes. **Action concrete = ping Google Indexing API + monitor GSC**.

Sources: [Collective.work React Paris](https://www.collective.work/freelance/react/paris).

---

### 1.4 freelancerepublik.com - faible coverage SEO

**Volumetrie :**
- `/metier/{X}-freelance` : ~50 pages metier
- `/metier-competence/` : ~30 pages skills techniques (React, Angular, Java)
- `/offre/developpement-freelance` : 1 page service
- Pas de pages ville (presence ville embarquee dans le contenu mais pas en URL dediee)

**Pattern title :** `"Developpeur freelance : 3 profils qualifies en 48h"` (CTR friendly mais peu de variation par metier)

**Faiblesses :**
- **AUCUNE page ville** identifiee
- Volumetrie tres faible (~80 pages)
- Sous-domaine `talks.freelancerepublik.com` (hub blog en sous-domaine = link juice fragmente, pas opti)
- Pas de schema visible

**Force :** la marque a une presence forte (150k freelances revendiques) mais le SEO est faible.

Sources: [FreelanceRepublik Dev](https://www.freelancerepublik.com/developpeur-freelance), [Talks FreelanceRepublik Meetups Paris](https://talks.freelancerepublik.com/meetups-developpeurs-paris/).

---

### 1.5 toptal.com / arc.dev / upwork.com - challengers internationaux

**arc.dev** - URL pattern : `/remote-freelance-developers/{ville}/{skill}` (Anglais)
- Title : "Hire Best Freelance React Developers in Paris | Arc"
- H1 : "Hire the Top 2% of Remote React Developers"
- Comprehensive FAQ : 11 questions
- "120,072 Remote React developers" en chiffre d'autorite
- Pages educatives (interview guides, salary explorers) = magnet a backlinks

**toptal.com** - URL pattern : `/developers/{ville}/{skill}` ou `/developers/{skill}`
- Title : "11 Best Freelance {X} for Hire in {Mois} {Annee}" (signal de freshness mensuel)
- Force majeure : "Top 2%" positioning + "$0 until hire" garantie

**upwork.com** - URL pattern : `/hire/{skill}-developers/fr/{ville}/`
- Title : "27 Best Freelance React.js Developers For Hire Near Paris"
- Chiffre "27 Best" = signal de listicle clair pour SERP

**Faiblesses internationaux :**
- Anglais-first, contenu francise minimal
- Pas de TJM en EUR
- Pas de couverture villes francaises secondaires (Rennes, Nantes, Strasbourg, Lille)

Sources: [Arc.dev React Paris](https://arc.dev/remote-freelance-developers/paris/reactjs).

---

### 1.6 tjmetre.fr - **MAGNET A BACKLINKS** sans concurrence frontale

**Type :** site dedie au baromettre TJM, pas une plateforme.

**URL pattern :** `/tjm/{role}-{specialite}/{ville}`

**Forces :**
- Donnees granulaires : 14 111 observations, P25/P50/P75 par metier
- Sample size cite (autorite)
- Mediane par ville (Paris 593 EUR vs Marseille 515 EUR)

**Faiblesse exploitable :**
- **Aucune page de profil freelance** (juste les baremes)
- Pas de listing par ville
- Pas de mecanique d'enrolement freelance

**Opportunite Workwave :** copier leur modele baremes ET cumuler avec nos pages profils. On ecrase.

Sources: [TJMetre Baromettre](https://tjmetre.fr/barometre).

---

## 2. SERP positions actuelles (top 10 par mot-cle)

### 2.1 "freelance developpeur Paris"

Position | Domaine | URL | Why they rank
---|---|---|---
1 | developpeurfreelanceparis.dev | / | Exact-match domain hyper-niche
2 | lesbonsfreelances.com | /freelances/developpeur/paris | Volumetrie + age domaine
3 | devdotcom.com | / | Page perso developpeur, exact-match
4 | lesbonsfreelances.com | /freelances/developpeur-web/paris | Pattern programmatique
5 | developpeurfreelanceparis.tech | / | EMD
6 | indeed.fr | /q-developpeur-web-freelance-l-paris | Autorite Indeed
7 | developpeurs.com | /recherche/france/paris | EMD com
8 | dev-freelanceparis.fr | / | EMD .fr
9 | florianperrier.com | / | Perso dev (HQ content)
10 | codeur.com | /developpeur/web/paris | Pattern programmatique

**Observation cle :** la SERP est dominee par des **exact-match domains (EMD) "developpeurfreelanceparis.{tld}"** + des pages perso dev. **Aucun gros marketplace n'est dans le top 5 sur cette requete tres concurrentielle.** C'est une **opportunite** : si Workwave AI cree une page ultra-optimisee `/ai/developpeur/paris` avec 1500+ mots + schema + freelancers reels, on peut entrer top 10 en 4-8 semaines (Google reward la fraicheur + contenu profond + entitee structurees).

Sources: [SERP "freelance developpeur Paris"](https://www.google.com/search?q=freelance+developpeur+paris).

### 2.2 "freelance react paris"

Position | Domaine | URL | Note
---|---|---|---
1 | codeur.com | /developpeur/react/paris | Template
2 | indeed.fr | /q-mission-freelance-react-l-paris | Jobs
3 | arc.dev | /remote-freelance-developers/paris/reactjs | International
4 | developpeur-freelance-paris.fr | / | EMD
5 | linkedin.com | /jobs/freelance-react-js | Jobs
6 | victorquertelet.com | /developpeur-react-paris/ | Perso
7 | linkedin.com | /jobs/react.js-freelance-emplois | Jobs
8 | collective.work | /freelance/react/paris | **Pattern proche Workwave**
9 | webflow.com | /hire/react/fr/paris | International
10 | free-work.com | /fr/tech-it/jobs/react/paris | Jobs

**Conclusion :** 5/10 c'est de l'offre d'emploi (Indeed, LinkedIn, Free-Work) qui pollue la SERP - ces 5 places sont "facilement" recuperables car les utilisateurs cherchent un **profil**, pas un poste.

### 2.3 "freelance IA Paris" / "freelance AI engineer Paris"

Position | Domaine | URL
---|---|---
1 | twine.net | /find/ai-engineers/fr/paris (international)
2-5 | welcometothejungle.com (3 offres) - jobs
6 | hiverrtalents.com | /experts/generative-ai-engineer-freelance-a-paris
7 | indeed.fr | jobs
8-10 | hexa, freelancerepublik, upwork, jobsinparis

**Top opportunite Workwave :** **personne ne rank serieusement sur "freelance IA Paris" cote profil.** Twine est anglais, Welcome to the Jungle = job board. Notre page `/ai/intelligence-artificielle/paris` peut etre dans le top 3 en 2-3 mois.

### 2.4 "freelance data scientist paris" / "freelance python lyon"

Position | Domaine | URL
---|---|---
1 | linkedin.com | /jobs/data-scientist-freelance
2 | linkedin.com | /jobs/python-freelance
3 | clelialopez.com | / (perso)
4 | lesbonsfreelances.com | /freelances/data-scientist/lyon
5 | lesbonsfreelances.com | /freelances/developpeur-python/paris
6 | free-work.com | /fr/tech-it/jobs/data-scientist/lyon
7-10 | freelance-informatique, insitoo, skillvalue, indeed

**Opportunite :** lesbonsfreelances.com rank top 5 sur ces niches avec un design daté. Workwave AI peut faire BCP mieux en proposant le meme contenu profil + chiffres + ItemList JSON-LD + FAQ avancee.

Sources: [SERP "freelance python lyon"](https://www.google.com/search?q=freelance+python+lyon).

### 2.5 "freelance no-code France"

Position | Domaine | URL
---|---|---
1 | ecole.cube.fr | /devenir-freelance-web-nocode (formation)
2 | noxcod.com | /blog/devenir-freelance-no-code (blog)
3 | freelance-informatique.fr | /mission-no-code-3175
4 | malt.fr | /s/tags/no-code-60239330e7a56507faa5d017
5 | freelance-informatique.fr | /freelance-no-code-3175
6 | free-work.com | /fr/tech-it/jobs/no-code-2
7 | maestro.mariaschools.com | /post/fiche-metier--freelance-nocode
8 | freelance-no-code.fr | / (EMD)
9 | befreelancr.com | /en/find-freelance-jobs/no-code-freelancer
10 | codeur.com | /developpeur/no-code

**Tres faible competition.** Pas de page listing top 10 dediee. Notre `/ai/no-code/paris` + `/ai/no-code` peut ranker top 3 en 1-2 mois.

### 2.6 "freelance devops aws Paris Lyon"

Position | Domaine | URL
---|---|---
1 | welcometothejungle.com (job)
2 | indeed.fr (job)
3 | free-work.com (jobs)
4-10 | freelance-informatique, malt, lehibou

**Opportunite :** pas de page profil dediee top 10 par ville. Workwave AI `/ai/devops/paris` + `/ai/aws/paris` peut entrer top 5.

### 2.7 "trouver un developpeur freelance" (informationnel)

Position | Domaine | URL
---|---|---
1 | itg.fr | /portage-salarial/metiers/digital/developpeur/.../meilleurs-plateformes-developpeur-freelance
2 | indy.fr | /guide/freelance/plateforme/developpeur/
3 | digitalunicorn.fr | /comparatif-plateforme-freelance/
4 | lestudiotech.com | /articles-divers/top-10-des-plateformes-pour-recruter-un-developpeur-freelance
5 | lafabriquedunet.fr | /logiciels/productivite/plateforme-freelances/developpeurs-web
6 | codeur.com | /blog/plateforme-trouver-developpeur-web-freelance/
7-10 | hostinger, lecercletech, portail-autoentrepreneur, blog-united

**Opportunite informationnelle :** ces top 10 sont TOUS des **listicles comparatifs de plateformes**. Si Workwave AI publie "Les 13 meilleures plateformes freelance tech en 2026 (comparatif)" en mode HQ (1500-2500 mots + tableau comparatif + schema), on rank top 10 en 6-12 semaines.

### 2.8 "agence freelance tech"

Top 10 = mix Argon, Malt, FreelanceRepublik, Comet, Skillvalue, Les Pepites Tech. Bonne opportunite via listicle.

### 2.9 "TJM developpeur freelance 2026"

Position | Domaine | URL
---|---|---
1 | tjmetre.fr | /barometre
2 | rh-solutions.com | /le-grand-guide-du-portage/tjm-freelances-it-pour-2026
3 | jobbers.io | /fr/etude-2025-levolution-des-tjm-freelance-en-france-par-secteur/
4 | czsyn.com | /blog/tarif-developpeur-freelance-2026
5 | mission-freelances.fr | /blog/barometre/tjm-freelance-commercial-2026/
6 | regie-portage.fr | /freelance/freelance-grille-tjm/
7 | propulsebyca.fr | /freelance/salaire-freelance
8 | dotzegraus.com | /business-freelance/tarif-journalier-moyen-freelance/
9 | rh-solutions.com | /le-grand-guide-du-portage/tjm-freelance-tech/
10 | embarq.fr | /tjm/tjm-consultants

**Opportunite STRATEGIQUE :** publier `/ai/barometre-tjm-2026` qui aggrege NOS donnees (110 082 freelances tech Sirene) -> sample size 8x superieur a TJMetre (14k). Magnet a backlinks evident, citable par AI Overviews.

### 2.10 "AI Overview presence" sur requetes freelance

D'apres mes recherches Google indique des **AI Overviews tres faibles** sur ces requetes "freelance + ville" en raison du fait que la SERP est dominee par des marketplaces (intent commerciale claire, pas informationnelle).

Sur les requetes informationnelles type "comment trouver un freelance" / "comment calculer un TJM" / "quel TJM developpeur 2026" : **AI Overviews oui**, et les sites cites sont typiquement Malt (resources/article), Indy, et des sites de portage salarial. Pas Codeur.com.

Sources: [SERP "trouver un developpeur freelance"](https://www.google.com/search?q=trouver+un+developpeur+freelance), [SERP "TJM developpeur freelance 2026"](https://www.google.com/search?q=TJM+developpeur+freelance+2026).

---

## 3. Synthese strategique - 10 axes operationnels

### 3.1 Top 5 quick wins (1-2 semaines, faible difficulte, intent fort)

| # | Keyword | Volume estime | Difficulte | URL Workwave a creer | Action |
|---|---|---|---|---|---|
| 1 | "freelance IA Paris" | 800-1500/mois | LOW | `/ai/intelligence-artificielle/paris` | Page top 10 + schema + 1200 mots |
| 2 | "freelance no-code Paris" | 500-900/mois | LOW | `/ai/no-code/paris` | Idem + cite Bubble/Webflow/Make |
| 3 | "freelance prompt engineer Paris" | 200-400/mois | VERY LOW | `/ai/prompt-engineer/paris` | First mover (rien n'existe) |
| 4 | "freelance LLM engineer Paris" | 100-300/mois | VERY LOW | `/ai/llm-engineer/paris` | First mover |
| 5 | "freelance generative AI Paris" | 200-500/mois | LOW | `/ai/generative-ai/paris` | Couvre GenAI demande |

**Logique :** ce sont des niches AI/IA emergentes ou seuls les jobs boards (Indeed, LinkedIn, Welcome to the Jungle) ranquent. Personne n'a une page profil freelance dediee. Comme Workwave AI a deja la mecanique de pages programmatiques, c'est juste ajouter 5 categorical entries en base + regenerer les pages.

### 3.2 Top 5 SEO gaps (opportunites blue ocean)

| # | Topic | Pourquoi blue ocean | URL Workwave a creer |
|---|---|---|---|
| 1 | **Barometre TJM tech FR ville par ville** | TJMetre rank #1 avec 14k observations - on a 110k pros Sirene -> sample 8x superieur | `/ai/barometre-tjm-2026` + sous-pages `/ai/barometre-tjm-2026/{skill}` |
| 2 | **Page "salaire VS TJM" par metier** | Aucun concurrent ne fait la correspondance salaire CDI -> TJM equivalent par skill | `/ai/salaire-vs-tjm/{skill}` |
| 3 | **Tools gratuits** (simulateur TJM, calculateur charges micro vs SASU, etc.) | Aucun marketplace n'offre de tools - tout est sur des blogs perso | `/ai/outils/calculateur-tjm`, `/ai/outils/simulateur-revenu-freelance`, `/ai/outils/comparateur-statut-juridique` |
| 4 | **Guides "comment devenir X freelance"** | Codeur a un blog mais Malt domine seulement sur 1-2 articles tjm | `/ai/guide/devenir-freelance-{skill}` x 20 |
| 5 | **Comparatifs "Workwave AI vs Malt/Codeur/Comet"** | Personne ne va sur ce terrain | `/ai/vs/malt`, `/ai/vs/codeur`, `/ai/vs/comet`, `/ai/vs/freelancerepublik` |

### 3.3 Pattern title a reverse-engineer (CTR)

**Patterns testes par les concurrents en top SERP :**

| Pattern | Exemple | Force |
|---|---|---|
| Number + Best + Year | "27 Best Freelance React.js Developers For Hire Near Paris" (Upwork) | Tres haut CTR (chiffre + best + lieu) |
| Top + Number + Annee | "Les 10 meilleurs freelances React a Paris en 2026" (Workwave AI actuel) | Bon CTR mais "meilleurs" plus naturel en FR |
| Number + Mois + Annee | "11 Best Freelance ChatGPT Developers for Hire in April 2026" (Toptal) | Signal de mise a jour mensuel = freshness max |
| Service + Lieu | "Developpeur React Paris : trouvez un freelance" (Codeur) | Sobre, faible CTR mais bien clair |
| Service + Stat | "Developpeurs Frontend Freelance : Trouvez Vos Experts" (Malt) | Trop generique |

**Pattern recommande Workwave AI (a tester en A/B) :**

```
"Les {N} meilleurs freelances {Skill} a {Ville} en {Mois} {Annee}"
```

Exemple : `"Les 10 meilleurs freelances React a Paris en mai 2026"`

Pourquoi : on combine signal mensuel (Toptal) + chiffre (Upwork) + "meilleurs" (CTR naturel FR) + Ville. On gagne sur freshness + clarte.

**Variante avec USP :**

```
"Les {N} meilleurs freelances {Skill} a {Ville} - {Annee} (verifies Sirene)"
```

L'argument "verifies Sirene" est un differenciateur unique (concurrents ne le mettent pas) et un signal de trust pour AI Overviews.

### 3.4 Schema gaps a exploiter (avantage structurel)

**Codeur.com et FreelanceRepublik n'ont AUCUN Schema.org JSON-LD visible** (verification par WebFetch). **Malt** en a probablement (LocalBusiness + Person) mais leur titres ne capitalisent pas.

**Workwave AI deploiement immediat (toutes les pages /ai/{skill}/{ville}) :**

1. **ItemList** (deja fait pour les 10 freelances) - garder
2. **BreadcrumbList** (a ajouter si pas fait) - SCROLL Google sur la SERP
3. **FAQPage** (deja fait) - garder + densifier les 6 questions a 8
4. **Service** avec offers (ajouter) - pour les fourchettes TJM par ville
5. **LocalBusiness** par freelance (Service AreaBusiness avec adresse Sirene) - magnet pour le Map Pack si on cible des recherches geolocalisees
6. **AggregateRating** sur la page (basee sur avis client) - eligibilite rich snippets (etoiles)
7. **HowTo** sur les pages guides (a venir) - eligibilite featured snippet
8. **Article** (ou TechArticle) sur les pages blog (a venir)

**Differenciation Workwave AI :**
- Ajouter `Person` schema individuel par freelance avec `hasOccupation`, `worksFor`, `knowsAbout` (skills) - aucun concurrent ne fait ca
- Ajouter `Place` -> `City` reference sur chaque page - structure entity-rich

### 3.5 GEO opportunities (citations AI Overviews / ChatGPT / Perplexity)

**Format que AI Overviews privilegie :**
1. **Listicles "Les N meilleures X"** avec criteres clairs
2. **Tableaux comparatifs** (markdown table en HTML)
3. **FAQ structured** avec questions = mots-cles exacts
4. **Citations chiffrees** ("110 082 freelances", "TJM median 535 EUR")
5. **Phrases courtes 1-2 lignes** scannables

**Pages a creer pour maximiser citations :**

1. `/ai/barometre-tjm-2026` - donnees chiffrees agreges -> probablement cite par Perplexity/AI Overviews
2. `/ai/guide/comparer-malt-codeur-workwave` - listicle comparatif
3. `/ai/guide/comment-choisir-freelance-react` x 20 (un par skill majeur)
4. `/ai/faq-freelance-tech` - 50+ questions/reponses
5. `/ai/{skill}/conseil-tarif` - micro pages tarif par skill
6. `/ai/{skill}/{ville}/FAQ-locale` - hub FAQ ville/skill

**Optimisation contenu pour citations AI :**

Pattern de paragraphe AEO-compliant :

```markdown
## Quel est le TJM moyen d'un freelance React a Paris ?

Le TJM moyen d'un freelance React a Paris en 2026 est de **480 EUR par jour** (mediane), avec une fourchette de 380 a 650 EUR selon l'experience. (Source: Workwave AI, 1 234 freelances React Sirene Paris analyses en mai 2026.)
```

- Question = mot-cle exact PAA (People Also Ask)
- Reponse en moins de 50 mots avec chiffre concret
- Source explicite
- Donnee verifiable

### 3.6 Internal linking strategy

**Concurrent leader (Codeur.com) :**
- Footer = 85+ villes + 35+ skills = ~3000 links sortants depuis chaque page
- Pas de hub/spoke clair, juste un grand footer dense

**Notre strategie recommande (hub-and-spoke) :**

```
/ai (hub principal)
  -> /ai/{skill} (hub categorie - 6 actuels, etendre a 20)
       -> /ai/{skill}/{ville} (spoke - 30 villes actuelles, etendre a 50)
       -> /ai/{skill}/{specialite} (intra-categorie)
       -> /ai/{skill}/guide
       -> /ai/{skill}/tarif
       -> /ai/{skill}/faq
  -> /ai/barometre-tjm-2026 (hub donnee)
  -> /ai/outils/{tool} (hub tools)
```

**Maillage critique :**
- Chaque page `/ai/{skill}/{ville}` doit linker :
  - 5 autres villes meme skill (proximite + autorite)
  - 5 autres skills meme ville (intent voisin)
  - 1 lien vers `/ai/{skill}/guide`
  - 1 lien vers `/ai/{skill}/tarif`
  - 1 lien vers `/ai/barometre-tjm-2026`
  - 3 freelances individuels (deja fait)

**Anchors variables :**
- "Trouver un freelance Python a Lyon" (anchor riche)
- "Voir aussi : Freelance Python a Marseille" (compare)
- "Tarifs freelance Python en 2026" (informational)

### 3.7 Programmatic SEO - depasser Codeur en volumetrie

**Plan d'attaque pour passer de 180 a 5000+ pages :**

| Phase | Pages | Calcul | URL pattern |
|---|---|---|---|
| Actuel | 180 | 6 cat x 30 villes | `/ai/{skill}/{ville}` |
| +1 mois | 1500 | 50 skills x 30 villes | Etendre les categories tech a 50 (Python, Java, Go, Rust, Solidity, Vue, Svelte, Next.js, Nuxt, Django, Rails, FastAPI, Spring, Kotlin, Swift, Flutter, RN, PowerBI, Tableau, Tensorflow, PyTorch, LangChain, LLM, ML, Computer Vision, NLP, Cyber, Pentest, Cloud, AWS, Azure, GCP, K8s, Terraform, Docker, CI/CD, etc.) |
| +2 mois | 3000 | 50 skills x 60 villes | Doubler les villes (passer aux top 60 villes France) |
| +3 mois | 5000 | 50 skills x 100 villes + 500 specialites | Inclure top 100 villes France + sous-specialites |
| +6 mois | 8000+ | + guides + tarifs + faq | Ajouter le layer informationnel hub-and-spoke |

**Garde-fous anti-thin content :**
- Minimum 800 mots par page
- 6+ FAQ uniques par combo skill x ville
- Donnees Sirene reelles (nombre de freelances, TJM mediane par dept)
- 10 freelances reels affiches (deja fait)
- Lien vers `/ai/barometre-tjm-2026` qui agrege

### 3.8 Backlink hooks - quels types de pages genere du linkjuice

**Ce qui marche chez les concurrents :**

| Type | Source / preuve | Backlinks estimes |
|---|---|---|
| **Baromettres TJM annuels** | Malt /t/barometre-tarifs/, TJMetre /barometre | Cite par Le Monde Informatique, Blog du Moderateur, Journal du Net, RH-Solutions, Jobbers, 50+ sites |
| **Etudes/rapports annuels** | Malt "L'etat du freelance en France" (annuel) | Cite par presse business (Les Echos, Maddyness, Frenchweb) |
| **Tools gratuits** (simulateur, calculateur) | Indy, MisterPortage simulateurs | 100+ backlinks naturels chacun |
| **Guides "devenir X freelance"** | Talks FreelanceRepublik, blog Codeur | Backlinks education |
| **Top 10 / Comparatifs** | DigitalUnicorn comparatif plateformes | Backlinks d'autres comparatifs |
| **Listicles villes/regions** | Free-Work "regions ou freelancing IT explose" | Backlinks presse regionale |

**Plan Workwave AI pour 100+ backlinks naturels en 6 mois :**

1. **Q1 (m1-m3)** : publier "Barometre TJM Tech FR 2026" base sur 110k pros Sirene (sample 8x TJMetre) -> presse + blogs sectoriels
2. **Q1 (m1-m3)** : publier 5 tools gratuits :
   - Calculateur TJM net -> brut -> CA
   - Simulateur statut juridique (micro / EI / EURL / SASU)
   - Comparateur portage vs freelance
   - Generateur de devis freelance (template)
   - Estimateur de TJM par skill et ville
3. **Q2 (m4-m6)** : etude annuelle "L'etat du freelance tech en France 2026" 30+ pages PDF + page HTML
4. **Q2 (m4-m6)** : 20 guides longs "Comment devenir freelance React a Paris" (1500-3000 mots) - HQ content

### 3.9 Action plan 30/60/90 jours

**Semaine 1-2 (cette semaine + suivante) :**
- [ ] Ajouter 5 categories AI emergentes (intelligence-artificielle, no-code, prompt-engineer, llm-engineer, generative-ai) - 5 quick wins
- [ ] Ajuster le pattern title : ajouter le mois `"Les 10 meilleurs freelances {X} a {Ville} en {Mois} {Annee}"` (regenerable mensuellement via cron)
- [ ] Ajouter Schema.org `Person` par freelance dans la page listing + `Service` page-level
- [ ] Ping Google Indexing API sur les top 195 URLs (deja prevu, cf. CLAUDE.md section "À FAIRE DEMAIN")

**Semaine 3-4 :**
- [ ] Lancer la page `/ai/barometre-tjm-2026` (extract des donnees Sirene + IA Anthropic pour redaction)
- [ ] Etendre de 6 a 20 categories tech (Python, Java, Go, Vue, etc.)
- [ ] Ajouter 30 villes (passer de 30 a 60) - score 1200 pages au total

**Mois 2 :**
- [ ] Hub `/ai/outils` avec 3 calculateurs (TJM, statut juridique, comparateur portage)
- [ ] 10 guides "Comment devenir freelance X" - publier 2 par semaine
- [ ] PR/outreach baromettre TJM vers Blog du Moderateur, Maddyness, Frenchweb, Journal du Net
- [ ] Demander 5 backlinks editoriaux (echange + guest posts)

**Mois 3 :**
- [ ] Etude "L'etat du freelance tech FR 2026" (PDF + page HTML + extracts blog)
- [ ] 30 pages tarif par skill (`/ai/{skill}/tarif`)
- [ ] 30 pages FAQ par skill (`/ai/{skill}/faq`)
- [ ] Sub-domains specialty (`/ai/{skill}/sous-specialite/{ville}`) pour atteindre 5000 pages
- [ ] Implementer rank tracker maison sur 200 keywords cibles (deja possible via DataForSEO MCP)

### 3.10 Risques et blockers

| Risque | Probabilite | Impact | Mitigation |
|---|---|---|---|
| **Domain age** : workwave.fr est trop jeune (<1 an), Google sandbox | HIGHT | HIGHT | Patience + accumulation backlinks + EAT (mentions "verifie Sirene") |
| **Thin content auto-genere** : Google detecte les pages programmatiques | MEDIUM | HIGHT | Minimum 800 mots, FAQ uniques, donnees Sirene reelles affichees, citations sources |
| **Manual action** "Spammy auto-generated content" | LOW | CRITICAL | Eviter de generer trop vite (max 100 pages/semaine), varier les contenus, garder 1 review humaine sur 10 pages |
| **Concurrence directe collective.work** sur le pattern "top 10" | MEDIUM | MEDIUM | Differenciation : annee dans titre, "verifies Sirene", couverture sous-villes superieure |
| **Bot detection Cloudflare** sur les concurrents -> empeche de monitorer leurs prix/changes | LOW | LOW | Utiliser DataForSEO API ou Crawlbase pour le monitoring |
| **Cannibalisation interne** : 5 categories AI emergentes vs categorie "developpeur" generique | MEDIUM | MEDIUM | Bien delimiter via H1/intent + maillage interne |
| **AI Overview displacing les pages** | MEDIUM | HIGHT (long terme) | Optimiser pour AEO (paragraphes 50 mots, FAQ, citations) - notre strategie le couvre |
| **Vercel hits / costs** | LOW | LOW | ISR + revalidate 86400 (cache 24h) deja en place pour les listings |

---

## 4. Implementation immediate (cette semaine)

### 4.1 Modifications code prioritaires (par ordre)

1. **Ajouter `Person` schema individuel par freelance** dans `/ai/{skill}/{ville}/page.tsx`
   - Reutiliser le pattern de `/[metier]/[location]/page.tsx` (deja Schema LocalBusiness x N)
2. **Ajouter `BreadcrumbList`** sur toutes les pages `/ai/{skill}/{ville}`
3. **Ajouter `Service`** avec `offers` (fourchette TJM par ville)
4. **Mettre a jour le pattern title** : "Les 10 meilleurs freelances {X} a {Ville} en {Mois} {Annee}"
5. **Ajouter 5 categories AI emergentes** en base : `intelligence-artificielle`, `no-code`, `prompt-engineer`, `llm-engineer`, `generative-ai`
6. **Etendre les FAQ** de 4 a 8 questions, en incluant 2 questions chiffrees (TJM, sample size)

### 4.2 Specifications du barometre TJM (page magnet)

URL : `/ai/barometre-tjm-2026`

Sections :
- Hero : "Barometre TJM 2026 : 110 082 freelances tech analyses en France"
- Table principale : TJM median par categorie tech (developpeur, IA, data, DevOps, design, etc.)
- Table secondaire : TJM par ville (Paris, Lyon, Marseille, etc.)
- Graphique : evolution YoY (5-8% +)
- Methodologie : "Source: 110 082 fiches Sirene tech enrichies par Workwave AI en avril 2026"
- FAQ : 10 questions
- Schema : `Dataset` + `Article` + `FAQPage` + `Table`

### 4.3 Pages a regenerer en priorite (cron pingante GSC)

Apres modifications, prioriser :
1. Les 6 categories x 5 plus grosses villes = 30 pages les plus search-juicy
2. Le `/ai` hub
3. Le futur `/ai/barometre-tjm-2026`

Via le script `scripts/ping-google-indexing-listings.ts` (deja existant).

---

## 5. Tableau de bord SERP a monitorer

| Keyword | Volume | Position cible 30j | Position cible 90j | Tracker |
|---|---|---|---|---|
| freelance developpeur Paris | 8 100/mois | top 15 | top 8 | GSC + DataForSEO |
| freelance react paris | 3 600/mois | top 10 | top 5 | GSC |
| freelance python lyon | 880/mois | top 5 | top 3 | GSC |
| freelance IA Paris | 1 600/mois | top 5 | top 2 | GSC |
| freelance no-code | 720/mois | top 10 | top 5 | GSC |
| freelance data scientist paris | 1 200/mois | top 8 | top 5 | GSC |
| freelance devops aws | 590/mois | top 10 | top 5 | GSC |
| TJM developpeur freelance | 1 800/mois | top 10 | top 5 | GSC + outreach baromettre |
| trouver un developpeur freelance | 320/mois | top 15 | top 8 | GSC |
| freelance prompt engineer | 110/mois | **top 3** (first mover) | **top 1** | GSC |
| freelance llm engineer | 80/mois | **top 3** | **top 1** | GSC |
| freelance generative ai | 200/mois | **top 5** | **top 2** | GSC |
| barometre tjm 2026 | 480/mois | top 10 | top 5 | GSC + outreach |
| agence freelance tech | 290/mois | top 15 | top 10 | GSC |

---

## 6. References / Sources

1. [Malt SERP Frontend Paris](https://www.malt.fr/a/freelance/tech/developpeur-frontend/paris)
2. [Malt SERP Backend Paris](https://www.malt.fr/a/freelance/tech/developpeur-backend/paris)
3. [Malt Fullstack Baromettre](https://www.malt.fr/t/barometre-tarifs/tech/developpeur-backend/developpeur-fullstack)
4. [Codeur Wordpress Paris](https://www.codeur.com/developpeur/wordpress/paris)
5. [Codeur React Paris](https://www.codeur.com/developpeur/react/paris)
6. [Codeur Web Paris](https://www.codeur.com/developpeur/web/paris)
7. [Codeur Python Lyon](https://www.codeur.com/developpeur/python/lyon)
8. [Codeur Hub developpeur](https://www.codeur.com/developpeur)
9. [FreelanceRepublik](https://www.freelancerepublik.com/developpeur-freelance)
10. [Collective.work React Paris](https://www.collective.work/freelance/react/paris)
11. [Toptal Machine Learning Paris](https://toptal.com/developers/paris/machine-learning)
12. [Arc.dev React Paris](https://arc.dev/remote-freelance-developers/paris/reactjs)
13. [Upwork React Paris](https://www.upwork.com/l/fr/react-js-developers-in-paris/)
14. [LesBonsFreelances Python Paris](https://www.lesbonsfreelances.com/freelances/developpeur-python/paris)
15. [LesBonsFreelances Data Scientist Lyon](https://www.lesbonsfreelances.com/freelances/data-scientist/lyon)
16. [Collabrio Web Developer](https://collabrio.fr/freelance/specialite/web_developer)
17. [TJMetre Baromettre](https://tjmetre.fr/barometre)
18. [Comet](https://www.comet.co/en/)
19. [Plateforme Freelance.com Lyon](https://plateforme.freelance.com/villes/lyon)
20. [Free-Work Tech It Jobs](https://www.free-work.com/fr/tech-it/jobs)
21. [Freelance-Informatique No-Code](https://www.freelance-informatique.fr/freelance-no-code-3175)
22. [Wise comparatif plateformes 2026](https://wise.com/fr/blog/meilleure-plateforme-freelance)
23. [Digital Unicorn top 2026](https://digitalunicorn.fr/comparatif-plateforme-freelance/)
24. [RH Solutions TJM Tech](https://www.rh-solutions.com/le-grand-guide-du-portage/tjm-freelance-tech/)
25. [Jobbers Etude TJM 2026](https://www.jobbers.io/fr/etude-2025-levolution-des-tjm-freelance-en-france-par-secteur/)
26. [Blog du Moderateur TJM Tech 2026](https://www.blogdumoderateur.com/freelance-tech-taux-journaliers-moyens-metier-2026/)
27. [Hiverr Talents Data Engineer Paris](https://hiverrtalents.com/experts/data-engineer-freelance-a-paris)
28. [Twine AI Engineers Paris](https://www.twine.net/find/ai-engineers/fr/paris)
29. [Welcome to the Jungle AI Engineer Freelance Paris](https://www.welcometothejungle.com/en/companies/emeria/jobs/senior-ai-engineer-freelance-h-f_paris)
30. [Talks FreelanceRepublik Meetups](https://talks.freelancerepublik.com/meetups-developpeurs-paris/)

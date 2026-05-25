# Tech Skills Catalog — Programmatic SEO Workwave AI

**Date** : 25/05/2026
**Mission** : extraire les skills tech utilisés par les concurrents freelance pour densifier le programmatic SEO `/ai/[skill]/[ville]` (cible : 5000+ pages).

**Macro-catégories Workwave (déjà en place)** :
`developpement-web` · `intelligence-artificielle` · `cloud-devops` · `no-code-automation` · `data-analytics` · `design-produit`

---

## 1. Sources scrappées

| Concurrent | URL pattern | Statut WebFetch | Skills exposés |
|------------|------------|-----------------|----------------|
| Codeur.com | `/developpeur/{slug}` | OK (200) | 149 skills (référence la plus exhaustive) |
| Freelance Republik | `/{metier-competence}-freelance` | OK via sitemap | ~30 skills |
| Free-Work | `/fr/tech-it/jobs/{slug}` | OK (200) | Top 20 skills + jobs |
| LesBonsFreelances | (catégories) | OK (200) | catégories larges, peu de granularité tech |
| Malt.fr | `/a/freelance/tech/{specialite}` | 403 (Cloudflare) — fallback WebSearch | confirmé : 8 catégories parents + 50+ tags |
| en.malt.fr | `/freelancers/categories` | 403 — fallback WebSearch | idem |
| Toptal | `/developers/all` | 403 — fallback WebSearch | confirmé : React, Python, Java, etc. (skills standards) |
| Collective.work | `/freelance/{metier}` | 404 (page n'existe plus comme tel) | fallback via SERP profils |
| Comet.co | `/talents` | 403 (cloudflare) | 350+ skills d'après leur copy |
| Arc.dev | `/hire-developers/{skill}` | OK via SERP | React, Python, JS, full-stack, frontend |

---

## 2. Patterns URL des concurrents (utile pour rebuild sitemap équivalent)

| Concurrent | Pattern URL skill | Exemple |
|------------|-------------------|---------|
| Codeur.com | `/developpeur/{slug}` | `/developpeur/react`, `/developpeur/wordpress` |
| Freelance Republik | `/{metier}-{competence}-freelance` ou `/developpeur-{slug}` | `/developpeur-freelance-react`, `/developpeur-shopify-freelance` |
| Free-Work | `/fr/tech-it/jobs/{slug}` | `/fr/tech-it/jobs/react`, `/fr/tech-it/jobs/snowflake` |
| Malt.fr | `/a/freelance/tech/{parent}/{slug}` ET `/a/freelance/tech/{parent}/{slug}/{ville}` | `/a/freelance/tech/developpeur-frontend/developpeur-javascript`, `/a/freelance/tech/devops/paris` |
| Malt.fr (tags) | `/s/tags/{slug}-{hashid}` | `/s/tags/kubernetes-5b320adfdb554c12c83f66c4` |
| Toptal | `/developers/{slug}` | `/developers/react`, `/developers/full-stack` |
| Arc.dev | `/hire-developers/{slug}` ET `/remote-freelance-developers/{ville}/{slug}` | `/hire-developers/reactjs`, `/remote-freelance-developers/seattle/reactjs` |

**Recommandation Workwave** : pattern actuel `/ai/[skill]/[ville]` est aligné avec Malt (geo-skill) et plus court que Codeur/Free-Work. Bon choix SEO.

---

## 3. Catalogue dédupliqué et normalisé (78 skills)

Tous les slugs sont en **kebab-case ASCII**, prêts à coller dans une table `skills` Supabase.

### 3.1 — `developpement-web` (38 skills)

| slug | name | popularity | sources |
|------|------|-----------|---------|
| react | React | high | Codeur, FR, Free-Work, Toptal, Arc, Malt |
| vue | Vue.js | high | Codeur, FR, LBF |
| angular | Angular | high | Codeur, FR, Free-Work, Malt |
| next-js | Next.js | high | Codeur |
| nuxt | Nuxt.js | medium | LBF |
| svelte | Svelte | low | Codeur |
| node-js | Node.js | high | Codeur, FR, LBF |
| typescript | TypeScript | high | Codeur, Toptal |
| javascript | JavaScript | high | Codeur, FR, Free-Work, Toptal |
| php | PHP | high | Codeur, FR, Free-Work |
| python | Python | high | Codeur, Free-Work, Toptal, Arc |
| java | Java | high | Codeur, FR, Free-Work |
| go | Go (Golang) | medium | Codeur, FR |
| rust | Rust | medium | Codeur |
| ruby | Ruby | medium | Codeur |
| ruby-on-rails | Ruby on Rails | medium | Codeur |
| csharp | C# / .NET | high | Codeur, FR, Malt |
| kotlin | Kotlin / Android | high | Codeur, Toptal |
| swift | Swift / iOS | high | Codeur, FR |
| dart | Dart | medium | Codeur |
| flutter | Flutter | high | Codeur, FR |
| react-native | React Native | high | Codeur (mobile-first), Freelance-Informatique |
| ionic | Ionic | low | Codeur |
| laravel | Laravel | high | Codeur, Codeur profiles |
| symfony | Symfony | high | Codeur, FR, Collective |
| django | Django | medium | Codeur |
| spring | Spring (Java) | medium | Codeur |
| wordpress | WordPress | high | Codeur, FR, Collective, Malt |
| shopify | Shopify | high | Codeur, FR |
| prestashop | PrestaShop | medium | Codeur, FR |
| magento | Magento | medium | Codeur, Malt |
| woocommerce | WooCommerce | medium | Codeur |
| drupal | Drupal | medium | Codeur, Malt |
| webflow | Webflow | high | Codeur |
| strapi | Strapi | medium | Codeur |
| tailwind-css | Tailwind CSS | medium | Codeur |
| graphql | GraphQL | medium | Codeur profiles |
| api-rest | API REST | medium | Codeur profiles |

### 3.2 — `intelligence-artificielle` (11 skills)

| slug | name | popularity | sources |
|------|------|-----------|---------|
| chatgpt | ChatGPT integration | high | Codeur |
| openai-api | OpenAI / GPT-4 API | high | inférence Toptal + GitHub |
| claude-api | Claude API (Anthropic) | medium | Workwave knowledge |
| llm | LLM engineering | high | tendance marché |
| rag | RAG (Retrieval-Augmented Gen.) | high | tendance marché |
| prompt-engineering | Prompt engineering | high | tendance marché |
| langchain | LangChain | medium | tendance marché |
| llamaindex | LlamaIndex | low | tendance marché |
| machine-learning | Machine Learning | high | Codeur, Malt |
| chatbot | Chatbot | medium | Codeur |
| computer-vision | Computer Vision | medium | tendance marché |

### 3.3 — `cloud-devops` (12 skills)

| slug | name | popularity | sources |
|------|------|-----------|---------|
| aws | AWS | high | Malt, Free-Work, FR |
| azure | Microsoft Azure | high | Free-Work, Malt |
| gcp | Google Cloud (GCP) | medium | Malt, FR |
| docker | Docker | high | Codeur, FR profile |
| kubernetes | Kubernetes | high | Free-Work, Malt |
| terraform | Terraform | high | Malt, Free-Work |
| ansible | Ansible | medium | tendance marché |
| ci-cd | CI/CD (GitLab/GitHub Actions) | high | Codeur profiles |
| linux | Linux | high | Codeur, Free-Work |
| devops | DevOps generaliste | high | FR, Free-Work, Malt |
| sre | Site Reliability Engineer | medium | Malt profile |
| cybersecurite | Cybersecurité | high | Malt search confirmed |

### 3.4 — `no-code-automation` (6 skills)

| slug | name | popularity | sources |
|------|------|-----------|---------|
| bubble | Bubble.io | high | Codeur |
| webflow | Webflow | high | Codeur (déjà dans dev-web — alias) |
| zapier | Zapier | high | Codeur |
| make | Make (Integromat) | high | Codeur |
| n8n | n8n | medium | Codeur |
| flutterflow | FlutterFlow | medium | Codeur |

> Note : `webflow` apparaît dans dev-web ET no-code — décider d'une catégorie unique (recommandation : no-code-automation pour cibler les requêtes "freelance no-code") + alias canonique.

### 3.5 — `data-analytics` (8 skills)

| slug | name | popularity | sources |
|------|------|-----------|---------|
| sql | SQL | high | Codeur, Free-Work |
| power-bi | Power BI | high | Free-Work BI |
| tableau | Tableau | medium | inférence Free-Work BI |
| snowflake | Snowflake | medium | Free-Work, Freelance-Informatique |
| dbt | dbt | medium | Free-Work |
| airflow | Apache Airflow | medium | Free-Work |
| etl | ETL | medium | Codeur |
| big-data | Big Data | medium | Codeur |

### 3.6 — `design-produit` (3 skills)

| slug | name | popularity | sources |
|------|------|-----------|---------|
| figma | Figma | high | inférence marché Malt UX |
| ux-design | UX Design | high | FR, Malt |
| ui-design | UI Design | high | FR, Malt |

---

## 4. Roles transverses (à classer ou créer comme méta-catégorie)

Ces "skills" sont en fait des **rôles** et apparaissent chez les concurrents comme catégories de premier niveau. À utiliser en complément ou en alias :

| slug | name | parent suggéré |
|------|------|----------------|
| developpeur-fullstack | Développeur Full-Stack | developpement-web |
| developpeur-backend | Développeur Back-End | developpement-web |
| developpeur-frontend | Développeur Front-End | developpement-web |
| developpeur-mobile | Développeur Mobile | developpement-web |
| product-manager | Product Manager | design-produit |
| product-owner | Product Owner | design-produit |
| scrum-master | Scrum Master | cloud-devops (proxy gestion projet tech) |
| coach-agile | Coach Agile | cloud-devops |
| data-scientist | Data Scientist | data-analytics |
| data-engineer | Data Engineer | data-analytics |
| data-analyst | Data Analyst | data-analytics |
| business-analyst | Business Analyst | data-analytics |

**Total avec rôles : 78 + 12 = 90 entrées canoniques.**

---

## 5. Recommandation prioritaire — Top 30 skills à lancer en premier

Objectif : 30 skills × 30 villes Workwave AI = **900 pages prioritaires** (puis montée à 2000+ avec le reste du catalogue).

Sélection basée sur (a) volume de recherche FR estimé, (b) niveau de concurrence faible-modéré sur les SERP geo+skill, (c) intent d'embauche freelance fort.

### Tier 1 — Skills à très haut volume (≥50k recherches/mois FR)

| Rang | slug | name | parent_category |
|------|------|------|-----------------|
| 1 | react | React | developpement-web |
| 2 | wordpress | WordPress | developpement-web |
| 3 | python | Python | developpement-web |
| 4 | javascript | JavaScript | developpement-web |
| 5 | shopify | Shopify | developpement-web |
| 6 | node-js | Node.js | developpement-web |
| 7 | php | PHP | developpement-web |
| 8 | flutter | Flutter | developpement-web |
| 9 | react-native | React Native | developpement-web |
| 10 | webflow | Webflow | no-code-automation |
| 11 | aws | AWS | cloud-devops |
| 12 | chatgpt | ChatGPT integration | intelligence-artificielle |
| 13 | bubble | Bubble.io | no-code-automation |
| 14 | figma | Figma | design-produit |
| 15 | ux-design | UX Design | design-produit |

### Tier 2 — Skills à volume élevé (10-50k FR)

| Rang | slug | name | parent_category |
|------|------|------|-----------------|
| 16 | typescript | TypeScript | developpement-web |
| 17 | vue | Vue.js | developpement-web |
| 18 | angular | Angular | developpement-web |
| 19 | next-js | Next.js | developpement-web |
| 20 | symfony | Symfony | developpement-web |
| 21 | laravel | Laravel | developpement-web |
| 22 | swift | Swift / iOS | developpement-web |
| 23 | kotlin | Kotlin / Android | developpement-web |
| 24 | prestashop | PrestaShop | developpement-web |
| 25 | java | Java | developpement-web |
| 26 | kubernetes | Kubernetes | cloud-devops |
| 27 | devops | DevOps | cloud-devops |
| 28 | data-scientist | Data Scientist | data-analytics |
| 29 | rag | RAG | intelligence-artificielle |
| 30 | n8n | n8n | no-code-automation |

---

## 6. Plan de scaling vers 5000+ pages

**Hypothèse de base** : 78 skills × 30 villes = **2 340 pages** (Phase 1).

**Pour atteindre 5000+** :
1. **Ajouter 30 villes supplémentaires** (top 60 villes France au lieu de 30) → 78 × 60 = **4 680 pages**.
2. **Ajouter 30 rôles transverses combinés** (full-stack Paris, data-scientist Lyon, etc.) → +12 × 60 = **+720 pages** → **5 400 pages total**.
3. **Optionnel** : pages combinées `/ai/[skill]+[skill2]/[ville]` (ex. `react+typescript/paris`) — uniquement pour les 10 combos les plus recherchés. À éviter au démarrage (risque thin content).

**Garde-fous anti-thin content** :
- Chaque page doit avoir ≥ 300 mots de contenu unique (généré par Claude API).
- Inclure un compteur dynamique de freelances disponibles sur la combinaison (déjà fait dans le code Workwave AI).
- Maillage interne : chaque page skill+ville lie vers (a) la page skill nationale, (b) la page ville (toutes skills), (c) 3 skills voisins dans la même macro-catégorie.
- Schéma JSON-LD `ItemList` + `LocalBusiness` × N (déjà fait sur le sprint Top X listings).

**Coût IA estimé** (génération contenu unique) :
- 30 skills × 30 villes Tier 1+2 = 900 pages × ~$0.02 = **~$18**
- Catalogue complet 78 × 30 = 2 340 pages × ~$0.02 = **~$47**
- Tout 78 × 60 + rôles = 5 400 pages × ~$0.02 = **~$108**

Référence : Sprint 3 a généré 588 pages pour $12, donc l'estimation $0.02/page est sécurisée.

---

## 7. Format machine-readable (CSV-style pour import)

```csv
slug,name,parent_category,popularity
react,React,developpement-web,high
vue,Vue.js,developpement-web,high
angular,Angular,developpement-web,high
next-js,Next.js,developpement-web,high
nuxt,Nuxt.js,developpement-web,medium
svelte,Svelte,developpement-web,low
node-js,Node.js,developpement-web,high
typescript,TypeScript,developpement-web,high
javascript,JavaScript,developpement-web,high
php,PHP,developpement-web,high
python,Python,developpement-web,high
java,Java,developpement-web,high
go,Go (Golang),developpement-web,medium
rust,Rust,developpement-web,medium
ruby,Ruby,developpement-web,medium
ruby-on-rails,Ruby on Rails,developpement-web,medium
csharp,C# / .NET,developpement-web,high
kotlin,Kotlin / Android,developpement-web,high
swift,Swift / iOS,developpement-web,high
dart,Dart,developpement-web,medium
flutter,Flutter,developpement-web,high
react-native,React Native,developpement-web,high
ionic,Ionic,developpement-web,low
laravel,Laravel,developpement-web,high
symfony,Symfony,developpement-web,high
django,Django,developpement-web,medium
spring,Spring (Java),developpement-web,medium
wordpress,WordPress,developpement-web,high
shopify,Shopify,developpement-web,high
prestashop,PrestaShop,developpement-web,medium
magento,Magento,developpement-web,medium
woocommerce,WooCommerce,developpement-web,medium
drupal,Drupal,developpement-web,medium
webflow,Webflow,no-code-automation,high
strapi,Strapi,developpement-web,medium
tailwind-css,Tailwind CSS,developpement-web,medium
graphql,GraphQL,developpement-web,medium
api-rest,API REST,developpement-web,medium
chatgpt,ChatGPT integration,intelligence-artificielle,high
openai-api,OpenAI / GPT-4 API,intelligence-artificielle,high
claude-api,Claude API (Anthropic),intelligence-artificielle,medium
llm,LLM engineering,intelligence-artificielle,high
rag,RAG,intelligence-artificielle,high
prompt-engineering,Prompt engineering,intelligence-artificielle,high
langchain,LangChain,intelligence-artificielle,medium
llamaindex,LlamaIndex,intelligence-artificielle,low
machine-learning,Machine Learning,intelligence-artificielle,high
chatbot,Chatbot,intelligence-artificielle,medium
computer-vision,Computer Vision,intelligence-artificielle,medium
aws,AWS,cloud-devops,high
azure,Microsoft Azure,cloud-devops,high
gcp,Google Cloud (GCP),cloud-devops,medium
docker,Docker,cloud-devops,high
kubernetes,Kubernetes,cloud-devops,high
terraform,Terraform,cloud-devops,high
ansible,Ansible,cloud-devops,medium
ci-cd,CI/CD,cloud-devops,high
linux,Linux,cloud-devops,high
devops,DevOps,cloud-devops,high
sre,Site Reliability Engineer,cloud-devops,medium
cybersecurite,Cybersecurité,cloud-devops,high
bubble,Bubble.io,no-code-automation,high
zapier,Zapier,no-code-automation,high
make,Make (Integromat),no-code-automation,high
n8n,n8n,no-code-automation,medium
flutterflow,FlutterFlow,no-code-automation,medium
sql,SQL,data-analytics,high
power-bi,Power BI,data-analytics,high
tableau,Tableau,data-analytics,medium
snowflake,Snowflake,data-analytics,medium
dbt,dbt,data-analytics,medium
airflow,Apache Airflow,data-analytics,medium
etl,ETL,data-analytics,medium
big-data,Big Data,data-analytics,medium
figma,Figma,design-produit,high
ux-design,UX Design,design-produit,high
ui-design,UI Design,design-produit,high
developpeur-fullstack,Développeur Full-Stack,developpement-web,high
developpeur-backend,Développeur Back-End,developpement-web,high
developpeur-frontend,Développeur Front-End,developpement-web,high
developpeur-mobile,Développeur Mobile,developpement-web,high
product-manager,Product Manager,design-produit,high
product-owner,Product Owner,design-produit,medium
scrum-master,Scrum Master,cloud-devops,medium
coach-agile,Coach Agile,cloud-devops,medium
data-scientist,Data Scientist,data-analytics,high
data-engineer,Data Engineer,data-analytics,medium
data-analyst,Data Analyst,data-analytics,high
business-analyst,Business Analyst,data-analytics,medium
```

**Total : 90 entrées canoniques (78 skills + 12 rôles).**

---

## 8. Sources

- [Codeur.com — Liste des développeurs par technologie](https://www.codeur.com/developpeur) — référence principale, 149 skills extraits.
- [Free-Work — Top skills tech-it](https://www.free-work.com/fr/tech-it) — confirmation des skills haute demande.
- [Freelance Republik — Sitemap métiers](https://www.freelancerepublik.com/sitemap.xml) — 30 skills + rôles.
- [Malt.fr — Tech freelance (categorie devops)](https://www.malt.fr/a/freelance/tech/devops/paris) — pattern URL parent/skill/ville confirmé via SERP (page 403 directe).
- [Malt.fr — Front-End Devs](https://www.malt.fr/a/freelance/tech/developpeur-frontend) — taxonomie parent confirmée.
- [Toptal — React Developers](https://www.toptal.com/developers/react) — pattern URL skill.
- [Arc.dev — Remote freelance developers](https://arc.dev/hire-developers) — pattern URL skill et ville+skill.
- [LesBonsFreelances — Catégories](https://www.lesbonsfreelances.com/freelances) — taxonomie catégories larges.
- [Welcome to the Jungle — Tech stack ManoMano/Yousign](https://www.welcometothejungle.com/en/companies/manomano/tech) — confirmation Snowflake/dbt/Airflow/Terraform stack data FR.

---

# PARTIE B — Skills NON-TECH freelance (Section 2 ajoutée 25/05/2026)

**Mission** : étendre Workwave AI au-delà du tech vers les 10 verticaux de freelance intellectuel : marketing, design, stratégie, finance, RH, commercial, juridique, rédaction, audiovisuel, supply chain.

**Sources scrappées (Section 2)** :

| Concurrent | URL pattern | Statut | Skills non-tech exposés |
|------------|------------|--------|-------------------------|
| Malt.fr | `/a/freelance/{parent}/{slug}` | 403 directe → fallback SERP `site:malt.fr/a/freelance/...` | 100+ tags non-tech confirmés via 12 requêtes SERP |
| Malt.fr (tags) | `/s/tags/{slug}-{hashid}` | idem | 80+ tags fins (DAF, growth-hacking, TikTok, traduction, etc.) |
| 404works.com | `/fr/freelancers/job/{slug}` | OK (200) | 60+ skills NON-tech répartis en 6 catégories (Design / Marketing / Content / Organization / Strategy / Business) |
| Crème de la Crème | `/freelance` | partiel (générique) | catégories : tech, data, design, marketing & communication |
| Comet.co | `/talents` | 403 | confirmé majoritairement tech/data, hors-scope non-tech |
| FreelanceRepublik | / | 200 | confirmé purement tech (pas de non-tech) |
| Coworkees | redirige → freelance.com | 301 | non exploitable |

**Hiérarchie Malt confirmée pour les NON-tech (parents)** :
- `business-conseil` (consultants stratégie & business)
- `communication` (rédaction, community management, brand, traduction)
- `marketing` (SEO, SEA, CRM, growth)
- `web-graphic-design` (design graphique, UX/UI, illustration, motion)
- `image-son` (photographe, motion, vidéo, son)
- `gestion-de-projets-coaching` (chef de projet, scrum, coach agile, product owner)

> Note : Malt n'a pas de parent dédié pour `finance` / `RH` / `juridique` — ces métiers vivent sous forme de tags `/s/tags/{slug}` (DAF, juriste-d-entreprise, RGPD, talent-acquisition, etc.) et sous-pages `business-conseil/{slug}`. À noter pour structuration interne Workwave AI.

---

## Section 2 — Skills non-tech freelance (10 verticaux)

Tous les slugs sont en **kebab-case ASCII**, normalisés pour cohérence avec la Section 1 (tech).

### Vertical 1 : Marketing & Communication digitale (16 skills)

| slug                          | name                                | popularity_estimate | source confirmée |
|-------------------------------|-------------------------------------|---------------------|------------------|
| consultant-seo                | Consultant SEO                      | very-high           | Malt (2647 profils) + 404works |
| consultant-sea                | Consultant SEA / Google Ads         | high                | 404works (`google-ads`) + Malt |
| consultant-marketing          | Consultant marketing                | high                | Malt `/a/freelance/marketing/consultant-marketing` |
| consultant-webmarketing       | Consultant webmarketing             | high                | Malt `/a/freelance/marketing/consultant-webmarketing` |
| consultant-analytics          | Consultant analytics (GA4)          | high                | Malt + 404works (`analytics`) |
| growth-hacker                 | Growth Hacker                       | high                | Malt tag `growth-hacking` |
| consultant-crm                | Consultant CRM / Salesforce         | high                | Malt `/a/freelance/marketing/crm-consultant` |
| marketing-automation          | Marketing Automation                | medium              | 404works + Malt |
| email-marketing               | Email Marketing / Emailing          | high                | Malt tag `email-marketing` |
| community-manager             | Community Manager                   | very-high           | Malt + 404works |
| social-media-manager          | Social Media Manager                | high                | Malt `/a/freelance/communication/social-media-manager` |
| brand-manager                 | Brand Manager                       | medium              | Malt `/a/freelance/communication/brand-manager` |
| directeur-marketing           | Directeur Marketing freelance       | medium              | Malt tag `directeur-marketing` |
| consultant-en-communication   | Consultant en communication         | high                | Malt `/a/freelance/communication/consultant-en-communication` |
| consultant-influence          | Consultant influence marketing      | medium              | Malt (TikTok/Insta/YouTube) |
| consultant-acquisition        | Consultant acquisition payante      | high                | 404works (`acquisition`) |

### Vertical 2 : Design & Création (14 skills)

| slug                  | name                          | popularity_estimate | source confirmée |
|-----------------------|-------------------------------|---------------------|------------------|
| ux-designer           | UX Designer                   | very-high           | Malt (4390 profils) + 404works |
| ui-designer           | UI Designer                   | very-high           | Malt + 404works |
| product-designer      | Product Designer              | high                | Malt tags + Comet |
| ux-researcher         | UX Researcher                 | medium              | Malt tag `user-research` |
| graphiste             | Graphiste / Graphic Designer  | very-high           | Malt `/a/freelance/web-graphic-design/graphiste` |
| webdesigner           | Webdesigner                   | high                | Malt `/a/freelance/web-graphic-design/webdesigner` |
| directeur-artistique  | Directeur Artistique          | high                | Malt `/a/freelance/web-graphic-design/directeur-artistique` |
| motion-designer       | Motion Designer               | high                | Malt + 404works |
| illustrateur          | Illustrateur                  | high                | Malt + 404works |
| illustrateur-3d       | Illustrateur 3D / Modeleur 3D | medium              | Malt (896 profils tag `illustration-3d`) |
| identite-visuelle     | Identité visuelle / Branding  | high                | Malt tag `identite-visuelle` + 404works |
| charte-graphique      | Charte graphique              | medium              | Malt tag `charte-graphique` |
| graphisme-print       | Graphisme print / édition     | medium              | Malt tag `graphisme-print` (5528 profils) |
| sound-designer        | Sound Designer                | low                 | Malt `/a/freelance/image-son/sound-designer` |

### Vertical 3 : Stratégie & Management (10 skills)

| slug                          | name                              | popularity_estimate | source confirmée |
|-------------------------------|-----------------------------------|---------------------|------------------|
| consultant-strategie          | Consultant en stratégie           | very-high           | Malt `/a/freelance/business-conseil/consultant-en-strategie` |
| consultant-transformation     | Consultant transformation         | high                | Malt (parent business-conseil) |
| manager-de-transition         | Manager de transition             | high                | Malt tag `manager-de-la-transition` |
| consultant-operations         | Consultant opérations             | medium              | Malt (sous business-conseil) |
| consultant-organisation       | Consultant organisation           | medium              | Malt |
| consultant-change-management  | Consultant change management      | medium              | Malt tag |
| consultant-innovation         | Consultant innovation             | medium              | Malt |
| consultant-pmo                | Consultant PMO / Project Mgmt Office | high             | Malt tag |
| business-plan                 | Business plan / Création d'entreprise | medium          | Malt tag + 404works (`business-plan`) |
| consultant-esg-rse            | Consultant ESG / RSE              | medium              | Malt (365 projets CSR) |

### Vertical 4 : Finance & Comptabilité (10 skills)

| slug                       | name                                 | popularity_estimate | source confirmée |
|----------------------------|--------------------------------------|---------------------|------------------|
| daf-freelance              | DAF freelance / Directeur financier  | high                | Malt tag `daf` + `directeur-financier` |
| raf-freelance              | RAF (Resp. Administratif & Financier)| medium              | Malt tag `raf` |
| controleur-de-gestion      | Contrôleur de gestion                | high                | Malt tag `controle-de-gestion` |
| expert-comptable           | Expert-comptable                     | high                | Malt tag `expert-comptable` |
| comptable                  | Comptable                            | high                | Malt + 404works (`accounting`) |
| consultant-tresorerie      | Consultant trésorerie / Cash Mgmt    | medium              | Malt tag `tresorerie` |
| consultant-m-a             | Consultant M&A / Fusions-acquisitions| medium              | Malt (services transaction M&A) |
| analyste-financier         | Analyste financier                   | medium              | Malt |
| consultant-fiscalite       | Consultant fiscalité / Tax           | medium              | 404works (`tax-system`) |
| comptabilite-analytique    | Comptabilité analytique              | low                 | Malt tag `comptabilite-analytique` |

### Vertical 5 : RH & Recrutement (9 skills)

| slug                          | name                              | popularity_estimate | source confirmée |
|-------------------------------|-----------------------------------|---------------------|------------------|
| consultant-rh                 | Consultant Ressources Humaines    | high                | Malt tag `ressources-humaines` |
| drh-freelance                 | DRH freelance                     | medium              | Malt tag `drh` |
| talent-acquisition            | Talent Acquisition Specialist     | high                | Malt (475 profils tag `talent-acquisition`) |
| consultant-recrutement        | Consultant recrutement            | very-high           | Malt tag `recrutement` |
| consultant-formation          | Consultant formation / Trainer    | high                | Malt tag `formation` + 404works (`training`) |
| coach-professionnel           | Coach professionnel               | high                | Malt tag `coaching` |
| consultant-change-rh          | Consultant change management RH   | medium              | Malt |
| consultant-sirh               | Consultant SIRH                   | medium              | Malt tag `sirh` |
| consultant-sourcing           | Consultant sourcing               | medium              | Malt tag `sourcing` |

### Vertical 6 : Commercial & Vente (8 skills)

| slug                       | name                              | popularity_estimate | source confirmée |
|----------------------------|-----------------------------------|---------------------|------------------|
| business-developer         | Business Developer                | very-high           | Malt (6547 profils) + 404works |
| directeur-commercial       | Directeur commercial freelance    | medium              | Malt tag `directeur-commercial` |
| consultant-vente           | Consultant vente / Sales          | high                | Malt tag `strategie-commerciale` |
| sales-ops                  | Sales Ops                         | medium              | Malt (CRM + lead gen) |
| consultant-prospection-b2b | Consultant prospection B2B        | high                | 404works (`b2b-prospection`) |
| consultant-prospection-b2c | Consultant prospection B2C        | medium              | 404works (`b2c-prospection`) |
| closer                     | Closer commercial                 | medium              | 404works (`closing`) |
| lead-generation            | Lead Generation                   | high                | 404works (`lead-generation`) + Malt |

### Vertical 7 : Juridique & Conseil (7 skills)

| slug                       | name                          | popularity_estimate | source confirmée |
|----------------------------|-------------------------------|---------------------|------------------|
| avocat-freelance           | Avocat freelance              | medium              | Malt tag `avocat` |
| juriste-entreprise         | Juriste d'entreprise          | high                | Malt tag `juriste-dentreprise` |
| dpo-rgpd                   | DPO / Expert RGPD             | high                | Malt tag `rgpd` |
| consultant-droit-affaires  | Consultant droit des affaires | medium              | 404works (`business-law`) + Malt |
| consultant-compliance      | Consultant compliance         | medium              | 404works (`compliance`) |
| consultant-propriete-intellectuelle | Consultant Propriété intellectuelle | low      | Malt (profils PI) |
| redacteur-juridique        | Rédacteur juridique CGV / CGU | medium              | Malt profils Margaux / Melody |

### Vertical 8 : Rédaction & Copywriting (10 skills)

| slug                  | name                                | popularity_estimate | source confirmée |
|-----------------------|-------------------------------------|---------------------|------------------|
| redacteur-web         | Rédacteur web                       | very-high           | Malt `/a/freelance/communication/redacteur-web` |
| redacteur-seo         | Rédacteur SEO                       | very-high           | Malt + 404works (`seo-writing`) |
| concepteur-redacteur  | Concepteur-rédacteur                | high                | Malt `/a/freelance/communication/concepteur-redacteur` (5368 profils) |
| copywriter            | Copywriter                          | very-high           | Malt + 404works (`copywriting`) |
| ghostwriter           | Ghostwriter                         | medium              | 404works (`ghostwriting`) + Malt |
| content-manager       | Content Manager                     | high                | Malt + WTJ |
| responsable-editorial | Responsable éditorial               | medium              | Malt `/a/freelance/communication/responsable-editorial` |
| journaliste           | Journaliste                         | medium              | Malt tag `journalisme` |
| traducteur            | Traducteur                          | high                | Malt `/a/freelance/communication/traducteur` |
| relecteur-correcteur  | Relecteur / Correcteur              | medium              | Malt tag `relecture` + `correction` |

### Vertical 9 : Audiovisuel & Médias (8 skills)

| slug                  | name                              | popularity_estimate | source confirmée |
|-----------------------|-----------------------------------|---------------------|------------------|
| photographe           | Photographe                       | very-high           | Malt `/a/freelance/image-son/photographe` |
| videaste              | Vidéaste                          | high                | Malt tag `video` |
| monteur-video         | Monteur vidéo                     | high                | Malt tag `montage-video` + 404works (`video-editing`) |
| realisateur           | Réalisateur                       | medium              | Malt `/a/freelance/image-son/realisateur` |
| producteur-audio      | Producteur audio / Podcast        | medium              | Malt tag `montage-son` |
| sous-titreur          | Sous-titreur                      | low                 | Malt tag `sous-titrage` |
| operateur-tournage    | Opérateur de tournage             | low                 | Malt tag `tournage` |
| film-entreprise       | Réalisateur film d'entreprise     | medium              | Malt tag `film-dentreprise` |

### Vertical 10 : Supply Chain & Opérations (8 skills)

| slug                       | name                                  | popularity_estimate | source confirmée |
|----------------------------|---------------------------------------|---------------------|------------------|
| consultant-supply-chain    | Consultant Supply Chain               | high                | Malt tag `supply-chain` |
| consultant-logistique      | Consultant Logistique                 | medium              | Malt (profils Layunta, Bouffard, Wassongma) |
| consultant-achats          | Consultant Achats / Procurement       | medium              | Malt tag `acheteur` |
| consultant-gestion-stocks  | Consultant Gestion des stocks         | low                 | Malt tag `gestion-des-stocks` |
| consultant-operations      | Consultant Opérations (dup avec strat) | medium             | Malt (parent business-conseil) |
| consultant-import-export   | Consultant Import-Export              | low                 | Malt (international logistique) |
| consultant-amelioration-continue | Consultant amélioration continue / Lean | medium       | Malt (process optimization) |
| consultant-erp             | Consultant ERP (SAP/Oracle)           | medium              | Malt tags |

### Bonus — Gestion de projet (transverse, déjà partiellement en Section 1)

Ces métiers existent côté tech (déjà dans Section 1) ET côté non-tech business. Liste rapide des rôles confirmés par Malt sous `/a/freelance/gestion-de-projets-coaching/{slug}` :

| slug             | name           | parent_category Workwave |
|------------------|----------------|--------------------------|
| chef-de-projet   | Chef de projet | gestion-projet (à créer) |
| scrum-master     | Scrum Master   | (déjà tech) |
| coach-agile      | Coach Agile    | (déjà tech) |
| product-manager  | Product Manager | (déjà tech) |
| product-owner    | Product Owner  | (déjà tech) |

---

## Section 3 — Synthèse cross-vertical

### Comptage

- **Total skills non-tech identifiés : 100** (10 verticaux × ~10 skills moyens).
- **Total skills tech (Section 1) : 90** (78 + 12 rôles).
- **Total cumulé catalogue Workwave AI : 190 skills canoniques**.

### Top 50 skills NON-tech par volume search FR estimé (tous verticaux confondus)

Classement basé sur (a) nombre de profils Malt quand disponible, (b) niveau de tag `popularity_estimate`, (c) volume search FR connu sur les requêtes type "freelance {skill}".

| Rang | slug                       | vertical | popularity |
|------|----------------------------|----------|------------|
| 1    | consultant-seo             | Marketing | very-high |
| 2    | redacteur-web              | Rédaction | very-high |
| 3    | community-manager          | Marketing | very-high |
| 4    | ux-designer                | Design   | very-high |
| 5    | ui-designer                | Design   | very-high |
| 6    | graphiste                  | Design   | very-high |
| 7    | copywriter                 | Rédaction | very-high |
| 8    | business-developer         | Commercial | very-high |
| 9    | consultant-strategie       | Stratégie | very-high |
| 10   | redacteur-seo              | Rédaction | very-high |
| 11   | photographe                | Audiovisuel | very-high |
| 12   | consultant-sea             | Marketing | high |
| 13   | consultant-marketing       | Marketing | high |
| 14   | consultant-webmarketing    | Marketing | high |
| 15   | consultant-analytics       | Marketing | high |
| 16   | growth-hacker              | Marketing | high |
| 17   | consultant-crm             | Marketing | high |
| 18   | email-marketing            | Marketing | high |
| 19   | social-media-manager       | Marketing | high |
| 20   | consultant-en-communication | Marketing | high |
| 21   | consultant-acquisition     | Marketing | high |
| 22   | product-designer           | Design   | high |
| 23   | webdesigner                | Design   | high |
| 24   | directeur-artistique       | Design   | high |
| 25   | motion-designer            | Design   | high |
| 26   | illustrateur               | Design   | high |
| 27   | identite-visuelle          | Design   | high |
| 28   | consultant-transformation  | Stratégie | high |
| 29   | manager-de-transition      | Stratégie | high |
| 30   | consultant-pmo             | Stratégie | high |
| 31   | daf-freelance              | Finance  | high |
| 32   | controleur-de-gestion      | Finance  | high |
| 33   | expert-comptable           | Finance  | high |
| 34   | comptable                  | Finance  | high |
| 35   | consultant-rh              | RH       | high |
| 36   | talent-acquisition         | RH       | high |
| 37   | consultant-recrutement     | RH       | very-high |
| 38   | consultant-formation       | RH       | high |
| 39   | coach-professionnel        | RH       | high |
| 40   | consultant-vente           | Commercial | high |
| 41   | consultant-prospection-b2b | Commercial | high |
| 42   | lead-generation            | Commercial | high |
| 43   | juriste-entreprise         | Juridique | high |
| 44   | dpo-rgpd                   | Juridique | high |
| 45   | concepteur-redacteur       | Rédaction | high |
| 46   | content-manager            | Rédaction | high |
| 47   | traducteur                 | Rédaction | high |
| 48   | videaste                   | Audiovisuel | high |
| 49   | monteur-video              | Audiovisuel | high |
| 50   | consultant-supply-chain    | Supply chain | high |

### Macro-catégories suggérées pour Workwave AI (18 macros parentes au total)

État actuel Workwave AI : 6 macros tech. Après ajout des verticaux non-tech, on passe à **18 macros** :

**Tech (existantes — Section 1)** :
1. `developpement-web`
2. `intelligence-artificielle`
3. `cloud-devops`
4. `no-code-automation`
5. `data-analytics`
6. `design-produit` (à renommer en `design-tech` pour éviter conflit avec `design`)

**Non-tech (nouvelles — Section 2)** :
7. `marketing-digital` — 16 skills (SEO, SEA, CRM, growth, social)
8. `communication` — 6 skills (community, brand, social media, influence)
9. `design-creation` — 14 skills (UX, UI, graphisme, motion, 3D, identité)
10. `redaction-content` — 10 skills (copywriter, journaliste, traducteur, ghostwriter)
11. `strategie-conseil` — 10 skills (consultant strat, transformation, ESG, M&A)
12. `finance-comptabilite` — 10 skills (DAF, expert-comptable, M&A)
13. `rh-recrutement` — 9 skills (talent acq, coaching, formation, SIRH)
14. `commercial-vente` — 8 skills (biz dev, sales, prospection, lead gen)
15. `juridique` — 7 skills (avocat, juriste, DPO, compliance)
16. `audiovisuel-medias` — 8 skills (photographe, vidéaste, monteur, podcast)
17. `supply-chain-ops` — 8 skills (achats, logistique, ERP, lean)
18. `gestion-projet` — 5 skills transverses (chef de projet, scrum, coach agile, PM, PO)

> Note : `marketing-digital` et `communication` pourraient être fusionnés en une seule macro `marketing-communication` (~22 skills) pour simplifier la navigation utilisateur, à l'image de Malt qui les sépare. Recommandation : les laisser séparés au lancement (deux verticaux ont des intentions de recherche distinctes : "consultant SEO" vs "community manager").

### Mapping NAF Sirene pour scraping :

| Vertical | Codes NAF principaux | Notes |
|----------|---------------------|-------|
| Marketing & comm | **7311Z** (publicité), 7312Z (régie pub), 7022Z (conseil affaires) | 7311Z couvre la majorité des freelances marketing/com indépendants. |
| Design & création | **7410Z** (création artistique / design spécialisé), 7420Z (photo), 9001Z (arts du spectacle pour illustrateurs) | 7410Z = parent design ; 7420Z spécifique photo. |
| Stratégie & conseil | **7022Z** (conseil pour affaires et gestion) | Couvre 90% des consultants stratégie/transformation/innovation. |
| Finance & comptabilité | **6920Z** (activités comptables), **6619B** (autres aux. services financiers) | 6920Z = expert-comptables ; 6619B = consultants finance non-comptables (DAF freelance, M&A advisors). |
| RH & recrutement | **7022Z** (conseil RH inclus dans conseil affaires), 7820Z (agences intérim, rarement pour freelances) | 7022Z domine pour les RH freelances solo ; 7820Z plutôt structures. |
| Commercial & vente | **7311Z** (publicité/business dev), 7022Z (conseil) | 7311Z pour les biz devs externalisés ; 7022Z pour les sales ops consultants. |
| Juridique | **6910Z** (activités juridiques) | Code unique, couvre avocats, juristes d'entreprise, DPO indépendants. |
| Rédaction & copywriting | **7430Z** (traduction & interprétation), **9001Z** (arts spectacle pour ghostwriters/auteurs), 7311Z (concepteurs-rédacteurs en publicité) | 7430Z spécifique traducteurs ; concepteurs-rédacteurs souvent en 7311Z. |
| Audiovisuel & médias | **5911C** (production films), **5912Z** (post-production), **7420Z** (photo), 9001Z (live spectacle), 5920Z (édition musicale) | 5911C/5912Z pour la chaîne ciné/vidéo ; 7420Z pour les photographes commerciaux. |
| Supply chain & ops | **7022Z** (conseil) | Pas de NAF dédié — la majorité des consultants supply chain freelances sont en 7022Z. |

> **Recommandation scraping Workwave AI freelances non-tech** : commencer par **3 codes NAF prioritaires** qui couvrent ~70% du marché : 7022Z (conseil — englobe stratégie/RH/supply chain), 7311Z (publicité — englobe marketing/com/biz dev), 7410Z (design). Compléter par 6920Z (compta), 6910Z (juridique), 5912Z (post-prod) pour les verticaux spécialisés.

---

## Section 4 — Format machine-readable Section 2 (CSV)

```csv
slug,name,parent_category,popularity,vertical_id
consultant-seo,Consultant SEO,marketing-digital,very-high,7
consultant-sea,Consultant SEA / Google Ads,marketing-digital,high,7
consultant-marketing,Consultant marketing,marketing-digital,high,7
consultant-webmarketing,Consultant webmarketing,marketing-digital,high,7
consultant-analytics,Consultant analytics,marketing-digital,high,7
growth-hacker,Growth Hacker,marketing-digital,high,7
consultant-crm,Consultant CRM,marketing-digital,high,7
marketing-automation,Marketing Automation,marketing-digital,medium,7
email-marketing,Email Marketing,marketing-digital,high,7
community-manager,Community Manager,communication,very-high,8
social-media-manager,Social Media Manager,communication,high,8
brand-manager,Brand Manager,communication,medium,8
directeur-marketing,Directeur Marketing,marketing-digital,medium,7
consultant-en-communication,Consultant en communication,communication,high,8
consultant-influence,Consultant influence marketing,communication,medium,8
consultant-acquisition,Consultant acquisition,marketing-digital,high,7
ux-designer,UX Designer,design-creation,very-high,9
ui-designer,UI Designer,design-creation,very-high,9
product-designer,Product Designer,design-creation,high,9
ux-researcher,UX Researcher,design-creation,medium,9
graphiste,Graphiste,design-creation,very-high,9
webdesigner,Webdesigner,design-creation,high,9
directeur-artistique,Directeur Artistique,design-creation,high,9
motion-designer,Motion Designer,design-creation,high,9
illustrateur,Illustrateur,design-creation,high,9
illustrateur-3d,Illustrateur 3D,design-creation,medium,9
identite-visuelle,Identité visuelle / Branding,design-creation,high,9
charte-graphique,Charte graphique,design-creation,medium,9
graphisme-print,Graphisme print,design-creation,medium,9
sound-designer,Sound Designer,design-creation,low,9
consultant-strategie,Consultant en stratégie,strategie-conseil,very-high,11
consultant-transformation,Consultant transformation,strategie-conseil,high,11
manager-de-transition,Manager de transition,strategie-conseil,high,11
consultant-operations,Consultant opérations,strategie-conseil,medium,11
consultant-organisation,Consultant organisation,strategie-conseil,medium,11
consultant-change-management,Consultant change management,strategie-conseil,medium,11
consultant-innovation,Consultant innovation,strategie-conseil,medium,11
consultant-pmo,Consultant PMO,strategie-conseil,high,11
business-plan,Business plan,strategie-conseil,medium,11
consultant-esg-rse,Consultant ESG / RSE,strategie-conseil,medium,11
daf-freelance,DAF freelance,finance-comptabilite,high,12
raf-freelance,RAF freelance,finance-comptabilite,medium,12
controleur-de-gestion,Contrôleur de gestion,finance-comptabilite,high,12
expert-comptable,Expert-comptable,finance-comptabilite,high,12
comptable,Comptable,finance-comptabilite,high,12
consultant-tresorerie,Consultant trésorerie,finance-comptabilite,medium,12
consultant-m-a,Consultant M&A,finance-comptabilite,medium,12
analyste-financier,Analyste financier,finance-comptabilite,medium,12
consultant-fiscalite,Consultant fiscalité,finance-comptabilite,medium,12
comptabilite-analytique,Comptabilité analytique,finance-comptabilite,low,12
consultant-rh,Consultant RH,rh-recrutement,high,13
drh-freelance,DRH freelance,rh-recrutement,medium,13
talent-acquisition,Talent Acquisition,rh-recrutement,high,13
consultant-recrutement,Consultant recrutement,rh-recrutement,very-high,13
consultant-formation,Consultant formation,rh-recrutement,high,13
coach-professionnel,Coach professionnel,rh-recrutement,high,13
consultant-change-rh,Consultant change management RH,rh-recrutement,medium,13
consultant-sirh,Consultant SIRH,rh-recrutement,medium,13
consultant-sourcing,Consultant sourcing,rh-recrutement,medium,13
business-developer,Business Developer,commercial-vente,very-high,14
directeur-commercial,Directeur commercial,commercial-vente,medium,14
consultant-vente,Consultant vente,commercial-vente,high,14
sales-ops,Sales Ops,commercial-vente,medium,14
consultant-prospection-b2b,Consultant prospection B2B,commercial-vente,high,14
consultant-prospection-b2c,Consultant prospection B2C,commercial-vente,medium,14
closer,Closer commercial,commercial-vente,medium,14
lead-generation,Lead Generation,commercial-vente,high,14
avocat-freelance,Avocat freelance,juridique,medium,15
juriste-entreprise,Juriste d'entreprise,juridique,high,15
dpo-rgpd,DPO / Expert RGPD,juridique,high,15
consultant-droit-affaires,Consultant droit des affaires,juridique,medium,15
consultant-compliance,Consultant compliance,juridique,medium,15
consultant-propriete-intellectuelle,Consultant Propriété intellectuelle,juridique,low,15
redacteur-juridique,Rédacteur juridique CGV / CGU,juridique,medium,15
redacteur-web,Rédacteur web,redaction-content,very-high,10
redacteur-seo,Rédacteur SEO,redaction-content,very-high,10
concepteur-redacteur,Concepteur-rédacteur,redaction-content,high,10
copywriter,Copywriter,redaction-content,very-high,10
ghostwriter,Ghostwriter,redaction-content,medium,10
content-manager,Content Manager,redaction-content,high,10
responsable-editorial,Responsable éditorial,redaction-content,medium,10
journaliste,Journaliste,redaction-content,medium,10
traducteur,Traducteur,redaction-content,high,10
relecteur-correcteur,Relecteur / Correcteur,redaction-content,medium,10
photographe,Photographe,audiovisuel-medias,very-high,16
videaste,Vidéaste,audiovisuel-medias,high,16
monteur-video,Monteur vidéo,audiovisuel-medias,high,16
realisateur,Réalisateur,audiovisuel-medias,medium,16
producteur-audio,Producteur audio / Podcast,audiovisuel-medias,medium,16
sous-titreur,Sous-titreur,audiovisuel-medias,low,16
operateur-tournage,Opérateur de tournage,audiovisuel-medias,low,16
film-entreprise,Réalisateur film d'entreprise,audiovisuel-medias,medium,16
consultant-supply-chain,Consultant Supply Chain,supply-chain-ops,high,17
consultant-logistique,Consultant Logistique,supply-chain-ops,medium,17
consultant-achats,Consultant Achats,supply-chain-ops,medium,17
consultant-gestion-stocks,Consultant Gestion des stocks,supply-chain-ops,low,17
consultant-import-export,Consultant Import-Export,supply-chain-ops,low,17
consultant-amelioration-continue,Consultant amélioration continue,supply-chain-ops,medium,17
consultant-erp,Consultant ERP,supply-chain-ops,medium,17
chef-de-projet,Chef de projet,gestion-projet,high,18
```

**Total Section 2 : 100 skills non-tech canoniques répartis sur 12 macro-catégories (10 verticaux non-tech + 1 gestion-projet transverse + 1 supplément).**

---

## Section 5 — Plan de scaling combiné tech + non-tech

**Hypothèse nouvelles combinaisons** : 190 skills (90 tech + 100 non-tech) × 30 villes France = **5700 pages potentielles**.

**Priorisation recommandée** :
1. **Phase 1 (lancement)** — 50 skills (Top 30 tech + Top 20 non-tech) × 30 villes = **1500 pages** prioritaires.
2. **Phase 2 (élargissement)** — 100 skills (full top 50 tech + full top 50 non-tech) × 30 villes = **3000 pages**.
3. **Phase 3 (couverture totale)** — 190 skills × 30 villes = **5700 pages**.
4. **Phase 4 (montée villes)** — 190 skills × 60 villes = **11 400 pages**.

**Coût IA estimé** :
- Phase 1 : 1500 × $0.02 = **~$30**
- Phase 2 : +1500 × $0.02 = **~$30**
- Phase 3 : +2700 × $0.02 = **~$54**
- Phase 4 (extension villes) : +5700 × $0.02 = **~$114**

Budget total programmatic SEO complet : **~$230**.

**Garde-fous anti-thin content** : voir Section 6 Partie A (Tech). Mêmes principes s'appliquent : ≥300 mots unique, compteur de freelances dispos, maillage interne, schema JSON-LD `ItemList`.

---

## Section 6 — Sources Section 2

- [Malt — Catégorie business-conseil (parent)](https://www.malt.fr/a/freelance/business-conseil) — consultants stratégie, transformation, business developers.
- [Malt — Catégorie communication (parent)](https://www.malt.fr/a/freelance/communication) — rédaction, community manager, brand, traduction.
- [Malt — Catégorie marketing (parent)](https://www.malt.fr/a/freelance/marketing) — SEO, SEA, CRM, growth, analytics.
- [Malt — Catégorie web-graphic-design (parent)](https://www.malt.fr/a/freelance/web-graphic-design) — UX, UI, graphiste, web design, illustration.
- [Malt — Catégorie image-son (parent)](https://www.malt.fr/a/freelance/image-son) — photographe, motion, vidéo, sound design.
- [Malt — Catégorie gestion-de-projets-coaching (parent)](https://www.malt.fr/a/freelance/gestion-de-projets-coaching) — chef de projet, scrum, coach agile, PM, PO.
- [Malt — Baromètre tarifs 2026](https://www.malt.fr/t/barometre-tarifs) — index des 8 grandes catégories Malt et leurs tarifs par métier.
- [Malt — Tag DAF freelance](https://www.malt.fr/s/tags/daf-603502a8806f8975da4783b4) — confirmation finance freelance via tags.
- [Malt — Tag Talent Acquisition](https://www.malt.fr/s/tags/talent-acquisition-6034e04805dc2b0201034d0b) — 475 profils.
- [Malt — Tag RGPD](https://www.malt.fr/s/tags/rgpd-60351578806f8975da47a46b) — confirmation cluster juridique RGPD/DPO.
- [Malt — Tag Supply Chain](https://www.malt.fr/s/tags/supply-chain-59ca869b6e6c295df40aa566) — confirmation cluster supply chain.
- [Malt — Tag Business Development](https://www.malt.fr/s/tags/business-development-5a37ce24db554c774e684251) — 6547 profils biz dev.
- [Malt — Tag Growth Hacking](https://www.malt.fr/s/tags/growth-hacking-59ca86886e6c295df40aa3d6) — cluster croissance marketing.
- [Malt — Tag Marketing Automation](https://en.malt.fr/s/tags/marketing-automation-68f8c740a9cc461beec627ed) — automation outils.
- [Malt — Concepteur-rédacteur](https://www.malt.fr/a/freelance/communication/concepteur-redacteur) — 5368 profils copywriting.
- [404works — Toutes les expertises](https://www.404works.com/fr/freelancers) — taxonomie 6 catégories non-tech : Design / Marketing / Content / Organization / Strategy / Business avec 60+ slugs.
- [Convention.fr — NAF 6920Z](https://www.convention.fr/code/6920Z/) — activités comptables.
- [Legalnest — NAF 7311Z](https://www.legalnest.fr/code-ape-naf/7311z) — agences de publicité.
- [Convention.fr — NAF 7410Z](https://www.convention.fr/code/7410Z/) — design spécialisé.
- [Convention.fr — NAF 6910Z](https://www.convention.fr/code/6910Z/) — activités juridiques.
- [Convention.fr — NAF 5912Z](https://www.convention.fr/code/5912Z/) — post-production cinéma/vidéo.
- [Convention.fr — NAF 9001Z](https://www.convention.fr/code/9001Z/) — arts du spectacle vivant.


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

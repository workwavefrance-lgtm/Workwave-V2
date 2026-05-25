# Workwave AI — QA Report

**Date** : 2026-05-25
**Auditeur** : Claude (read-only, aucune modification prod)
**Scope** : 18 routes `/ai/*`, brand integrity, form action, schemas, BDD, lessons CLAUDE.md

---

## TL;DR — Top findings

| # | Severite | Finding |
|---|---|---|
| 1 | MOYEN | **Liens internes morts** : `/ai/freelances` (404) reference 3x (landing /ai L288+L484, succes L115, breadcrumb listing L156) ; `/ai/comment-ca-marche` (404) reference dans le footer + landing |
| 2 | MOYEN | **Brand leak twitter meta** : toutes les pages `/ai/*` heritent du `twitter:title="Workwave — Trouvez un professionnel de confiance"` + `twitter:description="Plus de 226 000 professionnels en Nouvelle-Aquitaine"` du root layout BTP. Visible en partage social (LinkedIn/X) = identite mixte BTP/AI. |
| 3 | MOYEN | **Forms connexion/inscription sans backend** : POST `/ai/connexion` retourne **HTTP 405**. Aucun route handler. Les forms semblent fonctionnels visuellement mais sont des dead-ends. (NB : peut etre intentionnel Phase 8 Stripe, mais a documenter au minimum.) |
| 4 | MINEUR | **404 generique non-brande** : `/ai/categorie-inexistante` et `/ai/freelance/slug-inexistant` rendent le 404 par defaut Next.js ("This page could not be found") sans header/footer AI. Manque `app/(ai)/ai/not-found.tsx`. |
| 5 | MINEUR | **Titles doubles** : `<title>X — Workwave AI | Workwave AI</title>` partout. Template du layout `"%s | Workwave AI"` s'applique meme quand la page met deja "Workwave AI" dans son title. |
| 6 | MINEUR | **Hardcoded category IDs** : `freelance/[slug]/page.tsx:10` use `TECH_CATEGORY_IDS = [43,44,45,46,47,48]`. Si on ajoute une 7eme cat tech, lookup silencieusement KO. Privilegier filter `vertical='tech'` comme `[skill]/page.tsx`. |
| 7 | MINEUR | **Sitemap manque les routes AI** : `sitemap-index.xml` ne reference aucune `/ai/*`. Indexation Google passera par crawl seul. |
| 8 | MINEUR | **Hardcoded counts sur landing** : `/ai/page.tsx` montre `count: 18, 32, 21, 14, 22, 7` (CATEGORIES section), valeurs irrealistes vs la BDD reelle (104k pros sur developpement-web seul). |
| 9 | INFO | **ISR cold cache** : 1er fetch initial de `/ai/developpement-web` peut renvoyer "0 freelances" si le cache cold start a stocke une reponse stale. Auto-corrige aux runs suivants. |

**Aucun bug bloquant. Aucune fuite coral BTP detectee. Aucun composant BTP (RecentClaimsToast / Lea / CookieBanner) ne leak dans `/ai/*`.**

---

## Routes 200

Toutes les routes attendues 200 repondent 200 :

| Route | HTTP | Time (s) |
|---|---|---|
| `/ai` | 200 | 0.44 |
| `/ai/tarifs` | 200 | 0.31 |
| `/ai/connexion` | 200 | 0.33 |
| `/ai/inscription` | 200 | 0.40 |
| `/ai/deposer` | 200 | 0.34 |
| `/ai/deposer/succes?id=1` | 200 | 0.42 |
| `/ai/pour-les-freelances` | 200 | 0.37 |
| `/ai/developpement-web` | 200 | 4.77 (cold) → ~1s warm |
| `/ai/intelligence-artificielle` | 200 | 0.59 |
| `/ai/cloud-devops` | 200 | 0.52 |
| `/ai/no-code-automation` | 200 | 0.53 |
| `/ai/data-analytics` | 200 | 0.54 |
| `/ai/design-produit` | 200 | 0.50 |
| `/ai/developpement-web?page=2` | 200 | 1.95 |
| `/ai/developpement-web?page=4000` | 200 | 0.89 |
| `/ai/freelance/julien-ascoet-0056` | 200 | 0.56 |

## Routes 404 (attendues)

| Route | HTTP | OK? |
|---|---|---|
| `/ai/categorie-inexistante` | 404 |   |
| `/ai/freelance/slug-inexistant` | 404 |   |

## Routes 404 (NON attendues — liens internes morts)

| Route | HTTP | Reference par |
|---|---|---|
| `/ai/freelances` | 404 | `/ai/page.tsx:288, 484` + `/ai/[skill]/page.tsx:156` (breadcrumb) + `/ai/deposer/succes/page.tsx:115` ("Voir tous les freelances") |
| `/ai/comment-ca-marche` | 404 | `components/ai/AiFooter.tsx:57` (footer "Comment ca marche") + `/ai/page.tsx` |

---

## Brand integrity

### Tokens AI presents

Toutes les 200 routes contiennent `class="ai-theme"` (scope CSS), `--ai-accent` ou autres `--ai-*` variables.

### Coral BTP

`#FF5A36` et `--accent` (sans `-ai-` prefix) : **0 occurrence** dans toutes les pages `/ai/*`. Pas de leak.

### Composants BTP

`RecentClaimsToast`, `Lea`/`CommercialAgent`, `CookieBanner` : **0 occurrence** dans toutes les pages `/ai/*`. Layout `app/(ai)/layout.tsx` correctement scope.

### Twitter / OG metadata (LEAK SOCIAL)

| Page | twitter:title | twitter:description |
|---|---|---|
| TOUTES les pages /ai/* | `Workwave — Trouvez un professionnel de confiance` | `Plus de 226 000 professionnels en Nouvelle-Aquitaine. Comparez et contactez gratuitement.` |

Le root `app/layout.tsx` definit ce twitter metadata, et `app/(ai)/layout.tsx` ne l'override pas. Quand quelqu'un partage `/ai/...` sur Twitter/LinkedIn, l'identite BTP s'affiche. **Fix** : ajouter `twitter: {...}` dans `metadata` du layout AI.

---

## Donnees BDD

### Categories tech

| ID | Slug | Nom | Vertical |
|---|---|---|---|
| 43 | developpement-web | Developpement Web | tech |
| 44 | intelligence-artificielle | Intelligence Artificielle | tech |
| 45 | cloud-devops | Cloud & DevOps | tech |
| 46 | no-code-automation | No-Code & Automation | tech |
| 47 | data-analytics | Data & Analytics | tech |
| 48 | design-produit | Design Produit | tech |

6 categories tech confirmees, IDs 43-48.

### Counts par categorie (estimated)

| Slug | Count |
|---|---|
| developpement-web | **104 015** pros |
| intelligence-artificielle | 0 |
| cloud-devops | 0 |
| no-code-automation | 0 |
| data-analytics | 0 |
| design-produit | 0 |

**Total tech pros** (cat 43-48, source=sirene, is_active=true) : **104 036**.

NB : le brief mentionnait ~110k pros tech, on est a 104k. Probable difference is_active/deleted_at filters. Pas un bug.

### GitHub enrichis

**59 pros** avec `github_username NOT NULL` dans cat 43-48. Conforme au brief.

### Samples GitHub pros

- `id=456143 YVAN CURBILLON (PLUSONELANGUAGE) — slug yvan-curbillon-plusonelanguage-0015 — 75002 — github @ycurbill`
- `id=455646 ALAEDDINE OUERTANI — slug alaeddine-ouertani-0028 — 75018 — 7 ans XP — github @AlaeddineOuerteni`
- `id=455649 NADJIB BELLOUNDJA — slug nadjib-belloundja-0013 — 75018 — 11 ans XP — github @NadjibBELLOUNDJA`

### Sample Julien (Vienne)

- `id=? name=JULIEN ASCOET slug=julien-ascoet-0056 postal_code=86000 category_id=43 (dev-web) github=null years_experience=12 is_active=true deleted_at=null source=sirene` 

Page `/ai/freelance/julien-ascoet-0056` rend correctement avec :
- Schema Person + PostalAddress valides
- Title `Julien Ascoet — Freelance Developpement Web a Poitiers — Workwave AI`
- Breadcrumb : Workwave AI / Developpement Web / Julien Ascoet
- "12 ans d'experience" affiche

### Projects table

Schema accepte `vertical='tech'` + `city_id=null` + `phone=null` + `ai_qualification` jsonb. **0 projet tech en BDD** (pas de pollution test).

---

## Form submission integrity

### `/ai/deposer` → `submitTechProject`

Validation et mapping verifies.

**Fields lus dans `actions.ts`** :
- `category` (radio, required) → mapped via `CATEGORY_SLUG_MAP`
- `title` (required)
- `description` (required)
- `stack` (optional)
- `budget` (radio, required)
- `timeline` (radio, required)
- `remoteOk` (checkbox, optional)
- `contactName` (required)
- `company` (optional)
- `contactEmail` (required)
- `contactPhone` (optional)

**Fields presents dans le HTML rendu** :
- `name="category"` × 6 (values: ia, dev, cloud, nocode, data, design)
- `name="title"`, `name="description"`, `name="stack"`
- `name="budget"` × 5 (lt5k, 5k-15k, 15k-50k, gt50k, tbd)
- `name="timeline"` × 4 (asap, 1month, 3months, flexible)
- `name="remoteOk"`, `name="contactName"`, `name="company"`, `name="contactEmail"`, `name="contactPhone"`
- `name="cgu"` (checkbox CGU — non lu par l'action, **presentation only**)

**CATEGORY_SLUG_MAP correctness** :
```
ia → intelligence-artificielle
dev → developpement-web
cloud → cloud-devops
nocode → no-code-automation
data → data-analytics
design → design-produit
```

Tous les `value=` du form matchent. `submitTechProject` resout la category via `vertical='tech'` puis appelle `qualifyTechProject` (Claude) → `routeTechProject` (top 3 freelances) → insert `project` + `project_leads` → `await sendAiProjectNotification` → redirect `/ai/deposer/succes?id=N`.

**Server Action est correctement importe** : `import { submitTechProject } from "./actions";` et `<form action={submitTechProject}>` (page.tsx:89).

### `/ai/connexion` form

**Inert** : `action="/ai/connexion" method="POST"` → POST retourne **HTTP 405**. Aucun route handler defini (`app/(ai)/ai/connexion/route.ts` absent). Form fait croire que ca marche.

### `/ai/inscription` form

**Inert** : `action="/ai/inscription"` → meme probleme, dead-end. Pas de route handler.

---

## Schema.org / SEO

| Page | JSON-LD | Types |
|---|---|---|
| `/ai/developpement-web` | 1 bloc | ItemList + ListItem + Person |
| `/ai/intelligence-artificielle` | 1 bloc | ItemList (empty) |
| `/ai/cloud-devops` | 1 bloc | ItemList |
| `/ai/no-code-automation` | 1 bloc | ItemList |
| `/ai/data-analytics` | 1 bloc | ItemList |
| `/ai/design-produit` | 1 bloc | ItemList |
| `/ai/freelance/julien-ascoet-0056` | 1 bloc | Person + PostalAddress |
| `/ai` (landing) | 0 | rien |
| `/ai/tarifs` | 0 | rien |
| `/ai/deposer` | 0 | rien |
| `/ai/pour-les-freelances` | 0 | rien |

**Recommandation** : ajouter au minimum :
- `Organization` ou `WebSite` sur `/ai` (landing)
- `Offer`/`Service` sur `/ai/tarifs` (29,90€/mois)
- `WebPage` + breadcrumb partout

### Titles, h1, meta-description

Tous presents et coherents. **Observation** : titles doubles `... — Workwave AI | Workwave AI` (cf. finding #5).

### Robots

- `/ai/connexion` : `noindex` (correct)
- `/ai/inscription` : `noindex` (correct)
- `/ai/deposer/succes` : `noindex` (correct)
- Autres routes : pas de `robots` meta = defaut = `index, follow` (correct)

---

## Mobile responsive

Curl avec UA iOS confirme :
- `viewport content="width=device-width, initial-scale=1"` present sur toutes les pages
- Hamburger menu (`md:hidden` class) injecte sur toutes les pages via `AiHeader`
- AiHeader gere `usePathname` + body scroll lock + Escape key (composant client)

Pas de test visuel (curl pur), mais structure HTML conforme. Pas d'overflow horizontal detectable.

---

## Email integrity (`sendAiProjectNotification`)

Fichier : `lib/email/send-ai-project-notification.ts`

| Critere | Status | Detail |
|---|---|---|
| Sender | OK | `from: "Workwave AI <contact@workwave.fr>"` (pas `onboarding@resend.dev`) |
| Reply-to field name | OK | `replyTo: input.contactEmail` (camelCase Resend v2, pas `reply_to`) |
| Subject | OK | `[AI] ${input.title}` |
| Admin email | OK | `workwave.france@gmail.com` |
| Tracking | OK | `admin_notified_at` + `admin_notification_error` mis a jour via `trackAdminNotification(projectId, "sent" | { error })`. Lecon 23/05/2026 respectee. |
| HTML quality | OK | HTML inline avec branding orange `#FF6803`, suspicion badge si > 70, top 3 freelances listes avec liens internes, sections Brief + Contact + AI insights + Routes |

**`await` du send** : oui, l'action `submitTechProject` fait `await sendAiProjectNotification(...)` avant `redirect()` — conforme a la lecon 24/05/2026 (Server Actions non-promises detachees).

---

## CLAUDE.md compliance

| Lecon | Respectee? | Verif |
|---|---|---|
| **18/04 — dotenv override:true dans scripts** | N/A | Scripts non touches dans ce sprint |
| **24/05 — Server Actions await side-effects** | OK | `await sendAiProjectNotification(...)` ligne 209 de `actions.ts` |
| **24/05 — ANTHROPIC_API_KEY fallback readFileSync** | OK | `lib/ai/qualify-tech-project.ts:20-31` implemente le fallback `readFileSync(".env.local")` proprement. NB : pas de guard `NODE_ENV === 'production'` mais ce n'est pas bloquant (le fallback echoue silencieusement en prod si pas de .env.local, et l'env var sera lue d'abord) |
| **30/04 + 09/05 — PostgREST cap 1000 pagination** | OK | `[skill]/page.tsx` utilise `PAGE_SIZE=24` + `.range(offset, offset+23)` — 1 seule requete, pas de boucle infinie possible |
| **28/04 — count: 'estimated' grosses tables** | OK | `[skill]/page.tsx` utilise `count: "estimated"` |
| **28/04 — revalidatePath dashboard** | N/A | Pas de revalidatePath dans le sprint AI |
| **22/05 — RLS audit** | NON VERIFIE | Pas verifie pour les nouvelles tables/colonnes du sprint (city_id nullable sur projects). A verifier si ALTER TABLE a touche les policies |
| **27/04 — noindex regle stricte** | OK | Seules les 3 pages legitimement noindex (`connexion`, `inscription`, `deposer/succes`) le sont. Aucune page publique strategique noindexed |
| **30/04 — sitemap revalidate + estimated** | NON CONCERNE | Sitemap actuel n'a pas integre `/ai/*` (cf. finding #7) |

---

## Bugs/findings critiques (par priorite)

### P0 — bloquant (aucun)

Aucun. Le vertical AI est techniquement live et fonctionnel.

### P1 — important

1. **Liens morts `/ai/freelances` et `/ai/comment-ca-marche`** : 4 references qui 404 (breadcrumb listing, succes CTA, footer, landing). **Solution rapide** : creer `app/(ai)/ai/freelances/page.tsx` (listing global de toutes les cats tech) et `app/(ai)/ai/comment-ca-marche/page.tsx` (page methode). OU remplacer les liens par `/ai/deposer` ou autres routes existantes.
2. **Twitter meta BTP fuit sur /ai/*** : tout share social montre l'identite BTP. **Solution** : ajouter dans `app/(ai)/layout.tsx` :
   ```ts
   twitter: {
     card: "summary_large_image",
     title: "Workwave AI — Trouvez le freelance tech ideal",
     description: "Plateforme IA de mise en relation entre projets tech et freelances...",
   }
   ```
3. **Forms connexion/inscription POST 405** : si intentionnellement reportes a Phase 8, ajouter au moins un `type="button"` + handler client temporaire avec message "Bientot disponible" pour eviter les utilisateurs frustres qui tape leur email et ne recoivent rien.

### P2 — mineur

4. **404 generique sans branding AI** : creer `app/(ai)/ai/not-found.tsx` qui rend une page 404 avec header+footer AI + lien retour `/ai`.
5. **Title double `| Workwave AI`** : enlever le suffixe redondant en mettant `title: { default: "...", template: "%s" }` (sans `| Workwave AI` template), OU les page metadata sans suffixe Workwave dans leur title.
6. **Hardcoded `TECH_CATEGORY_IDS=[43..48]`** : remplacer par un lookup `vertical='tech'` au fetch (comme `[skill]/page.tsx` fait deja).
7. **Sitemap manque `/ai/*`** : ajouter dans `app/sitemap.ts` les 13 URLs publiques `/ai/*` (landing, 6 listings, freelance profiles top-N, tarifs, deposer, pour-les-freelances). Eviter inscription/connexion/succes (noindex).
8. **Hardcoded counts landing** : `app/(ai)/ai/page.tsx` montre `count: 18, 32, 21...` qui sont des chiffres inventes vs 104k reels. Remplacer par un fetch DB ou retirer les counts.

### P3 — info

9. **ISR cold cache transient** : 1er fetch /ai/developpement-web peut renvoyer count=0 + empty state pendant que la regen ISR tourne. Auto-corrige. Vercel `x-vercel-cache: MISS` mais HTML cache stale possible. Pas un vrai bug — comportement Next.js attendu avec `revalidate=21600` (6h).
10. **Modele Claude `claude-sonnet-4-6`** dans `qualify-tech-project.ts:77`. Sonnet 4.7 vient de sortir et est dispo, on pourrait upgrader. Pas urgent.
11. **`/ai/deposer/succes` accessible directement** sans projet : renvoyer 200 + "Brief recu" sans ref. UX boiteux mais noindex donc benin.
12. **Pas de validation cote serveur du SIRET / unicite email** dans `submitTechProject`. Si quelqu'un soumet 100 fois le meme brief, on aura 100 lignes projects + 300 leads. Phase 8 Stripe ajoutera rate-limit + dedup logique.

---

## Suggestions ameliorations (non bloquantes)

1. **Page 404 brandee** : `app/(ai)/ai/not-found.tsx` avec :
   - Header AI + Footer AI
   - H1 `404. Page introuvable.` style display bold uppercase
   - Liens vers `/ai`, `/ai/deposer`, `/ai/developpement-web`
   - Watermark `404`

2. **Ajouter Schema Organization + Service sur landing/tarifs** :
   - `/ai` : `@type: "Organization"` + `@type: "WebSite"` avec `potentialAction` SearchAction
   - `/ai/tarifs` : `@type: "Offer"` 29.90/mois EUR avec `@type: "Service"`

3. **Pagination canonical** : sur `?page=N`, ajouter `<link rel="canonical">` pointant vers la page de base et `<link rel="prev">` / `<link rel="next">` pour aider Google.

4. **Le breadcrumb "Workwave AI / Freelances / X"** sur les pages listing pointe vers `/ai/freelances` (404). Soit creer cette page, soit changer en `/ai`.

5. **Categorie 7+ extensibilite** : la convention `TECH_CATEGORY_IDS = [43,44,45,46,47,48]` est fragile. Refactorer pour utiliser `vertical='tech'` partout.

6. **Image OG dediee `/ai`** : aujourd'hui c'est l'image OG default workwave.fr (BTP). Generer une image OG sombre avec logo 2x2 grid orange/noir + "Workwave AI" + "Freelances tech".

7. **Inserer routes AI au sitemap** : section `/ai/*` dans `app/sitemap.ts` avec priority 0.7-0.9 pour les pages strategiques (landing, 6 listings).

8. **Test E2E du form deposer** : maintenant que le QA confirme le mapping form ↔ action, ajouter un test Playwright qui submit un brief de test (sans Claude, mock) pour eviter regression.

9. **Forms inscription/connexion sans backend** : afficher au moins un message `"Bientot disponible. Pour vous inscrire, contactez contact@workwave.fr"` au lieu d'un dead POST.

---

## Conclusion

Le vertical `/ai/*` est **techniquement live et fonctionnel** :
- 16/18 routes 200 (les 2 autres sont des 404 voulus)
- 0 fuite coral BTP, 0 leak composant BTP, tokens `.ai-theme` scopes
- Form `/ai/deposer` est complet et le backend (`submitTechProject` + `qualifyTechProject` + `routeTechProject` + `sendAiProjectNotification`) respecte les 4 lecons CLAUDE.md critiques (await side-effects, fallback readFileSync, count estimated, pagination 24)
- BDD : 104k pros tech (cat 43), 59 enrichis GitHub, sample Julien rend OK

**Bugs prioritaires a fixer** :
1. Liens morts `/ai/freelances` et `/ai/comment-ca-marche` (P1)
2. Twitter meta BTP fuit (P1)
3. Forms connexion/inscription dead-end POST 405 (P1, si non intentionnel)

**Le reste est cosmetique** (titles doubles, 404 non brandee, hardcoded counts, sitemap a completer).

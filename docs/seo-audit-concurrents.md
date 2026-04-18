# Audit SEO concurrentiel — Workwave vs Travaux.com / Habitatpresto / HelloArtisan

**Date** : 18 avril 2026
**Périmètre** : 3 concurrents directs (annuaires + mise en relation BTP en France)
**Objectif** : identifier les forces, faiblesses et leviers pour dominer le SEO local sur la Vienne (86) puis scaler nationalement sans pénalité de duplicate content.

---

## TL;DR — verdict en 5 lignes

1. **Habitatpresto** = mastodonte pSEO (~445 000 URLs annuaire) mais **0 schema.org** et contenu IA pauvre. Faille exploitable.
2. **Travaux.com** = roi de la longue traîne avec **sous-spécialités** (`/chauffage/installateur-pompe-a-chaleur-professionnels/{ville}`) et **notes/reviews** dans les titles. Cloudflare bloque tout scraping.
3. **HelloArtisan** = stratégie minimaliste (1 372 fiches pros, pas de listings métier×ville). Hors-jeu sur le SEO local.
4. **Workwave aujourd'hui** = 588 SEO pages + design premium + JSON-LD complet. Mais 750x moins de pages que Habitatpresto. **Volume = priorité absolue.**
5. **Plan d'attaque** : (a) saturer la Vienne avec sous-spécialités + magazine, (b) scaler en parallèle Nouvelle-Aquitaine via générateur pSEO automatisé, (c) capitaliser sur la dette technique des concurrents (schema.org, Web Vitals, mobile UX).

---

## 1. Volumétrie d'URLs indexées (estimation par sitemap)

| Concurrent | Annuaire (listings) | Fiches pros | Magazine / blog | Guides | **Total estimé** |
|---|---:|---:|---:|---:|---:|
| **Habitatpresto** | **~440 000** (44 sitemaps × 10K) | inclus dans annuaire | 3 643 (mag) + 988 (pro/conseils) | — | **~445 000** |
| **Travaux.com** | inaccessible (Cloudflare) | inclus | inaccessible | inaccessible | **estimé 200K+** |
| **HelloArtisan** | 1 372 (fiches uniquement) | 1 372 | 708 articles | 70 prix + 58 travaux | **~2 208** |
| **Workwave (actuel)** | 588 SEO pages (Vienne uniquement) | 20 330 fiches pros | 0 | 0 | **~20 918** |

**Lecture** : Workwave a 750× moins de pages indexées que Habitatpresto. Mais Habitatpresto a inflé artificiellement avec 10K villes par métier (= énormément de villes vides ou redondantes). La vraie bataille n'est pas le volume brut mais le **contenu unique × intent matching**.

---

## 2. Architecture des URLs — comparatif

### Habitatpresto
```
/met/{metier}/reg/{region}/dep/{departement}-{code}/vil/{ville}
ex: /met/plombier/reg/nouvelle-aquitaine/dep/vienne-86/vil/poitiers
```
- **4 niveaux** de profondeur — anti-pattern (clic depth élevé)
- Mais cohérent avec une logique géographique stricte
- Sitemap dédié par métier (`sitemap-ville-{metier}.xml`)
- Pages dept-métier : `/met/{metier}/reg/{region}/dep/{dep}` (4 516 URLs)
- Pages métier root : `/met/{metier}` (43 URLs)

### Travaux.com
```
/{vertical}/{metier}-professionnels/{ville}
ex: /plomberie/plombier-professionnels/poitiers
ex: /chauffage/installateur-pompe-a-chaleur-professionnels/poitiers
ex: /trouvez-un-artisan/poitiers
```
- **3 niveaux** + verticale-first (plomberie, electricite, chauffage, climatisation, sols-carrelage, bricolage…)
- **Sous-spécialités** systématiques : `installateur-poele-a-bois`, `installateur-pompe-a-chaleur`, `installateur-climatisation`
- Pagination `?page=N` (≥12 pages observées sur Poitiers plombier = 120+ pros)
- Pages globales par ville : `/trouvez-un-artisan/{ville}`

### HelloArtisan
```
/annuaire/pro-{slug}-{id}
ex: /annuaire/pro-steven-folkert-917723
```
- **2 niveaux**, fiches pros uniquement
- **Aucune page listing métier×ville** → invisible sur la requête principale "plombier poitiers"

### Workwave (actuel)
```
/{metier}/{location}
ex: /plombier/poitiers
ex: /plombier/vienne-86
```
- **2 niveaux** — clic depth optimal
- Location = ville-slug OU département-code (pattern flexible)
- Pas de verticale parent
- Pas de sous-spécialités

**Conclusion architecture** : URL Workwave plus propre que les concurrents (pas de profondeur excessive), mais manque le pattern verticale + sous-spécialité de Travaux qui capte la longue traîne intentionnelle.

---

## 3. Contenu SEO par page listing — benchmark sur "plombier Poitiers"

### Habitatpresto
- **Title** : `Trouvez un Plombier à Poitiers | Habitatpresto` (44 chars, optimal)
- **Meta description** : `Vous cherchez un Plombier à Poitiers ? Trouvez un artisan de confiance pour vos travaux avec l'annuaire Habitatpresto.` (générique, pas localisée)
- **H1** : `Poitiers : Trouvez le bon Plombier` (formule renversée)
- **Contenu** : ~480 mots de FAQ (2 questions développées : tarif moyen + comment choisir)
- **Pros affichés** : 22 (3 mis en avant + 19 secondaires)
- **CTA** : module "Quels travaux souhaitez-vous réaliser ?" avec dropdown
- **Schema.org JSON-LD** : **0 bloc** (gros gap technique)
- **Maillage** : 11 villes voisines + 5 métiers liés + articles magazine
- **Images** : badges (RGE, bronze), icônes, avatars
- **Notes/reviews** : aucune
- **Pagination** : "Voir plus" (probable infinite scroll)

### Travaux.com (déduit des SERPs)
- **Title** : `Top 10 plombiers les mieux notés à Poitiers | Devis Rapides | Travaux.com` (très marketing, 70 chars)
- **Title alternatif** : `Top 10 [métier] [ville] | [bénéfice] | Travaux.com`
- **Notes globales** affichées : `4.8/5 sur 129 avis consommateurs` (gros levier de CTR)
- **Pagination** : `?page=N` indexée jusqu'à page 12+ pour Poitiers plombier
- **Sous-spécialités** : page distincte par sous-métier (énorme moat)
- **Couverture villes** : tous les villages de la Vienne indexés (Civray, Vouneuil-sur-Vienne, Vouillé, Les Ormes, Saint-Savin, Cernay, Champniers, Bignoux, Romagne, Vendeuvre-du-Poitou…)

### HelloArtisan (fiche pro)
- **Title** : `STEVEN FOLKERT - Professionnel certifié à ALFORTVILLE avec helloArtisan` (formule basique mais propre)
- **H1** : `STEVEN FOLKERT` (just le nom, pas optimisé)
- **Contenu unique** : ~280-300 mots (présentation + activités + horaires + adresse)
- **CTA** : "Demander un devis" ×2 + module rendez-vous calendrier + "Être rappelé"
- **Schema.org** : non visible (à vérifier en fetch direct)
- **Maillage** : très pauvre (juste retour /annuaire)
- **Photos** : 4 (logo + chantiers)
- **Avis** : "Pas d'avis pour ce pro" (effet négatif sur la confiance)

### Workwave (actuel)
- **Title** : `Plombier à Poitiers — 24 artisans disponibles` (descriptif et chiffré)
- **H1** : titre métier × ville
- **Contenu** : intro courte (Phase 1 ajoutée aujourd'hui) + grille pros + sections SEO H2 (depuis seo_pages, ~600 mots IA)
- **Schema.org JSON-LD** : ✅ ItemList + BreadcrumbList + FAQPage (avantage clé)
- **CTA** : `ProjectCtaBanner` (Phase 1 ajoutée) avec préfill catégorie + ville
- **Maillage** : InternalLinks (villes proches + autres métiers) déjà en place
- **Pagination** : 12 résultats / page (à confirmer + indexation)

---

## 4. Forces et faiblesses Workwave vs concurrents

### Forces actuelles (à protéger)
| Atout | Workwave | Habitatpresto | Travaux.com | HelloArtisan |
|---|:---:|:---:|:---:|:---:|
| JSON-LD schema.org complet | ✅ | ❌ | ? (non vérifiable) | ❌ |
| Mode dark/light premium | ✅ | ❌ | ❌ | ❌ |
| Design 2026 (Linear/Stripe-like) | ✅ | ❌ | ❌ | ⚠️ moyen |
| Architecture URL courte (≤2 niveaux) | ✅ | ❌ | ⚠️ 3 | ✅ |
| Stack moderne (Next 16 / App Router / ISR) | ✅ | ? | ? | ? |
| Contenu IA unique par page | ✅ | ⚠️ générique | ⚠️ générique | N/A |
| Mobile-first | ✅ | ⚠️ | ✅ | ✅ |
| Anti-Cloudflare scraping | ❌ ouvert | ❌ ouvert | ✅ blindé | ❌ ouvert |

### Faiblesses critiques (à combler vite)
| Gap | Workwave | Habitatpresto | Travaux.com | HelloArtisan |
|---|:---:|:---:|:---:|:---:|
| Volume URLs indexées | 588 | 445 000 | 200K+ | 2 208 |
| Couverture France entière | ❌ Vienne only | ✅ | ✅ | ✅ |
| Sous-spécialités métier | ❌ | ❌ | ✅ | ❌ |
| Pages département dédiées | ⚠️ partiel | ✅ 4 516 | ✅ | ❌ |
| Magazine / blog SEO | ❌ 0 | ✅ 4 631 | ✅ | ✅ 836 |
| Notes/reviews dans titles | ❌ | ❌ | ✅ | ❌ |
| Sitemap segmenté par métier | ❌ | ✅ | ? | ❌ |
| FAQ riche par page (300+ mots) | ⚠️ partiel | ✅ 480 mots | ⚠️ | ❌ |
| Magazine-first attire backlinks | ❌ | ✅ | ✅ | ✅ |

---

## 5. Plan d'action — phases recommandées

### Phase A — Quick wins Vienne (2-3 semaines, ROI immédiat)

**A1. Sous-spécialités métier (gain longue traîne énorme)**
Ajouter dans la base `categories` un niveau `subcategories` lié à `category_id`. Liste prioritaire à créer (cibles avec volume Google clair) :
- Plombier → installateur chauffe-eau, dépannage urgence, plombier sanitaire
- Chauffagiste → installateur pompe à chaleur, installateur poêle à bois, installateur poêle à granulés, installateur chaudière gaz, installateur chaudière fioul
- Électricien → installateur borne de recharge, installateur domotique, installateur alarme, installateur photovoltaïque
- Couvreur → ravaleur de façade, démoussage toiture, isolation toiture
- Maçon → ravaleur, terrassier, démolition
- Menuisier → installateur fenêtres, installateur portes, installateur véranda, escaliériste, parqueteur

URL pattern proposé : `/{metier}/{specialite}/{ville}` (ex. `/chauffagiste/installateur-pompe-a-chaleur/poitiers`)
Génération : 6 sous-spécialités × 10 métiers prioritaires × 265 villes Vienne ≈ **15 900 URLs nouvelles**.

**A2. Pages département complètes**
- Vérifier que `/{metier}/vienne-86` existe pour les 35 catégories (35 pages min)
- Ajouter pages "tout artisan dans le département" : `/artisans/vienne-86`
- Ajouter page hub par ville (toutes catégories) : `/artisans/{ville}` (à l'image de `/trouvez-un-artisan/{ville}` chez Travaux)

**A3. Enrichir contenu SEO existant**
- Cible : 600+ mots par page listing (Habitatpresto plafonne à 480, on dépasse)
- Ajouter : tarif moyen métier × département, urgences disponibles, certifications dominantes locales, anecdotes locales (CHU Poitiers pour les plombiers, Futuroscope, vignobles…)
- FAQ 4-6 questions par page (vs 2 chez Habitatpresto)

**A4. Notes/reviews synthétiques**
- Agréger les notes Google Maps déjà scrappées (le batch Apify de fin avril les a remontées)
- Afficher note moyenne + nombre d'avis dans les titles : `Plombier à Poitiers — 24 artisans (4.7/5) | Workwave`
- Ajouter `aggregateRating` dans le schema.org ItemList → étoiles dans Google SERP

**A5. Fil d'Ariane riche + maillage interne**
- Breadcrumb : Accueil > BTP > Plomberie > Vienne > Poitiers > Plombier
- Liens vers villes voisines (10 villes), métiers liés (5), sous-spécialités (3-5)

### Phase B — Magazine / blog SEO (4-6 semaines, gros effort de contenu)

Habitatpresto pèse 4 631 articles, HelloArtisan 836. Workwave : 0. **Non négociable** pour rivaliser sur les requêtes "comment", "prix", "guide".

**B1. Architecture blog**
- URL : `/magazine/{slug}` (calé sur Habitatpresto qui domine cette structure)
- Catégories : Plomberie, Électricité, Chauffage, Toiture, Maçonnerie, Jardin, Aides & financement, Conseils pros…
- ISR avec revalidation hebdo

**B2. 100 articles cibles longue traîne (génération IA en batch)**
Catégories d'articles à prioriser (cibles SEO concrètes avec volume) :
- "Prix d'un plombier à [ville]" × 30 villes principales = 30 articles
- "Comment choisir son [métier]" × 15 métiers = 15 articles
- "Aides MaPrimeRénov [année]" + déclinaisons CEE, éco-PTZ = 10 articles
- "Quand faut-il appeler un [métier]" × 10 métiers = 10 articles
- "Tarifs moyens [travaux]" × 35 catégories = 35 articles

Coût IA estimé : ~$30 (Claude Sonnet 4.5, 1500 mots/article).

**B3. Guides prix par métier × département**
Cloner la structure HelloArtisan `/guide-prix-travaux/...` :
- `/guide-prix/{metier}/{departement}` ex `/guide-prix/plombier/vienne-86`
- 35 métiers × 4 départements (Nouvelle-Aquitaine ciblée) = 140 URLs guides prix
- Chacune avec fourchettes tarifaires régionales + facteurs de prix + checklist devis

### Phase C — Scale national sans duplicate content (le vrai moat)

**C1. Activer scraping Sirene + enrichissement Apify pour 79, 16, 17**
- Reprendre `scripts/scrape-pro-emails.ts` mais étendu à toute la Nouvelle-Aquitaine
- Volume estimé : ~80 000 pros supplémentaires (3 départements × ~25K pros)
- Coût Apify : ~$70 (sur la base des $24.84 pour 2 739 pros enrichis dans la Vienne)

**C2. Générateur pSEO différencié (ANTI duplicate content)**
Stratégie : chaque page doit avoir un fingerprint local unique. **Variables injectées dans le prompt IA** :
- Population de la ville
- Quartiers / hameaux principaux
- Distance vers chef-lieu et préfecture
- Particularités économiques (industrie locale, tourisme, viticulture)
- Climat (impacts sur certains métiers : couvreur, chauffagiste, paysagiste)
- Période historique de construction dominante (impact sur travaux : maisons anciennes vs récentes)
- Nb d'artisans réellement présents en base
- Taux de croissance démographique INSEE
- Revenu médian INSEE (impact sur fourchettes prix)

**Algorithme pSEO** :
```ts
function generateSeoContent(metier, ville, dept) {
  const profile = enrichCityProfile(ville); // INSEE + Wikipédia + base
  const localAngle = pickLocalAngle(metier, profile); // ex. "Buxerolles, banlieue résidentielle de Poitiers en pleine expansion"
  const prompt = buildPrompt({
    metier,
    ville,
    dept,
    profile,
    localAngle,
    nbPros: countProsInZone(metier, ville),
    avgRating: aggregateGoogleRatings(metier, ville),
  });
  return callClaude(prompt);
}
```

**Filets anti-duplicate** :
- Hash MinHash de chaque page générée → si similarité > 70% avec page existante, regénération avec angle différent
- Template phrase 1 / phrase 2 / phrase 3 imposé varié (3 templates en rotation)
- Audit hebdo via script `scripts/audit-duplicate-content.ts`

**C3. Volumétrie cible 12 mois**
- Vienne 86 : 35 métiers × 265 villes × 1.2 spécialités moy = **11 130 URLs**
- + Deux-Sèvres 79 : 35 × 297 × 1.2 = **12 474 URLs**
- + Charente 16 : 35 × 366 × 1.2 = **15 372 URLs**
- + Charente-Maritime 17 : 35 × 463 × 1.2 = **19 446 URLs**
- + Sous-spécialités : 6 × 10 × 1 391 villes = **83 460 URLs**
- + Pages département : 35 × 4 = **140 URLs**
- + Magazine : 100-200 articles
- + Guides prix : 140 URLs
- **Total cible 12 mois : ~142 000 URLs uniques avec contenu localisé**

Cela représente 32% du volume Habitatpresto mais avec un contenu **strictement supérieur en qualité** (IA fine-tunée + données locales + JSON-LD) → meilleur ranking par page.

### Phase D — Optimisations techniques avancées (en parallèle)

**D1. Sitemap segmenté**
Calquer Habitatpresto : un sitemap par métier (`/sitemap/plombier.xml`, `/sitemap/electricien.xml`…) + index global. Permet à Google de crawler par catégorie et de détecter rapidement les nouvelles URLs.

**D2. Schema.org enrichi**
- `LocalBusiness` complet sur chaque fiche pro (avec `aggregateRating`, `priceRange`, `openingHoursSpecification`, `geo`)
- `ItemList` sur listings avec `aggregateRating` global
- `BreadcrumbList` 4 niveaux (Accueil > Catégorie > Dept > Ville)
- `FAQPage` sur listings (cible : étoiles + accordions dans SERP)
- `Article` + `Person` sur le blog
- `Service` sur les guides prix

**D3. Web Vitals au top** (avantage durable sur les concurrents legacy)
- Cible : LCP < 1.5s, INP < 100ms, CLS < 0.05 (vs ~3s LCP médian dans le secteur)
- Image AVIF pour les avatars pros
- Preload fonts critiques
- ISR avec revalidation 24h sur listings

**D4. Internal linking automatique**
- Composant `<RelatedLinks>` qui calcule à la volée :
  - 10 villes voisines (par distance haversine)
  - 5 métiers liés (par graphe de co-occurrence)
  - 3 sous-spécialités du métier courant
- Score d'authorité interne (PageRank simplifié) calculé hebdo en cron

**D5. Backlinks magazine**
- Partager 1 article/semaine sur LinkedIn + Reddit (r/france, r/bricolage)
- Soumettre à Beruby, Hellocoton, Magazine Travaux pour partenariats
- Cible : 50 backlinks DR40+ d'ici 6 mois

---

## 6. Risques et contre-mesures

| Risque | Probabilité | Impact | Contre-mesure |
|---|:---:|:---:|---|
| Pénalité duplicate content (génération IA en masse) | Moyenne | Critique | MinHash + angles locaux + audit hebdo + 3 templates |
| Google Bot rate-limit sur 100K+ URLs | Faible | Modéré | Sitemap segmenté + crawl-delay robots.txt si besoin |
| Cannibalisation entre `/{metier}/vienne-86` et `/{metier}/poitiers` | Élevée | Modéré | Canonical clair + intent différent (dept = comparatif large, ville = local immediate) |
| Mises à jour algo Google (Helpful Content) | Moyenne | Critique | Contenu IA enrichi données réelles (pros + INSEE + Google Reviews) → "people-first" certifié |
| Concurrents qui copient (sous-spécialités) | Moyenne | Faible | Avantage 6-12 mois par speed-of-execution |

---

## 7. KPIs et tracking (à mettre en place avant de commencer)

- **GSC** (Google Search Console) : indexation, impressions, CTR, position moy par page type
- **Plausible** ou **Vercel Analytics** : trafic SEO, pages d'entrée, taux de conversion devis
- **Dashboard interne** : nb URLs en base vs nb URLs indexées vs nb URLs avec impressions
- **Audit hebdo** : top 50 requêtes en gain et en perte vs sem-1
- **Cible mois 3** : 5 000 sessions SEO/mois sur la Vienne
- **Cible mois 6** : 25 000 sessions SEO/mois (Vienne saturée + 1 nouveau dept)
- **Cible mois 12** : 100 000 sessions SEO/mois (Nouvelle-Aquitaine couverte)

---

## 8. Annexes

### 8.1 — Sitemaps téléchargés (analyse réelle)

Tous les fichiers sont dans `/tmp/seo-audit/` :
- `sitemap-habitatpresto.com.xml` (index racine — 6 sous-sitemaps)
- `annuaire.habitatpresto.com_sitemap.xml` (44 sitemaps métiers + 1 metier root + 1 dept-metier)
- `habitatpresto_sitemap-metier.xml` — 43 URLs métiers root
- `habitatpresto_sitemap-departement-metier.xml` — 4 516 URLs dept × métier
- `habitatpresto_sitemap-ville-{plombier,electricien,macon,jardinier,...}.xml` — 10 000 URLs chacun (limite hard)
- `www.habitatpresto.com_mag_sitemap.xml` — 3 643 URLs magazine
- `www.habitatpresto.com_pro_conseils_sitemap.xml` — 988 URLs conseils pros
- `sitemap-helloartisan.com.xml` (index racine — 6 sous-sitemaps)
- `www.helloartisan.com_sitemap_annuaire.xml` — 1 372 fiches pros
- `www.helloartisan.com_sitemap_article.xml` — 708 articles
- `www.helloartisan.com_sitemap_price_guide.xml` — 70 guides prix
- `www.helloartisan.com_sitemap_work_guide.xml` — 58 guides travaux
- `sitemap-travaux.com.xml` — **bloqué Cloudflare** (HTML challenge à la place)

### 8.2 — robots.txt analysés

**Habitatpresto** (très permissif) :
```
User-agent: *
Disallow: /dialogue-prix-*
Disallow: /prix/
Disallow: /partage-email-*
Disallow: /pro/landing-chantier*
Disallow: /lexique/
Disallow: /pro/chantiers/
Sitemap: https://www.habitatpresto.com/sitemap.xml
```
→ Tout le reste est crawlable. Cela explique le volume indexé.

**HelloArtisan** :
```
User-agent: *
Disallow: /rss.xml
Disallow: /devis-travaux/
Disallow: /amp/
Disallow: /preview/
Sitemap: https://www.helloartisan.com/sitemap.xml
```

**Travaux.com** : indisponible (Cloudflare).

### 8.3 — Patterns title à reproduire / éviter

✅ À reproduire (Travaux.com style — gros CTR) :
- `Top 10 [métier] [ville] | [bénéfice court] | Workwave`
- `[Métier] à [ville] — [N] artisans (4.7/5) | Workwave`

❌ À éviter (Habitatpresto style — générique) :
- `Trouvez un [métier] à [ville] | Workwave` (verbe vide, pas de différenciation)

### 8.4 — Sources Google Search ayant servi à l'audit

- [Top 10 plombiers Poitiers](https://www.travaux.com/plomberie/plombier-professionnels/poitiers)
- [Top 10 Chauffagistes Poitiers](https://www.travaux.com/chauffage/chauffagiste-professionnels/poitiers)
- [Installateur pompe à chaleur Poitiers](https://www.travaux.com/chauffage/installateur-pompe-a-chaleur-professionnels/poitiers)
- [Installateur poêle à bois Poitiers](https://www.travaux.com/chauffage/installateur-poele-a-bois-professionnels/poitiers)
- [Page hub artisans Poitiers Travaux.com](https://www.travaux.com/trouvez-un-artisan/poitiers)
- [Page Habitatpresto Plombier Poitiers](https://annuaire.habitatpresto.com/met/plombier/reg/nouvelle-aquitaine/dep/vienne-86/vil/poitiers)
- [Sample fiche pro HelloArtisan](https://www.helloartisan.com/annuaire/pro-steven-folkert-917723)

---

## 9. Prochaine étape recommandée

**Décision requise** :
- (1) Phase A en priorité absolue (sous-spécialités + reviews + département) — ROI sous 60 jours sur la Vienne
- (2) Phase B (magazine) en parallèle — gros effort mais moat de long terme
- (3) Phase C (scale Nouvelle-Aquitaine) à lancer une fois Phase A validée par les KPIs (5K sessions/mois)

Mon recommandation : **A en sprint immédiat, B en background continu, C dès que Vienne dépasse 5 000 sessions SEO/mois**.

— Audit produit le 18 avril 2026 par Claude (Sonnet 4.7)

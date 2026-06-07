# BACKLOG Workwave — post-mesure (figé le 07/06/2026)

---

## 🚀 PROGRAMME EN COURS — Expansion France entière + pages pro (lancé 07/06)

**Objectif** : couvrir TOUTE la France (métropole + DOM) + créer les pages d'acquisition pro (national ET local). **Règle absolue : données réelles uniques sourcées Perplexity, zéro chiffre inventé. Aucune erreur tolérée → contrôle par sous-agents à chaque étape.**

### ✅ FAIT (07/06)
- **Communes chargées** : 59 nouveaux dépts (8 régions métropole restantes + 5 DOM) = **22 400 communes**, base à **34 532 communes**. Vérifié par sous-agent QA : 0 dépt manquant, 0 slug/insee/lat-lng nul, grandes villes + DOM corrects. Script : `scraping/load_cities_regions.py` (étendu).
- **Scraping pros LANCÉ** : `scraping/scrape_all_france.sh` (détaché nohup caffeinate), 59 dépts, petits d'abord → Paris en dernier. **Job multi-JOURS** (SIRENE ~2s/req, ~2M pros attendus). Log : `scraping/scrape_all_france_*.log`.

### ⏳ EN COURS / À FAIRE
- [ ] **Scrape pros** : laisser tourner. Vérifier la santé par sous-agent après les 1ers dépts (pas de régression NAF, counts cohérents). ⚠️ surveiller perf Supabase Micro pendant les gros ingests (Paris/Lyon/Lille). Leçons : cursor pagination sitemap, count estimated.
- [ ] **CORSE (2A/2B)** : EXCLUE du chargement (code dépt alphanumérique casse la regex slug dépt `\d{2,3}`). À faire à part : fixer `parseDepartmentSlug`/`generateDepartmentSlug` pour accepter `2a`/`2b`, PUIS charger + scraper Corse.
- [ ] **Pages pro #1 — Comparatives "sans abonnement"** (national) : `/pro/alternative-habitatpresto`, `/pro/vs-travaux-com`, `/pro/plateforme-sans-abonnement`. Tarifs concurrents RÉELS sourcés Perplexity + cités. LE levier de conversion pro (notre 9,90€/lead vs leurs 39-150€/mois).
- [ ] **Pages pro #2 — Géo "trouver des chantiers [métier] à [ville]"** (national + local) : template métier×ville, contexte marché local sourcé Perplexity par dépt (étendre `sourced-market-context`). Maillage + CTA "réclame ta fiche".
- [ ] **Pages pro #3 — Guides pro** : "trouver des clients [métier]", "fixer ses tarifs [métier]", "devenir auto-entrepreneur [métier]". Sourcés Perplexity.
- [ ] **Génération contenu SEO dépt** pour les nouvelles régions (étendre `generate-seo-na-departments.ts` — ⚠️ FOOTGUN connu : ce générateur Claude INVENTE les prix, cf. leçon 31/05 → ne PAS l'utiliser pour les prix, path programmatique sourcé only).
- [ ] **Ping Indexing API** sur les hubs des nouvelles régions une fois scrapées.

### 🐛 BUG PRÉ-EXISTANT détecté par le QA (07/06) — à corriger séparément
- **114 slugs `cities` dupliqués / 140 communes injoignables par slug nu**, TOUTES dans l'ancienne Nouvelle-Aquitaine (`mazerolles` ×5, `saint-christophe` ×4…). Cause : l'ancien import n'a pas suffixé le code dépt sur les slugs ambigus (le nouveau loader le fait). Impact : `getCityBySlug` sert toujours la commune la + peuplée → les 140 perdantes servent la mauvaise ville (duplicate content latent). Fix : suffixer ces 140 slugs en `-NN` + redirect 308 (pas noindex, règle CLAUDE.md), 0 modif sur un pro `claimed`.

### 🔒 Méthode anti-erreur (6 gardes-fous, à appliquer sur chaque build)
1. Template testé sur 1 page d'abord (vérif chaque élément) avant tout scale.
2. Compartimentage région par région (erreur isolée).
3. CTA = composant source unique.
4. Contenu Perplexity = dry-run + croisement slug↔contenu AVANT apply.
5. Script de vérif auto (champ vide / lien cassé / contenu mismatché / CTA manquant / noindex).
6. Rollout par lots de 10-15 → vérif sous-agent → scale.

---


> Décision cadre : on a poussé plein de changements aujourd'hui. On **laisse
> respirer 5-7 jours**, on **mesure**, PUIS on attaque ce backlog. Ne rien
> lancer avant la mesure pour ne pas polluer les données de conversion.

---

## ✅ Livré aujourd'hui (07/06) — pour mémoire

- **Matching broadcast par distance/rayon** (Haversine) — le `intervention_radius_km` est enfin un vrai levier (avant : filtre "même dept" cosmétique).
- **Broadcast SYNCHRONE** (`await` au lieu de `after()` Next 16) — fin du retard de 4 jours, le pro reçoit le lead immédiatement.
- **Libellés mail Budget/Délai humains** ("Non précisé", "Cette semaine"…).
- **Bloc avis étoilé** sur les cartes Top 10 (★ + note + "X avis Google →" compliant, 281 pros).
- **"Projets [métier] populaires"** — maillage prestation alimenté par les guides de prix.
- **Microsoft Ads** vérifié (compte débloqué), campagne Performance-Max en examen.

---

## 📊 À MESURER d'abord (dans 5-7 jours)

- [ ] **Conversion du SEGMENT listing** (`/[metier]/[ville]`) — pas le global (pollué par les fiches artisan/branded). C'est le seul trafic vraiment convertible.
- [ ] **Microsoft Ads** : CTR / CPC / conversions une fois la campagne sortie d'examen. Si impressions ~0 à J+3 → basculer temporairement en "Maximiser les clics" pour amorcer l'algo.
- [ ] **Indexation workwaveai.co** : passage de 0 → quelques pages dans GSC.
- [ ] **Lag broadcast** : `broadcasted_at - created_at` doit être < 60s en moyenne (sinon régression sur le sync).

---

## 🗂️ Chantiers (après mesure, par priorité)

### 1. Avis — rattraper le moat Travaux
- [ ] **Avis natifs Workwave** (LE moat) : activer/vérifier le cron de sollicitation (déjà codé, se déclenche quand un lead passe "contacté"). 0 avis aujourd'hui → à accumuler. C'est ce qui fait la force de Travaux (207k avis natifs).
- [ ] **Texte d'avis** — décision reportée. Options si on en veut :
  - API Google Places (~5 $, 281 pros, 5 avis max/pro, attribution + refresh 30j obligatoires).
  - Scraping Google = **NON** (viole CGU Google + droit d'auteur ; Travaux ne le fait pas).
- [ ] **Bloc note agrégée** "X/5 sur Y avis" visible en haut des listings (réassurance type Travaux "4.3/5").

### 2. Maillage / contenu
- [ ] **Section Q&A "Demander à un artisan"** (UGC : vraies questions de particuliers + réponses). Gros chantier, longue traîne SEO + réassurance.
- [ ] Étendre "Projets populaires" aux métiers sans guides de prix (générer les guides manquants).

### 3. CTA / conversion (⚠️ APRÈS la mesure, sinon on pollue l'A/B)
- [ ] **Wording "Contacter l'artisan"** au lieu de "Demander un devis" (préférence Willy). Nuance à régler : aujourd'hui ça broadcast à 3 pros, pas un contact direct → cadrer avec la logique claimed/non-claimed.
- [ ] **Logique claimed/non-claimed sur la fiche artisan** :
  - claimed → "Contacter cet artisan" en direct (modèle Travaux, ça convertit).
  - non-claimed → tel visible + 1 CTA discret "Besoin d'autres devis ?". + carotte au claim ("réclame ta fiche → les visiteurs te contactent en 1 clic").
- [ ] **Simplifier les CTA** des fiches artisan (5 CTA + Léa = surcharge ; Travaux = 1 CTA). Réduction, pas ajout.

### 4. Qualité données `price_guides` (audit 07/06)
- [x] **11 mismatches métier sous maçon recatégorisés** (07/06) : 7 cheminée → chauffagiste, 2 porte garage → menuisier, 1 soudure → serrurier, 1 tapissier → decorateur-interieur. maçon 77→66. ✅
- [x] **13 guides au contenu ne matchant PAS le slug — RÉGÉNÉRÉS** (07/06, Perplexity sourcé, ~$0.09) : le contenu parlait d'un autre sujet que l'URL. Détectés via 2 méthodes croisées (sous-agent sémantique sur les 478 + détecteur token-overlap slug↔H1). Corrigés + recatégorisés au bon métier : `prix-retirer-crepi-plafond` (était ponçage parquet→crépi plafond), `prix-goudronnage-bicouche` (gravillonnage→bicouche), `prix-restauration-sol-pierre-polie` (carrelage→pierre polie), `prix-arrosage-automatique` (générique→arrosage), `prix-decoller-papier-peint` (peinture→papier peint), `prix-traitement-humidite` (maçon générique→humidité), `prix-renovation-magasin` (maçonnerie générique→magasin), `prix-remplacement-vitrage` (insert cheminée→vitrage, →vitrier), `prix-demenagement-jusqu-a-1000-km` + `prix-demenagement-m3` (ménage→déménagement, →demenagement), `prix-amenagement-dinterieur` (ménage→aménagement, →decorateur-interieur), `prix-renovation-maison-...-paris` + `...-lyon` (maçonnerie générique→rénovation géo-ciblée). ✅
- [ ] **7 slugs corrompus** (typos URL — ⚠️ changer le slug = 301 obligatoire car déjà indexé, à faire avec soin) :
  - terrassier : `prix-ocation-dengins-terrassement`, `prix-ocation-benne` (→ location), `prix-travaux-fouilles-trancheesxf` (suffixe xf)
  - vitrier : `prix-simple-et-d-double-vitrage` (→ et-double)
  - electricien : `prix-cablage-telephonique` (H1 "service" parasite, mineur)
  → Le contenu de ces 7 est OK, seul le slug (URL) est typé. Faible priorité (l'utilisateur voit le bon H1, juste l'URL est moche).

### 5. Analytics
- [ ] **Configurer l'événement clé GA4** "dépôt projet" (aujourd'hui 0 conversion mesurée dans GA4 — il compte les pages vues mais aucun objectif). Via GTM-W65L4PJD déjà en place. ~15 min.

---

## 🧠 Rappels stratégiques (issus de la session 07/06)

- **Le goulot n°1 = conversion visite→projet** (~0,12 % aujourd'hui sur 4 890 visites organiques/28j → 6 projets). Le trafic est excellent et grimpe (+235 % sur 28j), c'est la TRANSFORMATION qui coince.
- **Le goulot n°2 = couverture pro** (14 pros claimed → 4 projets sur 6 tombent sur 0 pro éligible). Recruter des pros (cold mail propre, partenariats CMA/CCI déjà en base).
- **On n'est PAS en retard sur Travaux** : on est devant sur le contenu (prix sourcés, données INSEE, Top 10 rankée, footer riche). Leurs 3 moats = avis natifs sur cartes + maillage prestation + autorité de domaine (groupe Angi/Instapro). Les 2 premiers sont rattrapables (infra avis prête + guides prix prêts).
- **Data Travaux = aussi mauvaise que la nôtre** : leur listing "électricien Poitiers" est plein de plombiers/menuisiers (même mélange NAF). On n'a pas de retard de qualité de données.

import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { getTopCities } from "@/lib/queries/cities";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { BASE_URL } from "@/lib/constants";
import { SPECIALTIES } from "@/lib/specialties";
// TECH_CITIES n'est plus utilise : buildAiUrls charge maintenant TOUTES
// les villes BDD avec >= 1 pro tech (vs 60 villes hardcodees).
import { TECH_DEPARTMENTS } from "@/lib/data/tech-departments";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";
import { INTL_SKILLS } from "@/lib/data/intl-skills";
import { FR_CITIES } from "@/lib/data/intl-fr-cities";
import { COMPETITOR_OFFERS } from "@/lib/data/competitor-offers";
// NB : le contenu EN international (/en/ai/*, gTLD workwaveai.co) n'est PLUS
// dans cet index. Il a son propre sitemap dedie + stable :
// app/sitemap-ai-en.xml/route.ts (evite de polluer l'index .fr avec des URLs .co).

// Cache 24h sur les sub-sitemaps (ISR statique). Vercel pre-genere et garde le
// resultat -> reponse en quelques ms (crucial pour ne pas timeout Googlebot, ~30s/fetch)
// ET servi depuis le CDN sans invoquer de fonction (donc pas challenge par le firewall
// BotID de Vercel — un sitemap doit etre crawlable universellement).
// NB : ne PAS passer en force-dynamic (teste 01/06 -> firewall renvoie 403 "Security
// Checkpoint" sur les requetes dynamiques). Le nb de batches /artisan est fige par
// generateSitemaps() au build ; pour le rafraichir apres un gros scrape, redeployer
// (build neuf = count exact recalcule).
export const revalidate = 86400;
// Les builders cat×ville et /ai agrègent beaucoup de villes : on laisse de la
// marge d'exécution (le défaut court coupait le build du sous-sitemap → 0 URL).
export const maxDuration = 300;

// Limites :
// - Google : 50 000 URLs max par sitemap, 50 MB max
// - On split tous les types pour rester confortablement sous la limite
const PROS_PER_SITEMAP = 45000;
const TOP_CITIES_FOR_LISTINGS = 300; // top villes par population pour cat x ville
const TOP_CITIES_FOR_SPECIALTIES = 100; // top villes pour les sous-specialites
// Supabase autorise jusqu'a 5000 rows par fetch, on en profite pour
// diviser par 5 le nombre de round-trips reseau.
const SUPABASE_PAGE_SIZE = 5000;

// IDs reserves pour generateSitemaps() :
// 0    : static + guides + blog
// 1    : cat x dept
// 2    : cat x ville
// 3    : specialites
// 4    : Workwave AI (/ai/* — landing + categories + skills + villes + dept)
// 100+N : pros batch N (toutes verticales, format /artisan/[slug])
// 200+N : pros tech batch N (format /ai/freelance/[slug])
//
// L'EN international (/en/ai/*) est volontairement HORS de cet index (sitemap
// dedie .co : app/sitemap-ai-en.xml/route.ts) pour ne pas mettre d'URLs .co
// dans la propriete GSC workwave.fr (cross-domaine).
const SITEMAP_STATIC = 0;
const SITEMAP_CAT_DEPT = 1;
const SITEMAP_CAT_CITY = 2;
const SITEMAP_SPECIALTY = 3;
const SITEMAP_AI = 4;
const SITEMAP_PROS_OFFSET = 100;
const SITEMAP_AI_PROS_OFFSET = 200;

// Categories tech utilisees pour /ai/* (Workwave AI)
const AI_CATEGORIES = [
  "intelligence-artificielle",
  "developpement-web",
  "cloud-devops",
  "no-code-automation",
  "data-analytics",
  "design-produit",
];

// IDs des categories Workwave AI en BDD (tech 43-48 + business/creatif 79-87).
// Utilises pour filtrer les pros AI dans les sub-sitemaps AI_PROS_OFFSET+.
// Source unique : lib/ai/helpers.ts AI_CATEGORY_IDS.
import { AI_CATEGORY_IDS as AI_CATEGORY_IDS_HELPER } from "@/lib/ai/helpers";
const AI_CATEGORY_IDS = AI_CATEGORY_IDS_HELPER as unknown as number[];

// ============================================================================
// generateSitemaps() : declare les sub-sitemaps
// Next.js 16 genere /sitemap.xml comme INDEX automatique
// et /sitemap/N.xml pour chaque id retourne.
// ============================================================================
export async function generateSitemaps() {
  // Nombre de sous-sitemaps EN DUR (déterministe). Le calcul via un count DB au
  // build s'est révélé non fiable : le prérendu STATIQUE de l'index restait figé
  // sur d'anciennes valeurs (count pendant le scrape) et l'entrée de cache ISR
  // survivait aux redéploiements + purges (cf. CLAUDE.md 01/06). En figeant les
  // valeurs, generateSitemaps() devient pur (aucun appel réseau) → résultat
  // déterministe, plus rien à invalider.
  // ⚠️ À BUMPER après un gros scrape :
  //   pros : Math.ceil(pros_non_tech / 45000)   |   ai : Math.ceil(pros_tech / 45000)
  //   01/06/2026 : 1 069 733 pros actifs → 24  ;  110 085 pros tech → 3.
  //   08/06/2026 : 1 271 741 non-tech → 29 (marge 32) ; 510 808 tech → 12 (marge 14).
  //   Marge volontaire : un sous-sitemap vide est inoffensif (Google l'ignore),
  //   mais un sous-sitemap NON déclaré = des pros invisibles pour Google. Le
  //   "24" figé depuis le 01/06 tronquait ~568k pros (bug détecté le 08/06).
  const proSitemapsCount = 32;
  const aiProSitemapsCount = 14;

  const sitemaps = [
    { id: SITEMAP_STATIC },
    { id: SITEMAP_CAT_DEPT },
    { id: SITEMAP_CAT_CITY },
    { id: SITEMAP_SPECIALTY },
    { id: SITEMAP_AI },
  ];
  for (let i = 0; i < proSitemapsCount; i++) {
    sitemaps.push({ id: SITEMAP_PROS_OFFSET + i });
  }
  for (let i = 0; i < aiProSitemapsCount; i++) {
    sitemaps.push({ id: SITEMAP_AI_PROS_OFFSET + i });
  }
  return sitemaps;
}

// ============================================================================
// sitemap({ id }) : genere le contenu XML pour un sub-sitemap
// ============================================================================
export default async function sitemap(props: {
  id: Promise<number>;
}): Promise<MetadataRoute.Sitemap> {
  // Next.js 15+ : props.id est une Promise (async params)
  const numId = Number(await props.id);

  if (numId === SITEMAP_STATIC) return buildStaticAndContentUrls();
  if (numId === SITEMAP_CAT_DEPT) return buildCategoryDeptUrls();
  if (numId === SITEMAP_CAT_CITY) return buildCategoryCityUrls();
  if (numId === SITEMAP_SPECIALTY) return buildSpecialtyUrls();
  if (numId === SITEMAP_AI) return buildAiUrls();
  // 200+N : pros tech au format /ai/freelance/[slug]
  if (numId >= SITEMAP_AI_PROS_OFFSET)
    return buildAiProsUrls(numId - SITEMAP_AI_PROS_OFFSET);
  // 100+N : tous les pros au format /artisan/[slug]
  if (numId >= SITEMAP_PROS_OFFSET)
    return buildProsUrls(numId - SITEMAP_PROS_OFFSET);
  return [];
}

// ============================================================================
// 4. Workwave AI : /ai/* (landing + categories + skills + villes + dept)
// ============================================================================
async function buildAiUrls(): Promise<MetadataRoute.Sitemap> {
  const now = new Date();

  // 4 pages racines /ai/* indexables (les pages noindex comme /deposer,
  // /inscription, /connexion, /succes ne sont PAS dans le sitemap).
  const aiStatic: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/ai`, lastModified: now, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/ai/freelances`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/ai/tarifs`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/ai/pour-les-freelances`, lastModified: now, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/ai/barometre-tjm`, lastModified: now, changeFrequency: "weekly", priority: 0.9 },
  ];

  // /ai/{category} — 6 categories racines
  const aiCategories: MetadataRoute.Sitemap = AI_CATEGORIES.map((slug) => ({
    url: `${BASE_URL}/ai/${slug}`,
    lastModified: now,
    changeFrequency: "weekly" as const,
    priority: 0.85,
  }));

  // /ai/barometre-tjm/{skill} — 35 stacks
  const aiBarometerSkills: MetadataRoute.Sitemap = Object.keys(TJM_REFERENCE).map(
    (skill) => ({
      url: `${BASE_URL}/ai/barometre-tjm/${skill}`,
      lastModified: now,
      changeFrequency: "monthly" as const,
      priority: 0.75,
    })
  );

  // /ai/{category}/{ville} — extended : TOUTES les villes BDD avec >= 1 pro
  // tech (vs 60 villes hardcodees auparavant). Charge depuis pros + cities.
  const supabase = getAdminServiceClient();

  // 1) Map (category_id, city_id) -> count des pros tech, via RPC d'agrégat
  // Postgres. Remplace la boucle qui chargeait les ~510k pros tech en JS (102
  // round-trips) et faisait planter tout buildAiUrls → sous-sitemap /ai VIDE.
  // Migration : migrations/2026-06-08_sitemap_count_rpcs.sql
  const countMap = new Map<string, number>(); // key = "cat_id-city_id"
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: aiCountRows, error: aiRpcErr } = await (supabase as any).rpc(
    "sitemap_ai_city_cat_counts"
  );
  if (aiRpcErr) {
    console.error(
      "[sitemap] RPC sitemap_ai_city_cat_counts KO (migration 2026-06-08 appliquée ?):",
      aiRpcErr.message
    );
  }
  // La RPC renvoie un jsonb : tableau [{ c: cat_id, v: city_id, n: count }].
  // Seuil >= 3 pros tech par ville : sans lui, 70 483 combos (≥1) feraient
  // exploser le sous-sitemap au-delà de la limite de 50 000 URLs/sitemap, avec
  // des dizaines de milliers de pages ultra-fines (1 seul freelance). À >= 3 :
  // ~21 800 combos = surface saine, sous la limite. (Le BTP applique le même
  // seuil côté SQL ; ici on filtre en JS pour ne pas re-toucher la RPC.)
  for (const r of (aiCountRows || []) as { c: number; v: number; n: number }[]) {
    if (Number(r.n) < 3) continue;
    countMap.set(`${r.c}-${r.v}`, Number(r.n));
  }

  // 2) Charger les slugs des villes referencees dans countMap
  const cityIds = Array.from(
    new Set(
      Array.from(countMap.keys()).map((k) => Number(k.split("-")[1]))
    )
  );
  const citySlugMap = new Map<number, string>();
  if (cityIds.length > 0) {
    // Charger par batchs de 1000 pour eviter le cap PostgREST
    for (let i = 0; i < cityIds.length; i += 1000) {
      const batch = cityIds.slice(i, i + 1000);
      const { data } = await supabase
        .from("cities")
        .select("id, slug")
        .in("id", batch);
      const rows = (data || []) as { id: number; slug: string }[];
      for (const row of rows) citySlugMap.set(row.id, row.slug);
    }
  }

  // 3) Charger le slug des categories tech (cat_id -> slug)
  const { data: catRowsRaw } = await supabase
    .from("categories")
    .select("id, slug")
    .in("id", AI_CATEGORY_IDS);
  const catRows = (catRowsRaw || []) as { id: number; slug: string }[];
  const catSlugMap = new Map<number, string>(
    catRows.map((c) => [c.id, c.slug])
  );

  // 4) Generer les URLs : 1 par (cat, ville) avec >= 1 pro tech
  const aiCategoryCity: MetadataRoute.Sitemap = [];
  for (const [key, count] of countMap) {
    const [catId, cityId] = key.split("-").map(Number);
    const catSlug = catSlugMap.get(catId);
    const citySlug = citySlugMap.get(cityId);
    if (!catSlug || !citySlug) continue;
    aiCategoryCity.push({
      url: `${BASE_URL}/ai/${catSlug}/${citySlug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      // Priorite ponderee par le nombre de pros tech dans la ville
      priority: count >= 10 ? 0.75 : count >= 3 ? 0.7 : 0.6,
    });
  }

  // /ai/{category}/dept/{dept-code} — 6 cat x 96 dept = 576 URLs
  const aiCategoryDept: MetadataRoute.Sitemap = AI_CATEGORIES.flatMap((catSlug) =>
    TECH_DEPARTMENTS.map((dept) => ({
      url: `${BASE_URL}/ai/${catSlug}/dept/${dept.code}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }))
  );

  // /ai/monde/* — francophone international (hors France)
  const aiMonde: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/ai/monde`, lastModified: now, changeFrequency: "weekly", priority: 0.7 },
  ];
  for (const skill of INTL_SKILLS) {
    aiMonde.push({ url: `${BASE_URL}/ai/monde/${skill.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.65 });
    for (const c of FR_CITIES) {
      aiMonde.push({ url: `${BASE_URL}/ai/monde/${skill.slug}/${c.slug}`, lastModified: now, changeFrequency: "weekly", priority: 0.6 });
    }
  }

  return [
    ...aiStatic,
    ...aiCategories,
    ...aiBarometerSkills,
    ...aiCategoryCity,
    ...aiCategoryDept,
    ...aiMonde,
  ];
}

// ============================================================================
// 0. Static + guides + blog
// ============================================================================
async function buildStaticAndContentUrls(): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminServiceClient();

  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/pro`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/pro/sans-abonnement`, changeFrequency: "weekly", priority: 0.85 },
    // Comparatifs concurrents (uniquement les modèles confirmés/sourcés).
    ...Object.values(COMPETITOR_OFFERS)
      .filter((c) => c.model && c.price_text)
      .map((c) => ({
        url: `${BASE_URL}/pro/alternatives/${c.slug}`,
        changeFrequency: "monthly" as const,
        priority: 0.75,
      })),
    { url: `${BASE_URL}/trouver-des-chantiers`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/trouver-des-clients`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/deposer-projet`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/a-propos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/recherche`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/departements`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/cgu`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cgv`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.7 },
    { url: `${BASE_URL}/guide-des-prix`, changeFrequency: "daily", priority: 0.8 },
  ];

  const { data: guidesRaw } = await supabase
    .from("seo_guides")
    .select("slug, updated_at");
  const guides = (guidesRaw || []) as { slug: string; updated_at: string }[];
  const guideUrls: MetadataRoute.Sitemap = guides.map((g) => ({
    url: `${BASE_URL}/${g.slug}/guide`,
    lastModified: new Date(g.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  const { data: postsRaw } = await supabase
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .not("published_at", "is", null);
  const posts = (postsRaw || []) as {
    slug: string;
    published_at: string;
    updated_at: string;
  }[];
  const blogUrls: MetadataRoute.Sitemap = posts.map((p) => ({
    url: `${BASE_URL}/blog/${p.slug}`,
    lastModified: new Date(p.updated_at || p.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  // Guides des prix : /[metier]/prix (scope metier) + /guide-des-prix/[slug] (prestation).
  const priceGuideUrls: MetadataRoute.Sitemap = [];
  {
    let offset = 0;
    const PAGE = 1000;
    while (true) {
      const { data } = await supabase
        .from("price_guides")
        .select("slug, scope, metier_slug, updated_at")
        .eq("status", "published")
        .order("id")
        .range(offset, offset + PAGE - 1);
      const rows = (data || []) as { slug: string; scope: string; metier_slug: string | null; updated_at: string }[];
      if (rows.length === 0) break;
      for (const g of rows) {
        const url = g.scope === "metier" && g.metier_slug
          ? `${BASE_URL}/${g.metier_slug}/prix`
          : `${BASE_URL}/guide-des-prix/${g.slug}`;
        priceGuideUrls.push({ url, lastModified: new Date(g.updated_at), changeFrequency: "monthly" as const, priority: 0.8 });
      }
      offset += rows.length;
    }
  }

  // Pages pro-acquisition "trouver des chantiers" : declinaisons metier BTP
  // ("trouver des chantiers plombier") + departement ("...en Vienne").
  const [allCats, allDepts] = await Promise.all([
    getAllCategories(),
    getAllDepartments(),
  ]);
  const chantiersUrls: MetadataRoute.Sitemap = [
    ...allCats
      .filter((c) => c.vertical === "btp")
      .map((c) => ({
        url: `${BASE_URL}/trouver-des-chantiers/${c.slug}`,
        changeFrequency: "weekly" as const,
        priority: 0.7,
      })),
    ...allDepts.map((d) => ({
      url: `${BASE_URL}/trouver-des-chantiers/${generateDepartmentSlug(d)}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    })),
  ];
  // Pages pro-acquisition services "trouver des clients" (domicile + personne).
  const clientsUrls: MetadataRoute.Sitemap = allCats
    .filter((c) => c.vertical === "domicile" || c.vertical === "personne")
    .map((c) => ({
      url: `${BASE_URL}/trouver-des-clients/${c.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }));

  return [
    ...staticUrls,
    ...chantiersUrls,
    ...clientsUrls,
    ...guideUrls,
    ...blogUrls,
    ...priceGuideUrls,
  ];
}

// ============================================================================
// 1. Cat x Dept (ex: 38 cat x 12 dept = 456)
// ============================================================================
async function buildCategoryDeptUrls(): Promise<MetadataRoute.Sitemap> {
  const [allCategories, departments] = await Promise.all([
    getAllCategories(),
    getAllDepartments(),
  ]);
  // Anti-fuite vertical : uniquement BTP/domicile/personne. Les ~145 cat tech
  // (Workwave AI) ont leurs URLs sur /ai/* (sitemap dédié) ; sur une route BTP
  // elles redirigent en 308 → ne pas polluer ce sitemap de ~5 800 redirects.
  const categories = allCategories.filter((c) =>
    ["btp", "domicile", "personne"].includes(c.vertical)
  );
  return categories.flatMap((cat) =>
    departments.map((dept) => ({
      url: `${BASE_URL}/${cat.slug}/${generateDepartmentSlug(dept)}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }))
  );
}

// ============================================================================
// 2. Cat x Ville (top N villes, >= 3 pros)
// ============================================================================
async function buildCategoryCityUrls(): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminServiceClient();
  const [allCategories, topCities] = await Promise.all([
    getAllCategories(),
    getTopCities(TOP_CITIES_FOR_LISTINGS),
  ]);
  // Anti-fuite vertical : exclure les cat tech (AI) — cf. buildCategoryDeptUrls.
  const categories = allCategories.filter((c) =>
    ["btp", "domicile", "personne"].includes(c.vertical)
  );

  const topCityIds = topCities.map((c) => c.id);
  if (topCityIds.length === 0) return [];

  // Comptage par (cat, ville) via RPC d'agrégat Postgres (GROUP BY HAVING >= 3
  // côté serveur). Remplace l'ancienne boucle qui chargeait ~700k lignes en JS
  // (top 300 villes × tous métiers : Paris seul ≈ 77k pros) → la 1re requête
  // timeoutait, la boucle cassait sur data=null, et le sous-sitemap sortait VIDE.
  // Migration : migrations/2026-06-08_sitemap_count_rpcs.sql
  const countMap = new Map<string, number>();
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const { data: countRows, error: rpcErr } = await (supabase as any).rpc(
    "sitemap_city_cat_counts",
    { p_city_ids: topCityIds }
  );
  if (rpcErr) {
    console.error(
      "[sitemap] RPC sitemap_city_cat_counts KO (migration 2026-06-08 appliquée ?):",
      rpcErr.message
    );
  }
  // La RPC renvoie un jsonb : tableau [{ c: cat_id, v: city_id, n: count }].
  for (const r of (countRows || []) as { c: number; v: number; n: number }[]) {
    countMap.set(`${r.c}-${r.v}`, Number(r.n));
  }

  const citySlugMap = new Map(topCities.map((c) => [c.id, c.slug]));
  const catSlugMap = new Map(categories.map((c) => [c.id, c.slug]));

  const urls: MetadataRoute.Sitemap = [];
  for (const [key, count] of countMap) {
    if (count < 3) continue;
    const [catId, cityId] = key.split("-").map(Number);
    const catSlug = catSlugMap.get(catId);
    const citySlug = citySlugMap.get(cityId);
    if (!catSlug || !citySlug) continue;
    urls.push({
      url: `${BASE_URL}/${catSlug}/${citySlug}`,
      changeFrequency: "weekly" as const,
      priority: count >= 10 ? 0.8 : 0.7,
    });
  }

  // ── Zone Monaco (mise en relation transfrontalière) ─────────────────────────
  // /[metier]/monaco agrège les communes frontalières (cf. getAggregatedCityIds)
  // → Monaco a 0 pro propre, donc absent de la boucle ci-dessus. On émet une URL
  // par métier ayant >= 3 artisans dans la zone (sinon la page 308 vers le 06).
  const { data: borderCities } = await supabase
    .from("cities")
    .select("id")
    .in("slug", ["beausoleil", "cap-d-ail", "roquebrune-cap-martin", "la-turbie"]);
  const borderIds = (borderCities || []).map((c: { id: number }) => c.id);
  if (borderIds.length > 0) {
    const monacoCount = new Map<number, number>();
    let mOffset = 0;
    while (true) {
      const { data } = await supabase
        .from("pros")
        .select("category_id")
        .eq("is_active", true)
        .is("deleted_at", null)
        .in("city_id", borderIds)
        .range(mOffset, mOffset + SUPABASE_PAGE_SIZE - 1);
      const rows = (data || []) as { category_id: number }[];
      for (const r of rows) monacoCount.set(r.category_id, (monacoCount.get(r.category_id) || 0) + 1);
      if (rows.length === 0) break;
      mOffset += rows.length;
    }
    for (const [catId, count] of monacoCount) {
      if (count < 3) continue;
      const catSlug = catSlugMap.get(catId);
      if (!catSlug) continue; // ignore les cat hors BTP (catSlugMap = btp/domicile/personne)
      urls.push({
        url: `${BASE_URL}/${catSlug}/monaco`,
        changeFrequency: "weekly" as const,
        priority: count >= 10 ? 0.8 : 0.7,
      });
    }
  }

  return urls;
}

// ============================================================================
// 3. Sous-specialites (cat x sub x ville >= 1 pro)
// ============================================================================
async function buildSpecialtyUrls(): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminServiceClient();
  const [categories, topCities] = await Promise.all([
    getAllCategories(),
    getTopCities(TOP_CITIES_FOR_SPECIALTIES),
  ]);

  const specialtyMetierSlugs = Object.keys(SPECIALTIES);
  const specialtyCategoryIds = categories
    .filter((c) => specialtyMetierSlugs.includes(c.slug))
    .map((c) => c.id);

  if (specialtyCategoryIds.length === 0 || topCities.length === 0) return [];

  const cityIds = topCities.map((c) => c.id);
  let offset = 0;
  let hasMore = true;
  const countMap = new Map<string, number>();

  while (hasMore) {
    const { data } = await supabase
      .from("pros")
      .select("category_id, city_id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .in("category_id", specialtyCategoryIds)
      .in("city_id", cityIds)
      .range(offset, offset + SUPABASE_PAGE_SIZE - 1);

    const rows = (data || []) as { category_id: number; city_id: number }[];
    for (const row of rows) {
      const key = `${row.category_id}-${row.city_id}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }
    if (rows.length === 0) break;
    offset += rows.length;
  }

  const urls: MetadataRoute.Sitemap = [];
  for (const cat of categories) {
    const specs = SPECIALTIES[cat.slug];
    if (!specs) continue;
    for (const spec of specs) {
      for (const city of topCities) {
        const count = countMap.get(`${cat.id}-${city.id}`) || 0;
        if (count < 1) continue;
        urls.push({
          url: `${BASE_URL}/${cat.slug}/${spec.slug}/${city.slug}`,
          changeFrequency: "weekly" as const,
          priority: count >= 5 ? 0.7 : 0.6,
        });
      }
    }
  }
  return urls;
}

// ============================================================================
// 100+N. Pros NON-tech (BTP) au format /artisan/[slug]
//
// Pagination CURSOR-BASED (WHERE id > last_id) au lieu d'OFFSET pour eviter
// les timeouts Vercel sur les batches eleves :
//  - OFFSET 225000 sur une table filtree force Postgres a scan 225k rows
//    avant de skipper. Avec count: estimated qui peut surestimer (stats
//    pg_class biaisees par scraping massif), Next.js essaie de pre-render
//    des sub-sitemaps qui n'ont rien et timeout a 60s.
//  - Cursor "WHERE id > X" utilise l'index sur id directement = instantane.
//
// IMPORTANT : on EXCLUT les pros tech (category_id 43-48). Ils sont listes
// dans les sub-sitemaps AI_PROS_OFFSET+ (200+) au format /ai/freelance/[slug].
// ============================================================================
type ProSitemapRow = {
  slug: string;
  updated_at: string;
  claimed_by_user_id: string | null;
  description: string | null;
  phone: string | null;
  id: number;
};

async function findBatchStartId(
  supabase: ReturnType<typeof getAdminServiceClient>,
  skipCount: number,
  techFilterMode: "exclude" | "include"
): Promise<number> {
  if (skipCount === 0) return 0;
  // Le calcul du startId du batch utilise OFFSET sur UN seul row (rapide :
  // Postgres scan jusqu'au row N et stop, vs charger 1000+ rows).
  let query = supabase
    .from("pros")
    .select("id")
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("id", { ascending: true });
  query =
    techFilterMode === "exclude"
      ? query.not("category_id", "in", `(${AI_CATEGORY_IDS.join(",")})`)
      : query.in("category_id", AI_CATEGORY_IDS);
  const { data } = await query.range(skipCount - 1, skipCount - 1);
  const rows = (data || []) as { id: number }[];
  // Pas de row a cet offset = batch hors-borne, on retourne -1 pour signaler
  return rows.length > 0 ? rows[0].id : -1;
}

async function buildProsUrls(batchIndex: number): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminServiceClient();
  const skipCount = batchIndex * PROS_PER_SITEMAP;

  // 1) Trouver l'id de depart pour ce batch (rapide : 1 row only)
  const startBoundary = await findBatchStartId(supabase, skipCount, "exclude");
  if (startBoundary === -1) return []; // Batch hors-borne (count estimated > reel)

  // 2) Charger les PROS_PER_SITEMAP rows en cursor (rapide : WHERE id >= X)
  const allPros: ProSitemapRow[] = [];
  let lastId = startBoundary - 1; // -1 pour inclure startBoundary lui-meme
  while (allPros.length < PROS_PER_SITEMAP) {
    const limit = Math.min(
      SUPABASE_PAGE_SIZE,
      PROS_PER_SITEMAP - allPros.length
    );
    const { data } = await supabase
      .from("pros")
      .select("slug, updated_at, claimed_by_user_id, description, phone, id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .not("category_id", "in", `(${AI_CATEGORY_IDS.join(",")})`)
      .gt("id", lastId)
      .order("id", { ascending: true })
      .limit(limit);
    const rows = (data || []) as ProSitemapRow[];
    if (rows.length === 0) break;
    allPros.push(...rows);
    lastId = rows[rows.length - 1].id;
  }

  return allPros.map((pro) => {
    const hasContent = !!(pro.claimed_by_user_id || pro.description || pro.phone);
    return {
      url: `${BASE_URL}/artisan/${pro.slug}`,
      lastModified: new Date(pro.updated_at),
      changeFrequency: "monthly" as const,
      priority: pro.claimed_by_user_id ? 0.8 : hasContent ? 0.5 : 0.3,
    };
  });
}

// ============================================================================
// 200+N. Pros TECH au format /ai/freelance/[slug] (Workwave AI)
//
// Pagination CURSOR-BASED idem buildProsUrls (cf. commentaire ci-dessus).
// Filtre : category_id IN (43-48) tech categories.
// ============================================================================
async function buildAiProsUrls(batchIndex: number): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminServiceClient();
  const skipCount = batchIndex * PROS_PER_SITEMAP;

  // 1) Trouver l'id de depart pour ce batch (rapide : 1 row only)
  const startBoundary = await findBatchStartId(supabase, skipCount, "include");
  if (startBoundary === -1) return []; // Batch hors-borne

  // 2) Charger les PROS_PER_SITEMAP rows en cursor
  const allPros: ProSitemapRow[] = [];
  let lastId = startBoundary - 1;
  while (allPros.length < PROS_PER_SITEMAP) {
    const limit = Math.min(
      SUPABASE_PAGE_SIZE,
      PROS_PER_SITEMAP - allPros.length
    );
    const { data } = await supabase
      .from("pros")
      .select("slug, updated_at, claimed_by_user_id, description, phone, id")
      .in("category_id", AI_CATEGORY_IDS)
      .eq("is_active", true)
      .is("deleted_at", null)
      .gt("id", lastId)
      .order("id", { ascending: true })
      .limit(limit);
    const rows = (data || []) as ProSitemapRow[];
    if (rows.length === 0) break;
    allPros.push(...rows);
    lastId = rows[rows.length - 1].id;
  }

  return allPros.map((pro) => {
    const hasContent = !!(pro.claimed_by_user_id || pro.description || pro.phone);
    return {
      url: `${BASE_URL}/ai/freelance/${pro.slug}`,
      lastModified: new Date(pro.updated_at),
      changeFrequency: "monthly" as const,
      // Priorite legerement plus haute pour les fiches Workwave AI : design
      // dedie + audience tech-focused = meilleur taux de conversion attendu.
      priority: pro.claimed_by_user_id ? 0.85 : hasContent ? 0.6 : 0.4,
    };
  });
}

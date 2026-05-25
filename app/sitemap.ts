import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { getTopCities } from "@/lib/queries/cities";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { BASE_URL } from "@/lib/constants";
import { SPECIALTIES } from "@/lib/specialties";
import { TECH_CITIES } from "@/lib/data/tech-cities";
import { TECH_DEPARTMENTS } from "@/lib/data/tech-departments";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";

// Cache 24h sur les sub-sitemaps. Vercel pre-genere et garde le resultat,
// donc la 2e+ requete (notamment Googlebot) repond en quelques ms au lieu
// de re-calculer la sitemap a chaque appel. C'est la cle pour eviter les
// timeouts cote Googlebot (limite ~30s par fetch).
export const revalidate = 86400;

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

// IDs des categories tech en BDD (43-48). Utilises pour filtrer les pros
// tech dans les sub-sitemaps AI_PROS_OFFSET+.
const AI_CATEGORY_IDS = [43, 44, 45, 46, 47, 48];

// ============================================================================
// generateSitemaps() : declare les sub-sitemaps
// Next.js 16 genere /sitemap.xml comme INDEX automatique
// et /sitemap/N.xml pour chaque id retourne.
// ============================================================================
export async function generateSitemaps() {
  const supabase = getAdminServiceClient();
  // count: "estimated" : lit pg_class stats, instantane (vs "exact" qui
  // scanne toute la table = 3-5s sur 226k rows). +/-0.1% d'ecart sur le
  // count, mais on s'en fiche : on l'utilise juste pour calculer le nombre
  // de batches sub-sitemaps. Cf. lesson learned CLAUDE.md 2026-04-28.
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "estimated", head: true })
    .eq("is_active", true)
    .is("deleted_at", null);

  const proSitemapsCount = Math.ceil((count || 0) / PROS_PER_SITEMAP);

  // Count pros tech (Workwave AI) pour les sub-sitemaps AI_PROS_OFFSET+.
  // count estimated ne supporte pas les filtres .in(), on fait un select
  // simple sur le category_id avec count exact (limited rows).
  const { count: techCount } = await supabase
    .from("pros")
    .select("id", { count: "estimated", head: true })
    .in("category_id", AI_CATEGORY_IDS)
    .eq("is_active", true)
    .is("deleted_at", null);
  const aiProSitemapsCount = Math.ceil((techCount || 0) / PROS_PER_SITEMAP);

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

  // /ai/{category}/{ville} — 6 cat x 60 villes = ~360 URLs
  const aiCategoryCity: MetadataRoute.Sitemap = AI_CATEGORIES.flatMap((catSlug) =>
    TECH_CITIES.map((city) => ({
      url: `${BASE_URL}/ai/${catSlug}/${city.slug}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  // /ai/{category}/dept/{dept-code} — 6 cat x 96 dept = 576 URLs
  const aiCategoryDept: MetadataRoute.Sitemap = AI_CATEGORIES.flatMap((catSlug) =>
    TECH_DEPARTMENTS.map((dept) => ({
      url: `${BASE_URL}/ai/${catSlug}/dept/${dept.code}`,
      lastModified: now,
      changeFrequency: "weekly" as const,
      priority: 0.65,
    }))
  );

  return [
    ...aiStatic,
    ...aiCategories,
    ...aiBarometerSkills,
    ...aiCategoryCity,
    ...aiCategoryDept,
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
    { url: `${BASE_URL}/deposer-projet`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/a-propos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/recherche`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/departements`, changeFrequency: "weekly", priority: 0.9 },
    { url: `${BASE_URL}/cgu`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cgv`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/blog`, changeFrequency: "daily", priority: 0.7 },
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

  return [...staticUrls, ...guideUrls, ...blogUrls];
}

// ============================================================================
// 1. Cat x Dept (ex: 38 cat x 12 dept = 456)
// ============================================================================
async function buildCategoryDeptUrls(): Promise<MetadataRoute.Sitemap> {
  const [categories, departments] = await Promise.all([
    getAllCategories(),
    getAllDepartments(),
  ]);
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
  const [categories, topCities] = await Promise.all([
    getAllCategories(),
    getTopCities(TOP_CITIES_FOR_LISTINGS),
  ]);

  const topCityIds = topCities.map((c) => c.id);
  if (topCityIds.length === 0) return [];

  // Pagination 5000 par 5000 (limite max Supabase) -> /5 le nombre de
  // round-trips reseau vs l'ancien PAGE_SIZE=1000.
  let offset = 0;
  let hasMore = true;
  const countMap = new Map<string, number>();

  while (hasMore) {
    const { data } = await supabase
      .from("pros")
      .select("category_id, city_id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .in("city_id", topCityIds)
      .range(offset, offset + SUPABASE_PAGE_SIZE - 1);

    const rows = (data || []) as { category_id: number; city_id: number }[];
    for (const row of rows) {
      const key = `${row.category_id}-${row.city_id}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }
    // Supabase peut plafonner a 1000 rows par defaut (PostgREST max-rows).
    // On continue tant qu'on recoit des lignes, et on incremente par le
    // nombre reel recu (pas par SUPABASE_PAGE_SIZE suppose). Cf. lecon
    // apprise du 30/04/2026.
    if (rows.length === 0) break;
    offset += rows.length;
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
// 100+N. Pros (split par batches de PROS_PER_SITEMAP)
// ============================================================================
async function buildProsUrls(batchIndex: number): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminServiceClient();
  const offset = batchIndex * PROS_PER_SITEMAP;

  // Charger ce batch en chunks de SUPABASE_PAGE_SIZE (5000, max Supabase)
  // jusqu'a PROS_PER_SITEMAP. Avec 45000 pros / batch et page_size=5000,
  // on fait 9 round-trips reseau au lieu de 45 (PAGE_SIZE=1000) => 5x plus
  // rapide.
  let allPros: {
    slug: string;
    updated_at: string;
    claimed_by_user_id: string | null;
    description: string | null;
    phone: string | null;
  }[] = [];

  let pageOffset = offset;
  const endOffset = offset + PROS_PER_SITEMAP;

  while (pageOffset < endOffset) {
    const rangeEnd = Math.min(
      pageOffset + SUPABASE_PAGE_SIZE - 1,
      endOffset - 1
    );
    const { data } = await supabase
      .from("pros")
      .select("slug, updated_at, claimed_by_user_id, description, phone")
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("id", { ascending: true })
      .range(pageOffset, rangeEnd);

    const rows = (data || []) as typeof allPros;
    if (rows.length === 0) break;
    allPros = allPros.concat(rows);
    // Supabase peut plafonner a 1000 rows par defaut (PostgREST max-rows).
    // On continue tant qu'on recoit des lignes, en incrementant par le
    // nombre reel recu (pas par SUPABASE_PAGE_SIZE suppose). Cf. lecon
    // apprise du 30/04/2026 : breaking sur rows.length < SUPABASE_PAGE_SIZE
    // a foire 97% de la sitemap (6740 URLs au lieu de 233k).
    pageOffset += rows.length;
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
// Liste les fiches freelance individuelles avec design Workwave AI.
// Pagination identique a buildProsUrls : 45000 par batch, 5000 par chunk.
// ============================================================================
async function buildAiProsUrls(batchIndex: number): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminServiceClient();
  const offset = batchIndex * PROS_PER_SITEMAP;

  let allPros: {
    slug: string;
    updated_at: string;
    claimed_by_user_id: string | null;
    description: string | null;
    phone: string | null;
  }[] = [];

  let pageOffset = offset;
  const endOffset = offset + PROS_PER_SITEMAP;

  while (pageOffset < endOffset) {
    const rangeEnd = Math.min(
      pageOffset + SUPABASE_PAGE_SIZE - 1,
      endOffset - 1
    );
    const { data } = await supabase
      .from("pros")
      .select("slug, updated_at, claimed_by_user_id, description, phone")
      .in("category_id", AI_CATEGORY_IDS)
      .eq("is_active", true)
      .is("deleted_at", null)
      .order("id", { ascending: true })
      .range(pageOffset, rangeEnd);

    const rows = (data || []) as typeof allPros;
    if (rows.length === 0) break;
    allPros = allPros.concat(rows);
    // Pagination robuste (lecon 30/04/2026 PostgREST cap 1000)
    pageOffset += rows.length;
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

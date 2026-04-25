import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { getTopCities } from "@/lib/queries/cities";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { BASE_URL } from "@/lib/constants";
import { SPECIALTIES } from "@/lib/specialties";

// Limites :
// - Google : 50 000 URLs max par sitemap, 50 MB max
// - On split tous les types pour rester confortablement sous la limite
const PROS_PER_SITEMAP = 45000;
const TOP_CITIES_FOR_LISTINGS = 500; // top villes par population pour cat x ville
const TOP_CITIES_FOR_SPECIALTIES = 100; // top villes pour les sous-specialites

// IDs reserves pour generateSitemaps() :
// 0 : static + guides + blog
// 1 : cat x dept
// 2 : cat x ville
// 3 : specialites
// 100+N : pros batch N
const SITEMAP_STATIC = 0;
const SITEMAP_CAT_DEPT = 1;
const SITEMAP_CAT_CITY = 2;
const SITEMAP_SPECIALTY = 3;
const SITEMAP_PROS_OFFSET = 100;

// ============================================================================
// generateSitemaps() : declare les sub-sitemaps
// Next.js 16 genere /sitemap.xml comme INDEX automatique
// et /sitemap/N.xml pour chaque id retourne.
// ============================================================================
export async function generateSitemaps() {
  const supabase = getAdminServiceClient();
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("is_active", true)
    .is("deleted_at", null);

  const proSitemapsCount = Math.ceil((count || 0) / PROS_PER_SITEMAP);

  const sitemaps = [
    { id: SITEMAP_STATIC },
    { id: SITEMAP_CAT_DEPT },
    { id: SITEMAP_CAT_CITY },
    { id: SITEMAP_SPECIALTY },
  ];
  for (let i = 0; i < proSitemapsCount; i++) {
    sitemaps.push({ id: SITEMAP_PROS_OFFSET + i });
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
  if (numId >= SITEMAP_PROS_OFFSET)
    return buildProsUrls(numId - SITEMAP_PROS_OFFSET);
  return [];
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

  // Pagination pour depasser la limite Supabase de 1000 lignes
  const PAGE_SIZE = 1000;
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
      .range(offset, offset + PAGE_SIZE - 1);

    const rows = (data || []) as { category_id: number; city_id: number }[];
    for (const row of rows) {
      const key = `${row.category_id}-${row.city_id}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }
    hasMore = rows.length === PAGE_SIZE;
    offset += PAGE_SIZE;
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
  const PAGE_SIZE = 1000;
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
      .range(offset, offset + PAGE_SIZE - 1);

    const rows = (data || []) as { category_id: number; city_id: number }[];
    for (const row of rows) {
      const key = `${row.category_id}-${row.city_id}`;
      countMap.set(key, (countMap.get(key) || 0) + 1);
    }
    hasMore = rows.length === PAGE_SIZE;
    offset += PAGE_SIZE;
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

  // Charger ce batch en chunks de 1000 (limite Supabase) jusqu'a PROS_PER_SITEMAP
  const PAGE_SIZE = 1000;
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
    const rangeEnd = Math.min(pageOffset + PAGE_SIZE - 1, endOffset - 1);
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
    if (rows.length < PAGE_SIZE) break;
    pageOffset += PAGE_SIZE;
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

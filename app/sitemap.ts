import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { getTopCities } from "@/lib/queries/cities";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { BASE_URL } from "@/lib/constants";
import { SPECIALTIES } from "@/lib/specialties";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const supabase = getAdminServiceClient();

  const [categories, departments, topCities] = await Promise.all([
    getAllCategories(),
    getAllDepartments(),
    getTopCities(50),
  ]);

  // ============================================
  // A. Pages statiques
  // ============================================
  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
    { url: `${BASE_URL}/pro`, changeFrequency: "weekly", priority: 0.8 },
    { url: `${BASE_URL}/deposer-projet`, changeFrequency: "monthly", priority: 0.8 },
    { url: `${BASE_URL}/a-propos`, changeFrequency: "monthly", priority: 0.6 },
    { url: `${BASE_URL}/recherche`, changeFrequency: "weekly", priority: 0.7 },
    { url: `${BASE_URL}/cgu`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/cgv`, changeFrequency: "yearly", priority: 0.3 },
    { url: `${BASE_URL}/mentions-legales`, changeFrequency: "yearly", priority: 0.3 },
  ];

  // ============================================
  // B. Pages categorie x departement (priority 0.9)
  // ============================================
  const categoryDeptUrls: MetadataRoute.Sitemap = categories.flatMap((cat) =>
    departments.map((dept) => ({
      url: `${BASE_URL}/${cat.slug}/${generateDepartmentSlug(dept)}`,
      changeFrequency: "weekly" as const,
      priority: 0.9,
    }))
  );

  // ============================================
  // C. Pages categorie x ville (seulement >= 3 pros)
  // ============================================

  // Requete : compter les pros par categorie x ville (top 50 villes)
  const topCityIds = topCities.map((c) => c.id);

  // Paginer pour depasser la limite Supabase de 1000 lignes
  let allCategoryCityCounts: { category_id: number; city_id: number }[] = [];
  const PAGE_SIZE = 1000;
  let offset = 0;
  let hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("pros")
      .select("category_id, city_id")
      .eq("is_active", true)
      .is("deleted_at", null)
      .in("city_id", topCityIds)
      .range(offset, offset + PAGE_SIZE - 1);

    const rows = (data || []) as { category_id: number; city_id: number }[];
    allCategoryCityCounts = allCategoryCityCounts.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  const categoryCityCounts = allCategoryCityCounts;

  // Compter les pros par couple (category_id, city_id)
  const countMap = new Map<string, number>();
  for (const row of (categoryCityCounts || []) as { category_id: number; city_id: number }[]) {
    const key = `${row.category_id}-${row.city_id}`;
    countMap.set(key, (countMap.get(key) || 0) + 1);
  }

  // Construire les index lookup
  const citySlugMap = new Map(topCities.map((c) => [c.id, c.slug]));
  const catSlugMap = new Map(categories.map((c) => [c.id, c.slug]));

  const categoryCityUrls: MetadataRoute.Sitemap = [];
  for (const [key, count] of countMap) {
    if (count < 3) continue;
    const [catId, cityId] = key.split("-").map(Number);
    const catSlug = catSlugMap.get(catId);
    const citySlug = citySlugMap.get(cityId);
    if (!catSlug || !citySlug) continue;

    categoryCityUrls.push({
      url: `${BASE_URL}/${catSlug}/${citySlug}`,
      changeFrequency: "weekly" as const,
      priority: count >= 10 ? 0.8 : 0.7,
    });
  }

  // ============================================
  // D. Fiches pros (seulement celles avec du contenu)
  // ============================================
  // Inclure TOUTES les fiches pros actives dans le sitemap
  // Les fiches enrichies (reclamees, description, phone) ont une priorite plus haute
  let allPros: { slug: string; updated_at: string; claimed_by_user_id: string | null; description: string | null; phone: string | null }[] = [];
  offset = 0;
  hasMore = true;

  while (hasMore) {
    const { data } = await supabase
      .from("pros")
      .select("slug, updated_at, claimed_by_user_id, description, phone")
      .eq("is_active", true)
      .is("deleted_at", null)
      .range(offset, offset + PAGE_SIZE - 1);

    const rows = (data || []) as { slug: string; updated_at: string; claimed_by_user_id: string | null; description: string | null; phone: string | null }[];
    allPros = allPros.concat(rows);
    hasMore = rows.length === PAGE_SIZE;
    offset += PAGE_SIZE;
  }

  const pros = allPros;

  const proUrls: MetadataRoute.Sitemap = pros.map((pro) => {
    const hasContent = !!(pro.claimed_by_user_id || pro.description || pro.phone);
    return {
      url: `${BASE_URL}/artisan/${pro.slug}`,
      lastModified: new Date(pro.updated_at),
      changeFrequency: "monthly" as const,
      priority: pro.claimed_by_user_id ? 0.8 : hasContent ? 0.5 : 0.3,
    };
  });

  // ============================================
  // E. Pages guides piliers (/[metier]/guide)
  // ============================================
  const { data: guidesRaw } = await supabase
    .from("seo_guides")
    .select("slug, updated_at");

  const guides = (guidesRaw || []) as { slug: string; updated_at: string }[];

  const guideUrls: MetadataRoute.Sitemap = guides.map((guide) => ({
    url: `${BASE_URL}/${guide.slug}/guide`,
    lastModified: new Date(guide.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.8,
  }));

  // ============================================
  // F. Pages sous-spécialités (/[metier]/[specialite]/[ville])
  // ============================================
  // 8 metiers × 5 specialites × top 10 villes Vienne = ~400 URLs candidats.
  // On ne sitemap que les couples (metier × ville) qui ont au moins 1 pro
  // (sinon page noindex donc inutile dans le sitemap).
  const specialtyTopCities = topCities.slice(0, 10);
  const specialtyCityIds = specialtyTopCities.map((c) => c.id);

  const specialtyMetierSlugs = Object.keys(SPECIALTIES);
  const specialtyCategoryIds = categories
    .filter((c) => specialtyMetierSlugs.includes(c.slug))
    .map((c) => c.id);

  // Compter pros (metier × ville) pour les métiers qui ont des spécialités
  let specialtyCounts: { category_id: number; city_id: number }[] = [];
  if (specialtyCategoryIds.length > 0 && specialtyCityIds.length > 0) {
    offset = 0;
    hasMore = true;
    while (hasMore) {
      const { data } = await supabase
        .from("pros")
        .select("category_id, city_id")
        .eq("is_active", true)
        .is("deleted_at", null)
        .in("category_id", specialtyCategoryIds)
        .in("city_id", specialtyCityIds)
        .range(offset, offset + PAGE_SIZE - 1);

      const rows = (data || []) as { category_id: number; city_id: number }[];
      specialtyCounts = specialtyCounts.concat(rows);
      hasMore = rows.length === PAGE_SIZE;
      offset += PAGE_SIZE;
    }
  }

  const specialtyCountMap = new Map<string, number>();
  for (const row of specialtyCounts) {
    const key = `${row.category_id}-${row.city_id}`;
    specialtyCountMap.set(key, (specialtyCountMap.get(key) || 0) + 1);
  }

  const specialtyUrls: MetadataRoute.Sitemap = [];
  for (const cat of categories) {
    const specs = SPECIALTIES[cat.slug];
    if (!specs) continue;
    for (const spec of specs) {
      for (const city of specialtyTopCities) {
        const count = specialtyCountMap.get(`${cat.id}-${city.id}`) || 0;
        if (count < 1) continue; // skip si page sera noindex
        specialtyUrls.push({
          url: `${BASE_URL}/${cat.slug}/${spec.slug}/${city.slug}`,
          changeFrequency: "weekly" as const,
          priority: count >= 5 ? 0.7 : 0.6,
        });
      }
    }
  }

  // ============================================
  // G. Articles de blog (/blog/[slug])
  // ============================================
  const blogStaticUrls: MetadataRoute.Sitemap = [
    { url: `${BASE_URL}/blog`, changeFrequency: "daily" as const, priority: 0.7 },
  ];

  const { data: postsRaw } = await supabase
    .from("blog_posts")
    .select("slug, published_at, updated_at")
    .eq("status", "published")
    .not("published_at", "is", null);

  const posts = (postsRaw || []) as { slug: string; published_at: string; updated_at: string }[];

  const blogUrls: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.updated_at || post.published_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [
    ...staticUrls,
    ...categoryDeptUrls,
    ...categoryCityUrls,
    ...specialtyUrls,
    ...guideUrls,
    ...blogStaticUrls,
    ...blogUrls,
    ...proUrls,
  ];
}

import type { MetadataRoute } from "next";
import { getAllCategories } from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { getTopCities } from "@/lib/queries/cities";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { BASE_URL } from "@/lib/constants";

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

  const { data: categoryCityCounts } = await supabase
    .from("pros")
    .select("category_id, city_id")
    .eq("is_active", true)
    .is("deleted_at", null)
    .in("city_id", topCityIds);

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
  const { data: prosRaw } = await supabase
    .from("pros")
    .select("slug, updated_at, claimed_by_user_id")
    .eq("is_active", true)
    .is("deleted_at", null)
    .or("claimed_by_user_id.not.is.null,description.not.is.null,phone.not.is.null");

  const pros = (prosRaw || []) as { slug: string; updated_at: string; claimed_by_user_id: string | null }[];

  const proUrls: MetadataRoute.Sitemap = pros.map((pro) => ({
    url: `${BASE_URL}/artisan/${pro.slug}`,
    lastModified: new Date(pro.updated_at),
    changeFrequency: "monthly" as const,
    priority: pro.claimed_by_user_id ? 0.8 : 0.5,
  }));

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
  // F. Articles de blog (/blog/[slug])
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
    ...guideUrls,
    ...blogStaticUrls,
    ...blogUrls,
    ...proUrls,
  ];
}

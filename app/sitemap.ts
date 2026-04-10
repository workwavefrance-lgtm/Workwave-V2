import type { MetadataRoute } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAllCategories } from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { getTopCities } from "@/lib/queries/cities";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { BASE_URL } from "@/lib/constants";

export default async function sitemap(): Promise<MetadataRoute.Sitemap> {
  const [categories, departments, topCities] = await Promise.all([
    getAllCategories(),
    getAllDepartments(),
    getTopCities(50),
  ]);

  // Pages statiques
  const staticUrls: MetadataRoute.Sitemap = [
    { url: BASE_URL, changeFrequency: "daily", priority: 1 },
  ];

  // Pages catégorie × département
  const categoryDeptUrls: MetadataRoute.Sitemap = categories.flatMap((cat) =>
    departments.map((dept) => ({
      url: `${BASE_URL}/${cat.slug}/${generateDepartmentSlug(dept)}`,
      changeFrequency: "weekly" as const,
      priority: 0.8,
    }))
  );

  // Pages catégorie × top villes
  const categoryCityUrls: MetadataRoute.Sitemap = categories.flatMap((cat) =>
    topCities.map((city) => ({
      url: `${BASE_URL}/${cat.slug}/${city.slug}`,
      changeFrequency: "weekly" as const,
      priority: 0.7,
    }))
  );

  // Fiches pros
  const supabase = await createClient();
  const { data: pros } = await supabase
    .from("pros")
    .select("slug, updated_at");

  const proUrls: MetadataRoute.Sitemap = (pros || []).map((pro) => ({
    url: `${BASE_URL}/artisan/${pro.slug}`,
    lastModified: new Date(pro.updated_at),
    changeFrequency: "monthly" as const,
    priority: 0.6,
  }));

  return [...staticUrls, ...categoryDeptUrls, ...categoryCityUrls, ...proUrls];
}

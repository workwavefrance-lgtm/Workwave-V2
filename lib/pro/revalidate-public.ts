import { revalidatePath } from "next/cache";
import { getServiceClient } from "@/lib/supabase/service-client";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { countProsByCategoryAndCityIds } from "@/lib/queries/pros";
import { getAggregatedCityIds, getCityBySlug, getCityIdsByDepartment, getParentListingCitySlugs } from "@/lib/queries/cities";
import { getProPublicPagePaths, type PublicListingRefresh } from "@/lib/pro/public-page-paths";
import type { City, Department } from "@/lib/types/database";
import { BE_ALIASES } from "@/lib/data/be-aliases";

/** Prépare tout le plan avant d'invalider ; un échec ne remet pas en cause l'écriture du pro. */
export async function revalidateProPublicPages(proId: number, knownSlug?: string): Promise<void> {
  const fallback = new Set<string>(knownSlug ? [`/artisan/${knownSlug}`] : []);
  let paths: string[];
  try {
    const db = getServiceClient();
    const { data, error } = await db.from("pros")
      .select("slug, category_id, secondary_category_ids, city:cities(id, slug, name, insee_code, department_id, department:departments(id, name, code, country, region))")
      .eq("id", proId).maybeSingle();
    if (error) throw new Error(`fiche : ${error.code}`);
    if (!data) {
      for (const path of fallback) revalidatePath(path);
      return;
    }
    fallback.add(`/artisan/${data.slug}`);
    fallback.add(`/ai/freelance/${data.slug}`);
    const ids = [...new Set<number>([data.category_id, ...(data.secondary_category_ids ?? [])])];
    const { data: categories, error: categoryError } = await db.from("categories").select("id, slug, vertical").in("id", ids);
    if (categoryError) throw new Error(`catégories : ${categoryError.code}`);
    const city = (Array.isArray(data.city) ? data.city[0] : data.city) as (City & { department: Department | Department[] | null }) | null;
    const dept = Array.isArray(city?.department) ? city.department[0] : city?.department;
    const zones: { slug: string; cityIds: number[]; specialtyCityId?: number }[] = [];
    if (city) {
      const parents = await Promise.all(getParentListingCitySlugs(city).map(getCityBySlug));
      for (const place of [city, ...parents.filter((parent) => parent !== null)]) {
        zones.push({ slug: place.slug, cityIds: await getAggregatedCityIds(place) ?? [place.id], specialtyCityId: place.id });
      }
    }
    if (dept) zones.push({ slug: generateDepartmentSlug(dept), cityIds: await getCityIdsByDepartment(dept.id) });
    const listings: PublicListingRefresh[] = [];
    // Une catégorie à la fois : pas de rafale proportionnelle au nombre de métiers.
    for (const category of categories ?? []) {
      if (category.vertical === "tech") continue;
      for (const zone of zones) {
        const count = await countProsByCategoryAndCityIds(category.id, zone.cityIds);
        const specialtyCount = zone.specialtyCityId === undefined ? undefined
          : zone.cityIds.length === 1 && zone.cityIds[0] === zone.specialtyCityId ? count
          : await countProsByCategoryAndCityIds(category.id, [zone.specialtyCityId]);
        listings.push({ categorySlug: category.slug, locationSlug: zone.slug, count, specialtyCount });
        if (dept?.country === "BE") {
          for (const alias of Object.values(BE_ALIASES)) {
            if (alias.parentSlug === category.slug) listings.push({ categorySlug: alias.urlSlug, locationSlug: zone.slug, count });
          }
        }
      }
    }
    paths = [...new Set([...fallback, ...getProPublicPagePaths(data.slug, listings)])];
  } catch (error) {
    console.error(`[revalidate-pro] Fiche ${proId} : rafraîchissement des listings à reprendre ; écriture conservée.`, error instanceof Error ? error.message : error);
    for (const path of fallback) revalidatePath(path);
    return;
  }
  for (const path of paths) revalidatePath(path);
}

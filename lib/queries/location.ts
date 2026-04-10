import type { ResolvedLocation } from "@/lib/types/database";
import { getDepartmentBySlug } from "./departments";
import { getCityBySlug } from "./cities";

export async function resolveLocation(
  slug: string
): Promise<ResolvedLocation | null> {
  // 1. Essayer comme département (format "vienne-86")
  const department = await getDepartmentBySlug(slug);
  if (department) {
    return { type: "department", department };
  }

  // 2. Essayer comme ville
  const city = await getCityBySlug(slug);
  if (city) {
    return { type: "city", city };
  }

  return null;
}

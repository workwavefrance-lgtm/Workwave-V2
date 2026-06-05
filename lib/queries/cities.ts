import { createClient } from "@/lib/supabase/server";
import type { City, CityWithDepartment } from "@/lib/types/database";

export async function getTopCities(limit: number = 20): Promise<City[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .order("population", { ascending: false, nullsFirst: false })
    .limit(limit);
  return (data as City[]) || [];
}

export async function getCitiesByDepartment(
  departmentId: number
): Promise<City[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*")
    .eq("department_id", departmentId)
    .order("population", { ascending: false, nullsFirst: false });
  return (data as City[]) || [];
}

export async function getCityBySlug(
  slug: string
): Promise<CityWithDepartment | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("*, department:departments(*)")
    .eq("slug", slug)
    .order("population", { ascending: false, nullsFirst: false })
    .limit(1)
    .single();
  return data as CityWithDepartment | null;
}

export async function getNearbyCities(
  cityId: number,
  limit: number = 8
): Promise<City[]> {
  const supabase = await createClient();

  // Récupérer la ville de référence
  const { data: city } = await supabase
    .from("cities")
    .select("latitude, longitude, department_id")
    .eq("id", cityId)
    .single();

  if (!city?.latitude || !city?.longitude) return [];

  // Chercher les villes proches dans le même département
  const { data } = await supabase
    .from("cities")
    .select("*")
    .eq("department_id", city.department_id)
    .neq("id", cityId)
    .not("latitude", "is", null)
    .order("population", { ascending: false, nullsFirst: false });

  if (!data) return [];

  // Trier par distance euclidienne approx
  const sorted = (data as City[])
    .map((c) => ({
      ...c,
      distance:
        Math.abs((c.latitude || 0) - city.latitude) +
        Math.abs((c.longitude || 0) - city.longitude),
    }))
    .sort((a, b) => a.distance - b.distance)
    .slice(0, limit);

  return sorted;
}

// ── Communes à arrondissements municipaux (Marseille / Lyon / Paris) ──────────
// Le scrape SIRENE rattache chaque établissement à son arrondissement (codes
// INSEE 132xx / 6938x / 751xx), pas à la commune "parent" (13055 / 69123 /
// 75056). On crée donc une ville par arrondissement ET la page listing de la
// commune parent (/[metier]/marseille) AGRÈGE ses arrondissements en une seule
// page forte — la requête "plombier marseille" (sans arrondissement) est de
// loin la plus volumineuse.
const METRO_PARENT_INSEE = new Set(["13055", "69123", "75056"]); // Marseille, Lyon, Paris

export function isMetroParentInsee(insee: string | null | undefined): boolean {
  return !!insee && METRO_PARENT_INSEE.has(insee);
}

/**
 * Retourne les city_id à agréger pour une commune parent à arrondissements
 * (le parent lui-même + ses arrondissements), ou `null` si ce n'est pas un
 * parent métro. Les arrondissements sont reconnus par leur nom
 * « {commune} Ne Arrondissement » dans le même département.
 */
export async function getMetroChildCityIds(city: {
  id: number;
  insee_code: string | null;
  department_id: number;
  name: string;
}): Promise<number[] | null> {
  if (!isMetroParentInsee(city.insee_code)) return null;
  const supabase = await createClient();
  const { data } = await supabase
    .from("cities")
    .select("id")
    .eq("department_id", city.department_id)
    .ilike("name", `${city.name} %Arrondissement`);
  const ids = (data || []).map((c: { id: number }) => c.id);
  return [city.id, ...ids];
}

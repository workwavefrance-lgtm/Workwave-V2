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
  departmentId: number,
  limit?: number
): Promise<City[]> {
  const supabase = await createClient();
  // 16/06 : ajout d'un `limit` optionnel. La racine métier /[metier] appelait
  // ça sur 101 départements (= ~34 000 communes chargées toutes colonnes) pour
  // n'en afficher que 10/dept → timeout (healthcheck KO) + gros egress sous le
  // crawl. Les pages n'utilisent qu'un top par population → on limite à la source.
  let q = supabase
    .from("cities")
    .select("*")
    .eq("department_id", departmentId)
    .order("population", { ascending: false, nullsFirst: false });
  if (limit && limit > 0) q = q.limit(limit);
  const { data } = await q;
  return (data as City[]) || [];
}

// Count global des communes (pour les stats "X villes couvertes") sans charger
// les lignes — estimated + head:true = quasi 0 egress.
export async function getTotalCitiesCount(): Promise<number> {
  const supabase = await createClient();
  const { count } = await supabase
    .from("cities")
    .select("id", { count: "estimated", head: true });
  return count || 0;
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

// ── Villes "parent" qui AGRÈGENT plusieurs city_id sur une seule page ─────────
//
// Deux cas :
//
// 1) Métropoles à arrondissements municipaux (Marseille / Lyon / Paris). Le
//    scrape SIRENE rattache chaque établissement à son arrondissement (codes
//    INSEE 132xx / 6938x / 751xx), pas à la commune "parent" (13055 / 69123 /
//    75056). La page de la commune parent (/[metier]/marseille) agrège ses
//    arrondissements en une seule page forte (requête "plombier marseille" =
//    la plus volumineuse).
//
// 2) Zones de mise en relation TRANSFRONTALIÈRES. Monaco est un État souverain
//    hors SIRENE, et son registre (RCI) est interdit au scraping. On ne crée
//    donc AUCUNE fausse entreprise monégasque : la page /[metier]/monaco agrège
//    les artisans RÉELS des communes françaises frontalières (Beausoleil,
//    Cap-d'Ail, Roquebrune-Cap-Martin, La Turbie) qui interviennent à Monaco.
//    La ville parent "Monaco" n'a aucun pro propre et n'est PAS incluse.
const METRO_PARENT_INSEE = new Set(["13055", "69123", "75056"]); // Marseille, Lyon, Paris

const BORDER_ZONE_CHILD_SLUGS: Record<string, string[]> = {
  monaco: ["beausoleil", "cap-d-ail", "roquebrune-cap-martin", "la-turbie"],
};

export function isMetroParentInsee(insee: string | null | undefined): boolean {
  return !!insee && METRO_PARENT_INSEE.has(insee);
}

export function isBorderZoneSlug(slug: string | null | undefined): boolean {
  return !!slug && slug in BORDER_ZONE_CHILD_SLUGS;
}

/**
 * Retourne les city_id à AGRÉGER pour une "ville parent", ou `null` quand la
 * ville n'agrège rien (cas normal : 1 ville = 1 city_id, aucune query en plus).
 */
export async function getAggregatedCityIds(city: {
  id: number;
  slug: string;
  insee_code: string | null;
  department_id: number;
  name: string;
}): Promise<number[] | null> {
  // 1. Zone transfrontalière (Monaco) — enfants par slug explicite
  const zoneSlugs = BORDER_ZONE_CHILD_SLUGS[city.slug];
  if (zoneSlugs) {
    const supabase = await createClient();
    const { data } = await supabase.from("cities").select("id").in("slug", zoneSlugs);
    const ids = (data || []).map((c: { id: number }) => c.id);
    return ids.length > 0 ? ids : null;
  }
  // 2. Métropole à arrondissements (Marseille/Lyon/Paris)
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

import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type {
  PaginatedResult,
  ProCardData,
  ProWithRelations,
} from "@/lib/types/database";

// ── Réduction egress Supabase (11/06/2026, quota dépassé 188% sous crawl
// Google massif sur 1,8M pages) : 2 niveaux de select au lieu d'un seul fat
// "*, categories(*), cities(*, departments(*))" partout. ──
//
// Niveau FICHE/DASHBOARD : `*` sur pros (trop de consommateurs — fiche
// /artisan, dashboards BTP/AI — pour risquer d'oublier un champ), mais joins
// amincis : on ne tire plus categories.description / seo_keywords / naf_codes
// / popularity ni cities.equipments_count / bpe_synced_at, que AUCUN
// consommateur de ces requêtes ne lit (vérifié par grep 11/06/2026 : les
// dashboards lisent category.name + city.name/department_id/department.id ;
// la fiche lit category.{id,slug,name,vertical} + city.{name,slug,latitude,
// longitude,department.{name,code}} ; pro-seo-sections lit category.{name,
// slug} + city.name + department.name).
const PRO_SELECT: string =
  "*, category:categories(id, slug, name, vertical, parent_id), " +
  "city:cities(id, department_id, name, slug, postal_code, insee_code, population, latitude, longitude, country, " +
  "department:departments(id, code, name, region, country))";

// Niveau CARD : listings /[metier]/[location] (pages 2+), pros similaires,
// recherche, top-pros (page 1). UNIQUEMENT les champs consommés par
// ProCard / TopProCard / buildProSummary / buildProBadges / computeProScore
// et le schema ItemList des pages listing (address, phone, ratings).
// Mesuré : ~3,4 Ko -> ~1,1 Ko par row (-66%). Sur une page listing qui tire
// jusqu'à 500 rows (top-pros MAX_FETCH), c'est LE gros poste d'egress.
export const PRO_SELECT_CARD: string =
  "id, slug, name, address, postal_code, phone, description, logo_url, claimed_by_user_id, " +
  "category_id, city_id, google_rating, google_reviews_count, google_place_id, " +
  "workwave_reviews_avg, workwave_reviews_count, founded_year, certifications, rge_certified, " +
  "has_decennale, has_rc_pro, photos, profile_completion, " +
  "category:categories(id, slug, name, vertical), city:cities(id, name, slug)";

// NB : le param `query` est volontairement non-générique — le type-parser de
// supabase-js ne sait pas parser les longs selects concaténés (TS2589) et le
// résultat est de toute façon casté en ProCardData[] au retour.
async function paginatedQuery(
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  query: any,
  page: number,
  pageSize: number
): Promise<PaginatedResult<ProCardData>> {
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  // Sprint 13 : boost claimed pour mettre en premier les pros qui ont
  // reclame leur fiche (engagement reel) avant les fiches scrapees Sirene.
  // Incite les pros a reclamer leur fiche pour gagner en visibilite.
  const { data, count } = await query
    .range(from, to)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .order("name");

  const total = count || 0;

  return {
    data: (data as unknown as ProCardData[]) || [],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

/**
 * Pagination des pros d'une catégorie sur un ENSEMBLE de villes (1 ou
 * plusieurs). Utilise par la page dept et par l'agregation des arrondissements
 * (Marseille/Lyon/Paris : /[metier]/marseille agrège les 16 arrondissements).
 */
export async function getProsByCategoryAndCityIds(
  categoryId: number,
  cityIds: number[],
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProCardData>> {
  if (cityIds.length === 0) {
    return { data: [], count: 0, page, pageSize, totalPages: 0 };
  }
  const supabase = await createClient();
  const query = supabase
    .from("pros")
    .select(PRO_SELECT_CARD, { count: "exact" })
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true);

  return paginatedQuery(query, page, pageSize);
}

export async function getProsByCategoryAndDepartment(
  categoryId: number,
  departmentId: number,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProCardData>> {
  const supabase = await createClient();

  // Récupérer les city_ids du département
  const { data: cities } = await supabase
    .from("cities")
    .select("id")
    .eq("department_id", departmentId);
  const cityIds = (cities || []).map((c: { id: number }) => c.id);

  return getProsByCategoryAndCityIds(categoryId, cityIds, { page, pageSize });
}

/**
 * Count LÉGER (head:true → AUCUNE row transférée, juste le header
 * Content-Range). Pour les gardes anti-thin des pages programmatiques
 * (/[metier]/urgence/[ville]) sans payer l'egress d'un listing complet.
 */
export async function countProsByCategoryAndCityIds(
  categoryId: number,
  cityIds: number[]
): Promise<number> {
  if (cityIds.length === 0) return 0;
  const supabase = await createClient();
  const { count } = await supabase
    .from("pros")
    .select("id", { count: "exact", head: true })
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true);
  return count || 0;
}

/**
 * Mini-cartes pros (nom + slug uniquement) — select minimal pour l'egress
 * (~60 octets/row vs ~1,1 Ko en PRO_SELECT_CARD). Même tri que les listings
 * (claimed d'abord, puis nom).
 */
export async function getProMiniCardsByCategoryAndCityIds(
  categoryId: number,
  cityIds: number[],
  limit: number = 3
): Promise<{ id: number; slug: string; name: string }[]> {
  if (cityIds.length === 0) return [];
  const supabase = await createClient();
  const { data } = await supabase
    .from("pros")
    .select("id, slug, name")
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("claimed_by_user_id", { ascending: false, nullsFirst: false })
    .order("name")
    .limit(limit);
  return (data as { id: number; slug: string; name: string }[]) || [];
}

export async function getProsByCategoryAndCity(
  categoryId: number,
  cityId: number,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProCardData>> {
  const supabase = await createClient();
  const query = supabase
    .from("pros")
    .select(PRO_SELECT_CARD, { count: "exact" })
    .eq("category_id", categoryId)
    .eq("city_id", cityId)
    .is("deleted_at", null)
    .eq("is_active", true);

  return paginatedQuery(query, page, pageSize);
}

export async function getProBySlug(
  slug: string
): Promise<ProWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("slug", slug)
    .is("deleted_at", null)
    .eq("is_active", true)
    .single();

  return data as ProWithRelations | null;
}

export async function getProByUserId(
  userId: string
): Promise<ProWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("claimed_by_user_id", userId)
    .is("deleted_at", null)
    .eq("is_active", true)
    .maybeSingle();

  return data as ProWithRelations | null;
}

/**
 * Recupere la fiche Workwave AI d'un user authentifie.
 * Filtre strict sur category_id in AI_CATEGORY_IDS (tech 43-48 + business/creatif 79-87).
 *
 * Fix #14 : si un user a a la fois une fiche BTP et AI (rare mais possible),
 * getProByUserId() generique retournait la 1ere trouvee (ordre indefini),
 * provocant un redirect en boucle dans le dashboard AI. Cette fonction force
 * le filtre AI.
 */
// 14 categories Workwave AI : import depuis helpers (source unique de verite).
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
const AI_CATEGORY_IDS_QUERY = AI_CATEGORY_IDS as unknown as number[];
export async function getAiProByUserId(
  userId: string
): Promise<ProWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("claimed_by_user_id", userId)
    .in("category_id", AI_CATEGORY_IDS_QUERY)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("id", { ascending: false }) // si plusieurs, prendre la plus recente
    .limit(1)
    .maybeSingle();

  return data as ProWithRelations | null;
}

/**
 * Recupere la fiche BTP (Workwave BTP) d'un user authentifie.
 * Filtre strict sur category_id NOT IN AI_CATEGORY_IDS (donc tout sauf 43-48 + 79-87).
 */
export async function getBtpProByUserId(
  userId: string
): Promise<ProWithRelations | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("claimed_by_user_id", userId)
    .not("category_id", "in", `(${AI_CATEGORY_IDS_QUERY.join(",")})`)
    .is("deleted_at", null)
    .eq("is_active", true)
    .order("id", { ascending: false })
    .limit(1)
    .maybeSingle();

  return data as ProWithRelations | null;
}

export async function getSimilarPros(
  categoryId: number,
  cityId: number,
  excludeSlug: string,
  limit: number = 5
): Promise<ProCardData[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT_CARD)
    .eq("category_id", categoryId)
    .eq("city_id", cityId)
    .neq("slug", excludeSlug)
    .is("deleted_at", null)
    .eq("is_active", true)
    .limit(limit);

  return (data as unknown as ProCardData[]) || [];
}

export async function searchPros(
  query: string,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProCardData>> {
  const supabase = await createClient();
  const q = supabase
    .from("pros")
    .select(PRO_SELECT_CARD, { count: "exact" })
    .ilike("name", `%${query}%`)
    .is("deleted_at", null)
    .eq("is_active", true)
    // Anti-fuite vertical : la recherche BTP exclut les freelances AI
    // (leur fiche /artisan/[slug] redirige vers /ai/freelance, incoherent
    // dans un contexte BTP). Audit separation 29/05/2026.
    .not("category_id", "in", `(${AI_CATEGORY_IDS_QUERY.join(",")})`);

  return paginatedQuery(q, page, pageSize);
}

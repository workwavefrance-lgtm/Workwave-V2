import { createClient } from "@/lib/supabase/server";
import { DEFAULT_PAGE_SIZE } from "@/lib/constants";
import type {
  PaginatedResult,
  ProWithRelations,
} from "@/lib/types/database";

const PRO_SELECT = "*, category:categories(*), city:cities(*, department:departments(*))";

async function paginatedQuery(
  query: ReturnType<ReturnType<Awaited<ReturnType<typeof createClient>>["from"]>["select"]>,
  page: number,
  pageSize: number
): Promise<PaginatedResult<ProWithRelations>> {
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
    data: (data as ProWithRelations[]) || [],
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
): Promise<PaginatedResult<ProWithRelations>> {
  if (cityIds.length === 0) {
    return { data: [], count: 0, page, pageSize, totalPages: 0 };
  }
  const supabase = await createClient();
  const query = supabase
    .from("pros")
    .select(PRO_SELECT, { count: "exact" })
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
): Promise<PaginatedResult<ProWithRelations>> {
  const supabase = await createClient();

  // Récupérer les city_ids du département
  const { data: cities } = await supabase
    .from("cities")
    .select("id")
    .eq("department_id", departmentId);
  const cityIds = (cities || []).map((c: { id: number }) => c.id);

  return getProsByCategoryAndCityIds(categoryId, cityIds, { page, pageSize });
}

export async function getProsByCategoryAndCity(
  categoryId: number,
  cityId: number,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProWithRelations>> {
  const supabase = await createClient();
  const query = supabase
    .from("pros")
    .select(PRO_SELECT, { count: "exact" })
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
): Promise<ProWithRelations[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("pros")
    .select(PRO_SELECT)
    .eq("category_id", categoryId)
    .eq("city_id", cityId)
    .neq("slug", excludeSlug)
    .is("deleted_at", null)
    .eq("is_active", true)
    .limit(limit);

  return (data as ProWithRelations[]) || [];
}

export async function searchPros(
  query: string,
  { page = 1, pageSize = DEFAULT_PAGE_SIZE } = {}
): Promise<PaginatedResult<ProWithRelations>> {
  const supabase = await createClient();
  const q = supabase
    .from("pros")
    .select(PRO_SELECT, { count: "exact" })
    .ilike("name", `%${query}%`)
    .is("deleted_at", null)
    .eq("is_active", true)
    // Anti-fuite vertical : la recherche BTP exclut les freelances AI
    // (leur fiche /artisan/[slug] redirige vers /ai/freelance, incoherent
    // dans un contexte BTP). Audit separation 29/05/2026.
    .not("category_id", "in", `(${AI_CATEGORY_IDS_QUERY.join(",")})`);

  return paginatedQuery(q, page, pageSize);
}

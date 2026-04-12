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

  const { data, count } = await query
    .range(from, to)
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
  if (cityIds.length === 0) {
    return { data: [], count: 0, page, pageSize, totalPages: 0 };
  }

  const query = supabase
    .from("pros")
    .select(PRO_SELECT, { count: "exact" })
    .eq("category_id", categoryId)
    .in("city_id", cityIds)
    .is("deleted_at", null)
    .eq("is_active", true);

  return paginatedQuery(query, page, pageSize);
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
    .single();

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
    .eq("is_active", true);

  return paginatedQuery(q, page, pageSize);
}

import { createClient } from "@/lib/supabase/server";
import type {
  ProjectLead,
  ProjectLeadStatus,
  Project,
  Category,
  CityWithDepartment,
} from "@/lib/types/database";

// ============================================
// Types
// ============================================

export type LeadWithProject = ProjectLead & {
  project: Project & {
    category: Category;
    city: CityWithDepartment | null;
  };
};

export type LeadStats = {
  receivedThisMonth: number;
  contactedThisMonth: number;
  responseRate: number;
  prevReceived: number;
  prevContacted: number;
  prevResponseRate: number;
};

// ============================================
// Constantes
// ============================================

const LEAD_WITH_PROJECT_SELECT =
  "*, project:projects(*, category:categories(*), city:cities(*, department:departments(*)))";

// ============================================
// Requêtes
// ============================================

export async function getLeadStatsForPro(proId: number): Promise<LeadStats> {
  const supabase = await createClient();
  const now = new Date();
  const currentMonthStart = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();
  const prevMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();

  // Leads reçus ce mois
  const { count: receivedThisMonth } = await supabase
    .from("project_leads")
    .select("*", { count: "exact", head: true })
    .eq("pro_id", proId)
    .gte("sent_at", currentMonthStart);

  // Leads contactés ce mois
  const { count: contactedThisMonth } = await supabase
    .from("project_leads")
    .select("*", { count: "exact", head: true })
    .eq("pro_id", proId)
    .eq("status", "contacted")
    .gte("contacted_at", currentMonthStart);

  // Leads reçus le mois précédent
  const { count: prevReceived } = await supabase
    .from("project_leads")
    .select("*", { count: "exact", head: true })
    .eq("pro_id", proId)
    .gte("sent_at", prevMonthStart)
    .lt("sent_at", currentMonthStart);

  // Leads contactés le mois précédent
  const { count: prevContacted } = await supabase
    .from("project_leads")
    .select("*", { count: "exact", head: true })
    .eq("pro_id", proId)
    .eq("status", "contacted")
    .gte("contacted_at", prevMonthStart)
    .lt("contacted_at", currentMonthStart);

  const received = receivedThisMonth || 0;
  const contacted = contactedThisMonth || 0;
  const responseRate =
    received > 0 ? Math.round((contacted / received) * 100) : 0;

  const prevRec = prevReceived || 0;
  const prevCon = prevContacted || 0;
  const prevResponseRate =
    prevRec > 0 ? Math.round((prevCon / prevRec) * 100) : 0;

  return {
    receivedThisMonth: received,
    contactedThisMonth: contacted,
    responseRate,
    prevReceived: prevRec,
    prevContacted: prevCon,
    prevResponseRate,
  };
}

export async function getRecentLeadsForPro(
  proId: number,
  limit = 5
): Promise<LeadWithProject[]> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_leads")
    .select(LEAD_WITH_PROJECT_SELECT)
    .eq("pro_id", proId)
    .order("sent_at", { ascending: false })
    .limit(limit);

  return (data as LeadWithProject[]) || [];
}

export async function getLeadsForPro(
  proId: number,
  {
    status,
    page = 1,
    pageSize = 10,
  }: { status?: ProjectLeadStatus; page?: number; pageSize?: number } = {}
) {
  const supabase = await createClient();
  const from = (page - 1) * pageSize;
  const to = from + pageSize - 1;

  let query = supabase
    .from("project_leads")
    .select(LEAD_WITH_PROJECT_SELECT, { count: "exact" })
    .eq("pro_id", proId);

  if (status) {
    query = query.eq("status", status);
  }

  const { data, count } = await query
    .order("sent_at", { ascending: false })
    .range(from, to);

  const total = count || 0;

  return {
    data: (data as LeadWithProject[]) || [],
    count: total,
    page,
    pageSize,
    totalPages: Math.ceil(total / pageSize),
  };
}

export async function getLeadById(
  leadId: number,
  proId: number
): Promise<LeadWithProject | null> {
  const supabase = await createClient();
  const { data } = await supabase
    .from("project_leads")
    .select(LEAD_WITH_PROJECT_SELECT)
    .eq("id", leadId)
    .eq("pro_id", proId)
    .single();

  return (data as LeadWithProject) || null;
}

/**
 * Compte les projets du mois dernier qui auraient matché
 * les préférences actuelles du pro (catégorie + département).
 * Approximation : on ne calcule pas la distance GPS exacte,
 * on filtre par département du pro.
 */
export async function getLeadPreviewCount(
  categoryIds: number[],
  departmentId: number | null
): Promise<number> {
  if (categoryIds.length === 0 || !departmentId) return 0;

  const supabase = await createClient();
  const now = new Date();
  const lastMonthStart = new Date(
    now.getFullYear(),
    now.getMonth() - 1,
    1
  ).toISOString();
  const lastMonthEnd = new Date(
    now.getFullYear(),
    now.getMonth(),
    1
  ).toISOString();

  // Récupérer les city_ids du département
  const { data: cities } = await supabase
    .from("cities")
    .select("id")
    .eq("department_id", departmentId);

  const cityIds = (cities || []).map((c: { id: number }) => c.id);
  if (cityIds.length === 0) return 0;

  const { count } = await supabase
    .from("projects")
    .select("*", { count: "exact", head: true })
    .in("category_id", categoryIds)
    .in("city_id", cityIds)
    .gte("created_at", lastMonthStart)
    .lt("created_at", lastMonthEnd)
    .not("status", "eq", "deleted");

  return count || 0;
}

/**
 * Compte les leads reçus par chaque pro dans les 30 derniers jours.
 * Utilisé pour le calcul d'équité dans le routing.
 */
export async function getLeadsReceivedLast30Days(
  proIds: number[]
): Promise<Map<number, number>> {
  const result = new Map<number, number>();
  if (proIds.length === 0) return result;

  const { createClient: createServiceClient } = await import(
    "@supabase/supabase-js"
  );
  const supabase = createServiceClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const thirtyDaysAgo = new Date(
    Date.now() - 30 * 24 * 60 * 60 * 1000
  ).toISOString();

  const { data } = await supabase
    .from("project_leads")
    .select("pro_id")
    .in("pro_id", proIds)
    .gte("sent_at", thirtyDaysAgo);

  // Compter manuellement par pro_id
  for (const row of data || []) {
    const pid = row.pro_id as number;
    result.set(pid, (result.get(pid) || 0) + 1);
  }

  return result;
}

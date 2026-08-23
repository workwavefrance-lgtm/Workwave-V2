import { createClient } from "@/lib/supabase/server";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import { getServiceClient } from "@/lib/supabase/service-client";
import { haversineKm } from "@/lib/utils/haversine";
import { dateLimiteProjet } from "@/lib/matching/fraicheur";
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
  // Service client pour bypass RLS sur la table projects (pas de SELECT policy)
  const supabase = getAdminServiceClient();
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
  // Service client pour bypass RLS sur la table projects (pas de SELECT policy)
  const supabase = getAdminServiceClient();
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

/**
 * Récupère un lead POUR UN PRO, coordonnées incluses UNIQUEMENT s'il a payé.
 *
 * Le verrou est ICI, pas dans la page. C'est volontaire : avant le 08/08/2026
 * cette fonction renvoyait le projet complet (`projects(*)`, donc email et
 * téléphone) et laissait à l'appelant le soin de vérifier `lead_unlocks`. La
 * liste le faisait, la page de détail non, et 100 leads sur 105 livraient un
 * email jamais payé à qui tapait l'URL.
 *
 * Une vérification qu'on peut oublier finit par être oubliée. Il n'existe donc
 * plus qu'UN SEUL chemin pour lire un lead, et il porte le verrou. Un futur
 * appelant ne PEUT PAS obtenir les coordonnées sans déblocage, même en le
 * voulant : elles ne sortent pas de cette fonction.
 *
 * Retourne aussi `unlocked` pour que l'affichage sache quoi montrer, mais ce
 * booléen n'est qu'un indice d'affichage, jamais la barrière.
 */
export async function getLeadForPro(
  leadId: number,
  proId: number
): Promise<{ lead: LeadWithProject; unlocked: boolean } | null> {
  // Service client pour bypass RLS sur la table projects (pas de SELECT policy)
  const supabase = getAdminServiceClient();
  const { data } = await supabase
    .from("project_leads")
    .select(LEAD_WITH_PROJECT_SELECT)
    .eq("id", leadId)
    .eq("pro_id", proId)
    .single();

  const lead = (data as unknown as LeadWithProject) || null;
  if (!lead?.project) return null;

  // Projet retiré par le particulier : plus rien ne sort, jamais.
  if (lead.project.status === "deleted") return null;

  const { data: unlock } = await supabase
    .from("lead_unlocks")
    .select("id")
    .eq("pro_id", proId)
    .eq("project_id", lead.project.id)
    .maybeSingle();

  if (unlock) return { lead, unlocked: true };

  // Pas payé : les coordonnées ne quittent pas cette fonction. Chaînes vides
  // (le type Project les déclare non-nullables) + description nettoyée, comme
  // sur la liste, un particulier laisse parfois son numéro dans le texte libre.
  const p = lead.project as typeof lead.project & {
    cleaned_description: string | null;
    has_contact_in_description: boolean | null;
  };
  return {
    lead: {
      ...lead,
      project: {
        ...lead.project,
        first_name: "",
        email: "",
        phone: "",
        description: p.has_contact_in_description
          ? p.cleaned_description || ""
          : lead.project.description,
      },
    },
    unlocked: false,
  };
}

/**
 * Compte les projets du mois dernier qui auraient matché
 * les préférences actuelles du pro (catégorie + département).
 * Approximation : on ne calcule pas la distance GPS exacte,
 * on filtre par département du pro.
 */
export async function getLeadPreviewCount(
  categoryIds: number[],
  lat: number | null,
  lng: number | null,
  radiusKm: number,
  departmentId: number | null
): Promise<number> {
  if (categoryIds.length === 0) return 0;
  if (lat == null && departmentId == null) return 0;

  // Service client pour bypass RLS sur la table projects
  const supabase = getAdminServiceClient();
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

  // Zone = RAYON d'intervention (Haversine), pas le seul département, cohérent
  // avec le broadcast + la page Leads. La table projects est petite : on charge
  // les projets des métiers du pro sur le mois puis on filtre par distance.
  const { data: rows } = await supabase
    .from("projects")
    .select("id, cities(latitude, longitude, department_id)")
    .in("category_id", categoryIds)
    .gte("created_at", lastMonthStart)
    .lt("created_at", lastMonthEnd)
    .not("status", "eq", "deleted")
    .limit(2000);

  type R = {
    cities:
      | { latitude?: number | null; longitude?: number | null; department_id?: number | null }
      | { latitude?: number | null; longitude?: number | null; department_id?: number | null }[]
      | null;
  };
  return ((rows || []) as unknown as R[]).filter((p) => {
    const c = Array.isArray(p.cities) ? p.cities[0] : p.cities;
    const cLat = c?.latitude ?? null;
    const cLng = c?.longitude ?? null;
    if (lat != null && lng != null && cLat != null && cLng != null) {
      return haversineKm(lat, lng, cLat, cLng) <= radiusKm;
    }
    return departmentId != null && (c?.department_id ?? null) === departmentId;
  }).length;
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

  const supabase = getServiceClient();

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

// ============================================
// Accueil dashboard BTP : modèle pay-per-lead (dynamique)
// ============================================

export type RecentProjectForPro = {
  id: number;
  first_name: string | null;
  categoryName: string | null;
  cityName: string | null;
  created_at: string;
  unlocked: boolean;
};

export type ProDashboardData = {
  newThisMonth: number; // projets matchés créés ce mois
  totalAvailable: number; // total projets matchés non supprimés
  unlockedCount: number; // leads débloqués par le pro (achats 9,90€)
  recentProjects: RecentProjectForPro[];
};

/**
 * Données de l'accueil dashboard BTP en modèle pay-per-lead.
 * DYNAMIQUE : compte les PROJETS matchant les catégories du pro (principale +
 * secondaires) dans son RAYON d'intervention (distance Haversine), comme la
 * page Leads et le broadcast, au lieu de la table `project_leads` (morte en
 * pay-per-lead). + lead_unlocks. Fallback département si coords manquantes.
 */
export async function getProDashboardData(args: {
  proId: number;
  categoryIds: number[];
  lat: number | null;
  lng: number | null;
  radiusKm: number;
  departmentId: number | null;
}): Promise<ProDashboardData> {
  const empty: ProDashboardData = {
    newThisMonth: 0,
    totalAvailable: 0,
    unlockedCount: 0,
    recentProjects: [],
  };
  if (args.categoryIds.length === 0) return empty;
  if (args.lat == null && args.departmentId == null) return empty;

  const supabase = getAdminServiceClient();

  // Table projects petite : on charge les projets des métiers du pro puis on
  // filtre par distance Haversine côté JS (même logique que la page Leads).
  const { data: rows } = await supabase
    .from("projects")
    .select(
      "id, first_name, created_at, cities(name, latitude, longitude, department_id), categories(name)"
    )
    .eq("vertical", "btp")
    .in("category_id", args.categoryIds)
    .neq("status", "deleted")
    // Un projet de plus de 30 jours n'est plus proposable : le particulier a
    // trouve quelqu'un. Les deblocages deja faits sont reinjectes plus bas.
    .gte("created_at", dateLimiteProjet())
    .order("created_at", { ascending: false })
    .limit(500);

  type Row = {
    id: number;
    first_name: string | null;
    created_at: string;
    cities:
      | { name?: string; latitude?: number | null; longitude?: number | null; department_id?: number | null }
      | { name?: string; latitude?: number | null; longitude?: number | null; department_id?: number | null }[]
      | null;
    categories: { name: string } | { name: string }[] | null;
  };

  const inZone = ((rows || []) as unknown as Row[]).filter((p) => {
    const c = Array.isArray(p.cities) ? p.cities[0] : p.cities;
    const cLat = c?.latitude ?? null;
    const cLng = c?.longitude ?? null;
    if (args.lat != null && args.lng != null && cLat != null && cLng != null) {
      return haversineKm(args.lat, args.lng, cLat, cLng) <= args.radiusKm;
    }
    return args.departmentId != null && (c?.department_id ?? null) === args.departmentId;
  });

  const monthStartMs = new Date(
    new Date().getFullYear(),
    new Date().getMonth(),
    1
  ).getTime();
  const totalAvailable = inZone.length;
  const newThisMonth = inZone.filter(
    (p) => new Date(p.created_at).getTime() >= monthStartMs
  ).length;

  // Leads débloqués par le pro : total + lesquels parmi les 5 récents.
  const { count: unlockedCount } = await supabase
    .from("lead_unlocks")
    .select("id", { count: "exact", head: true })
    .eq("pro_id", args.proId);

  const recent = inZone.slice(0, 5);
  const recentIds = recent.map((p) => p.id);
  const { data: unlocks } = recentIds.length
    ? await supabase
        .from("lead_unlocks")
        .select("project_id")
        .eq("pro_id", args.proId)
        .in("project_id", recentIds)
    : { data: [] as { project_id: number }[] };
  const unlockedSet = new Set((unlocks || []).map((u) => u.project_id));

  const recentProjects: RecentProjectForPro[] = recent.map((p) => ({
    id: p.id,
    first_name: p.first_name,
    categoryName: Array.isArray(p.categories)
      ? p.categories[0]?.name ?? null
      : p.categories?.name ?? null,
    cityName: Array.isArray(p.cities)
      ? p.cities[0]?.name ?? null
      : p.cities?.name ?? null,
    created_at: p.created_at,
    unlocked: unlockedSet.has(p.id),
  }));

  return {
    newThisMonth,
    totalAvailable,
    unlockedCount: unlockedCount || 0,
    recentProjects,
  };
}

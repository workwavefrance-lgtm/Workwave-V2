import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import type { SubscriptionStatus } from "@/lib/types/database";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

// IDs de categorie Workwave AI (tech + business + creatif). Utilises pour
// segmenter dans /admin/pros : vertical='ai' = ces categories, 'btp' = NOT IN.
const AI_CATEGORY_IDS_QUERY = AI_CATEGORY_IDS as unknown as number[];

const ADMIN_PRO_SELECT =
  "id, slug, name, siret, email, phone, category_id, city_id, subscription_status, subscription_plan, profile_completion, response_rate, claimed_at, created_at, trial_ends_at, current_period_end, is_active, deleted_at, category:categories(id, name, slug), city:cities(id, name, slug, department:departments(id, code, name))";

export type AdminProRow = {
  id: number;
  slug: string;
  name: string;
  siret: string | null;
  email: string | null;
  phone: string | null;
  category_id: number;
  city_id: number | null;
  subscription_status: SubscriptionStatus;
  subscription_plan: string | null;
  profile_completion: number;
  response_rate: number | null;
  claimed_at: string | null;
  created_at: string;
  trial_ends_at: string | null;
  current_period_end: string | null;
  is_active: boolean;
  deleted_at: string | null;
  category: { id: number; name: string; slug: string } | null;
  city: {
    id: number;
    name: string;
    slug: string;
    department: { id: number; code: string; name: string } | null;
  } | null;
};

export type AdminProsFilters = {
  status?: string;
  claimed?: string;
  category?: string;
  vertical?: string; // 'all' | 'btp' | 'ai'
  source?: string; // 'all' | 'sirene' | 'ai_signup' | 'manual' | 'pagesjaunes'
  // Etat metier composite (5 categories produit) :
  //   scraped     = source IN (sirene, pagesjaunes) AND claimed_by_user_id IS NULL
  //   claimed_free = claimed_by_user_id IS NOT NULL AND subscription_status IN (none, free)
  //   paying      = subscription_status = active
  //   trialing    = subscription_status = trialing
  //   canceled    = subscription_status = canceled
  // Mutuellement exclusifs par construction.
  state?: string; // 'all' | 'scraped' | 'claimed_free' | 'paying' | 'trialing' | 'canceled'
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export const getAdminPros = cache(
  async (filters: AdminProsFilters = {}) => {
    const db = getAdminServiceClient();
    const {
      status = "all",
      claimed = "all",
      vertical = "all",
      source = "all",
      state = "all",
      search = "",
      sort = "created_at",
      order = "desc",
      page = 1,
      pageSize = 25,
    } = filters;

    // count: "estimated" au lieu de "exact" : sur 226k+ pros, COUNT(*) exact
    // peut prendre plusieurs secondes et faire timeout le middleware fetch
    // /api/admin/auth/check, ce qui declenche un redirect /admin/login.
    // Estimated lit pg_class stats, instantane mais approximatif (acceptable
    // pour une UI admin).
    let query = db
      .from("pros")
      .select(ADMIN_PRO_SELECT, { count: "estimated" });

    // Filters
    if (status && status !== "all") {
      query = query.eq("subscription_status", status as SubscriptionStatus);
    }

    if (claimed === "claimed") {
      query = query.not("claimed_by_user_id", "is", null);
    } else if (claimed === "unclaimed") {
      query = query.is("claimed_by_user_id", null);
    }

    // Sprint 13 polish : filtre vertical (BTP / AI) pour segmenter dans l'admin.
    // BTP = category_id NOT IN AI_CATEGORY_IDS. AI = IN AI_CATEGORY_IDS.
    if (vertical === "btp") {
      query = query.not(
        "category_id",
        "in",
        `(${AI_CATEGORY_IDS_QUERY.join(",")})`
      );
    } else if (vertical === "ai") {
      query = query.in("category_id", AI_CATEGORY_IDS_QUERY);
    }

    // Filtre par source (sirene/ai_signup/manual/pagesjaunes)
    if (source && source !== "all") {
      query = query.eq("source", source);
    }

    // Sprint 13 polish : filtre etat metier composite. Les 5 categories
    // (scraped / claimed_free / paying / trialing / canceled) sont
    // mutuellement exclusives par construction. On combine claim + status
    // + source pour identifier chacune.
    if (state === "scraped") {
      // Fiches scrapees Sirene ou Pages Jaunes, jamais reclamees
      query = query
        .in("source", ["sirene", "pagesjaunes"])
        .is("claimed_by_user_id", null);
    } else if (state === "claimed_free") {
      // Reclamees mais en plan gratuit (pas d'abo actif)
      query = query
        .not("claimed_by_user_id", "is", null)
        .in("subscription_status", ["none", "free"]);
    } else if (state === "paying") {
      query = query.eq("subscription_status", "active");
    } else if (state === "trialing") {
      query = query.eq("subscription_status", "trialing");
    } else if (state === "canceled") {
      query = query.eq("subscription_status", "canceled");
    }

    if (search) {
      query = query.or(
        `name.ilike.%${search}%,siret.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    // Sort
    const validSorts = [
      "name",
      "created_at",
      "subscription_status",
      "profile_completion",
      "response_rate",
    ];
    const sortCol = validSorts.includes(sort) ? sort : "created_at";
    query = query.order(sortCol, { ascending: order === "asc" });

    // Paginate
    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count } = await query;

    return {
      data: (data || []) as AdminProRow[],
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
);

export const getAdminProById = cache(async (id: number) => {
  const db = getAdminServiceClient();

  const { data: pro } = await db
    .from("pros")
    .select(
      "*, category:categories(*), city:cities(*, department:departments(*))"
    )
    .eq("id", id)
    .single();

  if (!pro) return null;

  // Get recent leads
  const { data: leads } = await db
    .from("project_leads")
    .select("*, project:projects(id, first_name, description, status, category_id, created_at)")
    .eq("pro_id", id)
    .order("sent_at", { ascending: false })
    .limit(20);

  return {
    pro,
    leads: leads || [],
  };
});

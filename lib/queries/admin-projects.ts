import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import type { ProjectStatus } from "@/lib/types/database";

export type AdminProjectRow = {
  id: number;
  first_name: string;
  email: string;
  phone: string;
  description: string;
  urgency: string;
  budget: string;
  status: ProjectStatus;
  suspicion_score: number | null;
  ai_qualification: { summary?: string } | null;
  created_at: string;
  category: { id: number; name: string } | null;
  city: { id: number; name: string; department: { code: string } | null } | null;
  // Audit trail notification admin (migration 2026-05-23)
  admin_notified_at: string | null;
  admin_notification_error: string | null;
  // Diffusion + prises (refonte 13/07) : broadcast_count = pros notifiés,
  // unlockCount = pros qui ont pris le lead (débloqué les coordonnées).
  broadcast_count: number | null;
  unlockCount: number;
};

export type AdminProjectsFilters = {
  status?: string;
  category?: string;
  search?: string;
  sort?: string;
  order?: "asc" | "desc";
  page?: number;
  pageSize?: number;
};

export const getAdminProjects = cache(
  async (filters: AdminProjectsFilters = {}) => {
    const db = getAdminServiceClient();
    const {
      status = "all",
      search = "",
      sort = "created_at",
      order = "desc",
      page = 1,
      pageSize = 25,
    } = filters;

    let query = db
      .from("projects")
      .select(
        "id, first_name, email, phone, description, urgency, budget, status, suspicion_score, ai_qualification, created_at, admin_notified_at, admin_notification_error, broadcast_count, category:categories(id, name), city:cities(id, name, department:departments(code))",
        { count: "exact" }
      )
      .neq("status", "deleted");

    if (status && status !== "all") {
      query = query.eq("status", status);
    }

    if (search) {
      query = query.or(
        `first_name.ilike.%${search}%,description.ilike.%${search}%,email.ilike.%${search}%`
      );
    }

    const validSorts = ["created_at", "status", "suspicion_score"];
    const sortCol = validSorts.includes(sort) ? sort : "created_at";
    query = query.order(sortCol, { ascending: order === "asc" });

    const from = (page - 1) * pageSize;
    const to = from + pageSize - 1;
    query = query.range(from, to);

    const { data, count } = await query;

    // Nombre de prises (déblocages) par projet de la page — lead_unlocks est petit.
    const rows = (data || []) as unknown as AdminProjectRow[];
    const ids = rows.map((p) => p.id);
    const unlockByProject = new Map<number, number>();
    if (ids.length > 0) {
      const { data: unlocks } = await db
        .from("lead_unlocks")
        .select("project_id")
        .in("project_id", ids);
      for (const u of (unlocks || []) as { project_id: number }[]) {
        unlockByProject.set(u.project_id, (unlockByProject.get(u.project_id) || 0) + 1);
      }
    }
    for (const p of rows) p.unlockCount = unlockByProject.get(p.id) || 0;

    return {
      data: rows,
      count: count || 0,
      page,
      pageSize,
      totalPages: Math.ceil((count || 0) / pageSize),
    };
  }
);

export const getAdminProjectById = cache(async (id: number) => {
  const db = getAdminServiceClient();

  const { data: project } = await db
    .from("projects")
    .select(
      "*, category:categories(*), city:cities(*, department:departments(*))"
    )
    .eq("id", id)
    .single();

  if (!project) return null;

  const { data: leads } = await db
    .from("project_leads")
    .select("*, pro:pros(id, name, slug, email, phone, subscription_status)")
    .eq("project_id", id)
    .order("sent_at", { ascending: false });

  // Qui a DÉBLOQUÉ ce projet — INDÉPENDAMMENT du broadcast. Un pro peut prendre
  // un lead qu'il a trouvé dans son feed dashboard (pull) même si le broadcast
  // (push) ne l'a jamais ciblé (broadcast_count peut être 0). C'est le cas d'un
  // pro généraliste (multiservice) ou d'un pro inscrit APRÈS la diffusion.
  // On joint la fiche pro pour afficher qui c'est, même hors project_leads.
  const { data: unlockRows } = await db
    .from("lead_unlocks")
    .select(
      "pro_id, paid_at, amount_cents, pro:pros(id, name, slug, siret, phone, email, category:categories(name), city:cities(name))"
    )
    .eq("project_id", id)
    .order("paid_at", { ascending: false });

  type UnlockRaw = {
    pro_id: number;
    paid_at: string;
    amount_cents: number | null;
    pro: {
      id: number;
      name: string;
      slug: string;
      siret: string | null;
      phone: string | null;
      email: string | null;
      category: { name: string } | null;
      city: { name: string } | null;
    } | null;
  };
  const unlockList = (unlockRows || []) as unknown as UnlockRaw[];

  // Map pour enrichir les destinataires broadcast (badge "Payé" sur la liste).
  const paidMap = new Map<number, { paidAt: string; amountEur: number }>();
  for (const u of unlockList) {
    if (u.pro_id != null) paidMap.set(u.pro_id, { paidAt: u.paid_at, amountEur: (u.amount_cents || 0) / 100 });
  }

  // Liste complète des déblocages (avec fiche pro) pour la section admin dédiée.
  const unlocks = unlockList.map((u) => ({
    proId: u.pro_id,
    proName: u.pro?.name ?? null,
    proSlug: u.pro?.slug ?? null,
    siret: u.pro?.siret ?? null,
    phone: u.pro?.phone ?? null,
    email: u.pro?.email ?? null,
    categoryName: u.pro?.category?.name ?? null,
    cityName: u.pro?.city?.name ?? null,
    paidAt: u.paid_at,
    amountEur: (u.amount_cents || 0) / 100,
    isFree: (u.amount_cents || 0) === 0,
  }));

  type LeadRow = {
    id: number;
    status: string;
    sent_at: string;
    opened_at: string | null;
    contacted_at: string | null;
    pro: { id: number; name: string; slug: string; email: string | null; phone: string | null; subscription_status: string } | null;
  };
  const enriched = ((leads || []) as unknown as LeadRow[]).map((l) => {
    const paid = l.pro ? paidMap.get(l.pro.id) : undefined;
    return { ...l, paid: !!paid, paidAt: paid?.paidAt ?? null, paidAmountEur: paid?.amountEur ?? null };
  });

  return {
    project: project as Record<string, unknown>,
    leads: enriched,
    unlocks,
    // Stats du routing pour l'en-tête (à qui envoyé, combien ont payé, CA).
    routingStats: {
      sentCount: enriched.length,
      paidCount: paidMap.size,
      revenueEur: [...paidMap.values()].reduce((s, p) => s + p.amountEur, 0),
    },
  };
});

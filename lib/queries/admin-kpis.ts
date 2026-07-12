import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

export type AdminKPIs = {
  activePros: number;
  projectsThisMonth: number;
  leadsSent: number;
  conversionRate: number;
  activeProsLastMonth: number;
  projectsLastMonth: number;
  leadsSentLastMonth: number;
  conversionRateLastMonth: number;
};

const EMPTY_KPIS: AdminKPIs = {
  activePros: 0, projectsThisMonth: 0, leadsSent: 0, conversionRate: 0,
  activeProsLastMonth: 0, projectsLastMonth: 0, leadsSentLastMonth: 0, conversionRateLastMonth: 0,
};

export const getAdminKPIs = cache(async (): Promise<AdminKPIs> => {
  const db = getAdminServiceClient();

  // UNE seule fonction agrégée (migration 2026-07-13_admin_overview_rpc.sql) au lieu
  // de 8 count exact dont 2 sur pros 2,4M rows — supprime la cause des déconnexions
  // (leçon 28/04). activePros = pros RÉCLAMÉS (l'ancienne métrique « abonnés actifs »
  // valait 0 : on est en pay-per-lead).
  const { data, error } = await db.rpc("admin_overview_stats");
  if (error || !data) {
    console.error("[getAdminKPIs] RPC admin_overview_stats KO:", error?.message);
    return EMPTY_KPIS;
  }
  const s = data as Record<string, number>;

  const convRate = (s.leadsSent || 0) > 0
    ? ((s.leadsContacted || 0) / (s.leadsSent || 1)) * 100 : 0;
  const convRateLast = (s.leadsSentLastMonth || 0) > 0
    ? ((s.leadsContactedLastMonth || 0) / (s.leadsSentLastMonth || 1)) * 100 : 0;

  return {
    activePros: s.claimedPros || 0,
    projectsThisMonth: s.projectsThisMonth || 0,
    leadsSent: s.leadsSent || 0,
    conversionRate: Math.round(convRate * 10) / 10,
    activeProsLastMonth: s.claimedProsLastMonth || 0,
    projectsLastMonth: s.projectsLastMonth || 0,
    leadsSentLastMonth: s.leadsSentLastMonth || 0,
    conversionRateLastMonth: Math.round(convRateLast * 10) / 10,
  };
});

export type RecentActivity = {
  id: number;
  type: "project" | "claim" | "subscription";
  title: string;
  description: string;
  created_at: string;
};

export const getRecentActivity = cache(async (): Promise<RecentActivity[]> => {
  const db = getAdminServiceClient();
  const activities: RecentActivity[] = [];

  // Recent projects
  const { data: projects } = await db
    .from("projects")
    .select("id, first_name, description, status, created_at")
    .neq("status", "deleted")
    .order("created_at", { ascending: false })
    .limit(5) as { data: { id: number; first_name: string; description: string; status: string; created_at: string }[] | null };

  if (projects) {
    for (const p of projects) {
      activities.push({
        id: p.id,
        type: "project",
        title: `Nouveau projet de ${p.first_name}`,
        description: p.description?.slice(0, 80) + "..." || "",
        created_at: p.created_at,
      });
    }
  }

  // Recent claims
  const { data: claims } = await db
    .from("pros")
    .select("id, name, claimed_at")
    .not("claimed_at", "is", null)
    .order("claimed_at", { ascending: false })
    .limit(5) as { data: { id: number; name: string; claimed_at: string }[] | null };

  if (claims) {
    for (const c of claims) {
      activities.push({
        id: c.id,
        type: "claim",
        title: `Fiche réclamée : ${c.name}`,
        description: "Un professionnel a réclamé sa fiche",
        created_at: c.claimed_at,
      });
    }
  }

  // Sort by date and take top 10
  activities.sort(
    (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
  );

  return activities.slice(0, 10);
});

export const getSparklineData = cache(async (): Promise<number[]> => {
  const db = getAdminServiceClient();

  // 1 SEULE requête sur 30 jours puis bucket par jour côté JS, au lieu de 30
  // requêtes séquentielles (mesuré 14/06 : 30 round-trips ≈ 4,7 s → 1 requête
  // ≈ 95 ms). La table projects est petite, charger 30 jours est trivial.
  const start = new Date();
  start.setDate(start.getDate() - 29);
  start.setHours(0, 0, 0, 0);

  const { data } = (await db
    .from("projects")
    .select("created_at")
    .neq("status", "deleted")
    .gte("created_at", start.toISOString())) as { data: { created_at: string }[] | null };

  const buckets = new Array(30).fill(0);
  const startMs = start.getTime();
  for (const row of data || []) {
    const dayIdx = Math.floor((new Date(row.created_at).getTime() - startMs) / 86_400_000);
    if (dayIdx >= 0 && dayIdx < 30) buckets[dayIdx]++;
  }

  return buckets;
});

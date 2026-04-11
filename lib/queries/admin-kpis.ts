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

export const getAdminKPIs = cache(async (): Promise<AdminKPIs> => {
  const db = getAdminServiceClient();
  const now = new Date();
  const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
  const startOfLastMonth = new Date(now.getFullYear(), now.getMonth() - 1, 1).toISOString();

  const [
    { count: activePros },
    { count: activeProsLastMonth },
    { count: projectsThisMonth },
    { count: projectsLastMonth },
    { count: leadsSent },
    { count: leadsSentLastMonth },
    { count: leadsContacted },
    { count: leadsContactedLastMonth },
  ] = await Promise.all([
    db.from("pros").select("*", { count: "exact", head: true })
      .in("subscription_status", ["trialing", "active"]),
    db.from("pros").select("*", { count: "exact", head: true })
      .in("subscription_status", ["trialing", "active"])
      .lt("created_at", startOfMonth),
    db.from("projects").select("*", { count: "exact", head: true })
      .gte("created_at", startOfMonth)
      .is("deleted_at" as never, null),
    db.from("projects").select("*", { count: "exact", head: true })
      .gte("created_at", startOfLastMonth)
      .lt("created_at", startOfMonth)
      .is("deleted_at" as never, null),
    db.from("project_leads").select("*", { count: "exact", head: true })
      .gte("sent_at", startOfMonth),
    db.from("project_leads").select("*", { count: "exact", head: true })
      .gte("sent_at", startOfLastMonth)
      .lt("sent_at", startOfMonth),
    db.from("project_leads").select("*", { count: "exact", head: true })
      .gte("sent_at", startOfMonth)
      .eq("status", "contacted"),
    db.from("project_leads").select("*", { count: "exact", head: true })
      .gte("sent_at", startOfLastMonth)
      .lt("sent_at", startOfMonth)
      .eq("status", "contacted"),
  ]);

  const convRate = (leadsSent || 0) > 0
    ? ((leadsContacted || 0) / (leadsSent || 1)) * 100
    : 0;
  const convRateLast = (leadsSentLastMonth || 0) > 0
    ? ((leadsContactedLastMonth || 0) / (leadsSentLastMonth || 1)) * 100
    : 0;

  return {
    activePros: activePros || 0,
    projectsThisMonth: projectsThisMonth || 0,
    leadsSent: leadsSent || 0,
    conversionRate: Math.round(convRate * 10) / 10,
    activeProsLastMonth: activeProsLastMonth || 0,
    projectsLastMonth: projectsLastMonth || 0,
    leadsSentLastMonth: leadsSentLastMonth || 0,
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
    .is("deleted_at" as never, null)
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
  const data: number[] = [];

  for (let i = 29; i >= 0; i--) {
    const date = new Date();
    date.setDate(date.getDate() - i);
    const dayStart = new Date(date.getFullYear(), date.getMonth(), date.getDate()).toISOString();
    const dayEnd = new Date(date.getFullYear(), date.getMonth(), date.getDate() + 1).toISOString();

    const { count } = await db
      .from("projects")
      .select("*", { count: "exact", head: true })
      .gte("created_at", dayStart)
      .lt("created_at", dayEnd);

    data.push(count || 0);
  }

  return data;
});

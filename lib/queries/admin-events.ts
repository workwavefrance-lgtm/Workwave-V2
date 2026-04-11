import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

export const getEventsByDay = cache(async (days: number = 30) => {
  const db = getAdminServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = (await db
    .from("events")
    .select("event_name, created_at")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })) as {
    data: { event_name: string; created_at: string }[] | null;
  };

  // Group by day
  const byDay: Record<string, number> = {};
  for (const e of data || []) {
    const day = new Date(e.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
    byDay[day] = (byDay[day] || 0) + 1;
  }
  return Object.entries(byDay).map(([date, count]) => ({ date, count }));
});

export const getTopEvents = cache(async (days: number = 30) => {
  const db = getAdminServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = (await db
    .from("events")
    .select("event_name")
    .gte("created_at", since.toISOString())) as {
    data: { event_name: string }[] | null;
  };

  const counts: Record<string, number> = {};
  for (const e of data || []) {
    counts[e.event_name] = (counts[e.event_name] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
});

export type FunnelStep = {
  label: string;
  event: string;
  count: number;
};

export const getFunnelData = cache(async (days: number = 30): Promise<FunnelStep[]> => {
  const db = getAdminServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const funnelEvents = [
    { label: "Pages vues", event: "page_view" },
    { label: "Formulaire démarré", event: "project_form_started" },
    { label: "Formulaire soumis", event: "project_form_submitted" },
    { label: "Lead contacté", event: "lead_contacted" },
  ];

  const { data } = (await db
    .from("events")
    .select("event_name")
    .gte("created_at", since.toISOString())
    .in(
      "event_name",
      funnelEvents.map((f) => f.event)
    )) as { data: { event_name: string }[] | null };

  const counts: Record<string, number> = {};
  for (const e of data || []) {
    counts[e.event_name] = (counts[e.event_name] || 0) + 1;
  }

  return funnelEvents.map((f) => ({
    label: f.label,
    event: f.event,
    count: counts[f.event] || 0,
  }));
});

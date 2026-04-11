import { NextRequest, NextResponse } from "next/server";
import { verifyAdmin } from "@/lib/admin/auth";
import { getAdminServiceClient } from "@/lib/admin/service-client";
import type { DatePeriod } from "@/lib/types/admin";

function periodToDays(period: DatePeriod): number {
  if (period === "7d") return 7;
  if (period === "30d") return 30;
  if (period === "90d") return 90;
  if (period === "12m") return 365;
  return 30;
}

const FUNNEL_EVENTS = [
  { label: "Pages vues", event: "page_view" },
  { label: "Formulaire démarré", event: "project_form_started" },
  { label: "Formulaire soumis", event: "project_form_submitted" },
  { label: "Lead contacté", event: "lead_contacted" },
];

export async function GET(request: NextRequest) {
  const admin = await verifyAdmin();
  if (!admin) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const url = request.nextUrl.searchParams;
  const period = (url.get("period") || "30d") as DatePeriod;
  const days = periodToDays(period);

  const db = getAdminServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - days);
  const sinceISO = since.toISOString();

  // Fetch all events in the period
  const { data: rawEvents } = (await db
    .from("events")
    .select("event_name, created_at")
    .gte("created_at", sinceISO)
    .order("created_at", { ascending: true })) as {
    data: { event_name: string; created_at: string }[] | null;
  };

  const events = rawEvents || [];

  // Group by day for area chart
  const byDay: Record<string, number> = {};
  for (const e of events) {
    const day = new Date(e.created_at).toLocaleDateString("fr-FR", {
      day: "2-digit",
      month: "short",
    });
    byDay[day] = (byDay[day] || 0) + 1;
  }
  const eventsByDay = Object.entries(byDay).map(([date, count]) => ({
    date,
    count,
  }));

  // Top 10 events by count
  const counts: Record<string, number> = {};
  for (const e of events) {
    counts[e.event_name] = (counts[e.event_name] || 0) + 1;
  }
  const topEvents = Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);

  // Funnel data
  const funnel = FUNNEL_EVENTS.map((f) => ({
    label: f.label,
    event: f.event,
    count: counts[f.event] || 0,
  }));

  return NextResponse.json({
    eventsByDay,
    topEvents,
    funnel,
    totalEvents: events.length,
    period,
    days,
  });
}

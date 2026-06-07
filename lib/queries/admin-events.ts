import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

// Vertical métier : "btp" (BTP + domicile + personne) vs "ai" (tech/freelances).
export type Vertical = "btp" | "ai";
export type VerticalSplit<T> = { all: T; btp: T; ai: T };

export type EventsByDayPoint = { date: string; count: number };
export type TopEvent = { name: string; count: number };
export type FunnelStep = { label: string; event: string; count: number };

export type AdminAnalytics = {
  eventsByDay: VerticalSplit<EventsByDayPoint[]>;
  topEvents: VerticalSplit<TopEvent[]>;
  funnel: VerticalSplit<FunnelStep[]>;
  totals: VerticalSplit<number>;
};

type RawEvent = {
  event_name: string;
  created_at: string;
  project_id: number | null;
  pro_id: number | null;
  metadata: { vertical?: string } | null;
};

const isAi = (v: string | null | undefined) => v === "tech" || v === "ai";

/**
 * Charge les events de la période et classe chacun en BTP ou IA.
 * Dérivation du vertical (par ordre de priorité) :
 *  1. metadata.vertical (taggé à la source pour les events sans entité)
 *  2. projects.vertical (via project_id)
 *  3. vertical du pro via sa catégorie (via pro_id)
 *  4. défaut "btp" (le trafic principal)
 */
async function loadClassified(days: number): Promise<{ ev: RawEvent; v: Vertical }[]> {
  const db = getAdminServiceClient();
  const since = new Date();
  since.setDate(since.getDate() - days);

  const { data } = (await db
    .from("events")
    .select("event_name, created_at, project_id, pro_id, metadata")
    .gte("created_at", since.toISOString())
    .order("created_at", { ascending: true })) as { data: RawEvent[] | null };
  const events = data || [];

  const projectIds = [...new Set(events.map((e) => e.project_id).filter((x): x is number => !!x))];
  const proIds = [...new Set(events.map((e) => e.pro_id).filter((x): x is number => !!x))];

  const projVert = new Map<number, string>();
  if (projectIds.length) {
    const { data: ps } = (await db.from("projects").select("id, vertical").in("id", projectIds)) as {
      data: { id: number; vertical: string | null }[] | null;
    };
    for (const p of ps || []) if (p.vertical) projVert.set(p.id, p.vertical);
  }

  const proVert = new Map<number, string>();
  if (proIds.length) {
    // pro -> catégorie -> vertical (embed inner sur categories)
    const { data: prs } = (await db
      .from("pros")
      .select("id, categories(vertical)")
      .in("id", proIds)) as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { id: number; categories: any }[] | null;
    };
    for (const p of prs || []) {
      const v = Array.isArray(p.categories) ? p.categories[0]?.vertical : p.categories?.vertical;
      if (v) proVert.set(p.id, v);
    }
  }

  return events.map((e) => {
    const raw =
      e.metadata?.vertical ||
      (e.project_id != null ? projVert.get(e.project_id) : undefined) ||
      (e.pro_id != null ? proVert.get(e.pro_id) : undefined) ||
      null;
    return { ev: e, v: isAi(raw) ? "ai" : "btp" };
  });
}

const FUNNEL_EVENTS: { label: string; event: string }[] = [
  { label: "Formulaire démarré", event: "project_form_started" },
  { label: "Formulaire soumis", event: "project_form_submitted" },
  { label: "Lead contacté", event: "lead_contacted" },
];

function computeByDay(events: RawEvent[]): EventsByDayPoint[] {
  const byDay: Record<string, number> = {};
  for (const e of events) {
    const day = new Date(e.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short" });
    byDay[day] = (byDay[day] || 0) + 1;
  }
  return Object.entries(byDay).map(([date, count]) => ({ date, count }));
}

function computeTop(events: RawEvent[]): TopEvent[] {
  const counts: Record<string, number> = {};
  for (const e of events) counts[e.event_name] = (counts[e.event_name] || 0) + 1;
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

function computeFunnel(events: RawEvent[]): FunnelStep[] {
  const counts: Record<string, number> = {};
  for (const e of events) counts[e.event_name] = (counts[e.event_name] || 0) + 1;
  return FUNNEL_EVENTS.map((f) => ({ label: f.label, event: f.event, count: counts[f.event] || 0 }));
}

function split<T>(fn: (events: RawEvent[]) => T, classified: { ev: RawEvent; v: Vertical }[]): VerticalSplit<T> {
  const all = classified.map((c) => c.ev);
  const btp = classified.filter((c) => c.v === "btp").map((c) => c.ev);
  const ai = classified.filter((c) => c.v === "ai").map((c) => c.ev);
  return { all: fn(all), btp: fn(btp), ai: fn(ai) };
}

/** Tout l'analytics admin, séparé BTP / IA, calculé en un seul passage. */
export const getAdminAnalytics = cache(async (days: number = 30): Promise<AdminAnalytics> => {
  const classified = await loadClassified(days);
  return {
    eventsByDay: split(computeByDay, classified),
    topEvents: split(computeTop, classified),
    funnel: split(computeFunnel, classified),
    totals: {
      all: classified.length,
      btp: classified.filter((c) => c.v === "btp").length,
      ai: classified.filter((c) => c.v === "ai").length,
    },
  };
});

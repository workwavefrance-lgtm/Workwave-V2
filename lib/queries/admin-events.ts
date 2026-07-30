import { cache } from "react";
import { getAdminServiceClient } from "@/lib/admin/service-client";

// Vertical métier : "btp" (BTP + domicile + personne) vs "ai" (tech/freelances).
export type Vertical = "btp" | "ai";
export type VerticalSplit<T> = { all: T; btp: T; ai: T };

// ============================================================
// Types de sortie
// ============================================================

/** Comparaison période courante vs période précédente (même durée). */
export type Delta = { current: number; previous: number; pct: number | null };

export type EventsByDayPoint = { date: string; count: number };
export type RevenuePoint = { date: string; revenue: number; unlocks: number };
export type TopEvent = { name: string; count: number };
export type FunnelStep = { label: string; count: number; hint?: string };
export type Breakdown = { name: string; count: number };

/** Les indicateurs de tête (chiffres bruts + comparaison). L'UI dérive les taux. */
export type KpiSet = {
  revenueCents: Delta; // somme des unlocks PAYÉS (amount_cents > 0)
  unlocksPaid: Delta; // nb d'unlocks payés
  unlocksFree: Delta; // nb d'unlocks offerts (offre 2 premiers)
  projectsSubmitted: Delta; // nb project_form_submitted
  formStarted: Delta; // nb project_form_started
  claimsStarted: Delta; // nb claim_started
  claimsCompleted: Delta; // nb claim_completed
  activePros: Delta; // pros distincts actifs (dashboard_visit / profil modifié)
};

export type VerticalBundle = {
  totalEvents: number;
  kpis: KpiSet;
  revenueByDay: RevenuePoint[];
  eventsByDay: EventsByDayPoint[];
  topEvents: TopEvent[];
  conversionFunnel: FunnelStep[]; // ouvert → soumis → contact débloqué (le cash)
  formFunnel: FunnelStep[]; // progression dans les 4 étapes du formulaire
  claimFunnel: FunnelStep[]; // claim_started → claim_completed
  byCategory: Breakdown[]; // top métiers demandés
  byUrgency: Breakdown[]; // répartition urgence
  byCity: Breakdown[]; // top villes demandées
};

export type AdminAnalytics = VerticalSplit<VerticalBundle> & {
  periodDays: number;
  generatedAt: string;
};

// ============================================================
// Raw + helpers de chargement
// ============================================================

type RawEvent = {
  event_name: string;
  created_at: string;
  project_id: number | null;
  pro_id: number | null;
  metadata:
    | {
        vertical?: string;
        step?: number;
        category?: string;
        city?: string;
        urgency?: string;
      }
    | null;
};

type RawUnlock = {
  project_id: number | null;
  pro_id: number | null;
  amount_cents: number | null;
  paid_at: string | null;
  created_at: string | null;
};

const isAi = (v: string | null | undefined) => v === "tech" || v === "ai";

/** Pagination robuste (contourne le cap PostgREST de 1000 lignes — leçon 30/04). */
async function loadPaged<T>(
  table: string,
  select: string,
  sinceCol: string,
  sinceIso: string
): Promise<T[]> {
  const db = getAdminServiceClient();
  const out: T[] = [];
  const PAGE = 1000;
  let offset = 0;
  while (true) {
    const { data, error } = await db
      .from(table)
      .select(select)
      .gte(sinceCol, sinceIso)
      .order(sinceCol, { ascending: true })
      .range(offset, offset + PAGE - 1);
    if (error) break;
    const rows = (data || []) as T[];
    if (rows.length === 0) break;
    out.push(...rows);
    offset += rows.length; // incrément par le RÉEL reçu
  }
  return out;
}

// ============================================================
// Buckets temporels (axe continu, pas de trous)
// ============================================================

type Buckets = {
  keys: { key: string; label: string }[];
  keyOf: (d: Date) => string;
};

function makeBuckets(days: number, sinceCurrent: Date): Buckets {
  const monthly = days > 120; // 12 mois → buckets mensuels
  const end = new Date();
  if (monthly) {
    const keys: { key: string; label: string }[] = [];
    const cur = new Date(sinceCurrent.getFullYear(), sinceCurrent.getMonth(), 1);
    while (cur <= end) {
      const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}`;
      keys.push({
        key,
        label: cur.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return {
      keys,
      keyOf: (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`,
    };
  }
  const keys: { key: string; label: string }[] = [];
  const cur = new Date(sinceCurrent);
  cur.setHours(0, 0, 0, 0);
  const stop = new Date();
  stop.setHours(0, 0, 0, 0);
  while (cur <= stop) {
    const key = `${cur.getFullYear()}-${String(cur.getMonth() + 1).padStart(2, "0")}-${String(cur.getDate()).padStart(2, "0")}`;
    keys.push({
      key,
      label: cur.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return {
    keys,
    keyOf: (d) =>
      `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`,
  };
}

// ============================================================
// Compute par vertical
// ============================================================

const URGENCY_LABELS: Record<string, string> = {
  today: "Aujourd'hui",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  not_urgent: "Pas pressé",
  emergency: "Urgence",
};

function delta(current: number, previous: number): Delta {
  const pct = previous > 0 ? Math.round(((current - previous) / previous) * 100) : null;
  return { current, previous, pct };
}

const countName = (evs: RawEvent[], name: string) =>
  evs.reduce((n, e) => (e.event_name === name ? n + 1 : n), 0);

const sumPaid = (us: RawUnlock[]) =>
  us.reduce((n, u) => n + (u.amount_cents && u.amount_cents > 0 ? u.amount_cents : 0), 0);
const countPaid = (us: RawUnlock[]) => us.filter((u) => (u.amount_cents || 0) > 0).length;
const countFree = (us: RawUnlock[]) => us.filter((u) => (u.amount_cents || 0) === 0).length;

function activeProsCount(evs: RawEvent[]): number {
  const s = new Set<number>();
  for (const e of evs) {
    if (
      e.pro_id != null &&
      (e.event_name === "dashboard_visit" || e.event_name === "pro_profile_updated")
    )
      s.add(e.pro_id);
  }
  return s.size;
}

function computeKpis(
  evCur: RawEvent[],
  evPrev: RawEvent[],
  uCur: RawUnlock[],
  uPrev: RawUnlock[]
): KpiSet {
  return {
    revenueCents: delta(sumPaid(uCur), sumPaid(uPrev)),
    unlocksPaid: delta(countPaid(uCur), countPaid(uPrev)),
    unlocksFree: delta(countFree(uCur), countFree(uPrev)),
    projectsSubmitted: delta(
      countName(evCur, "project_form_submitted"),
      countName(evPrev, "project_form_submitted")
    ),
    formStarted: delta(
      countName(evCur, "project_form_started"),
      countName(evPrev, "project_form_started")
    ),
    claimsStarted: delta(
      countName(evCur, "claim_started"),
      countName(evPrev, "claim_started")
    ),
    claimsCompleted: delta(
      countName(evCur, "claim_completed"),
      countName(evPrev, "claim_completed")
    ),
    activePros: delta(activeProsCount(evCur), activeProsCount(evPrev)),
  };
}

function computeEventsByDay(evs: RawEvent[], b: Buckets): EventsByDayPoint[] {
  const map = new Map<string, number>();
  for (const e of evs) {
    const k = b.keyOf(new Date(e.created_at));
    map.set(k, (map.get(k) || 0) + 1);
  }
  return b.keys.map((bk) => ({ date: bk.label, count: map.get(bk.key) || 0 }));
}

function computeRevenueByDay(us: RawUnlock[], b: Buckets): RevenuePoint[] {
  const rev = new Map<string, number>();
  const cnt = new Map<string, number>();
  for (const u of us) {
    const when = u.paid_at || u.created_at;
    if (!when) continue;
    const k = b.keyOf(new Date(when));
    if ((u.amount_cents || 0) > 0) rev.set(k, (rev.get(k) || 0) + (u.amount_cents || 0));
    cnt.set(k, (cnt.get(k) || 0) + 1);
  }
  return b.keys.map((bk) => ({
    date: bk.label,
    revenue: Math.round(((rev.get(bk.key) || 0) / 100) * 100) / 100,
    unlocks: cnt.get(bk.key) || 0,
  }));
}

function computeTop(evs: RawEvent[]): TopEvent[] {
  const counts: Record<string, number> = {};
  for (const e of evs) counts[e.event_name] = (counts[e.event_name] || 0) + 1;
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 10);
}

/** Entonnoir cash : formulaire ouvert → projet soumis → contact débloqué. */
function computeConversionFunnel(evs: RawEvent[], us: RawUnlock[]): FunnelStep[] {
  return [
    { label: "Formulaire ouvert", count: countName(evs, "project_form_started") },
    { label: "Projet soumis", count: countName(evs, "project_form_submitted") },
    {
      label: "Contact débloqué",
      count: us.length,
      hint: "payés + offerts",
    },
  ];
}

/** Progression dans les 4 étapes du formulaire (event project_step_reached). */
function computeFormFunnel(evs: RawEvent[]): FunnelStep[] {
  const stepCount = (n: number) =>
    evs.reduce(
      (c, e) => (e.event_name === "project_step_reached" && e.metadata?.step === n ? c + 1 : c),
      0
    );
  return [
    { label: "Étape ville", count: stepCount(2) },
    { label: "Étape projet", count: stepCount(3) },
    { label: "Étape contact", count: stepCount(4) },
    { label: "Projet soumis", count: countName(evs, "project_form_submitted") },
  ];
}

function computeClaimFunnel(evs: RawEvent[]): FunnelStep[] {
  return [
    { label: "Réclamation démarrée", count: countName(evs, "claim_started") },
    { label: "Réclamation validée", count: countName(evs, "claim_completed") },
  ];
}

function computeBreakdown(
  evs: RawEvent[],
  field: "category" | "city" | "urgency",
  limit: number,
  labelMap?: Record<string, string>
): Breakdown[] {
  const counts: Record<string, number> = {};
  for (const e of evs) {
    if (e.event_name !== "project_form_submitted") continue;
    const raw = e.metadata?.[field];
    if (!raw) continue;
    const name = labelMap?.[raw] || raw;
    counts[name] = (counts[name] || 0) + 1;
  }
  return Object.entries(counts)
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, limit);
}

function computeBundle(
  evCur: RawEvent[],
  evPrev: RawEvent[],
  uCur: RawUnlock[],
  uPrev: RawUnlock[],
  b: Buckets
): VerticalBundle {
  return {
    totalEvents: evCur.length,
    kpis: computeKpis(evCur, evPrev, uCur, uPrev),
    revenueByDay: computeRevenueByDay(uCur, b),
    eventsByDay: computeEventsByDay(evCur, b),
    topEvents: computeTop(evCur),
    conversionFunnel: computeConversionFunnel(evCur, uCur),
    formFunnel: computeFormFunnel(evCur),
    claimFunnel: computeClaimFunnel(evCur),
    byCategory: computeBreakdown(evCur, "category", 8),
    byUrgency: computeBreakdown(evCur, "urgency", 6, URGENCY_LABELS),
    byCity: computeBreakdown(evCur, "city", 8),
  };
}

// ============================================================
// Chargement + classification + partition période
// ============================================================

type ClassifiedEvent = { ev: RawEvent; v: Vertical; inCurrent: boolean };
type ClassifiedUnlock = { u: RawUnlock; v: Vertical; inCurrent: boolean };

async function loadAndClassify(days: number): Promise<{
  events: ClassifiedEvent[];
  unlocks: ClassifiedUnlock[];
  sinceCurrent: Date;
}> {
  const db = getAdminServiceClient();
  const now = Date.now();
  const sinceCurrent = new Date(now - days * 864e5);
  const sincePrev = new Date(now - 2 * days * 864e5);
  const sincePrevIso = sincePrev.toISOString();

  // Charge 2× la fenêtre (période courante + précédente) pour les deltas
  const [events, unlocks] = await Promise.all([
    loadPaged<RawEvent>(
      "events",
      "event_name, created_at, project_id, pro_id, metadata",
      "created_at",
      sincePrevIso
    ),
    loadPaged<RawUnlock>(
      "lead_unlocks",
      "project_id, pro_id, amount_cents, paid_at, created_at",
      "paid_at",
      sincePrevIso
    ),
  ]);

  // Maps vertical : project_id → vertical, pro_id → vertical
  const projectIds = [
    ...new Set(
      [
        ...events.map((e) => e.project_id),
        ...unlocks.map((u) => u.project_id),
      ].filter((x): x is number => !!x)
    ),
  ];
  const proIds = [
    ...new Set(
      [...events.map((e) => e.pro_id), ...unlocks.map((u) => u.pro_id)].filter(
        (x): x is number => !!x
      )
    ),
  ];

  const projVert = new Map<number, string>();
  for (let i = 0; i < projectIds.length; i += 1000) {
    const chunk = projectIds.slice(i, i + 1000);
    const { data } = (await db.from("projects").select("id, vertical").in("id", chunk)) as {
      data: { id: number; vertical: string | null }[] | null;
    };
    for (const p of data || []) if (p.vertical) projVert.set(p.id, p.vertical);
  }

  const proVert = new Map<number, string>();
  for (let i = 0; i < proIds.length; i += 1000) {
    const chunk = proIds.slice(i, i + 1000);
    const { data } = (await db
      .from("pros")
      .select("id, categories(vertical)")
      .in("id", chunk)) as {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      data: { id: number; categories: any }[] | null;
    };
    for (const p of data || []) {
      const v = Array.isArray(p.categories) ? p.categories[0]?.vertical : p.categories?.vertical;
      if (v) proVert.set(p.id, v);
    }
  }

  const vertOf = (projectId: number | null, proId: number | null, metaV?: string): Vertical => {
    const raw =
      metaV ||
      (projectId != null ? projVert.get(projectId) : undefined) ||
      (proId != null ? proVert.get(proId) : undefined) ||
      null;
    return isAi(raw) ? "ai" : "btp";
  };

  const scMs = sinceCurrent.getTime();
  const classifiedEvents: ClassifiedEvent[] = events.map((ev) => ({
    ev,
    v: vertOf(ev.project_id, ev.pro_id, ev.metadata?.vertical),
    inCurrent: new Date(ev.created_at).getTime() >= scMs,
  }));
  const classifiedUnlocks: ClassifiedUnlock[] = unlocks.map((u) => ({
    u,
    v: vertOf(u.project_id, u.pro_id),
    inCurrent: new Date(u.paid_at || u.created_at || 0).getTime() >= scMs,
  }));

  return { events: classifiedEvents, unlocks: classifiedUnlocks, sinceCurrent };
}

// ============================================================
// API publique
// ============================================================

/** Tout l'analytics admin, séparé BTP / IA, avec comparaison période précédente. */
export const getAdminAnalytics = cache(async (days: number = 30): Promise<AdminAnalytics> => {
  const { events, unlocks, sinceCurrent } = await loadAndClassify(days);
  const buckets = makeBuckets(days, sinceCurrent);

  const bundleFor = (v: Vertical | "all"): VerticalBundle => {
    const evAll = v === "all" ? events : events.filter((c) => c.v === v);
    const uAll = v === "all" ? unlocks : unlocks.filter((c) => c.v === v);
    const evCur = evAll.filter((c) => c.inCurrent).map((c) => c.ev);
    const evPrev = evAll.filter((c) => !c.inCurrent).map((c) => c.ev);
    const uCur = uAll.filter((c) => c.inCurrent).map((c) => c.u);
    const uPrev = uAll.filter((c) => !c.inCurrent).map((c) => c.u);
    return computeBundle(evCur, evPrev, uCur, uPrev, buckets);
  };

  return {
    all: bundleFor("all"),
    btp: bundleFor("btp"),
    ai: bundleFor("ai"),
    periodDays: days,
    generatedAt: new Date().toISOString(),
  };
});

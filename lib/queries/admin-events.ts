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

/** Période demandée : nombre de jours glissants, ou "today" (jour calendaire en cours). */
export type PeriodInput = number | "today";

export type AdminAnalytics = VerticalSplit<VerticalBundle> & {
  periodDays: number;
  granularity: "hour" | "day" | "month";
  periodLabel: string;
  comparisonLabel: string;
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

/** Pagination robuste (contourne le cap PostgREST de 1000 lignes, leçon 30/04). */
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
// Fenêtres temporelles (période courante vs comparaison)
// ============================================================

type WindowSpec = {
  sinceCurrent: Date;
  currentEnd: Date;
  sincePrev: Date;
  prevEnd: Date;
  loadSince: Date;
  granularity: "hour" | "day" | "month";
  periodDays: number;
  periodLabel: string;
  comparisonLabel: string;
};

const DAY_MS = 864e5;

/** Construit les bornes de la fenêtre courante + la fenêtre de comparaison. */
function windowFor(period: PeriodInput): WindowSpec {
  const now = new Date();
  if (period === "today") {
    const start = new Date(now);
    start.setHours(0, 0, 0, 0); // aujourd'hui à minuit
    const elapsedMs = now.getTime() - start.getTime();
    const prevStart = new Date(start.getTime() - DAY_MS); // hier à minuit
    return {
      sinceCurrent: start,
      currentEnd: now,
      sincePrev: prevStart,
      prevEnd: new Date(prevStart.getTime() + elapsedMs), // hier, même tranche horaire
      loadSince: prevStart,
      granularity: "hour",
      periodDays: 0,
      periodLabel: "Aujourd'hui",
      comparisonLabel: "vs hier à la même heure",
    };
  }
  const days = period;
  const sinceCurrent = new Date(now.getTime() - days * DAY_MS);
  const sincePrev = new Date(now.getTime() - 2 * days * DAY_MS);
  return {
    sinceCurrent,
    currentEnd: now,
    sincePrev,
    prevEnd: sinceCurrent, // périodes contiguës
    loadSince: sincePrev,
    granularity: days > 120 ? "month" : "day",
    periodDays: days,
    periodLabel: days >= 365 ? "12 derniers mois" : `${days} derniers jours`,
    comparisonLabel: days >= 365 ? "vs 12 mois précédents" : `vs ${days} jours précédents`,
  };
}

// ============================================================
// Buckets temporels (axe continu, pas de trous)
// ============================================================

type Buckets = {
  keys: { key: string; label: string }[];
  keyOf: (d: Date) => string;
};

const p2 = (n: number) => String(n).padStart(2, "0");
const dayKey = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
const monthKey = (d: Date) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}`;
const hourKey = (d: Date) => `${dayKey(d)}-${p2(d.getHours())}`;

function makeBuckets(spec: WindowSpec): Buckets {
  const keys: { key: string; label: string }[] = [];

  if (spec.granularity === "hour") {
    const cur = new Date(spec.sinceCurrent);
    const stop = new Date(spec.currentEnd);
    while (cur <= stop) {
      keys.push({ key: hourKey(cur), label: `${p2(cur.getHours())}h` });
      cur.setHours(cur.getHours() + 1);
    }
    return { keys, keyOf: hourKey };
  }

  if (spec.granularity === "month") {
    const cur = new Date(spec.sinceCurrent.getFullYear(), spec.sinceCurrent.getMonth(), 1);
    const end = new Date();
    while (cur <= end) {
      keys.push({
        key: monthKey(cur),
        label: cur.toLocaleDateString("fr-FR", { month: "short", year: "2-digit" }),
      });
      cur.setMonth(cur.getMonth() + 1);
    }
    return { keys, keyOf: monthKey };
  }

  const cur = new Date(spec.sinceCurrent);
  cur.setHours(0, 0, 0, 0);
  const stop = new Date();
  stop.setHours(0, 0, 0, 0);
  while (cur <= stop) {
    keys.push({
      key: dayKey(cur),
      label: cur.toLocaleDateString("fr-FR", { day: "2-digit", month: "short" }),
    });
    cur.setDate(cur.getDate() + 1);
  }
  return { keys, keyOf: dayKey };
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

type ClassifiedEvent = { ev: RawEvent; v: Vertical; inCurrent: boolean; inPrevious: boolean };
type ClassifiedUnlock = { u: RawUnlock; v: Vertical; inCurrent: boolean; inPrevious: boolean };

async function loadAndClassify(spec: WindowSpec): Promise<{
  events: ClassifiedEvent[];
  unlocks: ClassifiedUnlock[];
}> {
  const db = getAdminServiceClient();
  const loadSinceIso = spec.loadSince.toISOString();

  // Charge la fenêtre courante + la fenêtre de comparaison (pour les deltas)
  const [events, unlocks] = await Promise.all([
    loadPaged<RawEvent>(
      "events",
      "event_name, created_at, project_id, pro_id, metadata",
      "created_at",
      loadSinceIso
    ),
    loadPaged<RawUnlock>(
      "lead_unlocks",
      "project_id, pro_id, amount_cents, paid_at, created_at",
      "paid_at",
      loadSinceIso
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

  const scMs = spec.sinceCurrent.getTime();
  const ceMs = spec.currentEnd.getTime();
  const spMs = spec.sincePrev.getTime();
  const peMs = spec.prevEnd.getTime();
  const classifiedEvents: ClassifiedEvent[] = events.map((ev) => {
    const t = new Date(ev.created_at).getTime();
    return {
      ev,
      v: vertOf(ev.project_id, ev.pro_id, ev.metadata?.vertical),
      inCurrent: t >= scMs && t <= ceMs,
      inPrevious: t >= spMs && t < peMs,
    };
  });
  const classifiedUnlocks: ClassifiedUnlock[] = unlocks.map((u) => {
    const t = new Date(u.paid_at || u.created_at || 0).getTime();
    return {
      u,
      v: vertOf(u.project_id, u.pro_id),
      inCurrent: t >= scMs && t <= ceMs,
      inPrevious: t >= spMs && t < peMs,
    };
  });

  return { events: classifiedEvents, unlocks: classifiedUnlocks };
}

// ============================================================
// API publique
// ============================================================

/** Tout l'analytics admin, séparé BTP / IA, avec comparaison période précédente. */
export const getAdminAnalytics = cache(
  async (period: PeriodInput = 30): Promise<AdminAnalytics> => {
    const spec = windowFor(period);
    const { events, unlocks } = await loadAndClassify(spec);
    const buckets = makeBuckets(spec);

    const bundleFor = (v: Vertical | "all"): VerticalBundle => {
      const evAll = v === "all" ? events : events.filter((c) => c.v === v);
      const uAll = v === "all" ? unlocks : unlocks.filter((c) => c.v === v);
      const evCur = evAll.filter((c) => c.inCurrent).map((c) => c.ev);
      const evPrev = evAll.filter((c) => c.inPrevious).map((c) => c.ev);
      const uCur = uAll.filter((c) => c.inCurrent).map((c) => c.u);
      const uPrev = uAll.filter((c) => c.inPrevious).map((c) => c.u);
      return computeBundle(evCur, evPrev, uCur, uPrev, buckets);
    };

    return {
      all: bundleFor("all"),
      btp: bundleFor("btp"),
      ai: bundleFor("ai"),
      periodDays: spec.periodDays,
      granularity: spec.granularity,
      periodLabel: spec.periodLabel,
      comparisonLabel: spec.comparisonLabel,
      generatedAt: new Date().toISOString(),
    };
  }
);

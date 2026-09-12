"use client";

import { useState, useCallback, useRef } from "react";
import AdminDatePicker, { PERIODS_WITH_TODAY } from "@/components/admin/forms/AdminDatePicker";
import AdminAreaChart from "@/components/admin/charts/AdminAreaChart";
import AdminKPICard from "@/components/admin/data-display/AdminKPICard";
import type { DatePeriod } from "@/lib/types/admin";
import type {
  AdminAnalytics,
  VerticalBundle,
  ActivityCount,
  Breakdown,
  Vertical,
} from "@/lib/queries/admin-events";

type Tab = "all" | Vertical;

// ── helpers ──────────────────────────────────────────────
function eur(cents: number): string {
  return (cents / 100).toLocaleString("fr-FR", {
    style: "currency",
    currency: "EUR",
    minimumFractionDigits: cents % 100 === 0 ? 0 : 2,
    maximumFractionDigits: 2,
  });
}
const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "btp", label: "BTP" },
  { key: "ai", label: "IA" },
];

// ── icônes (inline, sobres) ──────────────────────────────
const I = {
  euro: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 9.5a4 4 0 100 5M5 12h6" /><circle cx="12" cy="12" r="9" /></svg>
  ),
  unlock: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="10" width="16" height="10" rx="2" /><path d="M8 10V7a4 4 0 018 0" /></svg>
  ),
  gift: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><rect x="4" y="8" width="16" height="12" rx="1" /><path d="M12 8v12M4 12h16M12 8S9 4 7 6s2 2 5 2c3 0 7 0 5-2s-5 2-5 2z" /></svg>
  ),
  doc: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M14 3v5h5" /><path d="M6 3h8l5 5v11a2 2 0 01-2 2H6a2 2 0 01-2-2V5a2 2 0 012-2z" /></svg>
  ),
  funnel: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M3 4h18l-7 8v7l-4 2v-9L3 4z" /></svg>
  ),
  users: (
    <svg width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth={2} strokeLinecap="round" strokeLinejoin="round"><path d="M16 21v-2a4 4 0 00-8 0v2M12 11a4 4 0 100-8 4 4 0 000 8z" /></svg>
  ),
};

// ── carte section ────────────────────────────────────────
function Card({
  title,
  subtitle,
  right,
  children,
  loading,
}: {
  title: string;
  subtitle?: string;
  right?: React.ReactNode;
  children: React.ReactNode;
  loading?: boolean;
}) {
  return (
    <div
      className="rounded-xl p-5"
      style={{
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
        opacity: loading ? 0.55 : 1,
        transition: "opacity 200ms ease-out",
      }}
    >
      <div className="flex items-start justify-between mb-4 gap-3">
        <div>
          <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
            {title}
          </h2>
          {subtitle && (
            <p className="text-[11px] mt-0.5" style={{ color: "var(--admin-text-secondary)" }}>
              {subtitle}
            </p>
          )}
        </div>
        {right}
      </div>
      {children}
    </div>
  );
}

// Volumes indépendants : les barres comparent leur taille, sans taux entre lignes.
function ActivityBars({ steps }: { steps: ActivityCount[] }) {
  const max = Math.max(1, ...steps.map((step) => step.count));
  if (steps.every((s) => s.count === 0)) return <Empty message="Aucune donnée sur la période" />;
  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => {
        const pct = max > 0 ? Math.round((step.count / max) * 100) : 0;
        return (
          <div key={step.label}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium" style={{ color: "var(--admin-text)" }}>
                {step.label}
                {step.hint && (
                  <span className="ml-1.5 text-[10px]" style={{ color: "var(--admin-text-tertiary)" }}>
                    ({step.hint})
                  </span>
                )}
              </span>
              <div className="flex items-center gap-2">
                <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>
                  {step.count.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>
            <div className="h-7 rounded-md overflow-hidden" style={{ backgroundColor: "var(--admin-hover)" }}>
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${Math.max(pct, step.count > 0 ? 3 : 0)}%`, backgroundColor: "var(--admin-accent)", opacity: Math.max(0.4, 1 - i * 0.08) }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

// ── barres classées (métiers, villes, urgence, events) ───
function RankedBars({ items, formatValue }: { items: Breakdown[]; formatValue?: (n: number) => string }) {
  if (items.length === 0) return <Empty message="Aucune donnée sur la période" />;
  const max = items[0]?.count || 1;
  return (
    <div className="space-y-2">
      {items.map((it) => {
        const pct = Math.round((it.count / max) * 100);
        return (
          <div key={it.name} className="flex items-center gap-3">
            <span
              className="text-[11px] truncate shrink-0"
              style={{ color: "var(--admin-text-secondary)", width: "38%" }}
              title={it.name}
            >
              {it.name}
            </span>
            <div className="flex-1 h-5 rounded overflow-hidden" style={{ backgroundColor: "var(--admin-hover)" }}>
              <div
                className="h-full rounded transition-all duration-500"
                style={{ width: `${Math.max(pct, 4)}%`, backgroundColor: "var(--admin-accent)" }}
              />
            </div>
            <span className="text-[11px] font-semibold tabular-nums shrink-0" style={{ color: "var(--admin-text)", width: 44, textAlign: "right" }}>
              {formatValue ? formatValue(it.count) : it.count.toLocaleString("fr-FR")}
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Empty({ message }: { message: string }) {
  return (
    <div className="h-[120px] flex items-center justify-center text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
      {message}
    </div>
  );
}

// ── page ─────────────────────────────────────────────────
export default function AnalyticsClient({
  initialAnalytics,
  initialPeriod,
}: {
  initialAnalytics: AdminAnalytics;
  initialPeriod: DatePeriod;
}) {
  const [period, setPeriod] = useState<DatePeriod>(initialPeriod);
  const [tab, setTab] = useState<Tab>("all");
  const [analytics, setAnalytics] = useState<AdminAnalytics>(initialAnalytics);
  const [loading, setLoading] = useState(false);
  const [loadError, setLoadError] = useState<string | null>(null);
  const latestRequest = useRef(0);

  const fetchData = useCallback(async (newPeriod: DatePeriod) => {
    const requestId = ++latestRequest.current;
    setLoading(true);
    setLoadError(null);
    try {
      const res = await fetch(`/api/admin/analytics/kpis?period=${newPeriod}`);
      if (!res.ok) throw new Error("analytics_unavailable");
      const data = (await res.json()) as AdminAnalytics;
      if (requestId !== latestRequest.current) return;
      setAnalytics(data);
      setPeriod(newPeriod);
    } catch {
      if (requestId === latestRequest.current) {
        setLoadError("Chargement impossible. Les chiffres de la dernière période chargée restent affichés.");
      }
    } finally {
      if (requestId === latestRequest.current) setLoading(false);
    }
  }, []);

  const handlePeriodChange = (newPeriod: DatePeriod) => {
    fetchData(newPeriod);
  };

  const b: VerticalBundle = analytics[tab];
  const k = b.kpis;

  const revSpark = b.revenueByDay.map((r) => r.revenue);
  const unlockSpark = b.revenueByDay.map((r) => r.unlocks);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
            Analytics
          </h1>
          <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
            {b.totalEvents.toLocaleString("fr-FR")} événements · {analytics.periodLabel} · {analytics.comparisonLabel}
          </p>
        </div>
        <AdminDatePicker value={period} onChange={handlePeriodChange} periods={PERIODS_WITH_TODAY} />
      </div>

      {loadError && (
        <p role="alert" className="text-sm mb-4" style={{ color: "var(--admin-danger)" }}>{loadError}</p>
      )}

      {/* Tabs vertical */}
      <div
        className="inline-flex items-center gap-1 p-1 rounded-lg mb-5"
        style={{ backgroundColor: "var(--admin-hover)", border: "1px solid var(--admin-border)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          return (
            <button
              key={t.key}
              onClick={() => setTab(t.key)}
              className="px-3 py-1.5 rounded-md text-xs font-semibold transition-all duration-150"
              style={{
                backgroundColor: active ? "var(--admin-card)" : "transparent",
                color: active ? "var(--admin-text)" : "var(--admin-text-secondary)",
                boxShadow: active ? "0 1px 2px rgba(0,0,0,0.06)" : "none",
              }}
            >
              {t.label}
              <span className="ml-1.5 tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
                {analytics[t.key].totalEvents.toLocaleString("fr-FR")}
              </span>
            </button>
          );
        })}
      </div>

      <div style={{ opacity: loading ? 0.55 : 1, transition: "opacity 200ms ease-out" }}>
        {/* KPI grid */}
        <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-6 gap-3 mb-4">
          <AdminKPICard
            title="Revenu"
            value={eur(k.revenueCents.current)}
            delta={k.revenueCents.pct ?? undefined}
            sparklineData={revSpark}
            icon={I.euro}
          />
          <AdminKPICard
            title="Contacts payés"
            value={k.unlocksPaid.current}
            delta={k.unlocksPaid.pct ?? undefined}
            icon={I.unlock}
          />
          <AdminKPICard
            title="Contacts offerts"
            value={k.unlocksFree.current}
            delta={k.unlocksFree.pct ?? undefined}
            sparklineData={unlockSpark}
            icon={I.gift}
          />
          <AdminKPICard
            title="Projets valides"
            value={k.projectsValid.current}
            delta={k.projectsValid.pct ?? undefined}
            icon={I.doc}
          />
          <AdminKPICard
            title="Validations BTP"
            value={tab === "ai" ? "—" : k.claimsCompleted.current}
            delta={tab === "ai" ? undefined : k.claimsCompleted.pct ?? undefined}
            icon={I.funnel}
          />
          <AdminKPICard
            title="Pros actifs BTP"
            value={tab === "ai" ? "—" : k.activePros.current}
            delta={tab === "ai" ? undefined : k.activePros.pct ?? undefined}
            icon={I.users}
          />
        </div>

        {/* Revenu + entonnoir cash */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <div className="lg:col-span-2">
            <Card
              title="Revenu des déblocages"
              subtitle="Contacts payés 9,90 € · les offerts (2 premiers) ne comptent pas ici"
              right={
                <span className="text-sm font-semibold tabular-nums" style={{ color: "var(--admin-accent)" }}>
                  {eur(k.revenueCents.current)}
                </span>
              }
            >
              {revSpark.every((v) => v === 0) ? (
                <Empty message="Aucun paiement sur la période" />
              ) : (
                <AdminAreaChart
                  data={b.revenueByDay as unknown as Record<string, unknown>[]}
                  dataKey="revenue"
                  xKey="date"
                  color="var(--admin-accent)"
                  height={220}
                  formatter={(v) => `${v.toLocaleString("fr-FR")} €`}
                />
              )}
            </Card>
          </div>
          <Card title="Activité commerciale" subtitle="Volumes enregistrés sur la période">
            <ActivityBars steps={b.businessActivity} />
            <p className="text-[11px] mt-3 pt-3 tabular-nums" style={{ color: "var(--admin-text-secondary)", borderTop: "1px solid var(--admin-border)" }}>
              Un projet peut être débloqué par plusieurs pros, y compris après sa période de dépôt.
            </p>
          </Card>
        </div>

        {/* Activité + réclamations */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
          <Card title={analytics.granularity === "hour" ? "Activité par heure" : "Activité par jour"} subtitle="Tous événements confondus">
            {b.eventsByDay.every((d) => d.count === 0) ? (
              <Empty message="Aucun événement sur la période" />
            ) : (
              <AdminAreaChart
                data={b.eventsByDay as unknown as Record<string, unknown>[]}
                dataKey="count"
                xKey="date"
                color="var(--admin-accent)"
                height={220}
                formatter={(v) => `${v.toLocaleString("fr-FR")} événements`}
              />
            )}
          </Card>
          <Card title="Réclamations de fiche BTP" subtitle="Démarrages et validations enregistrés sur la période">
            {tab === "ai" ? <Empty message="Cette mesure couvre les fiches BTP." /> : (
              <>
                <ActivityBars steps={b.claimActivity} />
                <p className="text-[11px] mt-3" style={{ color: "var(--admin-text-secondary)" }}>
                  Une validation peut correspondre à une demande commencée avant cette période.
                </p>
              </>
            )}
          </Card>
        </div>

        <div className="mb-4">
          <Card title="Formulaires BTP observés" subtitle="Visiteurs ayant accepté les cookies de mesure">
            {tab === "ai" ? <Empty message="Cette mesure couvre les formulaires BTP." /> : (
              <>
                <ActivityBars steps={b.formActivity} />
                <p className="text-[11px] mt-3" style={{ color: "var(--admin-text-secondary)" }}>
                  Chaque affichage d’écran compte, retours inclus. Les envois de projets sont comptés séparément
                  pour tous les visiteurs. Ces volumes ne suivent pas les mêmes personnes d’une étape à l’autre.
                </p>
              </>
            )}
          </Card>
        </div>

        {/* Répartitions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card title="Top métiers demandés" subtitle="Dépôts BTP enregistrés par catégorie">
            <RankedBars items={b.byCategory} />
          </Card>
          <Card title="Top villes" subtitle="Dépôts BTP enregistrés par ville">
            <RankedBars items={b.byCity} />
          </Card>
          <Card title="Urgence des projets" subtitle="Dépôts BTP enregistrés">
            <RankedBars items={b.byUrgency} />
          </Card>
        </div>

        {/* Top events */}
        <Card title="Top 10 événements" subtitle="Les actions les plus fréquentes sur la période">
          <RankedBars items={b.topEvents.map((e) => ({ name: e.name, count: e.count }))} />
        </Card>

        <p className="text-[11px] mt-5" style={{ color: "var(--admin-text-tertiary)" }}>
          Projets valides et déblocages : BTP et freelances. Activité des pros et formulaires : événements BTP
          enregistrés. Comptes de test identifiés exclus des événements et des déblocages. Les données anonymes
          sans lien avec un compte restent comptées.
        </p>
      </div>
    </div>
  );
}

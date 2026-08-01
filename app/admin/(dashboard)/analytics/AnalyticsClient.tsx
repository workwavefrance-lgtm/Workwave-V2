"use client";

import { useState, useCallback } from "react";
import AdminDatePicker, { PERIODS_WITH_TODAY } from "@/components/admin/forms/AdminDatePicker";
import AdminAreaChart from "@/components/admin/charts/AdminAreaChart";
import AdminKPICard from "@/components/admin/data-display/AdminKPICard";
import type { DatePeriod } from "@/lib/types/admin";
import type {
  AdminAnalytics,
  VerticalBundle,
  FunnelStep,
  Breakdown,
  Delta,
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
function rate(num: number, den: number): number {
  return den > 0 ? Math.round((num / den) * 100) : 0;
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

// ── entonnoir ────────────────────────────────────────────
function FunnelViz({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.count || 1;
  if (steps.every((s) => s.count === 0)) return <Empty message="Aucune donnée sur la période" />;
  return (
    <div className="space-y-2.5">
      {steps.map((step, i) => {
        const pct = max > 0 ? Math.round((step.count / max) * 100) : 0;
        const convPct =
          i > 0 && steps[i - 1].count > 0
            ? Math.round((step.count / steps[i - 1].count) * 100)
            : null;
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
                {convPct !== null && (
                  <span
                    className="text-[10px] tabular-nums px-1 rounded"
                    style={{
                      color: convPct >= 50 ? "#10B981" : convPct >= 20 ? "var(--admin-text-tertiary)" : "#EF4444",
                      backgroundColor: "var(--admin-hover)",
                    }}
                  >
                    {convPct}%
                  </span>
                )}
                <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>
                  {step.count.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>
            <div className="h-7 rounded-md overflow-hidden" style={{ backgroundColor: "var(--admin-hover)" }}>
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${Math.max(pct, step.count > 0 ? 3 : 0)}%`, backgroundColor: "var(--admin-accent)", opacity: 1 - i * 0.13 }}
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

  const fetchData = useCallback(async (newPeriod: DatePeriod) => {
    setLoading(true);
    try {
      const res = await fetch(`/api/admin/analytics/kpis?period=${newPeriod}`);
      if (res.ok) setAnalytics((await res.json()) as AdminAnalytics);
    } catch {
      // fail silently — stale data stays visible
    } finally {
      setLoading(false);
    }
  }, []);

  const handlePeriodChange = (newPeriod: DatePeriod) => {
    setPeriod(newPeriod);
    fetchData(newPeriod);
  };

  const b: VerticalBundle = analytics[tab];
  const k = b.kpis;

  // dérivations d'affichage (deltas)
  const formRateCur = rate(k.projectsSubmitted.current, k.formStarted.current);
  const formRatePrev = rate(k.projectsSubmitted.previous, k.formStarted.previous);
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
            title="Projets déposés"
            value={k.projectsSubmitted.current}
            delta={k.projectsSubmitted.pct ?? undefined}
            icon={I.doc}
          />
          <AdminKPICard
            title="Complétion formulaire"
            value={`${formRateCur}%`}
            delta={formRateCur - formRatePrev}
            deltaSuffix=" pts"
            icon={I.funnel}
          />
          <AdminKPICard
            title="Pros actifs"
            value={k.activePros.current}
            delta={k.activePros.pct ?? undefined}
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
          <Card title="Entonnoir de conversion" subtitle="Du formulaire au contact débloqué">
            <FunnelViz steps={b.conversionFunnel} />
            <p className="text-[11px] mt-3 pt-3 tabular-nums" style={{ color: "var(--admin-text-secondary)", borderTop: "1px solid var(--admin-border)" }}>
              Taux global ouvert → débloqué :{" "}
              <span className="font-semibold" style={{ color: "var(--admin-text)" }}>
                {rate(b.conversionFunnel[2]?.count || 0, b.conversionFunnel[0]?.count || 0)}%
              </span>
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
          <Card title="Réclamations de fiche" subtitle="Les pros qui prennent la main sur leur fiche">
            <FunnelViz steps={b.claimFunnel} />
            <p className="text-[11px] mt-3 pt-3 tabular-nums" style={{ color: "var(--admin-text-secondary)", borderTop: "1px solid var(--admin-border)" }}>
              Taux de validation :{" "}
              <span className="font-semibold" style={{ color: "var(--admin-text)" }}>
                {rate(k.claimsCompleted.current, k.claimsStarted.current)}%
              </span>{" "}
              · {k.claimsCompleted.current} validée(s) sur {k.claimsStarted.current} démarrée(s)
            </p>
          </Card>
        </div>

        {/* Répartitions */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 mb-4">
          <Card title="Top métiers demandés" subtitle="Projets soumis par catégorie">
            <RankedBars items={b.byCategory} />
          </Card>
          <Card title="Top villes" subtitle="Projets soumis par ville">
            <RankedBars items={b.byCity} />
          </Card>
          <Card title="Urgence des projets" subtitle="Répartition des demandes">
            <RankedBars items={b.byUrgency} />
          </Card>
        </div>

        {/* Top events */}
        <Card title="Top 10 événements" subtitle="Les actions les plus fréquentes sur la période">
          <RankedBars items={b.topEvents.map((e) => ({ name: e.name, count: e.count }))} />
        </Card>

        <p className="text-[11px] mt-5" style={{ color: "var(--admin-text-tertiary)" }}>
          Données 100 % issues de la base Workwave (events + lead_unlocks). Les vues de page sont dans GA4.
        </p>
      </div>
    </div>
  );
}

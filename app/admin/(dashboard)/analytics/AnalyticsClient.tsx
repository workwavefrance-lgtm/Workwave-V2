"use client";

import { useState, useCallback } from "react";
import AdminDatePicker from "@/components/admin/forms/AdminDatePicker";
import AdminAreaChart from "@/components/admin/charts/AdminAreaChart";
import AdminBarChart from "@/components/admin/charts/AdminBarChart";
import type { DatePeriod } from "@/lib/types/admin";
import type { AdminAnalytics, FunnelStep, Vertical } from "@/lib/queries/admin-events";

type Tab = "all" | Vertical;

function periodToDays(period: DatePeriod): number {
  if (period === "7d") return 7;
  if (period === "30d") return 30;
  if (period === "90d") return 90;
  if (period === "12m") return 365;
  return 30;
}

function FunnelViz({ steps }: { steps: FunnelStep[] }) {
  const max = steps[0]?.count || 1;
  return (
    <div className="space-y-2">
      {steps.map((step, i) => {
        const pct = max > 0 ? Math.round((step.count / max) * 100) : 0;
        const convPct =
          i > 0 && steps[i - 1].count > 0 ? Math.round((step.count / steps[i - 1].count) * 100) : null;
        return (
          <div key={step.event}>
            <div className="flex items-center justify-between mb-1">
              <span className="text-[11px] font-medium" style={{ color: "var(--admin-text)" }}>
                {step.label}
              </span>
              <div className="flex items-center gap-2">
                {convPct !== null && (
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
                    {convPct}% du précédent
                  </span>
                )}
                <span className="text-xs font-semibold tabular-nums" style={{ color: "var(--admin-text)" }}>
                  {step.count.toLocaleString("fr-FR")}
                </span>
              </div>
            </div>
            <div className="h-8 rounded-md overflow-hidden" style={{ backgroundColor: "var(--admin-hover)" }}>
              <div
                className="h-full rounded-md transition-all duration-500"
                style={{ width: `${pct}%`, backgroundColor: "var(--admin-accent)", opacity: 1 - i * 0.15 }}
              />
            </div>
          </div>
        );
      })}
    </div>
  );
}

const TABS: { key: Tab; label: string }[] = [
  { key: "all", label: "Tous" },
  { key: "btp", label: "BTP" },
  { key: "ai", label: "IA" },
];

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

  // Données de l'onglet vertical sélectionné
  const eventsByDay = analytics.eventsByDay[tab];
  const topEvents = analytics.topEvents[tab];
  const funnel = analytics.funnel[tab];
  const totalEvents = analytics.totals[tab];
  const days = periodToDays(period);

  return (
    <div>
      {/* Header */}
      <div className="flex items-start justify-between mb-4 gap-3 flex-wrap">
        <div>
          <h1 className="text-xl font-semibold mb-1" style={{ color: "var(--admin-text)" }}>
            Analytics
          </h1>
          <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
            {totalEvents.toLocaleString("fr-FR")} événements sur les {days} derniers jours
          </p>
        </div>
        <AdminDatePicker value={period} onChange={handlePeriodChange} />
      </div>

      {/* Toggle vertical BTP / IA / Tous */}
      <div
        className="inline-flex items-center gap-1 p-1 rounded-lg mb-5"
        style={{ backgroundColor: "var(--admin-hover)", border: "1px solid var(--admin-border)" }}
      >
        {TABS.map((t) => {
          const active = tab === t.key;
          const count = analytics.totals[t.key];
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
                {count.toLocaleString("fr-FR")}
              </span>
            </button>
          );
        })}
      </div>

      {/* Charts row */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-4">
        <div
          className="rounded-xl p-5"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 200ms ease-out",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
              Événements par jour
            </h2>
            <span className="text-[11px] tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
              total : {totalEvents.toLocaleString("fr-FR")}
            </span>
          </div>
          {eventsByDay.length === 0 ? (
            <EmptyChart message="Aucun événement sur la période" />
          ) : (
            <AdminAreaChart
              data={eventsByDay as unknown as Record<string, unknown>[]}
              dataKey="count"
              xKey="date"
              color="var(--admin-accent)"
              height={240}
              formatter={(v) => `${v.toLocaleString("fr-FR")} événements`}
            />
          )}
        </div>

        <div
          className="rounded-xl p-5"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
            opacity: loading ? 0.6 : 1,
            transition: "opacity 200ms ease-out",
          }}
        >
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
              Top 10 événements
            </h2>
          </div>
          {topEvents.length === 0 ? (
            <EmptyChart message="Aucun événement sur la période" />
          ) : (
            <AdminBarChart
              data={topEvents as unknown as Record<string, unknown>[]}
              dataKey="count"
              xKey="name"
              color="var(--admin-accent)"
              height={240}
              formatter={(v) => `${v.toLocaleString("fr-FR")} fois`}
            />
          )}
        </div>
      </div>

      {/* Funnel */}
      <div
        className="rounded-xl p-5"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
          opacity: loading ? 0.6 : 1,
          transition: "opacity 200ms ease-out",
        }}
      >
        <div className="mb-4">
          <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>
            Entonnoir de conversion
          </h2>
          <p className="text-[11px] mt-0.5" style={{ color: "var(--admin-text-secondary)" }}>
            Du formulaire démarré au lead contacté · les vues de page sont dans GA4
          </p>
        </div>
        <FunnelViz steps={funnel} />
      </div>
    </div>
  );
}

function EmptyChart({ message }: { message: string }) {
  return (
    <div
      className="h-[240px] flex flex-col items-center justify-center gap-2"
      style={{ color: "var(--admin-text-tertiary)" }}
    >
      <svg className="w-8 h-8" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1}>
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z"
        />
      </svg>
      <span className="text-xs">{message}</span>
    </div>
  );
}

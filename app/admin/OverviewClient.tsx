"use client";

import AdminKPICard from "@/components/admin/data-display/AdminKPICard";
import type { AdminKPIs, RecentActivity } from "@/lib/queries/admin-kpis";

function delta(current: number, previous: number): number {
  if (previous === 0) return current > 0 ? 100 : 0;
  return ((current - previous) / previous) * 100;
}

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

const TYPE_ICONS: Record<string, { bg: string; color: string; label: string }> = {
  project: { bg: "rgba(59, 130, 246, 0.1)", color: "#3B82F6", label: "Projet" },
  claim: { bg: "rgba(16, 185, 129, 0.1)", color: "#10B981", label: "Réclamation" },
  subscription: { bg: "rgba(245, 158, 11, 0.1)", color: "#F59E0B", label: "Abonnement" },
};

export default function OverviewClient({
  kpis,
  activity,
  sparkline,
}: {
  kpis: AdminKPIs;
  activity: RecentActivity[];
  sparkline: number[];
}) {
  return (
    <div>
      <h1
        className="text-xl font-semibold mb-1"
        style={{ color: "var(--admin-text)" }}
      >
        Overview
      </h1>
      <p
        className="text-xs mb-6"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        Vue d&apos;ensemble de la plateforme
      </p>

      {/* KPI Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
        <AdminKPICard
          title="Pros actifs"
          value={kpis.activePros}
          delta={delta(kpis.activePros, kpis.activeProsLastMonth)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
            </svg>
          }
        />
        <AdminKPICard
          title="Projets ce mois"
          value={kpis.projectsThisMonth}
          delta={delta(kpis.projectsThisMonth, kpis.projectsLastMonth)}
          sparklineData={sparkline}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 14.25v-2.625a3.375 3.375 0 00-3.375-3.375h-1.5A1.125 1.125 0 0113.5 7.125v-1.5a3.375 3.375 0 00-3.375-3.375H8.25m0 12.75h7.5m-7.5 3H12M10.5 2.25H5.625c-.621 0-1.125.504-1.125 1.125v17.25c0 .621.504 1.125 1.125 1.125h12.75c.621 0 1.125-.504 1.125-1.125V11.25a9 9 0 00-9-9z" />
            </svg>
          }
        />
        <AdminKPICard
          title="Leads envoyés"
          value={kpis.leadsSent}
          delta={delta(kpis.leadsSent, kpis.leadsSentLastMonth)}
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7.5 8.25h9m-9 3H12m-9.75 1.51c0 1.6 1.123 2.994 2.707 3.227 1.087.16 2.185.283 3.293.369V21l4.076-4.076a1.526 1.526 0 011.037-.443 48.282 48.282 0 005.68-.494c1.584-.233 2.707-1.626 2.707-3.228V6.741c0-1.602-1.123-2.995-2.707-3.228A48.394 48.394 0 0012 3c-2.392 0-4.744.175-7.043.513C3.373 3.746 2.25 5.14 2.25 6.741v6.018z" />
            </svg>
          }
        />
        <AdminKPICard
          title="Taux conversion"
          value={`${kpis.conversionRate}%`}
          delta={kpis.conversionRate - kpis.conversionRateLastMonth}
          deltaSuffix=" pts"
          icon={
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M3 13.125C3 12.504 3.504 12 4.125 12h2.25c.621 0 1.125.504 1.125 1.125v6.75C7.5 20.496 6.996 21 6.375 21h-2.25A1.125 1.125 0 013 19.875v-6.75zM9.75 8.625c0-.621.504-1.125 1.125-1.125h2.25c.621 0 1.125.504 1.125 1.125v11.25c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V8.625zM16.5 4.125c0-.621.504-1.125 1.125-1.125h2.25C20.496 3 21 3.504 21 4.125v15.75c0 .621-.504 1.125-1.125 1.125h-2.25a1.125 1.125 0 01-1.125-1.125V4.125z" />
            </svg>
          }
        />
      </div>

      {/* Recent Activity */}
      <div
        className="rounded-xl"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--admin-text)" }}
          >
            Activité récente
          </h2>
        </div>

        {activity.length === 0 ? (
          <div className="px-4 py-12 text-center">
            <p className="text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
              Aucune activité récente
            </p>
          </div>
        ) : (
          <div>
            {activity.map((item) => {
              const typeInfo = TYPE_ICONS[item.type] || TYPE_ICONS.project;
              return (
                <div
                  key={`${item.type}-${item.id}`}
                  className="flex items-start gap-3 px-4 py-3 transition-colors duration-150"
                  style={{ borderBottom: "1px solid var(--admin-border)" }}
                  onMouseEnter={(e) =>
                    (e.currentTarget.style.backgroundColor = "var(--admin-hover)")
                  }
                  onMouseLeave={(e) =>
                    (e.currentTarget.style.backgroundColor = "transparent")
                  }
                >
                  <div
                    className="w-8 h-8 rounded-full flex items-center justify-center shrink-0 mt-0.5"
                    style={{ backgroundColor: typeInfo.bg }}
                  >
                    <span
                      className="text-[10px] font-semibold"
                      style={{ color: typeInfo.color }}
                    >
                      {typeInfo.label.charAt(0)}
                    </span>
                  </div>
                  <div className="flex-1 min-w-0">
                    <p
                      className="text-xs font-medium truncate"
                      style={{ color: "var(--admin-text)" }}
                    >
                      {item.title}
                    </p>
                    <p
                      className="text-[11px] truncate mt-0.5"
                      style={{ color: "var(--admin-text-tertiary)" }}
                    >
                      {item.description}
                    </p>
                  </div>
                  <span
                    className="text-[10px] shrink-0 tabular-nums"
                    style={{ color: "var(--admin-text-tertiary)" }}
                  >
                    {timeAgo(item.created_at)}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}

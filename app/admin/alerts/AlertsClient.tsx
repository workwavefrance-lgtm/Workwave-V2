"use client";

import type { Alert } from "@/lib/queries/admin-alerts";

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

function CriticalIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
      />
    </svg>
  );
}

function WarningIcon() {
  return (
    <svg
      className="w-5 h-5"
      fill="none"
      viewBox="0 0 24 24"
      stroke="currentColor"
      strokeWidth={1.5}
    >
      <path
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M14.857 17.082a23.848 23.848 0 005.454-1.31A8.967 8.967 0 0118 9.75v-.7V9A6 6 0 006 9v.75a8.967 8.967 0 01-2.312 6.022c1.733.64 3.56 1.085 5.455 1.31m5.714 0a24.255 24.255 0 01-5.714 0m5.714 0a3 3 0 11-5.714 0"
      />
    </svg>
  );
}

const SEVERITY_CONFIG = {
  critical: {
    borderColor: "var(--admin-danger)",
    iconBg: "rgba(239, 68, 68, 0.1)",
    iconColor: "var(--admin-danger)",
    badgeBg: "rgba(239, 68, 68, 0.1)",
    badgeColor: "var(--admin-danger)",
    label: "Critique",
    Icon: CriticalIcon,
  },
  warning: {
    borderColor: "var(--admin-warning)",
    iconBg: "rgba(245, 158, 11, 0.1)",
    iconColor: "var(--admin-warning)",
    badgeBg: "rgba(245, 158, 11, 0.1)",
    badgeColor: "var(--admin-warning)",
    label: "Avertissement",
    Icon: WarningIcon,
  },
} as const;

function AlertCard({ alert }: { alert: Alert }) {
  const cfg = SEVERITY_CONFIG[alert.severity];
  const { Icon } = cfg;

  return (
    <div
      className="rounded-xl flex items-start gap-4 p-5"
      style={{
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
        borderLeft: `3px solid ${cfg.borderColor}`,
      }}
    >
      <div
        className="w-10 h-10 rounded-full flex items-center justify-center shrink-0"
        style={{
          backgroundColor: cfg.iconBg,
          color: cfg.iconColor,
        }}
      >
        <Icon />
      </div>

      <div className="flex-1 min-w-0">
        <div className="flex items-start justify-between gap-3">
          <p
            className="text-sm font-semibold leading-snug"
            style={{ color: "var(--admin-text)" }}
          >
            {alert.title}
          </p>
          <span
            className="shrink-0 text-[10px] font-semibold px-2 py-0.5 rounded-full uppercase tracking-wide"
            style={{
              backgroundColor: cfg.badgeBg,
              color: cfg.badgeColor,
            }}
          >
            {cfg.label}
          </span>
        </div>
        <p
          className="text-xs mt-1 leading-relaxed"
          style={{ color: "var(--admin-text-secondary)" }}
        >
          {alert.description}
        </p>
        <p
          className="text-[10px] mt-2 tabular-nums"
          style={{ color: "var(--admin-text-tertiary)" }}
        >
          {timeAgo(alert.detected_at)}
        </p>
      </div>
    </div>
  );
}

export default function AlertsClient({ alerts }: { alerts: Alert[] }) {
  return (
    <div>
      <h1
        className="text-xl font-semibold mb-1"
        style={{ color: "var(--admin-text)" }}
      >
        Alertes
      </h1>
      <p
        className="text-xs mb-6"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        {alerts.length === 0
          ? "Tout est nominal"
          : `${alerts.length} anomalie${alerts.length > 1 ? "s" : ""} détectée${alerts.length > 1 ? "s" : ""}`}
      </p>

      {alerts.length === 0 ? (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-20 gap-4"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <div
            className="w-14 h-14 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "rgba(16, 185, 129, 0.1)" }}
          >
            <svg
              className="w-7 h-7"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              style={{ color: "var(--admin-accent)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M4.5 12.75l6 6 9-13.5"
              />
            </svg>
          </div>
          <div className="text-center">
            <p
              className="text-sm font-semibold"
              style={{ color: "var(--admin-text)" }}
            >
              Aucune anomalie détectée
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--admin-text-secondary)" }}
            >
              La plateforme fonctionne normalement
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          {alerts.map((alert) => (
            <AlertCard key={alert.id} alert={alert} />
          ))}
        </div>
      )}
    </div>
  );
}

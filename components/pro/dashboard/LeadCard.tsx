"use client";

import Link from "next/link";
import { timeAgo } from "@/lib/utils/date";
import type { LeadWithProject } from "@/lib/queries/leads";

const STATUS_BADGES: Record<string, { label: string; className: string }> = {
  sent: {
    label: "Nouveau",
    className: "bg-[var(--accent)]/10 text-[var(--accent)]",
  },
  opened: {
    label: "Vu",
    className: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
  },
  contacted: {
    label: "Contacté",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  not_relevant: {
    label: "Non pertinent",
    className: "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]",
  },
  expired: {
    label: "Expiré",
    className: "bg-[var(--bg-tertiary)] text-[var(--text-tertiary)]",
  },
};

const URGENCY_LABELS: Record<string, string> = {
  today: "Aujourd\u2019hui",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  not_urgent: "Pas urgent",
};

const BUDGET_LABELS: Record<string, string> = {
  lt500: "< 500 \u20ac",
  "500_2000": "500 \u2013 2 000 \u20ac",
  "2000_5000": "2 000 \u2013 5 000 \u20ac",
  "5000_15000": "5 000 \u2013 15 000 \u20ac",
  gt15000: "> 15 000 \u20ac",
  unknown: "Non précisé",
};

export default function LeadCard({ lead }: { lead: LeadWithProject }) {
  const badge = STATUS_BADGES[lead.status] || STATUS_BADGES.sent;
  const project = lead.project;

  return (
    <Link
      href={`/pro/dashboard/leads/${lead.id}`}
      className="block bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5 hover:border-[var(--accent)] transition-all duration-250"
    >
      <div className="flex items-start justify-between gap-3 mb-3">
        <div className="flex items-center gap-3 min-w-0">
          <div className="w-10 h-10 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
            <span className="text-sm font-semibold text-[var(--text-secondary)]">
              {project.first_name.charAt(0).toUpperCase()}
            </span>
          </div>
          <div className="min-w-0">
            <p className="text-sm font-semibold text-[var(--text-primary)] truncate">
              {project.first_name}
            </p>
            <p className="text-xs text-[var(--text-tertiary)]">
              {project.city?.name || "Ville non précisée"} —{" "}
              {project.category.name}
            </p>
          </div>
        </div>
        <span
          className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badge.className}`}
        >
          {badge.label}
        </span>
      </div>

      <p className="text-sm text-[var(--text-secondary)] line-clamp-2 mb-3">
        {project.description}
      </p>

      <div className="flex items-center gap-4 text-xs text-[var(--text-tertiary)]">
        <span>{URGENCY_LABELS[project.urgency] || project.urgency}</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
        <span>{BUDGET_LABELS[project.budget] || project.budget}</span>
        <span className="w-1 h-1 rounded-full bg-[var(--text-tertiary)]" />
        <span>{timeAgo(lead.sent_at)}</span>
      </div>
    </Link>
  );
}

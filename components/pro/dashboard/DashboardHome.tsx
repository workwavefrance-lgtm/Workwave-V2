"use client";

import Link from "next/link";
import { useDashboard } from "@/components/pro/dashboard/DashboardProvider";
import CountUp from "@/components/ui/CountUp";
import { timeAgo } from "@/lib/utils/date";
import type { LeadStats, LeadWithProject } from "@/lib/queries/leads";

type Props = {
  stats: LeadStats;
  recentLeads: LeadWithProject[];
};

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
};

const SUBSCRIPTION_LABELS: Record<
  string,
  { label: string; className: string }
> = {
  none: {
    label: "Gratuit",
    className: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
  },
  free: {
    label: "Gratuit",
    className: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
  },
  trialing: {
    label: "Essai gratuit",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
  },
  active: {
    label: "Abonné",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
  },
  past_due: {
    label: "Paiement en attente",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
  },
  canceled: {
    label: "Résilié",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
  suspended: {
    label: "Suspendu",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

function DeltaIndicator({
  current,
  previous,
}: {
  current: number;
  previous: number;
}) {
  if (previous === 0 && current === 0) return null;
  if (previous === 0)
    return (
      <span className="text-xs font-medium text-green-500">Nouveau</span>
    );

  const delta = current - previous;
  if (delta === 0) return <span className="text-xs text-[var(--text-tertiary)]">=</span>;

  const percent = Math.round((Math.abs(delta) / previous) * 100);
  const isPositive = delta > 0;

  return (
    <span
      className={`text-xs font-medium ${isPositive ? "text-green-500" : "text-red-500"}`}
    >
      {isPositive ? "↑" : "↓"} {percent}%
    </span>
  );
}

export default function DashboardHome({ stats, recentLeads }: Props) {
  const { pro } = useDashboard();

  const today = new Date().toLocaleDateString("fr-FR", {
    weekday: "long",
    day: "numeric",
    month: "long",
  });

  const subInfo =
    SUBSCRIPTION_LABELS[pro.subscription_status] || SUBSCRIPTION_LABELS.none;

  return (
    <div className="space-y-8">
      {/* En-tête */}
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Bonjour, {pro.name}
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1 capitalize">
          {today}
        </p>
      </div>

      {/* Cartes statistiques */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
              Leads reçus ce mois
            </p>
            <DeltaIndicator
              current={stats.receivedThisMonth}
              previous={stats.prevReceived}
            />
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            <CountUp end={stats.receivedThisMonth} duration={1200} />
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
              Leads contactés
            </p>
            <DeltaIndicator
              current={stats.contactedThisMonth}
              previous={stats.prevContacted}
            />
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            <CountUp end={stats.contactedThisMonth} duration={1200} />
          </p>
        </div>

        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
              Taux de réponse
            </p>
            <DeltaIndicator
              current={stats.responseRate}
              previous={stats.prevResponseRate}
            />
          </div>
          <p className="text-3xl font-bold text-[var(--text-primary)]">
            <CountUp end={stats.responseRate} duration={1200} suffix=" %" />
          </p>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Derniers leads */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Derniers leads reçus
            </h2>
            {recentLeads.length > 0 && (
              <Link
                href="/pro/dashboard/leads"
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Voir tout
              </Link>
            )}
          </div>

          {recentLeads.length === 0 ? (
            <div className="text-center py-8">
              <div className="w-14 h-14 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-3">
                <svg
                  className="w-7 h-7 text-[var(--text-tertiary)]"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={1.5}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M2.25 13.5h3.86a2.25 2.25 0 012.012 1.244l.256.512a2.25 2.25 0 002.013 1.244h3.218a2.25 2.25 0 002.013-1.244l.256-.512a2.25 2.25 0 012.013-1.244h3.859m-19.5.338V18a2.25 2.25 0 002.25 2.25h15A2.25 2.25 0 0021.75 18v-4.162c0-.224-.034-.447-.1-.661L19.24 5.338a2.25 2.25 0 00-2.15-1.588H6.911a2.25 2.25 0 00-2.15 1.588L2.35 13.177a2.25 2.25 0 00-.1.661z"
                  />
                </svg>
              </div>
              <p className="text-sm text-[var(--text-secondary)] mb-1">
                Aucun lead pour le moment
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Les demandes de clients apparaîtront ici dès qu&apos;un
                particulier déposera un projet dans votre zone.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {recentLeads.map((lead) => {
                const badge = STATUS_BADGES[lead.status] || STATUS_BADGES.sent;
                return (
                  <Link
                    key={lead.id}
                    href="/pro/dashboard/leads"
                    className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      <div className="w-9 h-9 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                        <span className="text-sm font-semibold text-[var(--text-secondary)]">
                          {lead.project.first_name.charAt(0).toUpperCase()}
                        </span>
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                          {lead.project.first_name} —{" "}
                          {lead.project.category.name}
                        </p>
                        <p className="text-xs text-[var(--text-tertiary)] truncate">
                          {lead.project.city?.name || "Ville non précisée"}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-center gap-3 shrink-0 ml-3">
                      <span
                        className={`text-xs font-medium px-2.5 py-1 rounded-full ${badge.className}`}
                      >
                        {badge.label}
                      </span>
                      <span className="text-xs text-[var(--text-tertiary)] hidden sm:block">
                        {timeAgo(lead.sent_at)}
                      </span>
                    </div>
                  </Link>
                );
              })}
            </div>
          )}
        </div>

        {/* Statut abonnement */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Abonnement
            </h2>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${subInfo.className}`}
            >
              {subInfo.label}
            </span>
          </div>

          {pro.subscription_status === "trialing" && pro.trial_ends_at && (
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Essai gratuit jusqu&apos;au{" "}
              {new Date(pro.trial_ends_at).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
            </p>
          )}

          {pro.subscription_status === "active" && pro.current_period_end && (
            <p className="text-sm text-[var(--text-secondary)] mb-3">
              Prochaine facturation le{" "}
              {new Date(pro.current_period_end).toLocaleDateString("fr-FR", {
                day: "numeric",
                month: "long",
              })}
            </p>
          )}

          {(pro.subscription_status === "none" ||
            pro.subscription_status === "free") && (
            <p className="text-sm text-[var(--text-tertiary)] mb-4">
              Activez votre abonnement pour commencer à recevoir des leads
              qualifiés.
            </p>
          )}

          <Link
            href="/pro/dashboard/abonnement"
            className="block text-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
          >
            {pro.subscription_status === "active"
              ? "Gérer mon abonnement"
              : "Voir les offres"}
          </Link>
        </div>
      </div>
    </div>
  );
}

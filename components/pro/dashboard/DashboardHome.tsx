"use client";

import Link from "next/link";
import { useDashboard } from "@/components/pro/dashboard/DashboardProvider";
import CountUp from "@/components/ui/CountUp";
import { timeAgo } from "@/lib/utils/date";
import type { ProDashboardData } from "@/lib/queries/leads";

type Props = {
  data: ProDashboardData;
};

// En pay-per-lead, plus d'abonnement : tout le monde est "Gratuit". On garde
// trialing/active/suspended pour d'éventuels comptes hérités (0 aujourd'hui).
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
  canceled: {
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
  suspended: {
    label: "Suspendu",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
  },
};

const STAT_CARDS: {
  key: keyof Pick<ProDashboardData, "newThisMonth" | "totalAvailable" | "unlockedCount">;
  label: string;
  suffix?: string;
}[] = [
  { key: "newThisMonth", label: "Nouveaux projets ce mois" },
  { key: "totalAvailable", label: "Projets disponibles" },
  { key: "unlockedCount", label: "Leads débloqués" },
];

export default function DashboardHome({ data }: Props) {
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

      {/* Cartes statistiques (pay-per-lead) */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {STAT_CARDS.map((card) => (
          <div
            key={card.key}
            className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6"
          >
            <p className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
              {card.label}
            </p>
            <p className="text-3xl font-bold text-[var(--text-primary)]">
              <CountUp end={data[card.key]} duration={1200} />
            </p>
          </div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Derniers projets dans la zone */}
        <div className="lg:col-span-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Derniers projets dans votre zone
            </h2>
            {data.recentProjects.length > 0 && (
              <Link
                href="/pro/dashboard/leads"
                className="text-xs font-medium text-[var(--accent)] hover:underline"
              >
                Voir tout
              </Link>
            )}
          </div>

          {data.recentProjects.length === 0 ? (
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
                Aucun projet pour le moment
              </p>
              <p className="text-xs text-[var(--text-tertiary)]">
                Les demandes de votre zone apparaîtront ici dès qu&apos;un
                particulier déposera un projet dans vos métiers.
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {data.recentProjects.map((p) => (
                <Link
                  key={p.id}
                  href="/pro/dashboard/leads"
                  className="flex items-center justify-between p-3 rounded-xl hover:bg-[var(--bg-tertiary)] transition-colors duration-200"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <div className="w-9 h-9 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                      <span className="text-sm font-semibold text-[var(--text-secondary)]">
                        {(p.first_name || "?").charAt(0).toUpperCase()}
                      </span>
                    </div>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-[var(--text-primary)] truncate">
                        {p.categoryName || "Projet"}
                        {p.cityName ? ` à ${p.cityName}` : ""}
                      </p>
                      <p className="text-xs text-[var(--text-tertiary)] truncate">
                        {p.first_name || "Un particulier"}
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3 shrink-0 ml-3">
                    <span
                      className={`text-xs font-medium px-2.5 py-1 rounded-full ${
                        p.unlocked
                          ? "bg-green-500/10 text-green-600 dark:text-green-400"
                          : "bg-[var(--accent)]/10 text-[var(--accent)]"
                      }`}
                    >
                      {p.unlocked ? "Débloqué" : "À débloquer"}
                    </span>
                    <span className="text-xs text-[var(--text-tertiary)] hidden sm:block">
                      {timeAgo(p.created_at)}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </div>

        {/* Facturation (pay-per-lead) */}
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-sm font-semibold text-[var(--text-primary)]">
              Facturation
            </h2>
            <span
              className={`text-xs font-medium px-2.5 py-1 rounded-full ${subInfo.className}`}
            >
              {subInfo.label}
            </span>
          </div>

          <p className="text-sm text-[var(--text-tertiary)] mb-4">
            Vous êtes listé gratuitement. Vous recevez les demandes de votre
            zone — débloquez un contact pour 9,90 € seulement quand un projet
            vous intéresse.
          </p>

          <Link
            href="/pro/dashboard/abonnement"
            className="block text-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
          >
            Voir ma facturation
          </Link>
        </div>
      </div>
    </div>
  );
}

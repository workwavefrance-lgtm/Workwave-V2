"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { formatDateFR } from "@/lib/utils/date";
import { markLeadContacted, markLeadNotRelevant } from "@/app/pro/dashboard/leads/[id]/actions";
import type { LeadWithProject } from "@/lib/queries/leads";

const URGENCY_LABELS: Record<string, string> = {
  today: "Aujourd\u2019hui",
  this_week: "Cette semaine",
  this_month: "Ce mois-ci",
  not_urgent: "Pas urgent",
};

const BUDGET_LABELS: Record<string, string> = {
  lt500: "Moins de 500 \u20ac",
  "500_2000": "500 \u2013 2 000 \u20ac",
  "2000_5000": "2 000 \u2013 5 000 \u20ac",
  "5000_15000": "5 000 \u2013 15 000 \u20ac",
  gt15000: "Plus de 15 000 \u20ac",
  unknown: "Non précisé",
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

export default function LeadDetail({ lead }: { lead: LeadWithProject }) {
  const router = useRouter();
  const [loading, setLoading] = useState<string | null>(null);
  const project = lead.project;
  const badge = STATUS_BADGES[lead.status] || STATUS_BADGES.sent;
  const ai = project.ai_qualification;

  async function handleAction(action: "contacted" | "not_relevant") {
    setLoading(action);
    const result =
      action === "contacted"
        ? await markLeadContacted(lead.id)
        : await markLeadNotRelevant(lead.id);

    if (result.error) {
      setLoading(null);
      return;
    }
    router.refresh();
    setLoading(null);
  }

  return (
    <div className="space-y-6">
      {/* Retour */}
      <Link
        href="/pro/dashboard/leads"
        className="inline-flex items-center gap-2 text-sm text-[var(--text-secondary)] hover:text-[var(--text-primary)] transition-colors duration-200"
      >
        <svg
          className="w-4 h-4"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            d="M15.75 19.5L8.25 12l7.5-7.5"
          />
        </svg>
        Retour aux leads
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Colonne gauche — Détail du projet */}
        <div className="lg:col-span-2 space-y-6">
          {/* En-tête */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
            <div className="flex items-start justify-between gap-3 mb-4">
              <div>
                <h1 className="text-xl font-bold text-[var(--text-primary)] tracking-tight">
                  Demande de {project.first_name}
                </h1>
                <p className="text-sm text-[var(--text-tertiary)] mt-1">
                  {project.category.name} —{" "}
                  {project.city?.name || "Ville non précisée"} — Reçu le{" "}
                  {formatDateFR(lead.sent_at)}
                </p>
              </div>
              <span
                className={`text-xs font-medium px-2.5 py-1 rounded-full shrink-0 ${badge.className}`}
              >
                {badge.label}
              </span>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-4 mb-5">
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">
                  Urgence
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {URGENCY_LABELS[project.urgency] || project.urgency}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">
                  Budget
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {BUDGET_LABELS[project.budget] || project.budget}
                </p>
              </div>
              <div>
                <p className="text-xs text-[var(--text-tertiary)] mb-1">
                  Catégorie
                </p>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  {project.category.name}
                </p>
              </div>
            </div>

            <div>
              <p className="text-xs text-[var(--text-tertiary)] mb-2">
                Description du projet
              </p>
              <p className="text-sm text-[var(--text-primary)] leading-relaxed whitespace-pre-wrap">
                {project.description}
              </p>
            </div>
          </div>

          {/* Qualification IA */}
          {ai && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
                Analyse du projet
              </h2>
              <div className="space-y-4">
                <div>
                  <p className="text-xs text-[var(--text-tertiary)] mb-1">
                    Résumé
                  </p>
                  <p className="text-sm text-[var(--text-primary)]">
                    {ai.summary}
                  </p>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">
                      Évaluation de l&apos;urgence
                    </p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {ai.urgency_assessment}
                    </p>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">
                      Commentaire budget
                    </p>
                    <p className="text-sm text-[var(--text-primary)]">
                      {ai.budget_comment}
                    </p>
                  </div>
                </div>
                {ai.keywords && ai.keywords.length > 0 && (
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] mb-2">
                      Mots-clés
                    </p>
                    <div className="flex flex-wrap gap-2">
                      {ai.keywords.map((kw: string) => (
                        <span
                          key={kw}
                          className="text-xs bg-[var(--bg-tertiary)] text-[var(--text-secondary)] px-2.5 py-1 rounded-full"
                        >
                          {kw}
                        </span>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>

        {/* Colonne droite — Coordonnées + Actions */}
        <div className="space-y-6">
          {/* Coordonnées */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
            <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
              Coordonnées du client
            </h2>
            <div className="space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-[var(--text-tertiary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M15.75 6a3.75 3.75 0 11-7.5 0 3.75 3.75 0 017.5 0zM4.501 20.118a7.5 7.5 0 0114.998 0A17.933 17.933 0 0112 21.75c-2.676 0-5.216-.584-7.499-1.632z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Prénom</p>
                  <p className="text-sm font-medium text-[var(--text-primary)]">
                    {project.first_name}
                  </p>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-[var(--text-tertiary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M21.75 6.75v10.5a2.25 2.25 0 01-2.25 2.25h-15a2.25 2.25 0 01-2.25-2.25V6.75m19.5 0A2.25 2.25 0 0019.5 4.5h-15a2.25 2.25 0 00-2.25 2.25m19.5 0v.243a2.25 2.25 0 01-1.07 1.916l-7.5 4.615a2.25 2.25 0 01-2.36 0L3.32 8.91a2.25 2.25 0 01-1.07-1.916V6.75"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">Email</p>
                  <a
                    href={`mailto:${project.email}`}
                    className="text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    {project.email}
                  </a>
                </div>
              </div>

              <div className="flex items-center gap-3">
                <div className="w-9 h-9 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                  <svg
                    className="w-4 h-4 text-[var(--text-tertiary)]"
                    fill="none"
                    viewBox="0 0 24 24"
                    stroke="currentColor"
                    strokeWidth={1.5}
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z"
                    />
                  </svg>
                </div>
                <div>
                  <p className="text-xs text-[var(--text-tertiary)]">
                    Téléphone
                  </p>
                  <a
                    href={`tel:${project.phone}`}
                    className="text-sm font-medium text-[var(--accent)] hover:underline"
                  >
                    {project.phone}
                  </a>
                </div>
              </div>

              {project.city && (
                <div className="flex items-center gap-3">
                  <div className="w-9 h-9 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center shrink-0">
                    <svg
                      className="w-4 h-4 text-[var(--text-tertiary)]"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={1.5}
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z"
                      />
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z"
                      />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)]">Ville</p>
                    <p className="text-sm font-medium text-[var(--text-primary)]">
                      {project.city.name}
                      {project.city.department &&
                        ` (${project.city.department.code})`}
                    </p>
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Actions */}
          {lead.status !== "contacted" && lead.status !== "not_relevant" && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 space-y-3">
              <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-2">
                Actions
              </h2>
              <button
                onClick={() => handleAction("contacted")}
                disabled={loading !== null}
                className="w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-250 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === "contacted"
                  ? "Mise à jour..."
                  : "Marquer comme contacté"}
              </button>
              <button
                onClick={() => handleAction("not_relevant")}
                disabled={loading !== null}
                className="w-full border border-[var(--border-color)] text-[var(--text-secondary)] px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-250 hover:bg-[var(--bg-tertiary)] disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === "not_relevant"
                  ? "Mise à jour..."
                  : "Marquer comme non pertinent"}
              </button>
            </div>
          )}

          {/* Statut final */}
          {(lead.status === "contacted" || lead.status === "not_relevant") && (
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
              <div
                className={`w-12 h-12 rounded-full flex items-center justify-center mx-auto mb-3 ${
                  lead.status === "contacted"
                    ? "bg-green-500/10"
                    : "bg-[var(--bg-tertiary)]"
                }`}
              >
                <svg
                  className={`w-6 h-6 ${
                    lead.status === "contacted"
                      ? "text-green-500"
                      : "text-[var(--text-tertiary)]"
                  }`}
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                  strokeWidth={2}
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M4.5 12.75l6 6 9-13.5"
                  />
                </svg>
              </div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                {lead.status === "contacted"
                  ? "Lead marqué comme contacté"
                  : "Lead marqué comme non pertinent"}
              </p>
              {lead.contacted_at && (
                <p className="text-xs text-[var(--text-tertiary)] mt-1">
                  Le {formatDateFR(lead.contacted_at)}
                </p>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

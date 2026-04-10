"use client";

import { useRouter, useSearchParams } from "next/navigation";
import LeadCard from "@/components/pro/dashboard/LeadCard";
import type { LeadWithProject } from "@/lib/queries/leads";

type Props = {
  leads: LeadWithProject[];
  totalPages: number;
  currentPage: number;
  currentStatus: string | null;
};

const FILTERS = [
  { value: null, label: "Tous" },
  { value: "sent", label: "Nouveaux" },
  { value: "opened", label: "Vus" },
  { value: "contacted", label: "Contactés" },
  { value: "not_relevant", label: "Non pertinents" },
];

export default function LeadsList({
  leads,
  totalPages,
  currentPage,
  currentStatus,
}: Props) {
  const router = useRouter();
  const searchParams = useSearchParams();

  function setFilter(status: string | null) {
    const params = new URLSearchParams(searchParams.toString());
    if (status) {
      params.set("status", status);
    } else {
      params.delete("status");
    }
    params.delete("page");
    router.push(`/pro/dashboard/leads?${params.toString()}`);
  }

  function goToPage(page: number) {
    const params = new URLSearchParams(searchParams.toString());
    if (page > 1) {
      params.set("page", String(page));
    } else {
      params.delete("page");
    }
    router.push(`/pro/dashboard/leads?${params.toString()}`);
  }

  return (
    <div className="space-y-6">
      {/* Filtres */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {FILTERS.map((filter) => (
          <button
            key={filter.label}
            onClick={() => setFilter(filter.value)}
            className={`px-4 py-2 rounded-full text-sm font-medium whitespace-nowrap transition-all duration-200 ${
              currentStatus === filter.value
                ? "bg-[var(--accent)] text-white"
                : "bg-[var(--bg-tertiary)] text-[var(--text-secondary)] hover:bg-[var(--bg-secondary)]"
            }`}
          >
            {filter.label}
          </button>
        ))}
      </div>

      {/* Liste */}
      {leads.length === 0 ? (
        <div className="text-center py-12">
          <div className="w-16 h-16 rounded-full bg-[var(--bg-tertiary)] flex items-center justify-center mx-auto mb-4">
            <svg
              className="w-8 h-8 text-[var(--text-tertiary)]"
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
          <p className="text-[var(--text-secondary)] mb-1">
            {currentStatus
              ? "Aucun lead avec ce filtre"
              : "Aucun lead pour le moment"}
          </p>
          <p className="text-sm text-[var(--text-tertiary)]">
            {currentStatus
              ? "Essayez un autre filtre pour voir vos leads."
              : "Les demandes de clients apparaîtront ici dès qu\u2019un particulier déposera un projet dans votre zone."}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {leads.map((lead) => (
            <LeadCard key={lead.id} lead={lead} />
          ))}
        </div>
      )}

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 pt-4">
          <button
            onClick={() => goToPage(currentPage - 1)}
            disabled={currentPage <= 1}
            className="px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Précédent
          </button>
          <span className="text-sm text-[var(--text-tertiary)] px-3">
            {currentPage} / {totalPages}
          </span>
          <button
            onClick={() => goToPage(currentPage + 1)}
            disabled={currentPage >= totalPages}
            className="px-3 py-2 rounded-xl text-sm font-medium text-[var(--text-secondary)] hover:bg-[var(--bg-tertiary)] disabled:opacity-40 disabled:cursor-not-allowed transition-colors duration-200"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

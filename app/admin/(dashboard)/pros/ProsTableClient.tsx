"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import AdminTable from "@/components/admin/data-display/AdminTable";
import type { AdminColumn } from "@/components/admin/data-display/AdminTable";
import AdminTableSearch from "@/components/admin/data-display/AdminTableSearch";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import AdminBadge from "@/components/admin/data-display/AdminBadge";
import CsvExportButton from "@/components/admin/export/CsvExportButton";
import type { AdminProRow, AdminProsFilters } from "@/lib/queries/admin-pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

// Statut d'abonnement : UNIQUEMENT pertinent pour les pros Workwave AI
// (Premium 29,90 EUR/mois). En BTP = pay-per-lead, pas d'abonnement.
const AI_SUB_BADGE: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }
> = {
  active: { label: "Premium", variant: "success" },
  trialing: { label: "Essai", variant: "info" },
  past_due: { label: "Impayé", variant: "warning" },
  canceled: { label: "Résilié", variant: "danger" },
  none: { label: "Gratuit", variant: "default" },
  free: { label: "Gratuit", variant: "default" },
  suspended: { label: "Suspendu", variant: "danger" },
};

// Tabs Vertical : separation visuelle BTP / AI
const VERTICAL_TABS: { value: string; label: string }[] = [
  { value: "all", label: "Tous" },
  { value: "btp", label: "BTP" },
  { value: "ai", label: "Workwave AI" },
];

// Etat metier — BTP : pas d'abonnement, juste reclame / non reclame.
const STATE_TABS: { value: string; label: string; description: string }[] = [
  { value: "all", label: "Tous", description: "Tous les pros" },
  { value: "scraped", label: "Non réclamés", description: "Fiches scrapées Sirene/Pages Jaunes, jamais réclamées" },
  { value: "claimed", label: "Réclamés", description: "Le pro a réclamé sa fiche (compte créé)" },
];

// Etat metier — Workwave AI : on distingue en plus les abonnes Premium.
const AI_STATE_TABS: { value: string; label: string; description: string }[] = [
  { value: "all", label: "Tous", description: "Tous les pros AI" },
  { value: "scraped", label: "Non réclamés", description: "Fiches scrapées, jamais réclamées" },
  { value: "claimed_free", label: "Réclamés gratuits", description: "Compte créé, plan gratuit" },
  { value: "paying", label: "Abonnés Premium", description: "Abonnement Premium 29,90 €/mois actif" },
  { value: "trialing", label: "Essai", description: "En essai gratuit" },
  { value: "canceled", label: "Résiliés", description: "Abonnement annulé" },
];

const columns: AdminColumn<AdminProRow>[] = [
  {
    key: "name",
    label: "Nom",
    sortable: true,
    render: (row) => (
      <div>
        <span className="font-medium">{row.name}</span>
        {row.siret && (
          <span
            className="block text-[10px] font-mono mt-0.5"
            style={{ color: "var(--admin-text-tertiary)" }}
          >
            {row.siret}
          </span>
        )}
      </div>
    ),
  },
  {
    key: "category",
    label: "Catégorie",
    render: (row) => (
      <span style={{ color: "var(--admin-text-secondary)" }}>
        {row.category?.name || "—"}
      </span>
    ),
  },
  {
    key: "city",
    label: "Ville",
    render: (row) => (
      <span style={{ color: "var(--admin-text-secondary)" }}>
        {row.city?.name || "—"}
      </span>
    ),
  },
  {
    key: "claimed",
    label: "État",
    // BTP : Réclamé / Non réclamé. AI : statut d'abonnement (Premium/Essai/...).
    render: (row) => {
      if (!row.claimed_at) {
        return (
          <AdminBadge variant="default" dot>
            Non réclamé
          </AdminBadge>
        );
      }
      const isAI = (AI_CATEGORY_IDS as readonly number[]).includes(row.category_id);
      if (isAI) {
        const s = AI_SUB_BADGE[row.subscription_status] || AI_SUB_BADGE.none;
        return (
          <AdminBadge variant={s.variant} dot>
            {s.label}
          </AdminBadge>
        );
      }
      return (
        <AdminBadge variant="success" dot>
          Réclamé
        </AdminBadge>
      );
    },
  },
  {
    key: "profile_completion",
    label: "Profil",
    sortable: true,
    className: "text-right",
    render: (row) => (
      <span className="tabular-nums">{row.profile_completion}%</span>
    ),
  },
  {
    key: "response_rate",
    label: "Réponse",
    sortable: true,
    className: "text-right",
    render: (row) => (
      <span className="tabular-nums">
        {row.response_rate !== null ? `${row.response_rate}%` : "—"}
      </span>
    ),
  },
  {
    // Pro réclamé -> date de réclamation (quand il a pris sa fiche).
    // Sinon -> date de création/scraping de la fiche. (cf. colonne "État")
    key: "created_at",
    label: "Date",
    sortable: true,
    render: (row) => {
      const d = row.claimed_at || row.created_at;
      return (
        <span
          className="tabular-nums"
          style={{ color: "var(--admin-text-tertiary)" }}
          title={row.claimed_at ? "Date de réclamation" : "Date de création de la fiche"}
        >
          {new Date(d).toLocaleDateString("fr-FR", {
            day: "2-digit",
            month: "short",
            year: "2-digit",
          })}
        </span>
      );
    },
  },
];

export default function ProsTableClient({
  initialData,
  initialCount,
  initialPage,
  initialTotalPages,
  filters,
}: {
  initialData: AdminProRow[];
  initialCount: number;
  initialPage: number;
  initialTotalPages: number;
  filters: AdminProsFilters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v && v !== "all" && v !== "") {
          params.set(k, v);
        } else {
          params.delete(k);
        }
      }
      // Reset page when filters change (unless updating page itself)
      if (!("page" in updates)) params.delete("page");
      router.push(`/admin/pros?${params.toString()}`);
    },
    [router, searchParams]
  );

  const activeVertical = filters.vertical || "all";
  const activeState = filters.state || "all";
  // En vue AI : onglets avec les abonnés Premium. Sinon : réclamé / non réclamé.
  const stateTabs = activeVertical === "ai" ? AI_STATE_TABS : STATE_TABS;

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1
          className="text-xl font-semibold"
          style={{ color: "var(--admin-text)" }}
        >
          Professionnels
        </h1>
        <CsvExportButton
          endpoint={`/api/admin/pros?${searchParams.toString()}&format=csv`}
          filename="pros-export"
        />
      </div>
      <p
        className="text-xs mb-5"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        {initialCount.toLocaleString("fr-FR")} professionnel
        {initialCount > 1 ? "s" : ""}
      </p>

      {/* Tabs Vertical : separation BTP / AI en gros et visible */}
      <div
        className="flex gap-1 p-1 rounded-lg mb-4 w-fit"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        {VERTICAL_TABS.map((tab) => {
          const isActive = activeVertical === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateParams({ vertical: tab.value, state: "all" })}
              className="px-4 py-2 text-sm font-medium rounded-md transition-colors"
              style={{
                backgroundColor: isActive
                  ? "var(--admin-bg)"
                  : "transparent",
                color: isActive
                  ? "var(--admin-text)"
                  : "var(--admin-text-secondary)",
                boxShadow: isActive
                  ? "0 1px 2px rgba(0,0,0,0.05)"
                  : "none",
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Tabs Etat metier : contextuels (AI = abonnement, BTP = reclame) */}
      <div className="flex flex-wrap gap-2 mb-4">
        {stateTabs.map((tab) => {
          const isActive = activeState === tab.value;
          return (
            <button
              key={tab.value}
              type="button"
              onClick={() => updateParams({ state: tab.value })}
              title={tab.description}
              className="px-3 py-1.5 text-xs font-medium rounded-full transition-colors"
              style={{
                backgroundColor: isActive
                  ? "var(--admin-accent)"
                  : "var(--admin-card)",
                color: isActive ? "#fff" : "var(--admin-text-secondary)",
                border: `1px solid ${
                  isActive ? "var(--admin-accent)" : "var(--admin-border)"
                }`,
              }}
            >
              {tab.label}
            </button>
          );
        })}
      </div>

      {/* Search (filtres avances optionnels supprimes : remplaces par les tabs ci-dessus) */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-80">
          <AdminTableSearch
            value={filters.search || ""}
            onChange={(v) => updateParams({ search: v })}
            placeholder="Nom, SIRET, email..."
          />
        </div>
      </div>

      {/* Table */}
      <div
        className="rounded-xl overflow-hidden"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <AdminTable
          columns={columns}
          data={initialData}
          sortKey={filters.sort}
          sortDir={filters.order}
          onSort={(key) => {
            const newOrder =
              filters.sort === key && filters.order === "asc" ? "desc" : "asc";
            updateParams({ sort: key, order: newOrder });
          }}
          onRowClick={(row) => router.push(`/admin/pros/${row.id}`)}
          emptyMessage="Aucun professionnel trouvé"
        />
        <div className="px-3 py-2">
          <AdminTablePagination
            page={initialPage}
            totalPages={initialTotalPages}
            total={initialCount}
            onPageChange={(p) => updateParams({ page: String(p) })}
          />
        </div>
      </div>
    </div>
  );
}

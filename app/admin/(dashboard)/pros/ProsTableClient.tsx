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

const STATUS_BADGE: Record<
  string,
  { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }
> = {
  active: { label: "Actif", variant: "success" },
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

// Tabs Etat metier : 5 categories produit mutuellement exclusives.
// L'ordre suit le funnel : prospect (scrape) -> reclame -> payant -> trial -> resilie.
const STATE_TABS: { value: string; label: string; description: string }[] = [
  { value: "all", label: "Tous", description: "Tous les pros" },
  { value: "scraped", label: "Scrappés", description: "Sirene/Pages Jaunes, non réclamés" },
  { value: "claimed_free", label: "Réclamés gratuits", description: "Compte créé, plan gratuit" },
  { value: "paying", label: "Payants", description: "Abonnement actif" },
  { value: "trialing", label: "Essai gratuit", description: "En essai, va passer payant" },
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
    key: "subscription_status",
    label: "Statut",
    sortable: true,
    render: (row) => {
      const badge = STATUS_BADGE[row.subscription_status] || STATUS_BADGE.none;
      return (
        <AdminBadge variant={badge.variant} dot>
          {badge.label}
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
    key: "created_at",
    label: "Date",
    sortable: true,
    render: (row) => (
      <span
        className="tabular-nums"
        style={{ color: "var(--admin-text-tertiary)" }}
      >
        {new Date(row.created_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          year: "2-digit",
        })}
      </span>
    ),
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
              onClick={() => updateParams({ vertical: tab.value })}
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

      {/* Tabs Etat metier : 5 categories produit */}
      <div className="flex flex-wrap gap-2 mb-4">
        {STATE_TABS.map((tab) => {
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

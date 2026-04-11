"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import AdminTable from "@/components/admin/data-display/AdminTable";
import type { AdminColumn } from "@/components/admin/data-display/AdminTable";
import AdminTableSearch from "@/components/admin/data-display/AdminTableSearch";
import AdminTableFilters from "@/components/admin/data-display/AdminTableFilters";
import type { FilterConfig } from "@/components/admin/data-display/AdminTableFilters";
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

const FILTERS: FilterConfig[] = [
  {
    key: "status",
    label: "Statut",
    options: [
      { label: "Tous", value: "all" },
      { label: "Actif", value: "active" },
      { label: "Essai", value: "trialing" },
      { label: "Impayé", value: "past_due" },
      { label: "Résilié", value: "canceled" },
      { label: "Gratuit", value: "none" },
    ],
  },
  {
    key: "claimed",
    label: "Réclamé",
    options: [
      { label: "Tous", value: "all" },
      { label: "Oui", value: "claimed" },
      { label: "Non", value: "unclaimed" },
    ],
  },
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
        {initialCount} professionnel{initialCount > 1 ? "s" : ""}
      </p>

      {/* Search + Filters */}
      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-64">
          <AdminTableSearch
            value={filters.search || ""}
            onChange={(v) => updateParams({ search: v })}
            placeholder="Nom, SIRET, email..."
          />
        </div>
        <AdminTableFilters
          filters={FILTERS}
          values={{
            status: filters.status || "all",
            claimed: filters.claimed || "all",
          }}
          onChange={(key, value) => updateParams({ [key]: value })}
        />
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

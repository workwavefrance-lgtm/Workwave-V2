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
import type { AdminProjectRow, AdminProjectsFilters } from "@/lib/queries/admin-projects";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  new: { label: "Nouveau", variant: "info" },
  routed: { label: "Routé", variant: "success" },
  unrouted: { label: "Non routé", variant: "warning" },
  suspicious: { label: "Suspect", variant: "danger" },
  closed: { label: "Fermé", variant: "default" },
  deleted: { label: "Supprimé", variant: "danger" },
};

const FILTERS: FilterConfig[] = [
  {
    key: "status",
    label: "Statut",
    options: [
      { label: "Tous", value: "all" },
      { label: "Nouveau", value: "new" },
      { label: "Routé", value: "routed" },
      { label: "Non routé", value: "unrouted" },
      { label: "Suspect", value: "suspicious" },
      { label: "Fermé", value: "closed" },
    ],
  },
];

function SuspicionBar({ score }: { score: number | null }) {
  if (score === null) return <span style={{ color: "var(--admin-text-tertiary)" }}>—</span>;

  const color =
    score < 30 ? "#10B981" : score < 70 ? "#F59E0B" : "#EF4444";

  return (
    <div className="flex items-center gap-1.5">
      <div
        className="w-12 h-1.5 rounded-full overflow-hidden"
        style={{ backgroundColor: "var(--admin-hover)" }}
      >
        <div
          className="h-full rounded-full"
          style={{ width: `${score}%`, backgroundColor: color }}
        />
      </div>
      <span className="tabular-nums text-[10px]" style={{ color }}>
        {score}
      </span>
    </div>
  );
}

const columns: AdminColumn<AdminProjectRow>[] = [
  {
    key: "id",
    label: "#",
    render: (row) => (
      <span className="font-mono text-[10px]" style={{ color: "var(--admin-text-tertiary)" }}>
        {row.id}
      </span>
    ),
  },
  {
    key: "first_name",
    label: "Prénom",
    render: (row) => <span className="font-medium">{row.first_name}</span>,
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
    key: "status",
    label: "Statut",
    sortable: true,
    render: (row) => {
      const badge = STATUS_BADGE[row.status] || STATUS_BADGE.new;
      return (
        <AdminBadge variant={badge.variant} dot>
          {badge.label}
        </AdminBadge>
      );
    },
  },
  {
    key: "suspicion_score",
    label: "Suspicion",
    sortable: true,
    render: (row) => <SuspicionBar score={row.suspicion_score} />,
  },
  {
    key: "summary",
    label: "Résumé IA",
    className: "max-w-[200px]",
    render: (row) => (
      <span
        className="truncate block text-[11px]"
        style={{ color: "var(--admin-text-tertiary)" }}
      >
        {row.ai_qualification?.summary || "—"}
      </span>
    ),
  },
  {
    key: "created_at",
    label: "Date",
    sortable: true,
    render: (row) => (
      <span className="tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
        {new Date(row.created_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
  },
];

export default function ProjectsTableClient({
  initialData,
  initialCount,
  initialPage,
  initialTotalPages,
  filters,
}: {
  initialData: AdminProjectRow[];
  initialCount: number;
  initialPage: number;
  initialTotalPages: number;
  filters: AdminProjectsFilters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v && v !== "all" && v !== "") params.set(k, v);
        else params.delete(k);
      }
      if (!("page" in updates)) params.delete("page");
      router.push(`/admin/projects?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold" style={{ color: "var(--admin-text)" }}>
          Projets
        </h1>
        <CsvExportButton
          endpoint={`/api/admin/projects?${searchParams.toString()}&format=csv`}
          filename="projects-export"
        />
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--admin-text-secondary)" }}>
        {initialCount} projet{initialCount > 1 ? "s" : ""}
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-4">
        <div className="w-full sm:w-64">
          <AdminTableSearch
            value={filters.search || ""}
            onChange={(v) => updateParams({ search: v })}
            placeholder="Prénom, description, email..."
          />
        </div>
        <AdminTableFilters
          filters={FILTERS}
          values={{ status: filters.status || "all" }}
          onChange={(key, value) => updateParams({ [key]: value })}
        />
      </div>

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
            const newOrder = filters.sort === key && filters.order === "asc" ? "desc" : "asc";
            updateParams({ sort: key, order: newOrder });
          }}
          onRowClick={(row) => router.push(`/admin/projects/${row.id}`)}
          emptyMessage="Aucun projet trouvé"
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

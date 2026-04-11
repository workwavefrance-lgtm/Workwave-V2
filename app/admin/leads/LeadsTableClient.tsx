"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import AdminTable from "@/components/admin/data-display/AdminTable";
import type { AdminColumn } from "@/components/admin/data-display/AdminTable";
import AdminTableFilters from "@/components/admin/data-display/AdminTableFilters";
import type { FilterConfig } from "@/components/admin/data-display/AdminTableFilters";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import AdminBadge from "@/components/admin/data-display/AdminBadge";
import CsvExportButton from "@/components/admin/export/CsvExportButton";
import type { AdminLeadRow, AdminLeadsFilters } from "@/lib/queries/admin-leads";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  sent: { label: "Envoyé", variant: "default" },
  opened: { label: "Vu", variant: "info" },
  contacted: { label: "Contacté", variant: "success" },
  not_relevant: { label: "Non pertinent", variant: "warning" },
  expired: { label: "Expiré", variant: "danger" },
};

const FILTERS: FilterConfig[] = [
  {
    key: "status",
    label: "Statut",
    options: [
      { label: "Tous", value: "all" },
      { label: "Envoyé", value: "sent" },
      { label: "Vu", value: "opened" },
      { label: "Contacté", value: "contacted" },
      { label: "Non pertinent", value: "not_relevant" },
    ],
  },
];

const columns: AdminColumn<AdminLeadRow>[] = [
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
    key: "project",
    label: "Projet",
    render: (row) => (
      <span className="font-medium">
        {row.project?.first_name || "—"} — #{row.project?.id}
      </span>
    ),
  },
  {
    key: "pro",
    label: "Pro",
    render: (row) => (
      <span style={{ color: "var(--admin-accent)" }}>
        {row.pro?.name || "—"}
      </span>
    ),
  },
  {
    key: "status",
    label: "Statut",
    sortable: true,
    render: (row) => {
      const badge = STATUS_BADGE[row.status] || STATUS_BADGE.sent;
      return <AdminBadge variant={badge.variant} dot>{badge.label}</AdminBadge>;
    },
  },
  {
    key: "sent_at",
    label: "Envoyé",
    sortable: true,
    render: (row) => (
      <span className="tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
        {new Date(row.sent_at).toLocaleDateString("fr-FR", {
          day: "2-digit",
          month: "short",
          hour: "2-digit",
          minute: "2-digit",
        })}
      </span>
    ),
  },
  {
    key: "opened_at",
    label: "Ouvert",
    render: (row) => (
      <span className="tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
        {row.opened_at
          ? new Date(row.opened_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            })
          : "—"}
      </span>
    ),
  },
  {
    key: "contacted_at",
    label: "Contacté",
    render: (row) => (
      <span className="tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
        {row.contacted_at
          ? new Date(row.contacted_at).toLocaleDateString("fr-FR", {
              day: "2-digit",
              month: "short",
            })
          : "—"}
      </span>
    ),
  },
];

export default function LeadsTableClient({
  initialData,
  initialCount,
  initialPage,
  initialTotalPages,
  filters,
}: {
  initialData: AdminLeadRow[];
  initialCount: number;
  initialPage: number;
  initialTotalPages: number;
  filters: AdminLeadsFilters;
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
      router.push(`/admin/leads?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <h1 className="text-xl font-semibold" style={{ color: "var(--admin-text)" }}>
          Leads
        </h1>
        <CsvExportButton
          endpoint={`/api/admin/leads?${searchParams.toString()}&format=csv`}
          filename="leads-export"
        />
      </div>
      <p className="text-xs mb-5" style={{ color: "var(--admin-text-secondary)" }}>
        {initialCount} lead{initialCount > 1 ? "s" : ""}
      </p>

      <div className="mb-4">
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
          onRowClick={(row) => {
            if (row.project) router.push(`/admin/projects/${row.project.id}`);
          }}
          emptyMessage="Aucun lead trouvé"
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

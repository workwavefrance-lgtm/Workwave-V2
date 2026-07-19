"use client";

import { useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import AdminTable, { type AdminColumn } from "@/components/admin/data-display/AdminTable";
import AdminBadge from "@/components/admin/data-display/AdminBadge";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import AdminTableSearch from "@/components/admin/data-display/AdminTableSearch";
import type { SupportTicket } from "@/lib/support/tickets";
import {
  STATUS_META,
  STATUS_TABS,
  SOURCE_LABEL,
  CATEGORY_LABEL,
  TimeAgo,
  type TicketStatus,
} from "./support-ui";

export default function SupportInboxClient({
  initialData,
  initialCount,
  initialPage,
  initialTotalPages,
  counts,
  filters,
}: {
  initialData: SupportTicket[];
  initialCount: number;
  initialPage: number;
  initialTotalPages: number;
  counts: Record<string, number>;
  filters: { status: string; search: string; page: number; pageSize: number };
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback(
    (updates: Record<string, string>) => {
      const params = new URLSearchParams(searchParams.toString());
      for (const [k, v] of Object.entries(updates)) {
        if (v && v !== "") params.set(k, v);
        else params.delete(k);
      }
      if (!("page" in updates)) params.delete("page");
      router.push(`/admin/support?${params.toString()}`);
    },
    [router, searchParams]
  );

  const columns: AdminColumn<SupportTicket>[] = [
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
      key: "status",
      label: "Statut",
      render: (row) => {
        const meta = STATUS_META[row.status as TicketStatus] || STATUS_META.open;
        return (
          <AdminBadge variant={meta.variant} dot>
            {meta.label}
          </AdminBadge>
        );
      },
    },
    {
      key: "subject",
      label: "Objet",
      render: (row) => (
        <div className="max-w-[280px]">
          <div className="truncate text-xs font-medium" style={{ color: "var(--admin-text)" }}>
            {row.subject || "(sans objet)"}
          </div>
          {row.category ? (
            <span className="text-[10px]" style={{ color: "var(--admin-text-tertiary)" }}>
              {CATEGORY_LABEL[row.category] || row.category}
            </span>
          ) : null}
        </div>
      ),
    },
    {
      key: "requester",
      label: "Expéditeur",
      render: (row) => (
        <div className="max-w-[200px]">
          {row.requester_name ? (
            <div className="truncate text-xs" style={{ color: "var(--admin-text)" }}>
              {row.requester_name}
            </div>
          ) : null}
          <div className="truncate text-[11px]" style={{ color: "var(--admin-text-tertiary)" }}>
            {row.requester_email || "—"}
          </div>
        </div>
      ),
    },
    {
      key: "source",
      label: "Canal",
      render: (row) => (
        <span className="text-[11px]" style={{ color: "var(--admin-text-secondary)" }}>
          {SOURCE_LABEL[row.source] || row.source}
        </span>
      ),
    },
    {
      key: "priority",
      label: "",
      render: (row) =>
        row.is_legal || row.priority === "urgent" ? (
          <span
            className="text-[9px] font-bold px-1.5 py-0.5 rounded-full"
            style={{ color: "var(--admin-danger)", background: "rgba(251,110,91,.14)" }}
          >
            {row.is_legal ? "LÉGAL" : "URGENT"}
          </span>
        ) : null,
    },
    {
      key: "last_message_at",
      label: "Activité",
      render: (row) => (
        <span className="text-[11px] tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
          <TimeAgo iso={row.last_message_at} />
        </span>
      ),
    },
  ];

  return (
    <div className="max-w-5xl mx-auto">
      <h1
        className="text-2xl font-extrabold tracking-tight mb-1"
        style={{ color: "var(--admin-text)" }}
      >
        Support
      </h1>
      <p className="text-xs mb-4" style={{ color: "var(--admin-text-tertiary)" }}>
        {initialCount} ticket{initialCount > 1 ? "s" : ""}
      </p>

      {/* Onglets statut */}
      <div
        className="flex gap-1 p-1 rounded-xl mb-3 w-fit overflow-x-auto"
        style={{ background: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
      >
        {STATUS_TABS.map((t) => {
          const on = (filters.status || "open") === t.value;
          const c = t.value === "all" ? null : counts[t.value] ?? 0;
          return (
            <button
              key={t.value}
              onClick={() => updateParams({ status: t.value })}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg transition-colors whitespace-nowrap"
              style={{
                background: on ? "var(--admin-accent)" : "transparent",
                color: on ? "#fff" : "var(--admin-text-secondary)",
              }}
            >
              {t.label}
              {c !== null ? (
                <span
                  className="ml-1.5 tabular-nums"
                  style={{ opacity: on ? 0.85 : 0.6 }}
                >
                  {c}
                </span>
              ) : null}
            </button>
          );
        })}
      </div>

      <div className="w-full sm:w-72 mb-4">
        <AdminTableSearch
          value={filters.search || ""}
          onChange={(v) => updateParams({ search: v })}
          placeholder="Email, nom, objet…"
        />
      </div>

      <div
        className="rounded-xl overflow-hidden"
        style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
      >
        <AdminTable
          columns={columns}
          data={initialData}
          onRowClick={(row) => router.push(`/admin/support/${row.id}`)}
          emptyMessage="Aucun ticket dans cette catégorie"
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

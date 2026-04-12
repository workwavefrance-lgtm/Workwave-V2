"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import type { AdminLogEntry } from "@/lib/queries/admin-logs";

function timeAgo(dateStr: string): string {
  const diff = Date.now() - new Date(dateStr).getTime();
  const mins = Math.floor(diff / 60000);
  if (mins < 1) return "à l'instant";
  if (mins < 60) return `il y a ${mins}min`;
  const hours = Math.floor(mins / 60);
  if (hours < 24) return `il y a ${hours}h`;
  const days = Math.floor(hours / 24);
  return `il y a ${days}j`;
}

function formatDate(dateStr: string): string {
  return new Date(dateStr).toLocaleDateString("fr-FR", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

const ACTION_COLORS: Record<string, string> = {
  "pro.update": "#3B82F6",
  "pro.delete": "#EF4444",
  "pro.impersonate": "#F59E0B",
  "pro.subscription_update": "#10B981",
  "project.update": "#3B82F6",
  "project.route_manually": "#10B981",
  "lead.update": "#8B5CF6",
  "alert.acknowledge": "#F59E0B",
  "admin.add": "#10B981",
  "admin.remove": "#EF4444",
};

function getEntityLink(
  entityType: string | null,
  entityId: number | null
): string | null {
  if (!entityType || !entityId) return null;
  if (entityType === "pro") return `/admin/pros/${entityId}`;
  if (entityType === "project") return `/admin/projects/${entityId}`;
  if (entityType === "lead") return `/admin/leads`;
  return null;
}

function LogEntryCard({ entry }: { entry: AdminLogEntry }) {
  const color = ACTION_COLORS[entry.action] || "var(--admin-text-tertiary)";
  const entityLink = getEntityLink(entry.entity_type, entry.entity_id);

  return (
    <div className="relative pb-6">
      {/* Dot */}
      <div
        className="absolute -left-5 top-1.5 h-2.5 w-2.5 rounded-full ring-2 ring-[var(--admin-bg)]"
        style={{ backgroundColor: color }}
      />

      {/* Card */}
      <div
        className="rounded-xl p-4"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="flex items-start justify-between gap-3">
          <div className="flex-1 min-w-0">
            <div className="flex items-center gap-2 flex-wrap">
              <span
                className="text-xs font-semibold font-mono"
                style={{ color }}
              >
                {entry.action}
              </span>
              {entry.entity_type && entry.entity_id && (
                <>
                  <span
                    className="text-[10px]"
                    style={{ color: "var(--admin-text-tertiary)" }}
                  >
                    /
                  </span>
                  {entityLink ? (
                    <a
                      href={entityLink}
                      className="text-[11px] font-medium underline underline-offset-2 transition-colors duration-150"
                      style={{ color: "var(--admin-accent)" }}
                    >
                      {entry.entity_type} #{entry.entity_id}
                    </a>
                  ) : (
                    <span
                      className="text-[11px]"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      {entry.entity_type} #{entry.entity_id}
                    </span>
                  )}
                </>
              )}
            </div>

            {entry.admin?.email && (
              <p
                className="text-[11px] mt-1"
                style={{ color: "var(--admin-text-secondary)" }}
              >
                par{" "}
                <span
                  className="font-medium"
                  style={{ color: "var(--admin-text)" }}
                >
                  {entry.admin.email}
                </span>
              </p>
            )}

            {entry.details && Object.keys(entry.details).length > 0 && (
              <div
                className="mt-2 rounded-lg px-3 py-2 text-[10px] font-mono leading-relaxed overflow-x-auto"
                style={{
                  backgroundColor: "var(--admin-bg)",
                  color: "var(--admin-text-secondary)",
                  border: "1px solid var(--admin-border)",
                }}
              >
                {JSON.stringify(entry.details, null, 2)}
              </div>
            )}
          </div>

          <div className="text-right shrink-0">
            <span
              className="text-[10px] tabular-nums block"
              style={{ color: "var(--admin-text-tertiary)" }}
              title={formatDate(entry.created_at)}
            >
              {timeAgo(entry.created_at)}
            </span>
            <span
              className="text-[9px] tabular-nums block mt-0.5"
              style={{ color: "var(--admin-text-tertiary)" }}
            >
              {formatDate(entry.created_at)}
            </span>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function LogsClient({
  initialData,
  initialCount,
  initialPage,
  initialTotalPages,
}: {
  initialData: AdminLogEntry[];
  initialCount: number;
  initialPage: number;
  initialTotalPages: number;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const handlePageChange = useCallback(
    (page: number) => {
      const params = new URLSearchParams(searchParams.toString());
      params.set("page", String(page));
      router.push(`/admin/logs?${params.toString()}`);
    },
    [router, searchParams]
  );

  return (
    <div>
      <h1
        className="text-xl font-semibold mb-1"
        style={{ color: "var(--admin-text)" }}
      >
        Logs d&apos;administration
      </h1>
      <p
        className="text-xs mb-6"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        {initialCount.toLocaleString("fr-FR")} entrée
        {initialCount > 1 ? "s" : ""}
      </p>

      {initialData.length === 0 ? (
        <div
          className="rounded-xl flex flex-col items-center justify-center py-20 gap-4"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <div
            className="w-12 h-12 rounded-full flex items-center justify-center"
            style={{ backgroundColor: "var(--admin-hover)" }}
          >
            <svg
              className="w-6 h-6"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
              strokeWidth={1.5}
              style={{ color: "var(--admin-text-tertiary)" }}
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                d="M12 6v6h4.5m4.5 0a9 9 0 11-18 0 9 9 0 0118 0z"
              />
            </svg>
          </div>
          <p className="text-sm" style={{ color: "var(--admin-text-tertiary)" }}>
            Aucun log disponible
          </p>
        </div>
      ) : (
        <>
          {/* Timeline */}
          <div className="relative pl-8">
            {/* Vertical line */}
            <div
              className="absolute left-3 top-2 bottom-8 w-px"
              style={{ backgroundColor: "var(--admin-border)" }}
            />

            {initialData.map((entry) => (
              <LogEntryCard key={entry.id} entry={entry} />
            ))}
          </div>

          {/* Pagination */}
          <div
            className="mt-2 rounded-xl px-4 py-3"
            style={{
              backgroundColor: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <AdminTablePagination
              page={initialPage}
              totalPages={initialTotalPages}
              total={initialCount}
              onPageChange={handlePageChange}
            />
          </div>
        </>
      )}
    </div>
  );
}

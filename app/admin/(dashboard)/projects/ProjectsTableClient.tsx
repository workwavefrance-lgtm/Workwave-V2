"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import Link from "next/link";
import AdminTableSearch from "@/components/admin/data-display/AdminTableSearch";
import AdminTableFilters from "@/components/admin/data-display/AdminTableFilters";
import type { FilterConfig } from "@/components/admin/data-display/AdminTableFilters";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import CsvExportButton from "@/components/admin/export/CsvExportButton";
import type { AdminProjectRow, AdminProjectsFilters } from "@/lib/queries/admin-projects";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Nouveau", color: "#5EC8F0", bg: "rgba(94,200,240,.14)" },
  routed: { label: "Routé", color: "var(--admin-success)", bg: "rgba(52,211,153,.14)" },
  unrouted: { label: "Non routé", color: "var(--admin-warning)", bg: "rgba(251,191,36,.14)" },
  suspicious: { label: "Suspect", color: "var(--admin-danger)", bg: "rgba(251,110,91,.14)" },
  closed: { label: "Fermé", color: "var(--admin-text-tertiary)", bg: "var(--admin-hover)" },
};

const FILTERS: FilterConfig[] = [{
  key: "status", label: "Statut",
  options: [
    { label: "Tous", value: "all" }, { label: "Nouveau", value: "new" },
    { label: "Suspect", value: "suspicious" }, { label: "Routé", value: "routed" },
    { label: "Fermé", value: "closed" },
  ],
}];

const BUDGET_LABEL: Record<string, string> = {
  lt500: "< 500 €", "500_2000": "500–2 000 €", "2000_5000": "2–5 k€",
  "5000_15000": "5–15 k€", gt15000: "> 15 k€", unknown: "Budget ?",
};
const URGENCY_LABEL: Record<string, string> = {
  today: "Aujourd'hui", this_week: "Cette semaine", this_month: "Ce mois-ci", not_urgent: "Pas pressé",
};

export default function ProjectsTableClient({
  initialData, initialCount, initialPage, initialTotalPages, filters,
}: {
  initialData: AdminProjectRow[];
  initialCount: number;
  initialPage: number;
  initialTotalPages: number;
  filters: AdminProjectsFilters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v && v !== "all" && v !== "") params.set(k, v); else params.delete(k);
    }
    if (!("page" in updates)) params.delete("page");
    router.push(`/admin/projects?${params.toString()}`);
  }, [router, searchParams]);

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--admin-text)" }}>Projets</h1>
        <CsvExportButton endpoint={`/api/admin/projects?${searchParams.toString()}&format=csv`} filename="projects-export" />
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--admin-text-tertiary)" }}>
        {initialCount} projet{initialCount > 1 ? "s" : ""}
      </p>

      <div className="flex flex-col sm:flex-row gap-2.5 mb-4">
        <div className="w-full sm:w-64">
          <AdminTableSearch value={filters.search || ""} onChange={(v) => updateParams({ search: v })} placeholder="Prénom, ville, email…" />
        </div>
        <AdminTableFilters filters={FILTERS} values={{ status: filters.status || "all" }} onChange={(k, v) => updateParams({ [k]: v })} />
      </div>

      {initialData.length === 0 ? (
        <div className="rounded-2xl px-4 py-14 text-center text-sm" style={{ background: "var(--admin-card)", border: "1px solid var(--admin-border)", color: "var(--admin-text-tertiary)" }}>
          Aucun projet trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
          {initialData.map((p) => {
            const st = STATUS[p.status] || STATUS.new;
            const suspect = p.status === "suspicious";
            return (
              <Link key={p.id} href={`/admin/projects/${p.id}`}
                className="p-4 rounded-2xl transition-colors hover:brightness-125 block"
                style={{ background: "var(--admin-card)", border: `1px solid ${suspect ? "var(--admin-danger)" : "var(--admin-border)"}` }}>
                <div className="flex items-center justify-between gap-2 mb-2">
                  <span className="text-[10px] font-bold px-2 py-1 rounded-full" style={{ color: st.color, background: st.bg }}>{st.label}</span>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
                    #{p.id} · {new Date(p.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                  </span>
                </div>
                <div className="text-[15px] font-bold" style={{ color: "var(--admin-text)" }}>
                  {p.category?.name || "—"} <span className="font-medium" style={{ color: "var(--admin-text-secondary)" }}>· {p.city?.name || "—"}{p.city?.department?.code ? ` (${p.city.department.code})` : ""}</span>
                </div>
                <div className="text-[11px] mt-0.5" style={{ color: "var(--admin-text-tertiary)" }}>
                  {p.first_name} · {BUDGET_LABEL[p.budget] || p.budget} · {URGENCY_LABEL[p.urgency] || p.urgency}
                </div>
                {p.ai_qualification?.summary && (
                  <div className="text-[11px] mt-2 line-clamp-2" style={{ color: "var(--admin-text-secondary)" }}>{p.ai_qualification.summary}</div>
                )}
                <div className="flex items-center gap-3 mt-3 pt-3 text-[11px]" style={{ borderTop: "1px solid var(--admin-border)" }}>
                  <span style={{ color: "var(--admin-text-tertiary)" }}>📡 {p.broadcast_count ?? 0} pro{(p.broadcast_count ?? 0) > 1 ? "s" : ""}</span>
                  <span style={{ color: p.unlockCount > 0 ? "var(--admin-success)" : "var(--admin-text-tertiary)", fontWeight: p.unlockCount > 0 ? 700 : 400 }}>
                    {p.unlockCount > 0 ? `✓ ${p.unlockCount} ont pris` : "0 prise"}
                  </span>
                  {suspect && p.suspicion_score != null && (
                    <span className="ml-auto tabular-nums" style={{ color: "var(--admin-danger)" }}>risque {p.suspicion_score}</span>
                  )}
                </div>
              </Link>
            );
          })}
        </div>
      )}

      <div className="mt-4">
        <AdminTablePagination page={initialPage} totalPages={initialTotalPages} total={initialCount} onPageChange={(p) => updateParams({ page: String(p) })} />
      </div>
    </div>
  );
}

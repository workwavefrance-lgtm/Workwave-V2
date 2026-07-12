"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import Link from "next/link";
import AdminTableSearch from "@/components/admin/data-display/AdminTableSearch";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import CsvExportButton from "@/components/admin/export/CsvExportButton";
import type { AdminProRow, AdminProsFilters } from "@/lib/queries/admin-pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

const AI_SUB: Record<string, { label: string; color: string; bg: string }> = {
  active: { label: "Premium", color: "var(--admin-success)", bg: "rgba(52,211,153,.14)" },
  trialing: { label: "Essai", color: "#5EC8F0", bg: "rgba(94,200,240,.14)" },
  past_due: { label: "Impayé", color: "var(--admin-warning)", bg: "rgba(251,191,36,.14)" },
  canceled: { label: "Résilié", color: "var(--admin-danger)", bg: "rgba(251,110,91,.14)" },
  none: { label: "Gratuit", color: "var(--admin-text-tertiary)", bg: "var(--admin-hover)" },
  free: { label: "Gratuit", color: "var(--admin-text-tertiary)", bg: "var(--admin-hover)" },
};

const VERTICAL_TABS = [
  { value: "all", label: "Tous" }, { value: "btp", label: "BTP" }, { value: "ai", label: "Workwave AI" },
];
const STATE_TABS = [
  { value: "all", label: "Tous" }, { value: "scraped", label: "Non réclamés" }, { value: "claimed", label: "Réclamés" },
];
const AI_STATE_TABS = [
  { value: "all", label: "Tous" }, { value: "scraped", label: "Non réclamés" },
  { value: "claimed_free", label: "Réclamés gratuits" }, { value: "paying", label: "Abonnés Premium" },
  { value: "trialing", label: "Essai" }, { value: "canceled", label: "Résiliés" },
];

function stateBadge(row: AdminProRow): { label: string; color: string; bg: string } {
  if (!row.claimed_at) return { label: "Non réclamé", color: "var(--admin-text-tertiary)", bg: "var(--admin-hover)" };
  if ((AI_CATEGORY_IDS as readonly number[]).includes(row.category_id)) return AI_SUB[row.subscription_status] || AI_SUB.none;
  return { label: "Réclamé", color: "var(--admin-success)", bg: "rgba(52,211,153,.14)" };
}

export default function ProsTableClient({
  initialData, initialCount, initialPage, initialTotalPages, filters,
}: {
  initialData: AdminProRow[];
  initialCount: number;
  initialPage: number;
  initialTotalPages: number;
  filters: AdminProsFilters;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [k, v] of Object.entries(updates)) {
      if (v && v !== "all" && v !== "") params.set(k, v); else params.delete(k);
    }
    if (!("page" in updates)) params.delete("page");
    router.push(`/admin/pros?${params.toString()}`);
  }, [router, searchParams]);

  const activeVertical = filters.vertical || "all";
  const activeState = filters.state || "all";
  const stateTabs = activeVertical === "ai" ? AI_STATE_TABS : STATE_TABS;

  return (
    <div className="max-w-5xl mx-auto">
      <div className="flex items-center justify-between gap-3 mb-1">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--admin-text)" }}>Pros</h1>
        <CsvExportButton endpoint={`/api/admin/pros?${searchParams.toString()}&format=csv`} filename="pros-export" />
      </div>
      <p className="text-xs mb-4" style={{ color: "var(--admin-text-tertiary)" }}>
        {initialCount.toLocaleString("fr-FR")} professionnel{initialCount > 1 ? "s" : ""}
      </p>

      {/* Vertical BTP / AI */}
      <div className="flex gap-1 p-1 rounded-xl mb-3 w-fit" style={{ background: "var(--admin-card)", border: "1px solid var(--admin-border)" }}>
        {VERTICAL_TABS.map((t) => {
          const on = activeVertical === t.value;
          return (
            <button key={t.value} onClick={() => updateParams({ vertical: t.value, state: "all" })}
              className="px-4 py-1.5 text-sm font-semibold rounded-lg transition-colors"
              style={{ background: on ? "var(--admin-accent)" : "transparent", color: on ? "#fff" : "var(--admin-text-secondary)" }}>
              {t.label}
            </button>
          );
        })}
      </div>

      {/* État */}
      <div className="flex flex-wrap gap-2 mb-4">
        {stateTabs.map((t) => {
          const on = activeState === t.value;
          return (
            <button key={t.value} onClick={() => updateParams({ state: t.value })}
              className="px-3 py-1.5 text-xs font-semibold rounded-full transition-colors"
              style={{ background: on ? "var(--admin-accent-soft)" : "var(--admin-card)", color: on ? "var(--admin-accent)" : "var(--admin-text-secondary)", border: `1px solid ${on ? "var(--admin-accent)" : "var(--admin-border)"}` }}>
              {t.label}
            </button>
          );
        })}
      </div>

      <div className="w-full sm:w-80 mb-4">
        <AdminTableSearch value={filters.search || ""} onChange={(v) => updateParams({ search: v })} placeholder="Nom, SIRET, email…" />
      </div>

      {initialData.length === 0 ? (
        <div className="rounded-2xl px-4 py-14 text-center text-sm" style={{ background: "var(--admin-card)", border: "1px solid var(--admin-border)", color: "var(--admin-text-tertiary)" }}>
          Aucun professionnel trouvé
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-2.5">
          {initialData.map((row) => {
            const b = stateBadge(row);
            return (
              <Link key={row.id} href={`/admin/pros/${row.id}`}
                className="flex items-center gap-3 p-3.5 rounded-2xl transition-colors hover:brightness-125"
                style={{ background: "var(--admin-card)", border: `1px solid ${row.deleted_at ? "var(--admin-danger)" : "var(--admin-border)"}` }}>
                <div className="w-10 h-10 rounded-xl grid place-items-center text-sm font-bold shrink-0"
                  style={{ background: "var(--admin-accent-soft)", color: "var(--admin-accent)" }}>
                  {row.name.charAt(0).toUpperCase()}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[14px] font-bold truncate" style={{ color: "var(--admin-text)" }}>{row.name}</div>
                  <div className="text-[11px] truncate" style={{ color: "var(--admin-text-tertiary)" }}>
                    {row.category?.name || "—"} · {row.city?.name || "—"}{row.city?.department?.code ? ` (${row.city.department.code})` : ""}
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 shrink-0">
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full" style={{ color: b.color, background: b.bg }}>{b.label}</span>
                  <span className="text-[10px] tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}
                    title={row.claimed_at ? "Inscrit le" : "Fiche créée le"}>
                    {new Date(row.claimed_at || row.created_at).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" })}
                  </span>
                  {row.deleted_at && <span className="text-[9px]" style={{ color: "var(--admin-danger)" }}>supprimé</span>}
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

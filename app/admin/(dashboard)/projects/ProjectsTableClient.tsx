"use client";

import { useRouter, useSearchParams } from "next/navigation";
import { useCallback } from "react";
import Link from "next/link";
import AdminPageHeading from "@/components/admin/layout/AdminPageHeading";
import AdminTableSearch from "@/components/admin/data-display/AdminTableSearch";
import AdminTableFilters from "@/components/admin/data-display/AdminTableFilters";
import type { FilterConfig } from "@/components/admin/data-display/AdminTableFilters";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import CsvExportButton from "@/components/admin/export/CsvExportButton";
import type { AdminProjectRow, AdminProjectsFilters } from "@/lib/queries/admin-projects";

const STATUS: Record<string, { label: string; color: string; bg: string }> = {
  new: { label: "Nouveau", color: "var(--admin-info)", bg: "rgba(94,200,240,.14)" },
  routed: { label: "Diffusé", color: "var(--admin-success)", bg: "rgba(52,211,153,.14)" },
  unrouted: { label: "Non diffusé", color: "var(--admin-warning)", bg: "rgba(251,191,36,.14)" },
  suspicious: { label: "Suspect", color: "var(--admin-danger)", bg: "rgba(251,110,91,.14)" },
  closed: { label: "Fermé", color: "var(--admin-text-tertiary)", bg: "var(--admin-hover)" },
};

const FILTERS: FilterConfig[] = [{
  key: "status", label: "Statut",
  options: [
    { label: "Tous", value: "all" }, { label: "Nouveau", value: "new" },
    { label: "Suspect", value: "suspicious" }, { label: "Diffusé", value: "routed" },
    { label: "Fermé", value: "closed" },
  ],
}];

const BUDGET_LABEL: Record<string, string> = {
  lt500: "< 500 €", "500_2000": "500-2 000 €", "2000_5000": "2-5 k€",
  "5000_15000": "5-15 k€", gt15000: "> 15 k€", unknown: "Budget ?",
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
    <div>
      <AdminPageHeading eyebrow="Les projets" title="Chaque demande compte." subtitle="Gardez le fil." description={`${initialCount.toLocaleString("fr-FR")} projet${initialCount > 1 ? "s" : ""} dans cette sélection. Retrouvez leur diffusion, les contacts débloqués et les points à vérifier.`} actions={<CsvExportButton endpoint={`/api/admin/projects?${searchParams.toString()}&format=csv`} filename="projects-export" />} />

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
        <div className="admin-surface overflow-hidden">
          <div className="overflow-x-auto">
            <table className="admin-table admin-project-table w-full text-left">
              <thead style={{background:"var(--admin-hover)",color:"var(--admin-text-secondary)"}}><tr>{["Le projet", "Demandeur", "Statut", "Diffusion", "Contacts"].map(label => <th key={label} scope="col">{label}</th>)}</tr></thead>
              <tbody>{initialData.map(p => {
                const st = STATUS[p.status] || {label:p.status,color:"var(--admin-text-secondary)",bg:"var(--admin-hover)"};
                return <tr key={p.id} style={{borderTop:"1px solid var(--admin-border)"}}>
                  <td><Link href={`/admin/projects/${p.id}`} className="font-semibold">{p.category?.name || "Catégorie non renseignée"} · {p.city?.name || "Ville non renseignée"}{p.city?.department?.code ? ` (${p.city.department.code})` : ""}</Link>
                    <small>#{p.id} · {new Date(p.created_at).toLocaleString("fr-FR",{day:"2-digit",month:"short",hour:"2-digit",minute:"2-digit",timeZone:"Europe/Paris"})}</small>
                    {p.ai_qualification?.summary && <small className="line-clamp-2" title={p.ai_qualification.summary}>{p.ai_qualification.summary}</small>}
                  </td>
                  <td>{p.first_name || "Non renseigné"}<small>{BUDGET_LABEL[p.budget] || p.budget}</small><small>{URGENCY_LABEL[p.urgency] || p.urgency}</small></td>
                  <td><span className="inline-block rounded-full px-3 py-1 text-[11px]" style={{background:st.bg,color:st.color}}>{st.label}</span>{p.status === "suspicious" && p.suspicion_score != null && <small>Score de risque : {p.suspicion_score}</small>}</td>
                  <td className="tabular-nums">{p.broadcast_count ?? 0}<small>professionnels</small></td>
                  <td className="tabular-nums"><strong style={{color:p.unlockCount > 0 ? "var(--admin-success)" : "var(--admin-text-secondary)"}}>{p.unlockCount}</strong><small>déblocage{p.unlockCount > 1 ? "s" : ""}</small><Link href={`/admin/projects/${p.id}`} className="inline-block mt-3 text-[11px]" aria-label={`Ouvrir le projet ${p.id}`}>Ouvrir ↗</Link></td>
                </tr>;
              })}</tbody>
            </table>
          </div>
        </div>
      )}

      <div className="mt-4">
        <AdminTablePagination page={initialPage} totalPages={initialTotalPages} total={initialCount} onPageChange={(p) => updateParams({ page: String(p) })} />
      </div>
    </div>
  );
}

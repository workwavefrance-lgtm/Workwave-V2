"use client";

import { useMemo, useState } from "react";
import type { ProSurveyResponse } from "@/lib/types/database";
import AdminTable, { type AdminColumn } from "@/components/admin/data-display/AdminTable";
import AdminBadge from "@/components/admin/data-display/AdminBadge";
import CsvExportButton from "@/components/admin/export/CsvExportButton";
import type { SortDirection } from "@/lib/types/admin";

function countBy(values: (string | null | undefined)[]): Map<string, number> {
  const m = new Map<string, number>();
  for (const v of values) {
    if (!v) continue;
    m.set(v, (m.get(v) || 0) + 1);
  }
  return m;
}

function sortedEntries(m: Map<string, number>): [string, number][] {
  return [...m.entries()].sort((a, b) => b[1] - a[1]);
}

function Bars({ entries, total }: { entries: [string, number][]; total: number }) {
  if (entries.length === 0) {
    return <p className="text-xs" style={{ color: "var(--admin-text-tertiary)" }}>Aucune donnée.</p>;
  }
  const max = entries[0][1] || 1;
  return (
    <div className="space-y-2.5">
      {entries.map(([label, count]) => {
        const pct = total > 0 ? Math.round((count / total) * 100) : 0;
        return (
          <div key={label} className="flex items-center gap-3">
            <span className="text-xs w-1/2 shrink-0 truncate" style={{ color: "var(--admin-text-secondary)" }} title={label}>
              {label}
            </span>
            <div className="flex-1 h-2 rounded-full overflow-hidden" style={{ backgroundColor: "var(--admin-border)" }}>
              <div className="h-full rounded-full" style={{ width: `${(count / max) * 100}%`, backgroundColor: "var(--admin-accent)" }} />
            </div>
            <span className="text-xs tabular-nums w-16 text-right shrink-0" style={{ color: "var(--admin-text)" }}>
              {count} · {pct}%
            </span>
          </div>
        );
      })}
    </div>
  );
}

function Card({ title, children, action }: { title: string; children: React.ReactNode; action?: React.ReactNode }) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--admin-card)", borderColor: "var(--admin-border)" }}>
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-sm font-semibold" style={{ color: "var(--admin-text)" }}>{title}</h2>
        {action}
      </div>
      {children}
    </div>
  );
}

function Stat({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="rounded-xl border p-5" style={{ backgroundColor: "var(--admin-card)", borderColor: "var(--admin-border)" }}>
      <p className="text-2xl font-bold tabular-nums" style={{ color: "var(--admin-text)" }}>{value}</p>
      <p className="text-xs mt-1" style={{ color: "var(--admin-text-tertiary)" }}>{label}</p>
    </div>
  );
}

const selectStyle: React.CSSProperties = {
  height: 36, padding: "0 12px", borderRadius: 10, fontSize: 13,
  backgroundColor: "var(--admin-card)", color: "var(--admin-text)",
  border: "1px solid var(--admin-border)", outline: "none", cursor: "pointer",
};

export default function EnqueteClient({ responses }: { responses: ProSurveyResponse[] }) {
  const [fMetier, setFMetier] = useState("");
  const [fTaille, setFTaille] = useState("");
  const [fDept, setFDept] = useState("");
  const [sortDir, setSortDir] = useState<SortDirection>("desc");

  const total = responses.length;
  const avecContact = responses.filter((r) => r.contact && r.contact.trim()).length;

  const topTaches = useMemo(
    () => sortedEntries(countBy(responses.flatMap((r) => r.taches_chrono || []))),
    [responses]
  );
  const heuresDist = useMemo(() => sortedEntries(countBy(responses.map((r) => r.heures_admin))), [responses]);
  const outilsDist = useMemo(() => sortedEntries(countBy(responses.map((r) => r.outils_actuels))), [responses]);

  const metiers = useMemo(() => [...new Set(responses.map((r) => r.metier).filter(Boolean))].sort(), [responses]);
  const tailles = useMemo(() => [...new Set(responses.map((r) => r.taille).filter(Boolean) as string[])], [responses]);

  const filtered = useMemo(() => {
    const rows = responses.filter((r) => {
      if (fMetier && r.metier !== fMetier) return false;
      if (fTaille && r.taille !== fTaille) return false;
      if (fDept && !(r.departement || "").toLowerCase().includes(fDept.toLowerCase().trim())) return false;
      return true;
    });
    return [...rows].sort((a, b) => {
      const cmp = a.created_at.localeCompare(b.created_at);
      return sortDir === "asc" ? cmp : -cmp;
    });
  }, [responses, fMetier, fTaille, fDept, sortDir]);

  const fmtDate = (s: string) =>
    new Date(s).toLocaleDateString("fr-FR", { day: "2-digit", month: "short", year: "2-digit" }) +
    " " + new Date(s).toLocaleTimeString("fr-FR", { hour: "2-digit", minute: "2-digit" });

  const columns: AdminColumn<ProSurveyResponse>[] = [
    { key: "created_at", label: "Date", sortable: true, render: (r) => <span className="tabular-nums whitespace-nowrap">{fmtDate(r.created_at)}</span> },
    { key: "metier", label: "Métier", render: (r) => <span className="font-medium whitespace-nowrap">{r.metier}</span> },
    { key: "taille", label: "Taille", render: (r) => r.taille || "—" },
    { key: "departement", label: "Dépt", render: (r) => r.departement || "—" },
    { key: "taches", label: "Tâches chronophages", render: (r) => <span className="block max-w-[260px]">{(r.taches_chrono || []).join(" · ") || "—"}</span> },
    { key: "heures", label: "Heures admin", render: (r) => <span className="whitespace-nowrap">{r.heures_admin || "—"}</span> },
    { key: "outils", label: "Outils", render: (r) => <span className="whitespace-nowrap">{r.outils_actuels || "—"}{r.outils_detail ? ` (${r.outils_detail})` : ""}</span> },
    { key: "corvee", label: "Corvée à supprimer", render: (r) => <span className="block max-w-[280px] truncate" title={r.corvee_libre || ""}>{r.corvee_libre || "—"}</span> },
    { key: "outils_essayes", label: "Outils essayés", render: (r) => <span className="block max-w-[280px] truncate" title={r.outils_essayes || ""}>{r.outils_essayes || "—"}</span> },
    {
      key: "contact", label: "Contact",
      render: (r) =>
        r.contact && r.contact.trim() ? (
          <span className="whitespace-nowrap">
            <AdminBadge variant="success" dot>{r.prenom || "—"}</AdminBadge>{" "}
            <span style={{ color: "var(--admin-text-secondary)" }}>{r.contact}</span>
          </span>
        ) : (
          <span style={{ color: "var(--admin-text-tertiary)" }}>—</span>
        ),
    },
  ];

  return (
    <div className="space-y-6">
      {/* En-tête */}
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="text-xl font-bold" style={{ color: "var(--admin-text)" }}>Enquête pros</h1>
          <p className="text-xs mt-0.5" style={{ color: "var(--admin-text-tertiary)" }}>Sondage de découverte — douleurs et liste à rappeler</p>
        </div>
        <CsvExportButton endpoint="/api/admin/enquete/export" filename="enquete-pros.csv" />
      </div>

      {/* Compteurs */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        <Stat label="Réponses" value={total} />
        <Stat label="Avec un contact (à rappeler)" value={avecContact} />
        <Stat label="Métiers représentés" value={metiers.length} />
        <Stat label="Taux de contact" value={total ? Math.round((avecContact / total) * 100) + "%" : "—"} />
      </div>

      {/* Graphiques */}
      <Card title="Top des tâches chronophages">
        <Bars entries={topTaches} total={total} />
      </Card>
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <Card title="Heures d'administratif / semaine">
          <Bars entries={heuresDist} total={total} />
        </Card>
        <Card title="Outils utilisés aujourd'hui">
          <Bars entries={outilsDist} total={total} />
        </Card>
      </div>

      {/* Tableau */}
      <Card
        title={`Réponses (${filtered.length})`}
        action={
          <div className="flex items-center gap-2 flex-wrap">
            <select value={fMetier} onChange={(e) => setFMetier(e.target.value)} style={selectStyle}>
              <option value="">Tous métiers</option>
              {metiers.map((m) => <option key={m} value={m}>{m}</option>)}
            </select>
            <select value={fTaille} onChange={(e) => setFTaille(e.target.value)} style={selectStyle}>
              <option value="">Toutes tailles</option>
              {tailles.map((t) => <option key={t} value={t}>{t}</option>)}
            </select>
            <input value={fDept} onChange={(e) => setFDept(e.target.value)} placeholder="Dépt…" style={{ ...selectStyle, width: 90, cursor: "text" }} />
          </div>
        }
      >
        <AdminTable
          columns={columns}
          data={filtered}
          sortKey="created_at"
          sortDir={sortDir}
          onSort={() => setSortDir((d) => (d === "asc" ? "desc" : "asc"))}
          emptyMessage="Aucune réponse pour ce filtre."
        />
      </Card>
    </div>
  );
}

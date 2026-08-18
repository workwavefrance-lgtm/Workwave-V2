"use client";

import { useCallback, useState, useTransition } from "react";
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

  // ACTIONS DIRECTES DEPUIS LA LISTE (18/08/2026, demande Willy).
  // Avant : il fallait ouvrir un ticket pour le fermer, soit trois clics et un
  // aller-retour de page par ligne. Sur une vague de six publicites, c'est
  // dix-huit clics. L'interface serveur pour changer un statut existait deja
  // (PATCH /api/admin/support/[id]) : il n'y avait que l'affichage a faire.
  const [enCours, demarrer] = useTransition();
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [traites, setTraites] = useState<Set<number>>(new Set());

  const changerStatut = useCallback(
    async (ids: number[], statut: "closed" | "resolved") => {
      // Marquage optimiste : la ligne s'estompe tout de suite, on n'attend pas
      // le rechargement de la page pour que le clic paraisse pris en compte.
      setTraites((prec) => new Set([...prec, ...ids]));
      const reponses = await Promise.all(
        ids.map((id) =>
          fetch(`/api/admin/support/${id}`, {
            method: "PATCH",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ status: statut }),
          }).then((r) => r.ok)
        )
      );
      const echecs = ids.filter((_, i) => !reponses[i]);
      if (echecs.length > 0) {
        // On ne ment pas sur le resultat : les lignes qui ont echoue
        // redeviennent normales et le probleme est dit.
        setTraites((prec) => {
          const n = new Set(prec);
          for (const id of echecs) n.delete(id);
          return n;
        });
        alert(
          `Impossible de mettre a jour ${echecs.length} ticket(s) : #${echecs.join(", #")}. Reessayez.`
        );
      }
      setSelection(new Set());
      demarrer(() => router.refresh());
    },
    [router]
  );

  const basculer = useCallback((id: number) => {
    setSelection((prec) => {
      const n = new Set(prec);
      if (n.has(id)) n.delete(id);
      else n.add(id);
      return n;
    });
  }, []);

  const toutSelectionner = useCallback(() => {
    setSelection((prec) =>
      prec.size === initialData.length ? new Set() : new Set(initialData.map((t) => t.id))
    );
  }, [initialData]);

  const columns: AdminColumn<SupportTicket>[] = [
    {
      key: "selection",
      label: "",
      render: (row) => (
        <input
          type="checkbox"
          aria-label={`Selectionner le ticket ${row.id}`}
          checked={selection.has(row.id)}
          onClick={(e) => e.stopPropagation()}
          onChange={() => basculer(row.id)}
          className="w-4 h-4 cursor-pointer accent-[var(--admin-accent)]"
        />
      ),
    },
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
            {row.requester_email || "-"}
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
    {
      key: "actions",
      label: "",
      render: (row) => {
        if (row.status === "closed" || traites.has(row.id)) return null;
        // stopPropagation partout : la ligne entiere ouvre le ticket, ces
        // boutons ne doivent surtout pas declencher cette navigation.
        return (
          <div className="flex gap-1.5 justify-end" onClick={(e) => e.stopPropagation()}>
            {row.status !== "resolved" ? (
              <button
                onClick={() => changerStatut([row.id], "resolved")}
                disabled={enCours}
                title="Marquer comme résolu"
                className="px-2 py-1 text-[10px] font-semibold rounded-md transition-opacity hover:opacity-80 disabled:opacity-40"
                style={{
                  color: "var(--admin-success, #34d399)",
                  background: "rgba(52,211,153,.12)",
                }}
              >
                Résolu
              </button>
            ) : null}
            <button
              onClick={() => changerStatut([row.id], "closed")}
              disabled={enCours}
              title="Fermer sans réponse"
              className="px-2 py-1 text-[10px] font-semibold rounded-md transition-opacity hover:opacity-80 disabled:opacity-40"
              style={{
                color: "var(--admin-text-secondary)",
                background: "var(--admin-bg, rgba(255,255,255,.06))",
              }}
            >
              Fermer
            </button>
          </div>
        );
      },
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

      {/* Barre d'actions groupees : n'apparait que quand quelque chose est
          coche, pour ne pas encombrer l'ecran le reste du temps. */}
      {selection.size > 0 ? (
        <div
          className="flex items-center gap-3 mb-3 px-3 py-2 rounded-xl"
          style={{ background: "var(--admin-card)", border: "1px solid var(--admin-accent)" }}
        >
          <span className="text-xs font-semibold" style={{ color: "var(--admin-text)" }}>
            {selection.size} ticket{selection.size > 1 ? "s" : ""} sélectionné
            {selection.size > 1 ? "s" : ""}
          </span>
          <button
            onClick={() => changerStatut([...selection], "closed")}
            disabled={enCours}
            className="px-3 py-1.5 text-xs font-semibold rounded-lg disabled:opacity-40"
            style={{ background: "var(--admin-accent)", color: "#fff" }}
          >
            {enCours ? "En cours…" : "Fermer la sélection"}
          </button>
          <button
            onClick={() => setSelection(new Set())}
            className="text-xs"
            style={{ color: "var(--admin-text-tertiary)" }}
          >
            Annuler
          </button>
          <button
            onClick={toutSelectionner}
            className="text-xs ml-auto"
            style={{ color: "var(--admin-text-secondary)" }}
          >
            {selection.size === initialData.length ? "Tout décocher" : "Tout cocher"}
          </button>
        </div>
      ) : null}

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

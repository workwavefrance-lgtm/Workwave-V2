"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import type { LeaConversationRow } from "@/lib/queries/admin-lea-journal";
import { TimeAgo } from "../support-ui";

/**
 * Libellés et couleurs des motifs de surveillance. L'ordre compte : les motifs
 * les plus graves d'abord, pour que l'œil les attrape en premier dans la liste.
 */
const FLAG_META: Record<string, { label: string; classe: string }> = {
  juridique: { label: "Juridique", classe: "bg-red-500/10 text-red-600 dark:text-red-400" },
  remboursement: { label: "Remboursement", classe: "bg-orange-500/10 text-orange-600 dark:text-orange-400" },
  colere: { label: "Colère", classe: "bg-amber-500/10 text-amber-600 dark:text-amber-500" },
  donnees: { label: "Données perso", classe: "bg-purple-500/10 text-purple-600 dark:text-purple-400" },
  refus: { label: "Léa a refusé", classe: "bg-blue-500/10 text-blue-600 dark:text-blue-400" },
  escalade: { label: "Ticket ouvert", classe: "bg-emerald-500/10 text-emerald-600 dark:text-emerald-400" },
  echantillon: { label: "Échantillon", classe: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]" },
};

const ONGLETS: { value: string; label: string }[] = [
  { value: "todo", label: "À relire" },
  { value: "", label: "Toutes" },
  { value: "juridique", label: "Juridique" },
  { value: "remboursement", label: "Remboursement" },
  { value: "colere", label: "Colère" },
  { value: "donnees", label: "Données perso" },
  { value: "refus", label: "Refus" },
  { value: "echantillon", label: "Échantillon" },
];

export default function LeaJournalClient({
  rows,
  count,
  page,
  totalPages,
  flag,
  counts,
}: {
  rows: LeaConversationRow[];
  count: number;
  page: number;
  totalPages: number;
  flag: string;
  counts: Record<string, number>;
}) {
  const router = useRouter();
  const [ouvert, setOuvert] = useState<number | null>(null);
  const [enCours, setEnCours] = useState<number | null>(null);

  function allerA(nouveauFlag: string, nouvellePage = 1) {
    const p = new URLSearchParams();
    if (nouveauFlag) p.set("flag", nouveauFlag);
    if (nouvellePage > 1) p.set("page", String(nouvellePage));
    router.push(`/admin/support/conversations${p.toString() ? `?${p}` : ""}`);
  }

  async function marquerRelu(id: number) {
    setEnCours(id);
    try {
      await fetch(`/api/admin/lea-journal/${id}/reviewed`, { method: "POST" });
      router.refresh();
    } finally {
      setEnCours(null);
    }
  }

  return (
    <div>
      <div className="mb-6">
        <div className="flex items-center gap-3 mb-1">
          <h1 className="text-2xl font-bold text-[var(--text-primary)]">
            Conversations de Léa
          </h1>
          <Link
            href="/admin/support"
            className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors"
          >
            → Tickets
          </Link>
        </div>
        <p className="text-sm text-[var(--text-secondary)]">
          Léa répond seule aux visiteurs. On ne conserve ici que les échanges
          qui méritent un œil : demandes sensibles, refus de sa part, et un
          échantillon de 3 % du fonctionnement normal. Conservation 90 jours.
        </p>
      </div>

      <div className="flex flex-wrap gap-2 mb-6">
        {ONGLETS.map((o) => {
          const actif = flag === o.value;
          const n = counts[o.value] ?? 0;
          return (
            <button
              key={o.value || "all"}
              onClick={() => allerA(o.value)}
              className={`px-3.5 py-1.5 rounded-full text-sm font-medium transition-all duration-200 ${
                actif
                  ? "bg-[var(--accent)] text-white"
                  : "bg-[var(--bg-secondary)] text-[var(--text-secondary)] hover:text-[var(--text-primary)] border border-[var(--border)]"
              }`}
            >
              {o.label}
              {n > 0 && <span className="ml-1.5 opacity-70">{n}</span>}
            </button>
          );
        })}
      </div>

      {rows.length === 0 ? (
        <div className="border border-[var(--border)] rounded-2xl p-10 text-center">
          <p className="text-[var(--text-primary)] font-semibold mb-1">
            Rien à relire
          </p>
          <p className="text-sm text-[var(--text-secondary)]">
            Aucune conversation ne correspond à ce filtre. Si le journal reste
            vide alors que le chat est utilisé, c&apos;est bon signe : rien de
            sensible n&apos;a été détecté.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {rows.map((r) => {
            const estOuvert = ouvert === r.id;
            return (
              <div
                key={r.id}
                className={`border rounded-2xl overflow-hidden transition-all duration-200 ${
                  r.reviewed_at
                    ? "border-[var(--border)] opacity-60"
                    : "border-[var(--border)] hover:border-[var(--accent)]"
                }`}
              >
                <button
                  onClick={() => setOuvert(estOuvert ? null : r.id)}
                  className="w-full text-left p-4 sm:p-5"
                >
                  <div className="flex flex-wrap items-center gap-2 mb-2">
                    {r.flags.map((f) => (
                      <span
                        key={f}
                        className={`px-2 py-0.5 rounded-full text-xs font-semibold ${
                          FLAG_META[f]?.classe ?? "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]"
                        }`}
                      >
                        {FLAG_META[f]?.label ?? f}
                      </span>
                    ))}
                    <span className="text-xs text-[var(--text-secondary)] ml-auto">
                      <TimeAgo iso={r.created_at} />
                    </span>
                  </div>
                  <p className="text-sm text-[var(--text-primary)] line-clamp-2 font-mono">
                    {r.transcript.slice(0, 220)}…
                  </p>
                  <div className="flex flex-wrap items-center gap-3 mt-2 text-xs text-[var(--text-secondary)]">
                    <span>{r.message_count} message(s)</span>
                    {r.pathname && <span className="truncate">{r.pathname}</span>}
                    {r.ticket_id && (
                      <span className="text-[var(--accent)]">
                        ticket #{r.ticket_id}
                      </span>
                    )}
                    {r.reviewed_at && <span>relu</span>}
                  </div>
                </button>

                {estOuvert && (
                  <div className="border-t border-[var(--border)] p-4 sm:p-5 bg-[var(--bg-secondary)]">
                    <pre className="whitespace-pre-wrap font-mono text-xs text-[var(--text-primary)] leading-relaxed mb-4 max-h-[28rem] overflow-y-auto">
                      {r.transcript}
                    </pre>
                    <div className="flex flex-wrap gap-2">
                      {r.ticket_id && (
                        <Link
                          href={`/admin/support/${r.ticket_id}`}
                          className="px-4 py-2 rounded-xl text-sm font-semibold border border-[var(--border)] text-[var(--text-primary)] hover:border-[var(--accent)] transition-colors duration-200"
                        >
                          Ouvrir le ticket #{r.ticket_id}
                        </Link>
                      )}
                      {!r.reviewed_at && (
                        <button
                          onClick={() => marquerRelu(r.id)}
                          disabled={enCours === r.id}
                          className="px-4 py-2 rounded-xl text-sm font-semibold bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white transition-colors duration-200 disabled:opacity-50"
                        >
                          {enCours === r.id ? "…" : "Marquer comme relu"}
                        </button>
                      )}
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>
      )}

      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-3 mt-8">
          <button
            onClick={() => allerA(flag, page - 1)}
            disabled={page <= 1}
            className="px-4 py-2 rounded-xl text-sm border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-40"
          >
            Précédent
          </button>
          <span className="text-sm text-[var(--text-secondary)]">
            {page} / {totalPages} · {count} au total
          </span>
          <button
            onClick={() => allerA(flag, page + 1)}
            disabled={page >= totalPages}
            className="px-4 py-2 rounded-xl text-sm border border-[var(--border)] text-[var(--text-primary)] disabled:opacity-40"
          >
            Suivant
          </button>
        </div>
      )}
    </div>
  );
}

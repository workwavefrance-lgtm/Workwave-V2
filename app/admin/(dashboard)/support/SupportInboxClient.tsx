"use client";

import { useCallback, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { MessageCircle, ArrowUpRight } from "lucide-react";
import AdminTablePagination from "@/components/admin/data-display/AdminTablePagination";
import AdminTableSearch from "@/components/admin/data-display/AdminTableSearch";
import AdminPageHeading from "@/components/admin/layout/AdminPageHeading";
import AdminButton from "@/components/admin/forms/AdminButton";
import { useToast } from "@/components/admin/shell/AdminToast";
import type { SupportTicket } from "@/lib/support/tickets";
import type { AdminTicketDetail } from "@/lib/queries/admin-support";
import SupportTicketClient from "./[id]/SupportTicketClient";
import { STATUS_META, STATUS_TABS, SOURCE_LABEL, CATEGORY_LABEL, TimeAgo, type TicketStatus } from "./support-ui";

export default function SupportInboxClient({ initialData, initialCount, initialPage, initialTotalPages, counts, filters, selectedDetail }: {
  initialData: SupportTicket[]; initialCount: number; initialPage: number; initialTotalPages: number;
  counts: Record<string, number>; filters: { status: string; search: string; page: number; pageSize: number };
  selectedDetail: AdminTicketDetail | null;
}) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { toast } = useToast();
  const [selection, setSelection] = useState<Set<number>>(new Set());
  const [busy, setBusy] = useState(false);
  // Keep unsent text when switching conversations in this inbox, never in browser storage.
  const [drafts, setDrafts] = useState<Record<number, string>>({});
  const hasDrafts = Object.values(drafts).some(value => value.trim());
  useEffect(() => {
    if (!hasDrafts) return;
    const warn = (e: BeforeUnloadEvent) => { e.preventDefault(); e.returnValue = ""; };
    window.addEventListener("beforeunload", warn);
    return () => window.removeEventListener("beforeunload", warn);
  }, [hasDrafts]);

  const updateParams = useCallback((updates: Record<string, string>) => {
    const params = new URLSearchParams(searchParams.toString());
    for (const [key, value] of Object.entries(updates)) {
      if (value) params.set(key, value); else params.delete(key);
    }
    if (!("page" in updates) && !("ticket" in updates)) params.delete("page");
    if (!("ticket" in updates)) params.delete("ticket");
    setSelection(new Set());
    router.push(`/admin/support?${params.toString()}`, { scroll: false });
  }, [router, searchParams]);

  async function changeStatus(ids: number[], status: "closed" | "resolved") {
    if (busy || !ids.length) return;
    setBusy(true);
    try {
      const results = await Promise.allSettled(ids.map(id => fetch(`/api/admin/support/${id}`, {
        method: "PATCH", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }),
      }).then(async response => response.ok && (await response.json()).success === true)));
      const failed = ids.filter((_, i) => results[i].status !== "fulfilled" || !(results[i] as PromiseFulfilledResult<boolean>).value);
      setSelection(new Set(failed));
      if (failed.length) toast(`Échec pour ${failed.length} ticket(s) : #${failed.join(", #")}. Vous pouvez réessayer.`, "error");
      else toast(status === "resolved" ? "Ticket(s) résolu(s)" : "Ticket(s) fermé(s)", "success");
      router.refresh();
    } finally { setBusy(false); }
  }
  const visibleSelection = initialData.filter(t => selection.has(t.id)).map(t => t.id);
  const selectedId = selectedDetail?.ticket.id;
  return <div>
    <AdminPageHeading eyebrow="Les personnes avant les tickets" title="Une question." subtitle="Une vraie attention."
      description="Le contexte, la conversation et la prochaine action au même endroit."
      actions={<Link href="/admin/support/conversations" className="text-xs text-[var(--admin-accent)] inline-flex items-center gap-2">Conversations avec Léa <ArrowUpRight size={14} /></Link>} />
    <fieldset disabled={busy} className="admin-support-toolbar">
      <div className="flex gap-1 p-1 rounded-full max-w-full overflow-x-auto bg-[var(--admin-card)] border border-[var(--admin-border)]" aria-label="Statut des tickets">
        {STATUS_TABS.map(t => <button key={t.value} type="button" aria-pressed={filters.status === t.value}
          onClick={() => updateParams({ status: t.value })}
          className={`px-3 py-2 text-xs rounded-full whitespace-nowrap ${filters.status === t.value ? "bg-[var(--admin-accent-soft)] text-[var(--admin-accent)]" : "text-[var(--admin-text-secondary)]"}`}>
          {t.label}{t.value !== "all" && <span className="ml-1.5 tabular-nums">{counts[t.value] ?? 0}</span>}
        </button>)}
      </div>
      <div className="w-full sm:w-64"><AdminTableSearch value={filters.search} onChange={search => updateParams({ search })} placeholder="Email, nom, objet…" /></div>
    </fieldset>
    {visibleSelection.length > 0 && <div className="admin-surface flex flex-wrap gap-3 items-center p-3 mb-4">
      <span className="text-xs">{visibleSelection.length} sélectionné(s)</span>
      <AdminButton size="sm" variant="secondary" loading={busy} onClick={() => changeStatus(visibleSelection, "resolved")}>Résoudre la sélection</AdminButton>
      <AdminButton size="sm" variant="secondary" disabled={busy} onClick={() => changeStatus(visibleSelection, "closed")}>Fermer la sélection</AdminButton>
      <button type="button" className="text-xs" onClick={() => setSelection(new Set())}>Annuler la sélection</button>
    </div>}
    <div className="admin-support-layout admin-surface">
      <section className="admin-support-list" aria-label="Boîte de réception">
        <div className="flex items-center justify-between gap-3 px-2 mb-4">
          <p className="text-xs text-[var(--admin-text-secondary)]">{initialCount.toLocaleString("fr-FR")} ticket(s)</p>
          <label className="text-[11px] flex items-center gap-2"><input type="checkbox" disabled={busy || !initialData.length}
            checked={initialData.length > 0 && visibleSelection.length === initialData.length}
            onChange={e => setSelection(new Set(e.target.checked ? initialData.map(t => t.id) : []))} />Tout sélectionner</label>
        </div>
        {initialData.length === 0 && <p className="py-12 text-center text-xs text-[var(--admin-text-secondary)]">Aucun ticket pour ces critères.</p>}
        {initialData.map(t => {
          const meta = STATUS_META[t.status as TicketStatus] || STATUS_META.open;
          return <article key={t.id} className="admin-ticket-row" data-active={selectedId === t.id}>
            <input type="checkbox" className="mt-2 shrink-0" disabled={busy} aria-label={`Sélectionner le ticket ${t.id}`}
              checked={selection.has(t.id)} onChange={e => setSelection(prev => { const next = new Set(prev); if (e.target.checked) next.add(t.id); else next.delete(t.id); return next; })} />
            <span className="admin-ticket-avatar" aria-hidden="true">{(t.requester_name || t.requester_email || "?").slice(0,2).toUpperCase()}</span>
            <div className="min-w-0 flex-1">
              <button type="button" disabled={busy} className="admin-ticket-link text-left w-full" onClick={() => updateParams({ ticket: String(t.id) })} aria-current={selectedId === t.id ? "true" : undefined}>
                <strong>{t.subject || "Sans objet"}</strong><small>{t.requester_name || t.requester_email || "Demandeur"} · #{t.id}</small>
                <small><TimeAgo iso={t.last_message_at} /> · {SOURCE_LABEL[t.source] || t.source}</small>
                <small>{t.category && `${CATEGORY_LABEL[t.category] || t.category} · `}{drafts[t.id]?.trim() ? "Brouillon non envoyé" : meta.label}</small>
                {(t.is_legal || t.priority === "urgent") && <span className="text-[10px] text-[var(--admin-danger)] font-semibold">{t.is_legal ? "Demande légale" : "Urgent"}</span>}
              </button>
              <div className="flex gap-3 mt-2 text-[10px]">
                {t.status !== "closed" && t.status !== "resolved" && <button type="button" disabled={busy} className="text-[var(--admin-success)]" onClick={() => changeStatus([t.id], "resolved")}>Résoudre</button>}
                {t.status !== "closed" && <button type="button" disabled={busy} className="text-[var(--admin-text-secondary)]" onClick={() => changeStatus([t.id], "closed")}>Fermer</button>}
              </div>
            </div>
          </article>;
        })}
        <AdminTablePagination page={initialPage} totalPages={initialTotalPages} total={initialCount} onPageChange={page => updateParams({ page: String(page) })} />
      </section>
      <section className="admin-support-conversation" aria-label="Conversation sélectionnée">
        {selectedDetail ? <SupportTicketClient key={selectedDetail.ticket.id} detail={selectedDetail} embedded locked={busy} onPendingChange={setBusy}
          draftValue={drafts[selectedDetail.ticket.id] || ""}
          onDraftChange={value => setDrafts(prev => ({ ...prev, [selectedDetail.ticket.id]: value }))} /> :
          <div className="min-h-80 flex flex-col items-center justify-center gap-4 text-[var(--admin-text-secondary)]"><MessageCircle size={30} strokeWidth={1.4} /><p className="text-sm">Sélectionnez une conversation disponible.</p></div>}
      </section>
    </div>
    <p className="text-[11px] text-[var(--admin-text-tertiary)] mt-3">Les réponses sont envoyées par email. Les notes internes restent dans le dossier. Les brouillons de cette boîte sont conservés en mémoire pendant la navigation entre ses tickets.</p>
  </div>;
}

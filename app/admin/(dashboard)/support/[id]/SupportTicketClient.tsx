"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import AdminButton from "@/components/admin/forms/AdminButton";
import AdminBadge from "@/components/admin/data-display/AdminBadge";
import { useToast } from "@/components/admin/shell/AdminToast";
import type { AdminTicketDetail } from "@/lib/queries/admin-support";
import type { SupportAuthorRole } from "@/lib/support/tickets";
import {
  STATUS_META,
  STATUS_TABS,
  SOURCE_LABEL,
  CATEGORY_LABEL,
  TimeAgo,
  type TicketStatus,
} from "../support-ui";

function Card({ title, children }: { title?: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{ backgroundColor: "var(--admin-card)", border: "1px solid var(--admin-border)" }}
    >
      {title ? (
        <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
          {title}
        </h2>
      ) : null}
      {children}
    </div>
  );
}

const AUTHOR_LABEL: Record<SupportAuthorRole, string> = {
  client: "Client",
  agent: "Support",
  pro: "Pro",
  ai: "Léa",
  system: "Système",
};

export default function SupportTicketClient({ detail }: { detail: AdminTicketDetail }) {
  const router = useRouter();
  const { toast } = useToast();
  const { ticket, messages, context } = detail;

  const [draft, setDraft] = useState("");
  const [busy, setBusy] = useState<"reply" | "note" | null>(null);
  const [statusBusy, setStatusBusy] = useState(false);
  const [drafting, setDrafting] = useState(false);

  const statusMeta = STATUS_META[ticket.status as TicketStatus] || STATUS_META.open;

  async function sendMessage(kind: "reply" | "note") {
    const text = draft.trim();
    if (!text) {
      toast("Message vide", "error");
      return;
    }
    setBusy(kind);
    try {
      const url =
        kind === "reply"
          ? `/api/admin/support/${ticket.id}/reply`
          : `/api/admin/support/${ticket.id}/note`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: text }),
      });
      const json = await res.json();
      if (json.success) {
        if (json.warning) toast(json.warning, "error");
        else
          toast(
            kind === "reply" ? "Réponse envoyée au client" : "Note interne ajoutée",
            "success"
          );
        setDraft("");
        router.refresh();
      } else {
        toast(json.error || "Échec", "error");
      }
    } catch {
      toast("Erreur réseau", "error");
    } finally {
      setBusy(null);
    }
  }

  /** Demande un brouillon à l'IA et le place dans la zone de texte. N'envoie rien. */
  async function generateDraft() {
    setDrafting(true);
    try {
      const res = await fetch(`/api/admin/support/${ticket.id}/draft`, { method: "POST" });
      const json = await res.json();
      if (json.success && json.draft) {
        setDraft(json.draft);
        toast("Brouillon généré — relisez avant d'envoyer", "success");
      } else {
        toast(json.error || "Génération impossible", "error");
      }
    } catch {
      toast("Erreur réseau", "error");
    } finally {
      setDrafting(false);
    }
  }

  async function changeStatus(status: string) {
    if (status === ticket.status) return;
    setStatusBusy(true);
    try {
      const res = await fetch(`/api/admin/support/${ticket.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      const json = await res.json();
      if (json.success) {
        toast("Statut mis à jour", "success");
        router.refresh();
      } else {
        toast(json.error || "Échec", "error");
      }
    } catch {
      toast("Erreur réseau", "error");
    } finally {
      setStatusBusy(false);
    }
  }

  return (
    <div className="max-w-6xl mx-auto">
      {/* Retour */}
      <button
        onClick={() => router.push("/admin/support")}
        className="inline-flex items-center gap-1.5 text-xs mb-4 transition-colors"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
        </svg>
        Boîte de réception
      </button>

      {/* En-tête */}
      <div className="flex flex-wrap items-center gap-3 mb-1">
        <h1 className="text-2xl font-extrabold tracking-tight" style={{ color: "var(--admin-text)" }}>
          Ticket #{ticket.id}
        </h1>
        <AdminBadge variant={statusMeta.variant} dot>
          {statusMeta.label}
        </AdminBadge>
        {ticket.is_legal ? (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: "var(--admin-danger)", background: "rgba(251,110,91,.14)" }}
          >
            LÉGAL
          </span>
        ) : null}
        {ticket.priority === "urgent" ? (
          <span
            className="text-[10px] font-bold px-2 py-0.5 rounded-full"
            style={{ color: "var(--admin-warning)", background: "rgba(251,191,36,.14)" }}
          >
            URGENT
          </span>
        ) : null}
      </div>
      <p className="text-sm mb-6" style={{ color: "var(--admin-text-secondary)" }}>
        {ticket.subject || "(sans objet)"}
      </p>

      <div className="grid lg:grid-cols-3 gap-4">
        {/* Colonne principale : fil + réponse */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Conversation">
            <div className="space-y-3">
              {messages.length === 0 ? (
                <p className="text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
                  Aucun message.
                </p>
              ) : (
                messages.map((m) => {
                  const mine = m.author_role === "agent";
                  return (
                    <div
                      key={m.id}
                      className="rounded-lg p-3"
                      style={{
                        background: m.is_internal
                          ? "rgba(251,191,36,.08)"
                          : mine
                            ? "var(--admin-accent-soft)"
                            : "var(--admin-hover)",
                        border: m.is_internal
                          ? "1px solid rgba(251,191,36,.3)"
                          : "1px solid var(--admin-border)",
                      }}
                    >
                      <div className="flex items-center justify-between gap-2 mb-1">
                        <span className="text-[11px] font-semibold" style={{ color: "var(--admin-text)" }}>
                          {m.author_role === "client"
                            ? ticket.requester_name || AUTHOR_LABEL.client
                            : AUTHOR_LABEL[m.author_role]}
                          {m.is_internal ? (
                            <span
                              className="ml-2 text-[9px] font-bold px-1.5 py-0.5 rounded-full"
                              style={{ color: "var(--admin-warning)", background: "rgba(251,191,36,.16)" }}
                            >
                              NOTE INTERNE
                            </span>
                          ) : null}
                        </span>
                        <span className="text-[10px] tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
                          <TimeAgo iso={m.created_at} />
                        </span>
                      </div>
                      <div
                        className="text-xs whitespace-pre-wrap break-words"
                        style={{ color: "var(--admin-text-secondary)", lineHeight: 1.6 }}
                      >
                        {m.body}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </Card>

          {/* Zone de réponse */}
          <Card title="Répondre">
            <textarea
              value={draft}
              onChange={(e) => setDraft(e.target.value)}
              rows={5}
              placeholder="Votre réponse au client, ou une note interne…"
              className="w-full px-3 py-2 rounded-lg text-xs outline-none resize-y"
              style={{
                backgroundColor: "var(--admin-bg)",
                border: "1px solid var(--admin-border)",
                color: "var(--admin-text)",
              }}
            />
            <div className="flex flex-wrap items-center gap-2 mt-3">
              <AdminButton
                variant="secondary"
                size="sm"
                loading={drafting}
                disabled={drafting || busy !== null}
                onClick={generateDraft}
              >
                Rédiger la réponse
              </AdminButton>
              <AdminButton
                variant="primary"
                size="sm"
                loading={busy === "reply"}
                disabled={busy !== null || drafting || !ticket.requester_email}
                onClick={() => sendMessage("reply")}
              >
                Envoyer au client
              </AdminButton>
              <AdminButton
                variant="ghost"
                size="sm"
                loading={busy === "note"}
                disabled={busy !== null || drafting}
                onClick={() => sendMessage("note")}
              >
                Note interne
              </AdminButton>
              {!ticket.requester_email ? (
                <span className="text-[10px]" style={{ color: "var(--admin-text-tertiary)" }}>
                  Pas d&apos;email destinataire — note interne uniquement.
                </span>
              ) : (
                <span className="text-[10px]" style={{ color: "var(--admin-text-tertiary)" }}>
                  Le client peut répondre à cet email, sa réponse revient ici.
                </span>
              )}
            </div>
          </Card>
        </div>

        {/* Sidebar contexte */}
        <div className="space-y-4">
          {/* Statut */}
          <Card title="Statut">
            <div className="flex flex-wrap gap-1.5">
              {STATUS_TABS.filter((t) => t.value !== "all").map((t) => {
                const on = ticket.status === t.value;
                return (
                  <button
                    key={t.value}
                    disabled={statusBusy}
                    onClick={() => changeStatus(t.value)}
                    className="px-2.5 py-1 text-[11px] font-semibold rounded-full transition-colors disabled:opacity-50"
                    style={{
                      background: on ? "var(--admin-accent-soft)" : "transparent",
                      color: on ? "var(--admin-accent)" : "var(--admin-text-secondary)",
                      border: `1px solid ${on ? "var(--admin-accent)" : "var(--admin-border)"}`,
                    }}
                  >
                    {t.label}
                  </button>
                );
              })}
            </div>
          </Card>

          {/* Demandeur */}
          <Card title="Demandeur">
            <dl className="space-y-2 text-xs">
              {ticket.requester_name ? (
                <div>
                  <dt style={{ color: "var(--admin-text-tertiary)" }}>Nom</dt>
                  <dd style={{ color: "var(--admin-text)" }}>{ticket.requester_name}</dd>
                </div>
              ) : null}
              <div>
                <dt style={{ color: "var(--admin-text-tertiary)" }}>Email</dt>
                <dd className="break-words" style={{ color: "var(--admin-text)" }}>
                  {ticket.requester_email || "—"}
                </dd>
              </div>
              <div>
                <dt style={{ color: "var(--admin-text-tertiary)" }}>Canal</dt>
                <dd style={{ color: "var(--admin-text)" }}>{SOURCE_LABEL[ticket.source] || ticket.source}</dd>
              </div>
              {ticket.category ? (
                <div>
                  <dt style={{ color: "var(--admin-text-tertiary)" }}>Catégorie</dt>
                  <dd style={{ color: "var(--admin-text)" }}>
                    {CATEGORY_LABEL[ticket.category] || ticket.category}
                  </dd>
                </div>
              ) : null}
              <div>
                <dt style={{ color: "var(--admin-text-tertiary)" }}>Ouvert</dt>
                <dd style={{ color: "var(--admin-text)" }}>
                  <TimeAgo iso={ticket.created_at} />
                </dd>
              </div>
            </dl>
          </Card>

          {/* Pro lié */}
          {context.pro ? (
            <Card title="Professionnel lié">
              <div className="text-xs space-y-1">
                <Link
                  href={`/admin/pros/${context.pro.id}`}
                  className="font-semibold hover:underline"
                  style={{ color: "var(--admin-accent)" }}
                >
                  {context.pro.name}
                </Link>
                <div style={{ color: "var(--admin-text-secondary)" }}>
                  {[context.pro.category, context.pro.city].filter(Boolean).join(" · ") || "—"}
                </div>
                <div className="flex flex-wrap gap-x-3 gap-y-1 pt-1" style={{ color: "var(--admin-text-tertiary)" }}>
                  <span>Abo : {context.pro.subscription_status || "—"}</span>
                  <span>{context.unlocks} lead{context.unlocks > 1 ? "s" : ""} débloqué{context.unlocks > 1 ? "s" : ""}</span>
                </div>
              </div>
            </Card>
          ) : null}

          {/* Projets du demandeur */}
          {context.projects.length > 0 ? (
            <Card title="Projets déposés">
              <ul className="space-y-1.5 text-xs">
                {context.projects.map((p) => (
                  <li key={p.id}>
                    <Link
                      href={`/admin/projects/${p.id}`}
                      className="hover:underline"
                      style={{ color: "var(--admin-accent)" }}
                    >
                      #{p.id} {[p.category, p.city].filter(Boolean).join(" · ")}
                    </Link>
                    <span className="ml-2" style={{ color: "var(--admin-text-tertiary)" }}>
                      <TimeAgo iso={p.created_at} />
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}

          {/* Tickets passés */}
          {context.pastTickets.length > 0 ? (
            <Card title="Autres tickets">
              <ul className="space-y-1.5 text-xs">
                {context.pastTickets.map((p) => (
                  <li key={p.id} className="flex items-center gap-2">
                    <Link
                      href={`/admin/support/${p.id}`}
                      className="hover:underline truncate"
                      style={{ color: "var(--admin-accent)" }}
                    >
                      #{p.id} {p.subject || "(sans objet)"}
                    </Link>
                    <span className="text-[10px]" style={{ color: "var(--admin-text-tertiary)" }}>
                      {(STATUS_META[p.status as TicketStatus] || STATUS_META.open).label}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ) : null}
        </div>
      </div>
    </div>
  );
}

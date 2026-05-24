"use client";

import { useState, useMemo, useTransition } from "react";
import {
  sendPitchAction,
  updateStatusAction,
  updateNotesAction,
} from "./actions";
import type {
  Partnership,
  PartnershipStatus,
  PartnershipType,
} from "@/lib/types/database";
import {
  PARTNERSHIP_TEMPLATES,
  defaultTemplateForType,
} from "@/lib/email/partnerships-templates";

const TYPE_LABELS: Record<PartnershipType, string> = {
  mairie: "Mairie",
  office_tourisme: "Office de tourisme",
  notaire: "Notaire",
  agence_immo: "Agence immo",
  syndic: "Syndic",
  cci: "CCI",
  chambre_metiers: "Chambre des métiers",
  association_quartier: "Association",
  autre: "Autre",
};

const STATUS_LABELS: Record<PartnershipStatus, string> = {
  to_contact: "À contacter",
  contacted: "Contacté",
  follow_up_due: "Relance due",
  responded: "A répondu",
  partnership: "Partenariat actif",
  declined: "Refus",
  invalid: "Invalide",
};

const STATUS_COLORS: Record<PartnershipStatus, string> = {
  to_contact: "bg-[#F3F4F6] text-[#374151]",
  contacted: "bg-[#DBEAFE] text-[#1E40AF]",
  follow_up_due: "bg-[#FED7AA] text-[#9A3412]",
  responded: "bg-[#FEF3C7] text-[#92400E]",
  partnership: "bg-[#DCFCE7] text-[#15803D]",
  declined: "bg-[#FEE2E2] text-[#991B1B]",
  invalid: "bg-[#E5E7EB] text-[#6B7280]",
};

type Stats = {
  total: number;
  to_contact: number;
  contacted: number;
  responded: number;
  partnership: number;
  declined: number;
};

export default function PartnershipsClient({
  partnerships,
  stats,
}: {
  partnerships: Partnership[];
  stats: Stats;
}) {
  const [filterType, setFilterType] = useState<PartnershipType | "all">("all");
  const [filterStatus, setFilterStatus] = useState<PartnershipStatus | "all">("to_contact");
  const [search, setSearch] = useState("");
  const [previewId, setPreviewId] = useState<number | null>(null);
  const [pendingId, setPendingId] = useState<number | null>(null);
  const [, startTransition] = useTransition();

  const filtered = useMemo(() => {
    return partnerships.filter((p) => {
      if (filterType !== "all" && p.type !== filterType) return false;
      if (filterStatus !== "all" && p.status !== filterStatus) return false;
      if (search) {
        const q = search.toLowerCase();
        const haystack = `${p.name} ${p.contact_email} ${p.city ?? ""} ${p.postal_code ?? ""}`.toLowerCase();
        if (!haystack.includes(q)) return false;
      }
      return true;
    });
  }, [partnerships, filterType, filterStatus, search]);

  const previewPartnership =
    previewId !== null ? partnerships.find((p) => p.id === previewId) : null;
  const previewTemplate = previewPartnership
    ? defaultTemplateForType(previewPartnership.type)
    : null;

  function handleSend(partnershipId: number) {
    if (
      !confirm(
        "Envoyer le pitch par email à ce contact ? Le statut passera en 'Contacté'."
      )
    ) {
      return;
    }
    setPendingId(partnershipId);
    startTransition(async () => {
      const result = await sendPitchAction(partnershipId);
      setPendingId(null);
      if (!result.ok) {
        alert(`Erreur : ${result.error ?? "envoi impossible"}`);
      } else {
        setPreviewId(null);
      }
    });
  }

  function handleStatusChange(partnershipId: number, newStatus: PartnershipStatus) {
    setPendingId(partnershipId);
    startTransition(async () => {
      await updateStatusAction(partnershipId, newStatus);
      setPendingId(null);
    });
  }

  return (
    <div className="space-y-6">
      {/* Stats en haut */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
        <StatCard label="Total" value={stats.total} />
        <StatCard label="À contacter" value={stats.to_contact} color="gray" />
        <StatCard label="Contactés" value={stats.contacted} color="blue" />
        <StatCard label="Ont répondu" value={stats.responded} color="amber" />
        <StatCard label="Partenariats" value={stats.partnership} color="green" />
        <StatCard label="Refus" value={stats.declined} color="red" />
      </div>

      {/* Filtres */}
      <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl p-4 flex flex-col sm:flex-row gap-3 flex-wrap">
        <input
          type="text"
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher (nom, email, ville…)"
          className="flex-1 min-w-[200px] h-10 px-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)] text-[14px] focus:outline-none focus:border-[var(--accent)]"
        />
        <select
          value={filterType}
          onChange={(e) => setFilterType(e.target.value as PartnershipType | "all")}
          className="h-10 px-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)] text-[14px] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">Tous les types</option>
          {Object.entries(TYPE_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <select
          value={filterStatus}
          onChange={(e) =>
            setFilterStatus(e.target.value as PartnershipStatus | "all")
          }
          className="h-10 px-3 rounded-xl border border-[var(--card-border)] bg-[var(--bg-primary)] text-[14px] focus:outline-none focus:border-[var(--accent)]"
        >
          <option value="all">Tous les statuts</option>
          {Object.entries(STATUS_LABELS).map(([k, v]) => (
            <option key={k} value={k}>
              {v}
            </option>
          ))}
        </select>
        <p className="text-[13px] text-[var(--text-secondary)] flex items-center px-1">
          {filtered.length} résultat{filtered.length > 1 ? "s" : ""}
        </p>
      </div>

      {/* Table / Liste */}
      <div className="space-y-2">
        {filtered.slice(0, 100).map((p) => {
          const isPending = pendingId === p.id;
          return (
            <article
              key={p.id}
              className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 hover:border-[var(--accent)] transition-colors duration-150"
            >
              <div className="flex-1 min-w-0">
                <div className="flex items-center gap-2 flex-wrap mb-1">
                  <p className="font-semibold text-[14px] text-[var(--text-primary)] truncate">
                    {p.name}
                  </p>
                  <span
                    className={`text-[11px] font-medium px-2 py-0.5 rounded-full ${
                      STATUS_COLORS[p.status]
                    }`}
                  >
                    {STATUS_LABELS[p.status]}
                  </span>
                  <span className="text-[11px] text-[var(--text-tertiary)]">
                    {TYPE_LABELS[p.type]}
                  </span>
                </div>
                <p className="text-[12px] text-[var(--text-secondary)] truncate">
                  {p.contact_email}
                  {p.city ? ` · ${p.city}` : ""}
                  {p.department_code ? ` (${p.department_code})` : ""}
                  {p.emails_sent_count > 0
                    ? ` · ${p.emails_sent_count} envoi${p.emails_sent_count > 1 ? "s" : ""}`
                    : ""}
                </p>
              </div>

              <div className="flex items-center gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => setPreviewId(p.id)}
                  className="h-8 px-3 text-[12px] font-medium rounded-full border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] transition-colors duration-150"
                >
                  Aperçu
                </button>
                {p.status === "to_contact" || p.status === "follow_up_due" ? (
                  <button
                    type="button"
                    onClick={() => handleSend(p.id)}
                    disabled={isPending}
                    className="h-8 px-3 text-[12px] font-semibold rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white transition-all duration-150"
                  >
                    {isPending ? "Envoi…" : "Envoyer"}
                  </button>
                ) : (
                  <select
                    value={p.status}
                    onChange={(e) =>
                      handleStatusChange(
                        p.id,
                        e.target.value as PartnershipStatus
                      )
                    }
                    disabled={isPending}
                    className="h-8 px-2 text-[12px] rounded-full border border-[var(--card-border)] bg-[var(--bg-primary)] text-[var(--text-primary)] focus:outline-none focus:border-[var(--accent)]"
                  >
                    {Object.entries(STATUS_LABELS).map(([k, v]) => (
                      <option key={k} value={k}>
                        {v}
                      </option>
                    ))}
                  </select>
                )}
              </div>
            </article>
          );
        })}
        {filtered.length > 100 && (
          <p className="text-[12px] text-[var(--text-tertiary)] text-center py-4">
            Affichage limité aux 100 premiers résultats. Affinez les filtres pour réduire.
          </p>
        )}
        {filtered.length === 0 && (
          <div className="text-center py-12 text-[var(--text-secondary)]">
            Aucun partenariat ne correspond aux filtres.
          </div>
        )}
      </div>

      {/* Modale d'apercu de l'email */}
      {previewPartnership && previewTemplate && (
        <PreviewModal
          partnership={previewPartnership}
          subject={previewTemplate.subject(previewPartnership)}
          html={previewTemplate.html(previewPartnership)}
          onClose={() => setPreviewId(null)}
          onSend={() => handleSend(previewPartnership.id)}
          isSending={pendingId === previewPartnership.id}
        />
      )}
    </div>
  );
}

function StatCard({
  label,
  value,
  color,
}: {
  label: string;
  value: number;
  color?: "gray" | "blue" | "amber" | "green" | "red";
}) {
  const colorMap: Record<string, string> = {
    gray: "text-[#6B7280]",
    blue: "text-[#1E40AF]",
    amber: "text-[#92400E]",
    green: "text-[#15803D]",
    red: "text-[#991B1B]",
  };
  const valueColor = color ? colorMap[color] : "text-[var(--text-primary)]";
  return (
    <div className="bg-[var(--card-bg)] border border-[var(--card-border)] rounded-xl p-3">
      <p className={`text-2xl font-bold tracking-tight ${valueColor}`}>{value}</p>
      <p className="text-[12px] text-[var(--text-secondary)] mt-1">{label}</p>
    </div>
  );
}

function PreviewModal({
  partnership,
  subject,
  html,
  onClose,
  onSend,
  isSending,
}: {
  partnership: Partnership;
  subject: string;
  html: string;
  onClose: () => void;
  onSend: () => void;
  isSending: boolean;
}) {
  return (
    <div className="fixed inset-0 z-50 bg-black/60 flex items-center justify-center p-4">
      <div className="bg-[var(--bg-primary)] rounded-2xl max-w-2xl w-full max-h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="px-5 py-4 border-b border-[var(--card-border)] flex items-start justify-between">
          <div className="min-w-0">
            <p className="text-[12px] text-[var(--text-tertiary)]">À : {partnership.contact_email}</p>
            <p className="text-[15px] font-semibold text-[var(--text-primary)] mt-1 truncate">{subject}</p>
          </div>
          <button
            onClick={onClose}
            aria-label="Fermer"
            className="text-[#9CA3AF] hover:text-[var(--text-primary)] p-1.5 rounded-lg transition-colors"
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M18 6L6 18M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* iframe preview HTML (sandbox pour eviter scripts inattendus) */}
        <iframe
          srcDoc={html}
          sandbox=""
          className="flex-1 w-full bg-[#F5F5F5] border-0"
          title="Prévisualisation email"
        />

        {/* Footer actions */}
        <div className="px-5 py-3 border-t border-[var(--card-border)] flex items-center justify-between gap-3">
          <p className="text-[12px] text-[var(--text-tertiary)]">
            Sender : Workwave &lt;contact@workwave.fr&gt;
          </p>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="h-9 px-4 rounded-full border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] text-[13px] font-medium transition-colors"
            >
              Annuler
            </button>
            <button
              onClick={onSend}
              disabled={isSending}
              className="h-9 px-4 rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] disabled:opacity-50 text-white text-[13px] font-semibold transition-all"
            >
              {isSending ? "Envoi en cours…" : "Envoyer ce pitch"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

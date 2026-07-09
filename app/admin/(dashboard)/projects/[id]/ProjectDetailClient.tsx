"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminBadge from "@/components/admin/data-display/AdminBadge";
import AdminButton from "@/components/admin/forms/AdminButton";

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  new: { label: "Nouveau", variant: "info" },
  routed: { label: "Routé", variant: "success" },
  unrouted: { label: "Non routé", variant: "warning" },
  suspicious: { label: "Suspect", variant: "danger" },
  closed: { label: "Fermé", variant: "default" },
};

const LEAD_STATUS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  sent: { label: "Envoyé", variant: "default" },
  opened: { label: "Vu", variant: "info" },
  contacted: { label: "Contacté", variant: "success" },
  not_relevant: { label: "Non pertinent", variant: "warning" },
};

type ProjectData = Record<string, unknown>;
type LeadData = {
  id: number;
  status: string;
  sent_at: string;
  opened_at: string | null;
  contacted_at: string | null;
  paid?: boolean;
  paidAt?: string | null;
  paidAmountEur?: number | null;
  pro: {
    id: number;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    subscription_status: string;
  } | null;
};
type UnlockData = {
  proId: number;
  proName: string | null;
  proSlug: string | null;
  siret: string | null;
  phone: string | null;
  email: string | null;
  categoryName: string | null;
  cityName: string | null;
  paidAt: string;
  amountEur: number;
  isFree: boolean;
};

export default function ProjectDetailClient({
  project,
  leads,
  unlocks = [],
}: {
  project: ProjectData;
  leads: LeadData[];
  unlocks?: UnlockData[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);
  const [resending, setResending] = useState(false);
  const [resendResult, setResendResult] = useState<string | null>(null);

  // Audit trail notification admin (migration 2026-05-23) : detecte
  // les pertes silencieuses historiques + tout futur echec Resend.
  const adminNotifiedAt = project.admin_notified_at as string | null;
  const adminNotifError = project.admin_notification_error as string | null;
  const isNotificationPending = !adminNotifiedAt;

  async function handleResendNotification() {
    setResending(true);
    setResendResult(null);
    try {
      const res = await fetch(
        `/api/admin/projects/${project.id}/resend-notification`,
        { method: "POST" }
      );
      const json = await res.json();
      if (json.success) {
        setResendResult("Notification renvoyée avec succès");
        router.refresh();
      } else {
        setResendResult(`Échec : ${json.error ?? "erreur inconnue"}`);
      }
    } catch (e) {
      setResendResult(
        `Exception : ${e instanceof Error ? e.message : String(e)}`
      );
    } finally {
      setResending(false);
    }
  }

  const statusBadge = STATUS_BADGE[(project.status as string) || "new"] || STATUS_BADGE.new;
  const aiQual = project.ai_qualification as {
    summary?: string;
    keywords?: string[];
    suspicion_score?: number;
    category_match?: boolean;
    budget_realistic?: boolean;
    urgency_assessment?: string;
  } | null;

  async function handleUpdateStatus(status: string) {
    setLoading(true);
    await fetch(`/api/admin/projects/${project.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ status }),
    });
    setLoading(false);
    router.refresh();
  }

  return (
    <div>
      <button
        onClick={() => router.push("/admin/projects")}
        className="flex items-center gap-1 text-xs mb-4 transition-colors duration-150 cursor-pointer"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <h1 className="text-lg font-semibold" style={{ color: "var(--admin-text)" }}>
          Projet #{project.id as number}
        </h1>
        <AdminBadge variant={statusBadge.variant} dot>
          {statusBadge.label}
        </AdminBadge>
      </div>

      {/* Banner notification admin (Levier "fiabilite 100%" 2026-05-23).
          Affiche systematiquement le statut de la notif admin pour ce
          projet. Si non envoyee -> alerte + bouton Renvoyer. Si envoyee
          -> mention discrete de la date. Eradique la "perte silencieuse"
          historique du .catch non bloquant qui masquait les echecs
          Resend (cf. projets #18 du 27/04 et #19 du 13/05). */}
      {isNotificationPending ? (
        <div
          className="mb-4 rounded-xl p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:gap-4"
          style={{
            background: adminNotifError
              ? "rgba(239, 68, 68, 0.08)"
              : "rgba(245, 158, 11, 0.08)",
            border: adminNotifError
              ? "1px solid rgba(239, 68, 68, 0.3)"
              : "1px solid rgba(245, 158, 11, 0.3)",
          }}
        >
          <div className="flex-1 min-w-0">
            <p
              className="text-sm font-semibold"
              style={{ color: adminNotifError ? "#EF4444" : "#F59E0B" }}
            >
              {adminNotifError
                ? "Notification admin échouée"
                : "Notification admin non envoyée"}
            </p>
            <p
              className="text-xs mt-1"
              style={{ color: "var(--admin-text-secondary)" }}
            >
              {adminNotifError
                ? `Erreur Resend : ${adminNotifError}`
                : "Aucune trace d'envoi pour ce projet. Soit la notif a échoué silencieusement, soit elle date d'avant le tracking. Renvoyez pour confirmer."}
            </p>
            {resendResult && (
              <p
                className="text-xs mt-2 font-medium"
                style={{
                  color: resendResult.startsWith("Notification")
                    ? "#10B981"
                    : "#EF4444",
                }}
              >
                {resendResult}
              </p>
            )}
          </div>
          <AdminButton
            variant="primary"
            size="sm"
            loading={resending}
            onClick={handleResendNotification}
          >
            Renvoyer la notif
          </AdminButton>
        </div>
      ) : (
        <p
          className="text-xs mb-4 flex items-center gap-1.5"
          style={{ color: "var(--admin-text-tertiary)" }}
        >
          <span style={{ color: "#10B981" }}>✓</span>
          Notification admin envoyée le{" "}
          {new Date(adminNotifiedAt).toLocaleString("fr-FR", {
            dateStyle: "short",
            timeStyle: "short",
          })}
        </p>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Project info */}
        <div className="lg:col-span-2 space-y-4">
          <Card title="Informations">
            <div className="grid grid-cols-2 gap-3 text-xs mb-4">
              <InfoRow label="Prénom" value={project.first_name as string} />
              <InfoRow label="Email" value={project.email as string} />
              <InfoRow label="Téléphone" value={project.phone as string} />
              <InfoRow
                label="Catégorie"
                value={(project.category as { name?: string } | null)?.name}
              />
              <InfoRow
                label="Ville"
                value={(project.city as { name?: string } | null)?.name}
              />
              <InfoRow label="Urgence" value={project.urgency as string} />
              <InfoRow label="Budget" value={project.budget as string} />
              <InfoRow
                label="Date"
                value={new Date(project.created_at as string).toLocaleDateString("fr-FR")}
              />
            </div>
            <div style={{ borderTop: "1px solid var(--admin-border)" }} className="pt-3">
              <p className="text-[11px] mb-1" style={{ color: "var(--admin-text-tertiary)" }}>
                Description
              </p>
              <p className="text-xs leading-relaxed" style={{ color: "var(--admin-text-secondary)" }}>
                {project.description as string}
              </p>
            </div>
          </Card>

          {/* Broadcast / Routing — Phase 11 model :
              - AI projects (vertical='tech') sont broadcastes a TOUS les freelances inscrits.
                broadcast_count = nombre de freelances ayant recu le mail.
                Les leads (project_leads) sont crees A LA VOLEE quand un Premium clique
                "J'ai contacte ce client", donc len(leads) = nb de Premium qui ont marque
                comme contacte (pas tous les destinataires).
              - BTP projects (vertical='btp') utilisent encore le routing top 3 (Sprint 5).
                leads = pros selectionnes par l'IA. */}
          {(() => {
            const broadcastCount = project.broadcast_count as number | null;
            const broadcastedAt = project.broadcasted_at as string | null;
            const isAi = project.vertical === "tech";
            const paidCount = leads.filter((l) => l.paid).length;
            return (
              <Card
                title={
                  isAi
                    ? `Broadcast (${broadcastCount ?? 0} freelances) — ${leads.length} contact${leads.length > 1 ? "s" : ""}`
                    : `Routing — ${leads.length} destinataire${leads.length > 1 ? "s" : ""}${paidCount > 0 ? ` · ${paidCount} payé${paidCount > 1 ? "s" : ""}` : ""}`
                }
              >
                {!isAi && broadcastedAt && (
                  <p className="text-xs mb-3" style={{ color: "var(--admin-text-tertiary)" }}>
                    Diffusé à {leads.length} pro{leads.length > 1 ? "s" : ""} le{" "}
                    {new Date(broadcastedAt).toLocaleString("fr-FR", {
                      day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit",
                    })}
                    {paidCount > 0 ? ` — ${paidCount} a${paidCount > 1 ? "/ont" : ""} débloqué (${(paidCount * 9.9).toFixed(2).replace(".", ",")} €)` : ""}.
                  </p>
                )}
                {isAi && broadcastedAt && (
                  <p className="text-xs mb-3" style={{ color: "var(--admin-text-tertiary)" }}>
                    Diffuse a {broadcastCount ?? 0} freelance{(broadcastCount ?? 0) > 1 ? "s" : ""} le{" "}
                    {new Date(broadcastedAt).toLocaleString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                      year: "numeric",
                      hour: "2-digit",
                      minute: "2-digit",
                    })}
                    .
                  </p>
                )}
                {leads.length === 0 ? (
                  <p className="text-xs py-4 text-center" style={{ color: "var(--admin-text-tertiary)" }}>
                    {isAi
                      ? broadcastCount && broadcastCount > 0
                        ? "Aucun freelance Premium n'a encore marque ce projet comme contacte."
                        : "Pas encore broadcasté (ou pas de freelances eligibles)."
                      : unlocks.length > 0
                        ? `Aucun pro ciblé par le broadcast au moment du dépôt — mais ${unlocks.length} pro${unlocks.length > 1 ? "s ont" : " a"} pris ce projet depuis son feed (voir « Qui a pris ce projet » ci-dessous).`
                        : "Aucun pro n'a reçu ce projet"}
                  </p>
                ) : (
              <div className="space-y-2">
                {leads.map((lead) => {
                  const s = LEAD_STATUS[lead.status] || LEAD_STATUS.sent;
                  return (
                    <div
                      key={lead.id}
                      className="flex items-center gap-3 py-2 text-xs"
                      style={{ borderBottom: "1px solid var(--admin-border)" }}
                    >
                      <button
                        onClick={() => router.push(`/admin/pros/${lead.pro?.id}`)}
                        className="font-medium cursor-pointer transition-colors duration-150"
                        style={{ color: "var(--admin-accent)" }}
                      >
                        {lead.pro?.name || "—"}
                      </button>
                      <span className="flex-1" />
                      <span className="tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
                        {new Date(lead.sent_at).toLocaleDateString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                      {lead.paid ? (
                        <AdminBadge variant="success">Payé 9,90 €</AdminBadge>
                      ) : (
                        <AdminBadge variant={s.variant}>{s.label}</AdminBadge>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
              </Card>
            );
          })()}

          {/* Qui a PRIS ce projet — les déblocages (feed pull), indépendants du
              broadcast. Répond au besoin "je dois voir qui a pris le projet".
              Un pro apparaît ici même s'il n'a jamais été ciblé par le broadcast. */}
          <Card
            title={`Qui a pris ce projet — ${unlocks.length} déblocage${
              unlocks.length > 1 ? "s" : ""
            }`}
          >
            {unlocks.length === 0 ? (
              <p
                className="text-xs py-4 text-center"
                style={{ color: "var(--admin-text-tertiary)" }}
              >
                Personne n&apos;a encore débloqué ce projet.
              </p>
            ) : (
              <div className="space-y-3">
                {unlocks.map((u) => (
                  <div
                    key={u.proId}
                    className="flex flex-col gap-1.5 py-2 text-xs"
                    style={{ borderBottom: "1px solid var(--admin-border)" }}
                  >
                    <div className="flex items-center gap-2 flex-wrap">
                      <button
                        onClick={() => router.push(`/admin/pros/${u.proId}`)}
                        className="font-semibold cursor-pointer transition-colors duration-150"
                        style={{ color: "var(--admin-accent)" }}
                      >
                        {u.proName || `Pro #${u.proId}`}
                      </button>
                      {u.categoryName && (
                        <span style={{ color: "var(--admin-text-tertiary)" }}>
                          · {u.categoryName}
                        </span>
                      )}
                      {u.cityName && (
                        <span style={{ color: "var(--admin-text-tertiary)" }}>
                          · {u.cityName}
                        </span>
                      )}
                      <span className="flex-1" />
                      {u.isFree ? (
                        <AdminBadge variant="warning">Offert</AdminBadge>
                      ) : (
                        <AdminBadge variant="success">
                          Payé {u.amountEur.toFixed(2).replace(".", ",")} €
                        </AdminBadge>
                      )}
                    </div>
                    <div
                      className="flex flex-wrap items-center gap-x-4 gap-y-1"
                      style={{ color: "var(--admin-text-secondary)" }}
                    >
                      {u.phone && <span>Tél {u.phone}</span>}
                      {u.email && <span>{u.email}</span>}
                      {u.siret && (
                        <span
                          className="font-mono"
                          style={{ color: "var(--admin-text-tertiary)" }}
                        >
                          SIRET {u.siret}
                        </span>
                      )}
                      <span
                        className="tabular-nums ml-auto"
                        style={{ color: "var(--admin-text-tertiary)" }}
                      >
                        {new Date(u.paidAt).toLocaleString("fr-FR", {
                          day: "2-digit",
                          month: "short",
                          year: "numeric",
                          hour: "2-digit",
                          minute: "2-digit",
                        })}
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </Card>
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* AI Qualification */}
          {aiQual && (
            <Card title="Qualification IA">
              <div className="space-y-2 text-xs">
                {aiQual.summary && (
                  <p style={{ color: "var(--admin-text-secondary)" }}>
                    {aiQual.summary}
                  </p>
                )}
                <div className="flex justify-between">
                  <span style={{ color: "var(--admin-text-tertiary)" }}>Catégorie match</span>
                  <span>{aiQual.category_match ? "✓" : "✗"}</span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: "var(--admin-text-tertiary)" }}>Budget réaliste</span>
                  <span>{aiQual.budget_realistic ? "✓" : "✗"}</span>
                </div>
                {aiQual.suspicion_score !== undefined && (
                  <div className="flex justify-between">
                    <span style={{ color: "var(--admin-text-tertiary)" }}>Suspicion</span>
                    <span
                      className="font-medium tabular-nums"
                      style={{
                        color:
                          aiQual.suspicion_score < 30
                            ? "#10B981"
                            : aiQual.suspicion_score < 70
                              ? "#F59E0B"
                              : "#EF4444",
                      }}
                    >
                      {aiQual.suspicion_score}/100
                    </span>
                  </div>
                )}
                {aiQual.keywords && aiQual.keywords.length > 0 && (
                  <div className="flex flex-wrap gap-1 pt-1">
                    {aiQual.keywords.map((kw) => (
                      <AdminBadge key={kw}>{kw}</AdminBadge>
                    ))}
                  </div>
                )}
              </div>
            </Card>
          )}

          {/* Actions */}
          <Card title="Actions">
            <div className="space-y-2">
              {project.status === "suspicious" && (
                <AdminButton
                  variant="primary"
                  size="sm"
                  className="w-full"
                  loading={loading}
                  onClick={() => handleUpdateStatus("routed")}
                >
                  Approuver et router
                </AdminButton>
              )}
              {project.status !== "closed" && (
                <AdminButton
                  variant="secondary"
                  size="sm"
                  className="w-full"
                  loading={loading}
                  onClick={() => handleUpdateStatus("closed")}
                >
                  Clore le projet
                </AdminButton>
              )}
            </div>
          </Card>
        </div>
      </div>
    </div>
  );
}

function Card({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      className="rounded-xl p-4"
      style={{
        backgroundColor: "var(--admin-card)",
        border: "1px solid var(--admin-border)",
      }}
    >
      <h2 className="text-sm font-semibold mb-3" style={{ color: "var(--admin-text)" }}>
        {title}
      </h2>
      {children}
    </div>
  );
}

function InfoRow({ label, value }: { label: string; value: string | null | undefined }) {
  return (
    <div>
      <span className="text-[11px] block mb-0.5" style={{ color: "var(--admin-text-tertiary)" }}>
        {label}
      </span>
      <span>{value || "—"}</span>
    </div>
  );
}

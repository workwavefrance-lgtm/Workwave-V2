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
  pro: {
    id: number;
    name: string;
    slug: string;
    email: string | null;
    phone: string | null;
    subscription_status: string;
  } | null;
};

export default function ProjectDetailClient({
  project,
  leads,
}: {
  project: ProjectData;
  leads: LeadData[];
}) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

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

          {/* Routing */}
          <Card title={`Routing (${leads.length} pros)`}>
            {leads.length === 0 ? (
              <p className="text-xs py-4 text-center" style={{ color: "var(--admin-text-tertiary)" }}>
                Aucun pro n&apos;a reçu ce projet
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
                      <AdminBadge variant={s.variant}>{s.label}</AdminBadge>
                    </div>
                  );
                })}
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

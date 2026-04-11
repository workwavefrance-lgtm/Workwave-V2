"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import AdminBadge from "@/components/admin/data-display/AdminBadge";
import AdminButton from "@/components/admin/forms/AdminButton";
import AdminConfirmDialog from "@/components/admin/forms/AdminConfirmDialog";
import { useAdmin } from "@/components/admin/shell/AdminProvider";

type ProData = {
  id: number;
  name: string;
  slug: string;
  siret: string | null;
  email: string | null;
  phone: string | null;
  description: string | null;
  subscription_status: string;
  subscription_plan: string | null;
  trial_ends_at: string | null;
  current_period_end: string | null;
  profile_completion: number;
  response_rate: number | null;
  claimed_at: string | null;
  created_at: string;
  is_active: boolean;
  stripe_customer_id: string | null;
  intervention_radius_km: number;
  category: { id: number; name: string } | null;
  city: { id: number; name: string; department: { code: string; name: string } | null } | null;
};

type LeadData = {
  id: number;
  status: string;
  sent_at: string;
  project: {
    id: number;
    first_name: string;
    description: string;
    status: string;
    created_at: string;
  } | null;
};

const STATUS_BADGE: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  active: { label: "Actif", variant: "success" },
  trialing: { label: "Essai", variant: "info" },
  past_due: { label: "Impayé", variant: "warning" },
  canceled: { label: "Résilié", variant: "danger" },
  none: { label: "Gratuit", variant: "default" },
  free: { label: "Gratuit", variant: "default" },
  suspended: { label: "Suspendu", variant: "danger" },
};

const LEAD_STATUS: Record<string, { label: string; variant: "success" | "warning" | "danger" | "info" | "default" }> = {
  sent: { label: "Envoyé", variant: "default" },
  opened: { label: "Vu", variant: "info" },
  contacted: { label: "Contacté", variant: "success" },
  not_relevant: { label: "Non pertinent", variant: "warning" },
  expired: { label: "Expiré", variant: "danger" },
};

export default function ProDetailClient({
  pro,
  leads,
}: {
  pro: ProData;
  leads: LeadData[];
}) {
  const router = useRouter();
  const { admin } = useAdmin();
  const [showSuspend, setShowSuspend] = useState(false);
  const [loading, setLoading] = useState(false);
  const [impersonating, setImpersonating] = useState(false);

  const statusBadge = STATUS_BADGE[pro.subscription_status] || STATUS_BADGE.none;

  async function handleToggleActive() {
    setLoading(true);
    await fetch(`/api/admin/pros/${pro.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ is_active: !pro.is_active }),
    });
    setLoading(false);
    setShowSuspend(false);
    router.refresh();
  }

  return (
    <div>
      {/* Back + Title */}
      <button
        onClick={() => router.push("/admin/pros")}
        className="flex items-center gap-1 text-xs mb-4 transition-colors duration-150 cursor-pointer"
        style={{ color: "var(--admin-text-secondary)" }}
      >
        <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
        </svg>
        Retour
      </button>

      <div className="flex items-center gap-3 mb-6">
        <div
          className="w-10 h-10 rounded-full flex items-center justify-center"
          style={{ backgroundColor: "rgba(16, 185, 129, 0.15)" }}
        >
          <span
            className="text-sm font-semibold"
            style={{ color: "#10B981" }}
          >
            {pro.name.charAt(0).toUpperCase()}
          </span>
        </div>
        <div>
          <h1
            className="text-lg font-semibold"
            style={{ color: "var(--admin-text)" }}
          >
            {pro.name}
          </h1>
          <div className="flex items-center gap-2 mt-0.5">
            <AdminBadge variant={statusBadge.variant} dot>
              {statusBadge.label}
            </AdminBadge>
            {!pro.is_active && (
              <AdminBadge variant="danger">Désactivé</AdminBadge>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-4">
        {/* Info Card */}
        <div
          className="lg:col-span-2 rounded-xl p-4"
          style={{
            backgroundColor: "var(--admin-card)",
            border: "1px solid var(--admin-border)",
          }}
        >
          <h2
            className="text-sm font-semibold mb-3"
            style={{ color: "var(--admin-text)" }}
          >
            Informations
          </h2>
          <div className="grid grid-cols-2 gap-3 text-xs">
            <InfoRow label="SIRET" value={pro.siret} mono />
            <InfoRow label="Email" value={pro.email} />
            <InfoRow label="Téléphone" value={pro.phone} />
            <InfoRow label="Catégorie" value={pro.category?.name} />
            <InfoRow
              label="Ville"
              value={
                pro.city
                  ? `${pro.city.name} (${pro.city.department?.code})`
                  : null
              }
            />
            <InfoRow label="Rayon" value={`${pro.intervention_radius_km} km`} />
            <InfoRow label="Profil" value={`${pro.profile_completion}%`} />
            <InfoRow
              label="Taux réponse"
              value={pro.response_rate !== null ? `${pro.response_rate}%` : null}
            />
            <InfoRow
              label="Réclamé le"
              value={
                pro.claimed_at
                  ? new Date(pro.claimed_at).toLocaleDateString("fr-FR")
                  : null
              }
            />
            <InfoRow
              label="Créé le"
              value={new Date(pro.created_at).toLocaleDateString("fr-FR")}
            />
          </div>

          {pro.description && (
            <div className="mt-4 pt-3" style={{ borderTop: "1px solid var(--admin-border)" }}>
              <p className="text-xs" style={{ color: "var(--admin-text-secondary)" }}>
                {pro.description}
              </p>
            </div>
          )}
        </div>

        {/* Sidebar */}
        <div className="space-y-4">
          {/* Subscription Card */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--admin-text)" }}
            >
              Abonnement
            </h2>
            <div className="space-y-2 text-xs">
              <div className="flex justify-between">
                <span style={{ color: "var(--admin-text-secondary)" }}>Plan</span>
                <span>{pro.subscription_plan || "—"}</span>
              </div>
              <div className="flex justify-between">
                <span style={{ color: "var(--admin-text-secondary)" }}>
                  Prochaine facture
                </span>
                <span className="tabular-nums">
                  {pro.current_period_end
                    ? new Date(pro.current_period_end).toLocaleDateString("fr-FR")
                    : "—"}
                </span>
              </div>
              {pro.stripe_customer_id && (
                <a
                  href={`https://dashboard.stripe.com/customers/${pro.stripe_customer_id}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="block text-[11px] mt-2 transition-colors duration-150"
                  style={{ color: "var(--admin-accent)" }}
                >
                  Voir sur Stripe →
                </a>
              )}
            </div>
          </div>

          {/* Actions Card */}
          <div
            className="rounded-xl p-4"
            style={{
              backgroundColor: "var(--admin-card)",
              border: "1px solid var(--admin-border)",
            }}
          >
            <h2
              className="text-sm font-semibold mb-3"
              style={{ color: "var(--admin-text)" }}
            >
              Actions
            </h2>
            <div className="space-y-2">
              {admin.role === "superadmin" && pro.claimed_at && (
                <AdminButton
                  variant="primary"
                  size="sm"
                  className="w-full"
                  disabled={impersonating}
                  onClick={async () => {
                    setImpersonating(true);
                    try {
                      const res = await fetch(
                        `/api/admin/pros/${pro.id}/impersonate`,
                        { method: "POST" }
                      );
                      if (res.ok) {
                        const data = await res.json();
                        window.open(data.url, "_blank");
                      }
                    } catch {
                      // ignore
                    }
                    setImpersonating(false);
                  }}
                >
                  {impersonating
                    ? "Connexion..."
                    : "Se connecter en tant que"}
                </AdminButton>
              )}
              <AdminButton
                variant={pro.is_active ? "danger" : "primary"}
                size="sm"
                className="w-full"
                onClick={() => setShowSuspend(true)}
              >
                {pro.is_active ? "Désactiver" : "Réactiver"}
              </AdminButton>
              <AdminButton
                variant="secondary"
                size="sm"
                className="w-full"
                onClick={() =>
                  window.open(`/artisan/${pro.slug}`, "_blank")
                }
              >
                Voir fiche publique
              </AdminButton>
            </div>
          </div>
        </div>
      </div>

      {/* Leads History */}
      <div
        className="rounded-xl mt-4"
        style={{
          backgroundColor: "var(--admin-card)",
          border: "1px solid var(--admin-border)",
        }}
      >
        <div className="px-4 py-3" style={{ borderBottom: "1px solid var(--admin-border)" }}>
          <h2
            className="text-sm font-semibold"
            style={{ color: "var(--admin-text)" }}
          >
            Historique leads ({leads.length})
          </h2>
        </div>

        {leads.length === 0 ? (
          <div className="px-4 py-8 text-center">
            <p className="text-xs" style={{ color: "var(--admin-text-tertiary)" }}>
              Aucun lead reçu
            </p>
          </div>
        ) : (
          <div>
            {leads.map((lead) => {
              const s = LEAD_STATUS[lead.status] || LEAD_STATUS.sent;
              return (
                <div
                  key={lead.id}
                  className="flex items-center gap-3 px-4 py-2.5 text-xs"
                  style={{ borderBottom: "1px solid var(--admin-border)" }}
                >
                  <span className="tabular-nums" style={{ color: "var(--admin-text-tertiary)" }}>
                    {new Date(lead.sent_at).toLocaleDateString("fr-FR", {
                      day: "2-digit",
                      month: "short",
                    })}
                  </span>
                  <span className="flex-1 truncate">
                    {lead.project?.first_name || "—"} — {lead.project?.description?.slice(0, 60) || ""}
                  </span>
                  <AdminBadge variant={s.variant}>{s.label}</AdminBadge>
                </div>
              );
            })}
          </div>
        )}
      </div>

      <AdminConfirmDialog
        open={showSuspend}
        onClose={() => setShowSuspend(false)}
        onConfirm={handleToggleActive}
        title={pro.is_active ? "Désactiver ce pro" : "Réactiver ce pro"}
        message={
          pro.is_active
            ? "Ce professionnel ne sera plus visible dans l'annuaire et ne recevra plus de leads."
            : "Ce professionnel redeviendra visible et pourra recevoir des leads."
        }
        confirmLabel={pro.is_active ? "Désactiver" : "Réactiver"}
        variant={pro.is_active ? "danger" : "primary"}
        loading={loading}
      />
    </div>
  );
}

function InfoRow({
  label,
  value,
  mono = false,
}: {
  label: string;
  value: string | null | undefined;
  mono?: boolean;
}) {
  return (
    <div>
      <span
        className="text-[11px] block mb-0.5"
        style={{ color: "var(--admin-text-tertiary)" }}
      >
        {label}
      </span>
      <span className={mono ? "font-mono" : ""}>
        {value || "—"}
      </span>
    </div>
  );
}

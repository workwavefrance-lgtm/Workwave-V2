"use client";

import { useState } from "react";
import { useDashboard } from "@/components/pro/dashboard/DashboardProvider";
import {
  createCheckoutSession,
  createPortalSession,
  cancelSubscription,
} from "@/app/pro/dashboard/abonnement/actions";

type Props = {
  successParam?: boolean;
  canceledParam?: boolean;
};

const STATUS_CONFIG: Record<
  string,
  { label: string; className: string; description: string }
> = {
  none: {
    label: "Gratuit",
    className: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
    description:
      "Activez votre abonnement pour commencer à recevoir des leads qualifiés.",
  },
  free: {
    label: "Gratuit",
    className: "bg-[var(--bg-tertiary)] text-[var(--text-secondary)]",
    description:
      "Activez votre abonnement pour commencer à recevoir des leads qualifiés.",
  },
  trialing: {
    label: "Essai gratuit",
    className: "bg-blue-500/10 text-blue-600 dark:text-blue-400",
    description:
      "Vous bénéficiez actuellement de l\u2019essai gratuit de 14 jours.",
  },
  active: {
    label: "Abonné",
    className: "bg-green-500/10 text-green-600 dark:text-green-400",
    description:
      "Votre abonnement est actif. Vous recevez les leads automatiquement.",
  },
  past_due: {
    label: "Paiement en attente",
    className: "bg-orange-500/10 text-orange-600 dark:text-orange-400",
    description:
      "Un problème de paiement a été détecté. Mettez à jour votre carte pour continuer à recevoir des leads.",
  },
  canceled: {
    label: "Résilié",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
    description:
      "Votre abonnement a été résilié. Votre fiche reste visible mais vous ne recevez plus de leads.",
  },
  suspended: {
    label: "Suspendu",
    className: "bg-red-500/10 text-red-600 dark:text-red-400",
    description:
      "Votre compte a été suspendu. Contactez le support pour plus d\u2019informations.",
  },
};

const FEATURES = [
  "Leads illimités dans votre zone",
  "Fiche professionnelle premium",
  "Statistiques détaillées",
  "Support prioritaire par email",
  "Badge \u00ab Pro Workwave \u00bb sur votre fiche",
];

const CANCEL_REASONS = [
  { value: "too_expensive", label: "Trop cher" },
  { value: "not_enough_leads", label: "Pas assez de leads" },
  { value: "lead_quality", label: "Qualité des leads insuffisante" },
  { value: "other", label: "Autre raison" },
];

export default function AbonnementView({
  successParam,
  canceledParam,
}: Props) {
  const { pro } = useDashboard();
  const [loading, setLoading] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [showCancelModal, setShowCancelModal] = useState(false);
  const [cancelReason, setCancelReason] = useState("");
  const [cancelFeedback, setCancelFeedback] = useState("");
  const [cancelSuccess, setCancelSuccess] = useState(false);

  const statusInfo =
    STATUS_CONFIG[pro.subscription_status] || STATUS_CONFIG.none;

  async function handleSubscribe(plan: "monthly" | "annual") {
    setLoading(plan);
    setError(null);
    const result = await createCheckoutSession(plan);
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    if (result.url) {
      window.location.href = result.url;
    }
  }

  async function handlePortal() {
    setLoading("portal");
    setError(null);
    const result = await createPortalSession();
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    if (result.url) {
      window.location.href = result.url;
    }
  }

  async function handleCancel() {
    if (!cancelReason) return;
    setLoading("cancel");
    const result = await cancelSubscription(cancelReason, cancelFeedback);
    if (result.error) {
      setError(result.error);
      setLoading(null);
      return;
    }
    setCancelSuccess(true);
    setShowCancelModal(false);
    setLoading(null);
  }

  // Jours restants d'essai
  const trialDaysLeft =
    pro.subscription_status === "trialing" && pro.trial_ends_at
      ? Math.max(
          0,
          Math.ceil(
            (new Date(pro.trial_ends_at).getTime() - Date.now()) / 86400000
          )
        )
      : null;

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Abonnement
        </h1>
        <p className="text-sm text-[var(--text-secondary)] mt-1">
          Gérez votre formule et votre facturation
        </p>
      </div>

      {/* Message de succès après Checkout */}
      {successParam && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-2xl p-4 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-green-500 shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          <p className="text-sm text-[var(--text-primary)]">
            Votre abonnement a été activé avec succès ! Vous allez commencer à
            recevoir des leads.
          </p>
        </div>
      )}

      {/* Message d'annulation Checkout */}
      {canceledParam && (
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-[var(--text-tertiary)] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m9-.75a9 9 0 11-18 0 9 9 0 0118 0zm-9 3.75h.008v.008H12v-.008z"
            />
          </svg>
          <p className="text-sm text-[var(--text-primary)]">
            Le paiement a été annulé. Vous pouvez réessayer quand vous le
            souhaitez.
          </p>
        </div>
      )}

      {/* Confirmation résiliation */}
      {cancelSuccess && (
        <div className="bg-[var(--bg-tertiary)] border border-[var(--border-color)] rounded-2xl p-4 flex items-center gap-3">
          <svg
            className="w-5 h-5 text-[var(--text-secondary)] shrink-0"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
            strokeWidth={2}
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M4.5 12.75l6 6 9-13.5"
            />
          </svg>
          <p className="text-sm text-[var(--text-primary)]">
            Votre résiliation a été enregistrée. Votre abonnement reste actif
            jusqu&apos;à la fin de la période en cours.
          </p>
        </div>
      )}

      {/* Erreur */}
      {error && (
        <div className="bg-red-500/10 border border-red-500/20 rounded-2xl p-4">
          <p className="text-sm text-red-600 dark:text-red-400">{error}</p>
        </div>
      )}

      {/* Statut actuel */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <div>
            <p className="text-sm font-medium text-[var(--text-primary)]">
              Statut actuel
            </p>
            <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
              Votre abonnement Workwave Pro
            </p>
          </div>
          <span
            className={`text-xs font-semibold px-3 py-1 rounded-full ${statusInfo.className}`}
          >
            {statusInfo.label}
          </span>
        </div>

        <p className="text-sm text-[var(--text-secondary)] mb-3">
          {statusInfo.description}
        </p>

        {trialDaysLeft !== null && (
          <p className="text-sm font-medium text-blue-600 dark:text-blue-400">
            {trialDaysLeft === 0
              ? "Votre essai se termine aujourd\u2019hui"
              : `${trialDaysLeft} jour${trialDaysLeft > 1 ? "s" : ""} restant${trialDaysLeft > 1 ? "s" : ""}`}
          </p>
        )}

        {pro.subscription_status === "active" && pro.current_period_end && (
          <p className="text-sm text-[var(--text-tertiary)]">
            Prochaine facturation le{" "}
            {new Date(pro.current_period_end).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
            {pro.subscription_plan === "monthly" && " — 39 \u20ac"}
            {pro.subscription_plan === "annual" && " — 390 \u20ac"}
          </p>
        )}
      </div>

      {/* Plans */}
      <div>
        <h2 className="text-lg font-semibold text-[var(--text-primary)] mb-4">
          Choisissez votre formule
        </h2>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          {/* Mensuel */}
          <div className="bg-[var(--bg-secondary)] border-2 border-[var(--card-border)] rounded-2xl p-6 flex flex-col">
            <div className="mb-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Mensuel
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Sans engagement
              </p>
            </div>
            <div className="mb-6">
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                39 &euro;
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                {" "}
                / mois
              </span>
            </div>
            <button
              onClick={() => handleSubscribe("monthly")}
              disabled={loading !== null}
              className="mt-auto w-full border-2 border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-250 disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading === "monthly"
                ? "Redirection..."
                : "Choisir le mensuel"}
            </button>
          </div>

          {/* Annuel */}
          <div className="bg-[var(--bg-secondary)] border-2 border-[var(--accent)] rounded-2xl p-6 flex flex-col relative">
            <div className="absolute -top-3 right-4">
              <span className="bg-[var(--accent)] text-white text-xs font-semibold px-3 py-1 rounded-full">
                2 mois offerts
              </span>
            </div>
            <div className="mb-4">
              <p className="text-sm font-semibold text-[var(--text-primary)]">
                Annuel
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Engagement 12 mois
              </p>
            </div>
            <div className="mb-1">
              <span className="text-3xl font-bold text-[var(--text-primary)]">
                32,50 &euro;
              </span>
              <span className="text-sm text-[var(--text-tertiary)]">
                {" "}
                / mois
              </span>
            </div>
            <p className="text-xs text-[var(--text-tertiary)] mb-6">
              <span className="line-through">39 &euro;/mois</span> — soit
              390 &euro;/an
            </p>
            <button
              onClick={() => handleSubscribe("annual")}
              disabled={loading !== null}
              className="mt-auto w-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-250 hover:scale-[1.02] disabled:opacity-60 disabled:cursor-not-allowed"
            >
              {loading === "annual"
                ? "Redirection..."
                : "Choisir l\u2019annuel"}
            </button>
          </div>
        </div>
      </div>

      {/* Fonctionnalités incluses */}
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
        <h2 className="text-sm font-semibold text-[var(--text-primary)] mb-4">
          Inclus dans votre abonnement
        </h2>
        <ul className="space-y-3">
          {FEATURES.map((feature) => (
            <li key={feature} className="flex items-center gap-3">
              <svg
                className="w-5 h-5 text-[var(--accent)] shrink-0"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2}
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M4.5 12.75l6 6 9-13.5"
                />
              </svg>
              <span className="text-sm text-[var(--text-primary)]">
                {feature}
              </span>
            </li>
          ))}
        </ul>
      </div>

      {/* Gérer la facturation */}
      {pro.stripe_customer_id && (
        <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium text-[var(--text-primary)]">
                Gérer ma facturation
              </p>
              <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                Historique des factures, mise à jour de la carte bancaire
              </p>
            </div>
            <button
              onClick={handlePortal}
              disabled={loading !== null}
              className="text-sm font-medium text-[var(--accent)] hover:underline disabled:opacity-60"
            >
              {loading === "portal" ? "Redirection..." : "Accéder"}
            </button>
          </div>
        </div>
      )}

      {/* Résilier */}
      {(pro.subscription_status === "active" ||
        pro.subscription_status === "trialing") &&
        pro.stripe_subscription_id && (
          <div className="border border-[var(--border-color)] rounded-2xl p-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-[var(--text-primary)]">
                  Résilier mon abonnement
                </p>
                <p className="text-xs text-[var(--text-tertiary)] mt-0.5">
                  La résiliation prend effet à la fin de la période en cours
                </p>
              </div>
              <button
                onClick={() => setShowCancelModal(true)}
                className="text-sm font-medium text-red-500 hover:underline"
              >
                Résilier
              </button>
            </div>
          </div>
        )}

      {/* Modale résiliation */}
      {showCancelModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={() => setShowCancelModal(false)}
          />
          <div className="relative bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-8 max-w-md w-full shadow-xl">
            <h3 className="text-lg font-semibold text-[var(--text-primary)] mb-2">
              Pourquoi souhaitez-vous résilier ?
            </h3>
            <p className="text-sm text-[var(--text-tertiary)] mb-6">
              Votre retour nous aide à améliorer Workwave.
            </p>

            <div className="space-y-2 mb-4">
              {CANCEL_REASONS.map((r) => (
                <label
                  key={r.value}
                  className={`flex items-center gap-3 p-3 rounded-xl cursor-pointer transition-colors duration-200 ${
                    cancelReason === r.value
                      ? "bg-[var(--accent)]/5 border border-[var(--accent)]/20"
                      : "bg-[var(--bg-secondary)] border border-[var(--card-border)] hover:bg-[var(--bg-tertiary)]"
                  }`}
                >
                  <input
                    type="radio"
                    name="cancel_reason"
                    value={r.value}
                    checked={cancelReason === r.value}
                    onChange={(e) => setCancelReason(e.target.value)}
                    className="accent-[var(--accent)]"
                  />
                  <span className="text-sm text-[var(--text-primary)]">
                    {r.label}
                  </span>
                </label>
              ))}
            </div>

            <textarea
              value={cancelFeedback}
              onChange={(e) => setCancelFeedback(e.target.value)}
              placeholder="Un commentaire ? (optionnel)"
              rows={3}
              className="w-full bg-[var(--bg-secondary)] border border-[var(--border-color)] rounded-xl px-4 py-3 text-sm text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] focus:outline-none focus:border-[var(--accent)] transition-colors duration-200 resize-none mb-6"
            />

            <div className="flex gap-3">
              <button
                onClick={() => setShowCancelModal(false)}
                className="flex-1 border border-[var(--border-color)] text-[var(--text-primary)] px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 hover:bg-[var(--bg-tertiary)]"
              >
                Annuler
              </button>
              <button
                onClick={handleCancel}
                disabled={!cancelReason || loading === "cancel"}
                className="flex-1 bg-red-500 hover:bg-red-600 text-white px-5 py-3 rounded-xl text-sm font-semibold transition-all duration-200 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {loading === "cancel"
                  ? "Résiliation..."
                  : "Confirmer la résiliation"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { startCheckout, openCustomerPortal } from "./actions";
import { isAiPremium, AI_CATEGORY_IDS } from "@/lib/ai/helpers";

export const metadata: Metadata = {
  title: "Abonnement — Dashboard Workwave AI",
  description: "Gerez votre abonnement Premium Workwave AI.",
  robots: { index: false, follow: false },
};

const ABONNEMENT_MESSAGES: Record<string, { type: "success" | "error" | "info"; text: string }> = {
  activated: {
    type: "success",
    text: "🎉 Premium active. Bienvenue ! Vous recevrez les projets matches par email + dans cette page.",
  },
  canceled: {
    type: "info",
    text: "Activation annulee. Aucun paiement n'a ete debite.",
  },
  no_stripe_customer: {
    type: "error",
    text: "Compte client introuvable. Activez Premium ci-dessous.",
  },
  no_subscription_yet: {
    type: "info",
    text: "Vous n'avez pas encore d'abonnement actif. Activez Premium ci-dessous.",
  },
  stripe_not_configured: {
    type: "error",
    text: "Service paiement temporairement indisponible. Reessayez dans quelques minutes.",
  },
  checkout_url_missing: {
    type: "error",
    text: "Erreur Stripe Checkout. Reessayez.",
  },
};

export default async function AiDashboardAbonnementPage({
  searchParams,
}: {
  searchParams: Promise<{ activated?: string; canceled?: string; error?: string }>;
}) {
  const sp = await searchParams;
  let msg: { type: "success" | "error" | "info"; text: string } | null = null;
  if (sp.activated === "1") msg = ABONNEMENT_MESSAGES.activated;
  else if (sp.canceled === "1") msg = ABONNEMENT_MESSAGES.canceled;
  else if (sp.error && ABONNEMENT_MESSAGES[sp.error]) msg = ABONNEMENT_MESSAGES[sp.error];

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  const isPremium = isAiPremium(pro);
  const isPastDue = pro.subscription_status === "past_due";

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · ABONNEMENT ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Abonnement.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)]">
          Plan Premium 29,90€/mois TTC pour repondre aux projets sans limite, profil mis en avant.
        </p>
      </div>

      {msg && (
        <div
          className={`mb-6 p-4 rounded-lg border ${
            msg.type === "success"
              ? "border-green-500/20 bg-green-500/10 text-green-800"
              : msg.type === "error"
              ? "border-red-500/20 bg-red-500/10 text-red-800"
              : "border-[var(--ai-border-strong)] bg-[var(--ai-bg-subtle)] text-[var(--ai-text)]"
          }`}
          role={msg.type === "error" ? "alert" : "status"}
        >
          <p className="text-sm font-medium">{msg.text}</p>
        </div>
      )}

      {isPastDue && (
        <div
          className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl"
          role="alert"
        >
          <p className="text-[11px] uppercase font-semibold text-red-700 mb-2 tracking-wider">
            ● Paiement en echec
          </p>
          <p className="text-sm text-red-900">
            Votre dernier paiement a echoue. Mettez a jour votre moyen de paiement
            pour reactiver votre abonnement.
          </p>
        </div>
      )}

      {/* Status actuel */}
      <div className="mb-8 p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
        <p
          className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Statut actuel
        </p>
        <div className="flex items-center gap-3 mb-2">
          <span
            className={`inline-block w-2 h-2 rounded-full ${
              isPremium
                ? "bg-[var(--ai-accent)]"
                : isPastDue
                ? "bg-red-500"
                : "bg-[var(--ai-text-tertiary)]"
            }`}
          />
          <span className="text-[20px] font-bold text-[var(--ai-text)]">
            {isPremium
              ? pro.subscription_status === "trialing"
                ? "Essai gratuit en cours"
                : "Premium actif"
              : isPastDue
              ? "Paiement en attente"
              : "Plan gratuit (visibilite seule)"}
          </span>
        </div>
        {isPremium && pro.current_period_end && (
          <p className="text-[13px] text-[var(--ai-text-secondary)]">
            Prochaine facturation :{" "}
            {new Date(pro.current_period_end).toLocaleDateString("fr-FR", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Actions */}
      {!isPremium ? (
        <div className="bg-[var(--ai-text)] text-white rounded-2xl p-8 relative overflow-hidden">
          <div
            aria-hidden="true"
            className="absolute inset-0 opacity-[0.04]"
            style={{
              backgroundImage:
                "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
              backgroundSize: "32px 32px",
            }}
          />
          <div className="relative z-10">
            <p
              className="text-[11px] uppercase font-semibold text-[var(--ai-accent)] mb-3"
              style={{ letterSpacing: "0.2em" }}
            >
              ★ Premium
            </p>
            <h2
              className="font-black uppercase mb-4"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              29,90€
              <span className="text-[18px] text-white/50 font-medium">/mois TTC</span>
            </h2>
            <ul className="space-y-2 text-[13px] text-white/80 mb-7">
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                Reponse illimitee a tous les projets publies de votre vertical
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                Profil mis en avant dans les listings
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                Badge Pro Workwave sur la fiche
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
                Resiliable en 1 clic, sans engagement
              </li>
            </ul>

            <form action={startCheckout}>
              <input type="hidden" name="plan" value="monthly" />
              <button
                type="submit"
                className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
              >
                Activer Premium maintenant
                <svg
                  className="ml-2 w-4 h-4"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </button>
            </form>
            <p className="text-[11px] text-white/40 mt-3">
              Paiement securise via Stripe. Annulation libre depuis votre dashboard.
            </p>
          </div>
        </div>
      ) : (
        <div className="space-y-3">
          <form action={openCustomerPortal}>
            <button
              type="submit"
              className="w-full sm:w-auto inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors"
            >
              Gerer mon abonnement
              <svg
                className="ml-2 w-4 h-4"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M7 17L17 7M17 7H9M17 7V15"
                  stroke="currentColor"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </button>
          </form>
          <p className="text-[12px] text-[var(--ai-text-tertiary)]">
            Vous serez redirige vers Stripe Customer Portal pour gerer votre
            carte, factures, et resiliation.
          </p>
        </div>
      )}

      {/* Link tarifs detail */}
      <div className="mt-12 pt-8 border-t border-[var(--ai-border-subtle)]">
        <Link
          href="/ai/tarifs"
          className="text-[13px] text-[var(--ai-text-tertiary)] hover:text-[var(--ai-accent)] transition-colors"
        >
          → Voir le detail des tarifs et comparatif Malt/Comet
        </Link>
      </div>
    </div>
  );
}

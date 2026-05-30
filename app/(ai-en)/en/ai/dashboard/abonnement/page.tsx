import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { isAiPremium, AI_CATEGORY_IDS } from "@/lib/ai/helpers";

export const metadata: Metadata = {
  title: "Membership — Workwave AI Dashboard",
  description: "Your Workwave AI membership.",
  robots: { index: false, follow: false },
};

/**
 * Membership page — ENGLISH, FREE-ONLY.
 *
 * Unlike the FR /ai/dashboard/abonnement page, this page does NOT expose any
 * Stripe checkout / customer portal UI: international accounts are free-only
 * for now (skip the payment risk). We keep a READ-ONLY display of the current
 * status and a simple "coming soon" info card. No Server Action is called.
 */
export default async function AiEnDashboardMembershipPage() {
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
          [ DASHBOARD · MEMBERSHIP ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Membership.
        </h1>
        <p className="text-base text-[var(--ai-text-secondary)]">
          Your profile is live and free. Paid plans for international accounts
          are on the way.
        </p>
      </div>

      {isPastDue && (
        <div
          className="mb-6 p-5 bg-red-500/10 border border-red-500/30 rounded-2xl"
          role="alert"
        >
          <p className="text-[11px] uppercase font-semibold text-red-700 mb-2 tracking-wider">
            ● Payment failed
          </p>
          <p className="text-sm text-red-900">
            Your last payment failed. Please write to us at{" "}
            <a
              href="mailto:contact@workwave.fr"
              className="underline decoration-red-300 hover:text-red-700"
            >
              contact@workwave.fr
            </a>{" "}
            so we can help.
          </p>
        </div>
      )}

      {/* Current status (read-only) */}
      <div className="mb-8 p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
        <p
          className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Current status
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
                ? "Free trial in progress"
                : "Premium active"
              : isPastDue
              ? "Payment pending"
              : "Free plan (visibility only)"}
          </span>
        </div>
        {isPremium && pro.current_period_end && (
          <p className="text-[13px] text-[var(--ai-text-secondary)]">
            Next billing date:{" "}
            {new Date(pro.current_period_end).toLocaleDateString("en-GB", {
              day: "numeric",
              month: "long",
              year: "numeric",
            })}
          </p>
        )}
      </div>

      {/* Premium — coming soon (info card, no checkout) */}
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
              fontSize: "clamp(24px, 3.5vw, 36px)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            Coming soon for
            <br />
            international accounts.
          </h2>
          <p className="text-[14px] text-white/70 leading-relaxed mb-6 max-w-lg">
            For now, your Workwave AI profile is completely free and already
            visible in the directory. We&apos;re finalising paid plans for
            international freelancers — you don&apos;t need to do anything. We&apos;ll
            let you know by email when Premium goes live in your region.
          </p>
          <ul className="space-y-2 text-[13px] text-white/80">
            <li className="flex items-start gap-2">
              <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
              Free profile, visible in the directory
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
              Unlimited project responses (with Premium, soon)
            </li>
            <li className="flex items-start gap-2">
              <span className="text-[var(--ai-accent)] mt-0.5 font-bold">→</span>
              Featured profile in listings (with Premium, soon)
            </li>
          </ul>
        </div>
      </div>

      {/* Help */}
      <div className="mt-12 pt-8 border-t border-[var(--ai-border-subtle)]">
        <p className="text-[13px] text-[var(--ai-text-tertiary)]">
          Questions about membership? Write to us at{" "}
          <a
            href="mailto:contact@workwave.fr"
            className="underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent)]"
          >
            contact@workwave.fr
          </a>
          .
        </p>
      </div>
    </div>
  );
}

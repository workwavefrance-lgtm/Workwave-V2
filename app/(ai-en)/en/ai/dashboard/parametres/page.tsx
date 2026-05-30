import type { Metadata } from "next";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { getAiProByUserId } from "@/lib/queries/pros";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import SubmitButton from "@/components/ai/SubmitButton";
// Reuse the FR Server Action (now locale-aware). Hidden name="locale" value="en"
// drives the EN redirects; the action accepts "DELETE" in addition to
// "SUPPRIMER" as the confirmation word.
import { deleteAiAccount } from "@/app/(ai)/ai/dashboard/parametres/actions";

export const metadata: Metadata = {
  title: "Settings — Workwave AI Dashboard",
  description: "Your Workwave AI account settings.",
  robots: { index: false, follow: false },
};

const PARAM_ERROR_MESSAGES: Record<string, string> = {
  confirm_required:
    "You must type DELETE in uppercase to confirm the deletion.",
  no_pro: "Account not found. Please sign in again.",
};

export default async function AiEnDashboardParametresPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string }>;
}) {
  const sp = await searchParams;
  const errKey = sp.error;
  const errorMsg = errKey && PARAM_ERROR_MESSAGES[errKey] ? PARAM_ERROR_MESSAGES[errKey] : "";

  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) return null;

  const pro = await getAiProByUserId(user.id);
  if (!pro || !AI_CATEGORY_IDS.includes(pro.category_id)) return null;

  return (
    <div className="max-w-3xl">
      <div className="mb-10">
        <p
          className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          [ DASHBOARD · SETTINGS ]
        </p>
        <h1
          className="font-black text-[var(--ai-text)] uppercase mb-3"
          style={{
            fontSize: "clamp(28px, 4.5vw, 48px)",
            lineHeight: 0.95,
            letterSpacing: "-0.04em",
          }}
        >
          Settings.
        </h1>
      </div>

      {errorMsg && (
        <div
          className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-800"
          role="alert"
        >
          <p className="text-sm font-medium">{errorMsg}</p>
        </div>
      )}

      {/* Email */}
      <div className="mb-6 p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
        <p
          className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Login email
        </p>
        <p className="text-[15px] text-[var(--ai-text)] font-medium">{user.email}</p>
        <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-2">
          To change your email, write to us at{" "}
          <a
            href="mailto:contact@workwave.fr"
            className="underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent)]"
          >
            contact@workwave.fr
          </a>
          .
        </p>
      </div>

      {/* Account (SIRET, ID, etc.) */}
      <div className="mb-6 p-6 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
        <p
          className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Account
        </p>
        <dl className="space-y-2 text-[13px]">
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ai-text-tertiary)]">Account ID</dt>
            <dd
              className="text-[var(--ai-text)] font-mono"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              #{pro.id}
            </dd>
          </div>
          {pro.siret && (
            <div className="flex justify-between gap-4">
              <dt className="text-[var(--ai-text-tertiary)]">SIRET</dt>
              <dd
                className="text-[var(--ai-text)] font-mono"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {pro.siret}
              </dd>
            </div>
          )}
          <div className="flex justify-between gap-4">
            <dt className="text-[var(--ai-text-tertiary)]">Category</dt>
            <dd className="text-[var(--ai-text)]">
              {pro.category && typeof pro.category === "object" && "name" in pro.category
                ? (pro.category as { name: string }).name
                : "Workwave AI"}
            </dd>
          </div>
        </dl>
      </div>

      {/* Useful links */}
      <div className="space-y-3 mb-10">
        <Link
          href={pro.slug ? `/ai/freelance/${pro.slug}` : "/ai/freelances"}
          className="block p-4 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-xl hover:border-[var(--ai-text)] transition-colors"
        >
          <p className="text-[14px] font-semibold text-[var(--ai-text)]">
            View my public profile
          </p>
          <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-1">
            How clients see your profile on Workwave AI.
          </p>
        </Link>
      </div>

      {/* Sign out */}
      <div className="pt-6 border-t border-[var(--ai-border-subtle)]">
        <Link
          href="/api/auth/signout?redirect=/en/ai"
          prefetch={false}
          className="inline-flex items-center justify-center h-11 px-5 text-[13px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors"
        >
          Sign out
        </Link>
      </div>

      {/* Account deletion — GDPR self-service */}
      <div className="mt-12 pt-8 border-t border-[var(--ai-border-subtle)]">
        <p
          className="text-[10px] uppercase font-semibold text-red-700 mb-3"
          style={{ letterSpacing: "0.18em", fontFamily: "var(--font-geist-mono), monospace" }}
        >
          Danger zone — Delete account
        </p>

        <div className="p-6 bg-red-50/40 border border-red-200 rounded-2xl">
          <h2 className="text-[18px] font-bold text-[var(--ai-text)] mb-2">
            Delete my Workwave AI account
          </h2>
          <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4">
            This action is <strong className="text-red-700">irreversible</strong>.
            Immediate effects:
          </p>
          <ul className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4 list-disc list-inside space-y-1">
            <li>Removal of your public profile on Workwave AI</li>
            <li>
              Immediate cancellation of any Premium membership (the current
              period is lost, no automatic refund)
            </li>
            <li>
              Nullification of your contact details (email, phone, website,
              social links)
            </li>
            <li>No more project emails will be sent to you</li>
            <li>You will be signed out immediately after deletion</li>
          </ul>
          <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4">
            To confirm, type{" "}
            <strong className="text-red-700 font-mono">DELETE</strong> in
            uppercase in the field below.
          </p>

          <form action={deleteAiAccount} className="space-y-3">
            <input type="hidden" name="locale" value="en" />
            <input
              type="text"
              name="confirm"
              required
              placeholder="Type DELETE to confirm"
              autoComplete="off"
              className="w-full h-11 px-4 text-[14px] font-mono border border-red-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-red-500"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            />
            <SubmitButton
              pendingText="Deleting…"
              className="inline-flex items-center justify-center h-11 px-5 text-[13px] font-semibold rounded-lg bg-red-600 hover:bg-red-700 text-white transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
            >
              Permanently delete my account
            </SubmitButton>
          </form>
        </div>

        <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-4 leading-relaxed">
          Having trouble? Write to us at{" "}
          <a
            href="mailto:contact@workwave.fr?subject=Delete%20Workwave%20AI%20account"
            className="underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent)]"
          >
            contact@workwave.fr
          </a>{" "}
          and mention your account ID (#{pro.id}).
        </p>
      </div>
    </div>
  );
}

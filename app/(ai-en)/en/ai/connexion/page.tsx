import type { Metadata } from "next";
import Link from "next/link";
import { Watermark } from "@/components/ai/ui/Watermark";
import SubmitButton from "@/components/ai/SubmitButton";
import { submitConnexion } from "@/app/(ai)/ai/connexion/actions";

/**
 * Sign-in page EN : /en/ai/connexion.
 *
 * Memes name/value que le form FR (app/(ai)/ai/connexion/page.tsx) => reutilise
 * le MEME Server Action submitConnexion. Un champ cache name="locale"=en pilote
 * les redirections (verifier/erreur) vers /en/ai/*.
 *
 * Lit ?prefill= (email pre-rempli si retour via "renvoyer un code") et ?error=.
 *
 * noindex : tunnel auth, pas SEO.
 */

export const metadata: Metadata = {
  title: "Sign in — Workwave AI",
  description:
    "Sign in to your Workwave AI freelancer account. Login code sent by email, no password to remember.",
  robots: { index: false, follow: false },
};

export default async function ConnexionEnPage({
  searchParams,
}: {
  searchParams: Promise<{ prefill?: string; error?: string }>;
}) {
  const sp = await searchParams;
  // Pre-fill email if user returns via "Resend a code"
  const prefilledEmail = sp.prefill ? decodeURIComponent(sp.prefill) : "";
  const error = sp.error;
  const errorMsg =
    error === "rate_limited"
      ? "Too many recent attempts. Please try again in 15 minutes."
      : error === "technical"
      ? "Temporary technical error. Please try again in a few minutes."
      : error === "invalid_email"
      ? "Invalid email. Please check the format."
      : "";

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center">
      <Watermark text="LOGIN" position="bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <div className="max-w-md mx-auto">
          {/* Logo grid 2x2 centered */}
          <Link
            href="/en/ai"
            className="inline-flex items-center gap-2.5 mb-12 group"
            aria-label="Workwave AI"
          >
            <div
              className="grid grid-cols-2 grid-rows-2 gap-[2px] w-8 h-8 transition-transform duration-200 group-hover:rotate-90"
              aria-hidden="true"
            >
              <div className="bg-[var(--ai-accent)] rounded-[2px]" />
              <div className="bg-[var(--ai-text)] rounded-[2px]" />
              <div className="bg-[var(--ai-text)] rounded-[2px]" />
              <div className="bg-[var(--ai-accent)] rounded-[2px]" />
            </div>
            <span className="text-[16px] font-semibold text-[var(--ai-text)] tracking-tight">
              Workwave{" "}
              <span className="font-medium text-[var(--ai-text-tertiary)]">
                AI
              </span>
            </span>
          </Link>

          {/* Pagination indicator */}
          <div className="flex items-center gap-4 mb-8">
            <span
              className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              [ LOGIN ]
            </span>
            <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
              Freelancer access
            </span>
          </div>

          {/* H1 */}
          <h1
            className="font-black text-[var(--ai-text)] uppercase mb-6"
            style={{
              fontSize: "clamp(40px, 7vw, 72px)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
            }}
          >
            Sign in.
          </h1>
          <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed mb-10">
            Enter your email to receive a login code. No password to remember.
          </p>

          {/* Form */}
          <form className="space-y-5" action={submitConnexion}>
            {/* Locale => redirections /en/ai/* */}
            <input type="hidden" name="locale" value="en" />

            <div>
              <label
                htmlFor="email"
                className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                style={{
                  letterSpacing: "0.18em",
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                Work email
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                defaultValue={prefilledEmail}
                placeholder="you@company.com"
                className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                autoComplete="email"
                autoFocus={!prefilledEmail}
              />
              {errorMsg && (
                <p className="text-[12px] text-red-700 mt-2" role="alert">
                  {errorMsg}
                </p>
              )}
            </div>

            <SubmitButton
              pendingText="Sending code..."
              className="w-full h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors flex items-center justify-center"
            >
              <span className="inline-flex items-center">
                Send my code
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
              </span>
            </SubmitButton>
          </form>

          {/* Switch to signup */}
          <div className="mt-10 pt-8 border-t border-[var(--ai-border-subtle)] text-center">
            <p className="text-sm text-[var(--ai-text-secondary)] mb-3">
              Not registered yet?
            </p>
            <Link
              href="/en/ai/inscription"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors"
            >
              Create a free freelancer account
              <svg
                className="w-3.5 h-3.5"
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
            </Link>
          </div>

          {/* Footer link */}
          <p className="text-[11px] text-[var(--ai-text-tertiary)] text-center mt-10">
            Got a project?{" "}
            <Link
              href="/en/ai/deposer"
              className="text-[var(--ai-text)] hover:text-[var(--ai-accent)] underline decoration-[var(--ai-border)] underline-offset-2 transition-colors"
            >
              Post it without an account
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

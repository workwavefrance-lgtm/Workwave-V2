import type { Metadata } from "next";
import Link from "next/link";
import { Watermark } from "@/components/ai/ui/Watermark";
import SubmitButton from "@/components/ai/SubmitButton";
import { verifyCode } from "@/app/(ai)/ai/connexion/verifier/actions";

/**
 * Code verification page EN : /en/ai/connexion/verifier.
 *
 * Memes name/value que le form FR (app/(ai)/ai/connexion/verifier/page.tsx) =>
 * reutilise le MEME Server Action verifyCode. Un champ cache name="locale"=en
 * pilote les redirections (dashboard/erreur) vers /en/ai/*.
 *
 * Lit ?email= (hidden + obfusque pour affichage), ?error= et ?maybe= (mode
 * anti-enumeration). Inclus le fallback support + rappel spam/15min.
 *
 * noindex : tunnel auth, pas SEO.
 */

export const metadata: Metadata = {
  title: "Login code — Workwave AI",
  description: "Enter the code sent by email to sign in to your Workwave AI workspace.",
  robots: { index: false, follow: false },
};

const ERROR_MESSAGES: Record<string, string> = {
  missing: "Missing code. Please try again.",
  invalid_code: "Incorrect code. You have attempts remaining.",
  expired: "Code expired (15 min). Request a new code.",
  blocked: "Too many attempts. Request a new code in a few minutes.",
  no_attempt: "No active request. Resend your email to get a new code.",
  signin_failed: "Sign-in error. Please try again.",
};

export default async function ConnexionVerifierEnPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string; error?: string; maybe?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email || "";
  const error = sp.error || "";
  const maybe = sp.maybe === "1"; // anti-enumeration mode

  // Obfuscate email for display (anti-shoulder-surfing)
  const obfuscated = email
    ? email.replace(/^(.)(.*)(@.*)$/, (_, first, mid, end) => {
        return first + "*".repeat(Math.min(mid.length, 6)) + end;
      })
    : "your email";

  const errorMsg = error ? ERROR_MESSAGES[error] || "Error. Please try again." : "";

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center">
      <Watermark text="VERIFY" position="bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <div className="max-w-md mx-auto">
          {/* Logo grid 2x2 */}
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
              <span className="font-medium text-[var(--ai-text-tertiary)]">AI</span>
            </span>
          </Link>

          <div className="flex items-center gap-4 mb-8">
            <span
              className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              [ LOGIN CODE ]
            </span>
            <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
              15 min
            </span>
          </div>

          <h1
            className="font-black text-[var(--ai-text)] uppercase mb-6"
            style={{
              fontSize: "clamp(32px, 6vw, 56px)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
            }}
          >
            Code sent.
          </h1>
          <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed mb-2">
            {maybe ? (
              <>If a Workwave AI account exists for this email, you&rsquo;ve received a login code.</>
            ) : (
              <>We sent a login code to <strong className="text-[var(--ai-text)]">{obfuscated}</strong>.</>
            )}
          </p>
          <p className="text-sm text-[var(--ai-text-tertiary)] mb-8">
            Check your spam folder if nothing arrives within 2 minutes. Email sent from{" "}
            <code className="text-[12px] px-1 py-0.5 rounded bg-[var(--ai-bg-subtle)] text-[var(--ai-text)]">
              contact@workwave.fr
            </code>
            . Code valid 15 min.
          </p>

          {errorMsg && (
            <div
              className="mb-6 p-4 rounded-lg border border-red-500/20 bg-red-500/10 text-red-700"
              role="alert"
            >
              <p className="text-sm font-medium">{errorMsg}</p>
            </div>
          )}

          <form className="space-y-5" action={verifyCode}>
            {/* Locale => redirections /en/ai/* */}
            <input type="hidden" name="locale" value="en" />
            <input type="hidden" name="email" value={email} />

            <div>
              <label
                htmlFor="code"
                className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                style={{
                  letterSpacing: "0.18em",
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                Code received by email
              </label>
              <input
                id="code"
                type="text"
                name="code"
                required
                inputMode="numeric"
                pattern="[0-9]{6,10}"
                maxLength={10}
                autoComplete="one-time-code"
                placeholder="12345678"
                className="w-full h-14 px-4 text-[24px] font-bold tracking-[0.3em] text-center text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                autoFocus
              />
            </div>

            <SubmitButton
              pendingText="Verifying..."
              className="w-full h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors flex items-center justify-center"
            >
              <span className="inline-flex items-center">
                Sign in
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

          {/* Resend a new code */}
          <div className="mt-10 pt-8 border-t border-[var(--ai-border-subtle)] text-center">
            <p className="text-sm text-[var(--ai-text-secondary)] mb-3">
              Didn&rsquo;t get a code?
            </p>
            <Link
              href={`/en/ai/connexion${email ? `?prefill=${encodeURIComponent(email)}` : ""}`}
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors"
            >
              Resend a new code
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

          {/* Fallback support */}
          <p className="text-[11px] text-[var(--ai-text-tertiary)] text-center mt-10 leading-relaxed">
            Having trouble? Email us at{" "}
            <a
              href="mailto:contact@workwave.fr"
              className="text-[var(--ai-text)] underline decoration-[var(--ai-border)] underline-offset-2"
            >
              contact@workwave.fr
            </a>
            . Reply within 48 business hours.
          </p>
        </div>
      </div>
    </section>
  );
}

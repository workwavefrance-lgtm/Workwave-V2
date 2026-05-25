import type { Metadata } from "next";
import Link from "next/link";
import { Watermark } from "@/components/ai/ui/Watermark";
import { submitConnexionStub } from "./actions";

export const metadata: Metadata = {
  title: "Connexion — Workwave AI",
  description:
    "Connectez-vous a votre compte freelance Workwave AI. Lien magique par email, sans mot de passe a retenir.",
  robots: { index: false, follow: false },
};

export default function ConnexionPage() {
  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center">
      <Watermark text="LOGIN" position="bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-20 w-full">
        <div className="max-w-md mx-auto">
          {/* Logo grid 2x2 centered */}
          <Link
            href="/ai"
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
              Acces freelance
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
            Connexion.
          </h1>
          <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed mb-10">
            Entrez votre email pour recevoir un lien de connexion magique. Pas
            de mot de passe a retenir.
          </p>

          {/* Form */}
          <form className="space-y-5" action={submitConnexionStub}>
            <div>
              <label
                htmlFor="email"
                className="block text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2"
                style={{
                  letterSpacing: "0.18em",
                  fontFamily: "var(--font-geist-mono), monospace",
                }}
              >
                Email professionnel
              </label>
              <input
                id="email"
                type="email"
                name="email"
                required
                placeholder="vous@entreprise.fr"
                className="w-full h-12 px-4 text-[15px] text-[var(--ai-text)] bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-lg placeholder:text-[var(--ai-text-muted)] focus:outline-none focus:border-[var(--ai-text)] focus:ring-2 focus:ring-[var(--ai-accent-subtle)] transition-all"
                autoComplete="email"
              />
            </div>

            <button
              type="submit"
              className="w-full h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors flex items-center justify-center"
            >
              Recevoir le lien magique
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

          {/* Switch to signup */}
          <div className="mt-10 pt-8 border-t border-[var(--ai-border-subtle)] text-center">
            <p className="text-sm text-[var(--ai-text-secondary)] mb-3">
              Pas encore inscrit ?
            </p>
            <Link
              href="/ai/inscription"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors"
            >
              Creer un compte freelance gratuit
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
            Vous portez un projet ?{" "}
            <Link
              href="/ai/deposer"
              className="text-[var(--ai-text)] hover:text-[var(--ai-accent)] underline decoration-[var(--ai-border)] underline-offset-2 transition-colors"
            >
              Deposer sans compte
            </Link>
          </p>
        </div>
      </div>
    </section>
  );
}

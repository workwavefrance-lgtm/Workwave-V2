import type { Metadata } from "next";
import Link from "next/link";
import { Watermark } from "@/components/ai/ui/Watermark";

export const metadata: Metadata = {
  title: "Email envoye — Workwave AI",
  description: "Email de connexion envoye.",
  robots: { index: false, follow: false },
};

export default async function ConnexionSuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string }>;
}) {
  const sp = await searchParams;
  const email = sp.email || "";

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center">
      <Watermark text="EMAIL" position="bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
        <div className="max-w-2xl mx-auto text-center">
          <div className="inline-flex items-center justify-center mb-10">
            <div className="grid grid-cols-2 grid-rows-2 gap-[2px] w-12 h-12" aria-hidden="true">
              <div className="bg-[var(--ai-accent)] rounded-[3px]" />
              <div className="bg-[var(--ai-text)] rounded-[3px]" />
              <div className="bg-[var(--ai-text)] rounded-[3px]" />
              <div className="bg-[var(--ai-accent)] rounded-[3px]" />
            </div>
          </div>

          <h1
            className="font-black text-[var(--ai-text)] uppercase mb-6"
            style={{
              fontSize: "clamp(36px, 6vw, 64px)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
            }}
          >
            Email envoye.
            <br />
            <span className="text-[var(--ai-text-tertiary)]">Verifiez votre boite.</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] leading-relaxed mb-8 max-w-xl mx-auto">
            Si un compte Workwave AI existe pour <strong className="text-[var(--ai-text)]">{email || "cette adresse"}</strong>,
            vous recevrez un email avec les instructions sous quelques minutes.
          </p>

          <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 mb-8 text-left max-w-md mx-auto">
            <p
              className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
              style={{ letterSpacing: "0.18em" }}
            >
              Pas d&apos;email recu ?
            </p>
            <ul className="text-[13px] text-[var(--ai-text-secondary)] space-y-2 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                Verifiez votre dossier spam / promotions
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                Email envoye depuis <code className="text-[12px] px-1 py-0.5 rounded bg-[var(--ai-bg-subtle)] text-[var(--ai-text)]">contact@workwave.fr</code>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                Toujours rien ? Repondez a notre support
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/ai"
              className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors"
            >
              Retour a l&apos;accueil
            </Link>
            <Link
              href="/ai/inscription"
              className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
            >
              Creer un compte
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

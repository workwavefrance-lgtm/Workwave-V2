import type { Metadata } from "next";
import Link from "next/link";
import { Watermark } from "@/components/ai/ui/Watermark";

export const metadata: Metadata = {
  title: "Projet envoye — Workwave AI",
  description:
    "Votre projet a ete recu. On selectionne les 3 meilleurs freelances pour vous. Reponse en moins de 24h.",
  robots: { index: false, follow: false },
};

export default async function DepostSuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string }>;
}) {
  const sp = await searchParams;
  const id = sp.id;

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center">
      <Watermark text="MERCI" position="bottom" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 w-full">
        <div className="max-w-2xl mx-auto text-center">
          {/* Logo 2x2 grid */}
          <div className="inline-flex items-center justify-center mb-10">
            <div
              className="grid grid-cols-2 grid-rows-2 gap-[2px] w-12 h-12"
              aria-hidden="true"
            >
              <div className="bg-[var(--ai-accent)] rounded-[3px]" />
              <div className="bg-[var(--ai-text)] rounded-[3px]" />
              <div className="bg-[var(--ai-text)] rounded-[3px]" />
              <div className="bg-[var(--ai-accent)] rounded-[3px]" />
            </div>
          </div>

          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              [ PROJET ENVOYE ]
            </span>
            <span className="h-px w-10 bg-[var(--ai-border)]" />
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
              Reponse sous 24h
            </span>
          </div>

          <h1
            className="font-black text-[var(--ai-text)] uppercase mb-6"
            style={{
              fontSize: "clamp(40px, 7vw, 80px)",
              lineHeight: 0.95,
              letterSpacing: "-0.05em",
            }}
          >
            C&apos;est parti.
            <br />
            <span className="text-[var(--ai-text-tertiary)]">On s&apos;en occupe.</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] leading-relaxed mb-10 max-w-xl mx-auto">
            On selectionne pour vous les 3 freelances qui correspondent le mieux
            a votre projet. Vous recevrez leurs profils par email sous 24h, et
            ils vous contacteront directement.
          </p>

          {id && (
            <p
              className="text-[12px] text-[var(--ai-text-tertiary)] mb-10"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Reference projet : #{id}
            </p>
          )}

          <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 mb-10 text-left max-w-md mx-auto">
            <p
              className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4"
              style={{
                fontFamily: "var(--font-geist-mono), monospace",
                letterSpacing: "0.2em",
              }}
            >
              {"// La suite"}
            </p>
            <ul className="space-y-3 text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0 font-bold">01</span>
                <span>On lit votre projet et on choisit 3 freelances qui correspondent a votre besoin.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0 font-bold">02</span>
                <span>Ils vous contactent directement sous 24h, par email ou telephone, avec leur proposition.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0 font-bold">03</span>
                <span>Vous comparez les offres et vous choisissez. Workwave ne prend aucune commission.</span>
              </li>
            </ul>
          </div>

          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link
              href="/ai"
              className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors duration-150"
            >
              Retour a l&apos;accueil
            </Link>
            <Link
              href="/ai/freelances"
              className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors duration-150"
            >
              Voir tous les freelances
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

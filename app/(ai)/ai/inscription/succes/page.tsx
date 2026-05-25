import type { Metadata } from "next";
import Link from "next/link";
import { Watermark } from "@/components/ai/ui/Watermark";

export const metadata: Metadata = {
  title: "Inscription recue — Workwave AI",
  description:
    "Votre inscription freelance Workwave AI est bien recue. Notre equipe vous contacte sous 48h pour activer votre compte.",
  robots: { index: false, follow: false },
};

export default async function InscriptionSuccesPage({
  searchParams,
}: {
  searchParams: Promise<{ id?: string; plan?: string }>;
}) {
  const sp = await searchParams;
  const id = sp.id;
  const plan = sp.plan === "premium" ? "Premium" : "Gratuit";

  return (
    <section className="relative overflow-hidden min-h-[calc(100vh-64px)] flex items-center">
      <Watermark text="MERCI" position="bottom" />

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

          <div className="flex items-center justify-center gap-4 mb-8">
            <span
              className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              [ INSCRIPTION RECUE ]
            </span>
            <span className="h-px w-10 bg-[var(--ai-border)]" />
            <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
              Reponse &lt; 48h
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
            Bienvenue.
            <br />
            <span className="text-[var(--ai-text-tertiary)]">Recu sous 48h.</span>
          </h1>

          <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] leading-relaxed mb-10 max-w-xl mx-auto">
            Votre inscription freelance Workwave AI est bien recue. Notre equipe
            verifie votre profil sous 48h ouvrees et vous envoie les instructions
            de connexion par mail.
          </p>

          {id && (
            <p
              className="text-[12px] text-[var(--ai-text-tertiary)] mb-10"
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              Reference inscription : #{id} · Plan choisi : {plan}
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
              // Etapes suivantes
            </p>
            <ul className="space-y-3 text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
              <li className="flex items-start gap-3">
                <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0 font-bold">01</span>
                <span>Email de confirmation envoye a votre adresse (verifiez vos spams).</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0 font-bold">02</span>
                <span>Notre equipe valide votre profil sous 48h ouvrees.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0 font-bold">03</span>
                <span>Email avec instructions de connexion + activation de votre compte.</span>
              </li>
              <li className="flex items-start gap-3">
                <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0 font-bold">04</span>
                <span>Reception de vos premiers briefs IA-matches par mail.</span>
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
              Voir les freelances deja inscrits
            </Link>
          </div>
        </div>
      </div>
    </section>
  );
}

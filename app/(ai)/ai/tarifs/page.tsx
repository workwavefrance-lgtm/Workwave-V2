import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";

export const metadata: Metadata = {
  title: "Tarifs — Gratuit cote client, 29,90€/mois cote freelance",
  description:
    "Workwave AI est gratuit pour les porteurs de projet. Les freelances tech paient 29,90€ TTC/mois pour repondre aux briefs, sans credits, sans commission. Resiliable a tout moment.",
};

const CLIENT_FEATURES = [
  "Depot de projet illimite, gratuit",
  "Matching IA en moins de 24h",
  "3 freelances qualifies par brief",
  "Aucune commission sur vos missions",
  "Annulation a tout moment, sans frais",
];

const FREELANCE_FEATURES = [
  "Reception de briefs qualifies par IA",
  "Reponse sans limite (pas de credits)",
  "Profil mis en avant sur les listings",
  "Badge Pro Workwave sur la fiche",
  "Statistiques d'impressions et de matchs",
  "Resiliation libre, sans engagement",
];

const COMPARISON = [
  {
    feature: "Inscription cote client",
    workwave: { value: "Gratuit", positive: true },
    codeur: { value: "Gratuit", positive: true },
    malt: { value: "Gratuit", positive: true },
  },
  {
    feature: "Inscription cote freelance",
    workwave: { value: "Gratuite + 29,90€/mois pour repondre", positive: true },
    codeur: { value: "Gratuite + credits a l'unite", positive: false },
    malt: { value: "Gratuite + 12€/mois Premium", positive: false },
  },
  {
    feature: "Systeme de credits",
    workwave: { value: "Aucun", positive: true },
    codeur: { value: "Oui", positive: false },
    malt: { value: "Aucun", positive: true },
  },
  {
    feature: "Commission sur les missions",
    workwave: { value: "0%", positive: true },
    codeur: { value: "0%", positive: true },
    malt: { value: "10% jusqu'a 5K€", positive: false },
  },
  {
    feature: "Matching automatique par IA",
    workwave: { value: "Oui", positive: true },
    codeur: { value: "Non", positive: false },
    malt: { value: "Non", positive: false },
  },
  {
    feature: "Engagement",
    workwave: { value: "Aucun", positive: true },
    codeur: { value: "Aucun", positive: true },
    malt: { value: "Aucun", positive: true },
  },
];

export default function TarifsPage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        <Watermark text="PRICING" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
          <div className="max-w-4xl">
            <SectionLabel index={1} total={4} label="Tarifs" />
            <h1
              className="font-black text-[var(--ai-text)] uppercase mb-8"
              style={{
                fontSize: "clamp(40px, 7.5vw, 92px)",
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
              }}
            >
              Gratuit
              <br />
              pour vous.{" "}
              <span className="text-[var(--ai-text-tertiary)]">
                29,90€
                <br />
                pour les
                <br />
                freelances.
              </span>
            </h1>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
              Si vous portez un projet tech : c&apos;est gratuit, sans limite,
              sans engagement. Si vous etes freelance et voulez repondre aux
              briefs : 29,90€ TTC/mois, sans credit, sans commission. Resiliable
              en un clic.
            </p>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2 — CARDS PRICING (CLIENT + FREELANCE)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Card client : light */}
            <div className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 sm:p-10">
              <SectionLabel index="02A" total={4} label="Cote client" />
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{
                  fontSize: "clamp(32px, 4.5vw, 52px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                Porteur de
                <br />
                projet.
              </h2>

              <div className="flex items-baseline gap-2 mb-2">
                <span
                  className="text-5xl sm:text-6xl font-black text-[var(--ai-text)] tracking-tight"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  0€
                </span>
                <span className="text-sm text-[var(--ai-text-tertiary)]">
                  / illimite
                </span>
              </div>
              <p
                className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-8"
                style={{ letterSpacing: "0.18em" }}
              >
                Aucun frais, jamais
              </p>

              <ul className="space-y-3 mb-10">
                {CLIENT_FEATURES.map((feat) => (
                  <li
                    key={feat}
                    className="flex items-start gap-3 text-sm text-[var(--ai-text-secondary)]"
                  >
                    <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0">
                      →
                    </span>
                    {feat}
                  </li>
                ))}
              </ul>

              <Link
                href="/ai/deposer"
                className="inline-flex items-center justify-center w-full h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-text)] hover:bg-[#1F1F1F] text-white transition-colors"
              >
                Deposer un projet
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
              </Link>
            </div>

            {/* Card freelance : dark + accent */}
            <div className="bg-[var(--ai-text)] text-white rounded-2xl p-8 sm:p-10 relative overflow-hidden">
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
                <div className="flex items-center gap-4 mb-6">
                  <span
                    className="text-[11px] font-medium tracking-[0.2em] text-white/40"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    [ 02B / 04 ]
                  </span>
                  <span className="h-px flex-1 max-w-[40px] bg-white/20" />
                  <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
                    <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                    Cote freelance
                  </span>
                </div>

                <h2
                  className="font-black uppercase mb-6"
                  style={{
                    fontSize: "clamp(32px, 4.5vw, 52px)",
                    lineHeight: 1,
                    letterSpacing: "-0.04em",
                  }}
                >
                  Freelance
                  <br />
                  <span className="text-[var(--ai-accent)]">tech.</span>
                </h2>

                <div className="flex items-baseline gap-2 mb-2">
                  <span
                    className="text-5xl sm:text-6xl font-black tracking-tight"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    29,90€
                  </span>
                  <span className="text-sm text-white/50">/ mois TTC</span>
                </div>
                <p
                  className="text-[11px] uppercase font-semibold text-white/40 mb-8"
                  style={{ letterSpacing: "0.18em" }}
                >
                  Resiliable en 1 clic
                </p>

                <ul className="space-y-3 mb-10">
                  {FREELANCE_FEATURES.map((feat) => (
                    <li
                      key={feat}
                      className="flex items-start gap-3 text-sm text-white/70"
                    >
                      <span className="text-[var(--ai-accent)] mt-0.5 flex-shrink-0">
                        →
                      </span>
                      {feat}
                    </li>
                  ))}
                </ul>

                <Link
                  href="/ai/inscription"
                  className="inline-flex items-center justify-center w-full h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
                >
                  S&apos;inscrire gratuitement
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
                </Link>
                <p className="text-[11px] text-white/40 text-center mt-3">
                  Inscription gratuite, abonnement uniquement pour repondre
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3 — COMPARATIF
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <SectionLabel index={3} total={4} label="Comparatif" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase"
              style={{
                fontSize: "clamp(32px, 5vw, 64px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              Workwave AI vs
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                la concurrence.
              </span>
            </h2>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] mt-6 leading-relaxed">
              Le pricing de Workwave AI vs Codeur.com et Malt sur les criteres
              qui comptent vraiment.
            </p>
          </div>

          {/* Desktop : table */}
          <div className="hidden md:block bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ai-border-subtle)]">
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Critere
                  </th>
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-accent)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    ● Workwave AI
                  </th>
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Codeur.com
                  </th>
                  <th
                    className="text-left px-6 py-5 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                    style={{ letterSpacing: "0.18em" }}
                  >
                    Malt
                  </th>
                </tr>
              </thead>
              <tbody>
                {COMPARISON.map((row, i) => (
                  <tr
                    key={row.feature}
                    className={
                      i < COMPARISON.length - 1
                        ? "border-b border-[var(--ai-border-subtle)]"
                        : ""
                    }
                  >
                    <td className="px-6 py-5 text-sm font-semibold text-[var(--ai-text)]">
                      {row.feature}
                    </td>
                    <td className="px-6 py-5 text-sm">
                      <span
                        className={
                          row.workwave.positive
                            ? "text-[var(--ai-text)]"
                            : "text-[var(--ai-text-tertiary)]"
                        }
                      >
                        {row.workwave.value}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-[var(--ai-text-secondary)]">
                      {row.codeur.value}
                    </td>
                    <td className="px-6 py-5 text-sm text-[var(--ai-text-secondary)]">
                      {row.malt.value}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Mobile : cards stack */}
          <div className="md:hidden space-y-4">
            {COMPARISON.map((row) => (
              <div
                key={row.feature}
                className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-xl p-5"
              >
                <p className="text-sm font-semibold text-[var(--ai-text)] mb-4">
                  {row.feature}
                </p>
                <dl className="space-y-2.5 text-[13px]">
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ai-accent)] font-medium flex items-center gap-1.5">
                      <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                      Workwave AI
                    </dt>
                    <dd className="text-right text-[var(--ai-text)]">
                      {row.workwave.value}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ai-text-tertiary)]">
                      Codeur.com
                    </dt>
                    <dd className="text-right text-[var(--ai-text-secondary)]">
                      {row.codeur.value}
                    </dd>
                  </div>
                  <div className="flex justify-between gap-4">
                    <dt className="text-[var(--ai-text-tertiary)]">Malt</dt>
                    <dd className="text-right text-[var(--ai-text-secondary)]">
                      {row.malt.value}
                    </dd>
                  </div>
                </dl>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4 — CTA FINAL
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)] relative overflow-hidden">
        <Watermark text="START.NOW" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28 text-center">
          <SectionLabel index={4} total={4} label="Commencer" />
          <h2
            className="font-black text-[var(--ai-text)] uppercase mb-6 mx-auto max-w-3xl"
            style={{
              fontSize: "clamp(32px, 5vw, 64px)",
              lineHeight: 0.95,
              letterSpacing: "-0.04em",
            }}
          >
            Pret a tester ?
          </h2>
          <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-xl mx-auto leading-relaxed mb-10">
            Aucune carte requise. Aucun engagement. Tout est gratuit cote
            client, 29,90€ cote freelance uniquement quand vous voulez
            repondre.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/ai/deposer"
              className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors w-full sm:w-auto"
              style={{ boxShadow: "var(--ai-shadow-sm)" }}
            >
              Deposer un projet
            </Link>
            <Link
              href="/ai/inscription"
              className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors w-full sm:w-auto"
            >
              Je suis freelance
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

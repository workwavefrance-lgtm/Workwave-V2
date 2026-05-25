import type { Metadata } from "next";

/**
 * Placeholder Phase 2 — direction visuelle Pixel Rise (validee par Willy 25/05).
 *
 * Codes design :
 *   - Display typography ultra-bold, leading serre, tracking negatif
 *   - Watermark giant text en fond (WORKWAVE.AI) avec opacite 4-5%
 *   - Indicateur de pagination monospace [1/8] style portfolio agence
 *   - Accent orange retro #FF6803 (distinct coral BTP)
 *   - Stats block a droite avec arrow up + chiffre + label uppercase
 *
 * La vraie landing arrive en Phase 3 — ici on valide juste le visuel.
 */
export const metadata: Metadata = {
  title: "Workwave AI — Trouvez le freelance tech ideal",
  description:
    "Plateforme de mise en relation entre porteurs de projet et freelances tech (IA, dev, cloud, no-code). Inscription gratuite, matching par IA, sans credit.",
};

export default function AiHomePage() {
  return (
    <div className="relative overflow-hidden">
      {/* Watermark giant text derriere le hero */}
      <div
        aria-hidden="true"
        className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-0 overflow-hidden"
      >
        <span
          className="block font-black uppercase whitespace-nowrap leading-none tracking-[-0.05em]"
          style={{
            fontSize: "clamp(80px, 17vw, 260px)",
            color: "var(--ai-text-watermark)",
            transform: "translateY(15%)",
          }}
        >
          WORKWAVE.AI
        </span>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 lg:py-28">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-start">
          {/* ─────── Hero (col 1-8) ─────── */}
          <div className="lg:col-span-8">
            {/* Pagination indicator + phase badge */}
            <div className="flex items-center gap-4 mb-8 sm:mb-12">
              <span
                className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                [ 1 / 8 ]
              </span>
              <span className="h-px flex-1 max-w-[60px] bg-[var(--ai-border)]" />
              <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.15em] uppercase text-[var(--ai-accent)]">
                <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                Phase 2/10
              </span>
            </div>

            {/* H1 display ultra-bold */}
            <h1
              className="font-black text-[var(--ai-text)] uppercase mb-8"
              style={{
                fontSize: "clamp(40px, 7.5vw, 92px)",
                lineHeight: 0.95,
                letterSpacing: "-0.05em",
              }}
            >
              Trouvez le
              <br />
              freelance tech
              <br />
              <span className="text-[var(--ai-text-tertiary)]">ideal.</span>
            </h1>

            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-xl leading-relaxed mb-10">
              Workwave AI connecte les porteurs de projet aux freelances tech
              (IA, dev, cloud, no-code, data, design). Matching par IA,
              inscription gratuite, sans credit.
            </p>

            {/* CTAs : primaire orange + secondaire blanc/bordure */}
            <div className="flex flex-col sm:flex-row gap-3">
              <button
                type="button"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-[var(--ai-accent-text)] transition-colors duration-150 w-full sm:w-auto shadow-sm"
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
              </button>
              <button
                type="button"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors duration-150 w-full sm:w-auto"
              >
                Voir les freelances
              </button>
            </div>
          </div>

          {/* ─────── Stats / validation block (col 9-12) ─────── */}
          <div className="lg:col-span-4 lg:pt-2 space-y-10">
            {/* Stat headline avec arrow up */}
            <div>
              <div className="flex items-baseline gap-3 mb-3">
                <svg
                  className="w-6 h-6 text-[var(--ai-accent)] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  style={{ transform: "translateY(2px)" }}
                >
                  <path
                    d="M7 17L17 7M17 7H9M17 7V15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className="text-4xl sm:text-5xl font-black text-[var(--ai-text)] tracking-tight"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  &lt; 24h
                </span>
              </div>
              <p
                className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
                style={{ letterSpacing: "0.18em" }}
              >
                Matching IA
              </p>
              <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                Notre IA route votre brief aux 3 meilleurs profils en moins de
                24h. Gratuit, sans credit, sans engagement.
              </p>
            </div>

            {/* Validation Phase 2 (compact) */}
            <div className="border-t border-[var(--ai-border-subtle)] pt-8">
              <p
                className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4"
                style={{
                  fontFamily: "var(--font-geist-mono), monospace",
                  letterSpacing: "0.2em",
                }}
              >
                // Phase 2 validation
              </p>
              <ul className="text-[13px] text-[var(--ai-text-secondary)] space-y-2 leading-relaxed">
                <li className="flex items-start gap-2">
                  <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                  Layout AI scope <code className="text-[12px] px-1 py-0.5 rounded bg-[var(--ai-bg-subtle)] text-[var(--ai-text)]">.ai-theme</code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                  Accent retro <code className="text-[12px] px-1 py-0.5 rounded bg-[var(--ai-bg-subtle)] text-[var(--ai-text)]">#FF6803</code>
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                  Watermark giant typography
                </li>
                <li className="flex items-start gap-2">
                  <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                  Zero composant BTP herite
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

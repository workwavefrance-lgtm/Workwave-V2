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
      {/* Socials flottantes verticales droite (desktop only, style Pixel Rise) */}
      <aside
        className="hidden lg:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-20"
        aria-label="Reseaux sociaux"
      >
        {[
          {
            href: "https://www.linkedin.com/company/workwave-fr",
            label: "LinkedIn",
            path: "M4.98 3.5C4.98 4.881 3.87 6 2.5 6S0 4.881 0 3.5 1.119 1 2.5 1s2.48 1.119 2.48 2.5zM0 24h5V8H0v16zm7.5-16H12.3v2.2h.069c.665-1.26 2.291-2.586 4.717-2.586C22.21 7.614 24 10.952 24 15.295V24h-5v-7.83c0-1.864-.034-4.263-2.598-4.263-2.601 0-3 2.031-3 4.13V24h-5V8z",
          },
          {
            href: "https://twitter.com/workwave_fr",
            label: "X",
            path: "M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-5.214-6.817L4.99 21.75H1.68l7.73-8.835L1.254 2.25H8.08l4.713 6.231zm-1.161 17.52h1.833L7.084 4.126H5.117z",
          },
          {
            href: "https://www.instagram.com/workwave.fr",
            label: "Instagram",
            path: "M12 0C8.74 0 8.333.015 7.053.072 5.775.132 4.905.333 4.14.63c-.789.306-1.459.717-2.126 1.384S.935 3.35.63 4.14C.333 4.905.131 5.775.072 7.053.012 8.333 0 8.74 0 12s.015 3.667.072 4.947c.06 1.277.261 2.148.558 2.913.306.788.717 1.459 1.384 2.126.667.666 1.336 1.079 2.126 1.384.766.296 1.636.499 2.913.558C8.333 23.988 8.74 24 12 24s3.667-.015 4.947-.072c1.277-.06 2.148-.262 2.913-.558.788-.306 1.459-.718 2.126-1.384.666-.667 1.079-1.335 1.384-2.126.296-.765.499-1.636.558-2.913.06-1.28.072-1.687.072-4.947s-.015-3.667-.072-4.947c-.06-1.277-.262-2.149-.558-2.913-.306-.789-.718-1.459-1.384-2.126C21.319 1.347 20.651.935 19.86.63c-.765-.297-1.636-.499-2.913-.558C15.667.012 15.26 0 12 0zm0 2.16c3.203 0 3.585.016 4.85.071 1.17.055 1.805.249 2.227.415.562.217.96.477 1.382.896.419.42.679.819.896 1.381.164.422.36 1.057.413 2.227.057 1.266.07 1.646.07 4.85s-.015 3.585-.074 4.85c-.061 1.17-.256 1.805-.421 2.227-.224.562-.479.96-.899 1.382-.419.419-.824.679-1.38.896-.42.164-1.065.36-2.235.413-1.274.057-1.649.07-4.859.07-3.211 0-3.586-.015-4.859-.074-1.171-.061-1.816-.256-2.236-.421-.569-.224-.96-.479-1.379-.899-.421-.419-.69-.824-.9-1.38-.165-.42-.359-1.065-.42-2.235-.045-1.26-.061-1.649-.061-4.844 0-3.196.016-3.586.061-4.861.061-1.17.255-1.814.42-2.234.21-.57.479-.96.9-1.381.419-.419.81-.689 1.379-.898.42-.166 1.051-.361 2.221-.421 1.275-.045 1.65-.06 4.859-.06l.045.03zm0 3.678c-3.405 0-6.162 2.76-6.162 6.162 0 3.405 2.76 6.162 6.162 6.162 3.405 0 6.162-2.76 6.162-6.162 0-3.405-2.76-6.162-6.162-6.162zM12 16c-2.21 0-4-1.79-4-4s1.79-4 4-4 4 1.79 4 4-1.79 4-4 4zm7.846-10.405c0 .795-.646 1.44-1.44 1.44-.795 0-1.44-.646-1.44-1.44 0-.794.646-1.439 1.44-1.439.793-.001 1.44.645 1.44 1.439z",
          },
        ].map((social) => (
          <a
            key={social.label}
            href={social.href}
            target="_blank"
            rel="noopener noreferrer nofollow"
            className="w-9 h-9 rounded-md bg-[var(--ai-bg-card)] border border-[var(--ai-border)] flex items-center justify-center text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] hover:border-[var(--ai-text)] transition-colors duration-150"
            aria-label={social.label}
          >
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="currentColor"
              aria-hidden="true"
            >
              <path d={social.path} />
            </svg>
          </a>
        ))}
      </aside>

      {/* Scroll indicator (style Pixel Rise "Scroll to explore more") */}
      <div
        aria-hidden="true"
        className="hidden lg:flex flex-col items-center gap-2 absolute bottom-6 left-1/2 -translate-x-1/2 z-20 pointer-events-none"
      >
        <div className="w-8 h-8 rounded-full bg-[var(--ai-bg-card)] border border-[var(--ai-border)] flex items-center justify-center">
          <svg
            className="w-3.5 h-3.5 text-[var(--ai-text-tertiary)]"
            viewBox="0 0 24 24"
            fill="none"
          >
            <path
              d="M12 5v14M5 12l7 7 7-7"
              stroke="currentColor"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <span
          className="text-[10px] font-medium text-[var(--ai-text-tertiary)] uppercase"
          style={{ letterSpacing: "0.2em" }}
        >
          Scroll
        </span>
      </div>

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

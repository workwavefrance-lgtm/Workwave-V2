import type { Metadata } from "next";
import Link from "next/link";

/**
 * Landing /ai (Workwave AI) — style Pixel Rise (validee Willy 25/05).
 *
 * Structure 5 sections :
 *   [1/5] Hero (watermark, socials, scroll)
 *   [2/5] Comment ca marche (3 etapes numerotees)
 *   [3/5] Categories tech (6 cards)
 *   [4/5] Pourquoi Workwave AI (4 differentiators)
 *   [5/5] Freelance + CTA final
 *
 * Aucun composant BTP. Tokens .ai-theme scopes.
 */

export const metadata: Metadata = {
  title: "Workwave AI — Trouvez le freelance tech ideal en moins de 24h",
  description:
    "Plateforme de mise en relation IA entre porteurs de projet et freelances tech (IA, dev, cloud, no-code, data, design). Matching automatique en moins de 24h. Inscription gratuite, sans credit, sans engagement. France et Europe.",
};

// ─────────────────────────────────────────────────────────────────────
// Section helper : indicateur de pagination + label + titre H2
// ─────────────────────────────────────────────────────────────────────
function SectionLabel({
  index,
  total,
  label,
}: {
  index: number;
  total: number;
  label: string;
}) {
  return (
    <div className="flex items-center gap-4 mb-6">
      <span
        className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
      >
        [ {String(index).padStart(2, "0")} / {String(total).padStart(2, "0")} ]
      </span>
      <span className="h-px flex-1 max-w-[40px] bg-[var(--ai-border)]" />
      <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text)]">
        <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
        {label}
      </span>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────────────
// Data
// ─────────────────────────────────────────────────────────────────────
const STEPS = [
  {
    n: "01",
    title: "Decrivez votre projet",
    desc: "Notre chat IA qualifie votre brief en 60 secondes : objectif, stack, budget, delai. Pas de formulaire interminable.",
  },
  {
    n: "02",
    title: "L'IA selectionne les 3 meilleurs profils",
    desc: "Matching semantique sur notre base de freelances tech. Score sur l'expertise, l'historique de projets, la dispo et le tarif.",
  },
  {
    n: "03",
    title: "Discutez directement avec eux",
    desc: "Echange en direct sans intermediaire. Devis, contrat, paiement : 100% libre. Aucune commission Workwave.",
  },
];

const CATEGORIES = [
  {
    slug: "intelligence-artificielle",
    name: "Intelligence Artificielle",
    skills: "LLM, RAG, agents, fine-tuning, vision",
    count: 18,
  },
  {
    slug: "developpement-web",
    name: "Developpement Web",
    skills: "React, Next.js, Vue, full-stack, mobile",
    count: 32,
  },
  {
    slug: "cloud-devops",
    name: "Cloud & DevOps",
    skills: "AWS, GCP, Azure, Kubernetes, CI/CD",
    count: 21,
  },
  {
    slug: "no-code-automation",
    name: "No-Code & Automation",
    skills: "Bubble, Make, Zapier, Airtable, Webflow",
    count: 14,
  },
  {
    slug: "data-analytics",
    name: "Data & Analytics",
    skills: "BI, ETL, ML engineering, data science",
    count: 19,
  },
  {
    slug: "design-produit",
    name: "Design Produit",
    skills: "UX/UI, prototypage, design system, Figma",
    count: 16,
  },
];

const WHY = [
  {
    title: "Matching par IA",
    desc: "Selection semantique des 3 meilleurs profils en moins de 24h. Fini les listes interminables de candidatures.",
  },
  {
    title: "Inscription gratuite",
    desc: "Aucun frais cote porteur de projet. Vos briefs sont publies et matches en moins de 24h, sans engagement.",
  },
  {
    title: "Sans credit, sans commission",
    desc: "Les freelances paient 29,90€/mois pour repondre, sans systeme de credits limites. Workwave ne prend aucune commission sur vos missions.",
  },
  {
    title: "France & Europe",
    desc: "Freelances francophones, anglophones, allemands, espagnols. Travail a distance ou hybride selon vos besoins.",
  },
];

// ─────────────────────────────────────────────────────────────────────
// Page
// ─────────────────────────────────────────────────────────────────────
export default function AiHomePage() {
  return (
    <>
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1/5 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden">
        {/* Socials flottantes verticales droite (xl+ only pour eviter overlap col droite a lg) */}
        <aside
          className="hidden xl:flex flex-col gap-3 absolute right-6 top-1/2 -translate-y-1/2 z-20"
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

        {/* Watermark giant text */}
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
            <div className="lg:col-span-8">
              {/* Pagination + trust badge */}
              <div className="flex items-center gap-4 mb-8 sm:mb-12">
                <span
                  className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)]"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  [ 01 / 05 ]
                </span>
                <span className="h-px flex-1 max-w-[60px] bg-[var(--ai-border)]" />
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                  France & Europe
                </span>
              </div>

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
                (IA, dev, cloud, no-code, data, design). Matching par IA en
                moins de 24h. Inscription gratuite, sans credit.
              </p>

              {/* CTA bar composite (search-bar look, single click target,
                  style Codeur "Recevoir des devis" mais en brand Pixel Rise) */}
              <Link
                href="/ai/deposer"
                className="group flex flex-col sm:flex-row items-stretch bg-[var(--ai-bg-card)] border-2 border-[var(--ai-border-strong)] rounded-2xl overflow-hidden hover:border-[var(--ai-text)] hover:-translate-y-1 hover:shadow-2xl transition-all duration-200 max-w-3xl"
                style={{ boxShadow: "var(--ai-shadow-lg)" }}
                aria-label="Deposer un projet — formulaire en 4 etapes"
              >
                {/* Hint text (left) — XL */}
                <div className="flex-1 flex items-center gap-4 px-6 py-6 sm:py-7 min-w-0">
                  <div
                    className="grid grid-cols-2 grid-rows-2 gap-[3px] w-7 h-7 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden="true"
                  >
                    <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                    <div className="bg-[var(--ai-text)] rounded-[2px]" />
                    <div className="bg-[var(--ai-text)] rounded-[2px]" />
                    <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                  </div>
                  <div className="min-w-0">
                    <p className="text-[16px] sm:text-[18px] font-bold text-[var(--ai-text)] truncate tracking-tight">
                      Decrivez votre projet
                    </p>
                    <p className="text-[12px] sm:text-[13px] text-[var(--ai-text-secondary)] mt-0.5">
                      Matching IA en moins de 24h — gratuit, sans credit
                    </p>
                  </div>
                </div>

                {/* Orange CTA (right) — XL */}
                <div className="flex items-center justify-center gap-2.5 bg-[var(--ai-accent)] group-hover:bg-[var(--ai-accent-hover)] text-white px-7 sm:px-9 py-5 sm:py-0 transition-colors duration-200">
                  <span className="text-[15px] sm:text-[16px] font-bold whitespace-nowrap tracking-tight">
                    Deposer un projet
                  </span>
                  <svg
                    className="w-5 h-5 group-hover:translate-x-1 transition-transform duration-200"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                  >
                    <path
                      d="M5 12h14M13 6l6 6-6 6"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </div>
              </Link>

              {/* Secondary link */}
              <Link
                href="/ai/freelances"
                className="inline-flex items-center gap-1.5 mt-5 text-[14px] font-medium text-[var(--ai-text-secondary)] hover:text-[var(--ai-text)] transition-colors duration-150"
              >
                Ou voir les freelances disponibles
                <svg
                  className="w-3.5 h-3.5"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M7 17L17 7M17 7H9M17 7V15"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </Link>
            </div>

            {/* Stat block droite */}
            <div className="lg:col-span-4 lg:pt-2 space-y-10">
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
                  Notre IA route votre brief aux 3 meilleurs profils en moins
                  de 24h. Gratuit, sans credit, sans engagement.
                </p>
              </div>

              {/* Bullet list cache sur mobile/tablet (redondant avec Section 4) */}
              <div className="hidden lg:block border-t border-[var(--ai-border-subtle)] pt-8">
                <p
                  className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4"
                  style={{
                    fontFamily: "var(--font-geist-mono), monospace",
                    letterSpacing: "0.2em",
                  }}
                >
                  // Pourquoi nous
                </p>
                <ul className="text-[13px] text-[var(--ai-text-secondary)] space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    Inscription gratuite cote client
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    Aucun systeme de credits
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    Aucune commission Workwave
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    France, Europe et remote
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Scroll indicator bottom center */}
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
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2/5 — COMMENT CA MARCHE
          ═══════════════════════════════════════════════════════════════ */}
      <section
        id="methode"
        className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)] scroll-mt-20"
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <SectionLabel index={2} total={5} label="Methode" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase"
              style={{
                fontSize: "clamp(32px, 5vw, 64px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              3 etapes pour
              <br />
              trouver votre
              <br />
              <span className="text-[var(--ai-text-tertiary)]">freelance.</span>
            </h2>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {STEPS.map((step) => (
              <div
                key={step.n}
                className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 hover:border-[var(--ai-text)] transition-colors duration-200"
              >
                <span
                  className="block text-5xl font-black text-[var(--ai-accent)] mb-6 tracking-tight"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {step.n}
                </span>
                <h3 className="text-lg font-bold text-[var(--ai-text)] mb-3 leading-tight tracking-tight">
                  {step.title}
                </h3>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                  {step.desc}
                </p>
              </div>
            ))}
          </div>

          {/* CTA inline post-3-cards (user feedback : "ici faut cta aussi") */}
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mt-12 sm:mt-16">
            <Link
              href="/ai/deposer"
              className="group inline-flex items-center justify-center h-14 px-8 text-[15px] sm:text-[16px] font-bold rounded-xl bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-all duration-200 hover:-translate-y-0.5 w-full sm:w-auto"
              style={{ boxShadow: "var(--ai-shadow-md)" }}
            >
              Commencer maintenant
              <svg
                className="ml-2 w-5 h-5 group-hover:translate-x-1 transition-transform"
                viewBox="0 0 24 24"
                fill="none"
                aria-hidden="true"
              >
                <path
                  d="M5 12h14M13 6l6 6-6 6"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </Link>
            <Link
              href="/ai/freelances"
              className="inline-flex items-center justify-center h-14 px-7 text-[15px] font-semibold rounded-xl bg-[var(--ai-secondary)] hover:bg-[var(--ai-secondary-hover)] text-[var(--ai-secondary-text)] border border-[var(--ai-secondary-border)] transition-colors w-full sm:w-auto"
            >
              Parcourir les freelances
            </Link>
          </div>

          <p className="text-center text-[12px] text-[var(--ai-text-tertiary)] mt-4">
            Gratuit · sans engagement · sans carte bancaire
          </p>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3/5 — CATEGORIES TECH
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-8 mb-12 sm:mb-16">
            <div className="max-w-2xl">
              <SectionLabel index={3} total={5} label="Categories" />
              <h2
                className="font-black text-[var(--ai-text)] uppercase"
                style={{
                  fontSize: "clamp(32px, 5vw, 64px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                }}
              >
                Tous les profils
                <br />
                tech qui
                <br />
                <span className="text-[var(--ai-text-tertiary)]">comptent.</span>
              </h2>
            </div>
            <Link
              href="/ai/freelances"
              className="inline-flex items-center gap-2 text-sm font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors duration-150 self-start lg:self-end"
            >
              Voir tous les freelances
              <svg
                className="w-4 h-4"
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

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {CATEGORIES.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ai/${cat.slug}`}
                className="group bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 hover:border-[var(--ai-text)] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-6">
                  <div
                    className="grid grid-cols-2 grid-rows-2 gap-[2px] w-6 h-6 transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden="true"
                  >
                    <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                    <div className="bg-[var(--ai-text)] rounded-[2px]" />
                    <div className="bg-[var(--ai-text)] rounded-[2px]" />
                    <div className="bg-[var(--ai-accent)] rounded-[2px]" />
                  </div>
                  <span
                    className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {String(cat.count).padStart(2, "0")} pros
                  </span>
                </div>
                <h3 className="text-base font-bold text-[var(--ai-text)] mb-2 leading-tight tracking-tight">
                  {cat.name}
                </h3>
                <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4">
                  {cat.skills}
                </p>
                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-text)] group-hover:text-[var(--ai-accent)] transition-colors">
                  Decouvrir
                  <svg
                    className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
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
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4/5 — POURQUOI WORKWAVE AI
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-28">
          <div className="max-w-2xl mb-12 sm:mb-16">
            <SectionLabel index={4} total={5} label="Pourquoi nous" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase"
              style={{
                fontSize: "clamp(32px, 5vw, 64px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              Pas un autre
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                annuaire.
              </span>
            </h2>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] mt-6 leading-relaxed max-w-lg">
              Codeur.com facture chaque devis. Malt prend une commission de
              10%. Workwave AI ne fait ni l'un ni l'autre.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {WHY.map((item, i) => (
              <div
                key={item.title}
                className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 hover:border-[var(--ai-text)] transition-colors duration-200"
              >
                <div className="flex items-start gap-4 mb-4">
                  <span
                    className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider flex-shrink-0 pt-1"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    [ {String(i + 1).padStart(2, "0")} ]
                  </span>
                  <h3 className="text-xl font-bold text-[var(--ai-text)] leading-tight tracking-tight">
                    {item.title}
                  </h3>
                </div>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed pl-10">
                  {item.desc}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 5/5 — FREELANCES + CTA FINAL
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)] border-t border-[var(--ai-border-subtle)] relative overflow-hidden">
        {/* Watermark bottom */}
        <div
          aria-hidden="true"
          className="pointer-events-none select-none absolute inset-x-0 bottom-0 z-0 overflow-hidden"
        >
          <span
            className="block font-black uppercase whitespace-nowrap leading-none tracking-[-0.05em]"
            style={{
              fontSize: "clamp(80px, 17vw, 260px)",
              color: "var(--ai-text-watermark)",
              transform: "translateY(20%)",
            }}
          >
            JOIN.WORKWAVE
          </span>
        </div>

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-20 sm:py-28">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-16 items-start">
            {/* Cote client */}
            <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 sm:p-10">
              <SectionLabel index={5} total={5} label="Cote client" />
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-4"
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                Un projet
                <br />a confier ?
              </h2>
              <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed mb-8">
                Decrivez votre brief en 60 secondes. Notre IA selectionne les 3
                meilleurs profils en moins de 24h. Gratuit, sans engagement,
                sans credit.
              </p>
              <Link
                href="/ai/deposer"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-[var(--ai-accent-text)] transition-colors duration-150 w-full sm:w-auto"
                style={{ boxShadow: "var(--ai-shadow-sm)" }}
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

            {/* Cote freelance (dark card) */}
            <div className="bg-[var(--ai-text)] text-white rounded-2xl p-8 sm:p-10 relative overflow-hidden">
              <div className="flex items-center gap-4 mb-6 relative z-10">
                <span
                  className="text-[11px] font-medium tracking-[0.2em] text-white/40"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  [ FREELANCE ]
                </span>
                <span className="h-px flex-1 max-w-[40px] bg-white/20" />
                <span className="inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-accent)]">
                  <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
                  Tech
                </span>
              </div>

              <h2
                className="font-black uppercase mb-4 relative z-10"
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                Vous etes
                <br />
                <span className="text-[var(--ai-accent)]">freelance ?</span>
              </h2>
              <p className="text-sm text-white/70 leading-relaxed mb-8 relative z-10">
                Inscription gratuite. Recevez les briefs qualifies par IA
                qui matchent votre profil. Repondez sans credit a 29,90€/mois
                TTC. Resiliable a tout moment, aucun engagement.
              </p>

              <Link
                href="/ai/inscription"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-white hover:bg-white/90 text-[var(--ai-text)] transition-colors duration-150 w-full sm:w-auto relative z-10"
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

              {/* Grid pattern bg */}
              <div
                aria-hidden="true"
                className="absolute inset-0 opacity-[0.04]"
                style={{
                  backgroundImage:
                    "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                  backgroundSize: "32px 32px",
                }}
              />
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

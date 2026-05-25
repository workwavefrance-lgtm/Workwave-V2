import { Fragment } from "react";

/**
 * AiFaqSection — composant FAQ unifie pour toutes les pages /ai/*.
 *
 * Rend en une seule fois :
 *   - Le HTML accessible (h2 + serie de <details>/<summary>)
 *   - Le JSON-LD schema.org FAQPage correspondant
 *
 * Garantit la coherence visuelle (style Pixel Rise) + le bon SEO/AEO
 * (schema FAQPage avec mainEntity[].acceptedAnswer.text), evite la
 * derive d'une page a l'autre.
 *
 * Usage :
 *   <AiFaqSection
 *     title="Questions frequentes"
 *     subtitle="Tout ce qu'il faut savoir avant de vous lancer."
 *     questions={[
 *       { q: "C'est vraiment gratuit ?", a: "Oui, ..." },
 *       ...
 *     ]}
 *   />
 *
 * Variants :
 *   - "default" : fond clair, bordures subtiles (defaut)
 *   - "dark"    : fond [var(--ai-text)], texte blanc (pour sections sombres)
 */

export type FaqItem = {
  q: string;
  a: string;
};

type Props = {
  title?: string;
  subtitle?: string;
  questions: FaqItem[];
  /** Numero de section dans le SectionLabel ("[ 06 / 08 ]") */
  sectionIndex?: number;
  sectionTotal?: number;
  sectionLabel?: string;
  variant?: "default" | "dark";
  /** id HTML pour ancrage interne (e.g. id="faq") */
  id?: string;
};

export function AiFaqSection({
  title = "Questions frequentes",
  subtitle,
  questions,
  sectionIndex,
  sectionTotal,
  sectionLabel = "FAQ",
  variant = "default",
  id,
}: Props) {
  if (!questions || questions.length === 0) return null;

  // JSON-LD FAQPage — strict spec schema.org pour rich snippets Google
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: questions.map((qa) => ({
      "@type": "Question",
      name: qa.q,
      acceptedAnswer: {
        "@type": "Answer",
        text: qa.a,
      },
    })),
  };

  const isDark = variant === "dark";

  return (
    <section
      id={id}
      className={`relative border-t ${
        isDark
          ? "bg-[var(--ai-text)] text-white border-white/10"
          : "border-[var(--ai-border-subtle)]"
      }`}
    >
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
        {/* Section label */}
        {sectionIndex !== undefined && sectionTotal !== undefined && (
          <div className="flex items-center gap-4 mb-6">
            <span
              className={`text-[11px] font-medium tracking-[0.2em] ${
                isDark ? "text-white/40" : "text-[var(--ai-text-tertiary)]"
              }`}
              style={{ fontFamily: "var(--font-geist-mono), monospace" }}
            >
              [ {String(sectionIndex).padStart(2, "0")} /{" "}
              {String(sectionTotal).padStart(2, "0")} ]
            </span>
            <span
              className={`h-px flex-1 max-w-[40px] ${
                isDark ? "bg-white/20" : "bg-[var(--ai-border)]"
              }`}
            />
            <span
              className={`inline-flex items-center gap-2 text-[11px] font-semibold tracking-[0.18em] uppercase ${
                isDark ? "text-white" : "text-[var(--ai-text)]"
              }`}
            >
              <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
              {sectionLabel}
            </span>
          </div>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-12 gap-10 lg:gap-16">
          {/* Heading sticky a gauche sur desktop */}
          <div className="lg:col-span-4">
            <div className="lg:sticky lg:top-24">
              <h2
                className={`font-black uppercase mb-4 ${
                  isDark ? "text-white" : "text-[var(--ai-text)]"
                }`}
                style={{
                  fontSize: "clamp(32px, 5vw, 56px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.04em",
                }}
              >
                {title}
              </h2>
              {subtitle && (
                <p
                  className={`text-base leading-relaxed ${
                    isDark ? "text-white/60" : "text-[var(--ai-text-secondary)]"
                  }`}
                >
                  {subtitle}
                </p>
              )}
            </div>
          </div>

          {/* Liste de questions a droite */}
          <div className="lg:col-span-8">
            <ul className="space-y-3">
              {questions.map((qa, idx) => (
                <li key={idx}>
                  <details
                    className={`group rounded-2xl border transition-colors ${
                      isDark
                        ? "bg-white/[0.03] border-white/10 hover:border-white/20"
                        : "bg-[var(--ai-bg-card)] border-[var(--ai-border-subtle)] hover:border-[var(--ai-border-strong)]"
                    }`}
                  >
                    <summary
                      className={`flex items-start justify-between gap-4 cursor-pointer list-none p-6 sm:p-7 ${
                        isDark ? "text-white" : "text-[var(--ai-text)]"
                      }`}
                    >
                      <span className="flex items-baseline gap-4 flex-1 min-w-0">
                        <span
                          className={`text-[12px] font-bold flex-shrink-0 ${
                            isDark
                              ? "text-[var(--ai-accent)]"
                              : "text-[var(--ai-accent)]"
                          }`}
                          style={{
                            fontFamily: "var(--font-geist-mono), monospace",
                          }}
                        >
                          Q{String(idx + 1).padStart(2, "0")}
                        </span>
                        <span className="font-semibold text-[15px] sm:text-[17px] leading-snug">
                          {qa.q}
                        </span>
                      </span>
                      <span
                        className={`flex-shrink-0 mt-1 transition-transform duration-200 group-open:rotate-45 ${
                          isDark ? "text-white/40" : "text-[var(--ai-text-tertiary)]"
                        }`}
                        aria-hidden="true"
                      >
                        <svg
                          width="20"
                          height="20"
                          viewBox="0 0 24 24"
                          fill="none"
                        >
                          <path
                            d="M12 5v14M5 12h14"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                          />
                        </svg>
                      </span>
                    </summary>
                    <div
                      className={`px-6 sm:px-7 pb-6 sm:pb-7 pl-[68px] sm:pl-[80px] text-[14px] sm:text-[15px] leading-relaxed whitespace-pre-line ${
                        isDark ? "text-white/70" : "text-[var(--ai-text-secondary)]"
                      }`}
                    >
                      {qa.a.split("\n\n").map((para, pIdx) => (
                        <Fragment key={pIdx}>
                          {pIdx > 0 && <div className="h-3" />}
                          <p>{para}</p>
                        </Fragment>
                      ))}
                    </div>
                  </details>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </div>

      {/* JSON-LD FAQPage schema */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
    </section>
  );
}

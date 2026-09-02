import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import type { ProContent } from "@/lib/seo/pro-seo-sections";

/**
 * Bloc SEO/AEO unique par fiche pro : "À propos de [nom]" (prose factuelle
 * Sirene) + FAQ propre à l'entreprise + FAQPage schema. Centré sur CETTE
 * entreprise (anti-duplicate avec les listings métier×ville). Zéro invention.
 */
export default function ProSeoSections({
  content,
  proName,
}: {
  content: ProContent;
  proName: string;
}) {
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />
      <div className="space-y-8">
        <div>
          <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
            À propos de {proName}
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed">
            {content.about}
          </p>
        </div>

        <div>
          <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-4">
            Questions fréquentes
          </h2>
          <div className="space-y-3">
            {content.faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-4"
              >
                <summary className="font-semibold text-[var(--text-primary)] text-[15px] cursor-pointer list-none flex items-center justify-between gap-3">
                  <span>{faq.question}</span>
                  <span className="text-[var(--text-tertiary)] group-open:rotate-180 transition-transform duration-200 shrink-0">
                    <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                      <polyline points="6 9 12 15 18 9" />
                    </svg>
                  </span>
                </summary>
                <p className="mt-3 text-[14px] text-[var(--text-secondary)] leading-relaxed">
                  {faq.answer}
                </p>
                {/* Liens sous la réponse : uniquement quand le contenu en
                    fournit (fiche d'établissement fermé). Une fiche ouverte
                    n'en a pas, son rendu est inchangé. */}
                {faq.links && faq.links.length > 0 && (
                  <p className="mt-2 flex flex-wrap gap-x-4 gap-y-1">
                    {faq.links.map((l) => (
                      <Link
                        key={l.href}
                        href={l.href}
                        className="text-[14px] text-[var(--accent)] hover:underline"
                      >
                        {l.label}
                      </Link>
                    ))}
                  </p>
                )}
              </details>
            ))}
          </div>
        </div>

        <p className="text-[12px] text-[var(--text-tertiary)]">{content.sourcesNote}</p>
      </div>
    </>
  );
}

import JsonLd from "@/components/seo/JsonLd";
import type { SeoContentBundle, SeoSection } from "@/lib/seo/seo-sections";

/**
 * Rend les 6 sections H2 SEO programmatiques + un accordeon FAQ +
 * le schema FAQPage.
 *
 * Intégré sous la liste des pros + au-dessus du maillage interne dans
 * les templates listing /[metier]/[location] et
 * /[metier]/[location]/[ville].
 *
 * Style : sobre (text-secondary, line-height ample), max-w-3xl pour la
 * lisibilité longue.
 */
export default function ProgrammaticSeoSections({
  content,
}: {
  content: SeoContentBundle;
}) {
  // Schema FAQPage pour les rich snippets Google + signal LLMs
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: content.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: {
        "@type": "Answer",
        text: f.answer,
      },
    })),
  };

  return (
    <>
      <JsonLd data={faqJsonLd} />

      <div className="mt-16 pt-8 border-t border-[var(--border-color)] space-y-12">
        {content.sections.map((section, i) => (
          <SectionRenderer key={i} section={section} />
        ))}

        {/* FAQ accordeon */}
        <section>
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Foire aux questions
          </h2>
          <div className="space-y-3 max-w-3xl">
            {content.faqs.map((faq, i) => (
              <details
                key={i}
                className="group bg-[var(--card-bg)] border border-[var(--card-border)] rounded-2xl px-5 py-4 cursor-pointer transition-colors duration-200 hover:border-[var(--accent)]"
              >
                <summary className="font-semibold text-[var(--text-primary)] text-[15px] flex items-center justify-between gap-3 list-none">
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
              </details>
            ))}
          </div>
        </section>
      </div>
    </>
  );
}

function SectionRenderer({ section }: { section: SeoSection }) {
  return (
    <section className="max-w-3xl">
      <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        {section.h2}
      </h2>

      {section.paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-[var(--text-secondary)] leading-relaxed mb-3"
        >
          {p}
        </p>
      ))}

      {section.bullets && section.bullets.length > 0 && (
        <ul className="mt-4 space-y-2">
          {section.bullets.map((b, i) => (
            <li
              key={i}
              className="flex items-start gap-3 text-[var(--text-secondary)] leading-relaxed"
            >
              <span className="text-[var(--accent)] mt-1 shrink-0">
                <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                  <polyline points="20 6 9 17 4 12" />
                </svg>
              </span>
              <span>{b}</span>
            </li>
          ))}
        </ul>
      )}

      {section.table && section.table.length > 0 && (
        <div className="mt-4 overflow-x-auto">
          <table className="w-full text-[14px]">
            <tbody>
              {section.table.map((row, i) => (
                <tr
                  key={i}
                  className="border-b border-[var(--card-border)] last:border-b-0"
                >
                  <td className="py-3 pr-4 text-[var(--text-primary)] font-medium align-top">
                    {row.label}
                  </td>
                  <td className="py-3 text-[var(--text-secondary)] text-right tabular-nums whitespace-nowrap">
                    {row.value}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </section>
  );
}

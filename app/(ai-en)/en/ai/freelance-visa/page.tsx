import type { Metadata } from "next";
import Link from "next/link";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { getCountry } from "@/lib/data/intl-countries";
import { visaGuideSlugs } from "@/lib/data/freelance-visa";

/**
 * Hub des guides visa/permis freelance : /en/ai/freelance-visa.
 * Liste les pays qui ont un guide sourcé. ISR 24h.
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

export const metadata: Metadata = {
  title: "Freelance visa & permit guides — Gulf & Middle East",
  description:
    "How to freelance legally in the Gulf: permits, costs and how to apply in the UAE, Saudi Arabia, Qatar and more. Practical guides for digital freelancers, with official sources.",
  alternates: aiAlternatesEnOnly("/en/ai/freelance-visa"),
  openGraph: {
    title: "Freelance visa & permit guides — Gulf",
    description: "Permits, costs and how to apply to freelance in the Gulf. Sourced guides.",
    url: `${SITE_URL}/en/ai/freelance-visa`,
    siteName: "Workwave AI",
    locale: "en_US",
    type: "website",
  },
};

export default function FreelanceVisaHubPage() {
  const countries = visaGuideSlugs()
    .map((slug) => getCountry(slug))
    .filter((c): c is NonNullable<typeof c> => c !== null);

  const faq: FaqItem[] = [
    {
      q: "Do I need a permit to freelance in the Gulf?",
      a: "In most Gulf countries, to invoice clients legally as a resident you need a freelance permit or licence (rather than working on a standard employment visa). The exact rules, costs and eligibility differ by country — see each country guide. If you work fully remotely from abroad for Gulf clients, requirements differ again.",
    },
    {
      q: "Which Gulf country is easiest for freelancers?",
      a: "The UAE is widely regarded as the most freelancer-friendly thanks to dedicated freelance permits across several free zones. Each country has its own framework — check the individual guides for current, sourced details.",
    },
    {
      q: "Is it free to use Workwave AI as a freelancer?",
      a: "Yes — creating a profile and getting matched with projects is free. An optional subscription lets you reply to projects. Workwave takes 0% commission on what you earn.",
    },
  ];

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Freelance visa guides by country",
    itemListElement: countries.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Freelance visa in ${c.name}`,
      url: `${SITE_URL}/en/ai/freelance-visa/${c.slug}`,
    })),
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 select-none" style={{ color: "var(--ai-accent)", opacity: 0.08 }}>
          <MonumentArt name="skyline-global" className="w-full h-[150px] sm:h-[200px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            Freelance guides
          </span>
          <h1 className="mt-3 font-black text-[var(--ai-text)]" style={{ fontSize: "clamp(32px, 6vw, 60px)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            Freelance visas in the Gulf
          </h1>
          <p className="mt-5 text-[16px] sm:text-[17px] leading-relaxed text-[var(--ai-text-secondary)]">
            Thinking of freelancing in the Gulf? Each guide covers the permit you need, what it costs, who can apply and the steps — with official sources. General information, not legal advice.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
        {countries.length > 0 ? (
          <ul className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {countries.map((c) => (
              <li key={c.slug}>
                <Link href={`/en/ai/freelance-visa/${c.slug}`} className="flex items-center gap-4 rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-5 hover:border-[var(--ai-border-strong)] transition-colors">
                  <div className="h-12 w-12 flex-shrink-0" style={{ color: "var(--ai-accent)" }}>
                    <MonumentArt name={c.monument} className="h-full w-full" strokeWidth={2} />
                  </div>
                  <div>
                    <span className="block text-[16px] font-semibold text-[var(--ai-text)]">Freelance visa in {c.name}</span>
                    <span className="block text-[13px] text-[var(--ai-text-tertiary)]">Permit · cost · how to apply</span>
                  </div>
                </Link>
              </li>
            ))}
          </ul>
        ) : (
          <p className="text-[14px] text-[var(--ai-text-tertiary)]">Guides coming soon.</p>
        )}
      </section>

      <AiFaqSection id="faq" title="FAQ" subtitle="Freelancing legally in the Gulf." questions={faq} sectionLabel="FAQ" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
    </>
  );
}

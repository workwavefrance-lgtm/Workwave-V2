import type { Metadata } from "next";
import Link from "next/link";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { USA_GUIDES, usaGuideSlugs } from "@/lib/data/freelance-usa";

/**
 * Hub des guides "freelance aux USA" : /en/ai/freelance-usa.
 * Liste les 3 guides sourcés (IRS / SBA / USCIS). ISR 24h. Indexable (SEO).
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 86400;

export const metadata: Metadata = {
  title: "Freelancing in the US — taxes, LLC vs sole prop & work authorization",
  description:
    "Practical guides for US freelancers: LLC vs sole proprietorship, freelancer taxes (1099, self-employment tax, quarterly estimates) and work authorization for foreign nationals. Sourced from IRS, SBA & USCIS.",
  alternates: aiAlternatesEnOnly("/en/ai/freelance-usa"),
  openGraph: {
    title: "Freelancing in the US — practical guides",
    description: "LLC vs sole prop, freelancer taxes and work authorization. Sourced guides.",
    url: `${SITE_URL}/en/ai/freelance-usa`,
    siteName: "Workwave AI",
    locale: "en_US",
    type: "website",
  },
};

export default function FreelanceUsaHubPage() {
  const guides = usaGuideSlugs().map((slug) => USA_GUIDES[slug]);

  const faq: FaqItem[] = [
    {
      q: "Do I need an LLC to freelance in the US?",
      a: "No. By default you are a sole proprietor the moment you do paid work for yourself, with no registration required. An LLC is optional — its main benefit is protecting your personal assets from business debts and lawsuits (per the SBA). See the LLC vs sole proprietorship guide for the details.",
    },
    {
      q: "How do US freelancer taxes work?",
      a: "As a freelancer the IRS treats you as self-employed: no employer withholds tax, so you report profit on Schedule C, pay self-employment tax (15.3% for Social Security and Medicare) and usually pay quarterly estimated taxes. See the freelancer taxes guide for a full, sourced overview.",
    },
    {
      q: "Is there a freelance visa for the United States?",
      a: "No. The US has no dedicated 'freelance visa' — what matters is work authorization (citizen, green-card holder, or a noncitizen with a status or work permit that allows it). See the work authorization guide. It's general information, not legal advice.",
    },
    {
      q: "Is it free to use Workwave AI as a freelancer?",
      a: "Yes — creating a profile and getting matched with projects is free. An optional subscription lets you reply to projects. Workwave takes 0% commission on what you earn.",
    },
  ];

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Freelancing in the US — guides",
    itemListElement: guides.map((g, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: g.title,
      url: `${SITE_URL}/en/ai/freelance-usa/${g.topicSlug}`,
    })),
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 select-none" style={{ color: "var(--ai-accent)", opacity: 0.08 }}>
          <MonumentArt name="us-capitol" className="w-full h-[150px] sm:h-[200px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-10 sm:pt-14 pb-8">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            Freelance guides
          </span>
          <h1 className="mt-3 font-black text-[var(--ai-text)]" style={{ fontSize: "clamp(32px, 6vw, 60px)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            Freelancing in the US
          </h1>
          <p className="mt-5 text-[16px] sm:text-[17px] leading-relaxed text-[var(--ai-text-secondary)]">
            Setting up as a freelancer in the United States? These guides cover how to structure your business, how freelancer taxes work, and what foreign nationals need to work legally — with official sources. General information, not legal or tax advice.
          </p>
        </div>
      </section>

      <section className="max-w-3xl mx-auto px-4 sm:px-6 pb-10">
        <ul className="grid grid-cols-1 gap-4">
          {guides.map((g) => (
            <li key={g.topicSlug}>
              <Link href={`/en/ai/freelance-usa/${g.topicSlug}`} className="flex items-center gap-4 rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-5 hover:border-[var(--ai-border-strong)] transition-colors">
                <div className="h-12 w-12 flex-shrink-0" style={{ color: "var(--ai-accent)" }}>
                  <MonumentArt name={g.monument} className="h-full w-full" strokeWidth={2} />
                </div>
                <div>
                  <span className="block text-[16px] font-semibold text-[var(--ai-text)]">{g.cardTitle}</span>
                  <span className="block text-[13px] text-[var(--ai-text-tertiary)] line-clamp-2">{g.metaDescription}</span>
                </div>
              </Link>
            </li>
          ))}
        </ul>
      </section>

      <AiFaqSection id="faq" title="FAQ" subtitle="Freelancing in the United States." questions={faq} sectionLabel="FAQ" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
    </>
  );
}

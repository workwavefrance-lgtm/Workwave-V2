import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { getCountry } from "@/lib/data/intl-countries";
import { getVisaGuide, visaGuideSlugs } from "@/lib/data/freelance-visa";
import { INTL_CITIES } from "@/lib/data/intl-cities";

/**
 * Guide visa/permis freelance par pays : /en/ai/freelance-visa/[country].
 *
 * Contenu 100% SOURCÉ (lib/data/freelance-visa.ts). Disclaimer légal affiché.
 * ISR 24h. generateStaticParams sur les pays qui ont un guide fiable.
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

type Params = { country: string };

export function generateStaticParams() {
  return visaGuideSlugs().map((country) => ({ country }));
}

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getCountry(slug);
  const guide = getVisaGuide(slug);
  if (!country || !guide) return { title: "Not found" };
  const year = new Date().getFullYear();
  const path = `/en/ai/freelance-visa/${slug}`;
  return {
    title: `Freelance visa in ${country.name} — cost, permit & how to apply (${year})`,
    description: `How to freelance legally in ${country.name}: permits, costs, eligibility and how to apply. Practical guide for digital freelancers, with official sources.`,
    alternates: aiAlternatesEnOnly(path),
    openGraph: {
      title: `Freelance visa & permit in ${country.name}`,
      description: `Permits, costs and how to apply to freelance in ${country.name}. Sourced guide.`,
      url: `${SITE_URL}${path}`,
      siteName: "Workwave AI",
      locale: "en_US",
      type: "article",
    },
  };
}

export default async function FreelanceVisaPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country: slug } = await params;
  const country = getCountry(slug);
  const guide = getVisaGuide(slug);
  if (!country || !guide) notFound();

  const path = `/en/ai/freelance-visa/${slug}`;
  const cities = INTL_CITIES.filter((c) => c.country === country.name);

  const faq: FaqItem[] = [
    {
      q: `Can foreigners freelance in ${country.name}?`,
      a: guide.eligibility,
    },
    {
      q: `How much does a freelance permit cost in ${country.name}?`,
      a: `${guide.costSummary} Always confirm the current fee with the official issuer before applying — see the sources at the bottom of this page.`,
    },
    {
      q: `How do I get started as a freelancer in ${country.name}?`,
      a: `In short: ${guide.steps.join(" → ")}. Once you can invoice legally, you can find clients on Workwave AI — posting a profile is free.`,
    },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/en/ai` },
      { "@type": "ListItem", position: 2, name: "Freelance visa", item: `${SITE_URL}/en/ai/freelance-visa` },
      { "@type": "ListItem", position: 3, name: country.name, item: `${SITE_URL}${path}` },
    ],
  };
  const articleLd = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Freelance visa in ${country.name} — cost, permit & how to apply`,
    inLanguage: "en",
    dateModified: guide.lastReviewed,
    author: { "@type": "Organization", name: "Workwave AI" },
    publisher: { "@type": "Organization", name: "Workwave AI", url: `${SITE_URL}/en/ai` },
  };

  const Section = ({ title, children }: { title: string; children: React.ReactNode }) => (
    <div className="mb-10">
      <h2 className="text-[20px] font-bold text-[var(--ai-text)] mb-3">{title}</h2>
      <div className="text-[15px] leading-relaxed text-[var(--ai-text-secondary)]">{children}</div>
    </div>
  );

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-3xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
          <li><Link href="/en/ai" className="hover:text-[var(--ai-text)]">Workwave AI</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/en/ai/freelance-visa" className="hover:text-[var(--ai-text)]">Freelance visa</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ai-text-secondary)]">{country.name}</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-0 w-[45%] max-w-[420px] select-none" style={{ color: "var(--ai-accent)", opacity: 0.1 }}>
          <MonumentArt name={country.monument} className="w-full h-[180px] sm:h-[240px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-3xl mx-auto px-4 sm:px-6 pt-8 sm:pt-12 pb-8">
          <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            Freelance guide
          </span>
          <h1 className="mt-3 font-black text-[var(--ai-text)] max-w-2xl" style={{ fontSize: "clamp(30px, 5vw, 56px)", lineHeight: 1, letterSpacing: "-0.03em" }}>
            Freelance visa in {country.name}
          </h1>
          <p className="mt-5 text-[16px] sm:text-[17px] leading-relaxed text-[var(--ai-text-secondary)]">{guide.intro}</p>
        </div>
      </section>

      {/* Disclaimer légal */}
      <div className="max-w-3xl mx-auto px-4 sm:px-6">
        <div className="rounded-xl border border-[var(--ai-border)] bg-[var(--ai-bg-subtle)] p-4 text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
          <strong className="text-[var(--ai-text)]">General information, not legal advice.</strong> Rules and fees change — last reviewed {guide.lastReviewed}. Always confirm the current requirements with the official sources listed at the bottom before applying.
        </div>
      </div>

      {/* BODY */}
      <article className="max-w-3xl mx-auto px-4 sm:px-6 py-10 sm:py-14">
        <Section title="Which permit you need">
          <ul className="list-disc pl-5 space-y-1">
            {guide.permitNames.map((p) => <li key={p}>{p}</li>)}
          </ul>
        </Section>

        <Section title="How much it costs">{guide.costSummary}</Section>

        <Section title="Who can apply">{guide.eligibility}</Section>

        <Section title="Where to apply">{guide.issuers}</Section>

        <Section title="How to apply">
          <ol className="list-decimal pl-5 space-y-2">
            {guide.steps.map((s, i) => <li key={i}>{s}</li>)}
          </ol>
        </Section>

        <Section title="Validity & renewal">{guide.validity}</Section>

        {guide.caveats.length > 0 && (
          <Section title="Good to know">
            <ul className="list-disc pl-5 space-y-1">
              {guide.caveats.map((c, i) => <li key={i}>{c}</li>)}
            </ul>
          </Section>
        )}

        {/* CTA Workwave */}
        <div className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-7 my-10">
          <h2 className="text-[19px] font-bold text-[var(--ai-text)]">Set up? Find clients on Workwave AI.</h2>
          <p className="mt-2 text-[14px] text-[var(--ai-text-secondary)]">Once you can invoice legally, create a free profile and get matched with projects across the Gulf and Europe — 0% commission.</p>
          <div className="mt-5 flex flex-col sm:flex-row gap-3">
            <Link href="/ai/inscription" className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors">Create my free profile</Link>
            <Link href="/en/ai" className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-full bg-[var(--ai-text)] hover:bg-[var(--ai-primary-hover)] text-white transition-colors">Explore Workwave AI</Link>
          </div>
        </div>

        {/* Maillage : villes du pays */}
        {cities.length > 0 && (
          <Section title={`Freelance work in ${country.name}`}>
            <ul className="flex flex-wrap gap-2">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/en/ai/web-development/${c.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                    Freelancers in {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </Section>
        )}

        {/* Sources */}
        <Section title="Sources">
          <ul className="space-y-1.5 text-[13px]">
            {guide.sources.map((s) => (
              <li key={s.url}>
                <a href={s.url} target="_blank" rel="noopener nofollow" className="text-[var(--ai-accent)] underline decoration-[var(--ai-accent-border)] underline-offset-2 break-words">{s.label}</a>
              </li>
            ))}
          </ul>
        </Section>
      </article>

      {/* FAQ */}
      <AiFaqSection id="faq" title="FAQ" subtitle={`Freelancing legally in ${country.name}.`} questions={faq} sectionLabel="FAQ" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleLd) }} />
    </>
  );
}

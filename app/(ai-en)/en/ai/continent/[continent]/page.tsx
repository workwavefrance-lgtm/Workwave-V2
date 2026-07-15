import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { INTL_SKILLS } from "@/lib/data/intl-skills";
import { getCitiesByRegion } from "@/lib/data/intl-cities";
import {
  getContinent,
  getCountriesByContinent,
  CONTINENTS,
} from "@/lib/data/intl-countries";

/**
 * Hub CONTINENT : /en/ai/continent/[continent] (ex. /en/ai/continent/asia).
 * Segment littéral "continent/" => aucun conflit avec /en/ai/[skill].
 * Agrège pays + villes phares + métiers. ISR 6h, pas de generateStaticParams.
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

type Params = { continent: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { continent: slug } = await params;
  const continent = getContinent(slug);
  if (!continent) return { title: "Not found" };
  const year = new Date().getFullYear();
  const path = `/en/ai/continent/${continent.slug}`;
  return {
    title: `Hire freelancers in ${continent.shortName} — developers, designers & more (${year})`,
    description: `Hire vetted freelancers across ${continent.shortName}: web developers, AI engineers, designers, marketers and more. Get matched in 24h, 0% commission. Post your project for free on Workwave AI.`,
    alternates: aiAlternatesEnOnly(path),
    openGraph: {
      title: `Hire freelancers in ${continent.shortName}`,
      description: `Vetted freelance talent across ${continent.shortName}. AI-matched, 0% commission, free to post.`,
      url: `${SITE_URL}${path}`,
      siteName: "Workwave AI",
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function ContinentHubPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { continent: slug } = await params;
  const continent = getContinent(slug);
  if (!continent) notFound();

  const path = `/en/ai/continent/${continent.slug}`;
  const countries = getCountriesByContinent(continent.slug);
  const cities = getCitiesByRegion(continent.region);
  // Villes phares = monument dédié d'abord, complété par les autres.
  const featuredCities = [
    ...cities.filter((c) => c.monument !== "skyline" && c.monument !== "skyline-global"),
    ...cities.filter((c) => c.monument === "skyline" || c.monument === "skyline-global"),
  ].slice(0, 16);
  const otherContinents = CONTINENTS.filter((c) => c.slug !== continent.slug);
  // Monument du hero = celui de la 1re ville phare (ou skyline).
  const heroMonument = featuredCities[0]?.monument ?? "skyline";

  const faq: FaqItem[] = [
    {
      q: `How much does it cost to hire a freelancer in ${continent.shortName}?`,
      a: `Rates vary by country, skill and seniority. Freelance day rates are usually benchmarked in USD, the global freelance currency, and you agree the final rate directly with the freelancer. Workwave takes 0% commission.`,
    },
    {
      q: `Do freelancers in ${continent.shortName} work remotely?`,
      a: `Most do. The large majority work fully remote, so you can hire the best fit anywhere in ${continent.shortName} and collaborate across borders and timezones.`,
    },
    {
      q: `Which countries can I hire from in ${continent.shortName}?`,
      a: `Workwave AI covers ${countries.map((c) => c.name).slice(0, 8).join(", ")}${countries.length > 8 ? " and more" : ""}. Post your project and matching freelancers reach out directly.`,
    },
    {
      q: `Is it free for clients?`,
      a: `Yes, 100% free. Posting, being contacted and hiring cost nothing. Freelancers fund the platform through an optional subscription.`,
    },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/en/ai` },
      { "@type": "ListItem", position: 2, name: continent.shortName, item: `${SITE_URL}${path}` },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Hire freelancers in ${continent.shortName} by country`,
    itemListElement: countries.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `Freelancers in ${c.name}`,
      url: `${SITE_URL}/en/ai/country/${c.slug}`,
    })),
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
          <li><Link href="/en/ai" className="hover:text-[var(--ai-text)] transition-colors">Workwave AI</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ai-text-secondary)]">{continent.shortName}</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-0 w-[50%] max-w-[460px] select-none" style={{ color: "var(--ai-accent)", opacity: 0.09 }}>
          <MonumentArt name={heroMonument} className="w-full h-[200px] sm:h-[260px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {continent.shortName} · {countries.length} countries
            </span>
          </div>
          <h1 className="font-black text-[var(--ai-text)] max-w-3xl" style={{ fontSize: "clamp(34px, 6vw, 68px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire freelancers in {continent.shortName}
          </h1>
          <p className="mt-6 text-[16px] sm:text-[18px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            Find vetted freelance developers, designers, marketers and more across {continent.shortName}. Post your project for free — our AI alerts matching freelancers and they contact you directly. 0% commission.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/en/ai/deposer" className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors" style={{ boxShadow: "var(--ai-shadow-sm)" }}>
              Post a project — it&rsquo;s free
            </Link>
            <Link href="/ai/freelances" className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-text)] hover:bg-[var(--ai-primary-hover)] text-white transition-colors">
              Browse freelances
            </Link>
          </div>
        </div>
      </section>

      {/* COUNTRIES */}
      {countries.length > 0 && (
        <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(22px, 4vw, 36px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
              Freelancers by country
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {countries.map((c) => (
                <li key={c.slug}>
                  <Link href={`/en/ai/country/${c.slug}`} className="block rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-4 hover:border-[var(--ai-border-strong)] transition-colors">
                    <span className="block text-[15px] font-semibold text-[var(--ai-text)]">{c.name}</span>
                    <span className="block text-[12px] text-[var(--ai-text-tertiary)]">Hire freelancers</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* FEATURED CITIES */}
      {featuredCities.length > 0 && (
        <section className="border-t border-[var(--ai-border-subtle)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(22px, 4vw, 36px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
              Top cities in {continent.shortName}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {featuredCities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/en/ai/web-development/${c.slug}`} className="block rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-4 hover:border-[var(--ai-border-strong)] transition-colors">
                    <span className="block text-[15px] font-semibold text-[var(--ai-text)]">{c.name}</span>
                    <span className="block text-[12px] text-[var(--ai-text-tertiary)]">{c.country}</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* SKILLS */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="font-black text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(22px, 4vw, 36px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
            Freelance skills
          </h2>
          <ul className="flex flex-wrap gap-2">
            {INTL_SKILLS.map((s) => (
              <li key={s.slug}>
                <Link href={`/en/ai/${s.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* MESH — autres continents */}
      <section className="border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Hire freelancers in other regions</h2>
          <ul className="flex flex-wrap gap-2">
            {otherContinents.map((c) => (
              <li key={c.slug}>
                <Link href={`/en/ai/continent/${c.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                  {c.shortName}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <AiFaqSection id="faq" title="FAQ" subtitle={`Hiring freelancers across ${continent.shortName}.`} questions={faq} sectionLabel="FAQ" />

      {/* FINAL CTA */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-text)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="font-black uppercase text-white mx-auto max-w-3xl" style={{ fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire freelancers in {continent.shortName} today.
          </h2>
          <p className="mt-5 text-[16px] text-white/60 max-w-xl mx-auto">
            Post your project for free and get matched in 24 hours. 0% commission.
          </p>
          <div className="mt-8">
            <Link href="/en/ai/deposer" className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors">
              Post a project — it&rsquo;s free
            </Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
    </>
  );
}

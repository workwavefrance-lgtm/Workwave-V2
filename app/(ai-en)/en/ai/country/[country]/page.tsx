import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { INTL_SKILLS } from "@/lib/data/intl-skills";
import { getCitiesByCountry, getCountryHomage } from "@/lib/data/intl-cities";
import {
  getWorldCountry,
  getCountriesByContinent,
  getContinent,
} from "@/lib/data/intl-countries";
import { SOURCED_INTL_COUNTRY } from "@/lib/data/sourced-intl-market";

/**
 * Hub PAYS : /en/ai/country/[country] (ex. /en/ai/country/japan).
 * Segment littéral "country/" => aucun conflit avec /en/ai/[skill] (leçon 18/04 :
 * un segment statique a priorité sur le dynamique au même niveau).
 * Skill-agnostic : maille vers les 14 métiers × pays + les villes du pays.
 * ISR 6h, pas de generateStaticParams (build léger, génération à la demande).
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

type Params = { country: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { country: slug } = await params;
  const country = getWorldCountry(slug);
  if (!country) return { title: "Not found" };
  const year = new Date().getFullYear();
  const path = `/en/ai/country/${country.slug}`;
  return {
    title: `Hire freelancers in ${country.name} — developers, designers & more (${year})`,
    description: `Hire vetted freelancers in ${country.name}: web developers, AI engineers, designers, marketers and more. Get matched in 24h, 0% commission. Post your project for free on Workwave AI.`,
    alternates: aiAlternatesEnOnly(path),
    openGraph: {
      title: `Hire freelancers in ${country.name}`,
      description: `Vetted freelance talent across ${country.name}. AI-matched, 0% commission, free to post.`,
      url: `${SITE_URL}${path}`,
      siteName: "Workwave AI",
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function CountryHubPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { country: slug } = await params;
  const country = getWorldCountry(slug);
  if (!country) notFound();

  const path = `/en/ai/country/${country.slug}`;
  const cities = getCitiesByCountry(country.countryCode);
  const homage = getCountryHomage(country.countryCode);
  const sourced = SOURCED_INTL_COUNTRY[country.countryCode];
  const continent = getContinent(country.continentSlug);
  const peerCountries = getCountriesByContinent(country.continentSlug)
    .filter((c) => c.slug !== country.slug)
    .slice(0, 16);

  const faq: FaqItem[] = [
    {
      q: `How much does it cost to hire a freelancer in ${country.name}?`,
      a: `Rates depend on the skill, seniority and scope. Day rates for freelance work are usually benchmarked in USD, the global freelance currency, and you agree the final rate directly with the freelancer. Workwave takes 0% commission, so pricing stays transparent.`,
    },
    {
      q: `Do freelancers in ${country.name} work remotely?`,
      a: `Most do. The large majority of freelancers work fully remote, so you can hire the best fit anywhere in ${country.name} — or collaborate across borders and timezones.`,
    },
    {
      q: `How do I hire a freelancer in ${country.name} on Workwave?`,
      a: `Post your project in 60 seconds (it's free). Our AI qualifies your brief and alerts matching freelancers, who reach out to you directly. You compare profiles, choose and work together — no middleman, no commission.`,
    },
    {
      q: `Is it free for clients?`,
      a: `Yes. Posting a project, being contacted by freelancers and hiring them is 100% free. Workwave never takes a commission — freelancers fund the platform through an optional subscription.`,
    },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/en/ai` },
      { "@type": "ListItem", position: 2, name: country.name, item: `${SITE_URL}${path}` },
    ],
  };
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Hire freelancers in ${country.name}`,
    areaServed: { "@type": "Country", name: country.name, address: { "@type": "PostalAddress", addressCountry: country.countryCode } },
    provider: { "@type": "Organization", name: "Workwave AI", url: `${SITE_URL}/en/ai` },
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
          <li><Link href="/en/ai" className="hover:text-[var(--ai-text)] transition-colors">Workwave AI</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ai-text-secondary)]">{country.name}</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-0 w-[50%] max-w-[460px] select-none" style={{ color: "var(--ai-accent)", opacity: 0.09 }}>
          <MonumentArt name={country.monument} className="w-full h-[200px] sm:h-[260px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {country.name}{continent ? ` · ${continent.shortName}` : ""}
            </span>
          </div>
          {homage && (
            <p className="mb-4 text-[15px] sm:text-[16px] text-[var(--ai-text-secondary)]">
              <span className="font-semibold text-[var(--ai-text)]">{homage.phrase}</span>
              {homage.roman ? <span className="text-[var(--ai-text-tertiary)]"> ({homage.roman})</span> : null}
              <span className="text-[var(--ai-text-tertiary)]"> — {homage.lang} for &ldquo;{homage.translation}&rdquo;</span>
            </p>
          )}
          <h1 className="font-black text-[var(--ai-text)] max-w-3xl" style={{ fontSize: "clamp(34px, 6vw, 68px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire freelancers in {country.name}
          </h1>
          <p className="mt-6 text-[16px] sm:text-[18px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            Find vetted freelance developers, designers, marketers and more across {country.name}. Post your project for free — our AI alerts matching freelancers and they contact you directly. 0% commission.
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

      {/* MARKET — paragraphe sourcé (si présent). Zéro chiffre inventé. */}
      {sourced && (
        <section className="border-t border-[var(--ai-border-subtle)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)] mb-4" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              The freelance market
            </p>
            <h2 className="font-black text-[var(--ai-text)] mb-5 max-w-2xl" style={{ fontSize: "clamp(24px, 4vw, 38px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
              Freelancing in {country.name}
            </h2>
            <p className="text-[16px] sm:text-[17px] leading-relaxed text-[var(--ai-text-secondary)] max-w-3xl">
              {sourced.text}
            </p>
            {sourced.sources?.[0] && (
              <p className="mt-4 text-[12px] text-[var(--ai-text-tertiary)]">
                Sources · {sourced.retrievedAt} ·{" "}
                <a href={sourced.sources[0]} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-text)]">
                  reference
                </a>
              </p>
            )}
          </div>
        </section>
      )}

      {/* SKILLS IN COUNTRY (14 verticaux) */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="font-black text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(22px, 4vw, 36px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
            Freelance skills in {country.name}
          </h2>
          <ul className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {INTL_SKILLS.map((s) => (
              <li key={s.slug}>
                <Link href={`/en/ai/${s.slug}/country/${country.slug}`} className="block rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-4 hover:border-[var(--ai-border-strong)] transition-colors">
                  <span className="block text-[15px] font-semibold text-[var(--ai-text)]">{s.label}</span>
                  <span className="block text-[12px] text-[var(--ai-text-tertiary)]">Hire freelance {s.noun}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* CITIES IN COUNTRY */}
      {cities.length > 0 && (
        <section className="border-t border-[var(--ai-border-subtle)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(22px, 4vw, 36px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
              Freelancers by city in {country.name}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {cities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/en/ai/web-development/${c.slug}`} className="block rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-4 hover:border-[var(--ai-border-strong)] transition-colors">
                    <span className="block text-[15px] font-semibold text-[var(--ai-text)]">{c.name}</span>
                    <span className="block text-[12px] text-[var(--ai-text-tertiary)]">Explore freelancers</span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* WHY WORKWAVE */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { t: "0% commission", d: "Pay the freelancer directly. We never take a cut." },
              { t: "Free to post", d: "Posting your project is always free." },
              { t: "AI-matched in 24h", d: "The right freelancers reach out, fast." },
              { t: "Vetted profiles", d: "Freelancers with verified business identities." },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-6">
                <h3 className="text-[15px] font-semibold text-[var(--ai-text)]">{v.t}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ai-text-secondary)]">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* MESH — autres pays du continent */}
      {peerCountries.length > 0 && (
        <section className="border-t border-[var(--ai-border-subtle)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">
              Hire freelancers in other countries{continent ? ` in ${continent.shortName}` : ""}
            </h2>
            <ul className="flex flex-wrap gap-2">
              {peerCountries.map((c) => (
                <li key={c.slug}>
                  <Link href={`/en/ai/country/${c.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
            {continent && (
              <p className="mt-6 text-[13px] text-[var(--ai-text-tertiary)]">
                See also{" "}
                <Link href={`/en/ai/continent/${continent.slug}`} className="underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-text)]">
                  hiring freelancers across {continent.name}
                </Link>.
              </p>
            )}
          </div>
        </section>
      )}

      {/* FAQ */}
      <AiFaqSection id="faq" title="FAQ" subtitle={`Hiring freelancers in ${country.name}.`} questions={faq} sectionLabel="FAQ" />

      {/* FINAL CTA */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-text)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="font-black uppercase text-white mx-auto max-w-3xl" style={{ fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire freelancers in {country.name} today.
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
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
    </>
  );
}

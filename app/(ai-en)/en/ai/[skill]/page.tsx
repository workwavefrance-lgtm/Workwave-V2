import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { formatTjmRange } from "@/lib/i18n/format";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";
import { getIntlSkill, INTL_SKILLS } from "@/lib/data/intl-skills";
import { INTL_CITIES, getCitiesByRegion } from "@/lib/data/intl-cities";

/**
 * Hub EN par skill : /en/ai/[skill] (ex. /en/ai/web-development).
 * Parent des pages skill×ville. Liste toutes les villes + aperçu TJM global (USD).
 * ISR 6h, pas de generateStaticParams (build léger).
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

type Params = { skill: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { skill: skillSlug } = await params;
  const skill = getIntlSkill(skillSlug);
  if (!skill) return { title: "Not found" };
  const year = new Date().getFullYear();
  const path = `/en/ai/${skill.slug}`;
  return {
    title: `Hire freelance ${skill.noun} — day rates & talent (${year})`,
    description: `Hire vetted freelance ${skill.noun} worldwide. Compare day rates, get matched in 24h, 0% commission. Free to post on Workwave AI.`,
    alternates: aiAlternatesEnOnly(path),
    openGraph: {
      title: `Hire freelance ${skill.noun}`,
      description: `Vetted freelance ${skill.noun}, AI-matched, 0% commission. Worldwide, remote-first.`,
      url: `${SITE_URL}${path}`,
      siteName: "Workwave AI",
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function SkillHubPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { skill: skillSlug } = await params;
  const skill = getIntlSkill(skillSlug);
  if (!skill) notFound();

  const tjm = skill.tjmKey ? TJM_REFERENCE[skill.tjmKey] : undefined;
  const path = `/en/ai/${skill.slug}`;
  const asia = getCitiesByRegion("Asia");
  const europe = getCitiesByRegion("Europe");
  const gulf = getCitiesByRegion("Gulf");
  const latam = getCitiesByRegion("Latam");
  const oceania = getCitiesByRegion("Oceania");
  const africa = getCitiesByRegion("Africa");
  const otherSkills = INTL_SKILLS.filter((s) => s.slug !== skill.slug);

  const tiers: { label: string; key: "junior" | "mid" | "senior" | "expert" }[] = [
    { label: "Junior", key: "junior" },
    { label: "Mid-level", key: "mid" },
    { label: "Senior", key: "senior" },
    { label: "Expert", key: "expert" },
  ];

  const faq: FaqItem[] = [
    {
      q: `How much does it cost to hire a freelance ${skill.nounSingular}?`,
      a: tjm
        ? `Day rates depend on seniority, stack and region. As an indicative global benchmark, senior ${skill.noun} charge around ${formatTjmRange(tjm.senior.min, tjm.senior.max, "en")} (USD). Rates in the Gulf and top European hubs trend higher. On Workwave you agree the rate directly with the freelancer — 0% commission.`
        : `Rates vary by seniority, scope and the freelancer's experience. You agree the rate directly with the freelancer — Workwave takes 0% commission, so pricing stays transparent.`,
    },
    {
      q: `Where can I hire freelance ${skill.noun} on Workwave?`,
      a: `Worldwide — across Asia (Bangalore, Singapore, Tokyo, Dubai and more), Europe, the Americas, Africa and Oceania. Most freelancers work remotely, so you can hire across borders and timezones.`,
    },
    {
      q: `How does hiring work?`,
      a: `Post your project for free in 60 seconds. Our AI qualifies it and alerts matching ${skill.noun}, who contact you directly. You compare, choose and work together — no middleman, no commission.`,
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
      { "@type": "ListItem", position: 2, name: skill.label, item: `${SITE_URL}${path}` },
    ],
  };
  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Hire ${skill.noun} by city`,
    itemListElement: INTL_CITIES.map((c, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: `${skill.label} in ${c.name}`,
      url: `${SITE_URL}/en/ai/${skill.slug}/${c.slug}`,
    })),
  };
  // Schema Service : type le plus pertinent pour une page "hire freelance X"
  // (rich results / AEO). Pas de prix chiffré dans le schema (les TJM affichés
  // sont convertis en USD à l'affichage ; on ne duplique pas un nombre ici pour
  // éviter toute incohérence). Provider = Workwave AI, zone = mondial.
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Freelance ${skill.label}`,
    serviceType: skill.label,
    description: skill.blurb,
    provider: {
      "@type": "Organization",
      name: "Workwave AI",
      url: `${SITE_URL}/en/ai`,
    },
    areaServed: "Worldwide",
    url: `${SITE_URL}${path}`,
  };

  const CityGrid = ({ cities }: { cities: typeof INTL_CITIES }) => (
    <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
      {cities.map((c) => (
        <li key={c.slug}>
          <Link
            href={`/en/ai/${skill.slug}/${c.slug}`}
            className="block rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-4 hover:border-[var(--ai-border-strong)] transition-colors"
          >
            <span className="block text-[15px] font-semibold text-[var(--ai-text)]">{c.name}</span>
            <span className="block text-[12px] text-[var(--ai-text-tertiary)]">{c.country}</span>
          </Link>
        </li>
      ))}
    </ul>
  );

  return (
    <>
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
          <li><Link href="/en/ai" className="hover:text-[var(--ai-text)] transition-colors">Workwave AI</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ai-text-secondary)]">{skill.label}</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 select-none" style={{ color: "var(--ai-accent)", opacity: 0.08 }}>
          <MonumentArt name="skyline-global" className="w-full h-[160px] sm:h-[220px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <h1 className="font-black text-[var(--ai-text)] max-w-3xl" style={{ fontSize: "clamp(34px, 6vw, 72px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire freelance {skill.noun}
          </h1>
          <p className="mt-6 text-[16px] sm:text-[18px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            {skill.blurb} Post your project for free — our AI alerts matching {skill.noun} worldwide, and they contact you directly. 0% commission.
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

      {/* TJM overview (USD) */}
      {tjm && (
        <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black uppercase text-[var(--ai-text)] mb-3 max-w-2xl" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
              {skill.label} day rates
            </h2>
            <p className="text-[14px] text-[var(--ai-text-secondary)] mb-10 max-w-2xl">
              Indicative day rates by seniority (USD, converted from European market data). For planning only — see a specific city below for local-currency rates.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((t) => (
                <div key={t.key} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-6">
                  <p className="text-[12px] font-semibold tracking-wide uppercase text-[var(--ai-text-tertiary)]">{t.label}</p>
                  <p className="mt-2 text-[17px] sm:text-[19px] font-black text-[var(--ai-accent)] tracking-tight">
                    {formatTjmRange(tjm[t.key].min, tjm[t.key].max, "en")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* CITIES */}
      <section className="border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="font-black uppercase text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            {skill.label} by city
          </h2>
          <p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text-tertiary)] mb-4">Asia</p>
          <CityGrid cities={asia} />
          <p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text-tertiary)] mt-10 mb-4">Europe</p>
          <CityGrid cities={europe} />
          <p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text-tertiary)] mt-10 mb-4">Gulf &amp; Middle East</p>
          <CityGrid cities={gulf} />
          <p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text-tertiary)] mt-10 mb-4">Latin America</p>
          <CityGrid cities={latam} />
          <p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text-tertiary)] mt-10 mb-4">Oceania</p>
          <CityGrid cities={oceania} />
          <p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text-tertiary)] mt-10 mb-4">Africa</p>
          <CityGrid cities={africa} />
        </div>
      </section>

      {/* Other skills */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Other freelance skills</h2>
          <ul className="flex flex-wrap gap-2">
            {otherSkills.map((s) => (
              <li key={s.slug}>
                <Link href={`/en/ai/${s.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                  {s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      {/* FAQ */}
      <AiFaqSection id="faq" title="FAQ" subtitle={`Hiring freelance ${skill.noun}.`} questions={faq} sectionLabel="FAQ" />

      {/* FINAL CTA */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-text)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="font-black uppercase text-white mx-auto max-w-3xl" style={{ fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire freelance {skill.noun} today.
          </h2>
          <p className="mt-5 text-[16px] text-white/60 max-w-xl mx-auto">Post your project for free and get matched in 24 hours.</p>
          <div className="mt-8">
            <Link href="/en/ai/deposer" className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors">
              Post a project — it&rsquo;s free
            </Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
    </>
  );
}

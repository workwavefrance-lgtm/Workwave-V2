import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { formatTjmRange } from "@/lib/i18n/format";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";
import { getAiCountryRate } from "@/lib/data/ai-country-rates";
import { getDnCityQueries } from "@/lib/data/digital-nomad-city-queries";
import {
  getIntlSkill,
  INTL_SKILLS,
  type IntlSkill,
} from "@/lib/data/intl-skills";
import {
  getIntlCity,
  getCountryHomage,
  INTL_CITIES,
  type IntlCity,
} from "@/lib/data/intl-cities";
import { SOURCED_INTL_CITY } from "@/lib/data/sourced-intl-market";

/**
 * Page programmatique EN : /en/ai/[skill]/[city]
 * Ex. /en/ai/web-development/dubai — "Hire web developers in Dubai".
 *
 * ISR (revalidate 6h), pas de generateStaticParams pour garder le build léger
 * (8 Go local) : génération à la demande au 1er hit/crawl puis cache.
 *
 * Données TJM : EUR base (FR market) converties dans la devise de la ville,
 * affichées comme INDICATIVES (garde-fou : pas de fausse précision locale).
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

type Params = { skill: string; city: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { skill: skillSlug, city: citySlug } = await params;
  const skill = getIntlSkill(skillSlug);
  const city = getIntlCity(citySlug);
  if (!skill || !city) return { title: "Not found" };

  const year = new Date().getFullYear();
  const path = `/en/ai/${skill.slug}/${city.slug}`;
  return {
    title: `Hire ${skill.noun} in ${city.name} (${year})`,
    description: `Hire vetted freelance ${skill.noun} in ${city.name}. Compare day rates, get matched in 24h, 0% commission. Post your project for free on Workwave AI.`,
    alternates: aiAlternatesEnOnly(path),
    openGraph: {
      title: `Hire ${skill.noun} in ${city.name}`,
      description: `Vetted freelance ${skill.noun} in ${city.name}. AI-matched, 0% commission, free to post.`,
      url: `${SITE_URL}${path}`,
      siteName: "Workwave AI",
      locale: "en_US",
      type: "website",
    },
  };
}

function buildFaq(skill: IntlSkill, city: IntlCity, seniorRange: string): FaqItem[] {
  return [
    {
      q: `How much does it cost to hire a freelance ${skill.nounSingular} in ${city.name}?`,
      a: seniorRange
        ? `Senior freelance ${skill.noun} typically charge around ${seniorRange}. The figure is indicative${city.currency === "EUR" ? "" : ", converted from European market data, and local rates may vary"}. Final rates depend on seniority, the stack, the scope and the length of the engagement. On Workwave you contact ${skill.noun} directly and agree the rate with them — Workwave takes 0% commission.`
        : `Rates vary by seniority, scope and the freelancer's experience. You agree the rate directly with the freelancer — Workwave takes 0% commission, so pricing stays transparent and you keep full control.`,
    },
    {
      q: `Do freelance ${skill.noun} in ${city.name} work remotely?`,
      a: `Most do. The large majority of freelance ${skill.noun} work fully remote, with some available hybrid or on-site in ${city.name}. You specify your preference when you post your project, and each freelancer decides whether the engagement fits.`,
    },
    {
      q: `How do I hire a freelance ${skill.nounSingular} in ${city.name} on Workwave?`,
      a: `Post your project in 60 seconds (it's free). Our AI qualifies your brief and alerts matching ${skill.noun}, who reach out to you directly by email or phone. You compare profiles, choose, and work together — with no middleman and no commission.`,
    },
    {
      q: `Is there any fee or commission for clients?`,
      a: `No. Posting a project, being contacted by ${skill.noun} and hiring them is 100% free. Workwave never takes a commission on the engagement — freelancers fund the platform through an optional subscription.`,
    },
  ];
}

export default async function SkillCityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { skill: skillSlug, city: citySlug } = await params;
  const skill = getIntlSkill(skillSlug);
  const city = getIntlCity(citySlug);
  if (!skill || !city) notFound();

  const tjm = skill.tjmKey ? TJM_REFERENCE[skill.tjmKey] : undefined;
  const seniorRange = tjm
    ? formatTjmRange(tjm.senior.min, tjm.senior.max, "en", city.currency)
    : "";

  const faq = buildFaq(skill, city, seniorRange);

  const homage = getCountryHomage(city.countryCode);
  const sourced = SOURCED_INTL_CITY[city.slug];
  // Fallback PRIX pour les skills SANS TJM jour : tarif horaire freelance senior
  // sourcé du PAYS de la ville. Slug pays = slugify(city.country), cohérent avec
  // lib/data/intl-countries.ts. Affiché seulement si sourcé+plausible (aberrations
  // neutralisées en null). Intra-pays : même ancre (zéro prix par ville inventé).
  const countrySlug = city.country
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
  const cityCountryRate = getAiCountryRate(countrySlug);
  const hasCountryRate =
    !tjm &&
    !!cityCountryRate &&
    cityCountryRate.seniorHourlyMinUsd != null &&
    cityCountryRate.seniorHourlyMaxUsd != null;

  // Digital nomad city data (Perplexity sourced) : popular services + top hubs
  const dnData = getDnCityQueries(city.slug);
  const hasDnData = !!dnData && (dnData.popularServices.length > 0 || dnData.hubs.length > 0);

  // Maillage : on relie aux villes de la MÊME région (pertinence + évite des
  // centaines de liens par page quand le dataset est mondial).
  const otherCities = INTL_CITIES.filter(
    (c) => c.slug !== city.slug && c.region === city.region
  ).slice(0, 23);
  const otherSkills = INTL_SKILLS.filter((s) => s.slug !== skill.slug);

  const path = `/en/ai/${skill.slug}/${city.slug}`;
  const tiers: { label: string; key: "junior" | "mid" | "senior" | "expert" }[] = [
    { label: "Junior", key: "junior" },
    { label: "Mid-level", key: "mid" },
    { label: "Senior", key: "senior" },
    { label: "Expert", key: "expert" },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/en/ai` },
      { "@type": "ListItem", position: 2, name: skill.label, item: `${SITE_URL}/en/ai/${skill.slug}` },
      { "@type": "ListItem", position: 3, name: city.name, item: `${SITE_URL}${path}` },
    ],
  };
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Hire ${skill.noun} in ${city.name}`,
    serviceType: skill.label,
    areaServed: { "@type": "City", name: city.name, address: { "@type": "PostalAddress", addressCountry: city.countryCode } },
    provider: { "@type": "Organization", name: "Workwave AI", url: `${SITE_URL}/en/ai` },
  };

  return (
    <>
      {/* Breadcrumb */}
      <nav aria-label="Breadcrumb" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
          <li><Link href="/en/ai" className="hover:text-[var(--ai-text)] transition-colors">Workwave AI</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/en/ai/${skill.slug}`} className="hover:text-[var(--ai-text)] transition-colors">{skill.label}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ai-text-secondary)]">{city.name}</li>
        </ol>
      </nav>

      {/* HERO + monument de la ville */}
      <section className="relative overflow-hidden">
        <div
          aria-hidden="true"
          className="pointer-events-none absolute right-0 bottom-0 w-[55%] max-w-[520px] select-none"
          style={{ color: "var(--ai-accent)", opacity: 0.1 }}
        >
          <MonumentArt name={city.monument} className="w-full h-[200px] sm:h-[280px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {city.state ? `${city.state} · United States` : `${city.country} · ${city.region}`}
            </span>
          </div>
          {homage && (
            <p className="mb-4 text-[15px] sm:text-[16px] text-[var(--ai-text-secondary)]">
              <span className="font-semibold text-[var(--ai-text)]">{homage.phrase}</span>
              {homage.roman ? (
                <span className="text-[var(--ai-text-tertiary)]"> ({homage.roman})</span>
              ) : null}
              <span className="text-[var(--ai-text-tertiary)]">
                {" "}
                — {homage.lang} for &ldquo;{homage.translation}&rdquo;
              </span>
            </p>
          )}
          <h1 className="font-black text-[var(--ai-text)] max-w-3xl" style={{ fontSize: "clamp(34px, 6vw, 68px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire {skill.noun} in {city.name}
          </h1>
          <p className="mt-6 text-[16px] sm:text-[18px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            {city.blurb} Post your project for free — our AI alerts matching freelance {skill.noun} and they contact you directly. 0% commission.
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

      {/* THE LOCAL SCENE — section premium, rendue seulement si data riche (US) */}
      {city.techScene && (
        <section className="border-t border-[var(--ai-border-subtle)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-3 gap-10 lg:gap-14">
            <div className="lg:col-span-2">
              <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)] mb-4" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                The local scene
              </p>
              <h2 className="font-black text-[var(--ai-text)] mb-5 max-w-2xl" style={{ fontSize: "clamp(24px, 4vw, 38px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
                {skill.label} &amp; freelance work in {city.name}
              </h2>
              <p className="text-[16px] sm:text-[17px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
                {city.techScene}
              </p>
              <p className="mt-4 text-[15px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
                Most freelance {skill.noun} work remotely, so you can hire the best fit whether they&rsquo;re based in {city.name} or elsewhere — and brief them in your own timezone.
              </p>
            </div>
            <div className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-6 self-start">
              <p className="text-[11px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text-tertiary)] mb-4" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                {city.name} · at a glance
              </p>
              <dl className="space-y-3.5 text-[14px]">
                {city.state && (
                  <div className="flex justify-between gap-4 border-b border-[var(--ai-border-subtle)] pb-3.5">
                    <dt className="text-[var(--ai-text-tertiary)]">State</dt>
                    <dd className="text-[var(--ai-text)] font-medium text-right">{city.state}</dd>
                  </div>
                )}
                {city.metro && (
                  <div className="flex justify-between gap-4 border-b border-[var(--ai-border-subtle)] pb-3.5">
                    <dt className="text-[var(--ai-text-tertiary)]">Metro area</dt>
                    <dd className="text-[var(--ai-text)] font-medium text-right">{city.metro}</dd>
                  </div>
                )}
                {city.timezone && (
                  <div className="flex justify-between gap-4 border-b border-[var(--ai-border-subtle)] pb-3.5">
                    <dt className="text-[var(--ai-text-tertiary)]">Timezone</dt>
                    <dd className="text-[var(--ai-text)] font-medium text-right">{city.timezone}</dd>
                  </div>
                )}
                <div className="flex justify-between gap-4">
                  <dt className="text-[var(--ai-text-tertiary)]">Engagement</dt>
                  <dd className="text-[var(--ai-accent)] font-semibold text-right">Remote-first</dd>
                </div>
              </dl>
            </div>
          </div>
        </section>
      )}

      {/* MARKET — paragraphe sourcé Perplexity (vague mondiale). Zéro chiffre
          inventé : texte web cité. Rendu seulement si la donnée existe. */}
      {sourced && (
        <section className="border-t border-[var(--ai-border-subtle)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <p className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)] mb-4" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              The local scene
            </p>
            <h2 className="font-black text-[var(--ai-text)] mb-5 max-w-2xl" style={{ fontSize: "clamp(24px, 4vw, 38px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
              Freelance {skill.noun} in {city.name}
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

      {/* DAY RATES */}
      {tjm && (
        <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black uppercase text-[var(--ai-text)] mb-3 max-w-2xl" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
              {skill.label} day rates in {city.name}
            </h2>
            <p className="text-[14px] text-[var(--ai-text-secondary)] mb-10 max-w-2xl">
              {city.currency === "EUR"
                ? "Indicative European freelance day rates by seniority. For planning only — final rates depend on scope and stack."
                : `Indicative day rates by seniority, based on European market data converted to ${city.currency}. Local rates may vary — for planning only.`}
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((t) => {
                const range = tjm[t.key];
                return (
                  <div key={t.key} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-6">
                    <p className="text-[12px] font-semibold tracking-wide uppercase text-[var(--ai-text-tertiary)]">{t.label}</p>
                    <p className="mt-2 text-[17px] sm:text-[19px] font-black text-[var(--ai-accent)] tracking-tight">
                      {formatTjmRange(range.min, range.max, "en", city.currency)}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* HOURLY RATE (fallback pays, USD) — pour les skills SANS TJM jour, afin
          que CHAQUE page ville ait un signal prix. Indicatif + sourcé. */}
      {hasCountryRate && (
        <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black uppercase text-[var(--ai-text)] mb-3 max-w-2xl" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
              {skill.label} rates in {city.name}
            </h2>
            <p className="text-[14px] text-[var(--ai-text-secondary)] mb-8 max-w-2xl">
              Indicative hourly rate for an experienced freelancer in {city.country} (USD). Rates vary by skill, seniority and project — you agree the final rate directly with the freelancer, 0% commission.
            </p>
            <div className="flex flex-wrap items-center gap-4">
              <div className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-6">
                <p className="text-[12px] font-semibold tracking-wide uppercase text-[var(--ai-text-tertiary)]">Senior · hourly</p>
                <p className="mt-2 text-[20px] sm:text-[24px] font-black text-[var(--ai-accent)] tracking-tight">
                  ${cityCountryRate!.seniorHourlyMinUsd}–${cityCountryRate!.seniorHourlyMaxUsd}/hr
                </p>
              </div>
              {cityCountryRate!.level && (
                <span className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] text-[12px] font-medium text-[var(--ai-text-secondary)] capitalize">
                  {cityCountryRate!.level} market
                </span>
              )}
            </div>
            {cityCountryRate!.note && (
              <p className="mt-6 text-[15px] leading-relaxed text-[var(--ai-text-secondary)] max-w-3xl">{cityCountryRate!.note}</p>
            )}
            {cityCountryRate!.sources?.[0] && (
              <p className="mt-4 text-[12px] text-[var(--ai-text-tertiary)]">
                Sources · {cityCountryRate!.retrievedAt} ·{" "}
                <a href={cityCountryRate!.sources[0]} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-text)]">
                  reference
                </a>
              </p>
            )}
          </div>
        </section>
      )}

      {/* DIGITAL NOMAD CITY DATA — sections sourcées Perplexity (services + hubs) */}
      {hasDnData && (
        <section className="border-t border-[var(--ai-border-subtle)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="text-2xl sm:text-3xl font-semibold text-[var(--ai-text)] tracking-tight">
              {city.name} for {skill.label.toLowerCase()} freelancers
            </h2>
            <p className="mt-3 text-[15px] leading-relaxed text-[var(--ai-text-secondary)] max-w-3xl">
              {city.name} is a known digital nomad and remote-work destination in {city.country}.
              Below : the most in-demand freelance services on the ground and the main coworking
              spaces where remote workers gather.
            </p>

            <div className="mt-10 grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Popular services chips */}
              {dnData!.popularServices.length > 0 && (
                <div className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-6">
                  <h3 className="text-[15px] font-semibold text-[var(--ai-text)]">
                    Popular freelance services in {city.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] text-[var(--ai-text-secondary)]">
                    Most in-demand digital services among clients in {city.name}.
                  </p>
                  <div className="mt-5 flex flex-wrap gap-2">
                    {dnData!.popularServices.map((s) => (
                      <span
                        key={s}
                        className="inline-flex items-center rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] px-3 py-1.5 text-[13px] text-[var(--ai-text)]"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Top coworking hubs */}
              {dnData!.hubs.length > 0 && (
                <div className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-6">
                  <h3 className="text-[15px] font-semibold text-[var(--ai-text)]">
                    Top coworking & coliving spaces in {city.name}
                  </h3>
                  <p className="mt-1.5 text-[13px] text-[var(--ai-text-secondary)]">
                    Where the local remote-work community gathers.
                  </p>
                  <ul className="mt-5 space-y-2">
                    {dnData!.hubs.map((h) => (
                      <li
                        key={h}
                        className="flex items-start gap-2 text-[14px] text-[var(--ai-text)]"
                      >
                        <span className="mt-1.5 h-1.5 w-1.5 rounded-full bg-[var(--ai-accent)] flex-shrink-0" />
                        <span>{h}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {dnData!.sources.length > 0 && (
              <p className="mt-6 text-[12px] text-[var(--ai-text-secondary)]">
                Sources :{" "}
                {dnData!.sources.slice(0, 3).map((s, i) => (
                  <span key={s}>
                    {i > 0 && " · "}
                    <a href={s} target="_blank" rel="noopener nofollow" className="underline">
                      {(() => {
                        try { return new URL(s).hostname.replace(/^www\./, ""); } catch { return "source"; }
                      })()}
                    </a>
                  </span>
                ))}
              </p>
            )}
          </div>
        </section>
      )}

      {/* WHY WORKWAVE */}
      <section className="border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {[
              { t: "0% commission", d: "Pay the freelancer directly. We never take a cut." },
              { t: "Free to post", d: `Posting your ${skill.label.toLowerCase()} project is free.` },
              { t: "AI-matched in 24h", d: "The right freelancers reach out, fast." },
              { t: "Vetted profiles", d: "Freelancers with verified business identities." },
            ].map((v) => (
              <div key={v.t} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-6">
                <h3 className="text-[15px] font-semibold text-[var(--ai-text)]">{v.t}</h3>
                <p className="mt-1.5 text-[13px] leading-relaxed text-[var(--ai-text-secondary)]">{v.d}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* INTERNAL MESH */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Hire {skill.noun} in other cities</h2>
            <ul className="flex flex-wrap gap-2">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/en/ai/${skill.slug}/${c.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Other freelance skills in {city.name}</h2>
            <ul className="flex flex-wrap gap-2">
              {otherSkills.map((s) => (
                <li key={s.slug}>
                  <Link href={`/en/ai/${s.slug}/${city.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                    {s.label}
                  </Link>
                </li>
              ))}
            </ul>
            <p className="mt-6 text-[13px] text-[var(--ai-text-tertiary)]">
              See also the{" "}
              <Link href={`/en/ai/${skill.slug}`} className="underline decoration-[var(--ai-border)] underline-offset-2 hover:text-[var(--ai-text)]">
                {skill.label} overview
              </Link>.
            </p>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <AiFaqSection
        id="faq"
        title="FAQ"
        subtitle={`Hiring freelance ${skill.noun} in ${city.name}.`}
        questions={faq}
        sectionLabel="FAQ"
      />

      {/* FINAL CTA */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-text)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="font-black uppercase text-white mx-auto max-w-3xl" style={{ fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire {skill.noun} in {city.name} today.
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

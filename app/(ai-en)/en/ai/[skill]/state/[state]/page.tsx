import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { aiAlternatesEnOnly } from "@/lib/i18n/alternates";
import { formatTjmRange } from "@/lib/i18n/format";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";
import { getIntlSkill, INTL_SKILLS } from "@/lib/data/intl-skills";
import { INTL_CITIES } from "@/lib/data/intl-cities";
import { getUsState, US_STATES } from "@/lib/data/us-states";

/**
 * Hub d'état US : /en/ai/[skill]/state/[state] (ex. /en/ai/web-development/state/california).
 * Segment littéral "state/" => aucun conflit avec /en/ai/[skill]/[city] (leçon 18/04).
 * Maille vers les villes de l'état (INTL_CITIES filtrées par city.state).
 * ISR 6h, pas de generateStaticParams (build léger, génération à la demande).
 */

const SITE_URL = "https://www.workwaveai.co";
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

type Params = { skill: string; state: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { skill: skillSlug, state: stateSlug } = await params;
  const skill = getIntlSkill(skillSlug);
  const state = getUsState(stateSlug);
  if (!skill || !state) return { title: "Not found" };
  const year = new Date().getFullYear();
  const path = `/en/ai/${skill.slug}/state/${state.slug}`;
  return {
    title: `Hire ${skill.noun} in ${state.name} (${year})`,
    description: `Hire vetted freelance ${skill.noun} across ${state.name}. Compare day rates, get matched in 24h, 0% commission. Post your project for free on Workwave AI.`,
    alternates: aiAlternatesEnOnly(path),
    openGraph: {
      title: `Hire ${skill.noun} in ${state.name}`,
      description: `Vetted freelance ${skill.noun} across ${state.name}. AI-matched, 0% commission, free to post.`,
      url: `${SITE_URL}${path}`,
      siteName: "Workwave AI",
      locale: "en_US",
      type: "website",
    },
  };
}

export default async function SkillStatePage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { skill: skillSlug, state: stateSlug } = await params;
  const skill = getIntlSkill(skillSlug);
  const state = getUsState(stateSlug);
  if (!skill || !state) notFound();

  const tjm = skill.tjmKey ? TJM_REFERENCE[skill.tjmKey] : undefined;
  const path = `/en/ai/${skill.slug}/state/${state.slug}`;

  // Villes de l'état présentes dans notre dataset (maillage interne).
  const stateCities = INTL_CITIES.filter(
    (c) => c.region === "USA" && c.state === state.name
  );
  const otherStates = US_STATES.filter((s) => s.slug !== state.slug);
  const otherSkills = INTL_SKILLS.filter((s) => s.slug !== skill.slug);

  const tiers: { label: string; key: "junior" | "mid" | "senior" | "expert" }[] = [
    { label: "Junior", key: "junior" },
    { label: "Mid-level", key: "mid" },
    { label: "Senior", key: "senior" },
    { label: "Expert", key: "expert" },
  ];

  const faq: FaqItem[] = [
    {
      q: `How much does it cost to hire a freelance ${skill.nounSingular} in ${state.name}?`,
      a: tjm
        ? `Senior freelance ${skill.noun} typically charge around ${formatTjmRange(tjm.senior.min, tjm.senior.max, "en", "USD")}/day. The figure is indicative, converted from European market data — US rates vary by metro and seniority. You agree the rate directly with the freelancer; Workwave takes 0% commission.`
        : `Rates vary by seniority, scope and the freelancer's experience. You agree the rate directly with the freelancer — Workwave takes 0% commission, so pricing stays transparent.`,
    },
    {
      q: `Do freelance ${skill.noun} in ${state.name} work remotely?`,
      a: `Most do. The majority of freelance ${skill.noun} work fully remote, so you can hire the best fit anywhere in ${state.name} — or beyond — and brief them in your own timezone.`,
    },
    {
      q: `How do I hire a freelance ${skill.nounSingular} in ${state.name} on Workwave?`,
      a: `Post your project in 60 seconds (it's free). Our AI qualifies your brief and alerts matching ${skill.noun}, who reach out to you directly. You compare, choose and work together — no middleman, no commission.`,
    },
    {
      q: `Is it free for clients?`,
      a: `Yes. Posting a project, being contacted by ${skill.noun} and hiring them is 100% free. Workwave never takes a commission — freelancers fund the platform through an optional subscription.`,
    },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/en/ai` },
      { "@type": "ListItem", position: 2, name: skill.label, item: `${SITE_URL}/en/ai/${skill.slug}` },
      { "@type": "ListItem", position: 3, name: state.name, item: `${SITE_URL}${path}` },
    ],
  };
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Hire ${skill.noun} in ${state.name}`,
    serviceType: skill.label,
    areaServed: { "@type": "State", name: state.name, address: { "@type": "PostalAddress", addressRegion: state.code, addressCountry: "US" } },
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
          <li className="text-[var(--ai-text-secondary)]">{state.name}</li>
        </ol>
      </nav>

      {/* HERO */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-0 w-[50%] max-w-[460px] select-none" style={{ color: "var(--ai-accent)", opacity: 0.09 }}>
          <MonumentArt name="us-capitol" className="w-full h-[200px] sm:h-[260px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {state.code} · {state.division} · United States
            </span>
          </div>
          <h1 className="font-black text-[var(--ai-text)] max-w-3xl" style={{ fontSize: "clamp(34px, 6vw, 68px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire {skill.noun} in {state.name}
          </h1>
          <p className="mt-6 text-[16px] sm:text-[18px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            {state.blurb} Post your project for free — our AI alerts matching freelance {skill.noun} across {state.name} and they contact you directly. 0% commission.
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

      {/* CITIES IN STATE */}
      {stateCities.length > 0 && (
        <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(22px, 4vw, 36px)", lineHeight: 1.0, letterSpacing: "-0.03em" }}>
              {skill.label} by city in {state.name}
            </h2>
            <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
              {stateCities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/en/ai/${skill.slug}/${c.slug}`} className="block rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-4 hover:border-[var(--ai-border-strong)] transition-colors">
                    <span className="block text-[15px] font-semibold text-[var(--ai-text)]">{c.name}</span>
                    {c.metro && <span className="block text-[12px] text-[var(--ai-text-tertiary)]">{c.metro}</span>}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </section>
      )}

      {/* DAY RATES */}
      {tjm && (
        <section className="border-t border-[var(--ai-border-subtle)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black uppercase text-[var(--ai-text)] mb-3 max-w-2xl" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
              {skill.label} day rates in {state.name}
            </h2>
            <p className="text-[14px] text-[var(--ai-text-secondary)] mb-10 max-w-2xl">
              Indicative day rates by seniority, based on European market data converted to USD. US rates vary by metro — for planning only.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((t) => {
                const range = tjm[t.key];
                return (
                  <div key={t.key} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-6">
                    <p className="text-[12px] font-semibold tracking-wide uppercase text-[var(--ai-text-tertiary)]">{t.label}</p>
                    <p className="mt-2 text-[17px] sm:text-[19px] font-black text-[var(--ai-accent)] tracking-tight">
                      {formatTjmRange(range.min, range.max, "en", "USD")}
                    </p>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* INTERNAL MESH */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Hire {skill.noun} in other states</h2>
            <ul className="flex flex-wrap gap-2">
              {otherStates.slice(0, 24).map((s) => (
                <li key={s.slug}>
                  <Link href={`/en/ai/${skill.slug}/state/${s.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                    {s.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Other freelance skills in {state.name}</h2>
            <ul className="flex flex-wrap gap-2">
              {otherSkills.map((s) => (
                <li key={s.slug}>
                  <Link href={`/en/ai/${s.slug}/state/${state.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
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
      <AiFaqSection id="faq" title="FAQ" subtitle={`Hiring freelance ${skill.noun} in ${state.name}.`} questions={faq} sectionLabel="FAQ" />

      {/* FINAL CTA */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-text)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="font-black uppercase text-white mx-auto max-w-3xl" style={{ fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Hire {skill.noun} in {state.name} today.
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

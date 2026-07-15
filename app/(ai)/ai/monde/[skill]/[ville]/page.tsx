import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { formatTjmRange } from "@/lib/i18n/format";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";
import { getIntlSkill, INTL_SKILLS, SKILL_FR } from "@/lib/data/intl-skills";
import { getFrCity, FR_CITIES } from "@/lib/data/intl-fr-cities";

/**
 * Page programmatique francophone : /ai/monde/[skill]/[ville]
 * Ex. /ai/monde/web-development/bruxelles — "Freelance développeur web à Bruxelles".
 *
 * Hors-France (la France est sur /ai/[skill]/[ville], pilotée par la base).
 * Tarifs en EUR (locale "fr"), indicatifs marché européen — pas de conversion
 * locale inventée. ISR 6h. BTP = France only, non concerné.
 */

const SITE_URL = "https://workwave.fr";
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

type Params = { skill: string; ville: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { skill: skillSlug, ville } = await params;
  const fr = SKILL_FR[skillSlug];
  const city = getFrCity(ville);
  if (!fr || !city) return { title: "Introuvable" };
  const year = new Date().getFullYear();
  const path = `/ai/monde/${skillSlug}/${ville}`;
  return {
    title: `Freelance ${fr.label} à ${city.name} — TJM & profils (${year})`,
    description: `Trouvez un freelance ${fr.nounSingular} à ${city.name} (${city.country}). Comparez les TJM, soyez mis en relation en 24h, 0 commission. Déposez votre projet gratuitement sur Workwave AI.`,
    alternates: { canonical: `${SITE_URL}${path}` },
    openGraph: {
      title: `Freelance ${fr.label} à ${city.name}`,
      description: `Freelances ${fr.noun} à ${city.name}. Mise en relation IA, 0 commission, gratuit.`,
      url: `${SITE_URL}${path}`,
      siteName: "Workwave AI",
      locale: "fr_FR",
      type: "website",
    },
  };
}

function buildFaq(
  frLabelNoun: string,
  frNounSingular: string,
  cityName: string,
  seniorRange: string
): FaqItem[] {
  return [
    {
      q: `Combien coûte un freelance ${frNounSingular} à ${cityName} ?`,
      a: seniorRange
        ? `Un freelance ${frNounSingular} senior facture en général autour de ${seniorRange}. Fourchette indicative (TJM marché européen) ; le tarif final dépend de la séniorité, de la stack, du périmètre et de la durée de la mission. Sur Workwave, vous convenez du tarif directement avec le freelance — 0 commission.`
        : `Le tarif varie selon la séniorité, le périmètre et l'expérience du freelance. Vous le négociez directement avec lui — Workwave ne prend aucune commission, le prix reste transparent.`,
    },
    {
      q: `Les freelances ${frLabelNoun} à ${cityName} travaillent-ils en remote ?`,
      a: `Oui, en grande majorité. La plupart travaillent en full remote, certains en hybride ou sur place à ${cityName}. Vous précisez vos contraintes au dépôt du projet, et chaque freelance choisit si la mission lui convient.`,
    },
    {
      q: `Comment trouver un freelance ${frNounSingular} à ${cityName} sur Workwave ?`,
      a: `Déposez votre projet en 60 secondes (gratuit). Notre IA qualifie votre besoin et alerte les freelances ${frLabelNoun} qui correspondent — ils vous contactent directement. Vous comparez, choisissez, sans intermédiaire ni commission.`,
    },
    {
      q: `Y a-t-il des frais pour les clients ?`,
      a: `Non. Déposer un projet, être contacté et recruter est 100 % gratuit. Workwave ne prend jamais de commission sur la mission.`,
    },
  ];
}

export default async function MondeSkillCityPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { skill: skillSlug, ville } = await params;
  const fr = SKILL_FR[skillSlug];
  const skill = getIntlSkill(skillSlug);
  const city = getFrCity(ville);
  if (!fr || !skill || !city) notFound();

  const tjm = skill.tjmKey ? TJM_REFERENCE[skill.tjmKey] : undefined;
  const seniorRange = tjm
    ? formatTjmRange(tjm.senior.min, tjm.senior.max, "fr")
    : "";

  const faq = buildFaq(fr.noun, fr.nounSingular, city.name, seniorRange);

  const otherCities = FR_CITIES.filter((c) => c.slug !== city.slug);
  const otherSkills = INTL_SKILLS.filter((s) => s.slug !== skill.slug);

  const path = `/ai/monde/${skill.slug}/${city.slug}`;
  const tiers: { label: string; key: "junior" | "mid" | "senior" | "expert" }[] = [
    { label: "Junior", key: "junior" },
    { label: "Confirmé", key: "mid" },
    { label: "Senior", key: "senior" },
    { label: "Expert", key: "expert" },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/ai` },
      { "@type": "ListItem", position: 2, name: fr.label, item: `${SITE_URL}/ai/monde/${skill.slug}` },
      { "@type": "ListItem", position: 3, name: city.name, item: `${SITE_URL}${path}` },
    ],
  };
  const serviceLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Freelance ${fr.label} à ${city.name}`,
    serviceType: fr.label,
    areaServed: { "@type": "City", name: city.name },
    provider: { "@type": "Organization", name: "Workwave AI", url: `${SITE_URL}/ai` },
  };

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
          <li><Link href="/ai" className="hover:text-[var(--ai-text)] transition-colors">Workwave AI</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/ai/monde" className="hover:text-[var(--ai-text)] transition-colors">Monde</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href={`/ai/monde/${skill.slug}`} className="hover:text-[var(--ai-text)] transition-colors">{fr.label}</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ai-text-secondary)]">{city.name}</li>
        </ol>
      </nav>

      {/* HERO + monument */}
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute right-0 bottom-0 w-[55%] max-w-[520px] select-none" style={{ color: "var(--ai-accent)", opacity: 0.1 }}>
          <MonumentArt name={city.monument} className="w-full h-[200px] sm:h-[280px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <div className="flex items-center gap-3 mb-5">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              {city.country} · {city.region}
            </span>
          </div>
          <h1 className="font-black text-[var(--ai-text)] max-w-3xl" style={{ fontSize: "clamp(32px, 6vw, 64px)", lineHeight: 0.99, letterSpacing: "-0.04em" }}>
            Freelance {fr.label} à {city.name}
          </h1>
          <p className="mt-6 text-[16px] sm:text-[18px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            {city.blurb} Déposez votre projet gratuitement — notre IA alerte les freelances {fr.noun} qui correspondent, et ils vous contactent directement. 0 commission.
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3">
            <Link href="/ai/deposer" className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors" style={{ boxShadow: "var(--ai-shadow-sm)" }}>
              Déposer un projet — gratuit
            </Link>
            <Link href="/ai/freelances" className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-text)] hover:bg-[var(--ai-primary-hover)] text-white transition-colors">
              Voir les freelances
            </Link>
          </div>
        </div>
      </section>

      {/* TJM */}
      {tjm && (
        <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black uppercase text-[var(--ai-text)] mb-3 max-w-2xl" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.99, letterSpacing: "-0.04em" }}>
              TJM {fr.label} à {city.name}
            </h2>
            <p className="text-[14px] text-[var(--ai-text-secondary)] mb-10 max-w-2xl">
              Fourchettes indicatives par séniorité (TJM marché européen, en €). À titre de repère — le tarif final dépend du périmètre et de la stack.
            </p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((t) => (
                <div key={t.key} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-6">
                  <p className="text-[12px] font-semibold tracking-wide uppercase text-[var(--ai-text-tertiary)]">{t.label}</p>
                  <p className="mt-2 text-[17px] sm:text-[19px] font-black text-[var(--ai-accent)] tracking-tight">
                    {formatTjmRange(tjm[t.key].min, tjm[t.key].max, "fr")}
                  </p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      {/* MAILLAGE */}
      <section className="border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20 grid grid-cols-1 lg:grid-cols-2 gap-12">
          <div>
            <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Freelance {fr.label} dans d&apos;autres villes</h2>
            <ul className="flex flex-wrap gap-2">
              {otherCities.map((c) => (
                <li key={c.slug}>
                  <Link href={`/ai/monde/${skill.slug}/${c.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                    {c.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Autres métiers à {city.name}</h2>
            <ul className="flex flex-wrap gap-2">
              {otherSkills.map((s) => (
                <li key={s.slug}>
                  <Link href={`/ai/monde/${s.slug}/${city.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                    {SKILL_FR[s.slug]?.label || s.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>

      {/* FAQ */}
      <AiFaqSection id="faq" title="FAQ" subtitle={`Recruter un freelance ${fr.nounSingular} à ${city.name}.`} questions={faq} sectionLabel="FAQ" />

      {/* CTA final */}
      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-text)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24 text-center">
          <h2 className="font-black uppercase text-white mx-auto max-w-3xl" style={{ fontSize: "clamp(28px, 5vw, 52px)", lineHeight: 0.99, letterSpacing: "-0.04em" }}>
            Trouvez votre freelance {fr.label} à {city.name}.
          </h2>
          <p className="mt-5 text-[16px] text-white/60 max-w-xl mx-auto">Déposez votre projet gratuitement et soyez mis en relation en 24h. 0 commission.</p>
          <div className="mt-8">
            <Link href="/ai/deposer" className="inline-flex items-center justify-center h-12 px-8 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors">
              Déposer un projet — gratuit
            </Link>
          </div>
        </div>
      </section>

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceLd) }} />
    </>
  );
}

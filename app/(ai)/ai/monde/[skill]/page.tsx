import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { formatTjmRange } from "@/lib/i18n/format";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";
import { getIntlSkill, INTL_SKILLS, SKILL_FR } from "@/lib/data/intl-skills";
import { FR_CITIES } from "@/lib/data/intl-fr-cities";

/**
 * Hub francophone par métier : /ai/monde/[skill] (ex. /ai/monde/web-development).
 * Liste les villes francophones (hors France) + aperçu TJM (EUR). ISR 6h.
 */

const SITE_URL = "https://workwave.fr";
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

type Params = { skill: string };

export async function generateMetadata({
  params,
}: {
  params: Promise<Params>;
}): Promise<Metadata> {
  const { skill: skillSlug } = await params;
  const fr = SKILL_FR[skillSlug];
  if (!fr) return { title: "Introuvable" };
  const year = new Date().getFullYear();
  const path = `/ai/monde/${skillSlug}`;
  return {
    title: `Freelance ${fr.label} — monde francophone (${year})`,
    description: `Trouvez un freelance ${fr.nounSingular} à Bruxelles, Genève, Montréal, Casablanca, Dakar et plus. TJM indicatifs, mise en relation en 24h, 0 commission.`,
    alternates: { canonical: `${SITE_URL}${path}` },
  };
}

export default async function MondeSkillHubPage({
  params,
}: {
  params: Promise<Params>;
}) {
  const { skill: skillSlug } = await params;
  const fr = SKILL_FR[skillSlug];
  const skill = getIntlSkill(skillSlug);
  if (!fr || !skill) notFound();

  const tjm = skill.tjmKey ? TJM_REFERENCE[skill.tjmKey] : undefined;
  const path = `/ai/monde/${skill.slug}`;
  const regions: FrCityRegion[] = ["Europe", "Amérique", "Afrique"];
  const otherSkills = INTL_SKILLS.filter((s) => s.slug !== skill.slug);

  const tiers: { label: string; key: "junior" | "mid" | "senior" | "expert" }[] = [
    { label: "Junior", key: "junior" },
    { label: "Confirmé", key: "mid" },
    { label: "Senior", key: "senior" },
    { label: "Expert", key: "expert" },
  ];

  const faq: FaqItem[] = [
    {
      q: `Combien coûte un freelance ${fr.nounSingular} ?`,
      a: tjm
        ? `Repère indicatif (TJM marché européen) : un ${fr.nounSingular} senior facture autour de ${formatTjmRange(tjm.senior.min, tjm.senior.max, "fr")}. Le tarif final dépend de la séniorité, du périmètre et de la mission. Sur Workwave, vous convenez du tarif directement avec le freelance — 0 commission.`
        : `Le tarif varie selon la séniorité, le périmètre et l'expérience. Vous le négociez directement avec le freelance — Workwave ne prend aucune commission.`,
    },
    {
      q: `Dans quels pays francophones puis-je recruter ?`,
      a: `Belgique, Suisse, Luxembourg, Québec (Canada), Maroc, Tunisie, Sénégal, Côte d'Ivoire… La plupart des freelances travaillent en remote, vous pouvez donc recruter au-delà des frontières.`,
    },
    {
      q: `C'est gratuit pour les clients ?`,
      a: `Oui, 100 % gratuit. Déposer un projet, être contacté et recruter ne coûte rien. Les freelances financent la plateforme via un abonnement optionnel.`,
    },
  ];

  const breadcrumbLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/ai` },
      { "@type": "ListItem", position: 2, name: "Monde", item: `${SITE_URL}/ai/monde` },
      { "@type": "ListItem", position: 3, name: fr.label, item: `${SITE_URL}${path}` },
    ],
  };

  return (
    <>
      <nav aria-label="Fil d'Ariane" className="max-w-7xl mx-auto px-4 sm:px-6 pt-6">
        <ol className="flex flex-wrap items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)]">
          <li><Link href="/ai" className="hover:text-[var(--ai-text)]">Workwave AI</Link></li>
          <li aria-hidden="true">/</li>
          <li><Link href="/ai/monde" className="hover:text-[var(--ai-text)]">Monde</Link></li>
          <li aria-hidden="true">/</li>
          <li className="text-[var(--ai-text-secondary)]">{fr.label}</li>
        </ol>
      </nav>

      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 select-none" style={{ color: "var(--ai-accent)", opacity: 0.08 }}>
          <MonumentArt name="skyline-global" className="w-full h-[160px] sm:h-[220px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-10 sm:pt-16 pb-12 sm:pb-16">
          <h1 className="font-black text-[var(--ai-text)] max-w-3xl" style={{ fontSize: "clamp(32px, 6vw, 68px)", lineHeight: 0.99, letterSpacing: "-0.04em" }}>
            Freelance {fr.label}
          </h1>
          <p className="mt-6 text-[16px] sm:text-[18px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            Recrutez un freelance {fr.nounSingular} dans l&apos;espace francophone. Déposez votre projet gratuitement — notre IA alerte les profils qui correspondent et ils vous contactent. 0 commission.
          </p>
          <div className="mt-8">
            <Link href="/ai/deposer" className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors" style={{ boxShadow: "var(--ai-shadow-sm)" }}>
              Déposer un projet — gratuit
            </Link>
          </div>
        </div>
      </section>

      {tjm && (
        <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
            <h2 className="font-black uppercase text-[var(--ai-text)] mb-3 max-w-2xl" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.99, letterSpacing: "-0.04em" }}>
              TJM {fr.label}
            </h2>
            <p className="text-[14px] text-[var(--ai-text-secondary)] mb-10 max-w-2xl">Fourchettes indicatives par séniorité (TJM marché européen, en €). Voir une ville ci-dessous pour le contexte local.</p>
            <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
              {tiers.map((t) => (
                <div key={t.key} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-6">
                  <p className="text-[12px] font-semibold tracking-wide uppercase text-[var(--ai-text-tertiary)]">{t.label}</p>
                  <p className="mt-2 text-[17px] sm:text-[19px] font-black text-[var(--ai-accent)] tracking-tight">{formatTjmRange(tjm[t.key].min, tjm[t.key].max, "fr")}</p>
                </div>
              ))}
            </div>
          </div>
        </section>
      )}

      <section className="border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="font-black uppercase text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.99, letterSpacing: "-0.04em" }}>
            {fr.label} par ville
          </h2>
          {regions.map((region) => {
            const cities = FR_CITIES.filter((c) => c.region === region);
            if (cities.length === 0) return null;
            return (
              <div key={region} className="mb-8">
                <p className="text-[12px] font-semibold tracking-[0.18em] uppercase text-[var(--ai-text-tertiary)] mb-4">{region}</p>
                <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
                  {cities.map((c) => (
                    <li key={c.slug}>
                      <Link href={`/ai/monde/${skill.slug}/${c.slug}`} className="block rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] p-4 hover:border-[var(--ai-border-strong)] transition-colors">
                        <span className="block text-[15px] font-semibold text-[var(--ai-text)]">{c.name}</span>
                        <span className="block text-[12px] text-[var(--ai-text-tertiary)]">{c.country}</span>
                      </Link>
                    </li>
                  ))}
                </ul>
              </div>
            );
          })}
        </div>
      </section>

      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="text-[19px] font-semibold text-[var(--ai-text)] mb-5">Autres métiers</h2>
          <ul className="flex flex-wrap gap-2">
            {otherSkills.map((s) => (
              <li key={s.slug}>
                <Link href={`/ai/monde/${s.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                  {SKILL_FR[s.slug]?.label || s.label}
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AiFaqSection id="faq" title="FAQ" subtitle={`Recruter un freelance ${fr.nounSingular} dans l'espace francophone.`} questions={faq} sectionLabel="FAQ" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbLd) }} />
    </>
  );
}

type FrCityRegion = "Europe" | "Amérique" | "Afrique";

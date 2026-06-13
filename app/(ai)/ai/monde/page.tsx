import type { Metadata } from "next";
import Link from "next/link";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import MonumentArt from "@/components/ai/MonumentArt";
import { INTL_SKILLS, SKILL_FR } from "@/lib/data/intl-skills";
import { FR_CITIES } from "@/lib/data/intl-fr-cities";

/**
 * Landing francophone internationale : /ai/monde.
 * Hub des métiers freelance pour l'espace francophone (hors France). ISR 24h.
 */

const SITE_URL = "https://workwave.fr";
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

export const metadata: Metadata = {
  title: "Freelances dans le monde francophone — Workwave AI",
  description:
    "Recrutez des freelances tech, marketing, design, data et plus à Bruxelles, Genève, Luxembourg, Montréal, Casablanca, Dakar… Mise en relation IA, 0 commission, gratuit pour les clients.",
  alternates: { canonical: `${SITE_URL}/ai/monde` },
};

export default function MondeLandingPage() {
  const faq: FaqItem[] = [
    {
      q: "Dans quels pays francophones Workwave AI met-il en relation ?",
      a: "Belgique, Suisse, Luxembourg, Québec (Canada), Maroc, Tunisie, Sénégal, Côte d'Ivoire. La France est couverte séparément. La plupart des freelances travaillant en remote, vous pouvez recruter au-delà des frontières.",
    },
    {
      q: "Comment ça marche ?",
      a: "Vous déposez votre projet en 60 secondes (gratuit). Notre IA qualifie votre besoin et alerte les freelances francophones qui correspondent — ils vous contactent directement. Vous comparez, choisissez, sans intermédiaire ni commission.",
    },
    {
      q: "C'est gratuit ?",
      a: "Oui, 100 % gratuit côté client. Déposer un projet, être contacté et recruter ne coûte rien. Workwave ne prend aucune commission sur la mission.",
    },
  ];

  const itemListLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Métiers freelance — monde francophone",
    itemListElement: INTL_SKILLS.map((s, i) => ({
      "@type": "ListItem",
      position: i + 1,
      name: SKILL_FR[s.slug]?.label || s.label,
      url: `${SITE_URL}/ai/monde/${s.slug}`,
    })),
  };

  return (
    <>
      <section className="relative overflow-hidden">
        <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 bottom-0 select-none" style={{ color: "var(--ai-accent)", opacity: 0.1 }}>
          <MonumentArt name="skyline-global" className="w-full h-[180px] sm:h-[260px]" strokeWidth={1.25} />
        </div>
        <div className="relative max-w-7xl mx-auto px-4 sm:px-6 pt-16 sm:pt-24 pb-16 sm:pb-20">
          <div className="flex items-center gap-3 mb-6">
            <span className="inline-block w-1.5 h-1.5 rounded-full bg-[var(--ai-accent)]" />
            <span className="text-[11px] font-semibold tracking-[0.2em] uppercase text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              Espace francophone
            </span>
          </div>
          <h1 className="font-black text-[var(--ai-text)] max-w-4xl" style={{ fontSize: "clamp(38px, 7vw, 80px)", lineHeight: 0.97, letterSpacing: "-0.04em" }}>
            Des freelances partout dans le monde francophone.
          </h1>
          <p className="mt-7 text-[17px] sm:text-[19px] leading-relaxed text-[var(--ai-text-secondary)] max-w-2xl">
            Belgique, Suisse, Luxembourg, Québec, Maghreb, Afrique de l&apos;Ouest. Déposez votre projet, notre IA alerte les freelances qui correspondent. 0 commission, gratuit pour les clients.
          </p>
          <div className="mt-9 flex flex-col sm:flex-row gap-3">
            <Link href="/ai/deposer" className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors" style={{ boxShadow: "var(--ai-shadow-sm)" }}>
              Déposer un projet — gratuit
            </Link>
            <Link href="/ai/inscription" className="inline-flex items-center justify-center h-12 px-7 text-[15px] font-semibold rounded-full bg-[var(--ai-text)] hover:bg-[var(--ai-primary-hover)] text-white transition-colors">
              Je suis freelance — créer mon profil
            </Link>
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="font-black uppercase text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.99, letterSpacing: "-0.04em" }}>
            Tous les métiers
          </h2>
          <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
            {INTL_SKILLS.map((s) => {
              const fr = SKILL_FR[s.slug];
              return (
                <Link key={s.slug} href={`/ai/monde/${s.slug}`} className="rounded-2xl border border-[var(--ai-border-subtle)] bg-[var(--ai-bg)] p-6 hover:border-[var(--ai-border-strong)] transition-colors">
                  <h3 className="text-[16px] font-semibold text-[var(--ai-text)]">{fr?.label || s.label}</h3>
                  <p className="mt-1.5 text-[13px] text-[var(--ai-text-tertiary)]">Freelances {fr?.noun || s.noun}</p>
                </Link>
              );
            })}
          </div>
        </div>
      </section>

      <section className="border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-14 sm:py-20">
          <h2 className="font-black uppercase text-[var(--ai-text)] mb-8" style={{ fontSize: "clamp(26px, 4.5vw, 44px)", lineHeight: 0.99, letterSpacing: "-0.04em" }}>
            Villes couvertes
          </h2>
          <ul className="flex flex-wrap gap-2">
            {FR_CITIES.map((c) => (
              <li key={c.slug}>
                <Link href={`/ai/monde/web-development/${c.slug}`} className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--ai-border-subtle)] bg-[var(--ai-bg-card)] text-[13px] text-[var(--ai-text-secondary)] hover:border-[var(--ai-border-strong)] hover:text-[var(--ai-text)] transition-colors">
                  {c.name} <span className="text-[var(--ai-text-tertiary)] ml-1.5">· {c.country}</span>
                </Link>
              </li>
            ))}
          </ul>
        </div>
      </section>

      <AiFaqSection id="faq" title="FAQ" subtitle="Recruter des freelances dans l'espace francophone." questions={faq} sectionLabel="FAQ" />

      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListLd) }} />
    </>
  );
}

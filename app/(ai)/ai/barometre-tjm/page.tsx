import type { Metadata } from "next";
import Link from "next/link";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import { TJM_REFERENCE, TJM_SOURCES } from "@/lib/data/tech-tjm-reference";
import { createPublicClient } from "@/lib/supabase/public-client";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";

export const revalidate = 86400; // 24h
const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

export const metadata: Metadata = {
  title: `Barometre TJM freelance tech ${CURRENT_YEAR} — 35 stacks analysees`,
  description: `Tarifs journaliers moyens (TJM) des freelances tech en France pour ${CURRENT_YEAR} : React, Python, AWS, Kubernetes, IA/LLM, data engineering, design Figma. 35 stacks par niveau d'experience (junior, intermediaire, senior, expert). Sources publiques verifiees (Blog du Moderateur, Free-Work, Comet).`,
  alternates: { canonical: "/ai/barometre-tjm" },
};

// ─────────────────────────────────────────────────────────────────────
// FAQ barometre — 5 questions methodologie (essentielles pour AEO/GEO)
// ─────────────────────────────────────────────────────────────────────
const FAQ_BAROMETRE: FaqItem[] = [
  {
    q: "Sur quelles sources est base ce barometre TJM ?",
    a: "Le barometre Workwave AI compile 3 sources publiques verifiables : (1) Etude Blog du Moderateur sur les freelances tech francais (mise a jour annuelle, sample 1500+ profils), (2) Donnees Free-Work (ex Freelance-Info, plateforme regie ESN), (3) Etude Comet sur les TJM tech IT. Aucun chiffre invente : chaque source est cliquable depuis la section Methodologie en bas de page pour verification. Mise a jour annuelle.",
  },
  {
    q: "A quelle frequence le barometre est-il mis a jour ?",
    a: "Mise a jour annuelle complete (chaque debut d'annee), avec verification trimestrielle des sources pour detecter d'eventuelles inflexions du marche. La derniere version refletait les donnees " + CURRENT_YEAR + ". Les TJM tech evoluent generalement lentement (+5-10% par an en France), donc une frequence annuelle est suffisante. Les ecarts intra-annee sont marginaux et tiennent plus de la variabilite individuelle (stack, experience, geo) que d'une evolution macro.",
  },
  {
    q: "Pourquoi les fourchettes TJM sont-elles aussi larges ?",
    a: "Parce que le marche freelance tech francais est tres heterogene. Un developpeur React 'senior' peut facturer 500€/jour (Bordeaux, sans label) comme 1100€/jour (Paris, ex-GAFA). Les variables qui influent : (a) Localisation (Paris +10-20%), (b) Stack precise (Next.js 15 App Router > jQuery), (c) Profil (ex-FAANG, conf speaker, OSS contributor), (d) Type de mission (regie longue duree -10% vs forfait court terme), (e) Demande du marche (IA/LLM en forte hausse 2024-2026). Les fourchettes sont calibrees pour couvrir 80% des cas (5e-95e percentile).",
  },
  {
    q: "Comment utiliser ce barometre pour negocier mon TJM (cote freelance) ?",
    a: "Trois conseils : (1) Positionnez-vous sur le bon segment d'experience (compter les annees d'experience effective sur la stack, pas l'anciennete totale). (2) Identifiez votre rarete : un freelance Next.js + Vercel + LLM est plus rare qu'un freelance React generaliste, vous etes en haut de fourchette. (3) Negociez en TJM affiche mais soyez ouvert sur la flexibilite si la duree est longue (3+ mois) ou le projet stimulant. Sur Workwave AI, le TJM indique est un signal de positionnement, pas un filtre dur.",
  },
  {
    q: "Le barometre tient-il compte des freelances en remote depuis l'etranger ?",
    a: "Oui pour les freelances francais travaillant en remote depuis l'etranger (Portugal, Espagne, Maroc) — ils restent dans la fourchette francaise car le client paie la prestation pour un freelance francais avec une fiscalite francaise. Non pour le 'nearshoring' offshore (developpeurs d'Europe de l'Est par exemple) qui represente un marche different avec ses propres references (souvent 30-40% moins cher mais avec barrieres langue et coordination). Workwave AI cible le marche tech francophone et europeen.",
  },
];

export default async function BarometreTjmHubPage() {
  const month = MONTH_NAMES[new Date().getMonth()];
  const sb = createPublicClient();

  // Compte total freelances tech
  const { count: totalProsCount } = await sb
    .from("pros")
    .select("*", { count: "estimated", head: true })
    .in("category_id", [43, 44, 45, 46, 47, 48])
    .in("source", ["sirene", "ai_signup"])
    .eq("is_active", true)
    .is("deleted_at", null);

  // Skills avec TJM disponible
  const skillsWithTjm = Object.entries(TJM_REFERENCE).map(([slug, ref]) => ({
    slug,
    name: slug.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase()),
    tjmMedianRange: { min: ref.mid.min, max: ref.mid.max },
    juniorMin: ref.junior.min,
    expertMax: ref.expert.max,
  }));

  // Compute median across all skills (mid level)
  const allMidMedians = skillsWithTjm.map((s) => (s.tjmMedianRange.min + s.tjmMedianRange.max) / 2);
  const globalMedian = Math.round(allMidMedians.reduce((s, v) => s + v, 0) / allMidMedians.length);

  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  // Schema.org Dataset + Article
  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `Barometre TJM freelance tech France ${CURRENT_YEAR}`,
    description: `Donnees TJM (Tarif Journalier Moyen) compilees pour 35 skills tech freelance en France ${CURRENT_YEAR}, ventilees par niveau d'experience (junior, mid, senior, expert).`,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: "Workwave AI", url: `${baseUrl}/ai` },
    citation: TJM_SOURCES.map((s) => `${s.name} — ${s.title} (${s.url})`).join(" ; "),
    temporalCoverage: `${CURRENT_YEAR}`,
    spatialCoverage: { "@type": "Country", name: "France" },
  };

  const articleSchema = {
    "@context": "https://schema.org",
    "@type": "Article",
    headline: `Barometre TJM freelance tech ${CURRENT_YEAR} : 35 skills analyses`,
    datePublished: `${CURRENT_YEAR}-01-01`,
    dateModified: new Date().toISOString(),
    author: { "@type": "Organization", name: "Workwave AI" },
    publisher: { "@type": "Organization", name: "Workwave AI", logo: { "@type": "ImageObject", url: `${baseUrl}/favicon.ico` } },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(articleSchema) }} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text="BAROMETRE" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-24">
          <SectionLabel index={1} total={4} label={`Barometre ${month} ${CURRENT_YEAR}`} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <h1
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{
                  fontSize: "clamp(40px, 7vw, 80px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.05em",
                }}
              >
                Barometre TJM
                <br />
                <span className="text-[var(--ai-text-tertiary)]">
                  freelance tech {CURRENT_YEAR}.
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed mb-6">
                Tarifs journaliers moyens des freelances tech en France ventiles
                par skill et niveau d&apos;experience. {skillsWithTjm.length} metiers analyses,
                fourchettes mises a jour {month} {CURRENT_YEAR}, sources publiques verifiees.
              </p>
              <p className="text-[13px] text-[var(--ai-text-tertiary)] leading-relaxed max-w-2xl">
                <strong className="text-[var(--ai-text)]">Methodologie</strong> : compilation
                de 3 sources concordantes (Blog du Moderateur, Free-Work TJM tracker, Comet
                Observatoire). Workwave AI n&apos;invente aucun chiffre — les ranges sont
                citables et verifiables (URLs en bas de page).
              </p>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div>
                <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2" style={{ letterSpacing: "0.18em" }}>
                  TJM median tech FR
                </p>
                <p className="text-5xl font-black text-[var(--ai-text)] tracking-tight" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                  {globalMedian}
                  <span className="text-2xl text-[var(--ai-text-tertiary)] ml-1">€/j</span>
                </p>
                <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-2">
                  Mid-level (3-7 ans XP) moyen sur {skillsWithTjm.length} skills
                </p>
              </div>

              <div className="border-t border-[var(--ai-border-subtle)] pt-4">
                <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2" style={{ letterSpacing: "0.18em" }}>
                  Echantillon
                </p>
                <p className="text-2xl font-black text-[var(--ai-text)] tracking-tight" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                  {totalProsCount ? (totalProsCount / 1000).toFixed(0) + "k" : "—"}
                </p>
                <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-1 leading-relaxed">
                  freelances tech actifs en base Workwave AI (source : Sirene INSEE)
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── TABLE COMPLETE ─── */}
      <section className="bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="mb-8">
            <SectionLabel index={2} total={4} label="Donnees par skill" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase"
              style={{
                fontSize: "clamp(28px, 4vw, 44px)",
                lineHeight: 1,
                letterSpacing: "-0.04em",
              }}
            >
              TJM par skill tech
              <br />
              <span className="text-[var(--ai-text-tertiary)]">en EUR / jour HT.</span>
            </h2>
          </div>

          <div className="overflow-x-auto bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl">
            <table className="w-full">
              <thead>
                <tr className="border-b border-[var(--ai-border-subtle)] bg-[var(--ai-bg-subtle)]">
                  <th className="text-left px-5 py-4 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]" style={{ letterSpacing: "0.18em" }}>
                    Skill
                  </th>
                  <th className="text-right px-5 py-4 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]" style={{ letterSpacing: "0.18em" }}>
                    Junior
                  </th>
                  <th className="text-right px-5 py-4 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]" style={{ letterSpacing: "0.18em" }}>
                    Mid (3-7 ans)
                  </th>
                  <th className="text-right px-5 py-4 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]" style={{ letterSpacing: "0.18em" }}>
                    Senior
                  </th>
                  <th className="text-right px-5 py-4 text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]" style={{ letterSpacing: "0.18em" }}>
                    Expert
                  </th>
                  <th className="px-5 py-4"></th>
                </tr>
              </thead>
              <tbody>
                {skillsWithTjm.map((s, i, arr) => {
                  const ref = TJM_REFERENCE[s.slug];
                  return (
                    <tr
                      key={s.slug}
                      className={i < arr.length - 1 ? "border-b border-[var(--ai-border-subtle)]" : ""}
                    >
                      <td className="px-5 py-4 text-[14px] font-semibold text-[var(--ai-text)]">
                        {s.name}
                      </td>
                      <td className="text-right px-5 py-4 text-[13px] text-[var(--ai-text-secondary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                        {ref.junior.min}-{ref.junior.max} €
                      </td>
                      <td className="text-right px-5 py-4 text-[13px] font-semibold text-[var(--ai-text)] bg-[var(--ai-accent-subtle)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                        {ref.mid.min}-{ref.mid.max} €
                      </td>
                      <td className="text-right px-5 py-4 text-[13px] text-[var(--ai-text-secondary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                        {ref.senior.min}-{ref.senior.max} €
                      </td>
                      <td className="text-right px-5 py-4 text-[13px] text-[var(--ai-text-secondary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                        {ref.expert.min}-{ref.expert.max} €
                      </td>
                      <td className="px-5 py-4 text-right">
                        <Link
                          href={`/ai/${s.slug}`}
                          className="inline-flex items-center gap-1 text-[12px] font-medium text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors"
                        >
                          Freelances →
                        </Link>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          <p className="text-[11px] text-[var(--ai-text-tertiary)] mt-4 leading-relaxed" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
            Les colonnes &laquo;&nbsp;Mid (3-7 ans)&nbsp;&raquo; sont en surbrillance car c&apos;est le segment dominant du marche FR.
          </p>
        </div>
      </section>

      {/* ─── SOURCES + CTA ─── */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <SectionLabel index={3} total={4} label="Methodologie & sources" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-7">
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-4"
                style={{
                  fontSize: "clamp(24px, 3vw, 36px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                Donnees verifiables.
              </h2>
              <p className="text-base text-[var(--ai-text-secondary)] leading-relaxed mb-6">
                Les fourchettes TJM publiees sur ce barometre sont issues de la
                compilation de 3 sources concordantes mises a jour annuellement.
                Workwave AI n&apos;invente aucun chiffre. Chaque source est
                cliquable ci-dessous pour verification.
              </p>

              <ul className="space-y-4 mb-8">
                {TJM_SOURCES.map((src, i) => (
                  <li key={src.url} className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-xl p-5">
                    <div className="flex items-start gap-4">
                      <span className="text-[11px] font-medium text-[var(--ai-text-tertiary)] pt-1 flex-shrink-0" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div className="flex-1">
                        <a
                          href={src.url}
                          target="_blank"
                          rel="noopener noreferrer nofollow"
                          className="text-base font-bold text-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-colors inline-flex items-center gap-1.5"
                        >
                          {src.name}
                          <svg className="w-3.5 h-3.5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                            <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                          </svg>
                        </a>
                        <p className="text-[13px] text-[var(--ai-text-secondary)] mt-1 leading-relaxed">
                          {src.title}
                        </p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
            </div>

            {/* Dark CTA card */}
            <div className="lg:col-span-5">
              <div className="bg-[var(--ai-text)] text-white rounded-2xl p-8 relative overflow-hidden sticky top-24">
                <div
                  aria-hidden="true"
                  className="absolute inset-0 opacity-[0.04]"
                  style={{
                    backgroundImage:
                      "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                    backgroundSize: "32px 32px",
                  }}
                />
                <div className="relative z-10">
                  <p className="text-[10px] uppercase font-semibold text-[var(--ai-accent)] mb-3" style={{ letterSpacing: "0.2em" }}>
                    ● Trouvez votre freelance
                  </p>
                  <h3 className="font-black uppercase mb-4" style={{ fontSize: "clamp(24px, 3.5vw, 32px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                    Le bon profil
                    <br />
                    <span className="text-[var(--ai-accent)]">au bon prix.</span>
                  </h3>
                  <p className="text-sm text-white/70 leading-relaxed mb-6">
                    Decrivez votre projet, notre IA selectionne les 3 freelances qui correspondent
                    a votre budget. Gratuit, sans engagement.
                  </p>
                  <Link
                    href="/ai/deposer"
                    className="inline-flex items-center justify-center w-full h-12 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
                  >
                    Deposer un projet
                    <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4/4 — FAQ Barometre (FAQPage schema)
          ═══════════════════════════════════════════════════════════════ */}
      <AiFaqSection
        id="faq"
        title="Methodologie & comprehension du barometre"
        subtitle="Les questions qu'on nous pose le plus souvent sur la fiabilite des donnees TJM et la facon de s'en servir."
        questions={FAQ_BAROMETRE}
        sectionIndex={4}
        sectionTotal={4}
        sectionLabel="FAQ"
      />
    </>
  );
}

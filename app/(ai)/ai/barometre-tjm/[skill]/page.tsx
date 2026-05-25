import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import { TJM_REFERENCE, TJM_SOURCES, getTjmReference } from "@/lib/data/tech-tjm-reference";
import { TECH_CITIES } from "@/lib/data/tech-cities";
import { createPublicClient } from "@/lib/supabase/public-client";

export const revalidate = 86400; // 24h
const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES = ["janvier", "fevrier", "mars", "avril", "mai", "juin", "juillet", "aout", "septembre", "octobre", "novembre", "decembre"];

type Props = { params: Promise<{ skill: string }> };

// generateStaticParams : 1 page par skill avec TJM ref dispo
export async function generateStaticParams() {
  return Object.keys(TJM_REFERENCE).map((slug) => ({ skill: slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill } = await params;
  const ref = getTjmReference(skill);
  if (!ref) return { title: "Skill introuvable — Workwave AI" };
  const month = MONTH_NAMES[new Date().getMonth()];
  const skillName = skill.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  return {
    title: `TJM freelance ${skillName} en ${month} ${CURRENT_YEAR} — Barometre Workwave AI`,
    description: `Tarifs journaliers ${skillName} freelance France ${CURRENT_YEAR} : junior ${ref.junior.min}-${ref.junior.max}€, mid ${ref.mid.min}-${ref.mid.max}€, senior ${ref.senior.min}-${ref.senior.max}€. Sources publiques.`,
    alternates: { canonical: `/ai/barometre-tjm/${skill}` },
  };
}

export default async function BarometreSkillPage({ params }: Props) {
  const { skill } = await params;
  const ref = getTjmReference(skill);
  if (!ref) notFound();

  const sb = createPublicClient();
  const { data: category } = await sb.from("categories").select("id, slug, name, parent_category_id").eq("slug", skill).eq("vertical", "tech").maybeSingle();
  const skillName = category?.name || skill.replace(/-/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());

  // Count freelances pour ce skill
  let filterCategoryId = category?.id;
  if (category?.parent_category_id) filterCategoryId = category.parent_category_id;
  let proCount = 0;
  if (filterCategoryId) {
    const { count } = await sb.from("pros").select("*", { count: "estimated", head: true })
      .eq("category_id", filterCategoryId).eq("source", "sirene").eq("is_active", true).is("deleted_at", null);
    proCount = count || 0;
  }

  const month = MONTH_NAMES[new Date().getMonth()];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  // Cities snapshot (count par ville)
  const topCities = TECH_CITIES.slice(0, 12);

  const datasetSchema = {
    "@context": "https://schema.org",
    "@type": "Dataset",
    name: `TJM freelance ${skillName} France ${CURRENT_YEAR}`,
    description: `Tarif journalier moyen pour ${skillName} freelance en France, ventile junior/mid/senior/expert.`,
    license: "https://creativecommons.org/licenses/by/4.0/",
    creator: { "@type": "Organization", name: "Workwave AI", url: `${baseUrl}/ai` },
    citation: TJM_SOURCES.map((s) => `${s.name} (${s.url})`).join(" ; "),
    temporalCoverage: `${CURRENT_YEAR}`,
    spatialCoverage: { "@type": "Country", name: "France" },
    variableMeasured: ["TJM junior", "TJM mid", "TJM senior", "TJM expert"],
  };

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Quel est le TJM d'un freelance ${skillName} en ${CURRENT_YEAR} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Le TJM d'un freelance ${skillName} en France varie de ${ref.junior.min}€ pour un junior debutant a ${ref.expert.max}€ pour un expert. La fourchette mediane (mid-level, 3-7 ans d'experience) se situe entre ${ref.mid.min}€ et ${ref.mid.max}€ par jour. Sources : Blog du Moderateur ${CURRENT_YEAR}, Free-Work TJM tracker, Comet Observatoire.`,
        },
      },
      {
        "@type": "Question",
        name: `Combien gagne un freelance ${skillName} senior ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Un freelance ${skillName} senior (7-10 ans d'experience) facture en moyenne entre ${ref.senior.min}€ et ${ref.senior.max}€ par jour en France ${CURRENT_YEAR}. Au-dela de 10 ans (profil expert), les TJM peuvent atteindre ${ref.expert.max}€ et plus selon la rarete de la stack et le contexte du projet.`,
        },
      },
      {
        "@type": "Question",
        name: `Comment se positionner sur son TJM en tant que freelance ${skillName} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Le TJM depend de votre experience, votre stack technique, votre localisation (Paris generalement +10-20%), la complexite du projet (refonte simple vs architecture distribuee) et la duree de la mission (>3 mois = TJM negocie). Workwave AI permet aux clients de specifier leur budget pour selectionner les freelances avec le bon profil + tarif.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(datasetSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text={`TJM.${skill.toUpperCase()}`} position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)] mb-6">
            <Link href="/ai" className="hover:text-[var(--ai-text)]">Workwave AI</Link>
            <span>/</span>
            <Link href="/ai/barometre-tjm" className="hover:text-[var(--ai-text)]">Barometre TJM</Link>
            <span>/</span>
            <span className="text-[var(--ai-text)]">{skillName}</span>
          </nav>

          <SectionLabel index={1} total={3} label={`Barometre ${month} ${CURRENT_YEAR}`} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <h1
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{ fontSize: "clamp(36px, 6vw, 64px)", lineHeight: 0.95, letterSpacing: "-0.05em" }}
              >
                TJM freelance
                <br />
                <span className="text-[var(--ai-text-tertiary)]">{skillName} {CURRENT_YEAR}.</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
                Tarif Journalier Moyen pour un freelance {skillName} en France {CURRENT_YEAR},
                ventile par niveau d&apos;experience. Donnees compilees de 3 sources publiques.
              </p>
            </div>

            <div className="lg:col-span-4">
              <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2" style={{ letterSpacing: "0.18em" }}>
                TJM median (mid-level)
              </p>
              <p className="text-5xl font-black text-[var(--ai-text)] tracking-tight" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                {ref.mid.min}-{ref.mid.max}
                <span className="text-xl text-[var(--ai-text-tertiary)] ml-1">€/j</span>
              </p>
              <p className="text-[12px] text-[var(--ai-text-tertiary)] mt-2">
                3-7 ans d&apos;experience
              </p>
              {proCount > 0 && (
                <p className="text-[12px] text-[var(--ai-text-secondary)] mt-4 pt-4 border-t border-[var(--ai-border-subtle)]">
                  {proCount.toLocaleString("fr-FR")} freelances {skillName} en base
                </p>
              )}
            </div>
          </div>
        </div>
      </section>

      {/* ─── TJM BY LEVEL CARDS ─── */}
      <section className="bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <SectionLabel index={2} total={3} label="TJM par niveau" />

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-12">
            {[
              { level: "Junior", subLabel: "0-3 ans", range: ref.junior, accent: false },
              { level: "Mid-level", subLabel: "3-7 ans", range: ref.mid, accent: true },
              { level: "Senior", subLabel: "7-10 ans", range: ref.senior, accent: false },
              { level: "Expert", subLabel: "10+ ans", range: ref.expert, accent: false },
            ].map((row) => (
              <div
                key={row.level}
                className={`p-6 rounded-2xl border ${
                  row.accent
                    ? "bg-[var(--ai-text)] text-white border-[var(--ai-text)]"
                    : "bg-[var(--ai-bg-card)] border-[var(--ai-border-subtle)]"
                }`}
              >
                <p className={`text-[11px] uppercase font-semibold mb-2 ${row.accent ? "text-[var(--ai-accent)]" : "text-[var(--ai-text-tertiary)]"}`} style={{ letterSpacing: "0.18em" }}>
                  {row.level}
                </p>
                <p className={`text-[12px] mb-4 ${row.accent ? "text-white/60" : "text-[var(--ai-text-tertiary)]"}`}>
                  {row.subLabel}
                </p>
                <p className={`text-3xl font-black tracking-tight ${row.accent ? "" : "text-[var(--ai-text)]"}`} style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                  {row.range.min}-{row.range.max}
                </p>
                <p className={`text-[12px] mt-1 ${row.accent ? "text-white/60" : "text-[var(--ai-text-tertiary)]"}`}>
                  euros / jour HT
                </p>
              </div>
            ))}
          </div>

          {/* CTA freelances + ville cross-links */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
            <Link
              href={`/ai/${skill}`}
              className="group bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 hover:border-[var(--ai-text)] transition-all"
            >
              <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2" style={{ letterSpacing: "0.18em" }}>
                Freelances disponibles
              </p>
              <p className="text-2xl font-black text-[var(--ai-text)] tracking-tight">
                Voir les profils {skillName} →
              </p>
              <p className="text-[13px] text-[var(--ai-text-secondary)] mt-2">
                {proCount > 0 ? `${proCount.toLocaleString("fr-FR")} freelances en base` : "Decouvrir nos freelances"}
              </p>
            </Link>

            <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6">
              <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3" style={{ letterSpacing: "0.18em" }}>
                Top villes pour ce skill
              </p>
              <div className="flex flex-wrap gap-2">
                {topCities.slice(0, 8).map((c) => (
                  <Link
                    key={c.slug}
                    href={`/ai/${skill}/${c.slug}`}
                    className="px-3 py-1.5 text-[12px] font-medium bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-md text-[var(--ai-text-secondary)] hover:border-[var(--ai-text)] hover:text-[var(--ai-text)] transition-all"
                  >
                    {c.name}
                  </Link>
                ))}
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── SOURCES + FAQ + AUTRES SKILLS ─── */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <SectionLabel index={3} total={3} label="Sources & FAQ" />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 mb-12">
            <div className="lg:col-span-7">
              <h2 className="font-black text-[var(--ai-text)] uppercase mb-6" style={{ fontSize: "clamp(24px, 3vw, 36px)", lineHeight: 1, letterSpacing: "-0.04em" }}>
                Questions frequentes.
              </h2>
              <ul className="space-y-3">
                {faqSchema.mainEntity.map((q, i) => (
                  <li key={q.name} className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl">
                    <details className="group">
                      <summary className="flex items-start gap-4 p-5 cursor-pointer list-none">
                        <span className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)] pt-1 flex-shrink-0" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-[15px] font-semibold text-[var(--ai-text)] leading-snug">{q.name}</span>
                        <svg className="w-5 h-5 mt-1 text-[var(--ai-text-tertiary)] flex-shrink-0 transition-transform group-open:rotate-45" viewBox="0 0 24 24" fill="none">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </summary>
                      <p className="px-5 pb-5 pl-[60px] text-[13px] text-[var(--ai-text-secondary)] leading-relaxed">
                        {q.acceptedAnswer.text}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </div>

            <div className="lg:col-span-5">
              <h3 className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4" style={{ letterSpacing: "0.18em" }}>
                Sources verifiees
              </h3>
              <ul className="space-y-3 mb-8">
                {TJM_SOURCES.map((src, i) => (
                  <li key={src.url} className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-xl p-4">
                    <div className="flex items-start gap-3">
                      <span className="text-[11px] font-medium text-[var(--ai-text-tertiary)] pt-0.5" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                        {String(i + 1).padStart(2, "0")}
                      </span>
                      <div>
                        <a href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="text-[14px] font-bold text-[var(--ai-text)] hover:text-[var(--ai-accent)] inline-flex items-center gap-1">
                          {src.name}
                          <svg className="w-3 h-3" viewBox="0 0 24 24" fill="none"><path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" /></svg>
                        </a>
                        <p className="text-[12px] text-[var(--ai-text-secondary)] mt-1">{src.title}</p>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>

              <Link href="/ai/barometre-tjm" className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-text)] hover:text-[var(--ai-accent)]">
                Voir tous les skills tech →
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

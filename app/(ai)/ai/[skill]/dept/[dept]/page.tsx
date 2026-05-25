import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public-client";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import {
  TECH_DEPARTMENTS,
  findDepartmentByCode,
} from "@/lib/data/tech-departments";
import {
  getTjmReference,
  TJM_SOURCES,
} from "@/lib/data/tech-tjm-reference";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";

const SITE_URL = "https://workwave.fr";

// ─── FAQ dynamique par skill × departement ─────────────────────────────
function buildDeptFaq(
  category: { name: string },
  department: { name: string; region: string; code: string },
  proCount: number
): FaqItem[] {
  const skillName = category.name;
  const skillLower = skillName.toLowerCase();
  const deptName = department.name;
  return [
    {
      q: `Combien y a-t-il de freelances ${skillName} en ${deptName} ?`,
      a: `Notre annuaire compte ${proCount > 0 ? proCount.toLocaleString("fr-FR") : "plusieurs dizaines de"} freelances ${skillLower} actifs dans le departement de ${deptName} (${department.code}), enregistres a l'INSEE avec un SIRET valide. Le ${deptName} fait partie de la region ${department.region}, l'un des marches tech les plus actifs de France. Note : la plupart des freelances ${skillLower} travaillent en 100% remote, vous n'etes donc pas limite a ${deptName}.`,
    },
    {
      q: `Quel TJM pratiquent les freelances ${skillName} en ${deptName} ?`,
      a: `Les TJM des freelances ${skillLower} en ${deptName} sont alignes sur les moyennes nationales (donnees Blog du Moderateur, Free-Work, Comet 2026) : junior 350-500€/jour, intermediaire 500-700€/jour, senior 600-900€/jour, expert 800-1200€/jour et plus. Le ${deptName} ne presente pas de surcout significatif (contrairement a Paris ou les TJM montent de +10-20%). Negociation possible selon la duree de la mission et la stack precise.`,
    },
    {
      q: `Faut-il un freelance base en ${deptName} pour mon projet ?`,
      a: `Pas necessairement. 80% des missions ${skillLower} se realisent en 100% remote : votre freelance peut etre base partout en France (Paris, Lyon, Bordeaux) ou en Europe. Si vous avez besoin de presentiel ponctuel (kickoff, rituels equipe, ateliers), un freelance ${deptName} ou region voisine ${department.region} est ideal. Notre formulaire de depot permet de specifier votre contrainte geographique.`,
    },
    {
      q: `Comment trouver rapidement un freelance ${skillName} en ${deptName} ?`,
      a: `Deposez votre projet sur Workwave AI en 60 secondes : decrivez votre besoin, votre stack, votre budget, votre delai. Notre IA selectionne automatiquement les 3 freelances ${skillLower} les plus pertinents (en ${deptName}, en remote, ou dans la region ${department.region} selon vos contraintes) en moins de 24h. Aucune commission, gratuit cote client, les freelances vous contactent directement.`,
    },
  ];
}

export const revalidate = 21600;
export const dynamicParams = true; // pages non pre-buildees rendues a la demande
const TECH_VERTICAL = "tech";
const CURRENT_YEAR = new Date().getFullYear();
const MONTH_NAMES = [
  "janvier", "fevrier", "mars", "avril", "mai", "juin",
  "juillet", "aout", "septembre", "octobre", "novembre", "decembre",
];

type Props = {
  params: Promise<{ skill: string; dept: string }>;
};

// ─── Pas de generateStaticParams : tout dynamic on-demand via ISR.
// Anti-OOM build Vercel (commit precedent crashait avec 13920 pages SSG).

// ─── Metadata ──────────────────────────────────────────────────────────────
export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { skill, dept } = await params;
  const department = findDepartmentByCode(dept);
  if (!department) return { title: "Page introuvable — Workwave AI" };

  const sb = createPublicClient();
  const { data: category } = await sb
    .from("categories")
    .select("name, slug")
    .eq("slug", skill)
    .eq("vertical", TECH_VERTICAL)
    .maybeSingle();
  if (!category) return { title: "Page introuvable — Workwave AI" };

  const month = MONTH_NAMES[new Date().getMonth()];
  const title = `Freelances ${category.name} dans le ${department.name} (${department.code}) en ${month} ${CURRENT_YEAR}`;
  const description = `Trouvez le freelance ${category.name.toLowerCase()} ideal dans le departement ${department.name} (${department.code}). Matching IA en moins de 24h, gratuit, sans credit.`;

  return {
    title,
    description,
    alternates: { canonical: `/ai/${category.slug}/dept/${department.code}` },
    openGraph: { title, description, url: `/ai/${category.slug}/dept/${department.code}`, type: "website" },
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function titleCase(name: string): string {
  return name.toLowerCase().split(/\s+/).map((w) => {
    if (["de", "du", "des", "la", "le", "les", "el", "y", "et"].includes(w)) return w;
    if (w.includes("-")) {
      return w.split("-").map((p) => p.charAt(0).toUpperCase() + p.slice(1)).join("-");
    }
    return w.charAt(0).toUpperCase() + w.slice(1);
  }).join(" ");
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function SkillDeptPage({ params }: Props) {
  const { skill, dept } = await params;
  const department = findDepartmentByCode(dept);
  if (!department) notFound();

  const sb = createPublicClient();
  const { data: category } = await sb
    .from("categories")
    .select("id, slug, name, description, parent_category_id")
    .eq("slug", skill)
    .eq("vertical", TECH_VERTICAL)
    .maybeSingle();
  if (!category) notFound();

  // Filter pros : skill (parent) ou macro direct
  const filterCategoryId = category.parent_category_id || category.id;

  // Top 15 pros du dept (LIKE postal_code prefix)
  const { data: pros, count } = await sb
    .from("pros")
    .select("id, name, slug, postal_code, years_experience, github_username", {
      count: "estimated",
    })
    .eq("category_id", filterCategoryId)
    .eq("source", "sirene")
    .eq("is_active", true)
    .is("deleted_at", null)
    .like("postal_code", `${department.code}%`)
    .order("github_username", { ascending: false, nullsFirst: false })
    .order("years_experience", { ascending: false, nullsFirst: false })
    .limit(15);

  const proList = pros || [];
  const totalCount = count || 0;

  // TJM ref (fallback parent macro si skill)
  let tjmRef = getTjmReference(category.slug);
  if (!tjmRef && category.parent_category_id) {
    const { data: parent } = await sb
      .from("categories")
      .select("slug")
      .eq("id", category.parent_category_id)
      .maybeSingle();
    if (parent) tjmRef = getTjmReference(parent.slug);
  }

  const month = MONTH_NAMES[new Date().getMonth()];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  // Schema.org
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Freelances ${category.name} dans le ${department.name}`,
    numberOfItems: proList.length,
    itemListElement: proList.map((pro, i) => ({
      "@type": "ListItem",
      position: i + 1,
      item: {
        "@type": "Person",
        name: titleCase(pro.name),
        url: `${baseUrl}/ai/freelance/${pro.slug}`,
      },
    })),
  };

  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Mise en relation freelance ${category.name} dans le ${department.name}`,
    provider: { "@type": "Organization", name: "Workwave AI", url: `${baseUrl}/ai` },
    areaServed: { "@type": "AdministrativeArea", name: `${department.name} (${department.code})` },
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />

      {/* ─── HERO ─── */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text={`DEPT.${department.code}`} position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <nav className="flex items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)] mb-6" aria-label="Fil d'Ariane">
            <Link href="/ai" className="hover:text-[var(--ai-text)] transition-colors">Workwave AI</Link>
            <span>/</span>
            <Link href={`/ai/${category.slug}`} className="hover:text-[var(--ai-text)] transition-colors">{category.name}</Link>
            <span>/</span>
            <span className="text-[var(--ai-text)]">Dept {department.code}</span>
          </nav>

          <SectionLabel index={1} total={4} label={`${department.region}`} />

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <h1
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{
                  fontSize: "clamp(36px, 6vw, 64px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.05em",
                }}
              >
                Freelances {category.name}
                <br />
                <span className="text-[var(--ai-text-tertiary)]">
                  dans le {department.name} ({department.code}).
                </span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed mb-8">
                {totalCount > 0 ? `${totalCount}+ freelances` : "Freelances"}{" "}
                {category.name.toLowerCase()} dans le departement {department.name}.
                Matching IA en moins de 24h, gratuit, sans credit.
              </p>
              <Link
                href="/ai/deposer"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
                style={{ boxShadow: "var(--ai-shadow-sm)" }}
              >
                Deposer un projet
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>

            <div className="lg:col-span-4 space-y-6">
              <div>
                <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-2" style={{ letterSpacing: "0.18em" }}>
                  Departement {department.code}
                </p>
                <p className="text-3xl font-black text-[var(--ai-text)] tracking-tight" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                  {department.population.toLocaleString("fr-FR")}
                </p>
                <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]" style={{ letterSpacing: "0.18em" }}>
                  habitants
                </p>
                <p className="text-[13px] text-[var(--ai-text-secondary)] mt-3 leading-relaxed">
                  Region : {department.region}
                </p>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ─── LISTING + TJM ─── */}
      <section className="bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-10">
            <div className="lg:col-span-8">
              <SectionLabel index={2} total={4} label={`Top ${proList.length || 15}`} />
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-8"
                style={{
                  fontSize: "clamp(24px, 3vw, 36px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                {proList.length || "Top"} freelances {category.name.toLowerCase()}
              </h2>

              {proList.length === 0 ? (
                <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-8 text-center">
                  <p className="text-base font-semibold text-[var(--ai-text)] mb-3">
                    Aucun freelance reference dans ce departement pour l&apos;instant.
                  </p>
                  <p className="text-sm text-[var(--ai-text-secondary)] mb-5">
                    Notre IA peut matcher avec des freelances voisins ou en remote.
                  </p>
                  <Link
                    href="/ai/deposer"
                    className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
                  >
                    Deposer un projet
                  </Link>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  {proList.map((pro, i) => (
                    <Link
                      key={pro.id}
                      href={`/ai/freelance/${pro.slug}`}
                      className="group bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-xl p-4 hover:border-[var(--ai-text)] transition-all"
                    >
                      <div className="flex items-start justify-between mb-2">
                        <span className="text-[11px] font-medium text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                          #{String(i + 1).padStart(2, "0")}
                        </span>
                        {pro.years_experience != null && pro.years_experience > 0 && (
                          <span className="text-[11px] text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                            {pro.years_experience} ans
                          </span>
                        )}
                      </div>
                      <h3 className="text-[14px] font-bold text-[var(--ai-text)] mb-1 tracking-tight">
                        {titleCase(pro.name)}
                      </h3>
                      <p className="text-[12px] text-[var(--ai-text-secondary)]">
                        {pro.postal_code || department.name}
                      </p>
                      {pro.github_username && (
                        <p className="text-[11px] text-[var(--ai-accent)] mt-1 font-medium" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                          @{pro.github_username}
                        </p>
                      )}
                    </Link>
                  ))}
                </div>
              )}
            </div>

            {/* TJM sidebar si dispo */}
            {tjmRef && (
              <aside className="lg:col-span-4">
                <SectionLabel index={3} total={4} label="Tarifs indicatifs" />
                <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl overflow-hidden mb-4">
                  {[
                    { level: "Junior", subLabel: "0-3 ans", range: tjmRef.junior },
                    { level: "Mid-level", subLabel: "3-7 ans", range: tjmRef.mid },
                    { level: "Senior", subLabel: "7-10 ans", range: tjmRef.senior },
                    { level: "Expert", subLabel: "10+ ans", range: tjmRef.expert },
                  ].map((row, i, arr) => (
                    <div
                      key={row.level}
                      className={`flex items-baseline justify-between px-4 py-3 ${i < arr.length - 1 ? "border-b border-[var(--ai-border-subtle)]" : ""}`}
                    >
                      <div>
                        <p className="text-[13px] font-semibold text-[var(--ai-text)]">{row.level}</p>
                        <p className="text-[10px] text-[var(--ai-text-tertiary)]">{row.subLabel}</p>
                      </div>
                      <p className="text-[13px] font-semibold text-[var(--ai-text)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                        {row.range.min}-{row.range.max} <span className="text-[10px] text-[var(--ai-text-tertiary)]">€/j</span>
                      </p>
                    </div>
                  ))}
                </div>
                <p className="text-[11px] text-[var(--ai-text-tertiary)] leading-relaxed" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                  Source : Blog du Moderateur, Free-Work, Comet
                </p>
              </aside>
            )}
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4/4 — FAQ dynamique skill x dept (FAQPage schema)
          ═══════════════════════════════════════════════════════════════ */}
      <AiFaqSection
        id="faq"
        title={`${category.name} en ${department.name}`}
        subtitle={`Tout savoir sur les freelances ${category.name.toLowerCase()} dans le ${department.name} (${department.code}).`}
        questions={buildDeptFaq(category, department, totalCount)}
        sectionIndex={4}
        sectionTotal={4}
        sectionLabel="FAQ"
      />

      {/* ─── AUTRES DEPTS DE LA REGION + SOURCES ─── */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12">
          <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4" style={{ letterSpacing: "0.18em" }}>
            Autres departements en {department.region}
          </p>
          <div className="flex flex-wrap gap-2 mb-10">
            {TECH_DEPARTMENTS.filter((d) => d.region === department.region && d.code !== department.code).slice(0, 8).map((d) => (
              <Link
                key={d.code}
                href={`/ai/${category.slug}/dept/${d.code}`}
                className="inline-flex items-center gap-2 px-4 py-2 bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-lg text-[13px] font-medium text-[var(--ai-text)] hover:border-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-all"
              >
                <span className="text-[var(--ai-text-tertiary)]" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
                  {d.code}
                </span>
                {d.name}
              </Link>
            ))}
          </div>

          <div className="border-t border-[var(--ai-border-subtle)] pt-6">
            <p className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3" style={{ fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.2em" }}>
              // Sources
            </p>
            <ul className="text-[12px] text-[var(--ai-text-secondary)] space-y-1.5 leading-relaxed">
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)]">→</span>
                Population departement : <a href="https://www.insee.fr/fr/statistiques/2012713" target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent)] ml-1">INSEE {CURRENT_YEAR}</a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-[var(--ai-accent)]">→</span>
                Profils freelances : <a href="https://www.data.gouv.fr/datasets/base-sirene-des-entreprises-et-de-leurs-etablissements-siren-siret/" target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent)] ml-1">Base Sirene INSEE</a>
              </li>
              {tjmRef && TJM_SOURCES.map((src) => (
                <li key={src.url} className="flex items-start gap-2">
                  <span className="text-[var(--ai-accent)]">→</span>
                  TJM : <a href={src.url} target="_blank" rel="noopener noreferrer nofollow" className="underline decoration-[var(--ai-border)] hover:text-[var(--ai-accent)] ml-1">{src.name} — {src.title}</a>
                </li>
              ))}
            </ul>
          </div>
        </div>
      </section>
    </>
  );
}

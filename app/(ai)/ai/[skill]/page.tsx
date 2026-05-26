import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public-client";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import { getAvatarStyle, getInitials } from "@/lib/ai/personalisation";

// ISR : revalide chaque 6h, la base evolue lentement
export const revalidate = 21600;

const PAGE_SIZE = 24;
const TECH_VERTICAL = "tech";

// ─── FAQ dynamique par categorie ───────────────────────────────────────────
function buildCategoryFaq(
  category: { name: string; slug: string },
  total: number
): FaqItem[] {
  const name = category.name;
  const nameLower = name.toLowerCase();
  return [
    {
      q: `Combien coute un freelance ${name} en France ?`,
      a: `Le TJM d'un freelance ${nameLower} varie selon son experience et sa stack precise. Selon notre barometre 2026 (verifie vs Blog du Moderateur, Free-Work, Comet) : profil junior 0-3 ans 350-500€/jour, intermediaire 3-7 ans 500-700€/jour, senior 7-10 ans 600-900€/jour, expert 10+ ans 800-1200€/jour et plus. Paris ajoute generalement +10-20%. Voir le detail TJM par technologie sur notre barometre.`,
    },
    {
      q: `Comment choisir le bon freelance ${name} pour mon projet ?`,
      a: `Trois criteres essentiels : (1) Expertise verifiable — demandez le portfolio, le GitHub, et des references clients. (2) Adequation au projet — un freelance senior sur React n'est pas forcement le meilleur sur Next.js 15 App Router. Verifiez la stack precise. (3) Disponibilite + budget aligne. Workwave AI fait ce travail pour vous : notre IA selectionne les 3 freelances ${nameLower} les plus pertinents en moins de 24h.`,
    },
    {
      q: `Les freelances ${name} travaillent-ils en remote ?`,
      a: `Oui, 80% des freelances ${nameLower} francais et europeens travaillent en 100% remote depuis 2020 (la norme dans la tech). 15% acceptent l'hybride (1-2 jours de presentiel client par semaine). 5% travaillent sur site uniquement. Vous precisez vos contraintes geographiques au depot du projet et l'IA filtre en consequence.`,
    },
    {
      q: `Quelle est la duree moyenne d'une mission ${name} ?`,
      a: `Les missions ${nameLower} sur Workwave AI varient entre 5 jours (intervention courte, fix, audit) et 12+ mois (regie longue duree). La duree mediane se situe autour de 3 mois pour les projets de developpement, 1-2 mois pour les missions d'audit / refactoring / migration. Les freelances acceptent generalement des missions a partir de 5 jours (au-dela ils preferent un contrat de plus long terme).`,
    },
    {
      q: `Combien y a-t-il de freelances ${name} sur Workwave AI ?`,
      a: `Notre annuaire compte ${total > 0 ? total.toLocaleString("fr-FR") : "des centaines de"} freelances ${nameLower} actifs en France et en Europe, tous enregistres a l'INSEE avec un SIRET valide. La base est mise a jour quotidiennement via la base Sirene officielle. Chaque freelance peut reclamer sa fiche pour la completer (bio, stack, TJM, portfolio).`,
    },
  ];
}

type SkillPageProps = {
  params: Promise<{ skill: string }>;
  searchParams: Promise<{ page?: string }>;
};

// ─── SEO metadata ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }: SkillPageProps): Promise<Metadata> {
  const { skill } = await params;
  const sb = createPublicClient();
  const { data: category } = await sb
    .from("categories")
    .select("name, description, slug")
    .eq("slug", skill)
    .eq("vertical", TECH_VERTICAL)
    .maybeSingle();

  if (!category) {
    return { title: "Categorie introuvable — Workwave AI" };
  }

  return {
    title: `Freelances ${category.name} — Workwave AI`,
    description:
      category.description ||
      `Trouvez le freelance ${category.name} ideal sur Workwave AI. Matching par IA en moins de 24h, gratuit, sans credit.`,
    alternates: { canonical: `/ai/${category.slug}` },
    openGraph: {
      title: `Freelances ${category.name} — Workwave AI`,
      description: category.description || undefined,
      url: `/ai/${category.slug}`,
      type: "website",
    },
  };
}

// ─── Helpers ───────────────────────────────────────────────────────────────
function titleCase(name: string): string {
  return name
    .toLowerCase()
    .split(/\s+/)
    .map((w) => {
      // Garde les particules en lower : de, du, des, la, le, etc.
      if (["de", "du", "des", "la", "le", "les", "el", "y", "et"].includes(w))
        return w;
      // Compose : Jean-Paul, Marie-Helene
      if (w.includes("-")) {
        return w
          .split("-")
          .map((p) => p.charAt(0).toUpperCase() + p.slice(1))
          .join("-");
      }
      return w.charAt(0).toUpperCase() + w.slice(1);
    })
    .join(" ");
}

function buildPaginationHref(skill: string, page: number) {
  return page === 1 ? `/ai/${skill}` : `/ai/${skill}?page=${page}`;
}

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function SkillPage({ params, searchParams }: SkillPageProps) {
  const { skill } = await params;
  const sp = await searchParams;
  const page = Math.max(1, parseInt(sp.page || "1", 10) || 1);
  const offset = (page - 1) * PAGE_SIZE;

  const sb = createPublicClient();

  // 1. Charge la categorie (peut etre une macro ou un skill avec parent)
  const { data: category } = await sb
    .from("categories")
    .select("id, slug, name, description, seo_keywords, parent_category_id")
    .eq("slug", skill)
    .eq("vertical", TECH_VERTICAL)
    .maybeSingle();

  if (!category) notFound();

  // Si la categorie a un parent_category_id, c'est un skill (ex. react).
  // On filtre les pros par le category_id du parent (= macro categorie).
  // Sinon (macro), on filtre directement par son category_id.
  const filterCategoryId = category.parent_category_id || category.id;

  // 2. Count + liste des pros (estimated count pour speed)
  const { data: pros, count } = await sb
    .from("pros")
    .select("id, name, slug, postal_code, address, years_experience, github_username, avatar_color, cities(name, slug, department_id)", {
      count: "estimated",
    })
    .eq("category_id", filterCategoryId)
    .in("source", ["sirene", "ai_signup"])
    .eq("is_active", true)
    .is("deleted_at", null)
    .order("github_username", { ascending: false, nullsFirst: false })
    .order("years_experience", { ascending: false, nullsFirst: false })
    .order("id", { ascending: true })
    .range(offset, offset + PAGE_SIZE - 1);

  const totalCount = count || 0;
  const totalPages = Math.max(1, Math.ceil(totalCount / PAGE_SIZE));
  const proList = pros || [];

  // 3. Schema.org ItemList
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Freelances ${category.name} — Workwave AI`,
    description: category.description || undefined,
    numberOfItems: totalCount,
    itemListElement: proList.map((pro, i) => ({
      "@type": "ListItem",
      position: offset + i + 1,
      item: {
        "@type": "Person",
        name: titleCase(pro.name),
        url: `${baseUrl}/ai/freelance/${pro.slug}`,
      },
    })),
  };

  return (
    <>
      {/* JSON-LD Schema.org ItemList */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1/3 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text={category.slug.toUpperCase().replace(/-/g, ".")} position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-end">
            <div className="lg:col-span-8">
              <SectionLabel index={1} total={4} label="Freelances tech" />

              {/* Breadcrumb minimal */}
              <nav className="flex items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)] mb-6" aria-label="Fil d'Ariane">
                <Link href="/ai" className="hover:text-[var(--ai-text)] transition-colors">
                  Workwave AI
                </Link>
                <span>/</span>
                <Link href="/ai/freelances" className="hover:text-[var(--ai-text)] transition-colors">
                  Freelances
                </Link>
                <span>/</span>
                <span className="text-[var(--ai-text)]">{category.name}</span>
              </nav>

              <h1
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{
                  fontSize: "clamp(40px, 7vw, 80px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.05em",
                }}
              >
                Freelances
                <br />
                <span className="text-[var(--ai-text-tertiary)]">
                  {category.name}.
                </span>
              </h1>

              {category.description && (
                <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
                  {category.description}
                </p>
              )}
            </div>

            {/* Stat block droite */}
            <div className="lg:col-span-4 lg:pb-4">
              <div className="flex items-baseline gap-3 mb-2">
                <svg
                  className="w-6 h-6 text-[var(--ai-accent)] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  style={{ transform: "translateY(2px)" }}
                >
                  <path
                    d="M7 17L17 7M17 7H9M17 7V15"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span
                  className="text-4xl sm:text-5xl font-black text-[var(--ai-text)] tracking-tight"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {totalCount >= 1000
                    ? (totalCount / 1000).toFixed(1).replace(".0", "") + "k"
                    : totalCount}
                </span>
              </div>
              <p
                className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                style={{ letterSpacing: "0.18em" }}
              >
                Freelances disponibles
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2/3 — LISTING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-8">
            <SectionLabel index={2} total={4} label="Profils" />
            <p className="text-[12px] text-[var(--ai-text-tertiary)] font-medium" style={{ fontFamily: "var(--font-geist-mono), monospace" }}>
              Page {page} / {totalPages}
            </p>
          </div>

          {proList.length === 0 ? (
            <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-12 text-center">
              <p className="text-lg font-semibold text-[var(--ai-text)] mb-3">
                Aucun freelance dans cette categorie pour l&apos;instant.
              </p>
              <p className="text-sm text-[var(--ai-text-secondary)] mb-6">
                On enrichit la base progressivement. En attendant, vous pouvez
                deposer un projet — notre IA matchera avec les profils
                disponibles dans les autres categories proches.
              </p>
              <Link
                href="/ai/deposer"
                className="inline-flex items-center justify-center h-11 px-6 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
              >
                Deposer un projet
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {proList.map((pro) => {
                const proCity = Array.isArray(pro.cities) ? pro.cities[0] : pro.cities;
                const displayName = titleCase(pro.name);
                return (
                  <Link
                    key={pro.id}
                    href={`/ai/freelance/${pro.slug}`}
                    className="group bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 hover:border-[var(--ai-text)] transition-all duration-200"
                  >
                    <div className="flex items-start justify-between mb-5">
                      <div
                        className="w-12 h-12 rounded-2xl flex items-center justify-center font-bold text-[16px] transition-transform duration-200 group-hover:scale-110"
                        style={getAvatarStyle(pro.avatar_color)}
                        aria-hidden="true"
                      >
                        {getInitials(displayName)}
                      </div>
                      {pro.years_experience != null && pro.years_experience > 0 && (
                        <span
                          className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider"
                          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                        >
                          {pro.years_experience}{" "}
                          <span className="lowercase">ans</span>
                        </span>
                      )}
                    </div>

                    <h3 className="text-base font-bold text-[var(--ai-text)] mb-1 leading-tight tracking-tight line-clamp-2">
                      {displayName}
                    </h3>

                    <p className="text-[13px] text-[var(--ai-text-secondary)] mb-3">
                      {proCity?.name ? titleCase(proCity.name) : "France"}
                      {pro.postal_code && (
                        <span className="text-[var(--ai-text-tertiary)]"> · {pro.postal_code}</span>
                      )}
                    </p>

                    {pro.github_username && (
                      <p
                        className="text-[12px] text-[var(--ai-accent)] mb-4 font-medium"
                        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                      >
                        @{pro.github_username}
                      </p>
                    )}

                    <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-text)] group-hover:text-[var(--ai-accent)] transition-colors mt-2">
                      Voir le profil
                      <svg
                        className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform"
                        viewBox="0 0 24 24"
                        fill="none"
                        aria-hidden="true"
                      >
                        <path
                          d="M5 12h14M13 6l6 6-6 6"
                          stroke="currentColor"
                          strokeWidth="2"
                          strokeLinecap="round"
                          strokeLinejoin="round"
                        />
                      </svg>
                    </span>
                  </Link>
                );
              })}
            </div>
          )}

          {/* Pagination */}
          {totalPages > 1 && (
            <nav
              className="flex items-center justify-center gap-2 mt-12"
              aria-label="Pagination"
            >
              {page > 1 ? (
                <Link
                  href={buildPaginationHref(category.slug, page - 1)}
                  className="inline-flex items-center justify-center h-10 px-4 text-[13px] font-medium rounded-lg bg-[var(--ai-bg-card)] border border-[var(--ai-border)] text-[var(--ai-text)] hover:border-[var(--ai-text)] transition-colors"
                  rel="prev"
                >
                  ← Precedent
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center h-10 px-4 text-[13px] font-medium rounded-lg bg-[var(--ai-bg-subtle)] border border-[var(--ai-border-subtle)] text-[var(--ai-text-muted)] cursor-not-allowed">
                  ← Precedent
                </span>
              )}

              <span
                className="px-4 text-[13px] font-medium text-[var(--ai-text-secondary)]"
                style={{ fontFamily: "var(--font-geist-mono), monospace" }}
              >
                {page} / {totalPages}
              </span>

              {page < totalPages ? (
                <Link
                  href={buildPaginationHref(category.slug, page + 1)}
                  className="inline-flex items-center justify-center h-10 px-4 text-[13px] font-medium rounded-lg bg-[var(--ai-bg-card)] border border-[var(--ai-border)] text-[var(--ai-text)] hover:border-[var(--ai-text)] transition-colors"
                  rel="next"
                >
                  Suivant →
                </Link>
              ) : (
                <span className="inline-flex items-center justify-center h-10 px-4 text-[13px] font-medium rounded-lg bg-[var(--ai-bg-subtle)] border border-[var(--ai-border-subtle)] text-[var(--ai-text-muted)] cursor-not-allowed">
                  Suivant →
                </span>
              )}
            </nav>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3/4 — FAQ dynamique par categorie (FAQPage schema)
          ═══════════════════════════════════════════════════════════════ */}
      <AiFaqSection
        id="faq"
        title={`Tout savoir sur ${category.name}`}
        subtitle={`Les questions qu'on nous pose le plus souvent sur les freelances ${category.name.toLowerCase()} avant un projet.`}
        questions={buildCategoryFaq(category, totalCount)}
        sectionIndex={3}
        sectionTotal={4}
        sectionLabel="FAQ"
      />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4/4 — CTA FINAL
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)] relative overflow-hidden">
        <Watermark text="DEPOSER" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <div className="max-w-2xl">
            <SectionLabel index={4} total={4} label="CTA" />
            <h2
              className="font-black text-[var(--ai-text)] uppercase mb-6"
              style={{
                fontSize: "clamp(32px, 5vw, 56px)",
                lineHeight: 0.95,
                letterSpacing: "-0.04em",
              }}
            >
              Pas trouve
              <br />
              <span className="text-[var(--ai-text-tertiary)]">
                le freelance ideal ?
              </span>
            </h2>
            <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] leading-relaxed mb-10">
              Decrivez votre projet — on selectionne les 3 freelances
              {" "}{category.name.toLowerCase()} qui vous correspondent le mieux
              en fonction de leur expertise, leur experience et leur disponibilite.
              Gratuit, sans engagement.
            </p>

            <Link
              href="/ai/deposer"
              className="group inline-flex items-stretch bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl overflow-hidden hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all duration-200 max-w-2xl"
              style={{ boxShadow: "var(--ai-shadow-md)" }}
            >
              <div className="flex-1 flex items-center gap-3 px-5 py-4">
                <div
                  className="grid grid-cols-2 grid-rows-2 gap-[2px] w-5 h-5 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90"
                  aria-hidden="true"
                >
                  <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                  <div className="bg-[var(--ai-text)] rounded-[1px]" />
                  <div className="bg-[var(--ai-text)] rounded-[1px]" />
                  <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                </div>
                <span className="text-[14px] sm:text-[15px] text-[var(--ai-text-secondary)] truncate">
                  Decrivez votre projet en 60s
                </span>
              </div>
              <div className="flex items-center justify-center gap-2 bg-[var(--ai-accent)] group-hover:bg-[var(--ai-accent-hover)] text-white px-6 sm:px-7 py-4 transition-colors duration-200">
                <span className="text-[14px] font-semibold whitespace-nowrap tracking-tight">
                  Deposer un projet
                </span>
                <svg
                  className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                >
                  <path
                    d="M5 12h14M13 6l6 6-6 6"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
              </div>
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}

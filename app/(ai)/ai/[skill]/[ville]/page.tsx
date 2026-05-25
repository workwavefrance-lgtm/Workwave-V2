import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import { createPublicClient } from "@/lib/supabase/public-client";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import { TECH_CITIES, findTechCityBySlug } from "@/lib/data/tech-cities";

export const revalidate = 21600; // 6h ISR

const TECH_VERTICAL = "tech";
const CURRENT_YEAR = new Date().getFullYear();

type CityPageProps = {
  params: Promise<{ skill: string; ville: string }>;
};

// ─── generateStaticParams : pre-build 6 categories x 30 villes = 180 pages ─
export async function generateStaticParams() {
  const sb = createPublicClient();
  const { data: categories } = await sb
    .from("categories")
    .select("slug")
    .eq("vertical", TECH_VERTICAL);
  if (!categories) return [];

  const params: Array<{ skill: string; ville: string }> = [];
  for (const cat of categories) {
    for (const city of TECH_CITIES) {
      params.push({ skill: cat.slug, ville: city.slug });
    }
  }
  return params;
}

// ─── SEO metadata ──────────────────────────────────────────────────────────
export async function generateMetadata({ params }: CityPageProps): Promise<Metadata> {
  const { skill, ville } = await params;
  const city = findTechCityBySlug(ville);
  if (!city) return { title: "Page introuvable — Workwave AI" };

  const sb = createPublicClient();
  const { data: category } = await sb
    .from("categories")
    .select("name, slug")
    .eq("slug", skill)
    .eq("vertical", TECH_VERTICAL)
    .maybeSingle();
  if (!category) return { title: "Page introuvable — Workwave AI" };

  const title = `Les 10 meilleurs freelances ${category.name} a ${city.name} en ${CURRENT_YEAR}`;
  const description = `Decouvrez les meilleurs freelances ${category.name.toLowerCase()} a ${city.name} (${city.dept_name}). Matching IA en moins de 24h, gratuit, sans credit. Devis sans engagement.`;

  return {
    title,
    description,
    alternates: { canonical: `/ai/${category.slug}/${city.slug}` },
    openGraph: {
      title,
      description,
      url: `/ai/${category.slug}/${city.slug}`,
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
      if (["de", "du", "des", "la", "le", "les", "el", "y", "et"].includes(w))
        return w;
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

// ─── Page ──────────────────────────────────────────────────────────────────
export default async function SkillCityPage({ params }: CityPageProps) {
  const { skill, ville } = await params;
  const city = findTechCityBySlug(ville);
  if (!city) notFound();

  const sb = createPublicClient();

  // 1. Charge la categorie
  const { data: category } = await sb
    .from("categories")
    .select("id, slug, name, description")
    .eq("slug", skill)
    .eq("vertical", TECH_VERTICAL)
    .maybeSingle();
  if (!category) notFound();

  // 2. Top 10 pros par ville (postal LIKE prefix dept)
  const { data: pros } = await sb
    .from("pros")
    .select(
      "id, name, slug, postal_code, address, years_experience, github_username"
    )
    .eq("category_id", category.id)
    .eq("source", "sirene")
    .eq("is_active", true)
    .is("deleted_at", null)
    .like("postal_code", `${city.dept_prefix}%`)
    .order("github_username", { ascending: false, nullsFirst: false })
    .order("years_experience", { ascending: false, nullsFirst: false })
    .limit(10);

  const proList = pros || [];
  const baseUrl = process.env.NEXT_PUBLIC_BASE_URL || "https://workwave.fr";

  // 3. Schema.org Service + ItemList + FAQPage
  const serviceSchema = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `Mise en relation freelance ${category.name} a ${city.name}`,
    description: `Service de matching IA entre porteurs de projet et freelances ${category.name.toLowerCase()} a ${city.name}. Inscription gratuite, sans credit.`,
    provider: {
      "@type": "Organization",
      name: "Workwave AI",
      url: `${baseUrl}/ai`,
    },
    areaServed: {
      "@type": "City",
      name: city.name,
    },
  };

  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `Top freelances ${category.name} a ${city.name}`,
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

  const faqSchema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: [
      {
        "@type": "Question",
        name: `Combien coute un freelance ${category.name.toLowerCase()} a ${city.name} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Le TJM d'un freelance ${category.name.toLowerCase()} a ${city.name} varie selon l'experience (junior, mid, senior, expert) et la rarete de la stack technique. Workwave AI vous met en relation avec des profils correspondant a votre budget — gratuitement.`,
        },
      },
      {
        "@type": "Question",
        name: `Comment trouver un bon freelance ${category.name.toLowerCase()} a ${city.name} ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Decrivez votre projet sur Workwave AI en 60 secondes. Notre IA selectionne les 3 freelances ${category.name.toLowerCase()} les plus pertinents a ${city.name} en moins de 24h, sur la base de leur expertise, leur experience et leur disponibilite. Vous discutez directement avec eux, sans intermediaire ni commission.`,
        },
      },
      {
        "@type": "Question",
        name: `Workwave AI prend-il une commission sur les missions ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Non. Workwave AI ne prend aucune commission sur les missions, ni cote client ni cote freelance. Le service est entierement gratuit pour les porteurs de projet. Les freelances paient un abonnement fixe de 29,90€/mois pour repondre aux briefs, sans systeme de credits.`,
        },
      },
      {
        "@type": "Question",
        name: `Combien de temps pour recevoir des propositions ?`,
        acceptedAnswer: {
          "@type": "Answer",
          text: `Notre IA route votre brief en moins de 24h aux 3 freelances ${category.name.toLowerCase()} les plus matches. Vous recevrez leurs propositions directement par email.`,
        },
      },
    ],
  };

  return (
    <>
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(serviceSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }} />
      <script type="application/ld+json" dangerouslySetInnerHTML={{ __html: JSON.stringify(faqSchema) }} />

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1/4 — HERO (TITLE CLICKBAIT + H1 SOBRE)
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text={city.name.toUpperCase()} position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          {/* Breadcrumb */}
          <nav className="flex items-center gap-2 text-[12px] text-[var(--ai-text-tertiary)] mb-6" aria-label="Fil d'Ariane">
            <Link href="/ai" className="hover:text-[var(--ai-text)] transition-colors">
              Workwave AI
            </Link>
            <span>/</span>
            <Link href={`/ai/${category.slug}`} className="hover:text-[var(--ai-text)] transition-colors">
              {category.name}
            </Link>
            <span>/</span>
            <span className="text-[var(--ai-text)]">{city.name}</span>
          </nav>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12 items-start">
            <div className="lg:col-span-8">
              <SectionLabel index={1} total={4} label={`${category.name} · ${city.name}`} />

              <h1
                className="font-black text-[var(--ai-text)] uppercase mb-6"
                style={{
                  fontSize: "clamp(36px, 6.5vw, 72px)",
                  lineHeight: 0.95,
                  letterSpacing: "-0.05em",
                }}
              >
                Freelances {category.name}
                <br />
                <span className="text-[var(--ai-text-tertiary)]">a {city.name}.</span>
              </h1>

              <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed mb-8">
                Les {proList.length || "meilleurs"} freelances {category.name.toLowerCase()} a {city.name} ({city.dept_name}) en {CURRENT_YEAR}.
                Matching par IA en moins de 24h. Inscription gratuite, sans credit,
                sans commission.
              </p>

              {/* CTA composite bar */}
              <Link
                href="/ai/deposer"
                className="group inline-flex flex-col sm:flex-row items-stretch bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl overflow-hidden hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all duration-200 max-w-2xl"
                style={{ boxShadow: "var(--ai-shadow-md)" }}
              >
                <div className="flex-1 flex items-center gap-3 px-5 py-4 min-w-0">
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
                  <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform duration-200" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </Link>
            </div>

            {/* Stat block droite */}
            <div className="lg:col-span-4 lg:pt-4 space-y-8">
              <div>
                <div className="flex items-baseline gap-3 mb-2">
                  <svg
                    className="w-5 h-5 text-[var(--ai-accent)] flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    aria-hidden="true"
                    style={{ transform: "translateY(1px)" }}
                  >
                    <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                  <span
                    className="text-3xl sm:text-4xl font-black text-[var(--ai-text)] tracking-tight"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    &lt; 24h
                  </span>
                </div>
                <p className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]" style={{ letterSpacing: "0.18em" }}>
                  Matching IA
                </p>
                <p className="text-sm text-[var(--ai-text-secondary)] leading-relaxed mt-2">
                  Notre IA route votre brief aux 3 meilleurs freelances de {city.name}.
                </p>
              </div>

              <div className="border-t border-[var(--ai-border-subtle)] pt-6">
                <p
                  className="text-[10px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-3"
                  style={{ fontFamily: "var(--font-geist-mono), monospace", letterSpacing: "0.2em" }}
                >
                  // {city.name} en chiffres
                </p>
                <ul className="text-[13px] text-[var(--ai-text-secondary)] space-y-2 leading-relaxed">
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    {city.population.toLocaleString("fr-FR")} habitants
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    Departement {city.dept_name} ({city.dept_prefix})
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-[var(--ai-accent)] mt-0.5">→</span>
                    {proList.length}+ freelances {category.name.toLowerCase()} actifs
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2/4 — TOP 10 LISTING
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
          <SectionLabel index={2} total={4} label={`Top ${proList.length || 10}`} />

          <h2
            className="font-black text-[var(--ai-text)] uppercase mb-3"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            Top {proList.length || 10} freelances {category.name.toLowerCase()}
            <br />
            <span className="text-[var(--ai-text-tertiary)]">a {city.name} en {CURRENT_YEAR}.</span>
          </h2>
          <p className="text-sm sm:text-base text-[var(--ai-text-secondary)] leading-relaxed mb-10 max-w-2xl">
            Selection objective : profils enrichis GitHub d&apos;abord, puis par
            annees d&apos;experience. Donnees SIRENE verifiees.
          </p>

          {proList.length === 0 ? (
            <div className="bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-12 text-center">
              <p className="text-lg font-semibold text-[var(--ai-text)] mb-3">
                Aucun freelance {category.name.toLowerCase()} reference a {city.name} pour l&apos;instant.
              </p>
              <p className="text-sm text-[var(--ai-text-secondary)] mb-6 max-w-lg mx-auto">
                Notre IA peut quand meme matcher votre brief avec des freelances
                en remote ou dans les villes voisines. Decrivez votre projet,
                on s&apos;occupe du reste.
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
              {proList.map((pro, i) => (
                <Link
                  key={pro.id}
                  href={`/ai/freelance/${pro.slug}`}
                  className="group bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 hover:border-[var(--ai-text)] transition-all duration-200 relative"
                >
                  {/* Rank badge */}
                  <span
                    className="absolute top-4 right-4 inline-flex items-center justify-center w-7 h-7 rounded-full bg-[var(--ai-bg-subtle)] text-[var(--ai-text)] text-[12px] font-bold"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {String(i + 1).padStart(2, "0")}
                  </span>

                  <div className="flex items-start gap-3 mb-4">
                    <div
                      className="grid grid-cols-2 grid-rows-2 gap-[2px] w-6 h-6 flex-shrink-0 transition-transform duration-200 group-hover:rotate-90"
                      aria-hidden="true"
                    >
                      <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                      <div className="bg-[var(--ai-text)] rounded-[1px]" />
                      <div className="bg-[var(--ai-text)] rounded-[1px]" />
                      <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                    </div>
                    {pro.years_experience != null && pro.years_experience > 0 && (
                      <span
                        className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider"
                        style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                      >
                        {pro.years_experience} ans
                      </span>
                    )}
                  </div>

                  <h3 className="text-base font-bold text-[var(--ai-text)] mb-1 leading-tight tracking-tight pr-10">
                    {titleCase(pro.name)}
                  </h3>
                  <p className="text-[13px] text-[var(--ai-text-secondary)] mb-3">
                    {city.name}
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
                    <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                      <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </span>
                </Link>
              ))}
            </div>
          )}
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3/4 — FAQ
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg-card)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-12">
            <div className="lg:col-span-4">
              <SectionLabel index={3} total={4} label="FAQ" />
              <h2
                className="font-black text-[var(--ai-text)] uppercase mb-4"
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                Vos questions sur
                <br />
                <span className="text-[var(--ai-text-tertiary)]">{category.name} a {city.name}.</span>
              </h2>
            </div>

            <div className="lg:col-span-8">
              <ul className="space-y-3">
                {(faqSchema.mainEntity as Array<{ name: string; acceptedAnswer: { text: string } }>).map((q, i) => (
                  <li key={q.name} className="bg-[var(--ai-bg)] border border-[var(--ai-border-subtle)] rounded-2xl">
                    <details className="group">
                      <summary className="flex items-start gap-4 p-6 cursor-pointer list-none">
                        <span
                          className="text-[11px] font-medium tracking-[0.2em] text-[var(--ai-text-tertiary)] pt-1 flex-shrink-0"
                          style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                        >
                          {String(i + 1).padStart(2, "0")}
                        </span>
                        <span className="flex-1 text-base font-semibold text-[var(--ai-text)] leading-snug">
                          {q.name}
                        </span>
                        <svg className="w-5 h-5 mt-1 text-[var(--ai-text-tertiary)] flex-shrink-0 transition-transform group-open:rotate-45" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path d="M12 5v14M5 12h14" stroke="currentColor" strokeWidth="2" strokeLinecap="round" />
                        </svg>
                      </summary>
                      <p className="px-6 pb-6 pl-[60px] text-sm text-[var(--ai-text-secondary)] leading-relaxed">
                        {q.acceptedAnswer.text}
                      </p>
                    </details>
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 4/4 — VILLES SIMILAIRES + CTA
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)] border-t border-[var(--ai-border-subtle)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20">
          <SectionLabel index={4} total={4} label="Autres villes" />
          <h2
            className="font-black text-[var(--ai-text)] uppercase mb-8"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            Freelances {category.name.toLowerCase()}
            <br />
            <span className="text-[var(--ai-text-tertiary)]">dans d&apos;autres villes.</span>
          </h2>

          {/* Grid des autres villes de meme categorie */}
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-2 mb-12">
            {TECH_CITIES.filter((c) => c.slug !== city.slug)
              .slice(0, 12)
              .map((c) => (
                <Link
                  key={c.slug}
                  href={`/ai/${category.slug}/${c.slug}`}
                  className="px-4 py-3 bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-lg text-center text-[13px] font-medium text-[var(--ai-text)] hover:border-[var(--ai-text)] hover:text-[var(--ai-accent)] transition-all"
                >
                  {c.name}
                </Link>
              ))}
          </div>

          {/* Final CTA */}
          <div className="bg-[var(--ai-text)] text-white rounded-2xl p-8 sm:p-12 relative overflow-hidden">
            <div
              aria-hidden="true"
              className="absolute inset-0 opacity-[0.04]"
              style={{
                backgroundImage:
                  "linear-gradient(to right, white 1px, transparent 1px), linear-gradient(to bottom, white 1px, transparent 1px)",
                backgroundSize: "32px 32px",
              }}
            />
            <div className="relative z-10 max-w-2xl">
              <p
                className="text-[10px] uppercase font-semibold text-[var(--ai-accent)] mb-3"
                style={{ letterSpacing: "0.2em" }}
              >
                ● Pret a tester
              </p>
              <h3
                className="font-black uppercase mb-4"
                style={{
                  fontSize: "clamp(28px, 4vw, 44px)",
                  lineHeight: 1,
                  letterSpacing: "-0.04em",
                }}
              >
                Trouvez votre
                <br />
                <span className="text-[var(--ai-accent)]">freelance {category.name.toLowerCase()}</span>
                <br />a {city.name}.
              </h3>
              <p className="text-sm text-white/70 leading-relaxed mb-8 max-w-lg">
                Inscription gratuite, sans engagement. Notre IA route votre brief
                aux 3 meilleurs profils en moins de 24h.
              </p>
              <Link
                href="/ai/deposer"
                className="inline-flex items-center justify-center h-12 px-7 text-[14px] font-semibold rounded-lg bg-[var(--ai-accent)] hover:bg-[var(--ai-accent-hover)] text-white transition-colors"
              >
                Deposer un projet
                <svg className="ml-2 w-4 h-4" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                  <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </>
  );
}

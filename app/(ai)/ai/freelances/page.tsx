import type { Metadata } from "next";
import Link from "next/link";
import { createPublicClient } from "@/lib/supabase/public-client";
import { SectionLabel } from "@/components/ai/ui/SectionLabel";
import { Watermark } from "@/components/ai/ui/Watermark";
import { AiFaqSection, type FaqItem } from "@/components/ai/AiFaqSection";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO // 6h ISR

const SITE_URL = "https://workwave.fr";

export const metadata: Metadata = {
  title:
    "Tous les freelances tech — IA, dev, cloud, data, design | Workwave AI",
  description:
    "Annuaire complet des freelances tech francais et europeens : developpement web (React, Next.js), IA (LLM, RAG), cloud (AWS, GCP), DevOps, no-code (Bubble, Make), data analytics, design produit. Publiez votre projet, alertez 500+ freelances tech FR en temps reel, sans commission.",
  alternates: { canonical: `${SITE_URL}/ai/freelances` },
};

const TECH_VERTICAL = "tech";

// ─────────────────────────────────────────────────────────────────────
// FAQ freelances hub — 5 questions strategiques
// ─────────────────────────────────────────────────────────────────────
const FAQ_FREELANCES_HUB: FaqItem[] = [
  {
    q: "Comment choisir la bonne categorie pour mon projet ?",
    a: "Selectionnez la categorie dont le freelance ideal aura la specialite principale. Pour un projet hybride (ex : app web React + integration IA), choisissez la categorie dominante (ici Developpement Web). Notre IA qualifie la demande et la diffuse a toute la communaute des freelances tech — ceux d'autres categories pertinentes verront le projet aussi grace au filtre dashboard. Si vous hesitez, deposez votre projet via /ai/deposer, l'IA classifie automatiquement.",
  },
  {
    q: "Un meme freelance peut-il avoir plusieurs categories ?",
    a: "Oui. La plupart des freelances tech ont 2-3 categories actives (ex : Dev Web + IA, Cloud + DevOps, Data + ML). A l'inscription, le freelance choisit une categorie principale et peut activer jusqu'a 3 categories secondaires. Comme tous les freelances voient tous les projets en temps reel, ils choisissent eux-memes ceux qui correspondent a leur savoir-faire via les filtres dashboard.",
  },
  {
    q: "Quels sont les TJM moyens des freelances tech sur Workwave AI ?",
    a: "Selon notre barometre 2026 (verifie vs Blog du Moderateur, Free-Work, Comet) : developpement web junior 350-500€/j senior 600-850€/j, IA junior 500-700€/j senior 800-1200€/j, Cloud junior 450-600€/j senior 700-1000€/j, Data junior 400-550€/j senior 650-900€/j, Design junior 350-450€/j senior 550-750€/j. No-code generalement 300-500€/j. Voir /ai/barometre-tjm pour le detail par technologie.",
  },
  {
    q: "Quelle est la difference entre Workwave AI et un site comme Malt ?",
    a: "Sur Workwave AI, vous publiez votre projet et notre IA diffuse en temps reel a toute la communaute des freelances tech inscrits — ceux qui correspondent a votre besoin vous contactent directement. Sur Malt, vous parcourez vous-meme des listes de centaines de profils. Workwave ne prend aucune commission sur la mission (vs 10% chez Malt jusqu'a 5K€). L'inscription du freelance est gratuite ; il debloque pour 9,90 € seulement les projets qui l'interessent (apres les avoir vus), au lieu de payer un abonnement ou une commission variable. Resultat : prix plus bas pour vous et pour le freelance.",
  },
  {
    q: "Les freelances sont-ils verifies (KYC, certification) ?",
    a: "Tous les freelances de notre annuaire sont enregistres a l'INSEE avec un SIRET valide (verifie via API Sirene). Pour ceux qui ont reclame leur fiche (env. 5% de la base), nous verifions l'email professionnel + le SIRET avant validation. Pour les fiches non-reclamees (donnees publiques Sirene), l'info est factuelle mais le freelance ne s'est pas exprime — la mention 'fiche non-reclamee' est explicite. Pour la KYC poussee (carte d'identite, contrat), c'est au client de demander au freelance avant la mission.",
  },
];

export default async function FreelancesHubPage() {
  const sb = createPublicClient();

  // 1. Charge UNIQUEMENT les 6 categories tech PARENTES (ids 43-48).
  // Le filtre vertical='tech' seul ramene aussi les sous-categories
  // (audiovisuel, finance, etc.) qui ont ete mal taggees ailleurs.
  const { data: categories } = await sb
    .from("categories")
    .select("id, slug, name, description")
    .eq("vertical", TECH_VERTICAL)
    .in("id", AI_CATEGORY_IDS)
    .order("slug");

  if (!categories) return null;

  // 2. Count freelances par categorie
  const counts = await Promise.all(
    categories.map(async (cat) => {
      const { count } = await sb
        .from("pros")
        .select("*", { count: "estimated", head: true })
        .eq("category_id", cat.id)
        .in("source", ["sirene", "ai_signup"])
        .eq("is_active", true)
        .is("deleted_at", null);
      return { ...cat, count: count || 0 };
    })
  );

  const totalCount = counts.reduce((s, c) => s + c.count, 0);

  // JSON-LD ItemList des 6 categories avec counts pros dynamiques
  const itemListSchema = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: "Categories de freelances tech sur Workwave AI",
    numberOfItems: counts.length,
    itemListElement: counts.map((cat, idx) => ({
      "@type": "ListItem",
      position: idx + 1,
      url: `${SITE_URL}/ai/${cat.slug}`,
      item: {
        "@type": "Service",
        name: cat.name,
        description: cat.description || `Freelances tech specialises en ${cat.name}`,
        url: `${SITE_URL}/ai/${cat.slug}`,
        provider: {
          "@type": "Organization",
          name: "Workwave AI",
        },
      },
    })),
  };

  // JSON-LD BreadcrumbList
  const breadcrumbSchema = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "Workwave AI", item: `${SITE_URL}/ai` },
      { "@type": "ListItem", position: 2, name: "Freelances tech", item: `${SITE_URL}/ai/freelances` },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(itemListSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbSchema) }}
      />
      {/* ═══════════════════════════════════════════════════════════════
          SECTION 1/2 — HERO
          ═══════════════════════════════════════════════════════════════ */}
      <section className="relative overflow-hidden border-b border-[var(--ai-border-subtle)]">
        <Watermark text="FREELANCES" position="bottom" />

        <div className="relative z-10 max-w-7xl mx-auto px-4 sm:px-6 py-16 sm:py-20 lg:py-24">
          <SectionLabel index={1} total={3} label="Toutes categories" />

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
                Tous les freelances
                <br />
                <span className="text-[var(--ai-text-tertiary)]">tech.</span>
              </h1>
              <p className="text-base sm:text-lg text-[var(--ai-text-secondary)] max-w-2xl leading-relaxed">
                {totalCount > 0
                  ? `Notre base compte ${totalCount.toLocaleString("fr-FR")} freelances tech actifs en France et Europe, repartis sur 6 categories.`
                  : "Notre base regroupe des freelances tech actifs en France et Europe, repartis sur 6 categories."}{" "}
                Choisissez la categorie qui correspond a votre besoin ou deposez directement votre projet — on s&apos;occupe de la selection.
              </p>
            </div>

            <div className="lg:col-span-4 lg:pb-4">
              <div className="flex items-baseline gap-3 mb-2">
                <svg
                  className="w-6 h-6 text-[var(--ai-accent)] flex-shrink-0"
                  viewBox="0 0 24 24"
                  fill="none"
                  aria-hidden="true"
                  style={{ transform: "translateY(2px)" }}
                >
                  <path d="M7 17L17 7M17 7H9M17 7V15" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
                <span
                  className="text-4xl sm:text-5xl font-black text-[var(--ai-text)] tracking-tight"
                  style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                >
                  {totalCount >= 1000 ? (totalCount / 1000).toFixed(0) + "k" : totalCount}
                </span>
              </div>
              <p
                className="text-[11px] uppercase font-semibold text-[var(--ai-text-tertiary)]"
                style={{ letterSpacing: "0.18em" }}
              >
                Freelances tech
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 2/2 — CATEGORIES GRID
          ═══════════════════════════════════════════════════════════════ */}
      <section className="bg-[var(--ai-bg)]">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16 lg:py-20">
          <SectionLabel index={2} total={3} label="Categories" />

          <h2
            className="font-black text-[var(--ai-text)] uppercase mb-10"
            style={{
              fontSize: "clamp(28px, 4vw, 44px)",
              lineHeight: 1,
              letterSpacing: "-0.04em",
            }}
          >
            6 categories tech
            <br />
            <span className="text-[var(--ai-text-tertiary)]">a explorer.</span>
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {counts.map((cat) => (
              <Link
                key={cat.slug}
                href={`/ai/${cat.slug}`}
                className="group bg-[var(--ai-bg-card)] border border-[var(--ai-border-subtle)] rounded-2xl p-6 hover:border-[var(--ai-text)] transition-all duration-200"
              >
                <div className="flex items-start justify-between mb-5">
                  <div
                    className="grid grid-cols-2 grid-rows-2 gap-[2px] w-6 h-6 transition-transform duration-200 group-hover:rotate-90"
                    aria-hidden="true"
                  >
                    <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                    <div className="bg-[var(--ai-text)] rounded-[1px]" />
                    <div className="bg-[var(--ai-text)] rounded-[1px]" />
                    <div className="bg-[var(--ai-accent)] rounded-[1px]" />
                  </div>
                  <span
                    className="text-[11px] font-medium text-[var(--ai-text-tertiary)] tracking-wider"
                    style={{ fontFamily: "var(--font-geist-mono), monospace" }}
                  >
                    {cat.count >= 1000
                      ? (cat.count / 1000).toFixed(1).replace(".0", "") + "k"
                      : cat.count}{" "}
                    pros
                  </span>
                </div>

                <h3 className="text-lg font-bold text-[var(--ai-text)] mb-2 leading-tight tracking-tight">
                  {cat.name}
                </h3>

                {cat.description && (
                  <p className="text-[13px] text-[var(--ai-text-secondary)] leading-relaxed mb-4 line-clamp-2">
                    {cat.description}
                  </p>
                )}

                <span className="inline-flex items-center gap-1.5 text-[13px] font-semibold text-[var(--ai-text)] group-hover:text-[var(--ai-accent)] transition-colors mt-2">
                  Voir les freelances
                  <svg className="w-3.5 h-3.5 group-hover:translate-x-0.5 transition-transform" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </span>
              </Link>
            ))}
          </div>

          {/* CTA composite bar bottom */}
          <div className="mt-12 max-w-2xl">
            <p className="text-[12px] uppercase font-semibold text-[var(--ai-text-tertiary)] mb-4" style={{ letterSpacing: "0.18em" }}>
              Pas sur de la categorie ?
            </p>
            <Link
              href="/ai/deposer"
              className="group flex flex-col sm:flex-row items-stretch bg-[var(--ai-bg-card)] border border-[var(--ai-border-strong)] rounded-xl overflow-hidden hover:border-[var(--ai-text)] hover:-translate-y-0.5 transition-all duration-200"
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
                  On alerte 500+ freelances tech en temps reel
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
        </div>
      </section>

      {/* ═══════════════════════════════════════════════════════════════
          SECTION 3/3 — FAQ Freelances Hub (FAQPage schema)
          ═══════════════════════════════════════════════════════════════ */}
      <AiFaqSection
        id="faq"
        title="Bien choisir son freelance tech"
        subtitle="Les reponses aux questions qu'on nous pose le plus souvent avant de deposer un projet sur Workwave AI."
        questions={FAQ_FREELANCES_HUB}
        sectionIndex={3}
        sectionTotal={3}
        sectionLabel="FAQ"
      />
    </>
  );
}

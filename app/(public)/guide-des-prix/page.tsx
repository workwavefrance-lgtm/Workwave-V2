import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { getAllPublishedPriceGuides } from "@/lib/queries/price-guides";
import { getAllCategories } from "@/lib/queries/categories";
import { toBreadcrumbSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

export const metadata: Metadata = {
  title: "Guides des prix travaux 2026 : tarifs artisans par métier — Workwave",
  description:
    "Tous les prix des travaux en 2026 : tarifs et fourchettes par métier et prestation. Données indicatives sourcées. Déposez votre projet gratuitement pour être mis en relation avec des artisans près de chez vous.",
  alternates: { canonical: `${BASE_URL}/guide-des-prix` },
};

export default async function PriceGuidesHubPage() {
  const guides = await getAllPublishedPriceGuides();
  const cats = await getAllCategories();
  const nameOf = new Map(cats.map((c) => [c.slug, c.name]));

  // Grouper par métier
  const byMetier = new Map<string, { metierGuide?: string; prestations: { slug: string; h1: string }[] }>();
  for (const g of guides) {
    const m = g.metier_slug || "autres";
    if (!byMetier.has(m)) byMetier.set(m, { prestations: [] });
    const bucket = byMetier.get(m)!;
    if (g.scope === "metier") bucket.metierGuide = m;
    else bucket.prestations.push({ slug: g.slug, h1: g.h1 });
  }
  const sections = [...byMetier.entries()]
    .map(([m, v]) => ({ metier: m, name: nameOf.get(m) || m, ...v }))
    .filter((s) => s.metierGuide || s.prestations.length)
    .sort((a, b) => b.prestations.length - a.prestations.length);

  const breadcrumbItems = [{ label: "Accueil", href: "/" }, { label: "Guides des prix" }];

  return (
    <main className="max-w-4xl mx-auto px-4 py-12">
      <JsonLd data={toBreadcrumbSchema(breadcrumbItems, BASE_URL)} />
      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        Guides des prix des travaux 2026
      </h1>
      <p className="text-base text-[var(--text-secondary)] max-w-2xl mb-8 leading-relaxed">
        Combien coûte votre projet ? Retrouvez les tarifs indicatifs par métier et par
        prestation, basés sur des données du marché. Puis déposez votre projet
        gratuitement pour être mis en relation avec des artisans vérifiés près de chez vous.
      </p>
      <Link
        href="/deposer-projet"
        className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-7 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] mb-12"
      >
        Déposer votre projet gratuitement →
      </Link>

      {sections.length === 0 ? (
        <p className="text-sm text-[var(--text-tertiary)]">Les guides de prix arrivent très prochainement.</p>
      ) : (
        <div className="space-y-10">
          {sections.map((s) => (
            <section key={s.metier}>
              <h2 className="text-lg font-bold text-[var(--text-primary)] mb-4">
                {s.metierGuide ? (
                  <Link href={`/${s.metier}/prix`} className="hover:text-[var(--accent)] transition-colors">
                    Prix {s.name.toLowerCase()}
                  </Link>
                ) : (
                  `Prix ${s.name.toLowerCase()}`
                )}
              </h2>
              {s.prestations.length > 0 && (
                <ul className="flex flex-wrap gap-2">
                  {s.prestations.map((p) => (
                    <li key={p.slug}>
                      <Link
                        href={`/guide-des-prix/${p.slug}`}
                        className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--card-border)] text-[13px] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-colors duration-200"
                      >
                        {p.h1}
                      </Link>
                    </li>
                  ))}
                </ul>
              )}
            </section>
          ))}
        </div>
      )}
    </main>
  );
}

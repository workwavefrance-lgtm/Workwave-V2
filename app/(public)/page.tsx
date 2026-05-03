export const revalidate = 3600; // 1h

import Link from "next/link";
import SearchForm from "@/components/search/SearchForm";
import JsonLd from "@/components/seo/JsonLd";
// Imports publics (sans cookies) pour permettre le caching ISR de la home.
// Ne PAS remplacer par `lib/queries/categories` ou `lib/queries/cities` :
// ces modules touchent aux cookies (cf. lib/supabase/server.ts) et basculent
// la page en dynamic => cache CDN inactif (TTFB 0.4s a chaque visite).
import { getCategoriesByVerticalPublic } from "@/lib/queries/home-public";
import { getTopCitiesPublic, getAllDepartmentsPublic } from "@/lib/queries/home-public";
import { getWebSiteSchema, getOrganizationSchema } from "@/lib/utils/schema";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { BASE_URL } from "@/lib/constants";

export default async function Home() {
  const [btp, domicile, personne, topCities, departments] = await Promise.all([
    getCategoriesByVerticalPublic("btp"),
    getCategoriesByVerticalPublic("domicile"),
    getCategoriesByVerticalPublic("personne"),
    getTopCitiesPublic(30),
    getAllDepartmentsPublic(),
  ]);

  const allCategories = [...btp, ...domicile, ...personne].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Rotation des 12 departements pour repartir le link juice de la home
  // sur tous les departements de Nouvelle-Aquitaine au lieu de tout pousser
  // vers vienne-86. Offset different par vertical pour varier l'ordre.
  // Cf. lecon CLAUDE.md (audit 2026-05-03).
  const deptSlugs = departments.map((d) => generateDepartmentSlug(d));
  const linkFor = (catSlug: string, idx: number, offset: number): string => {
    if (deptSlugs.length === 0) return `/${catSlug}`;
    const dept = deptSlugs[(idx + offset) % deptSlugs.length];
    return `/${catSlug}/${dept}`;
  };

  const verticals = [
    { title: "BTP et artisanat", categories: btp, offset: 0 },
    { title: "Services a domicile", categories: domicile, offset: 4 },
    { title: "Aide a la personne", categories: personne, offset: 8 },
  ];

  return (
    <main>
      <JsonLd data={getWebSiteSchema(BASE_URL)} />
      <JsonLd data={getOrganizationSchema(BASE_URL)} />

      {/* Hero */}
      <section className="py-24 sm:py-32 lg:py-40 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
            Tout le savoir-faire local,
            <br />
            enfin accessible
            {/* Point coral anime en pulse subtil. Pas d'opacity:0 a l'init
                = le point est rendu serveur-side, LCP intact. */}
            <span className="text-[var(--accent)] animate-accent-pulse">.</span>
          </h1>
          {/* Slide-in du sous-titre, leger delai pour qu'il arrive apres
              que le H1 soit visible. Le sous-titre n'est pas le LCP. */}
          <p
            className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-in-up"
            style={{ animationDelay: "120ms" }}
          >
            Des centaines de milliers de professionnels référencés en
            Nouvelle-Aquitaine, à portée d&apos;un clic.
          </p>
          <SearchForm categories={allCategories} />
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">
            Plus de{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              226 000
            </span>{" "}
            professionnels référencés dans{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              4 293
            </span>{" "}
            communes de Nouvelle-Aquitaine
          </p>
        </div>
      </section>

      {/* Categories par vertical */}
      {verticals.map((vertical) => (
        <section
          key={vertical.title}
          className="py-16 px-4 border-t border-[var(--border-color)]"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
              {vertical.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {vertical.categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={linkFor(cat.slug, i, vertical.offset)}
                  className="group bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 text-center transition-all duration-250 hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-250">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Top villes */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
            Principales villes de Nouvelle-Aquitaine
          </h2>
          <div className="flex flex-wrap gap-3">
            {topCities.slice(0, 20).map((city) => (
              <Link
                key={city.id}
                href={`/plombier/${city.slug}`}
                className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>
    </main>
  );
}

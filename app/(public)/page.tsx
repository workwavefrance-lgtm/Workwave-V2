export const revalidate = 3600; // 1h

import Link from "next/link";
import SearchForm from "@/components/search/SearchForm";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoriesByVertical } from "@/lib/queries/categories";
import { getTopCities } from "@/lib/queries/cities";
import { getWebSiteSchema, getOrganizationSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";

export default async function Home() {
  const [btp, domicile, personne, topCities] = await Promise.all([
    getCategoriesByVertical("btp"),
    getCategoriesByVertical("domicile"),
    getCategoriesByVertical("personne"),
    getTopCities(30),
  ]);

  const allCategories = [...btp, ...domicile, ...personne].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  const cityOptions = topCities.map((c) => ({ slug: c.slug, name: c.name }));

  const verticals = [
    { title: "BTP et artisanat", categories: btp },
    { title: "Services a domicile", categories: domicile },
    { title: "Aide a la personne", categories: personne },
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
            <span className="text-[var(--accent)]">.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed">
            Des centaines de milliers de professionnels référencés en
            Nouvelle-Aquitaine, à portée d&apos;un clic.
          </p>
          <SearchForm categories={allCategories} cities={cityOptions} />
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
              {vertical.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}/vienne-86`}
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

import type { Metadata } from "next";
import { redirect } from "next/navigation";
import ProCard from "@/components/pro/ProCard";
import Pagination from "@/components/ui/Pagination";
import EmptyState from "@/components/ui/EmptyState";
import SearchForm from "@/components/search/SearchForm";
import { searchPros } from "@/lib/queries/pros";
import { getCategoryBySlug, getAllCategories } from "@/lib/queries/categories";
import { getCityBySlug } from "@/lib/queries/cities";
import { getTopCities } from "@/lib/queries/cities";

export const metadata: Metadata = {
  title: "Recherche - Trouvez un professionnel pres de chez vous",
  description:
    "Recherchez un artisan ou professionnel par metier et ville. Comparez les pros disponibles dans votre zone et contactez-les gratuitement.",
  alternates: { canonical: "https://workwave.fr/recherche" },
};

type Props = {
  searchParams: Promise<{
    q?: string;
    metier?: string;
    ville?: string;
    page?: string;
  }>;
};

export default async function RecherchePage({ searchParams }: Props) {
  const { q, metier, ville, page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10));

  if (metier && ville) {
    const cat = await getCategoryBySlug(metier);
    const city = await getCityBySlug(ville);
    if (cat && city) {
      redirect(`/${metier}/${ville}`);
    }
  }

  const [allCategories, topCities] = await Promise.all([
    getAllCategories(),
    getTopCities(30),
  ]);

  const query = q || "";
  const result = query
    ? await searchPros(query, { page })
    : { data: [], count: 0, page: 1, pageSize: 20, totalPages: 0 };

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
        Recherche
      </h1>

      <div className="mb-10 max-w-2xl">
        <SearchForm
          categories={allCategories.map((c) => ({
            slug: c.slug,
            name: c.name,
          }))}
          cities={topCities.map((c) => ({ slug: c.slug, name: c.name }))}
        />
      </div>

      {query && (
        <>
          <p className="text-[var(--text-secondary)] mb-8">
            {result.count} resultat{result.count > 1 ? "s" : ""} pour &quot;
            {query}&quot;
          </p>

          {result.data.length > 0 ? (
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
              {result.data.map((pro) => (
                <ProCard key={pro.id} pro={pro} />
              ))}
            </div>
          ) : (
            <EmptyState
              title="Aucun résultat"
              message={`Aucun professionnel ne correspond à "${query}". Essayez avec d'autres termes.`}
              actionLabel="Retour à l'accueil"
              actionHref="/"
            />
          )}

          <Pagination
            currentPage={page}
            totalPages={result.totalPages}
            baseUrl={`/recherche?q=${encodeURIComponent(query)}`}
          />
        </>
      )}
    </main>
  );
}

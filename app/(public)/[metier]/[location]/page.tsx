import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Pagination from "@/components/ui/Pagination";
import ProCard from "@/components/pro/ProCard";
import EmptyState from "@/components/ui/EmptyState";
import InternalLinks from "@/components/listing/InternalLinks";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryBySlug, getAllCategories } from "@/lib/queries/categories";
import { resolveLocation } from "@/lib/queries/location";
import {
  getProsByCategoryAndDepartment,
  getProsByCategoryAndCity,
} from "@/lib/queries/pros";
import { getNearbyCities, getCitiesByDepartment } from "@/lib/queries/cities";
import { getSeoContent } from "@/lib/queries/seo-pages";
import SeoContent from "@/components/seo/SeoContent";
import { BASE_URL } from "@/lib/constants";

export const revalidate = 3600;

type Props = {
  params: Promise<{ metier: string; location: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, location: locationSlug } = await params;
  const category = await getCategoryBySlug(metier);
  const resolved = await resolveLocation(locationSlug);

  if (!category || !resolved) return {};

  const locationName =
    resolved.type === "department"
      ? `${resolved.department.name} (${resolved.department.code})`
      : resolved.city.name;

  // Utiliser le contenu SEO genere si disponible
  const locationId =
    resolved.type === "department"
      ? resolved.department.id
      : resolved.city.id;
  const seo = await getSeoContent(
    category.id,
    locationId,
    resolved.type === "department" ? "department" : "city"
  );

  // Compter les pros pour cette combinaison
  const result =
    resolved.type === "department"
      ? await getProsByCategoryAndDepartment(category.id, resolved.department.id, { page: 1, pageSize: 1 })
      : await getProsByCategoryAndCity(category.id, resolved.city.id, { page: 1, pageSize: 1 });

  const prosCount = result.count;

  return {
    title: seo?.title || `${category.name} à ${locationName}`,
    description:
      seo?.meta_description ||
      `Trouvez un ${category.name.toLowerCase()} à ${locationName}. Comparez les professionnels et contactez-les gratuitement.`,
    alternates: {
      canonical: `${BASE_URL}/${metier}/${locationSlug}`,
    },
    // noindex si aucun pro dans cette combinaison
    ...(prosCount === 0 ? { robots: { index: false, follow: true } } : {}),
  };
}

export default async function ListingPage({ params, searchParams }: Props) {
  const { metier, location: locationSlug } = await params;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  const category = await getCategoryBySlug(metier);
  if (!category) notFound();

  const resolved = await resolveLocation(locationSlug);
  if (!resolved) notFound();

  const locationName =
    resolved.type === "department"
      ? `${resolved.department.name} (${resolved.department.code})`
      : resolved.city.name;

  const result =
    resolved.type === "department"
      ? await getProsByCategoryAndDepartment(
          category.id,
          resolved.department.id,
          { page }
        )
      : await getProsByCategoryAndCity(category.id, resolved.city.id, { page });

  const allCategories = await getAllCategories();
  const relatedCategories = allCategories
    .filter((c) => c.vertical === category.vertical && c.id !== category.id)
    .slice(0, 8);

  // Contenu SEO
  const locationId =
    resolved.type === "department"
      ? resolved.department.id
      : resolved.city.id;
  const seo = await getSeoContent(
    category.id,
    locationId,
    resolved.type === "department" ? "department" : "city"
  );

  let nearbyCities: Awaited<ReturnType<typeof getNearbyCities>> = [];
  if (resolved.type === "city") {
    nearbyCities = await getNearbyCities(resolved.city.id, 8);
  } else {
    const deptCities = await getCitiesByDepartment(resolved.department.id);
    nearbyCities = deptCities.slice(0, 10);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} à ${locationName}`,
    numberOfItems: result.count,
    itemListElement: result.data.map((pro, i) => ({
      "@type": "ListItem",
      position: (page - 1) * result.pageSize + i + 1,
      url: `${BASE_URL}/artisan/${pro.slug}`,
      name: pro.name,
    })),
  };

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: category.name, href: `/${category.slug}/vienne-86` },
    { label: locationName },
  ];

  const baseUrl = `/${metier}/${locationSlug}`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={jsonLd} />
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-10">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          {category.name} à {locationName}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {result.count} professionnel{result.count > 1 ? "s" : ""} référencé
          {result.count > 1 ? "s" : ""}
        </p>
      </div>

      {result.data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.data.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucun professionnel trouvé"
          message={`Nous n'avons pas encore de ${category.name.toLowerCase()} référencé à ${locationName}.`}
          actionLabel="Rechercher ailleurs"
          actionHref="/recherche"
        />
      )}

      <Pagination
        currentPage={page}
        totalPages={result.totalPages}
        baseUrl={baseUrl}
      />

      {seo && <SeoContent content={seo.content} />}

      <InternalLinks
        relatedCategories={relatedCategories}
        nearbyCities={nearbyCities}
        currentCategorySlug={category.slug}
        locationSlug={locationSlug}
      />
    </main>
  );
}

import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Pagination from "@/components/ui/Pagination";
import ProCard from "@/components/pro/ProCard";
import EmptyState from "@/components/ui/EmptyState";
import InternalLinks from "@/components/listing/InternalLinks";
import ProjectCtaBanner from "@/components/listing/ProjectCtaBanner";
import ListingIntro from "@/components/listing/ListingIntro";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryBySlug, getAllCategories, getPopularCategoriesInCity } from "@/lib/queries/categories";
import { resolveLocation } from "@/lib/queries/location";
import {
  getProsByCategoryAndDepartment,
  getProsByCategoryAndCity,
} from "@/lib/queries/pros";
import { getNearbyCities, getCitiesByDepartment } from "@/lib/queries/cities";
import { getSeoContent } from "@/lib/queries/seo-pages";
import SeoContent from "@/components/seo/SeoContent";
import FaqAccordion from "@/components/seo/FaqAccordion";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";
import { extractIntro, stripIntro } from "@/lib/utils/seo";

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

  // "en" pour departement, "a" pour ville
  const preposition = resolved.type === "department" ? "en" : "à";

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

  const title =
    seo?.title ||
    (prosCount > 0
      ? `${category.name} ${preposition} ${locationName} - ${prosCount} professionnel${prosCount > 1 ? "s" : ""}`
      : `${category.name} ${preposition} ${locationName}`);

  const description =
    seo?.meta_description ||
    `Trouvez un ${category.name.toLowerCase()} ${preposition} ${locationName}. ${prosCount} professionnel${prosCount > 1 ? "s" : ""} référencé${prosCount > 1 ? "s" : ""}, devis gratuits, intervention rapide.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${metier}/${locationSlug}`,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE_URL}/${metier}/${locationSlug}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
    // Pas de noindex : interdit par CLAUDE.md (lecon 27/04/2026).
    // Le redirect 308 dans Page() (cf. ci-dessous) gere deja les villes sans pros
    // en redirigeant vers la page departement. Le noindex ne sera donc jamais servi.
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

  // "en" pour departement, "a" pour ville
  const preposition = resolved.type === "department" ? "en" : "à";

  const result =
    resolved.type === "department"
      ? await getProsByCategoryAndDepartment(
          category.id,
          resolved.department.id,
          { page }
        )
      : await getProsByCategoryAndCity(category.id, resolved.city.id, { page });

  // 308 vers la page département si aucun pro dans cette ville pour ce métier.
  // Évite ~6000 URLs noindex pollutives en GSC, transmet le link juice à la
  // page département (forte SEO), et la page redevient indexable automatiquement
  // dès qu'un pro est ajouté pour cette commune.
  // ATTENTION : pas de loading.tsx dans cette route ! Le streaming Suspense
  // commit le status 200 avant que la page puisse throw permanentRedirect/notFound.
  // Cf. lecon apprise CLAUDE.md du 2026-04-18.
  if (resolved.type === "city" && result.count === 0) {
    permanentRedirect(`/${metier}/vienne-86`);
  }

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
  let popularCategories: Awaited<ReturnType<typeof getPopularCategoriesInCity>> = [];
  if (resolved.type === "city") {
    [nearbyCities, popularCategories] = await Promise.all([
      getNearbyCities(resolved.city.id, 8),
      getPopularCategoriesInCity(resolved.city.id, category.id, 6),
    ]);
  } else {
    const deptCities = await getCitiesByDepartment(resolved.department.id);
    nearbyCities = deptCities.slice(0, 10);
  }

  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} ${preposition} ${locationName}`,
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

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  const baseUrl = `/${metier}/${locationSlug}`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          {category.name} {preposition} {locationName}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {result.count} professionnel{result.count > 1 ? "s" : ""} référencé
          {result.count > 1 ? "s" : ""}
        </p>
      </div>

      {/* CTA dépôt de projet — au-dessus de la grille pour la conversion */}
      <ProjectCtaBanner
        categorySlug={category.slug}
        categoryName={category.name}
        locationSlug={locationSlug}
        locationName={locationName}
        preposition={preposition}
      />

      {/* Intro SEO courte — au-dessus de la grille pour le crawl Google */}
      <ListingIntro
        intro={extractIntro(seo?.content)}
        fallback={`Vous cherchez un ${category.name.toLowerCase()} ${preposition} ${locationName} ? Workwave référence ${result.count} professionnel${result.count > 1 ? "s" : ""} qualifié${result.count > 1 ? "s" : ""} dans cette zone. Comparez les profils, consultez les coordonnées et contactez directement l'artisan de votre choix. Service 100% gratuit, sans intermédiaire commercial.`}
      />

      {result.data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.data.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucun professionnel trouvé"
          message={`Nous n'avons pas encore de ${category.name.toLowerCase()} référencé ${preposition} ${locationName}.`}
          actionLabel="Rechercher ailleurs"
          actionHref="/recherche"
        />
      )}

      <Pagination
        currentPage={page}
        totalPages={result.totalPages}
        baseUrl={baseUrl}
      />

      {/* Contenu SEO long (sections H2 + détails) — l'intro a déjà été affichée plus haut */}
      {seo && stripIntro(seo.content) && (
        <SeoContent content={stripIntro(seo.content)} />
      )}

      {/* FAQ accordeon + schema FAQPage */}
      {seo?.faq_json && seo.faq_json.length > 0 && (
        <>
          <JsonLd
            data={{
              "@context": "https://schema.org",
              "@type": "FAQPage",
              mainEntity: seo.faq_json.map((faq) => ({
                "@type": "Question",
                name: faq.question,
                acceptedAnswer: {
                  "@type": "Answer",
                  text: faq.answer,
                },
              })),
            }}
          />
          <FaqAccordion faqs={seo.faq_json} />
        </>
      )}

      <InternalLinks
        relatedCategories={relatedCategories}
        nearbyCities={nearbyCities}
        currentCategorySlug={category.slug}
        currentCategoryName={category.name}
        locationSlug={locationSlug}
        locationName={locationName}
        popularCategories={popularCategories}
      />
    </main>
  );
}

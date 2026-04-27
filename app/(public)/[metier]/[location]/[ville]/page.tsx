import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Pagination from "@/components/ui/Pagination";
import ProCard from "@/components/pro/ProCard";
import EmptyState from "@/components/ui/EmptyState";
import ProjectCtaBanner from "@/components/listing/ProjectCtaBanner";
import ListingIntro from "@/components/listing/ListingIntro";
import FaqAccordion from "@/components/seo/FaqAccordion";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getCityBySlug } from "@/lib/queries/cities";
import { getProsByCategoryAndCity } from "@/lib/queries/pros";
import {
  getSpecialty,
  getSpecialtiesForMetier,
  isValidSpecialty,
} from "@/lib/specialties";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

export const revalidate = 3600;

type Props = {
  params: Promise<{ metier: string; location: string; ville: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, location, ville } = await params;
  // Au niveau 2, le segment dynamique s'appelle "location" pour cohérence
  // de routing avec [metier]/[location]/page.tsx, mais ici il porte le slug
  // d'une sous-spécialité (ex. "depannage", "renovation").
  const specialite = location;

  // Garde-fou : la spécialité doit exister pour ce métier
  if (!isValidSpecialty(metier, specialite)) return {};

  const category = await getCategoryBySlug(metier);
  const specialty = getSpecialty(metier, specialite);
  const city = await getCityBySlug(ville);
  if (!category || !specialty || !city) return {};

  // Compter les pros pour cette combinaison
  const result = await getProsByCategoryAndCity(category.id, city.id, {
    page: 1,
    pageSize: 1,
  });
  const prosCount = result.count;

  const lower = category.name.toLowerCase();
  const title =
    prosCount > 0
      ? `${category.name} ${specialty.shortLabel} à ${city.name} — ${prosCount} professionnel${prosCount > 1 ? "s" : ""}`
      : `${category.name} ${specialty.shortLabel} à ${city.name}`;

  const description =
    specialty.description.length <= 155
      ? specialty.description
      : `${lower} ${specialty.shortLabel} à ${city.name}. ${prosCount} professionnel${prosCount > 1 ? "s" : ""} disponible${prosCount > 1 ? "s" : ""} — devis gratuits.`;

  return {
    title,
    description,
    alternates: {
      canonical: `${BASE_URL}/${metier}/${specialite}/${ville}`,
    },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE_URL}/${metier}/${specialite}/${ville}`,
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

export default async function SpecialtyCityPage({ params, searchParams }: Props) {
  const { metier, location, ville } = await params;
  // Au niveau 2, le segment dynamique s'appelle "location" pour cohérence
  // de routing avec [metier]/[location]/page.tsx, mais ici il porte le slug
  // d'une sous-spécialité (ex. "depannage", "renovation").
  const specialite = location;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);

  // 404 si spécialité inconnue (config typée)
  if (!isValidSpecialty(metier, specialite)) notFound();

  const category = await getCategoryBySlug(metier);
  if (!category) notFound();

  const specialty = getSpecialty(metier, specialite);
  if (!specialty) notFound();

  const city = await getCityBySlug(ville);
  if (!city) notFound();

  const result = await getProsByCategoryAndCity(category.id, city.id, { page });

  // 308 vers la page département si aucun pro pour ce couple (cat × ville).
  // Évite ~3500 URLs noindex pollutives en GSC pour les sous-spécialités vides.
  if (result.count === 0) {
    permanentRedirect(`/${metier}/vienne-86`);
  }

  const lower = category.name.toLowerCase();
  const cityLabel = city.name;

  // Autres spécialités du même métier (pour maillage interne dense)
  const otherSpecialties = getSpecialtiesForMetier(metier).filter(
    (s) => s.slug !== specialite
  );

  // Schema.org Service (spécifique à la sous-spécialité)
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${category.name} ${specialty.shortLabel} à ${cityLabel}`,
    serviceType: specialty.name,
    description: specialty.description,
    provider: {
      "@type": "Organization",
      name: "Workwave",
      url: BASE_URL,
    },
    areaServed: {
      "@type": "City",
      name: cityLabel,
    },
  };

  // Schema.org ItemList (liste des pros, comme la page listing standard)
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: `${category.name} ${specialty.shortLabel} à ${cityLabel}`,
    numberOfItems: result.count,
    itemListElement: result.data.map((pro, i) => ({
      "@type": "ListItem",
      position: (page - 1) * result.pageSize + i + 1,
      url: `${BASE_URL}/artisan/${pro.slug}`,
      name: pro.name,
    })),
  };

  // Schema.org FAQPage
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: specialty.faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  // Breadcrumb
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: category.name, href: `/${category.slug}/vienne-86` },
    { label: cityLabel, href: `/${category.slug}/${city.slug}` },
    { label: specialty.name },
  ];
  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  const baseUrl = `/${metier}/${specialite}/${ville}`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      <Breadcrumb items={breadcrumbItems} />

      {/* Hero spécialité */}
      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          {category.name} {specialty.longLabel} à {cityLabel}
        </h1>
        <p className="text-[var(--text-secondary)]">
          {result.count} professionnel{result.count > 1 ? "s" : ""} référencé
          {result.count > 1 ? "s" : ""} pour {specialty.name.toLowerCase()}
        </p>
      </div>

      {/* CTA dépôt de projet (au-dessus de la grille pour la conversion) */}
      <ProjectCtaBanner
        categorySlug={category.slug}
        categoryName={category.name}
        locationSlug={city.slug}
        locationName={cityLabel}
        preposition="à"
      />

      {/* Intro SEO spécifique spécialité */}
      <ListingIntro intro={specialty.intro} />

      {result.data.length > 0 ? (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {result.data.map((pro) => (
            <ProCard key={pro.id} pro={pro} />
          ))}
        </div>
      ) : (
        <EmptyState
          title="Aucun professionnel trouvé"
          message={`Nous n'avons pas encore de ${lower} ${specialty.shortLabel} référencé à ${cityLabel}. Essayez une ville voisine ou élargissez votre recherche.`}
          actionLabel={`Voir tous les ${lower}s à ${cityLabel}`}
          actionHref={`/${category.slug}/${city.slug}`}
        />
      )}

      <Pagination
        currentPage={page}
        totalPages={result.totalPages}
        baseUrl={baseUrl}
      />

      {/* FAQ spécifique spécialité */}
      <FaqAccordion faqs={specialty.faqs} />

      {/* Maillage interne : autres spécialités pour ce métier + cette ville */}
      {otherSpecialties.length > 0 && (
        <section className="mt-16">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Autres spécialités de {lower} à {cityLabel}
          </h2>
          <div className="flex flex-wrap gap-3">
            {otherSpecialties.map((s) => (
              <Link
                key={s.slug}
                href={`/${category.slug}/${s.slug}/${city.slug}`}
                className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {s.name}
              </Link>
            ))}
          </div>
          <div className="mt-6">
            <Link
              href={`/${category.slug}/${city.slug}`}
              className="text-sm text-[var(--accent)] underline hover:no-underline"
            >
              ← Voir tous les {lower}s à {cityLabel} (toutes spécialités)
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

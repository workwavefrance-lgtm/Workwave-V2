import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import GeolocSearch from "@/components/search/GeolocSearch";
import {
  getCategoryBySlug,
  getAllCategories,
} from "@/lib/queries/categories";
import { getAllDepartments } from "@/lib/queries/departments";
import { getCitiesByDepartment } from "@/lib/queries/cities";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { BASE_URL } from "@/lib/constants";
import { toBreadcrumbSchema } from "@/lib/utils/schema";

export const revalidate = 86400; // 24h

type Props = {
  params: Promise<{ metier: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  const category = await getCategoryBySlug(metier);
  if (!category) return {};

  const lower = category.name.toLowerCase();
  const title = `${category.name} à proximité — trouvez un ${lower} près de chez vous | Workwave`;
  const description = `Trouvez votre ${lower} autour de vous. Géolocalisez-vous ou choisissez votre ville pour voir les artisans disponibles à proximité. Devis gratuits, intervention rapide. Service 100% gratuit.`;

  return {
    title,
    description,
    alternates: { canonical: `${BASE_URL}/${metier}` },
    openGraph: {
      type: "website",
      title,
      description,
      url: `${BASE_URL}/${metier}`,
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
    },
  };
}

export default async function MetierProximityPage({ params }: Props) {
  const { metier } = await params;
  const category = await getCategoryBySlug(metier);
  if (!category) notFound();

  // Charger tous les départements actifs + leurs villes (parallèle)
  const departments = await getAllDepartments();
  const deptsWithCities = await Promise.all(
    departments.map(async (dept) => ({
      dept,
      cities: await getCitiesByDepartment(dept.id),
    }))
  );

  const totalCities = deptsWithCities.reduce(
    (acc, d) => acc + d.cities.length,
    0
  );

  // Liste plate des villes (avec lat/lng) pour la géoloc client
  const allCitiesForGeoloc = deptsWithCities.flatMap((d) =>
    d.cities
      .filter(
        (c) => typeof c.latitude === "number" && typeof c.longitude === "number"
      )
      .map((c) => ({
        id: c.id,
        slug: c.slug,
        name: c.name,
        lat: c.latitude as number,
        lng: c.longitude as number,
      }))
  );

  // Métiers similaires (même vertical)
  const allCategories = await getAllCategories();
  const relatedCategories = allCategories
    .filter((c) => c.vertical === category.vertical && c.id !== category.id)
    .slice(0, 12);

  const lower = category.name.toLowerCase();

  // Breadcrumb
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: category.name },
  ];
  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  // FAQ proximity-focused (5 questions)
  const faqs = [
    {
      question: `Comment trouver un ${lower} près de chez moi ?`,
      answer: `Activez la géolocalisation en cliquant sur "Trouver un ${lower} près de moi" ou tapez le nom de votre ville. Workwave affiche les ${lower}s les plus proches de votre adresse, avec coordonnées, certifications et année de création.`,
    },
    {
      question: `Combien coûte un ${lower} en moyenne ?`,
      answer: `Les tarifs varient selon la nature des travaux, la zone géographique et l'urgence. Workwave vous permet de demander des devis gratuits à plusieurs ${lower}s pour comparer en toute transparence avant de vous engager.`,
    },
    {
      question: `Puis-je trouver un ${lower} disponible le week-end ou en urgence ?`,
      answer: `Oui. De nombreux ${lower}s référencés sur Workwave interviennent en urgence et certains sont disponibles 7j/7. Indiquez l'urgence dans votre demande de devis pour être contacté rapidement.`,
    },
    {
      question: `Workwave est-il vraiment gratuit pour les particuliers ?`,
      answer: `100% gratuit, toujours. Aucune carte bancaire demandée, aucun frais caché. Les ${lower}s nous rémunèrent via un abonnement mensuel pour recevoir vos demandes de devis qualifiées.`,
    },
    {
      question: `Comment vérifier qu'un ${lower} est sérieux ?`,
      answer: `Chaque fiche pro affiche le SIRET officiel, l'année de création, les certifications (RGE, Qualibat, assurance décennale) et les moyens de paiement acceptés. Vous pouvez tout vérifier sur le registre Sirene avant de prendre contact.`,
    },
  ];

  // Schema.org Service
  const serviceJsonLd = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${category.name} en France`,
    serviceType: category.name,
    description:
      category.description ||
      `Trouvez un ${lower} près de chez vous avec Workwave.`,
    provider: {
      "@type": "Organization",
      name: "Workwave",
      url: BASE_URL,
    },
    areaServed: deptsWithCities.map(({ dept }) => ({
      "@type": "AdministrativeArea",
      name: `${dept.name} (${dept.code})`,
      containedInPlace: {
        "@type": "Country",
        name: "France",
      },
    })),
  };

  // Schema.org FAQPage
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: faqs.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.answer },
    })),
  };

  return (
    <main>
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={faqJsonLd} />

      <div className="max-w-6xl mx-auto px-4 py-12">
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero proximity */}
        <section className="mb-16">
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold tracking-tight text-[var(--text-primary)] mb-4 leading-[1.1]">
            Trouvez votre {lower}{" "}
            <span className="text-[var(--accent)]">autour de vous</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] max-w-2xl mb-8">
            {totalCities > 0
              ? `${totalCities} villes couvertes`
              : "Service gratuit"}{" "}
            — devis gratuits, intervention rapide, sans intermédiaire commercial.
          </p>

          {/* Composant géoloc + fallback saisie ville */}
          <GeolocSearch
            metierSlug={category.slug}
            metierName={category.name}
            cities={allCitiesForGeoloc}
          />
        </section>

        {/* Carte des départements actifs */}
        {deptsWithCities.length > 0 && (
          <section className="mb-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
              Choisissez votre département
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {deptsWithCities.map(({ dept, cities }) => {
                const slug = generateDepartmentSlug(dept);
                return (
                  <Link
                    key={dept.id}
                    href={`/${category.slug}/${slug}`}
                    className="group bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 transition-all duration-250 hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]"
                  >
                    <div className="text-xs text-[var(--text-tertiary)] mb-1">
                      Département {dept.code}
                    </div>
                    <div className="font-semibold text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-250 mb-2">
                      {dept.name}
                    </div>
                    <div className="text-sm text-[var(--text-secondary)]">
                      {cities.length} villes · {dept.region}
                    </div>
                  </Link>
                );
              })}
            </div>
          </section>
        )}

        {/* Top villes par département (max 10 par dept) */}
        {deptsWithCities.map(({ dept, cities }) => (
          <section key={dept.id} className="mb-16">
            <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
              {category.name} dans les principales villes — {dept.name} (
              {dept.code})
            </h2>
            <div className="flex flex-wrap gap-3">
              {cities.slice(0, 10).map((city) => (
                <Link
                  key={city.id}
                  href={`/${category.slug}/${city.slug}`}
                  className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
                >
                  {city.name}
                </Link>
              ))}
              {cities.length > 10 && (
                <Link
                  href={`/${category.slug}/${generateDepartmentSlug(dept)}`}
                  className="px-4 py-2 bg-[var(--accent)]/10 border border-[var(--accent)]/30 text-[var(--accent)] rounded-full text-sm font-medium hover:bg-[var(--accent)]/20 transition-all duration-250"
                >
                  + {cities.length - 10} autres villes
                </Link>
              )}
            </div>
          </section>
        ))}

        {/* Intro SEO long-form (proximity-focused) */}
        <section className="mb-16 max-w-3xl">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            Comment trouver un {lower} près de chez vous ?
          </h2>
          <div className="text-[var(--text-secondary)] leading-relaxed space-y-4">
            <p>
              Que vous cherchiez un {lower} pour un dépannage urgent, des
              travaux planifiés ou un projet de rénovation, Workwave référence
              des centaines d&apos;artisans qualifiés autour de vous. Activez
              la géolocalisation ci-dessus pour voir directement les
              professionnels les plus proches, ou choisissez votre ville dans
              la liste des départements couverts.
            </p>
            <p>
              Tous les {lower}s référencés sur Workwave sont des entreprises
              immatriculées au registre Sirene. Vous pouvez consulter leur
              SIRET, leur année de création, leurs certifications (RGE,
              Qualibat, assurance décennale, garantie décennale) et leur zone
              d&apos;intervention avant de les contacter. Workwave est et reste
              100% gratuit pour les particuliers, sans frais cachés ni
              commission sur vos devis.
            </p>
            <p>
              Pour aller plus loin, vous pouvez{" "}
              <Link
                href="/deposer-projet"
                className="text-[var(--accent)] underline hover:no-underline"
              >
                déposer votre projet en quelques minutes
              </Link>{" "}
              : nous transmettons votre demande à plusieurs {lower}s pertinents
              dans votre zone. Vous recevez ensuite leurs devis directement,
              sans perdre de temps à les contacter un par un.
            </p>
          </div>
        </section>

        {/* FAQ accordéon (le composant inclut son propre H2) */}
        <FaqAccordion faqs={faqs} />

        {/* Métiers similaires */}
        {relatedCategories.length > 0 && (
          <section className="mt-16">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
              Autres métiers similaires
            </h2>
            <div className="flex flex-wrap gap-3">
              {relatedCategories.map((cat) => (
                <Link
                  key={cat.id}
                  href={`/${cat.slug}`}
                  className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
                >
                  {cat.name}
                </Link>
              ))}
            </div>
          </section>
        )}
      </div>
    </main>
  );
}

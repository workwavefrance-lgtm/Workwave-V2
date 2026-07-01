import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Pagination from "@/components/ui/Pagination";
import ProCard from "@/components/pro/ProCard";
import TopProCard from "@/components/pro/TopProCard";
import EmptyState from "@/components/ui/EmptyState";
import ProjectIntentSection from "@/components/listing/ProjectIntentSection";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import ListingIntro from "@/components/listing/ListingIntro";
import FaqAccordion from "@/components/seo/FaqAccordion";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";
import { getCityBySlug } from "@/lib/queries/cities";
import { getProsByCategoryAndCity } from "@/lib/queries/pros";
import { getTopProsByCategoryAndCity } from "@/lib/queries/top-pros";
import {
  getSpecialty,
  getSpecialtiesForMetier,
  isValidSpecialty,
} from "@/lib/specialties";
import { BASE_URL } from "@/lib/constants";
import { getCategoryListing } from "@/lib/utils/category-grammar";
import { toBreadcrumbSchema } from "@/lib/utils/schema";
import { generateDepartmentSlug } from "@/lib/utils/slugs";

export const revalidate = 2592000; // 30j (30/06) : aligné sur les routes sœurs /[metier] et /[metier]/[location] (déjà 30j). Sous-spécialités × ville = beaucoup d'URL ; à 1h ça re-tapait la base toutes les heures sous le crawl Google = fuite egress majeure. Données Sirene quasi-statiques → 0 impact SEO, et pages plus rapides (servies du cache).

const TOP_LIMIT = 10;

type Props = {
  params: Promise<{ metier: string; location: string; ville: string }>;
  searchParams: Promise<{ page?: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, location, ville } = await params;
  // Au niveau 2, le segment dynamique s'appelle "location" pour cohérence
  // de routing avec [metier]/[location]/page.tsx, mais ici il porte le slug
  // d'une sous-spécialité (ex. "depannage", "renovation-salle-de-bain").
  const specialite = location;

  if (!isValidSpecialty(metier, specialite)) return {};

  const category = await getCategoryBySlug(metier);
  const specialty = getSpecialty(metier, specialite);
  const city = await getCityBySlug(ville);
  if (!category || !specialty || !city) return {};

  const result = await getProsByCategoryAndCity(category.id, city.id, {
    page: 1,
    pageSize: 1,
  });
  const prosCount = result.count;
  const displayCount = Math.min(prosCount, TOP_LIMIT);
  const listing = getCategoryListing(category.slug, category.name);
  const meilleurs = listing.notes === "notées" ? "meilleures" : "meilleurs";
  const pluralCategory = listing.plural;
  const currentYear = new Date().getFullYear();

  // Title plus court adapté à la sous-spécialité (sans « | Devis gratuit | Workwave ») :
  // "Top 10 entreprises de ménage spécialisées en repassage à Poitiers — 2026"
  let title: string;
  if (prosCount === 0) {
    title = `${category.name} ${specialty.shortLabel} à ${city.name}`;
  } else if (prosCount === 1) {
    title = `${listing.singular.charAt(0).toUpperCase() + listing.singular.slice(1)} ${specialty.shortLabel} à ${city.name} — ${currentYear}`;
  } else {
    title = `Top ${displayCount} ${pluralCategory} ${specialty.shortLabel} à ${city.name} — ${currentYear}`;
  }

  const description =
    prosCount > 0
      ? `Sélection des ${displayCount} ${meilleurs} ${pluralCategory} ${specialty.shortLabel} à ${city.name} en ${currentYear}. ${specialty.description}`
      : specialty.description;

  return {
    title: { absolute: title },
    description: description.length > 160 ? description.slice(0, 157) + "…" : description,
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
  const specialite = location;
  const { page: pageParam } = await searchParams;
  const page = Math.max(1, parseInt(pageParam || "1", 10) || 1);
  const isFirstPage = page === 1;

  if (!isValidSpecialty(metier, specialite)) notFound();

  const category = await getCategoryBySlug(metier);
  if (!category) notFound();

  // Anti-fuite vertical : categorie AI ne doit pas s'afficher sur route BTP.
  if (AI_CATEGORY_IDS.includes(category.id)) {
    permanentRedirect(`/ai/${category.slug}`);
  }

  const specialty = getSpecialty(metier, specialite);
  if (!specialty) notFound();

  const city = await getCityBySlug(ville);
  if (!city) notFound();

  const currentYear = new Date().getFullYear();
  const lower = category.name.toLowerCase();
  const cityLabel = city.name;
  const listing = getCategoryListing(category.slug, category.name);
  const meilleurs = listing.notes === "notées" ? "meilleures" : "meilleurs";
  const pluralCategory = listing.plural;

  // Page 1 : fetch les TOP N tries par score + total.
  // Pages 2+ : pagination classique sur tous les pros (ordre alpha).
  let topPros: Awaited<ReturnType<typeof getTopProsByCategoryAndCity>>["tops"] = [];
  let totalProsCount = 0;
  let paginatedResult: Awaited<ReturnType<typeof getProsByCategoryAndCity>> | null = null;

  if (isFirstPage) {
    const topResult = await getTopProsByCategoryAndCity(
      category.id,
      city.id,
      TOP_LIMIT
    );
    topPros = topResult.tops;
    totalProsCount = topResult.total;
  } else {
    paginatedResult = await getProsByCategoryAndCity(category.id, city.id, {
      page,
    });
    totalProsCount = paginatedResult.count;
  }

  // 308 vers la page département de la VILLE si aucun pro pour ce
  // couple (cat × ville). Évite les URLs noindex pollutives en GSC.
  if (totalProsCount === 0) {
    const cityDeptSlug = generateDepartmentSlug(city.department);
    permanentRedirect(`/${metier}/${cityDeptSlug}`);
  }

  const displayCount = Math.min(totalProsCount, TOP_LIMIT);

  // Autres spécialités du même métier (pour maillage interne dense)
  const otherSpecialties = getSpecialtiesForMetier(metier).filter(
    (s) => s.slug !== specialite
  );

  // Schema.org Service (sans aggregateRating : Google rejette les review
  // snippets sur ce type, cf. fix 26/05/2026).
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const serviceJsonLd: any = {
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
  // NB : pas d'aggregateRating sur le Service global. Google rejette les review
  // snippets sur le type Service ("Type d'objet non valide pour le champ parent"
  // GSC 26/05/2026) + contre les guidelines (auto-attribution). Les vrais
  // aggregateRating restent sur les LocalBusiness individuels de l'ItemList.

  // Schema ItemList enrichi : LocalBusiness complet (adresse + telephone +
  // aggregateRating si dispo) pour activer les rich snippets ★ dans Google
  // + signal LLM (Perplexity, AI Overviews).
  const itemsForSchema = isFirstPage ? topPros : (paginatedResult?.data ?? []);
  const schemaStartPos = isFirstPage
    ? 1
    : (page - 1) * (paginatedResult?.pageSize ?? 20) + 1;
  const itemListJsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isFirstPage
      ? `Les ${displayCount} ${meilleurs} ${pluralCategory} ${specialty.shortLabel} à ${cityLabel}`
      : `${category.name} ${specialty.shortLabel} à ${cityLabel}`,
    numberOfItems: totalProsCount,
    itemListElement: itemsForSchema.map((pro, i) => {
      const proUrl = `${BASE_URL}/artisan/${pro.slug}`;
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const business: any = {
        "@type": "LocalBusiness",
        "@id": proUrl,
        name: pro.name,
        url: proUrl,
      };
      if (pro.address && pro.city) {
        business.address = {
          "@type": "PostalAddress",
          streetAddress: pro.address,
          addressLocality: pro.city.name,
          ...(pro.postal_code ? { postalCode: pro.postal_code } : {}),
          addressCountry: "FR",
        };
      }
      if (pro.phone) business.telephone = pro.phone;
      // Agregat Workwave + Google si dispo
      const wwCount = pro.workwave_reviews_count ?? 0;
      const wwAvg = pro.workwave_reviews_avg ?? 0;
      const gRating = pro.google_rating ?? 0;
      const gCount = pro.google_reviews_count ?? 0;
      if (wwCount > 0 || gCount > 0) {
        const totalCount = wwCount + gCount;
        const weightedSum = wwAvg * wwCount + gRating * gCount;
        const aggregateValue = Math.round((weightedSum / totalCount) * 10) / 10;
        business.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: aggregateValue,
          reviewCount: totalCount,
          bestRating: 5,
          worstRating: 1,
        };
      }
      return {
        "@type": "ListItem",
        position: schemaStartPos + i,
        item: business,
      };
    }),
  };

  // Schema FAQPage (specifique a la specialty, garde)
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
  const cityDeptSlug = generateDepartmentSlug(city.department);
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: category.name, href: `/${category.slug}/${cityDeptSlug}` },
    { label: cityLabel, href: `/${category.slug}/${city.slug}` },
    { label: specialty.name },
  ];
  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  const baseUrl = `/${metier}/${specialite}/${ville}`;

  // H1 SOBRE style Travaux.com (le clickbait reste dans le title pour le CTR SERP).
  const h1Title = isFirstPage
    ? `${category.name} ${specialty.shortLabel} à ${cityLabel}`
    : `${category.name} ${specialty.shortLabel} à ${cityLabel} — page ${page}`;

  const subTitle =
    totalProsCount === 1
      ? `1 artisan référencé pour ${specialty.name.toLowerCase()}`
      : `${totalProsCount} artisans référencés · Sélection objective par profil, certifications et avis`;

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={itemListJsonLd} />
      <JsonLd data={faqJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Bar fine sticky top */}
      <StickyProjectCTA
        categorySlug={category.slug}
        categoryName={category.name}
        citySlug={city.slug}
        locationName={cityLabel}
        preposition="à"
        specialitySlug={specialty.slug}
      />

      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          {h1Title}
        </h1>
        <p className="text-[var(--text-secondary)]">{subTitle}</p>
      </div>

      {/* Section "Quel est votre projet ?" avec specialty active highlightee */}
      {isFirstPage && (
        <ProjectIntentSection
          categorySlug={category.slug}
          categoryName={category.name}
          citySlug={city.slug}
          locationName={cityLabel}
          currentSpecialty={specialty.slug}
        />
      )}

      {/* Intro SEO de la specialty (contenu unique long-tail editorial) */}
      <ListingIntro intro={specialty.intro} />

      {/* Liste principale : TopProCard sur page 1, ProCard pages 2+ */}
      {isFirstPage ? (
        topPros.length > 0 ? (
          <>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6 mt-4">
              {topPros.map((pro, i) => (
                <TopProCard
                  key={pro.id}
                  pro={pro}
                  rank={i + 1}
                  categorySlug={category.slug}
                  citySlug={city.slug}
                  specialitySlug={specialty.slug}
                />
              ))}
            </div>

            {totalProsCount > TOP_LIMIT && (
              <div className="mt-8 flex justify-center">
                <Link
                  href={`${baseUrl}?page=2`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-medium transition-all duration-200"
                >
                  Voir tous les {totalProsCount} {pluralCategory} à {cityLabel}
                  <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                    <path d="M5 12h14M13 6l6 6-6 6" />
                  </svg>
                </Link>
              </div>
            )}
          </>
        ) : (
          <EmptyState
            title="Aucun professionnel trouvé"
            message={`Nous n'avons pas encore de ${lower} ${specialty.shortLabel} référencé à ${cityLabel}.`}
            actionLabel={`Voir tous les ${pluralCategory} à ${cityLabel}`}
            actionHref={`/${category.slug}/${city.slug}`}
          />
        )
      ) : paginatedResult && paginatedResult.data.length > 0 ? (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {paginatedResult.data.map((pro) => (
              <ProCard key={pro.id} pro={pro} />
            ))}
          </div>
          <Pagination
            currentPage={page}
            totalPages={paginatedResult.totalPages}
            baseUrl={baseUrl}
          />
        </>
      ) : (
        <EmptyState
          title="Aucun résultat sur cette page"
          message="Retournez à la première page pour découvrir notre sélection des meilleurs artisans."
          actionLabel="Voir le Top"
          actionHref={baseUrl}
        />
      )}

      {/* FAQ specifique a la specialty (contenu editorial unique) */}
      <FaqAccordion faqs={specialty.faqs} />

      {/* Maillage interne : autres specialites pour ce metier + cette ville */}
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
              ← Voir tous les {pluralCategory} à {cityLabel} (toutes spécialités)
            </Link>
          </div>
        </section>
      )}
    </main>
  );
}

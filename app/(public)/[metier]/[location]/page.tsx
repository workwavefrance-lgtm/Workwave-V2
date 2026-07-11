import type { Metadata } from "next";
import Link from "next/link";
import { notFound, permanentRedirect } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import Pagination from "@/components/ui/Pagination";
import ProCard from "@/components/pro/ProCard";
import TopProCard from "@/components/pro/TopProCard";
import EmptyState from "@/components/ui/EmptyState";
import InternalLinks from "@/components/listing/InternalLinks";
import PopularProjectsBlock from "@/components/listing/PopularProjectsBlock";
import ProjectIntentSection from "@/components/listing/ProjectIntentSection";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import InlineProjectForm from "@/components/project/InlineProjectForm";
import ProgrammaticSeoSections from "@/components/listing/ProgrammaticSeoSections";
import ListingIntro from "@/components/listing/ListingIntro";
import OtherDepartmentsBlock from "@/components/listing/OtherDepartmentsBlock";
import DuplicateNoticeBlock from "@/components/listing/DuplicateNoticeBlock";
import CityFactsBlock from "@/components/listing/CityFactsBlock";
import DeptMarketBlock from "@/components/listing/DeptMarketBlock";
import { DEPARTMENT_MARKET } from "@/lib/data/department-market";
import JsonLd from "@/components/seo/JsonLd";
import { getCategoryBySlug, getAllCategories, getPopularCategoriesInCity } from "@/lib/queries/categories";
import { resolveLocation } from "@/lib/queries/location";
import {
  getProsByCategoryAndDepartment,
  getProsByCategoryAndCity,
  getProsByCategoryAndCityIds,
} from "@/lib/queries/pros";
import {
  getTopProsByCategoryAndCity,
  getTopProsByCategoryAndCityIds,
  getTopProsByCategoryAndDepartment,
} from "@/lib/queries/top-pros";
import {
  getNearbyCities,
  getCitiesByDepartment,
  getAggregatedCityIds,
} from "@/lib/queries/cities";
import { getAllDepartmentsPublic } from "@/lib/queries/home-public";
import { getPriceGuidesByMetier } from "@/lib/queries/price-guides";
import { getCommuneData } from "@/lib/queries/commune-data";
import { getSeoContent } from "@/lib/queries/seo-pages";
import SeoContent from "@/components/seo/SeoContent";
import FaqAccordion from "@/components/seo/FaqAccordion";
import { BASE_URL } from "@/lib/constants";
import { getCategoryListing } from "@/lib/utils/category-grammar";
import { buildListingFaq } from "@/lib/seo/listing-faq";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { extractIntro, stripIntro } from "@/lib/utils/seo";
import {
  generateDepartmentSlug,
  formatDepartmentLabel,
  departmentPreposition,
} from "@/lib/utils/slugs";
import { generateSeoContent } from "@/lib/seo/seo-sections";

const TOP_LIMIT = 10;

export const revalidate = 2592000; // 30j (15/06) : egress Supabase 313% sous crawl ; donnees Sirene quasi-statiques, 0 impact SEO ; un deploiement reset le cache ISR de toute facon. // 7j (13/06) // 24h (11/06)

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
      ? formatDepartmentLabel(resolved.department)
      : resolved.city.name;

  const preposition =
    resolved.type === "department"
      ? departmentPreposition(resolved.department)
      : "à";
  const currentYear = new Date().getFullYear();

  const locationId =
    resolved.type === "department"
      ? resolved.department.id
      : resolved.city.id;
  const seo = await getSeoContent(
    category.id,
    locationId,
    resolved.type === "department" ? "department" : "city"
  );

  // Compter les pros pour cette combinaison. Ville "parent" agrégée
  // (Marseille → arrondissements, Monaco → communes frontalières) : on agrège
  // (null pour toute autre ville → aucune query en plus).
  const aggIds =
    resolved.type === "city" ? await getAggregatedCityIds(resolved.city) : null;
  const result =
    resolved.type === "department"
      ? await getProsByCategoryAndDepartment(category.id, resolved.department.id, { page: 1, pageSize: 1 })
      : aggIds
        ? await getProsByCategoryAndCityIds(category.id, aggIds, { page: 1, pageSize: 1 })
        : await getProsByCategoryAndCity(category.id, resolved.city.id, { page: 1, pageSize: 1 });

  const prosCount = result.count;
  const displayCount = Math.min(prosCount, TOP_LIMIT);
  const listing = getCategoryListing(category.slug, category.name);
  const meilleurs = listing.notes === "notées" ? "meilleures" : "meilleurs";

  // Title plus court, optimise CTR SERP (sans « | Devis gratuit | Workwave »).
  // "Top 10 entreprises de ménage les mieux notées à Poitiers — 2026"
  // Si peu de pros, on adapte le nombre.
  let dynamicTitle: string;
  if (prosCount === 0) {
    dynamicTitle = `${category.name} ${preposition} ${locationName}`;
  } else if (prosCount === 1) {
    dynamicTitle = `${listing.singular.charAt(0).toUpperCase() + listing.singular.slice(1)} ${preposition} ${locationName} — ${currentYear}`;
  } else {
    dynamicTitle = `Top ${displayCount} ${listing.plural} les mieux ${listing.notes} ${preposition} ${locationName} — ${currentYear}`;
  }

  // PRIORITE au nouveau title (sprint 25/05/2026).
  // L'ancien seo.title du sprint 3 est en format "X à Y — N pros"
  // qui n'est PAS optimise CTR. On force le nouveau format meme sur les
  // 588 pages avec seo_pages rempli. `absolute` pour ne PAS suffixer
  // « | Workwave » (template du root layout) — titre court = meilleur CTR.
  const title = dynamicTitle;

  // Meta description enrichie : case un MAXIMUM de secondaires naturels
  // (devis gratuits, intervention rapide, avis vérifiés, tarifs transparents)
  // tout en restant ≤ 160 caractères. Fallback raccourci pour les noms longs.
  let description: string;
  if (prosCount > 0) {
    const full = `Comparez les ${displayCount} ${meilleurs} ${listing.plural} ${preposition} ${locationName} : devis gratuits, intervention rapide, avis vérifiés et tarifs transparents.`;
    description =
      full.length <= 160
        ? full
        : `Comparez les ${displayCount} ${meilleurs} ${listing.plural} ${preposition} ${locationName} : devis gratuits, intervention rapide, avis vérifiés.`;
  } else {
    description = `Trouvez ${listing.article} ${listing.singular} ${preposition} ${locationName}. Devis gratuits, intervention rapide.`;
  }

  return {
    title: { absolute: title },
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
  const isFirstPage = page === 1;

  const category = await getCategoryBySlug(metier);
  if (!category) notFound();

  // Anti-fuite vertical : AUCUNE catégorie tech sur une route BTP. Test du
  // VERTICAL (pas une liste d'ids) → couvre les 145 cat tech, pas seulement les
  // 14 d'AI_CATEGORY_IDS. Redirect 308 vers /ai/[slug] (preserve SEO + bon vertical).
  if (category.vertical === "tech") {
    permanentRedirect(`/ai/${category.slug}`);
  }

  const resolved = await resolveLocation(locationSlug);
  if (!resolved) notFound();

  const locationName =
    resolved.type === "department"
      ? formatDepartmentLabel(resolved.department)
      : resolved.city.name;

  const preposition =
    resolved.type === "department"
      ? departmentPreposition(resolved.department)
      : "à";
  const currentYear = new Date().getFullYear();

  // Page 1 : fetch les TOP N tries par score + total.
  // Pages 2+ : pagination classique sur tous les pros (ordre alpha).
  let topPros: Awaited<ReturnType<typeof getTopProsByCategoryAndCity>>["tops"] = [];
  let totalProsCount = 0;
  let paginatedResult: Awaited<ReturnType<typeof getProsByCategoryAndCity>> | null = null;

  // Ville "parent" agrégée : Marseille/Lyon/Paris → arrondissements (page
  // "plombier marseille" = la plus volumineuse) ; Monaco → communes françaises
  // frontalières qui interviennent à Monaco (mise en relation transfrontalière).
  // `null` pour toute autre ville → aucune query supplémentaire.
  const aggCityIds =
    resolved.type === "city" ? await getAggregatedCityIds(resolved.city) : null;

  if (isFirstPage) {
    const topResult =
      resolved.type === "department"
        ? await getTopProsByCategoryAndDepartment(category.id, resolved.department.id, TOP_LIMIT)
        : aggCityIds
          ? await getTopProsByCategoryAndCityIds(category.id, aggCityIds, TOP_LIMIT)
          : await getTopProsByCategoryAndCity(category.id, resolved.city.id, TOP_LIMIT);
    topPros = topResult.tops;
    totalProsCount = topResult.total;
  } else {
    paginatedResult =
      resolved.type === "department"
        ? await getProsByCategoryAndDepartment(category.id, resolved.department.id, { page })
        : aggCityIds
          ? await getProsByCategoryAndCityIds(category.id, aggCityIds, { page })
          : await getProsByCategoryAndCity(category.id, resolved.city.id, { page });
    totalProsCount = paginatedResult.count;
  }

  // 308 vers la page département de la VILLE concernée si aucun pro dans cette
  // ville pour ce métier. Évite les URLs noindex pollutives en GSC, transmet le
  // link juice à la bonne page département (pas vienne-86 par défaut !), et la
  // page redevient indexable automatiquement dès qu'un pro est ajouté pour cette
  // commune.
  // ATTENTION : pas de loading.tsx dans cette route ! Le streaming Suspense
  // commit le status 200 avant que la page puisse throw permanentRedirect/notFound.
  // Cf. lecon apprise CLAUDE.md du 2026-04-18.
  if (resolved.type === "city" && totalProsCount === 0) {
    const cityDeptSlug = generateDepartmentSlug(resolved.city.department);
    permanentRedirect(`/${metier}/${cityDeptSlug}`);
  }

  const displayCount = Math.min(totalProsCount, TOP_LIMIT);
  const listing = getCategoryListing(category.slug, category.name);
  const meilleurs = listing.notes === "notées" ? "meilleures" : "meilleurs";
  const pluralCategory = listing.plural;
  const citySlug = resolved.type === "city" ? resolved.city.slug : null;

  const allCategories = await getAllCategories();
  const relatedCategories = allCategories
    .filter((c) => c.vertical === category.vertical && c.id !== category.id)
    .slice(0, 8);

  // Projets populaires : maillage par prestation via les guides de prix BTP
  // (scope='prestation'). Affiche seulement si le metier a des guides rattaches.
  const popularProjects = await getPriceGuidesByMetier(category.slug, 12);

  // Enrichissement commune (data.gouv.fr : prix immo DVF, revenus, vacance,
  // densité) — uniquement pour les pages VILLE (pas dept), affiché dans
  // CityFactsBlock. Vraie donnée unique factuelle par commune = moat SEO.
  // ⚠️ FRANCE UNIQUEMENT : commune_data est keyée par code INSEE français, et
  // les codes NIS belges (5 chiffres) CHEVAUCHENT les plages INSEE (ex. 21004
  // = commune de Côte-d'Or ET Bruxelles-ville). Sans ce garde, une page ville
  // belge afficherait les prix immobiliers d'un village français.
  const communeData =
    resolved.type === "city" && resolved.city.country !== "BE"
      ? await getCommuneData(resolved.city.insee_code)
      : null;

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
  // Charge en plus les 12 dept de Nouvelle-Aquitaine UNIQUEMENT pour les pages
  // dept (pour le bloc "autres departements" en bas). Sur les pages ville on
  // economise la query : pas de bloc inter-dept au niveau ville.
  let allDepartments: Awaited<ReturnType<typeof getAllDepartmentsPublic>> = [];
  if (resolved.type === "city") {
    [nearbyCities, popularCategories] = await Promise.all([
      getNearbyCities(resolved.city.id, 8),
      getPopularCategoriesInCity(resolved.city.id, category.id, 6),
    ]);
  } else {
    const [deptCities, depts] = await Promise.all([
      getCitiesByDepartment(resolved.department.id, 15), // n'affiche que 10 (slice) — limite l'egress
      getAllDepartmentsPublic(),
    ]);
    nearbyCities = deptCities.slice(0, 10);
    allDepartments = depts;
  }

  // Schema ItemList enrichi : chaque item est un LocalBusiness complet
  // (adresse + telephone + aggregateRating si Google data dispo). Bien
  // meilleur pour les LLMs (Perplexity, AI Overviews) qui digerent des
  // entites nommees structurees, et active les rich snippets etoiles
  // dans la SERP Google quand on a une note.
  const itemsForSchema = isFirstPage ? topPros : (paginatedResult?.data ?? []);
  const schemaStartPos = isFirstPage
    ? 1
    : (page - 1) * (paginatedResult?.pageSize ?? 20) + 1;
  const jsonLd = {
    "@context": "https://schema.org",
    "@type": "ItemList",
    name: isFirstPage
      ? `Les ${displayCount} ${meilleurs} ${pluralCategory} ${preposition} ${locationName}`
      : `${category.name} ${preposition} ${locationName}`,
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
          // Pays de la PAGE (province belge → BE) : les pros listés sont tous
          // de la zone, et pro.city n'embarque pas department.country ici.
          addressCountry:
            resolved.type === "department"
              ? resolved.department.country === "BE"
                ? "BE"
                : "FR"
              : resolved.city.department?.country === "BE"
                ? "BE"
                : "FR",
        };
      }
      if (pro.phone) business.telephone = pro.phone;
      if (pro.google_rating && pro.google_reviews_count && pro.google_reviews_count > 0) {
        business.aggregateRating = {
          "@type": "AggregateRating",
          ratingValue: pro.google_rating,
          reviewCount: pro.google_reviews_count,
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

  // Breadcrumb : le lien "Catégorie" pointe vers le département de la
  // location courante (et non vienne-86 hardcodé). Pour une page dept, c'est
  // self-référent → on retire ce niveau pour pas avoir un breadcrumb incohérent.
  const breadcrumbDept =
    resolved.type === "department" ? resolved.department : resolved.city.department;
  const breadcrumbDeptSlug = generateDepartmentSlug(breadcrumbDept);
  const breadcrumbItems =
    resolved.type === "department"
      ? [
          { label: "Accueil", href: "/" },
          { label: category.name, href: `/${category.slug}` },
          { label: locationName },
        ]
      : [
          { label: "Accueil", href: "/" },
          { label: category.name, href: `/${category.slug}/${breadcrumbDeptSlug}` },
          { label: locationName },
        ];

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  const baseUrl = `/${metier}/${locationSlug}`;

  // H1 SOBRE style Travaux.com : "Trouver un plombier à Poitiers".
  // Le title clickbait reste pour le CTR SERP, le H1 reste institutionnel
  // pour la cohérence du contenu de la page.
  const h1Title = isFirstPage
    ? totalProsCount === 0
      ? `${category.name} ${preposition} ${locationName}`
      : `Trouver ${listing.article} ${listing.singular} ${preposition} ${locationName}`
    : `Tous les ${pluralCategory} ${preposition} ${locationName} — page ${page}`;

  // Sous-titre (count d'artisans + signal sélection objective)
  const subTitle =
    totalProsCount === 0
      ? "Aucun artisan référencé pour le moment"
      : totalProsCount === 1
        ? `1 ${listing.singular} référencé en ${currentYear}`
        : `Top ${displayCount} ${pluralCategory} parmi ${totalProsCount} référencés ${preposition} ${locationName} en ${currentYear} · Sélection objective par profil, certifications et avis`;

  // Sections SEO programmatiques (6 H2 + FAQ avec data unique par dept)
  const seoSectionsContent = isFirstPage && totalProsCount > 0
    ? generateSeoContent({
        category: { slug: category.slug, name: category.name, vertical: category.vertical },
        city: resolved.type === "city" ? resolved.city : null,
        department: resolved.type === "department" ? resolved.department : resolved.city.department,
        prosCount: totalProsCount,
      })
    : null;

  // FAQ programmatique "mots-clés longue traîne" (prix / urgence / pas cher /
  // RGE / devis gratuit). Affichée UNIQUEMENT quand il y a des pros ET qu'il
  // n'existe PAS déjà de seo.faq_json (sinon doublon FAQ + double schema).
  const showKwFaq = totalProsCount > 0 && !(seo?.faq_json && seo.faq_json.length > 0);
  const kwFaq = showKwFaq
    ? buildListingFaq({
        categorySlug: category.slug,
        categoryName: category.name,
        locationName,
        preposition,
        isBtp: category.vertical === "btp",
      })
    : [];

  const serviceJsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "Service",
    name: `${category.name} ${preposition} ${locationName}`,
    serviceType: category.name,
    description: `Service de mise en relation avec ${listing.article} ${listing.singular} ${preposition} ${locationName}.`,
    provider: {
      "@type": "Organization",
      name: "Workwave",
      url: BASE_URL,
    },
    areaServed: {
      "@type": resolved.type === "department" ? "AdministrativeArea" : "City",
      name: locationName,
    },
  };
  // NB : on NE met PAS d'aggregateRating sur le Service global. Google rejette
  // les review snippets sur le type Service ("Type d'objet non valide pour le
  // champ parent" en GSC, detecte 26/05/2026) + c'est contre les guidelines
  // Google (auto-attribution de notes par le site lui-meme). Les vrais
  // aggregateRating restent sur les LocalBusiness individuels (fiches pros
  // dans l'ItemList ci-dessous) = source legitime et acceptee par Google.

  return (
    <main className="max-w-6xl mx-auto px-4 py-12">
      <JsonLd data={jsonLd} />
      <JsonLd data={serviceJsonLd} />
      <JsonLd data={breadcrumbJsonLd} />

      {/* Bar fine sticky top qui apparait au scroll. Capture du lead
          pendant que l'user parcourt la liste / FAQ / liens internes. */}
      {totalProsCount > 0 && (
        <StickyProjectCTA
          categorySlug={category.slug}
          categoryName={category.name}
          citySlug={citySlug}
          locationName={locationName}
          preposition={preposition}
        />
      )}

      <Breadcrumb items={breadcrumbItems} />

      <div className="mb-8">
        <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          {h1Title}
        </h1>
        <p className="text-[var(--text-secondary)]">{subTitle}</p>
      </div>

      {/* Transparence zone transfrontalière Monaco : on n'invente aucune
          entreprise monégasque. On affiche les artisans RÉELS de la Riviera
          frontalière qui interviennent à Monaco, et chaque fiche montre leur
          vraie ville d'origine. */}
      {resolved.type === "city" && resolved.city.slug === "monaco" && (
        <div className="mb-6 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-4 py-4 sm:px-5 text-sm leading-relaxed text-[var(--text-secondary)]">
          <span className="font-semibold text-[var(--text-primary)]">
            Mise en relation pour Monaco.
          </span>{" "}
          Monaco étant un État souverain, ces professionnels sont basés dans les
          communes françaises{" "}
          <span className="font-semibold text-[var(--text-primary)]">frontalières</span>{" "}
          (Beausoleil, Cap-d&apos;Ail, Roquebrune-Cap-Martin, La Turbie) et
          interviennent à Monaco. La ville d&apos;origine de chaque artisan est
          affichée sur sa fiche.
        </div>
      )}

      {/* Section "Quel est votre projet ?" : capture du lead AVANT la liste.
          Pattern Travaux.com. Affichee uniquement sur page 1 (sur les pages
          paginees l'user a deja "passe la porte"). */}
      {isFirstPage && totalProsCount > 0 && (
        <ProjectIntentSection
          categorySlug={category.slug}
          categoryName={category.name}
          citySlug={citySlug}
          locationName={locationName}
        />
      )}

      {/* Intro SEO depuis seo_pages.content (sprint 3). On ne genere PLUS
          de fallback generique : le H1 + sous-titre + section "Quel est
          votre projet ?" couvrent deja la rassurance + l'intent. Eviter
          le doublon visuel et la repetition de mots-cles sans valeur SEO
          ajoutee. Sur les 588 pages avec contenu SEO custom, l'intro
          extraite reste affichee. */}
      <ListingIntro intro={extractIntro(seo?.content)} />

      {/* Liste principale : TopProCard sur page 1, ProCard classique pages 2+ */}
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
                  citySlug={citySlug}
                />
              ))}
            </div>

            {/* Lien vers la liste complète si on a plus de TOP_LIMIT pros */}
            {totalProsCount > TOP_LIMIT && (
              <div className="mt-8 flex justify-center">
                <Link
                  href={`${baseUrl}?page=2`}
                  className="inline-flex items-center gap-2 px-6 py-3 rounded-full border border-[var(--card-border)] text-[var(--text-primary)] hover:border-[var(--accent)] hover:text-[var(--accent)] font-medium transition-all duration-200"
                >
                  Voir tous les {totalProsCount} {pluralCategory} {preposition} {locationName}
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
            message={`Nous n'avons pas encore de ${category.name.toLowerCase()} référencé ${preposition} ${locationName}.`}
            actionLabel="Rechercher ailleurs"
            actionHref="/recherche"
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

      {/* Anti-doublon : sur les 588 pages avec seo.content custom (sprint 3),
          on a deja "Comment choisir", "Prix", "Questions frequentes" generes
          par Claude API. Nos nouvelles sections programmatiques d'hier feraient
          doublon avec les memes thematiques.
          → Si seo.content existe : on garde seulement le contenu custom Claude
          → Sinon : on injecte les sections programmatiques (6 H2 + FAQ) */}
      {seo && stripIntro(seo.content) ? (
        <SeoContent content={stripIntro(seo.content)} />
      ) : (
        seoSectionsContent && (
          <ProgrammaticSeoSections content={seoSectionsContent} />
        )
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

      {/* FAQ "mots-clés longue traîne" (prix / urgence / pas cher / RGE /
          devis). Mutuellement exclusive avec la FAQ seo.faq_json ci-dessus
          (cf. showKwFaq) → jamais de doublon FAQ ni de double schema FAQPage. */}
      {kwFaq.length > 0 && (
        <>
          <JsonLd
            data={getFaqSchema(
              kwFaq.map((f) => ({ question: f.question, answer: f.answer }))
            )}
          />
          <FaqAccordion
            faqs={kwFaq}
            title={`Questions fréquentes sur ${listing.plural} ${preposition} ${locationName}`}
          />
        </>
      )}

      {/* Form de dépôt projet inline : capture les visiteurs qui ont scrollé
          la liste sans cliquer une fiche pro (= intention forte, lead chaud).
          Pré-remplissage catégorie + ville → l'user arrive directement à
          l'étape 3 (Projet) du form, saute Métier + Ville. Zéro redirect = +50%
          conversion attendue vs StickyProjectCTA qui redirige vers /deposer-projet. */}
      {totalProsCount > 0 && (
        <InlineProjectForm
          category={{ id: category.id, name: category.name }}
          city={
            resolved.type === "city"
              ? { id: resolved.city.id, name: resolved.city.name }
              : null
          }
        />
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

      {/* Projets populaires : maillage par prestation (guides de prix BTP).
          Reprend la mecanique travaux.com mais alimente par nos guides sources.
          Affiche uniquement si le metier a des guides rattaches en base. */}
      <PopularProjectsBlock guides={popularProjects} metierName={category.name} />

      {/* Bloc CityFacts : passage factuel "X en chiffres" affiche UNIQUEMENT
          sur les pages ville (pas dept) et seulement si la commune a une
          population en base. Source INSEE deja en base (cities.population),
          plus estimations derivees standard (logements). Contenu unique
          factuel par ville pour le SEO local + signal LLM. */}
      {resolved.type === "city" && resolved.city.population && (
        <CityFactsBlock
          city={resolved.city}
          categoryName={category.name}
          prosCount={totalProsCount}
          communeData={communeData}
        />
      )}

      {/* Bloc "Marche immobilier en [dept]" : VRAIES donnees data.gouv.fr
          agregees au niveau departement (DVF prix, FiLoSoFi revenus, LOVAC
          vacance, ponderees population, gate de representativite applique a la
          generation). Affiche UNIQUEMENT sur les pages dept et seulement si la
          donnee est exploitable. Contenu unique factuel par dept = moat SEO. */}
      {resolved.type === "department" && (
        <DeptMarketBlock
          deptName={resolved.department.name}
          deptCode={resolved.department.code}
          categoryName={category.name}
          market={DEPARTMENT_MARKET[resolved.department.code] ?? null}
        />
      )}

      {/* Encart doublons : invite les pros qui voient leur entreprise en
          double a reclamer la bonne fiche et a contacter l'admin pour
          fusionner. Affiche UNIQUEMENT quand count > 1 (sinon pas de
          doublon possible visible sur la page courante). Strategie :
          convertir un probleme (doublons hereites Sirene/Apify) en levier
          d'engagement (le pro identifie lui-meme sa bonne fiche). */}
      {totalProsCount > 1 && (
        <DuplicateNoticeBlock
          categoryName={category.name}
          locationName={locationName}
        />
      )}

      {/* Bloc inter-dept : visible UNIQUEMENT sur les pages departement.
          Pousse 11 liens internes vers /[metier]/[autre-dept] pour booster
          la decouverte des pages dept hors-Vienne par Google (audit 2026-05-03). */}
      {resolved.type === "department" && allDepartments.length > 0 && (
        <OtherDepartmentsBlock
          currentCategorySlug={category.slug}
          currentCategoryName={category.name}
          currentDepartmentCode={resolved.department.code}
          allDepartments={allDepartments}
        />
      )}
    </main>
  );
}

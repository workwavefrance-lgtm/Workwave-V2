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
// Lecture publique sans cookies (garde la page cachable en ISR). Sert au
// contre-comptage avant la redirection permanente, cf. plus bas.
import { createPublicClient } from "@/lib/supabase/public-client";
import SeoContent from "@/components/seo/SeoContent";
import FaqAccordion from "@/components/seo/FaqAccordion";
import { BASE_URL, DEFAULT_PAGE_SIZE } from "@/lib/constants";
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
import { getBelgicisme } from "@/lib/data/belgicismes";
import { getBeAlias } from "@/lib/data/be-aliases";

const TOP_LIMIT = 10;

export const revalidate = 2592000; // 30j (15/06) : egress Supabase 313% sous crawl ; donnees Sirene quasi-statiques, 0 impact SEO ; un deploiement reset le cache ISR de toute facon. // 7j (13/06) // 24h (11/06)

type Props = {
  params: Promise<{ metier: string; location: string }>;
};

// Sans generateStaticParams, Next.js classe la route en RENDU DYNAMIQUE et
// ignore `revalidate`. Liste vide = on ne prebuild rien, mais la route bascule
// en ISR : 1re visite -> generee ET mise en cache.
export function generateStaticParams() {
  return [];
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, location: locationSlug } = await params;
  // Alias belge (plafonneur=plaquiste, entreprise-de-chassis=menuisier) : on
  // résout la catégorie PARENTE mais on affiche le nom belge (voir be-aliases.ts).
  const alias = getBeAlias(metier);
  const parentCategory = await getCategoryBySlug(alias ? alias.parentSlug : metier);
  const resolved = await resolveLocation(locationSlug);

  if (!parentCategory || !resolved) return {};

  // Un alias belge n'est servi QUE sur une location belge (sinon on servirait
  // les plaquistes français sous le nom « Plafonneur » = duplicate content FR).
  if (alias) {
    const locCountry =
      resolved.type === "department"
        ? resolved.department.country
        : resolved.city.department?.country;
    if (locCountry !== "BE") return {};
  }

  // Catégorie « d'affichage » : id + slug du parent (requêtes, prix, grammaire,
  // guides inchangés), nom surchargé pour l'alias.
  const category = alias
    ? { ...parentCategory, name: alias.displayName }
    : parentCategory;

  const locationName =
    resolved.type === "department"
      ? formatDepartmentLabel(resolved.department)
      : resolved.city.department?.country === "BE"
        ? `${resolved.city.name} (Belgique)`
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
  const baseListing = getCategoryListing(parentCategory.slug, parentCategory.name);
  // Pour un alias belge, on affiche le pluriel/singulier/article belges tout en
  // gardant la grammaire du parent (article accordé au genre du displayName).
  const listing = alias
    ? {
        ...baseListing,
        singular: alias.displayName.toLowerCase(),
        plural: alias.displayPlural,
        article: alias.article,
      }
    : baseListing;
  const meilleurs = listing.notes === "notées" ? "meilleures" : "meilleurs";
  // Belgicisme (Belgique) : "couvreurs & toituriers", "plaquistes & plafonneurs"…
  // pour capter la requête belge en plus du terme français standard. Pour un
  // ALIAS, le nom belge est déjà le displayName → pas de suffixe (éviterait
  // « plafonneurs & plafonneurs »).
  const metaBelg = alias
    ? null
    : (resolved.type === "department" ? resolved.department : resolved.city.department)?.country === "BE"
      ? getBelgicisme(category.slug)
      : null;
  const belgPlural = metaBelg ? ` & ${metaBelg.synPlural}` : "";

  // Title plus court, optimise CTR SERP (sans « | Devis gratuit | Workwave »).
  // "Top 10 entreprises de ménage les mieux notées à Poitiers · 2026"
  // Si peu de pros, on adapte le nombre.
  let dynamicTitle: string;
  if (prosCount === 0) {
    dynamicTitle = `${category.name} ${preposition} ${locationName}`;
  } else if (prosCount === 1) {
    dynamicTitle = `${listing.singular.charAt(0).toUpperCase() + listing.singular.slice(1)} ${preposition} ${locationName} · ${currentYear}`;
  } else {
    dynamicTitle = `Top ${displayCount} ${listing.plural}${belgPlural} les mieux ${listing.notes} ${preposition} ${locationName} · ${currentYear}`;
  }

  // PRIORITE au nouveau title (sprint 25/05/2026).
  // L'ancien seo.title du sprint 3 est en format "X à Y · N pros"
  // qui n'est PAS optimise CTR. On force le nouveau format meme sur les
  // 588 pages avec seo_pages rempli. `absolute` pour ne PAS suffixer
  // « | Workwave » (template du root layout) : titre court = meilleur CTR.
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

/**
 * Rendu du listing, partage entre la page 1 (`/[metier]/[location]`) et les
 * pages suivantes (`/[metier]/[location]/page/[n]`).
 *
 * POURQUOI cette separation : lire `searchParams` (l'ancien `?page=2`) rendait
 * TOUTE la route dynamique, donc recalculee a chaque visite. Sous le crawl de
 * Google (~27 000 pages/h le 03/08), ces pages montaient a 8-20 s et Googlebot
 * commencait a lever le pied. En passant le numero de page par l'URL, les deux
 * routes deviennent cachables. Aucun risque SEO : la pagination n'est ni dans
 * le sitemap, ni indexee (canonical toujours vers la page 1).
 */
export async function renderListing(
  metier: string,
  locationSlug: string,
  page: number
) {
  const isFirstPage = page === 1;

  // Alias belge (plafonneur=plaquiste, entreprise-de-chassis=menuisier) : catégorie
  // PARENTE pour les requêtes/lookups, nom belge à l'affichage (cf. be-aliases.ts).
  const alias = getBeAlias(metier);
  const parentCategory = await getCategoryBySlug(alias ? alias.parentSlug : metier);
  if (!parentCategory) notFound();

  // Anti-fuite vertical : AUCUNE catégorie tech sur une route BTP. Test du
  // VERTICAL (pas une liste d'ids) → couvre les 145 cat tech, pas seulement les
  // 14 d'AI_CATEGORY_IDS. Redirect 308 vers /ai/[slug] (preserve SEO + bon vertical).
  if (parentCategory.vertical === "tech") {
    permanentRedirect(`/ai/${parentCategory.slug}`);
  }

  // Catégorie « d'affichage » : id + slug du parent (requêtes pros, prix,
  // grammaire, guides inchangés), nom surchargé pour l'alias belge.
  const category = alias
    ? { ...parentCategory, name: alias.displayName }
    : parentCategory;

  const resolved = await resolveLocation(locationSlug);
  if (!resolved) notFound();

  // Garde-fou alias : servi UNIQUEMENT sur une location belge. /plafonneur/vienne-86
  // (FR) → 404 (sinon on servirait les plaquistes français = duplicate content).
  if (alias) {
    const locCountry =
      resolved.type === "department"
        ? resolved.department.country
        : resolved.city.department?.country;
    if (locCountry !== "BE") notFound();
  }

  const locationName =
    resolved.type === "department"
      ? formatDepartmentLabel(resolved.department)
      : resolved.city.department?.country === "BE"
        ? `${resolved.city.name} (Belgique)`
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
    // CONTRE-COMPTAGE AVANT DE REDIRIGER (ajoute le 31/08/2026).
    //
    // Les lectures ci-dessus (`getTopProsByCategoryAndCity*`,
    // `getProsByCategoryAndCity*`) destructurent `{ data, count }` et IGNORENT
    // le champ `error` de Supabase : elles renvoient donc `total = 0` aussi
    // bien quand la ville est reellement vide que quand la requete a echoue
    // (delai depasse, coupure reseau, `statement_timeout`). Or la redirection
    // ci-dessous est PERMANENTE et mise en cache 30 jours (`revalidate`, ligne
    // 61) : une micro-panne de quelques secondes pendant une generation ISR
    // figeait la page en 308 pour un mois, et Google enregistrait une
    // redirection sur une page qui a bel et bien des artisans.
    //
    // Ce comptage est en `head: true` : aucune ligne transferee (juste
    // l'en-tete Content-Range), et il ne s'execute que sur le chemin
    // "zero pro", donc au plus une fois par generation de la page.
    // Memes filtres exactement que la lecture d'origine, y compris
    // l'agregation des arrondissements (Marseille/Lyon/Paris) et de la zone
    // frontaliere de Monaco.
    const { count: recount, error: recountError } = await createPublicClient()
      .from("pros")
      .select("id", { count: "exact", head: true })
      .eq("category_id", category.id)
      .in("city_id", aggCityIds ?? [resolved.city.id])
      .is("deleted_at", null)
      .eq("is_active", true);

    // Panne technique : on releve l'erreur. Next repond alors 500, que ni le
    // cache ISR ni Google ne conservent (Google reessaie), et la page se
    // regenere proprement au passage suivant. C'est strictement preferable a
    // une redirection permanente gravee pour 30 jours.
    if (recountError) {
      throw new Error(
        `Comptage des pros impossible pour /${metier}/${locationSlug} : ${recountError.message}`
      );
    }

    // Le comptage contredit le "zero pro" : la premiere lecture a donc echoue
    // en silence (elle ne peut pas renvoyer 0 quand des lignes existent, les
    // deux chemins comptent en `exact` ou retombent sur `pros.length`). On
    // refuse de rediriger sur une donnee fausse.
    if ((recount ?? 0) > 0) {
      throw new Error(
        `Lecture incoherente pour /${metier}/${locationSlug} : ${recount} pros en base mais la liste est revenue vide.`
      );
    }

    // Absence REELLE (comptage sain a zero) : comportement d'origine inchange.
    const cityDeptSlug = generateDepartmentSlug(resolved.city.department);
    permanentRedirect(`/${metier}/${cityDeptSlug}`);
  }

  const displayCount = Math.min(totalProsCount, TOP_LIMIT);
  const baseListing = getCategoryListing(parentCategory.slug, parentCategory.name);
  // Alias belge : pluriel/singulier/article belges, grammaire du parent conservée.
  const listing = alias
    ? {
        ...baseListing,
        singular: alias.displayName.toLowerCase(),
        plural: alias.displayPlural,
        article: alias.article,
      }
    : baseListing;
  const meilleurs = listing.notes === "notées" ? "meilleures" : "meilleurs";
  // Belgicisme (Belgique) : "couvreurs & toituriers", "plaquistes & plafonneurs"…
  // pour capter la requête belge. Pour un ALIAS, le nom belge est déjà affiché →
  // pas de suffixe (éviterait « plafonneurs & plafonneurs »).
  const metaBelg = alias
    ? null
    : (resolved.type === "department" ? resolved.department : resolved.city.department)?.country === "BE"
      ? getBelgicisme(category.slug)
      : null;
  const belgPlural = metaBelg ? ` & ${metaBelg.synPlural}` : "";
  const pluralCategory = listing.plural;
  const citySlug = resolved.type === "city" ? resolved.city.slug : null;
  // Pays de la page (BE vs FR) pour les mentions de registre (BCE vs Sirene).
  const pageIsBE =
    (resolved.type === "department"
      ? resolved.department
      : resolved.city.department)?.country === "BE";

  const allCategories = await getAllCategories();
  const relatedCategories = allCategories
    .filter((c) => c.vertical === category.vertical && c.id !== category.id)
    .slice(0, 8);

  // Projets populaires : maillage par prestation via les guides de prix BTP
  // (scope='prestation'). Affiche seulement si le metier a des guides rattaches.
  const popularProjects = await getPriceGuidesByMetier(category.slug, 12);

  // Enrichissement commune (data.gouv.fr : prix immo DVF, revenus, vacance,
  // densité), uniquement pour les pages VILLE (pas dept), affiché dans
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
      getCitiesByDepartment(resolved.department.id, 15), // n'affiche que 10 (slice) : limite l'egress
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
        // Pays + province de la PAGE (les pros listés sont tous de la zone ;
        // pro.city n'embarque pas department ici → on prend celui de la page).
        const pageDept =
          resolved.type === "department" ? resolved.department : resolved.city.department;
        const pageIsBE = pageDept?.country === "BE";
        business.address = {
          "@type": "PostalAddress",
          streetAddress: pro.address,
          addressLocality: pro.city.name,
          ...(pro.postal_code ? { postalCode: pro.postal_code } : {}),
          // addressRegion = province pour la Belgique (signal géo local BE).
          ...(pageIsBE && pageDept?.name ? { addressRegion: pageDept.name } : {}),
          addressCountry: pageIsBE ? "BE" : "FR",
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
    : `Tous les ${pluralCategory} ${preposition} ${locationName} · page ${page}`;

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
        isBE:
          (resolved.type === "department"
            ? resolved.department
            : resolved.city.department)?.country === "BE",
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

            {/* Lien vers la liste complète si on a plus de TOP_LIMIT pros.
                L'adresse doit etre `/page/2`, PAS `?page=2` : depuis le passage
                a la pagination par chemin, cette route ne lit plus `searchParams`
                (ses `Props` n'ont que `params`) et aucune redirection du
                middleware ne rattrape l'ancien format. Un `?page=2` renvoyait
                donc la page 1 en 200, et le reste de la liste n'etait atteignable
                par aucun lien : mesure sur /plombier/marseille, 668 fiches sur
                678 hors de portee de la navigation, donc invisibles pour Google
                qui ne decouvre ces pages que par les liens internes (la
                pagination n'est pas dans le sitemap). */}
            {/* Le seuil est la TAILLE D'UNE PAGE, pas le nombre de fiches mises en
                avant. Corrige le 01/09/2026 : la condition portait sur TOP_LIMIT
                (10), alors qu'une page de pagination en contient DEFAULT_PAGE_SIZE
                (20). Entre 11 et 20 fiches, le bouton s'affichait donc et menait a
                une page 2 vide. Envoyer Google sur une page vide est pire que ne
                pas lui proposer de lien du tout.
                A noter : totalProsCount peut surestimer le total sur la page 1
                (lib/queries/top-pros.ts compte en `estimated`), donc un cas
                residuel de page 2 quasi vide reste possible. Le seuil a 20 le rend
                rare la ou il etait systematique. */}
            {totalProsCount > DEFAULT_PAGE_SIZE && (
              <div className="mt-8 flex justify-center">
                <Link
                  href={`${baseUrl}/page/2`}
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
            usePathPagination
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
          isBE={pageIsBE}
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

export default async function ListingPage({ params }: Props) {
  const { metier, location: locationSlug } = await params;
  return renderListing(metier, locationSlug, 1);
}

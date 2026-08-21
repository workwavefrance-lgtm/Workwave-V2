import type { Metadata } from "next";
import { notFound, permanentRedirect } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { getProBySlug, getSimilarPros, getFicheRemplacante } from "@/lib/queries/pros";
import { getPublishedReviewsForPro } from "@/lib/queries/reviews";
import { getNearbyCities } from "@/lib/queries/cities";
// Client SANS cookies : `supabase/server` appelle cookies(), ce qui bascule la
// fiche en rendu DYNAMIQUE (cache CDN inactif -> regeneree a chaque visite).
import { createPublicClient } from "@/lib/supabase/public-client";
import ProCard from "@/components/pro/ProCard";
import ProReviewsBlock from "@/components/pro/ProReviewsBlock";
import ProjectCTABlock from "@/components/listing/ProjectCTABlock";
import ProSeoSections from "@/components/pro/ProSeoSections";
import ProGuidesLinks from "@/components/pro/ProGuidesLinks";
import { buildProContent } from "@/lib/seo/pro-seo-sections";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { truncateDescription } from "@/lib/utils/seo";
import { getCategoryArticle } from "@/lib/utils/category-grammar";
import { BASE_URL } from "@/lib/constants";
import { toOpeningHoursSpecification, toBreadcrumbSchema } from "@/lib/utils/schema";
import { formatEffectifRange, formatFoundingYear, formatAgeYears, formatDateCreation } from "@/lib/utils/sirene";
import dynamic from "next/dynamic";
import { libelleNaf } from "@/lib/data/naf-labels";
// Chargement PARESSEUX explicite. La bande n'est rendue que sur les fiches
// qui ont des photos, soit 17 sur 2 439 970 aujourd'hui : son code ne doit
// pas peser sur les autres. `next/dynamic` garantit un morceau de code a part,
// telecharge seulement quand le composant est reellement dans l'arbre, sans
// dependre de l'analyse statique de Next. Le rendu serveur reste actif, donc
// les figures, les legendes et les textes alternatifs sont bien dans le HTML
// que Google recoit.
import ProGallery from "@/components/pro/ProGallery";
import { formeJuridiqueDistinctive } from "@/lib/data/formes-juridiques";
import type { OpeningHours, DaySchedule } from "@/lib/types/database";
// IDs des catégories Workwave AI (tech + business + créatif) : pour ces pros,
// l'URL canonique est /ai/freelance/[slug] (design Workwave AI). Évite le
// duplicate content signal entre /artisan/[slug] et /ai/freelance/[slug].
import { AI_CATEGORY_IDS } from "@/lib/ai/helpers";

export const revalidate = 2592000; // 30j (15/06) : egress Supabase 313% sous crawl ; donnees Sirene statiques. La fiche revalide a la reclamation/edition (revalidatePath) + un deploiement reset le cache, donc 0 risque de fraicheur. // 7j (13/06)

// Sans generateStaticParams, Next.js classe la route en RENDU DYNAMIQUE :
// `revalidate` est ignore et la page est recalculee a CHAQUE visite. La liste
// vide = on ne prebuild rien au build, mais la route bascule en ISR (1re visite
// -> generee ET mise en cache). HTML identique : aucun impact SEO.
export function generateStaticParams() {
  return [];
}


type Props = {
  params: Promise<{ slug: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const pro = await getProBySlug(slug);
  if (!pro) return {};

  const cityName = pro.city?.name || "";
  // Sprint 14 : fallback description_ai si pas de description manuelle.
  // Cible les pages "Exploree non indexee" GSC (~3 384) en leur donnant un
  // contenu enrichi qui passe le seuil thin content de Google.
  const proAi = pro as typeof pro & { description_ai?: string | null };
  const effectiveDescription = pro.description || proAi.description_ai || null;
  const desc =
    truncateDescription(effectiveDescription) ||
    `${pro.name}, ${pro.category.name} à ${cityName}. Contactez ce professionnel gratuitement.`;

  // Canonical : si pro tech, pointer vers /ai/freelance/[slug] (Workwave AI).
  // Sinon, /artisan/[slug] (Workwave BTP standard).
  const isTechPro = AI_CATEGORY_IDS.includes(pro.category.id);
  const canonicalUrl = isTechPro
    ? `${BASE_URL}/ai/freelance/${slug}`
    : `${BASE_URL}/artisan/${slug}`;

  // Toutes les fiches actives sont indexables : chaque fiche a un titre unique,
  // un H1, un schema LocalBusiness (SIRET + adresse + géoloc), un breadcrumb,
  // une sidebar SIRET/dept/cat, des pros similaires + villes voisines en liens
  // internes. C'est largement au-dessus du seuil thin content de Google.
  // NB : les fiches sans contenu enrichi gardent une priority sitemap dégradée
  // (0.3 vs 0.5/0.8), voir app/sitemap.ts.
  return {
    title: `${pro.name} - ${pro.category.name} à ${cityName}`,
    description: desc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      type: "profile",
      title: `${pro.name} - ${pro.category.name} à ${cityName}`,
      description: desc,
      url: canonicalUrl,
    },
    twitter: {
      card: "summary",
      title: `${pro.name} - ${pro.category.name} à ${cityName}`,
      description: desc,
    },
  };
}

const DAY_LABELS: Record<string, string> = {
  lundi: "Lundi",
  mardi: "Mardi",
  mercredi: "Mercredi",
  jeudi: "Jeudi",
  vendredi: "Vendredi",
  samedi: "Samedi",
  dimanche: "Dimanche",
};

const PAYMENT_LABELS: Record<string, string> = {
  CB: "Carte bancaire",
  virement: "Virement",
  cheque: "Chèque",
  especes: "Espèces",
};

export default async function ProPage({ params }: Props) {
  const { slug } = await params;
  const pro = await getProBySlug(slug);
  if (!pro) {
    // 18/08/2026 : la fiche a peut-etre ete retiree comme DOUBLON (meme
    // entreprise, meme commune, autre etablissement). Dans ce cas on renvoie
    // vers la fiche conservee au lieu d'afficher une erreur. Cette requete ne
    // part QUE sur le chemin d'erreur, jamais sur une page qui existe.
    const remplacante = await getFicheRemplacante(slug);
    if (remplacante) permanentRedirect(`/artisan/${remplacante}`);
    notFound();
  }

  // Si pro Workwave AI (tech + business + creatif), rediriger 308 vers
  // /ai/freelance/[slug] qui a le bon layout (header AI, terminologie
  // "freelance", CTA approprie). La canonical seule ne suffit pas : Google la
  // suit mais le user voyait la page BTP. NB : pas de loading.tsx ici, donc
  // permanentRedirect fonctionne (cf. lecons apprises 18/04 sur Suspense
  // streaming qui casse les redirects).
  if (AI_CATEGORY_IDS.includes(pro.category.id)) {
    permanentRedirect(`/ai/freelance/${slug}`);
  }

  // Charger les pros similaires, villes voisines, avis ET catégories secondaires
  // en parallèle (les cat. secondaires permettent à la fiche d'apparaître sur
  // plusieurs listings /[metier]/[ville] et boostent le maillage interne SEO).
  const secondaryIds = (pro.secondary_category_ids || []) as number[];
  const supabaseForCats = createPublicClient();
  const [similarPros, nearbyCities, reviews, secondaryCategoriesRes] = await Promise.all([
    pro.city ? getSimilarPros(pro.category_id, pro.city.id, slug, 5) : Promise.resolve([]),
    pro.city ? getNearbyCities(pro.city.id, 5) : Promise.resolve([]),
    getPublishedReviewsForPro(pro.id, 20),
    secondaryIds.length > 0
      ? supabaseForCats
          .from("categories")
          .select("id, name, slug")
          .in("id", secondaryIds)
      : Promise.resolve({ data: [] as { id: number; name: string; slug: string }[] }),
  ]);
  const secondaryCategories = (secondaryCategoriesRes.data || []) as { id: number; name: string; slug: string }[];

  const cityName = pro.city?.name || "";
  const deptSlug = pro.city?.department
    ? generateDepartmentSlug(pro.city.department)
    : "vienne-86";

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: pro.category.name, href: `/${pro.category.slug}/${deptSlug}` },
    ...(pro.city
      ? [
          {
            label: pro.city.name,
            href: `/${pro.category.slug}/${pro.city.slug}`,
          },
        ]
      : []),
    { label: pro.name },
  ];

  const isClaimed = !!pro.claimed_by_user_id;
  // CTA de réclamation (fiche non réclamée) : angle POSITIF (demande) plutôt
  // que "loss aversion". La fiche est publique et vue à ~77% par des
  // particuliers, donc on ne dit JAMAIS "ce pro ne reçoit rien" (ça sèmerait le
  // doute chez le particulier sur l'utilité de contacter ce pro). On met en
  // avant qu'il y a de la demande à recevoir. + lien vers la page d'acquisition
  // adaptée au vertical (chantiers pour le BTP, clients pour les services).
  const isServiceVertical =
    pro.category.vertical === "domicile" || pro.category.vertical === "personne";
  const claimAcquisitionHref = isServiceVertical
    ? `/trouver-des-clients/${pro.category.slug}`
    : `/trouver-des-chantiers/${pro.category.slug}`;
  const claimArticle = getCategoryArticle(pro.category.name);
  const claimMetier = pro.category.name.toLowerCase();
  const claimCityPart = cityName ? ` à ${cityName}` : "";
  // Phrase du bandeau construite en STRING (pas en JSX interpolé) : évite les
  // espaces avalés aux frontières {expr}/saut-de-ligne (bug "Poitierspartent").
  const claimPitchText = `Des particuliers cherchent ${claimArticle} ${claimMetier}${claimCityPart} sur Workwave. Réclamez votre fiche (gratuit) pour recevoir leurs demandes directement.`;
  // FLOU DES COORDONNÉES : sur une fiche NON réclamée qui a au moins une
  // coordonnée, on masque le téléphone (à moitié), l'email et le site. Ça force
  // le particulier à déposer un projet (= lead capté par Workwave) et incite le
  // pro à réclamer sa fiche pour récupérer ses clients. Une fiche réclamée
  // affiche ses coordonnées normalement.
  const blurCoords =
    !isClaimed && (!!pro.phone || !!pro.email || !!pro.website);
  // Téléphone "à moitié flouté" (teaser) : 1ère moitié visible, 2e floutée.
  // Plus frustrant qu'un flou total → pousse le pro à réclamer et le particulier
  // à déposer. Le numéro vient de Sirene (donnée publique) ; le flou = friction.
  const phoneDigits = (pro.phone || "").replace(/[^\d]/g, "").replace(/^33/, "0");
  const phoneGroups = phoneDigits
    .replace(/(\d{2})(?=\d)/g, "$1 ")
    .trim()
    .split(" ");
  const phoneTeaserVisible = phoneGroups.slice(0, 3).join(" ");
  const phoneTeaserMasked = phoneGroups.slice(3).join(" ");
  // Email "à moitié flouté", même principe que le téléphone : quelques
  // caractères visibles, le reste flouté. Assez pour prouver qu'on a l'adresse,
  // pas assez pour l'utiliser sans réclamer la fiche (pro) ou déposer un projet
  // (particulier). Le domaine est masqué pour ne pas laisser deviner l'adresse.
  const emailStr = pro.email || "";
  const emailAt = emailStr.indexOf("@");
  const emailTeaserVisible =
    emailAt > 2 ? emailStr.slice(0, 3) : emailStr.slice(0, Math.max(1, emailAt));
  const emailTeaserMasked = emailStr.slice(emailTeaserVisible.length);
  // Contenu SEO/AEO unique par fiche (À propos + FAQ sourcés, zéro invention).
  const proContent = buildProContent(pro);
  const openingHours = pro.opening_hours as OpeningHours | null;

  // Realisations envoyees par le pro. `photos` GARDE sa forme de tableau de
  // chaines : la cartographie du 21/08 a recense 34 endroits qui la lisent,
  // dont trois casseraient EN SILENCE si elle devenait un tableau d'objets
  // (le filtre ci-dessous viderait la galerie de toutes les fiches sans
  // lever d'erreur, et les suppressions de photos renverraient "succes"
  // sans rien supprimer). Les legendes vivent donc a cote, dans
  // `photo_captions`.
  // Domaines autorises pour next/image. Ils DOIVENT rester alignes sur
  // next.config.ts images.remotePatterns : next/image JETTE sur un domaine
  // non declare, et une exception au rendu d'un composant serveur produit
  // une 500 mise en cache TRENTE JOURS.
  //
  // Mesure du 21/08/2026, avant d'ecrire ce filtre : sur 724 photos en base,
  // 665 viennent de places.googleapis.com (enrichissement Google Places) et
  // 59 seulement de notre compartiment. Un filtre restreint au seul
  // compartiment aurait supprime 92 % des photos du site, en silence.
  // Ces deux hotes sont EXACTEMENT ceux declares dans next.config.ts
  // images.remotePatterns. Un endsWith(".supabase.co") serait plus permissif
  // que la configuration : next/image jetterait sur un autre projet Supabase,
  // et une exception au rendu produit une 500 en cache trente jours.
  const HOTES_IMAGES = ["eifypjlyzgfpunxrouwo.supabase.co", "places.googleapis.com"];
  const hoteAutorise = (url: string) => {
    try {
      return HOTES_IMAGES.includes(new URL(url).hostname);
    } catch {
      return false;
    }
  };

  // Une photo est "du pro" si elle vient de NOTRE compartiment de stockage,
  // c'est-a-dire s'il l'a lui-meme envoyee depuis son tableau de bord. Celles
  // de places.googleapis.com viennent de l'enrichissement Google Places et
  // sont le plus souvent deposees par des CLIENTS : on ne peut rien affirmer
  // sur leur auteur. Mesure du 21/08/2026 : 665 photos sur 724 sont dans ce
  // cas, reparties sur 182 fiches dont aucune n'est reclamee.
  const estDuPro = (url: string) => {
    try {
      return new URL(url).hostname.endsWith(".supabase.co");
    } catch {
      return false;
    }
  };

  const photos = Array.isArray(pro.photos)
    ? pro.photos.filter(
        (url): url is string =>
          typeof url === "string" && url.startsWith("https://") && hoteAutorise(url)
      )
    : [];

  // Couverture envoyee par le pro. JAMAIS fabriquee a partir des photos de
  // chantier : mesure du 21/08/2026 sur 16 photos reelles de trois artisans,
  // 13 sont en portrait et la plus etroite fait 720x1560. La decouper en
  // bandeau large ne garderait que 19 % de la hauteur, soit une tranche de
  // tronc d'arbre. Sans couverture, la fiche affiche un fond calme.
  // La colonne peut ne pas encore exister en base au moment du deploiement
  // (migration 2026-08-21) : la valeur est alors absente et la fiche affiche
  // simplement le fond calme, sans la moindre erreur.
  // On n'accepte QUE les URL de notre propre compartiment de stockage.
  // Raison : next/image JETTE une exception sur une source dont le domaine
  // n'est pas autorise dans next.config, et une exception au rendu d'un
  // composant serveur produit une 500 qui reste en cache TRENTE JOURS. Une
  // valeur heritee ou saisie a la main pointant ailleurs mettrait la fiche
  // par terre sans qu'on s'en apercoive.
  const coverUrl =
    typeof pro.cover_url === "string" &&
    pro.cover_url.startsWith("https://") &&
    hoteAutorise(pro.cover_url)
      ? pro.cover_url
      : null;

  // Legendes des realisations, ecrites par le pro. C'est le seul texte de la
  // fiche que personne d'autre ne possede : mesure du 20/08, deux fiches
  // voisines partagent 71,4 % de leur texte. Table de correspondance par URL
  // et non par position, pour survivre aux suppressions de photos.
  const captionsRaw: unknown = pro.photo_captions;
  const captions: Record<string, string> =
    captionsRaw && typeof captionsRaw === "object" && !Array.isArray(captionsRaw)
      ? (captionsRaw as Record<string, string>)
      : {};
  const legendeDe = (url: string): string | null => {
    const v = captions[url];
    return typeof v === "string" && v.trim().length > 0 ? v.trim() : null;
  };

  // On ne declare a Google QUE les photos du pro : celles de Google Places
  // ont des URL signees qui EXPIRENT (403 constates dans les journaux du
  // 21/08), et donner a Google des adresses qui cesseront de repondre est
  // contre-productif.
  // On ne parle de "ses chantiers" que si TOUTES les photos viennent du pro.
  // Un melange rendrait la phrase fausse pour une partie d'entre elles.
  const toutesDuPro = photos.length > 0 && photos.every(estDuPro);

  const photosPourSchema = photos
    .filter(estDuPro)
    .map((url) => ({ url, legende: legendeDe(url) }));

  const jsonLd: Record<string, unknown> = {
    "@context": "https://schema.org",
    "@type": "LocalBusiness",
    name: pro.name,
    url: `${BASE_URL}/artisan/${slug}`,
    ...(() => {
      const proAi = pro as typeof pro & { description_ai?: string | null };
      const d = pro.description || proAi.description_ai;
      return d ? { description: d } : {};
    })(),
    ...(pro.phone && !blurCoords ? { telephone: pro.phone } : {}),
    ...(pro.email && !blurCoords ? { email: pro.email } : {}),
    ...(pro.logo_url ? { image: pro.logo_url } : {}),
    // GALERIE D'IMAGES (21/08/2026). Chaque realisation est declaree avec sa
    // legende ecrite par le pro : c'est ce qui permet a Google de savoir ce
    // qu'on voit, au lieu d'un "Realisation nom-du-pro 1" qui ne dit rien.
    // Trafic Google Images qu'on ne capte pas du tout aujourd'hui.
    ...(photosPourSchema.length > 0
      ? {
          photo: photosPourSchema.map((p) => ({
            "@type": "ImageObject",
            contentUrl: p.url,
            ...(p.legende ? { caption: p.legende, name: p.legende } : {}),
          })),
        }
      : {}),
    address: {
      "@type": "PostalAddress",
      ...(pro.address ? { streetAddress: pro.address } : {}),
      ...(cityName ? { addressLocality: cityName } : {}),
      ...(pro.postal_code ? { postalCode: pro.postal_code } : {}),
      ...(pro.city?.department
        ? { addressRegion: pro.city.department.name }
        : {}),
      addressCountry: pro.city?.country === "BE" ? "BE" : "FR",
    },
    ...(pro.city?.latitude && pro.city?.longitude
      ? {
          geo: {
            "@type": "GeoCoordinates",
            latitude: pro.city.latitude,
            longitude: pro.city.longitude,
          },
        }
      : {}),
    ...(pro.hourly_rate ? { priceRange: `${pro.hourly_rate} EUR/h` } : {}),
  };

  // OpeningHours (fiches reclamees uniquement)
  if (isClaimed && openingHours) {
    const specs = toOpeningHoursSpecification(openingHours as OpeningHours);
    if (specs.length > 0) {
      jsonLd.openingHoursSpecification = specs;
    }
  }

  // Sirene v3 : foundingDate + numberOfEmployees pour Schema.org
  // (signal d'anciennete et de taille pour Google + LLM)
  // founded_year (éditable par le pro dans son dashboard) prime sur founding_date
  // (date Sirene de l'établissement, parfois plus récente que le début d'activité).
  // Schema.org accepte une Date complete : on la donne quand elle ne
  // contredit pas l'annee saisie par le pro (20/08/2026). Une date exacte est
  // une donnee structuree plus forte qu'une simple annee, et elle differencie
  // deux etablissements voisins.
  const dateSireneIso = pro.founding_date ? String(pro.founding_date).slice(0, 10) : null;
  if (pro.founded_year && pro.founded_year > 1800) {
    jsonLd.foundingDate =
      dateSireneIso && dateSireneIso.slice(0, 4) === String(pro.founded_year)
        ? dateSireneIso
        : String(pro.founded_year);
  } else if (dateSireneIso) {
    jsonLd.foundingDate = dateSireneIso;
  }
  if (pro.effectif_range) {
    const effLabel = formatEffectifRange(pro.effectif_range);
    if (effLabel) {
      jsonLd.numberOfEmployees = {
        "@type": "QuantitativeValue",
        description: effLabel,
      };
    }
  }

  // RGE officiel ADEME : hasCredential pour Schema.org Rich Results +
  // signal LLM. Une qualif = une EducationalOccupationalCredential.
  if (pro.rge_certified && Array.isArray(pro.rge_qualifications) && pro.rge_qualifications.length > 0) {
    jsonLd.hasCredential = pro.rge_qualifications.map((q) => ({
      "@type": "EducationalOccupationalCredential",
      name: q.domaine || q.nom,
      credentialCategory: "certification",
      ...(q.organisme
        ? {
            recognizedBy: {
              "@type": "Organization",
              name: q.organisme,
            },
          }
        : {}),
      ...(q.date_fin ? { validThrough: q.date_fin } : {}),
      ...(q.domaine ? { about: q.domaine } : {}),
    }));
  }

  // Zone d'intervention
  if (isClaimed && pro.intervention_radius_km && pro.city?.latitude && pro.city?.longitude) {
    jsonLd.areaServed = {
      "@type": "GeoCircle",
      geoMidpoint: {
        "@type": "GeoCoordinates",
        latitude: pro.city.latitude,
        longitude: pro.city.longitude,
      },
      geoRadius: `${pro.intervention_radius_km * 1000}`,
    };
  }

  // AggregateRating : agrege les avis Workwave + Google si disponibles.
  // Active les rich snippets etoiles dans la SERP Google + signal fort
  // pour les LLMs (Perplexity, AI Overviews).
  const wwCount = pro.workwave_reviews_count ?? 0;
  const wwAvg = pro.workwave_reviews_avg ?? 0;
  const gRating = pro.google_rating ?? 0;
  const gCount = pro.google_reviews_count ?? 0;
  if (wwCount > 0 || gCount > 0) {
    // Moyenne ponderee par nb d'avis de chaque source
    const totalCount = wwCount + gCount;
    const weightedSum = wwAvg * wwCount + gRating * gCount;
    const aggregateValue = Math.round((weightedSum / totalCount) * 10) / 10;
    jsonLd.aggregateRating = {
      "@type": "AggregateRating",
      ratingValue: aggregateValue,
      reviewCount: totalCount,
      bestRating: 5,
      worstRating: 1,
    };
  }

  // BreadcrumbList schema
  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);

  const initial = (pro.name || "?").charAt(0).toUpperCase();
  const certifications = Array.isArray(pro.certifications) ? pro.certifications : [];
  const paymentMethods = Array.isArray(pro.payment_methods) ? pro.payment_methods : [];

  return (
    <main className="max-w-5xl mx-auto px-4 py-12">
      <JsonLd data={jsonLd} />
      <JsonLd data={breadcrumbJsonLd} />
      <Breadcrumb items={breadcrumbItems} />

      {/* BANDEAU DE COUVERTURE (21/08/2026). Les photos sont la seule chose
          qu'un artisan produit lui-meme : tout le reste vient de l'INSEE.
          Avec une couverture, on montre le metier des le premier ecran au
          lieu d'un numero d'immatriculation. Sans, un fond calme, aucune
          image inventee ni photo d'agence. L'ecart entre les deux est ce qui
          donne envie de reclamer sa fiche. */}
      <div className="relative h-40 sm:h-52 rounded-2xl overflow-hidden border border-[var(--card-border)] mb-4">
        {coverUrl ? (
          <Image
            src={coverUrl}
            alt={`${isServiceVertical ? "Intervention" : "Chantier"} de ${pro.category?.name?.toLowerCase() || "professionnel"} réalisé par ${pro.name}${pro.city ? ` à ${pro.city.name}` : ""}`}
            fill
            sizes="(max-width: 1024px) 100vw, 1024px"
            className="object-cover"
            priority
          />
        ) : (
          <div
            aria-hidden="true"
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(120% 130% at 10% 0%, var(--accent-muted) 0%, transparent 60%), linear-gradient(180deg, var(--bg-secondary) 0%, var(--card-bg) 100%)",
            }}
          />
        )}
        {photos.length > 0 && (
          <span className="absolute top-3 right-3 bg-black/60 text-white text-[11px] font-mono px-2.5 py-1 rounded-full backdrop-blur-sm">
            {photos.length} réalisation{photos.length > 1 ? "s" : ""}
          </span>
        )}
      </div>

      {/* Banniere de reclamation TOP : version fine (Levier D, mai 2026).
          Reduite vs version originelle (gros bloc orange dominant) pour
          ne pas ecraser la fiche aux yeux des particuliers (77% du trafic
          SEO arrive sur /artisan/[slug] via recherches navigationnelles).
          Le pro qui visite sa fiche la voit toujours immediatement, mais
          l'espace principal de la fiche est rendu au visiteur particulier. */}
      {!isClaimed && pro.siret && (
        <section className="mb-6 bg-[#FF5A36]/5 dark:bg-[#FF5A36]/10 border border-[#FF5A36]/20 dark:border-[#FF5A36]/30 rounded-xl px-4 py-3">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-2.5 sm:gap-4">
            <p className="text-sm text-[var(--text-secondary)] leading-snug">
              <span className="font-semibold text-[var(--text-primary)]">
                Vous êtes {pro.name} ?
              </span>{" "}
              {claimPitchText}{" "}
              <Link
                href={claimAcquisitionHref}
                className="text-[var(--accent)] font-medium underline underline-offset-2 hover:text-[#E63E1A] transition-colors duration-250 whitespace-nowrap"
              >
                Comment ça marche
              </Link>
            </p>
            <Link
              href={`/pro/reclamer/${slug}`}
              rel="nofollow"
              className="inline-flex items-center justify-center gap-1.5 bg-[#FF5A36] hover:bg-[#E63E1A] text-white px-4 py-2 rounded-full text-xs font-semibold transition-all duration-250 hover:scale-[1.02] shrink-0 self-start sm:self-auto whitespace-nowrap"
            >
              Réclamer ma fiche, gratuit
              <svg
                className="w-3.5 h-3.5"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
          </div>
        </section>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Colonne gauche */}
        <div className="lg:col-span-2 space-y-8">
          {/* En-tete */}
          <div className="flex items-start gap-4">
            {pro.logo_url && pro.logo_url.startsWith("http") ? (
              <Image
                src={pro.logo_url}
                alt={`Logo ${pro.name}`}
                width={64}
                height={64}
                /* object-contain, pas object-cover : un logo non carre etait
                   DECOUPE. Mesure du 21/08/2026 : celui d'Elagage precis fait
                   230x320, on lui coupait le haut et le bas. Le disque clair
                   derriere sert aux logos livres sur fond blanc opaque, qui
                   sinon font une tache en mode sombre. */
                className="w-16 h-16 rounded-full object-contain bg-white dark:bg-[#FAFAFA] p-1 border border-[var(--card-border)] shrink-0"
              />
            ) : (
              <div
                className="w-16 h-16 rounded-full flex items-center justify-center shrink-0"
                style={{ backgroundColor: "var(--accent-muted)" }}
              >
                <span className="text-[var(--accent)] font-bold text-2xl">
                  {initial}
                </span>
              </div>
            )}
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-1">
                {pro.name}
              </h1>
              <div className="flex flex-wrap items-center gap-2">
                <span
                  className="inline-block text-[var(--accent-badge-text)] text-sm font-medium px-3 py-1 rounded-full"
                  style={{ backgroundColor: "var(--accent-muted)" }}
                >
                  {pro.category.name}
                </span>
                {/* Catégories secondaires : chips cliquables (lien vers
                    /[cat]/[ville]) qui boostent le maillage interne SEO et
                    montrent à l'user les autres métiers que ce pro pratique. */}
                {secondaryCategories.map((cat) => (
                  <Link
                    key={cat.id}
                    href={pro.city ? `/${cat.slug}/${pro.city.slug}` : `/${cat.slug}`}
                    className="inline-block bg-zinc-200 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-[var(--accent-muted)] hover:text-[var(--accent-badge-text)] text-sm font-medium px-3 py-1 rounded-full transition-colors"
                    title={`Voir tous les ${cat.name.toLowerCase()}s${pro.city ? ` à ${pro.city.name}` : ""}`}
                  >
                    {cat.name}
                  </Link>
                ))}
                {/* Badge RGE certifie : source officielle ADEME, plus credible
                    que le champ certifications user-input. Affiche tel quel
                    quand pro.rge_certified=true (sync via match-rge-pros.ts). */}
                {pro.rge_certified && (
                  <span
                    className="inline-flex items-center gap-1.5 bg-blue-100 dark:bg-blue-950/30 text-blue-700 dark:text-blue-400 text-sm font-medium px-3 py-1 rounded-full"
                    title="Certification RGE officielle, source ADEME"
                  >
                    <svg className="w-3.5 h-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                    </svg>
                    RGE certifié
                  </span>
                )}
                {pro.free_quote && isClaimed && (
                  <span className="inline-block bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-medium px-3 py-1 rounded-full">
                    Devis gratuit
                  </span>
                )}
              </div>
            </div>
          </div>

          {/* CTA particulier mid-page (Levier D, mai 2026).
              Remplace l'ancien gros bloc orange "Reclamer cette fiche"
              qui dominait l'experience particulier en mid-page. Ici on
              propose au visiteur de demander un devis : il a deja vu
              les coordonnees du pro plus haut, on lui offre l'alternative
              "comparer plusieurs devis" au moment ou il scrolle.
              Texte HONNETE : le lead n'est pas garanti pour CE pro
              precis (routing automatique parmi les abonnes). */}
          <section className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-7">
            <h2 className="text-lg sm:text-xl font-bold text-[var(--text-primary)] mb-2 leading-snug">
              Vous cherchez {getCategoryArticle(pro.category.name)}{" "}
              {pro.category.name.toLowerCase()}
              {pro.city ? ` à ${pro.city.name}` : ""} ?
            </h2>
            <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
              {blurCoords
                ? `Pour être mis en relation avec ${claimArticle} ${claimMetier}${claimCityPart}, décrivez votre projet : c'est gratuit, rapide et sans engagement. Nous transmettons votre demande aux pros disponibles dans votre zone.`
                : pro.phone
                ? `Contactez ${pro.name} directement au ${pro.phone}. Pour comparer plusieurs devis, décrivez votre projet, nous le transmettons aux artisans qualifiés de votre zone.`
                : `Décrivez votre projet, nous le transmettons aux artisans qualifiés de votre zone. Gratuit, sans engagement.`}
            </p>

            <Link
              href={`/deposer-projet?categorie=${pro.category.slug}${pro.city ? `&ville=${pro.city.slug}` : ""}`}
              className="inline-flex items-center justify-center gap-2 w-full sm:w-auto bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] shadow-sm"
            >
              {isServiceVertical ? "Trouver des pros" : "Trouver des artisans"}
              <svg
                className="w-4 h-4"
                fill="none"
                viewBox="0 0 24 24"
                stroke="currentColor"
                strokeWidth={2.5}
                aria-hidden="true"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  d="M13 7l5 5m0 0l-5 5m5-5H6"
                />
              </svg>
            </Link>
            <p className="text-xs text-[var(--text-tertiary)] mt-3">
              Réponse rapide · 100 % gratuit · Sans création de compte
            </p>
          </section>

          {/* Description : priorite a la description manuelle du pro, fallback
              vers description_ai (Sprint 14 : enrichit les pages thin content
              pour debloquer l'indexation Google). */}
          {(() => {
            const proAi = pro as typeof pro & { description_ai?: string | null };
            const text = pro.description || proAi.description_ai;
            if (!text) return null;
            return (
              <div className="relative rounded-2xl bg-[var(--bg-secondary)] border border-[var(--card-border)] p-6 sm:p-7 overflow-hidden">
                {/* accent coral signature à gauche : met en valeur la voix du pro */}
                <span className="absolute left-0 top-0 bottom-0 w-1 bg-[var(--accent)]" aria-hidden="true" />
                <div className="flex items-center gap-2 mb-3">
                  <svg className="w-4 h-4 text-[var(--accent)] shrink-0" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">
                    <path d="M7.17 6A4.17 4.17 0 0 0 3 10.17V18h7.5v-7.5H6.34A2.84 2.84 0 0 1 9 7.5V6H7.17Zm10 0A4.17 4.17 0 0 0 13 10.17V18h7.5v-7.5h-4.16A2.84 2.84 0 0 1 19 7.5V6h-1.83Z" />
                  </svg>
                  <h2 className="text-xs font-semibold text-[var(--accent)] uppercase tracking-wider">
                    À propos
                  </h2>
                </div>
                <p className="text-[var(--text-primary)] text-[15px] sm:text-base leading-[1.75] whitespace-pre-line">
                  {text}
                </p>
              </div>
            );
          })()}

          {/* SES CHANTIERS (21/08/2026). Remplace la grille carree qui vivait
              en NEUVIEME position, sous les modes de paiement, avec un titre
              au style d'une metadonnee. Deux defauts mesures : les images
              etaient recadrees au carre, or 13 des 16 photos reelles de nos
              pros sont en portrait, donc les cimes d'arbres et les toitures
              sautaient ; et rien n'etait cliquable.
              La bande a hauteur fixe preserve les proportions d'origine et
              tient avec UNE photo comme avec DIX : sept de nos dix-sept pros
              equipes n'en ont qu'une seule, ce qui elimine toute mise en page
              en grille avec cas particulier. */}
          {photos.length > 0 && (
            <section aria-labelledby="titre-chantiers">
              <h2
                id="titre-chantiers"
                className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-1"
              >
                {toutesDuPro
                  ? isServiceVertical
                    ? photos.length > 1
                      ? "Ses interventions"
                      : "Son intervention"
                    : photos.length > 1
                      ? "Ses chantiers"
                      : "Son chantier"
                  : "Photos"}
              </h2>
              <p className="text-sm text-[var(--text-secondary)] mb-4">
                {/* "Chantier" ne veut rien dire pour une femme de menage ou
                    une garde d'enfants : le vocabulaire suit le vertical, qui
                    est deja calcule plus haut pour l'appel a l'action. */}
                {toutesDuPro
                  ? photos.length > 1
                    ? `${photos.length} réalisations photographiées par l'entreprise.`
                    : "Une réalisation photographiée par l'entreprise."
                  : photos.length > 1
                    ? `${photos.length} photos de cet établissement.`
                    : "Une photo de cet établissement."}
              </p>
              <ProGallery
                photos={photos.map((url) => ({
                  url,
                  legende: legendeDe(url),
                  duPro: estDuPro(url),
                }))}
                nomPro={pro.name}
                metier={pro.category?.name?.toLowerCase() || null}
                ville={pro.city?.name || null}
                departement={pro.city?.department?.name || null}
              />
            </section>
          )}

          {/* Bandeau Sirene : age + effectif. Source officielle INSEE
              (sync via scripts/enrich-sirene-v3.ts). Signal de confiance
              majeur pour les particuliers : c'est ce qu'ils regardent en
              premier (anciennete + taille). Affiche uniquement si on a
              au moins une des deux infos. */}
          {/* 17/08/2026 : `libelleNaf` conditionne l'affichage du bloc au meme
              titre que l'annee de creation. `formatEffectifRange` ne renvoie
              plus rien pour le code "NN" (92 % des fiches), donc la carte
              "Taille de l'equipe" disparait quand la donnee manque au lieu
              d'afficher "Effectif inconnu" a l'identique partout. */}
          {(pro.founded_year || pro.founding_date || pro.effectif_range || libelleNaf(pro.naf_code) || formeJuridiqueDistinctive(pro.forme_juridique)) && (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(pro.founded_year || pro.founding_date) && (() => {
                // founded_year (édité par le pro) prime sur founding_date Sirene.
                const year =
                  pro.founded_year && pro.founded_year > 1800
                    ? String(pro.founded_year)
                    : formatFoundingYear(pro.founding_date);
                if (!year) return null;
                const age =
                  pro.founded_year && pro.founded_year > 1800
                    ? new Date().getFullYear() - pro.founded_year
                    : formatAgeYears(pro.founding_date);
                // Date COMPLETE quand elle ne contredit pas l'année saisie par
                // le pro. Deux voisins partagent souvent l'année, presque
                // jamais le jour : c'est ce qui distingue leurs deux pages.
                const dateComplete = formatDateCreation(pro.founding_date);
                const libelle =
                  dateComplete && formatFoundingYear(pro.founding_date) === year
                    ? { titre: "Entreprise créée le", valeur: dateComplete }
                    : { titre: "Entreprise créée en", valeur: year };
                return (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-muted)" }}>
                      <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <rect x="3" y="4" width="18" height="18" rx="2" />
                        <line x1="16" y1="2" x2="16" y2="6" />
                        <line x1="8" y1="2" x2="8" y2="6" />
                        <line x1="3" y1="10" x2="21" y2="10" />
                      </svg>
                    </div>
                    <div>
                      <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">{libelle.titre}</p>
                      <p className="text-sm font-semibold text-[var(--text-primary)]">
                        {libelle.valeur}
                        {age !== null && age >= 1 && (
                          <span className="text-[var(--text-secondary)] font-normal"> · {age} {age > 1 ? "ans" : "an"} d&apos;activité</span>
                        )}
                      </p>
                    </div>
                  </div>
                );
              })()}
              {pro.effectif_range && formatEffectifRange(pro.effectif_range) && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-muted)" }}>
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                  <div>
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Taille de l&apos;équipe</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {formatEffectifRange(pro.effectif_range)}
                      <span className="text-[var(--text-tertiary)] font-normal text-xs"> · INSEE</span>
                    </p>
                  </div>
                </div>
              )}
              {/* ACTIVITE DECLAREE AU REGISTRE (17/08/2026).
                  Le code d'activite est en base sur 2 050 350 fiches et
                  n'etait affiche nulle part. C'est la donnee gratuite qui
                  distingue le mieux deux entreprises voisines : deux macons
                  de la meme ville peuvent etre l'un en "maconnerie generale
                  et gros oeuvre", l'autre en "travaux de charpente". */}
              {libelleNaf(pro.naf_code) && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-muted)" }}>
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Activité déclarée</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {libelleNaf(pro.naf_code)}
                      <span className="text-[var(--text-tertiary)] font-normal text-xs"> · code {pro.naf_code}</span>
                    </p>
                  </div>
                </div>
              )}
              {/* FORME JURIDIQUE (19/08/2026). Renseignee pour 100 % des
                  entreprises au registre. 47 % sont "entrepreneur individuel",
                  donc elle ne distingue deux voisins qu'une fois sur deux :
                  c'est un apport modeste, mais c'est la derniere donnee
                  gratuite disponible sur l'ensemble de la base. */}
              {formeJuridiqueDistinctive(pro.forme_juridique) && (
                <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-4 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ backgroundColor: "var(--accent-muted)" }}>
                    <svg className="w-5 h-5 text-[var(--accent)]" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M3 21h18M5 21V7l7-4 7 4v14M9 21v-4h6v4" />
                    </svg>
                  </div>
                  <div className="min-w-0">
                    <p className="text-xs text-[var(--text-tertiary)] uppercase tracking-wide">Forme juridique</p>
                    <p className="text-sm font-semibold text-[var(--text-primary)]">
                      {formeJuridiqueDistinctive(pro.forme_juridique)}
                      <span className="text-[var(--text-tertiary)] font-normal text-xs"> · INSEE</span>
                    </p>
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Section RGE officielle ADEME : affichee uniquement si rge_certified.
              Sync auto via scripts/match-rge-pros.ts depuis le dataset officiel
              data.ademe.fr. Plus credible que le champ certifications user-input
              parce que la source est gouvernementale et qu'on filtre les qualifs
              expirees au moment du sync. */}
          {pro.rge_certified && Array.isArray(pro.rge_qualifications) && pro.rge_qualifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
                  Qualifications RGE officielles
                </h2>
                <span className="text-[10px] text-[var(--text-tertiary)] uppercase tracking-wider px-2 py-0.5 rounded-full border border-[var(--card-border)]">
                  Source ADEME
                </span>
              </div>
              <div className="bg-blue-50 dark:bg-blue-950/20 border border-blue-200 dark:border-blue-900/50 rounded-2xl p-5">
                <p className="text-xs text-blue-700 dark:text-blue-400 leading-relaxed mb-4">
                  Cette entreprise est officiellement reconnue garante de l&apos;environnement (RGE) sur le registre national de l&apos;ADEME. Les travaux RGE sont éligibles à MaPrimeRénov&apos;, aux CEE, et aux aides locales.
                </p>
                <div className="space-y-2.5">
                  {pro.rge_qualifications.map((q, i) => (
                    <div key={i} className="flex items-start gap-3 text-sm">
                      <svg className="w-4 h-4 text-blue-600 dark:text-blue-400 shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                      </svg>
                      <div className="flex-1">
                        {/* On affiche `domaine` (vocabulaire contrôlé ADEME,
                            accents corrects) plutôt que `nom` (champ libre dont
                            les accents ont été strippés à l'import ADEME →
                            "gnrateur photovoltaque"). Fallback `nom` si vide. */}
                        <p className="text-[var(--text-primary)] font-medium leading-snug">
                          {q.domaine || q.nom}
                        </p>
                        <p className="text-xs text-[var(--text-secondary)] mt-0.5">
                          {q.organisme && <span className="capitalize">{q.organisme}</span>}
                          {q.organisme && q.meta_domaine && " · "}
                          {q.meta_domaine}
                          {q.date_fin && (
                            <span className="text-[var(--text-tertiary)]">
                              {(q.organisme || q.meta_domaine) && " · "}
                              valide jusqu&apos;au {new Date(q.date_fin).toLocaleDateString("fr-FR")}
                            </span>
                          )}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Coordonnees */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {/* Adresse */}
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
              <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                Adresse
              </h2>
              <p className="text-[var(--text-primary)] text-sm">
                {pro.address || "Non renseignée"}
                {pro.city && (
                  <>
                    <br />
                    {pro.postal_code} {pro.city.name}
                  </>
                )}
              </p>
            </div>

            {/* Coordonnées : floutées si la fiche n'est PAS réclamée. Le
                particulier doit déposer un projet pour être mis en relation
                (= lead capté), et le pro est incité à réclamer sa fiche pour
                récupérer ses clients. Affichées normalement si réclamée. */}
            {blurCoords ? (
              <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5 flex flex-col">
                <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                  Coordonnées
                </h2>
                {pro.phone ? (
                  <p className="text-[var(--text-primary)] text-base font-medium">
                    {phoneTeaserVisible}{" "}
                    <span
                      className="blur-[5px] select-none align-middle"
                      aria-hidden="true"
                    >
                      {phoneTeaserMasked || "●●"}
                    </span>
                  </p>
                ) : (
                  <p
                    className="text-[var(--text-primary)] text-base font-medium blur-[5px] select-none"
                    aria-hidden="true"
                  >
                    {"●● ●● ●● ●● ●●"}
                  </p>
                )}
                {pro.email && (
                  <p className="text-[var(--text-primary)] text-sm font-medium mt-2 break-all">
                    {emailTeaserVisible}
                    <span
                      className="blur-[5px] select-none"
                      aria-hidden="true"
                    >
                      {emailTeaserMasked}
                    </span>
                  </p>
                )}
                <p className="text-xs text-[var(--text-tertiary)] mt-2 mb-3">
                  Coordonnées masquées : déposez votre projet pour être
                  recontacté.
                </p>
                <Link
                  href={`/deposer-projet?categorie=${pro.category.slug}${pro.city ? `&ville=${pro.city.slug}` : ""}`}
                  className="inline-flex items-center justify-center gap-1.5 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-4 py-2 rounded-full text-xs font-semibold transition-all duration-250 hover:scale-[1.02] mt-auto self-start"
                >
                  {isServiceVertical ? "Trouver des pros" : "Trouver des artisans"}
                  <span aria-hidden="true">→</span>
                </Link>
              </div>
            ) : (
              <>
                {/* Telephone */}
                {pro.phone && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                    <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                      Téléphone
                    </h2>
                    <a
                      href={`tel:${pro.phone}`}
                      className="text-[var(--text-primary)] text-sm hover:text-[var(--accent)] transition-colors duration-250"
                    >
                      {pro.phone}
                    </a>
                  </div>
                )}

                {/* Email */}
                {pro.email && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                    <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                      Email
                    </h2>
                    <a
                      href={`mailto:${pro.email}`}
                      className="text-[var(--accent)] text-sm hover:underline"
                    >
                      {pro.email}
                    </a>
                  </div>
                )}

                {/* Site web */}
                {pro.website && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                    <h2 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">
                      Site web
                    </h2>
                    <a
                      href={pro.website.startsWith("http") ? pro.website : `https://${pro.website}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-[var(--accent)] text-sm hover:underline break-all"
                    >
                      {pro.website}
                    </a>
                  </div>
                )}
              </>
            )}
          </div>

          {/* Bloc SEO unique sur l'entreprise (À propos + FAQ + FAQPage schema) :
              sort la fiche du « squelette » : contenu factuel Sirene + prix sourcés,
              centré sur CETTE entreprise (anti-duplicate listings), zéro invention. */}
          {proContent && (
            <ProSeoSections content={proContent} proName={pro.name} />
          )}

          {/* Certifications (fiches réclamées) */}
          {isClaimed && certifications.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Certifications et labels
              </h2>
              <div className="flex flex-wrap gap-2">
                {certifications.map((cert) => (
                  <span
                    key={cert}
                    className="inline-block text-[var(--accent-badge-text)] text-sm font-medium px-3 py-1.5 rounded-full"
                    style={{ backgroundColor: "var(--accent-muted)" }}
                  >
                    {cert}
                  </span>
                ))}
              </div>
              {pro.rge_number && (
                <p className="text-xs text-[var(--text-tertiary)] mt-2">
                  N° RGE : {pro.rge_number}
                </p>
              )}
            </div>
          )}

          {/* Tarifs (fiches réclamées) */}
          {isClaimed && (pro.hourly_rate || pro.travel_fee) && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Tarifs indicatifs
              </h2>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                {pro.hourly_rate && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Tarif horaire</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{pro.hourly_rate} &euro;/h</p>
                  </div>
                )}
                {pro.travel_fee && (
                  <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5">
                    <p className="text-xs text-[var(--text-tertiary)] mb-1">Frais de déplacement</p>
                    <p className="text-lg font-semibold text-[var(--text-primary)]">{pro.travel_fee} &euro;</p>
                  </div>
                )}
              </div>
            </div>
          )}

          {/* Modes de paiement (fiches réclamées) */}
          {isClaimed && paymentMethods.length > 0 && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Moyens de paiement
              </h2>
              <div className="flex flex-wrap gap-2">
                {paymentMethods.map((method) => (
                  <span
                    key={method}
                    className="inline-block bg-[var(--bg-secondary)] border border-[var(--card-border)] text-[var(--text-secondary)] text-sm font-medium px-3 py-1.5 rounded-full"
                  >
                    {PAYMENT_LABELS[method] || method}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Horaires d'ouverture (fiches réclamées) */}
          {isClaimed && openingHours && (
            <div>
              <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
                Horaires d&apos;ouverture
              </h2>
              <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-5 space-y-2">
                {Object.entries(DAY_LABELS).map(([key, label]) => {
                  const day = (openingHours as Record<string, DaySchedule>)[key];
                  if (!day) return null;
                  return (
                    <div key={key} className="flex justify-between text-sm">
                      <span className={day.open ? "text-[var(--text-primary)]" : "text-[var(--text-tertiary)]"}>
                        {label}
                      </span>
                      <span className={day.open ? "text-[var(--text-primary)] font-medium" : "text-[var(--text-tertiary)]"}>
                        {day.open ? `${day.from} à ${day.to}` : "Fermé"}
                      </span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {/* Garanties (fiches réclamées) */}
          {isClaimed && (pro.has_rc_pro || pro.has_decennale) && (
            <div className="flex flex-wrap gap-3">
              {pro.has_rc_pro && (
                <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-medium px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  RC Professionnelle
                </span>
              )}
              {pro.has_decennale && (
                <span className="inline-flex items-center gap-1.5 bg-green-100 dark:bg-green-950/30 text-green-700 dark:text-green-400 text-sm font-medium px-3 py-1.5 rounded-full">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                  </svg>
                  Garantie décennale
                </span>
              )}
            </div>
          )}

          {/* Liens retour */}
          <div className="pt-8 border-t border-[var(--border-color)] flex flex-wrap gap-4">
            <Link
              href={`/${pro.category.slug}/${deptSlug}`}
              className="text-sm text-[var(--accent)] hover:underline"
            >
              Tous les {pro.category.name.toLowerCase()}s en{" "}
              {pro.city?.department?.name || "Vienne"}
            </Link>
            {pro.city && (
              <Link
                href={`/${pro.category.slug}/${pro.city.slug}`}
                className="text-sm text-[var(--accent)] hover:underline"
              >
                {pro.category.name} à {pro.city.name}
              </Link>
            )}
          </div>

          {/* Maillage interne → guides de prix du métier */}
          <ProGuidesLinks
            metierSlug={pro.category.slug}
            metierName={pro.category.name}
          />
        </div>

        {/* Colonne droite · Sidebar sticky */}
        <div className="lg:sticky lg:top-[96px] lg:self-start space-y-6">
          {/* CTA sidebar : appeler le pro si phone defini, sinon orienter
              vers le depot de projet pre-rempli (categorie + ville).
              Texte ajuste (Levier D) : "Appeler ce pro" est plus direct
              que "Contacter", et "Demander un devis (gratuit)" est plus
              clair que "Deposer un projet" (jargon plateforme). */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 text-center">
            <h3 className="font-semibold text-[var(--text-primary)] mb-3">
              {blurCoords ? "Quel est votre projet ?" : "Besoin de ce professionnel ?"}
            </h3>
            {pro.phone && !blurCoords ? (
              <a
                href={`tel:${pro.phone}`}
                className="block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
              >
                Appeler ce pro
              </a>
            ) : (
              <Link
                href={`/deposer-projet?categorie=${pro.category.slug}${pro.city ? `&ville=${pro.city.slug}` : ""}`}
                className="block bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
              >
                {isServiceVertical ? "Trouver des pros" : "Trouver des artisans"}
              </Link>
            )}
            <p className="mt-3 text-xs text-[var(--text-tertiary)]">
              Sans engagement
            </p>
          </div>

          {/* Note : l'ancien encart sidebar "Reclamer cette fiche" a ete
              supprime. Le CTA est desormais double : (1) banniere haute
              full-width juste apres le breadcrumb (ci-dessus) et (2) section
              card mid-page coral dans la colonne gauche avec les 4 benefices.
              Pattern issu de la recherche CTA 2026 sur Yelp/Google/Houzz. */}

          {/* Infos complementaires */}
          <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 space-y-4">
            {pro.siret && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                  {pro.city?.country === "BE"
                    ? "Numéro d'entreprise (BCE)"
                    : "SIRET"}
                </h4>
                <p className="text-sm text-[var(--text-secondary)] font-mono">
                  {pro.siret}
                </p>
                {pro.city?.country === "BE" && (
                  // Obligation licence BCE open data (art. 2.8) : indiquer la
                  // source des données + attribution registre officiel.
                  <p className="mt-1 text-xs text-[var(--text-tertiary)]">
                    Source :{" "}
                    <a
                      href={`https://kbopub.economie.fgov.be/kbopub/toonondernemingps.html?ondernemingsnummer=${pro.siret}&lang=fr`}
                      target="_blank"
                      rel="noopener noreferrer nofollow"
                      className="underline hover:text-[var(--accent)]"
                    >
                      Banque-Carrefour des Entreprises
                    </a>{" "}
                    (SPF Économie)
                  </p>
                )}
              </div>
            )}
            {pro.city?.department && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                  {pro.city?.country === "BE" ? "Province" : "Département"}
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {pro.city.department.country === "BE"
                    ? `${pro.city.department.name} (Belgique)`
                    : `${pro.city.department.name} (${pro.city.department.code})`}
                </p>
              </div>
            )}
            <div>
              <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                Catégorie
              </h4>
              <p className="text-sm text-[var(--text-secondary)]">
                {pro.category.name}
              </p>
            </div>
            {isClaimed && pro.intervention_radius_km && (
              <div>
                <h4 className="text-xs font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-1">
                  Zone d&apos;intervention
                </h4>
                <p className="text-sm text-[var(--text-secondary)]">
                  {pro.intervention_radius_km} km autour de {cityName || "son adresse"}
                </p>
              </div>
            )}
            {isClaimed && pro.urgency_available && (
              <div>
                <span className="inline-flex items-center gap-1.5 text-[var(--accent)] text-sm font-medium">
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                  Disponible en urgence
                </span>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Avis Workwave + Google */}
      <ProReviewsBlock
        reviews={reviews}
        workwaveAvg={pro.workwave_reviews_avg ?? null}
        workwaveCount={pro.workwave_reviews_count ?? 0}
        googleRating={pro.google_rating ?? null}
        googleReviewsCount={pro.google_reviews_count ?? null}
      />

      {/* Pros similaires */}
      {similarPros.length > 0 && (
        <div className="mt-16 pt-8 border-t border-[var(--border-color)]">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Autres {pro.category.name.toLowerCase()}s à {cityName}
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {similarPros.map((p) => (
              <ProCard key={p.id} pro={p} />
            ))}
          </div>
        </div>
      )}

      {/* Communes voisines */}
      {nearbyCities.length > 0 && (
        <div className="mt-12 pt-8 border-t border-[var(--border-color)]">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            {pro.category.name} dans les communes voisines
          </h2>
          <div className="flex flex-wrap gap-3">
            {nearbyCities.map((city) => (
              <Link
                key={city.id}
                href={`/${pro.category.slug}/${city.slug}`}
                className="px-4 py-2 bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {pro.category.name} à {city.name}
              </Link>
            ))}
          </div>
        </div>
      )}

      {/* CTA "Pas le bon artisan ?" -> /deposer-projet pre-rempli.
          77% du trafic SEO arrive sur ces fiches (recherches navigationnelles
          type "nom de l'entreprise") -> on offre une alternative non bloquante
          aux visiteurs dont le pro ne convient pas / est indisponible. */}
      <ProjectCTABlock
        proName={pro.name}
        categorySlug={pro.category.slug}
        categoryName={pro.category.name}
        citySlug={pro.city?.slug ?? null}
        cityName={pro.city?.name ?? null}
      />

      {/* RGPD */}
      <div className="mt-12 pt-8 border-t border-[var(--border-color)] text-xs text-[var(--text-tertiary)]">
        <p>
          Les informations affichées proviennent de sources publiques (
          {pro.city?.country === "BE"
            ? "Banque-Carrefour des Entreprises"
            : "registre Sirene"}
          ).{" "}
          <a
            href={`/artisan/${slug}/supprimer`}
            rel="nofollow"
            className="underline hover:text-[var(--accent)] transition-colors duration-250"
          >
            Demander la suppression de cette fiche
          </a>
        </p>
      </div>
    </main>
  );
}

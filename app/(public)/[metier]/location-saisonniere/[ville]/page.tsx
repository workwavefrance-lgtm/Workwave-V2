import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import ProCard from "@/components/pro/ProCard";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { URGENCE_CONTENT } from "@/lib/data/urgence-content";
import { BASE_URL } from "@/lib/constants";
import { HouseSparkleArt } from "@/components/seo/PilierArt";
import {
  getTouristicCity,
  citiesInSameZone,
  type TouristicCity,
} from "@/lib/data/touristic-cities";
import { getCityBySlug } from "@/lib/queries/cities";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getProsByCategoryAndCity } from "@/lib/queries/pros";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import {
  fmtEur,
  PriceRangesCard,
  InfoCallout,
  HeroCta,
  PostPriceCta,
  SiretNote,
  FinalCtaSection,
  MaillageCard,
  VillePills,
} from "@/components/seo/PilierBlocks";

/**
 * Page territoriale "ménage location saisonnière / Airbnb × ville touristique" :
 *   /menage/location-saisonniere/[ville]
 *
 * Décline le pilier national (/menage/location-saisonniere) sur ~88 communes
 * touristiques VÉRIFIÉES en base (lib/data/touristic-cities.ts). Intention :
 * "ménage airbnb Biarritz", "femme de ménage location saisonnière Arcachon"…
 * — audience : hôtes/propriétaires en zone touristique, demande saisonnière.
 *
 * Contenu RICHE même sans pros (prix sourcés + statuts + FAQ localisée + maillage
 * de zone) → JAMAIS thin, donc indexable (règle noindex CLAUDE.md 27/04). Pas de
 * redirect : la page vaut par son contenu, la liste de pros est un bonus.
 *
 * ⚠️ Ne JAMAIS ajouter de loading.tsx sur cette route (casse notFound()).
 */
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

const LOCATION_SAISONNIERE_METIERS = new Set(["menage"]);

type Props = { params: Promise<{ metier: string; ville: string }> };

// Phrase d'accroche adaptée au type de destination.
function kindPhrase(city: TouristicCity): string {
  switch (city.kind) {
    case "mer":
      return `station balnéaire prisée, ${city.name} vit au rythme des locations de bord de mer : entre deux séjours, souvent le samedi, le ménage doit être bouclé dans la journée, linge compris`;
    case "montagne":
      return `destination de montagne, ${city.name} enchaîne les séjours en chalets et appartements de vacances : le turnover entre deux locations laisse peu de temps pour un ménage complet, linge inclus`;
    default:
      return `ville touristique, ${city.name} compte de nombreux meublés et appartements loués en courte durée : entre un départ et une arrivée, le ménage de fin de séjour se joue en quelques heures, linge compris`;
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, ville } = await params;
  if (!LOCATION_SAISONNIERE_METIERS.has(metier)) return {};
  const city = getTouristicCity(ville);
  const content = URGENCE_CONTENT[metier];
  if (!city || !content) return {};

  const year = new Date().getFullYear();
  const studio = content.priceRanges[0];
  const title = `Ménage Airbnb à ${city.name} : prix ${year} et prestataires (${city.dept})`;
  const description = `Ménage de location saisonnière à ${city.name} : forfait fin de séjour ${studio.low} à ${studio.high} € constaté pour un studio/T2. Prestataires SIRET vérifiés, gratuit et sans commission.`;

  return {
    title: { absolute: title },
    description,
    alternates: {
      canonical: `${BASE_URL}/${metier}/location-saisonniere/${ville}`,
    },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${BASE_URL}/${metier}/location-saisonniere/${ville}`,
    },
  };
}

export default async function MenageLocationSaisonniereVillePage({
  params,
}: Props) {
  const { metier, ville } = await params;
  if (!LOCATION_SAISONNIERE_METIERS.has(metier)) notFound();

  const touristic = getTouristicCity(ville);
  if (!touristic) notFound();

  const content = URGENCE_CONTENT[metier];
  if (!content) notFound();

  const city = await getCityBySlug(ville);
  const category = await getCategoryBySlug(metier);
  if (!city || !category) notFound();

  const year = new Date().getFullYear();
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString(
    "fr-FR",
    { month: "long", year: "numeric" }
  );

  const studio = content.priceRanges[0];
  const maison = content.priceRanges[1];
  const horaire = content.priceRanges[2];
  const linge = content.priceRanges[3];

  // Pros ménage de la commune (bonus : renforce la page, sinon on l'omet).
  const prosResult = await getProsByCategoryAndCity(category.id, city.id, {
    pageSize: 9,
  });
  const pros = prosResult.data;
  const cityDeptSlug = generateDepartmentSlug(city.department);

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Ménage", href: `/${metier}` },
    {
      label: "Location saisonnière",
      href: `/${metier}/location-saisonniere`,
    },
    { label: touristic.name },
  ];

  const faqs = [
    {
      question: `Quel est le prix d'un ménage de fin de séjour à ${touristic.name} ?`,
      answer: `Les prix constatés en ${year} : ${fmtEur(studio.low)} € à ${fmtEur(
        studio.high
      )} € en forfait pour un studio ou un T2, et ${fmtEur(maison.low)} € à ${fmtEur(
        maison.high
      )} € pour une maison ou une villa. En tarif horaire, une entreprise de ménage facture ${fmtEur(
        horaire.low
      )} € à ${fmtEur(horaire.high)} € de l'heure, et le traitement du linge est constaté entre ${fmtEur(
        linge.low
      )} € et ${fmtEur(
        linge.high
      )} € par lit. À ${touristic.name} comme ailleurs, demandez un devis écrit précisant ce qui est inclus (vitres, linge, escaliers) pour éviter les suppléments surprise.`,
    },
    {
      question: `Comment trouver une femme de ménage pour ma location à ${touristic.name} ?`,
      answer: `Décrivez votre logement et votre rythme de séjours sur Workwave : votre demande devient visible par les professionnels du ménage au SIRET vérifié de ${touristic.name} et des environs (${touristic.dept}), qui vous recontactent directement. C'est gratuit et sans commission. En haute saison, réservez votre prestataire à l'avance : les créneaux autour des arrivées et départs du samedi sont les plus tendus.`,
    },
    {
      question: "Un auto-entrepreneur peut-il faire le ménage de mon Airbnb ?",
      answer:
        "Oui. Un auto-entrepreneur ou un indépendant peut assurer le ménage de votre location saisonnière : il vous remet une facture et dispose d'un numéro SIRET vérifiable au registre officiel. Vérifiez aussi son assurance responsabilité civile professionnelle. La majorité des professionnels du ménage exercent en indépendant, et ils sont les bienvenus sur Workwave.",
    },
    {
      question: "Peut-on facturer le ménage au voyageur ?",
      answer: `Oui. Les frais de ménage peuvent être facturés au voyageur sur les plateformes de location saisonnière. Pour fixer ce montant, appuyez-vous sur les prix constatés : ${fmtEur(
        studio.low
      )} € à ${fmtEur(
        studio.high
      )} € en forfait fin de séjour pour un studio ou un T2, selon les sources consultées.`,
    },
    {
      question: "Quels risques si je paie sans déclarer ?",
      answer:
        "Le travail dissimulé est interdit : un propriétaire qui rémunère un intervenant sans cadre déclaré s'expose à des redressements et sanctions URSSAF. Passez par un prestataire déclaré (facture et SIRET vérifiable) ou par l'emploi direct déclaré via le CESU.",
    },
  ];

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);
  const faqJsonLd = getFaqSchema(faqs);
  const itemListJsonLd =
    pros.length > 0
      ? {
          "@context": "https://schema.org",
          "@type": "ItemList",
          name: `Prestataires de ménage à ${touristic.name}`,
          itemListElement: pros.map((pro, i) => ({
            "@type": "ListItem",
            position: i + 1,
            item: {
              "@type": "LocalBusiness",
              name: pro.name,
              url: `${BASE_URL}/artisan/${pro.slug}`,
            },
          })),
        }
      : null;

  const zoneCities = citiesInSameZone(ville, 6);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      {itemListJsonLd && <JsonLd data={itemListJsonLd} />}
      <StickyProjectCTA
        categorySlug={metier}
        categoryName="Ménage"
        citySlug={city.slug}
        locationName={touristic.name}
        preposition="à"
        tagline="Recevez des devis de pros SIRET vérifiés, gratuitement."
        ctaText="Demander un devis"
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        Ménage Airbnb et location saisonnière à {touristic.name} : prix et
        prestataires
      </h1>

      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>
            {touristic.zone} — {kindPhrase(touristic)}. Côté budget, comptez{" "}
            {fmtEur(studio.low)} € à {fmtEur(studio.high)} € constatés en forfait
            fin de séjour pour un studio ou un T2, et {fmtEur(maison.low)} € à{" "}
            {fmtEur(maison.high)} € pour une maison ou une villa. Cette page
            rassemble les prix réellement constatés (sources citées), les
            professionnels du ménage vérifiés de {touristic.name}, et les bons
            réflexes avant de confier vos clés.
          </p>
        </div>
        <HouseSparkleArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      <HeroCta
        href={`/deposer-projet?categorie=${metier}&ville=${city.slug}`}
        label={`Trouver une aide ménage à ${touristic.name}`}
        note={`Gratuit, sans engagement — votre demande est visible par les pros du ménage SIRET vérifiés de ${touristic.name} et des environs, qui vous recontactent directement.`}
      />

      {/* ─── Prix constatés ─── */}
      <section className="mb-12">
        <PriceRangesCard
          heading={`Prix constatés ${year}`}
          metaLabel={`Données ${retrievedLabel}`}
          priceRanges={content.priceRanges}
          sources={content.sources}
        />
        <InfoCallout
          title="Haute saison touristique."
          text={content.majorations}
        />
        <PostPriceCta
          href={`/deposer-projet?categorie=${metier}&ville=${city.slug}`}
          text={`Recevez des devis dans ces fourchettes, de la part de pros du ménage vérifiés à ${touristic.name}.`}
          linkLabel="Demander un devis gratuit"
        />
      </section>

      {/* ─── Prestataires locaux (si dispo) ─── */}
      {pros.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
            Professionnels du ménage à {touristic.name}
          </h2>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
            Ces professionnels du ménage sont référencés à {touristic.name},
            chacun avec un SIRET vérifiable au registre officiel. Déposez votre
            demande pour être mis en relation avec ceux disponibles pour vos
            dates.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            {pros.map((pro) => (
              <ProCard key={pro.id} pro={pro} />
            ))}
          </div>
          <SiretNote text={`chaque professionnel du ménage référencé à ${touristic.name} dispose d'un SIRET vérifiable au registre officiel SIRENE. Vous pouvez contrôler l'identité de l'entreprise ou de l'indépendant avant de confier vos clés.`} />
        </section>
      )}

      {/* ─── Statuts (identique pilier, référence légale) ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Entreprise, auto-entrepreneur ou CESU : qui peut faire votre ménage ?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Trois cadres légaux existent pour faire faire le ménage de votre
          location à {touristic.name}. Aucun n&apos;est meilleur dans
          l&apos;absolu : tout dépend de votre volume de séjours.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--card-border)] p-5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              CESU (particulier-employeur)
            </span>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
              Vous employez directement une personne et la déclarez via le CESU :
              le cadre simple de l&apos;emploi direct par un particulier.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] p-5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Auto-entrepreneur / indépendant
            </span>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
              Facture et SIRET vérifiable : idéal pour un logement ou deux. La
              majorité des pros du ménage exercent en indépendant.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] p-5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Entreprise de ménage
            </span>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
              Facture, assurance RC pro et des équipes : adaptée pour gérer
              plusieurs logements en haute saison.
            </p>
          </div>
        </div>
      </section>

      <FinalCtaSection
        href={`/deposer-projet?categorie=${metier}&ville=${city.slug}`}
        title={`Besoin d'une aide ménage fiable à ${touristic.name} ?`}
        text="Décrivez votre logement et votre rythme de séjours, recevez des devis de prestataires SIRET vérifiés près de chez vous — gratuit, sans commission."
        buttonLabel="Demander un devis gratuitement"
        footnote="Gratuit · sans engagement · demande visible par les pros de votre zone"
      />

      <FaqAccordion
        faqs={faqs}
        title={`Questions fréquentes — ménage en location saisonnière à ${touristic.name}`}
      />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MaillageCard
            href={`/${metier}/location-saisonniere`}
            title="Ménage Airbnb : le guide"
            subtitle="Prix, statuts et pièges — la page nationale"
          />
          <MaillageCard
            href={`/${metier}/${city.slug}`}
            title={`Ménage à ${touristic.name}`}
            subtitle="Toutes les aides ménagères de la commune"
          />
          <MaillageCard
            href={`/${metier}/${cityDeptSlug}`}
            title={`Ménage — ${city.department.name}`}
            subtitle="Élargir la recherche au département"
          />
        </div>

        {zoneCities.length > 0 && (
          <VillePills
            title={`Ménage location saisonnière — ${touristic.zone}`}
            links={zoneCities.map((c) => ({
              href: `/${metier}/location-saisonniere/${c.slug}`,
              label: `Ménage ${c.name}`,
            }))}
          />
        )}
      </div>
    </main>
  );
}

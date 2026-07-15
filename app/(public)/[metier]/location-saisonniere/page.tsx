import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { URGENCE_CONTENT } from "@/lib/data/urgence-content";
import { TOURISTIC_CITIES } from "@/lib/data/touristic-cities";
import { BASE_URL } from "@/lib/constants";
import { HouseSparkleArt } from "@/components/seo/PilierArt";
import {
  fmtEur,
  PriceRangesCard,
  InfoCallout,
  HeroCta,
  PostPriceCta,
  ScamWarningsList,
  PostScamCta,
  GoodReflexesList,
  SiretNote,
  LegalFactsList,
  FinalCtaSection,
  MaillageCard,
  VillePills,
} from "@/components/seo/PilierBlocks";

/**
 * Page pilier "ménage location saisonnière" : /[metier]/location-saisonniere
 * (menage only). Segment statique prioritaire sur /[metier]/[location] (même
 * pattern que /[metier]/urgence, /[metier]/obligation, /[metier]/installation).
 *
 * Intention de recherche : "ménage airbnb" / "ménage location saisonnière" /
 * "prix ménage fin de séjour" — audience : hôtes Airbnb, propriétaires de
 * gîtes et résidences secondaires (turnover entre deux locations, samedi de
 * changement, linge).
 *
 * Angle éditorial : transparence prix + statuts légaux de l'intervenant
 * (entreprise / auto-entrepreneur / CESU). Tous les chiffres viennent de
 * lib/data/urgence-content.ts (sourcé via Perplexity, sources citées) — zéro
 * chiffre inventé, zéro promesse de délai.
 *
 * ⚠️ Ne JAMAIS ajouter de loading.tsx sur cette route (casse notFound()).
 */
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

const LOCATION_SAISONNIERE_METIERS = new Set(["menage"]);

type Props = { params: Promise<{ metier: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  if (!LOCATION_SAISONNIERE_METIERS.has(metier)) return {};
  const content = URGENCE_CONTENT[metier];
  if (!content) return {};

  const year = new Date().getFullYear();
  const studio = content.priceRanges[0];
  const title = `Ménage Airbnb et location saisonnière : prix ${year} et bien choisir`;
  const description = `Ménage Airbnb, gîte ou résidence secondaire : forfait fin de séjour ${studio.low} à ${studio.high} € constaté pour un studio/T2. Prestataires SIRET vérifiés, gratuit et sans commission.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}/${metier}/location-saisonniere` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${BASE_URL}/${metier}/location-saisonniere`,
    },
  };
}

export default async function MenageLocationSaisonnierePage({ params }: Props) {
  const { metier } = await params;
  if (!LOCATION_SAISONNIERE_METIERS.has(metier)) notFound();
  const content = URGENCE_CONTENT[metier];
  if (!content) notFound();

  const year = new Date().getFullYear();
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const studio = content.priceRanges[0];
  const maison = content.priceRanges[1];
  const horaire = content.priceRanges[2];
  const linge = content.priceRanges[3];

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Ménage", href: `/${metier}` },
    { label: "Location saisonnière" },
  ];

  // FAQ — réponses dérivées UNIQUEMENT du contenu sourcé (urgence-content.ts).
  const faqs = [
    {
      question: "Quel est le prix d'un ménage de fin de séjour ?",
      answer: `Les prix constatés en ${year} : ${fmtEur(studio.low)} € à ${fmtEur(studio.high)} € en forfait pour un studio ou un T2, et ${fmtEur(maison.low)} € à ${fmtEur(maison.high)} € pour une maison ou une villa. En tarif horaire, une entreprise de ménage facture ${fmtEur(horaire.low)} € à ${fmtEur(horaire.high)} € de l'heure, et le traitement du linge est constaté entre ${fmtEur(linge.low)} € et ${fmtEur(linge.high)} € par lit. Demandez un devis écrit précisant ce qui est inclus (vitres, linge, escaliers) pour éviter les suppléments surprise.`,
    },
    {
      question: "Peut-on payer en CESU pour une location saisonnière ?",
      answer:
        "Le CESU couvre l'emploi direct d'une personne par un particulier, dans le cadre du statut de particulier-employeur. Pour le ménage d'un logement loué en saisonnier, vérifiez que votre situation relève bien de ce cadre avant de l'utiliser ; si vous passez par une entreprise de ménage ou un indépendant, c'est une facture qui s'applique, pas le CESU. Dans tous les cas, rémunérer un intervenant sans cadre déclaré relève du travail dissimulé et expose le propriétaire à des redressements et sanctions URSSAF.",
    },
    {
      question: "Un auto-entrepreneur peut-il faire le ménage de mon Airbnb ?",
      answer:
        "Oui. Un auto-entrepreneur ou un indépendant peut assurer le ménage de votre location saisonnière : il vous remet une facture et dispose d'un numéro SIRET vérifiable au registre officiel. Vérifiez aussi son assurance responsabilité civile professionnelle : sans elle, un dégât pendant le ménage peut rester à votre charge. La majorité des professionnels du ménage exercent en indépendant, et ils sont les bienvenus sur Workwave.",
    },
    {
      question: "Peut-on facturer le ménage au voyageur ?",
      answer: `Oui. Les frais de ménage peuvent être facturés au voyageur sur les plateformes de location saisonnière. Pour fixer ce montant, appuyez-vous sur les prix constatés : ${fmtEur(studio.low)} € à ${fmtEur(studio.high)} € en forfait fin de séjour pour un studio ou un T2, et ${fmtEur(maison.low)} € à ${fmtEur(maison.high)} € pour une maison ou une villa, selon les sources consultées.`,
    },
    {
      question: "Quels risques si je paie sans déclarer ?",
      answer:
        "Le travail dissimulé est interdit : un propriétaire qui rémunère un intervenant sans cadre déclaré s'expose à des redressements et sanctions URSSAF. En cas d'accident, de litige social ou de contrôle, sa responsabilité peut être engagée. Passez par un prestataire déclaré (facture et SIRET vérifiable) ou par l'emploi direct déclaré via le CESU.",
    },
    {
      question: "Comment organiser le ménage entre deux locations ?",
      answer:
        "Signez un contrat écrit même pour des interventions récurrentes, partagez une check-list de ménage standardisée pour chaque logement, et synchronisez les horaires de ménage avec le calendrier de réservation et les heures d'arrivée et de départ. Sécurisez la remise des clés avec un protocole clair, et prenez des photos avant/après à chaque passage sensible. En haute saison touristique, les créneaux autour des arrivées et départs du samedi sont les plus tendus : réservez votre prestataire à l'avance.",
    },
  ];

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);
  const faqJsonLd = getFaqSchema(faqs);

  // Villes phares vers les pages territoriales /menage/location-saisonniere/[ville]
  // (toutes vérifiées en base, ≥3 pros ménage). Le reste est couvert par le
  // maillage de zone de chaque page ville + le sitemap.
  const flagshipSlugs = new Set([
    "nice", "cannes", "saint-tropez", "marseille", "aix-en-provence",
    "montpellier", "sete", "perpignan", "biarritz", "bayonne",
    "arcachon", "bordeaux", "la-rochelle", "royan", "les-sables-d-olonne",
    "la-baule-escoublac", "saint-malo", "dinard", "vannes", "deauville",
    "annecy", "chamonix-mont-blanc", "ajaccio", "porto-vecchio",
  ]);
  const villes = TOURISTIC_CITIES.filter((c) => flagshipSlugs.has(c.slug));

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <StickyProjectCTA
        categorySlug={metier}
        categoryName="Ménage"
        citySlug={null}
        locationName="près de chez vous"
        preposition=""
        tagline="Recevez des devis de pros SIRET vérifiés, gratuitement."
        ctaText="Demander un devis"
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        Ménage Airbnb et location saisonnière : prix réels et bien choisir son
        prestataire
      </h1>

      {/* Intro factuelle — audience hôtes/propriétaires, illustration en regard */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>
            Hôtes Airbnb, propriétaires de gîtes ou de résidences secondaires :
            entre deux locations, le ménage doit souvent tenir dans les quelques
            heures du samedi de changement, entre un départ et une arrivée — linge
            compris. Côté budget, comptez {fmtEur(studio.low)} € à{" "}
            {fmtEur(studio.high)} € constatés en forfait fin de séjour pour un
            studio ou un T2, et {fmtEur(maison.low)} € à {fmtEur(maison.high)} €
            pour une maison ou une villa. Cette page rassemble les prix réellement
            constatés (sources citées), les statuts possibles de votre intervenant
            — entreprise de ménage, auto-entrepreneur ou emploi direct via le CESU
            —, les pièges à éviter et les bons réflexes avant de confier vos clés.
          </p>
        </div>
        <HouseSparkleArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* CTA héro — au-dessus de la ligne de flottaison. */}
      <HeroCta
        href={`/deposer-projet?categorie=${metier}`}
        label="Trouver une aide ménage vérifiée"
        note="Gratuit, sans engagement — votre demande est visible par les pros du ménage SIRET vérifiés de votre zone, qui vous recontactent directement."
      />

      {/* ─── Prix constatés ─── */}
      <section className="mb-12">
        <PriceRangesCard
          heading={`Prix constatés ${year}`}
          metaLabel={`Données ${retrievedLabel}`}
          priceRanges={content.priceRanges}
          sources={content.sources}
        />

        {/* Callout haute saison touristique */}
        <InfoCallout title="Haute saison touristique." text={content.majorations} />

        {/* CTA contextuel post-prix */}
        <PostPriceCta
          href={`/deposer-projet?categorie=${metier}`}
          text="Recevez des devis dans ces fourchettes, de la part de pros du ménage vérifiés près de chez vous."
          linkLabel="Demander un devis gratuit"
        />
      </section>

      {/* ─── Statuts : qui peut faire votre ménage ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Entreprise, auto-entrepreneur ou CESU : qui peut faire votre ménage ?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Trois cadres légaux existent pour faire faire le ménage de votre
          location. Aucun n&apos;est meilleur dans l&apos;absolu : tout dépend de
          votre volume de séjours et de votre préférence.
        </p>
        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-2xl border border-[var(--card-border)] p-5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              CESU (particulier-employeur)
            </span>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
              Vous employez directement une personne et la déclarez via le CESU :
              c&apos;est le cadre légal simple de l&apos;emploi direct par un
              particulier.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] p-5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Auto-entrepreneur / indépendant
            </span>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
              Facture et SIRET vérifiable : idéal pour un logement ou deux. La
              majorité des pros du ménage exercent en indépendant — et ils sont
              les bienvenus ici.
            </p>
          </div>
          <div className="rounded-2xl border border-[var(--card-border)] p-5">
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Entreprise de ménage
            </span>
            <p className="text-xs text-[var(--text-tertiary)] mt-1.5 leading-relaxed">
              Facture, assurance RC pro et des équipes : adaptée pour gérer
              plusieurs logements ou un grand volume de séjours.
            </p>
          </div>
        </div>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-5">
          Sur Workwave, vous trouvez du micro-entrepreneur à la société de ménage,
          tous avec un SIRET vérifiable au registre officiel — le CESU restant
          l&apos;option si vous préférez employer directement votre intervenant.
        </p>
      </section>

      {/* ─── Les pièges à éviter ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les pièges à éviter
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Travail non déclaré, prestataire non assuré, suppléments surprise :
          voici les risques les plus fréquemment signalés — dont certains pèsent
          directement sur vous, le propriétaire.
        </p>
        <ScamWarningsList warnings={content.scamWarnings} />

        {/* CTA contextuel post-pièges */}
        <PostScamCta
          href={`/deposer-projet?categorie=${metier}`}
          text="Pour écarter ces risques : décrivez votre logement et votre rythme de locations sur Workwave, et seuls des prestataires au SIRET vérifié peuvent vous répondre."
          buttonLabel="Passer par un pro vérifié"
        />
      </section>

      {/* ─── Bons réflexes de l'hôte ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les bons réflexes de l&apos;hôte
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Quelques habitudes simples sécurisent vos changements de locataires,
          même en haute saison.
        </p>
        <GoodReflexesList reflexes={content.goodReflexes} />
        <SiretNote text="chaque professionnel du ménage référencé sur Workwave dispose d'un SIRET vérifiable au registre officiel SIRENE. Vous pouvez contrôler l'identité de l'entreprise ou de l'indépendant avant de confier vos clés." />
      </section>

      {/* ─── Ce que dit la loi ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Ce que dit la loi
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Travail dissimulé, CESU, frais de ménage facturés au voyageur,
          obligations des meublés de tourisme : l&apos;essentiel du cadre légal,
          point par point.
        </p>
        <LegalFactsList facts={content.legalFacts} />
      </section>

      {/* ─── Encart pro : votre fiche gratuite ─── */}
      <section className="mb-12 rounded-2xl border border-[var(--accent)]/30 bg-[var(--bg-secondary)] p-6 sm:p-8">
        <h2 className="text-lg font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Vous proposez des ménages ?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-5">
          Auto-entrepreneur, indépendant ou société : votre fiche Workwave est{" "}
          <strong className="text-[var(--text-primary)]">gratuite</strong> — les
          propriétaires de votre zone déposent leurs demandes ici.
        </p>
        <div className="flex flex-col sm:flex-row sm:items-center gap-4">
          <Link
            href="/pro/creer-fiche"
            className="inline-flex items-center justify-center border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white px-6 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 whitespace-nowrap"
          >
            Créer ma fiche gratuite
          </Link>
          <Link
            href="/pro"
            className="text-sm text-[var(--text-secondary)] underline underline-offset-2 hover:text-[var(--accent)] transition-colors duration-200"
          >
            ou retrouvez votre fiche existante
          </Link>
        </div>
      </section>

      {/* ─── CTA principal ─── */}
      <FinalCtaSection
        href={`/deposer-projet?categorie=${metier}`}
        title="Besoin d'une aide ménage fiable pour votre location ?"
        text="Décrivez votre logement et votre rythme de séjours, recevez des devis de prestataires SIRET vérifiés près de chez vous — gratuit, sans commission."
        buttonLabel="Demander un devis gratuitement"
        footnote="Gratuit · sans engagement · demande visible par les pros de votre zone"
      />

      {/* ─── FAQ (UI + schema FAQPage injecté plus haut) ─── */}
      <FaqAccordion
        faqs={faqs}
        title="Questions fréquentes — ménage en location saisonnière"
      />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MaillageCard
            href={`/${metier}`}
            title="Ménage autour de moi"
            subtitle="Trouver une aide ménage près de chez vous"
          />
          <MaillageCard
            href={`/${metier}/prix`}
            title="Guide des prix du ménage"
            subtitle="Prix d'un ménage à domicile, le guide détaillé"
          />
          <MaillageCard
            href="/guide-des-prix/prix-femme-menage"
            title="Prix horaire d'une femme de ménage"
            subtitle="Tarifs constatés et facteurs de prix"
          />
        </div>

        <VillePills
          title="Ménage location saisonnière par ville touristique"
          links={villes.map((v) => ({
            href: `/${metier}/location-saisonniere/${v.slug}`,
            label: `Ménage ${v.name}`,
          }))}
        />
      </div>
    </main>
  );
}

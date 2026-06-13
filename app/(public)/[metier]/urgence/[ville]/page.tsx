import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { URGENCE_CONTENT, type UrgenceContent } from "@/lib/data/urgence-content";
import { BASE_URL } from "@/lib/constants";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getCityBySlug, getAggregatedCityIds } from "@/lib/queries/cities";
import {
  countProsByCategoryAndCityIds,
  getProMiniCardsByCategoryAndCityIds,
} from "@/lib/queries/pros";
import { DoorKeyArt, FlameRadiatorArt } from "@/components/seo/PilierArt";
import {
  fmtEur,
  PriceRangesCard,
  InfoCallout,
  HeroCta,
  PostPriceCta,
  ScamWarningsList,
  MaillageCard,
  VillePills,
} from "@/components/seo/PilierBlocks";

/**
 * Déclinaison PAR VILLE de la page pilier urgence : /[metier]/urgence/[ville]
 * (ex. /serrurier/urgence/paris — « serrurier urgence paris » ≈ 1 300 vol/mois).
 *
 * Page d'ACTION locale (le pilier /[metier]/urgence reste la référence
 * éditoriale complète) : prix sourcés nationaux + bloc local UNIQUE (les 3
 * premiers pros de la ville, count réel) + arnaques compactes + FAQ locale.
 *
 * GARDE ANTI-THIN STRICT : ville introuvable OU < 3 pros actifs du métier
 * dans la ville → notFound(). Le count est fait en head:true (zéro row
 * transférée — crise egress 11/06/2026).
 *
 * ⚠️ Ne JAMAIS ajouter de loading.tsx sur cette route (casse notFound()).
 * ⚠️ Le segment doit s'appeler [ville] : Next.js impose le MÊME nom de
 *    param dynamique au niveau 3 que /[metier]/[location]/[ville].
 */
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

// Whitelist + labels DUPLIQUÉS depuis app/(public)/[metier]/urgence/page.tsx :
// un page.tsx Next.js ne peut pas exporter de constantes arbitraires (seuls
// default / generateMetadata / segments config sont autorisés). Garder en
// phase avec le pilier parent à chaque ajout de métier.
const URGENCE_METIERS = new Set(["serrurier", "chauffagiste"]);

const METIER_LABELS: Record<string, { singular: string; plural: string }> = {
  serrurier: { singular: "Serrurier", plural: "serruriers" },
  chauffagiste: { singular: "Chauffagiste", plural: "chauffagistes" },
};

const HERO_ART: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  serrurier: DoorKeyArt,
  chauffagiste: FlameRadiatorArt,
};

// Grandes villes du maillage (toutes vérifiées >= 3 pros actifs pour les 2
// métiers de la whitelist au 11/06/2026 — serrurier : Paris 128, Marseille 27,
// Lyon 13, Toulouse 14, Bordeaux 11, Nantes 6).
const GRANDES_VILLES = [
  { slug: "paris", name: "Paris" },
  { slug: "marseille", name: "Marseille" },
  { slug: "lyon", name: "Lyon" },
  { slug: "toulouse", name: "Toulouse" },
  { slug: "bordeaux", name: "Bordeaux" },
  { slug: "nantes", name: "Nantes" },
];

type FaqItem = { question: string; answer: string };

/**
 * Copy spécifique au métier. Tous les chiffres viennent de `content`
 * (urgence-content.ts, sourcé) — zéro chiffre inventé, zéro promesse de délai.
 */
type VilleUrgenceConfig = {
  metaDescription: (cityName: string, count: number, content: UrgenceContent) => string;
  /** 1re phrase de l'intro (prix nationaux constatés). */
  introPriceSentence: (content: UrgenceContent) => string;
  /** FAQ Q1 : la prestation phare du métier, localisée. */
  faqQ1: (cityName: string, year: number, content: UrgenceContent) => FaqItem;
};

const VILLE_URGENCE_CONFIG: Record<string, VilleUrgenceConfig> = {
  serrurier: {
    metaDescription: (cityName, count, content) => {
      const r0 = content.priceRanges[0];
      return `Ouverture de porte claquée : ${r0.low} à ${r0.high} € constatés. ${count} serruriers vérifiés à ${cityName}, devis gratuit, sans commission.`;
    },
    introPriceSentence: (content) => {
      const claquee = content.priceRanges[0];
      const verrouillee = content.priceRanges[1];
      return `Les prix constatés au niveau national s'appliquent : une ouverture de porte claquée se facture entre ${fmtEur(claquee.low)} € et ${fmtEur(claquee.high)} € en journée, et une porte verrouillée ou blindée peut atteindre ${fmtEur(verrouillee.high)} €.`;
    },
    faqQ1: (cityName, year, content) => {
      const claquee = content.priceRanges[0];
      return {
        question: `Combien coûte une ouverture de porte claquée à ${cityName} ?`,
        answer: `Au niveau national, les prix constatés en ${year} vont de ${fmtEur(claquee.low)} € à ${fmtEur(claquee.high)} € pour une porte simplement claquée, en journée et en semaine. Les prix pratiqués à ${cityName} peuvent varier selon l'entreprise et la situation : exigez toujours un devis écrit avant l'intervention.`,
      };
    },
  },
  chauffagiste: {
    metaDescription: (cityName, count, content) => {
      const r0 = content.priceRanges[0];
      return `Dépannage de chaudière en urgence : ${r0.low} à ${r0.high} € constatés (hors pièces). ${count} chauffagistes vérifiés à ${cityName}, devis gratuit, sans commission.`;
    },
    introPriceSentence: (content) => {
      const depannage = content.priceRanges[0];
      const horaire = content.priceRanges[1];
      return `Les prix constatés au niveau national s'appliquent : un dépannage de chaudière en urgence se facture entre ${fmtEur(depannage.low)} € et ${fmtEur(depannage.high)} € (déplacement et main-d'œuvre, hors pièces), pour un tarif horaire constaté de ${fmtEur(horaire.low)} € à ${fmtEur(horaire.high)} €.`;
    },
    faqQ1: (cityName, year, content) => {
      const depannage = content.priceRanges[0];
      return {
        question: `Combien coûte un dépannage de chaudière en urgence à ${cityName} ?`,
        answer: `Au niveau national, les prix constatés en ${year} vont de ${fmtEur(depannage.low)} € à ${fmtEur(depannage.high)} € pour un dépannage urgent (déplacement et main-d'œuvre, hors pièces). Les prix pratiqués à ${cityName} peuvent varier selon l'entreprise et la panne : exigez toujours un devis écrit avant toute réparation.`,
      };
    },
  },
};

/**
 * Résolution métier + ville + count, mise en cache React (dédupliquée entre
 * generateMetadata et la Page sur la même requête → 1 seul count head:true).
 * Retourne null si métier hors whitelist, ville introuvable ou < 3 pros.
 */
const resolveVilleUrgence = cache(async (metier: string, ville: string) => {
  if (!URGENCE_METIERS.has(metier)) return null;
  const content = URGENCE_CONTENT[metier];
  const config = VILLE_URGENCE_CONFIG[metier];
  if (!content || !config) return null;

  const [category, city] = await Promise.all([
    getCategoryBySlug(metier),
    getCityBySlug(ville),
  ]);
  if (!category || !city) return null;

  // Métropoles à arrondissements (Paris/Marseille/Lyon) : agréger les
  // arrondissements comme le fait la page listing /[metier]/[ville].
  const aggregatedIds = await getAggregatedCityIds(city);
  const cityIds = aggregatedIds ?? [city.id];

  const count = await countProsByCategoryAndCityIds(category.id, cityIds);
  if (count < 3) return null; // garde anti-thin strict

  return { content, config, category, city, cityIds, count };
});

type Props = { params: Promise<{ metier: string; ville: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, ville } = await params;
  const resolved = await resolveVilleUrgence(metier, ville);
  if (!resolved) return {};

  const { content, config, city, count } = resolved;
  const labels = METIER_LABELS[metier];
  const year = new Date().getFullYear();

  const title = `${labels.singular} en urgence à ${city.name} : prix réels ${year}, ${count} ${labels.plural} vérifiés`;
  const description = config.metaDescription(city.name, count, content);
  const canonical = `${BASE_URL}/${metier}/urgence/${city.slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical },
  };
}

export default async function MetierUrgenceVillePage({ params }: Props) {
  const { metier, ville } = await params;
  const resolved = await resolveVilleUrgence(metier, ville);
  if (!resolved) notFound();

  const { content, config, category, city, cityIds, count } = resolved;
  const labels = METIER_LABELS[metier];
  const HeroArt = HERO_ART[metier] ?? DoorKeyArt;
  const year = new Date().getFullYear();
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  // Bloc local UNIQUE : les 3 premiers pros de la ville (select minimal).
  const topPros = await getProMiniCardsByCategoryAndCityIds(category.id, cityIds, 3);

  const pluralCap = labels.plural.charAt(0).toUpperCase() + labels.plural.slice(1);
  const listingHref = `/${metier}/${city.slug}`;
  const deposerHref = `/deposer-projet?categorie=${metier}&ville=${city.slug}`;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: labels.singular, href: `/${metier}` },
    { label: "Urgence", href: `/${metier}/urgence` },
    { label: city.name },
  ];

  // FAQ locale (4 Q) — réponses dérivées UNIQUEMENT du contenu sourcé.
  const faqs: FaqItem[] = [
    config.faqQ1(city.name, year, content),
    {
      question: `Comment trouver un ${labels.singular.toLowerCase()} fiable à ${city.name} ?`,
      answer: `Vérifiez le SIRET et l'identité exacte de l'entreprise au registre officiel SIRENE, et exigez un devis écrit détaillant déplacement, main-d'œuvre, pièces et TVA avant toute intervention. Les ${count} ${labels.plural} référencés à ${city.name} sur Workwave disposent d'un SIRET vérifiable, consultable depuis leur fiche.`,
    },
    {
      question: "Quelles majorations la nuit et le week-end ?",
      answer: `${content.majorations} Demandez le montant exact de la majoration avant d'accepter l'intervention.`,
    },
    {
      question: "Que vérifier avant d'appeler ?",
      answer: content.goodReflexes.slice(0, 3).join(" "),
    },
  ];

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);
  const faqJsonLd = getFaqSchema(faqs);

  const autresVilles = GRANDES_VILLES.filter((v) => v.slug !== city.slug).slice(0, 5);

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <StickyProjectCTA
        categorySlug={metier}
        categoryName={labels.singular}
        citySlug={city.slug}
        locationName={city.name}
        preposition="à "
        tagline="Recevez des devis de pros SIRET vérifiés, gratuitement."
        ctaText="Décrire mon problème"
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        {labels.singular} en urgence à {city.name} : prix réels et {count}{" "}
        {labels.plural} SIRET vérifiés
      </h1>

      {/* Intro courte LOCALISÉE (3 phrases) — illustration en regard */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>
            {config.introPriceSentence(content)} À {city.name}, {count}{" "}
            {labels.plural} au SIRET vérifiable sont référencés sur Workwave.{" "}
            Vous pouvez consulter la liste complète sur la page{" "}
            <Link
              href={listingHref}
              className="underline hover:text-[var(--accent)]"
            >
              {labels.plural} à {city.name}
            </Link>
            .
          </p>
        </div>
        <HeroArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* CTA héro — le visiteur en urgence veut une action immédiate */}
      <HeroCta
        href={deposerHref}
        label={`Trouver un ${labels.singular.toLowerCase()} vérifié à ${city.name}`}
        note={`Gratuit, sans engagement — votre demande est visible par les ${labels.plural} SIRET vérifiés de votre zone, qui vous recontactent directement.`}
      />

      {/* ─── Bloc local UNIQUE : les 3 premiers pros de la ville ─── */}
      {topPros.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            {pluralCap} vérifiés à {city.name}
          </h2>
          <ul className="grid sm:grid-cols-3 gap-4 mb-5">
            {topPros.map((pro) => (
              <li key={pro.id}>
                <Link
                  href={`/artisan/${pro.slug}`}
                  className="block h-full rounded-2xl border border-[var(--card-border)] p-5 hover:border-[var(--accent)] transition-colors duration-200"
                >
                  <span className="block text-sm font-semibold text-[var(--text-primary)] leading-snug">
                    {pro.name}
                  </span>
                  <span className="block text-xs text-[var(--text-tertiary)] mt-1.5">
                    SIRET vérifié · Voir la fiche
                  </span>
                </Link>
              </li>
            ))}
          </ul>
          <Link
            href={listingHref}
            className="inline-flex items-center justify-center border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-250"
          >
            Voir les {count} {labels.plural} à {city.name}
          </Link>
        </section>
      )}

      {/* ─── Prix sourcés nationaux (mêmes données que le pilier) ─── */}
      <section className="mb-12">
        <PriceRangesCard
          heading={`Prix constatés ${year}`}
          metaLabel={`Données ${retrievedLabel}`}
          priceRanges={content.priceRanges}
          sources={content.sources}
        />
        <InfoCallout
          title="Majorations nuit, week-end et jours fériés."
          text={content.majorations}
        />
        <PostPriceCta
          href={deposerHref}
          text={`Recevez des devis dans ces fourchettes, de la part de ${labels.plural} vérifiés à ${city.name} et autour.`}
          linkLabel="Demander un devis gratuit"
        />
      </section>

      {/* ─── Arnaques — version COMPACTE (le guide complet = le pilier) ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les arnaques au dépannage les plus courantes
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Le dépannage en urgence est l&apos;un des secteurs les plus signalés par
          les consommateurs. Les trois pratiques les plus fréquemment constatées :
        </p>
        <ScamWarningsList warnings={content.scamWarnings.slice(0, 3)} />
        <p className="mt-5 text-sm text-[var(--text-secondary)]">
          Arnaques détaillées, bons réflexes, recours et ce que dit la loi :{" "}
          <Link
            href={`/${metier}/urgence`}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            voir le guide complet {labels.singular.toLowerCase()} en urgence
          </Link>
          .
        </p>
      </section>

      {/* ─── FAQ locale (UI + schema FAQPage injecté plus haut) ─── */}
      <FaqAccordion
        faqs={faqs}
        title={`Questions fréquentes — ${labels.singular.toLowerCase()} en urgence à ${city.name}`}
      />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MaillageCard
            href={listingHref}
            title={`${pluralCap} à ${city.name}`}
            subtitle="Le listing local complet"
          />
          <MaillageCard
            href={`/${metier}/urgence`}
            title={`${labels.singular} en urgence : le guide`}
            subtitle="Prix, arnaques et recours détaillés"
          />
          <MaillageCard
            href={`/${metier}/prix`}
            title={`Guide des prix ${labels.singular.toLowerCase()}`}
            subtitle="Tous les tarifs du métier"
          />
        </div>

        <VillePills
          title={`${labels.singular} en urgence dans les grandes villes`}
          links={autresVilles.map((v) => ({
            href: `/${metier}/urgence/${v.slug}`,
            label: `${labels.singular} en urgence ${v.name}`,
          }))}
        />
      </div>
    </main>
  );
}

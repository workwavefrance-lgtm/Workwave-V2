import type { Metadata } from "next";
import { cache } from "react";
import { notFound } from "next/navigation";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { URGENCE_CONTENT } from "@/lib/data/urgence-content";
import { BASE_URL } from "@/lib/constants";
import { getCategoryBySlug } from "@/lib/queries/categories";
import { getCityBySlug, getAggregatedCityIds } from "@/lib/queries/cities";
import {
  countProsByCategoryAndCityIds,
  getProMiniCardsByCategoryAndCityIds,
} from "@/lib/queries/pros";
import { AcUnitArt } from "@/components/seo/PilierArt";
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
 * Déclinaison PAR VILLE de la page pilier pose de climatisation :
 * /[metier]/installation/[ville] (climaticien only — ex.
 * /climaticien/installation/marseille, requête SERP cible
 * « installateur climatisation marseille »).
 *
 * Page d'ACTION locale (le pilier /climaticien/installation reste la
 * référence éditoriale complète) : prix sourcés nationaux + bloc local UNIQUE
 * (les 3 premiers pros de la ville, count réel) + arnaques compactes + FAQ
 * locale.
 *
 * ⚠️ VOCABULAIRE : dans tout le texte visible, dire "installateur(s) de
 * climatisation" — jamais "climaticien" seul (langage de recherche réel ;
 * le slug technique reste /climaticien).
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

// Whitelist DUPLIQUÉE depuis app/(public)/[metier]/installation/page.tsx :
// un page.tsx Next.js ne peut pas exporter de constantes arbitraires. Garder
// en phase avec le pilier parent à chaque ajout de métier.
const INSTALLATION_METIERS = new Set(["climaticien"]);

// Grandes villes du maillage (toutes vérifiées >= 3 installateurs actifs au
// 11/06/2026 — Paris 105, Marseille 64, Toulouse 31, Nice 29, Montpellier 25,
// Lyon 22, arrondissements agrégés).
const GRANDES_VILLES = [
  { slug: "marseille", name: "Marseille" },
  { slug: "paris", name: "Paris" },
  { slug: "nice", name: "Nice" },
  { slug: "montpellier", name: "Montpellier" },
  { slug: "toulouse", name: "Toulouse" },
  { slug: "lyon", name: "Lyon" },
];

type FaqItem = { question: string; answer: string };

/**
 * Résolution métier + ville + count, mise en cache React (dédupliquée entre
 * generateMetadata et la Page sur la même requête → 1 seul count head:true).
 * Retourne null si métier hors whitelist, ville introuvable ou < 3 pros.
 */
const resolveVilleInstallation = cache(async (metier: string, ville: string) => {
  if (!INSTALLATION_METIERS.has(metier)) return null;
  const content = URGENCE_CONTENT[metier];
  if (!content) return null;

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

  return { content, category, city, cityIds, count };
});

type Props = { params: Promise<{ metier: string; ville: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier, ville } = await params;
  const resolved = await resolveVilleInstallation(metier, ville);
  if (!resolved) return {};

  const { content, city, count } = resolved;
  const year = new Date().getFullYear();
  const mono = content.priceRanges[0];

  const title = `Installateur climatisation à ${city.name} : prix ${year}, ${count} installateurs vérifiés`;
  const description = `Pose d'une clim monosplit : ${fmtEur(mono.low)} à ${fmtEur(mono.high)} € constatés (matériel et pose). ${count} installateurs de climatisation vérifiés à ${city.name}, devis gratuit, sans commission.`;
  const canonical = `${BASE_URL}/${metier}/installation/${city.slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical },
  };
}

export default async function ClimInstallationVillePage({ params }: Props) {
  const { metier, ville } = await params;
  const resolved = await resolveVilleInstallation(metier, ville);
  if (!resolved) notFound();

  const { content, category, city, cityIds, count } = resolved;
  const year = new Date().getFullYear();
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const mono = content.priceRanges[0];
  const multi = content.priceRanges[1];
  const gainable = content.priceRanges[2];

  // Bloc local UNIQUE : les 3 premiers pros de la ville (select minimal).
  const topPros = await getProMiniCardsByCategoryAndCityIds(category.id, cityIds, 3);

  const listingHref = `/${metier}/${city.slug}`;
  const deposerHref = `/deposer-projet?categorie=${metier}&ville=${city.slug}`;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Installateur de climatisation", href: `/${metier}` },
    { label: "Pose de clim", href: `/${metier}/installation` },
    { label: city.name },
  ];

  // FAQ locale (4 Q) — réponses dérivées UNIQUEMENT du contenu sourcé.
  const faqs: FaqItem[] = [
    {
      question: `Quel prix pour poser une clim à ${city.name} ?`,
      answer: `Au niveau national, les prix constatés en ${year}, matériel et pose compris : ${fmtEur(mono.low)} € à ${fmtEur(mono.high)} € pour un monosplit (une pièce), ${fmtEur(multi.low)} € à ${fmtEur(multi.high)} € pour un multisplit (plusieurs pièces), et ${fmtEur(gainable.low)} € à ${fmtEur(gainable.high)} € pour une clim gainable. Les prix pratiqués à ${city.name} peuvent varier selon l'entreprise, le logement et le dimensionnement : exigez toujours un devis écrit détaillé avant de signer.`,
    },
    {
      question: "Peut-on poser sa clim soi-même ?",
      answer:
        "Non pour une installation complète : la manipulation d'un circuit contenant des fluides frigorigènes nécessite une attestation de capacité détenue par l'entreprise. L'autoinstallation complète d'une climatisation avec raccordement frigorifique n'est donc pas librement réalisable par un particulier. Vérifiez que l'installateur possède bien les qualifications requises et qu'il peut fournir les attestations demandées.",
    },
    {
      question: "Quelles aides pour une climatisation réversible ?",
      answer:
        "Prudence sur ce point : la climatisation réversible air-air n'est pas éligible à MaPrimeRénov' en tant que telle. Les aides citées par les sources consultées portent surtout sur la TVA réduite — 10 % sur la main-d'œuvre, sous conditions de recours à un professionnel qualifié — et, selon les cas, sur d'autres dispositifs distincts. Méfiez-vous des discours commerciaux promettant une clim « éligible à toutes les aides ».",
    },
    {
      question: `Comment choisir son installateur de climatisation à ${city.name} ?`,
      answer: `Trois vérifications clés : un SIRET vérifiable au registre officiel SIRENE, une attestation de capacité pour la manipulation des fluides frigorigènes, et au moins trois devis détaillés comparés à périmètre identique (matériel, pose, mise en service, entretien éventuel). Les ${count} installateurs de climatisation référencés à ${city.name} sur Workwave disposent d'un SIRET vérifiable, consultable depuis leur fiche.`,
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
        categoryName="Pose de climatisation"
        citySlug={city.slug}
        locationName={city.name}
        preposition="à "
        tagline="Recevez des devis de pros SIRET vérifiés, gratuitement."
        ctaText="Demander un devis"
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        {`Pose de clim à ${city.name} : prix réels et ${count} installateurs de climatisation vérifiés`}
      </h1>

      {/* Intro courte LOCALISÉE (3 phrases) — illustration en regard */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>
            {`Les prix constatés au niveau national s'appliquent : la pose d'une clim monosplit se facture entre ${fmtEur(mono.low)} € et ${fmtEur(mono.high)} € (matériel et pose), et un multisplit entre ${fmtEur(multi.low)} € et ${fmtEur(multi.high)} €. À ${city.name}, ${count} installateurs de climatisation au SIRET vérifiable sont référencés sur Workwave. Vous pouvez consulter la liste complète sur la page `}
            <Link href={listingHref} className="underline hover:text-[var(--accent)]">
              {`installateurs de climatisation à ${city.name}`}
            </Link>
            .
          </p>
        </div>
        <AcUnitArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* CTA héro — au-dessus de la ligne de flottaison */}
      <HeroCta
        href={deposerHref}
        label={`Trouver un installateur vérifié à ${city.name}`}
        note="Gratuit, sans engagement — votre demande est visible par les installateurs de climatisation SIRET vérifiés de votre zone, qui vous recontactent directement."
      />

      {/* ─── Bloc local UNIQUE : les 3 premiers pros de la ville ─── */}
      {topPros.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            {`Installateurs de climatisation vérifiés à ${city.name}`}
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
            {`Voir les ${count} installateurs à ${city.name}`}
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
        <InfoCallout title="Haute saison en été." text={content.majorations} />
        <PostPriceCta
          href={deposerHref}
          text={`Recevez des devis dans ces fourchettes, de la part d'installateurs de climatisation vérifiés à ${city.name} et autour.`}
          linkLabel="Demander un devis gratuit"
        />
      </section>

      {/* ─── Arnaques — version COMPACTE (le guide complet = le pilier) ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les arnaques à la pose de climatisation les plus courantes
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          La pose de climatisation fait l&apos;objet de pratiques commerciales
          régulièrement signalées, surtout en période de forte chaleur. Les trois
          pratiques les plus fréquemment constatées :
        </p>
        <ScamWarningsList warnings={content.scamWarnings.slice(0, 3)} />
        <p className="mt-5 text-sm text-[var(--text-secondary)]">
          Arnaques détaillées, état réel des aides, bons réflexes et ce que dit la
          loi :{" "}
          <Link
            href={`/${metier}/installation`}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            voir le guide complet de la pose de climatisation
          </Link>
          .
        </p>
      </section>

      {/* ─── FAQ locale (UI + schema FAQPage injecté plus haut) ─── */}
      <FaqAccordion
        faqs={faqs}
        title={`Questions fréquentes — pose de climatisation à ${city.name}`}
      />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MaillageCard
            href={listingHref}
            title={`Installateurs de climatisation à ${city.name}`}
            subtitle="Le listing local complet"
          />
          <MaillageCard
            href={`/${metier}/installation`}
            title="Pose de climatisation : le guide"
            subtitle="Prix, aides et arnaques détaillés"
          />
          <MaillageCard
            href="/guide-des-prix/prix-pose-climatiseur"
            title="Prix de pose d'un climatiseur"
            subtitle="Le guide détaillé de la prestation"
          />
        </div>

        <VillePills
          title="Pose de climatisation dans les grandes villes"
          links={autresVilles.map((v) => ({
            href: `/${metier}/installation/${v.slug}`,
            label: `Installateur climatisation ${v.name}`,
          }))}
        />
      </div>
    </main>
  );
}

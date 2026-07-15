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
import { ChimneyArt } from "@/components/seo/PilierArt";
import {
  fmtEur,
  PriceRangesCard,
  InfoCallout,
  HeroCta,
  PostPriceCta,
  LegalFactsList,
  MaillageCard,
  VillePills,
} from "@/components/seo/PilierBlocks";

/**
 * Déclinaison PAR VILLE de la page pilier ramonage obligatoire :
 * /[metier]/obligation/[ville] (ramoneur only — ex.
 * /ramoneur/obligation/lyon, requêtes SERP cibles « ramoneur {ville} » et
 * « ramonage {ville} »).
 *
 * Page d'ACTION locale (le pilier /ramoneur/obligation reste la référence
 * éditoriale complète) : section LOI compacte EN PREMIER (c'est l'intention
 * de recherche), prix sourcés nationaux, bloc local UNIQUE (les 3 premiers
 * pros de la ville, count réel) + FAQ locale.
 *
 * GARDE ANTI-THIN STRICT : ville introuvable OU < 3 pros actifs du métier
 * dans la ville → notFound(). Le count est fait en head:true (zéro row
 * transférée — crise egress 11/06/2026).
 *
 * ⚠️ Ne JAMAIS ajouter de loading.tsx sur cette route (casse notFound()).
 * ⚠️ Le segment doit s'appeler [ville] : Next.js impose le MÊME nom de
 *    param dynamique au niveau 3 que /[metier]/[location]/[ville].
 */
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

// Whitelist DUPLIQUÉE depuis app/(public)/[metier]/obligation/page.tsx :
// un page.tsx Next.js ne peut pas exporter de constantes arbitraires. Garder
// en phase avec le pilier parent à chaque ajout de métier.
const OBLIGATION_METIERS = new Set(["ramoneur"]);

// Grandes villes du maillage (toutes vérifiées >= 3 ramoneurs actifs au
// 11/06/2026 — Paris 308, Marseille 229, Nice 163, Lyon 58, Toulouse 57,
// Bordeaux 49, arrondissements agrégés).
const GRANDES_VILLES = [
  { slug: "paris", name: "Paris" },
  { slug: "marseille", name: "Marseille" },
  { slug: "lyon", name: "Lyon" },
  { slug: "nice", name: "Nice" },
  { slug: "toulouse", name: "Toulouse" },
  { slug: "bordeaux", name: "Bordeaux" },
];

type FaqItem = { question: string; answer: string };

/**
 * Résolution métier + ville + count, mise en cache React (dédupliquée entre
 * generateMetadata et la Page sur la même requête → 1 seul count head:true).
 * Retourne null si métier hors whitelist, ville introuvable ou < 3 pros.
 */
const resolveVilleObligation = cache(async (metier: string, ville: string) => {
  if (!OBLIGATION_METIERS.has(metier)) return null;
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
  const resolved = await resolveVilleObligation(metier, ville);
  if (!resolved) return {};

  const { content, city, count } = resolved;
  const year = new Date().getFullYear();
  const bois = content.priceRanges[0];

  const title = `Ramoneur à ${city.name} : ramonage obligatoire, prix ${year}, ${count} ramoneurs vérifiés`;
  const description = `Le ramonage est obligatoire, une à deux fois par an selon le combustible. Prix constatés : ${fmtEur(bois.low)} à ${fmtEur(bois.high)} € pour une cheminée bois. ${count} ramoneurs vérifiés à ${city.name}, devis gratuit, sans commission.`;
  const canonical = `${BASE_URL}/${metier}/obligation/${city.slug}`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical },
    openGraph: { type: "article", title, description, url: canonical },
  };
}

export default async function RamonageObligationVillePage({ params }: Props) {
  const { metier, ville } = await params;
  const resolved = await resolveVilleObligation(metier, ville);
  if (!resolved) notFound();

  const { content, category, city, cityIds, count } = resolved;
  const year = new Date().getFullYear();
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const bois = content.priceRanges[0];
  const poeleBois = content.priceRanges[1];
  const granules = content.priceRanges[2];
  const chaudiere = content.priceRanges[3];

  // Bloc local UNIQUE : les 3 premiers pros de la ville (select minimal).
  const topPros = await getProMiniCardsByCategoryAndCityIds(category.id, cityIds, 3);

  const listingHref = `/${metier}/${city.slug}`;
  const deposerHref = `/deposer-projet?categorie=${metier}&ville=${city.slug}`;

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Ramoneur", href: `/${metier}` },
    { label: "Ramonage obligatoire", href: `/${metier}/obligation` },
    { label: city.name },
  ];

  // FAQ locale (4 Q) — réponses dérivées UNIQUEMENT du contenu sourcé.
  const faqs: FaqItem[] = [
    {
      question: `Le ramonage est-il obligatoire à ${city.name} ?`,
      answer: `Oui. Le ramonage des conduits de fumée est obligatoire en France pour les appareils à combustion, à ${city.name} comme partout : une à deux fois par an selon le combustible et le règlement local applicable. La fréquence minimale est généralement d'un ramonage annuel pour les conduits gaz, et de deux ramonages par an pour les combustibles solides ou liquides dans de nombreux règlements sanitaires départementaux, dont un pendant la période de chauffe. Consultez la réglementation locale de votre département, car certaines obligations sont renforcées par arrêté ou règlement sanitaire départemental.`,
    },
    {
      question: `Quel est le prix d'un ramonage à ${city.name} ?`,
      answer: `Au niveau national, les prix constatés en ${year} : ${fmtEur(bois.low)} € à ${fmtEur(bois.high)} € pour une cheminée bois à conduit simple, ${fmtEur(poeleBois.low)} € à ${fmtEur(poeleBois.high)} € pour un poêle à bois, ${fmtEur(granules.low)} € à ${fmtEur(granules.high)} € pour un poêle à granulés, et ${fmtEur(chaudiere.low)} € à ${fmtEur(chaudiere.high)} € pour une chaudière gaz ou fioul. Les prix pratiqués à ${city.name} peuvent varier selon l'entreprise et l'accès au conduit : demandez un devis écrit avant intervention, avec le détail du prix, du déplacement et des éventuels suppléments.`,
    },
    {
      question: "Le certificat de ramonage est-il exigé par l'assurance ?",
      answer:
        "Le professionnel doit délivrer un certificat ou une attestation de ramonage à l'issue de l'intervention. Ce document sert de preuve en cas de contrôle et peut être demandé par votre assurance habitation après un sinistre. Conservez le certificat et la facture, puis transmettez-les à l'assureur si demandé.",
    },
    {
      question: `Comment trouver un ramoneur fiable à ${city.name} ?`,
      answer: `Faites appel à un professionnel déclaré et identifiable : entreprise existante, numéro SIRET vérifiable et facture nominative. Méfiez-vous du démarchage de faux ramoneurs se présentant comme mandatés par la mairie, le bailleur ou l'assureur. Les ${count} ramoneurs référencés à ${city.name} sur Workwave disposent d'un SIRET vérifiable, consultable depuis leur fiche.`,
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
        categoryName="Ramonage"
        citySlug={city.slug}
        locationName={city.name}
        preposition="à "
        tagline="Recevez des devis de pros SIRET vérifiés, gratuitement."
        ctaText="Demander un devis"
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        {`Ramonage à ${city.name} : obligation, prix réels et ${count} ramoneurs SIRET vérifiés`}
      </h1>

      {/* Intro courte LOCALISÉE (3 phrases) — illustration en regard */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>
            {`Le ramonage des conduits de fumée est obligatoire en France pour les appareils à combustion, une à deux fois par an selon le combustible et le règlement local applicable. Les prix constatés au niveau national s'appliquent : comptez entre ${fmtEur(bois.low)} € et ${fmtEur(bois.high)} € pour une cheminée bois à conduit simple. À ${city.name}, ${count} ramoneurs au SIRET vérifiable sont référencés sur Workwave — la liste complète est sur la page `}
            <Link href={listingHref} className="underline hover:text-[var(--accent)]">
              {`ramoneurs à ${city.name}`}
            </Link>
            .
          </p>
        </div>
        <ChimneyArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* CTA héro — au-dessus de la ligne de flottaison */}
      <HeroCta
        href={deposerHref}
        label={`Trouver un ramoneur vérifié à ${city.name}`}
        note="Gratuit, sans engagement — votre demande est visible par les ramoneurs SIRET vérifiés de votre zone, qui vous recontactent directement."
      />

      {/* ─── Ce que dit la loi — COMPACTE, EN PREMIER (intention de recherche) ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Ce que dit la loi
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Décret, fréquence, certificat : l&apos;essentiel de la réglementation du
          ramonage, en trois points.
        </p>
        <LegalFactsList facts={content.legalFacts.slice(0, 3)} />
        <p className="mt-5 text-sm text-[var(--text-secondary)]">
          Amende encourue, certificat pour l&apos;assurance, faux ramoneurs et bons
          réflexes :{" "}
          <Link
            href={`/${metier}/obligation`}
            className="font-semibold text-[var(--accent)] hover:underline"
          >
            voir le guide complet du ramonage obligatoire
          </Link>
          .
        </p>
      </section>

      {/* ─── Prix sourcés nationaux (mêmes données que le pilier) ─── */}
      <section className="mb-12">
        <PriceRangesCard
          heading={`Prix constatés ${year}`}
          metaLabel={`Données ${retrievedLabel}`}
          priceRanges={content.priceRanges}
          sources={content.sources}
        />
        <InfoCallout
          title="Haute saison de septembre à décembre."
          text={content.majorations}
        />
        <PostPriceCta
          href={deposerHref}
          text={`Recevez des devis dans ces fourchettes, de la part de ramoneurs vérifiés à ${city.name} et autour.`}
          linkLabel="Demander un devis gratuit"
        />
      </section>

      {/* ─── Bloc local UNIQUE : les 3 premiers pros de la ville ─── */}
      {topPros.length > 0 && (
        <section className="mb-12">
          <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
            {`Ramoneurs vérifiés à ${city.name}`}
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
            {`Voir les ${count} ramoneurs à ${city.name}`}
          </Link>
        </section>
      )}

      {/* ─── FAQ locale (UI + schema FAQPage injecté plus haut) ─── */}
      <FaqAccordion
        faqs={faqs}
        title={`Questions fréquentes — ramonage à ${city.name}`}
      />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MaillageCard
            href={listingHref}
            title={`Ramoneurs à ${city.name}`}
            subtitle="Le listing local complet"
          />
          <MaillageCard
            href={`/${metier}/obligation`}
            title="Ramonage obligatoire : le guide"
            subtitle="Loi, certificat et faux ramoneurs détaillés"
          />
          <MaillageCard
            href="/guide-des-prix/prix-ramonage-cheminee"
            title="Prix d'un ramonage de cheminée"
            subtitle="Le guide détaillé de la prestation"
          />
        </div>

        <VillePills
          title="Ramonage dans les grandes villes"
          links={autresVilles.map((v) => ({
            href: `/${metier}/obligation/${v.slug}`,
            label: `Ramoneur ${v.name}`,
          }))}
        />
      </div>
    </main>
  );
}

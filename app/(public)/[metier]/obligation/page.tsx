import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { URGENCE_CONTENT } from "@/lib/data/urgence-content";
import { BASE_URL } from "@/lib/constants";
import { ChimneyArt } from "@/components/seo/PilierArt";
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
 * Page pilier "ramonage obligatoire" : /[metier]/obligation (ramoneur only).
 * Segment statique prioritaire sur /[metier]/[location] (même pattern que
 * /[metier]/prix, /[metier]/guide et /[metier]/urgence).
 *
 * Intention de recherche : "ramonage obligatoire" / "ramoneur autour de moi"
 * / "prix ramonage" → la section LOI vient EN PREMIER (avant les prix).
 *
 * Angle éditorial : transparence anti-arnaque (faux ramoneurs en démarchage).
 * Tous les chiffres viennent de lib/data/urgence-content.ts (sourcé via
 * Perplexity, sources citées) — zéro chiffre inventé, zéro promesse de délai.
 *
 * ⚠️ Ne JAMAIS ajouter de loading.tsx sur cette route (casse notFound()).
 */
export const revalidate = 86400;

const OBLIGATION_METIERS = new Set(["ramoneur"]);

type Props = { params: Promise<{ metier: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  if (!OBLIGATION_METIERS.has(metier)) return {};
  const content = URGENCE_CONTENT[metier];
  if (!content) return {};

  const year = new Date().getFullYear();
  const bois = content.priceRanges[0];
  const title = `Ramonage obligatoire : loi ${year}, assurance et prix du ramonage`;
  const description = `Le ramonage est obligatoire, une à deux fois par an selon le combustible. Prix constatés : ${bois.low} à ${bois.high} € pour une cheminée bois. Certificat, assurance, faux ramoneurs : tout ce qu'il faut savoir, ramoneurs SIRET vérifiés.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}/${metier}/obligation` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${BASE_URL}/${metier}/obligation`,
    },
  };
}

export default async function RamonageObligationPage({ params }: Props) {
  const { metier } = await params;
  if (!OBLIGATION_METIERS.has(metier)) notFound();
  const content = URGENCE_CONTENT[metier];
  if (!content) notFound();

  const year = new Date().getFullYear();
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const bois = content.priceRanges[0];
  const poeleBois = content.priceRanges[1];
  const granules = content.priceRanges[2];
  const chaudiere = content.priceRanges[3];

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Ramoneur", href: `/${metier}` },
    { label: "Ramonage obligatoire" },
  ];

  // FAQ — réponses dérivées UNIQUEMENT du contenu sourcé (urgence-content.ts).
  const faqs = [
    {
      question: "Le ramonage est-il obligatoire ?",
      answer:
        "Oui. Le ramonage des conduits de fumée est obligatoire en France pour les appareils à combustion, avec une fréquence d'une à deux fois par an selon le combustible et le règlement local applicable. Le décret n° 2023-641 du 20 juillet 2023 a codifié ces obligations d'entretien dans le Code de la santé publique. Le non-respect de l'obligation peut exposer à une contravention pouvant aller jusqu'à 450 €.",
    },
    {
      question: "Combien de fois par an faut-il ramoner ?",
      answer:
        "La fréquence minimale est généralement d'un ramonage annuel pour les conduits gaz, et de deux ramonages par an pour les combustibles solides ou liquides (bois, granulés, fioul) dans de nombreux règlements sanitaires départementaux, dont un pendant la période de chauffe. Consultez la réglementation locale de votre département, car certaines obligations sont renforcées par arrêté ou règlement sanitaire départemental.",
    },
    {
      question: "Le certificat de ramonage est-il exigé par l'assurance ?",
      answer:
        "Le professionnel doit délivrer un certificat ou une attestation de ramonage à l'issue de l'intervention. Ce document sert de preuve en cas de contrôle et peut être demandé par votre assurance habitation après un sinistre. Conservez le certificat et la facture, puis transmettez-les à l'assureur si demandé.",
    },
    {
      question: "Quel est le prix d'un ramonage ?",
      answer: `Les prix constatés en ${year} : ${fmtEur(bois.low)} € à ${fmtEur(bois.high)} € pour une cheminée bois à conduit simple, ${fmtEur(poeleBois.low)} € à ${fmtEur(poeleBois.high)} € pour un poêle à bois, ${fmtEur(granules.low)} € à ${fmtEur(granules.high)} € pour un poêle à granulés, et ${fmtEur(chaudiere.low)} € à ${fmtEur(chaudiere.high)} € pour une chaudière gaz ou fioul. Demandez un devis écrit avant intervention, avec le détail du prix, du déplacement et des éventuels suppléments.`,
    },
    {
      question: "Qui a le droit de ramoner ?",
      answer:
        "Faites appel à un professionnel déclaré et identifiable : entreprise existante, numéro SIRET vérifiable et facture nominative. C'est lui qui délivre le certificat de ramonage à l'issue de l'intervention. Méfiez-vous des faux certificats ou attestations délivrés sans intervention réelle, qui font partie des arnaques signalées : un certificat de complaisance ne vous protège ni en cas de contrôle ni vis-à-vis de l'assurance.",
    },
    {
      question: "Comment éviter les faux ramoneurs ?",
      answer:
        "Méfiez-vous du démarchage téléphonique ou en porte-à-porte de faux ramoneurs se présentant comme mandatés par la mairie, le bailleur ou l'assureur — aucun de ces organismes ne mandate de démarcheur. Les autres signaux : un prix d'appel anormalement bas suivi de suppléments, l'absence de coordonnées vérifiables ou de numéro SIRET sur le devis et la facture, une urgence artificielle pour vous faire décider immédiatement, ou une pression commerciale pour remplacer des pièces sans diagnostic indépendant.",
    },
  ];

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);
  const faqJsonLd = getFaqSchema(faqs);

  const villes = [
    { slug: "paris", name: "Paris" },
    { slug: "marseille", name: "Marseille" },
    { slug: "lyon", name: "Lyon" },
    { slug: "toulouse", name: "Toulouse" },
    { slug: "bordeaux", name: "Bordeaux" },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <StickyProjectCTA
        categorySlug={metier}
        categoryName="Ramonage"
        citySlug={null}
        locationName="près de chez vous"
        preposition=""
        tagline="Recevez des devis de pros SIRET vérifiés, gratuitement."
        ctaText="Demander un devis"
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        Ramonage obligatoire : ce que dit la loi, l&apos;assurance et les prix réels
      </h1>

      {/* Intro factuelle — ton calme et protecteur, illustration en regard */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>
            Le ramonage des conduits de fumée est obligatoire en France pour les
            appareils à combustion : une à deux fois par an selon le combustible et
            le règlement local applicable. Le certificat remis par le professionnel
            sert de preuve en cas de contrôle et peut être demandé par votre
            assurance après un sinistre — et l&apos;absence de ramonage peut exposer
            à une contravention pouvant aller jusqu&apos;à {fmtEur(450)} €. Côté
            budget, comptez {fmtEur(bois.low)} € à {fmtEur(bois.high)} € constatés
            pour une cheminée bois à conduit simple. Cette page rassemble ce que dit
            la loi, les prix réellement constatés (sources citées), les arnaques des
            faux ramoneurs et les bons réflexes avant de prendre rendez-vous.
          </p>
        </div>
        <ChimneyArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* CTA héro — au-dessus de la ligne de flottaison. */}
      <HeroCta
        href={`/deposer-projet?categorie=${metier}`}
        label="Trouver un ramoneur vérifié"
        note="Gratuit, sans engagement — votre demande est visible par les ramoneurs SIRET vérifiés de votre zone, qui vous recontactent directement."
      />

      {/* ─── Ce que dit la loi — EN PREMIER : c'est l'intention de recherche ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Ce que dit la loi
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Décret, fréquence, certificat, amende : l&apos;essentiel de la
          réglementation du ramonage, point par point.
        </p>
        <LegalFactsList facts={content.legalFacts} />
      </section>

      {/* ─── Prix constatés ─── */}
      <section className="mb-12">
        <PriceRangesCard
          heading={`Prix constatés ${year}`}
          metaLabel={`Données ${retrievedLabel}`}
          priceRanges={content.priceRanges}
          sources={content.sources}
        />

        {/* Callout haute saison (septembre-décembre) */}
        <InfoCallout
          title="Haute saison de septembre à décembre."
          text={content.majorations}
        />

        {/* CTA contextuel post-prix */}
        <PostPriceCta
          href={`/deposer-projet?categorie=${metier}`}
          text="Recevez des devis dans ces fourchettes, de la part de ramoneurs vérifiés près de chez vous."
          linkLabel="Demander un devis gratuit"
        />
      </section>

      {/* ─── Arnaques : les faux ramoneurs ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Faux ramoneurs : les arnaques à connaître
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Le démarchage de faux ramoneurs est régulièrement signalé par les
          consommateurs. Voici les pratiques les plus fréquemment constatées.
        </p>
        <ScamWarningsList warnings={content.scamWarnings} />

        {/* CTA contextuel post-arnaques */}
        <PostScamCta
          href={`/deposer-projet?categorie=${metier}`}
          text="Pour écarter ces risques : décrivez votre besoin sur Workwave, et seuls des ramoneurs au SIRET vérifié peuvent vous répondre."
          buttonLabel="Passer par un pro vérifié"
        />
      </section>

      {/* ─── Bons réflexes ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les bons réflexes avant de réserver
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Quelques vérifications simples suffisent à écarter la grande majorité des
          mauvaises surprises.
        </p>
        <GoodReflexesList reflexes={content.goodReflexes} />
        <SiretNote text="chaque ramoneur référencé sur Workwave dispose d'un SIRET vérifiable au registre officiel SIRENE. Vous pouvez contrôler l'identité de l'entreprise avant même de décrocher votre téléphone." />
      </section>

      {/* ─── CTA principal ─── */}
      <FinalCtaSection
        href={`/deposer-projet?categorie=${metier}`}
        title="Besoin d'un ramoneur de confiance ?"
        text="Décrivez votre besoin, recevez des devis de ramoneurs SIRET vérifiés près de chez vous — gratuit, sans commission."
        buttonLabel="Demander un devis gratuitement"
        footnote="Gratuit · sans engagement · demande visible par les pros de votre zone"
      />

      {/* ─── FAQ (UI + schema FAQPage injecté plus haut) ─── */}
      <FaqAccordion faqs={faqs} title="Questions fréquentes — ramonage obligatoire" />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MaillageCard
            href={`/${metier}`}
            title="Ramoneurs autour de moi"
            subtitle="Trouver un pro près de chez vous"
          />
          <MaillageCard
            href="/guide-des-prix/prix-ramonage-cheminee"
            title="Prix d'un ramonage de cheminée"
            subtitle="Le guide détaillé de la prestation"
          />
          <MaillageCard
            href={`/${metier}/prix`}
            title="Guide des prix ramoneur"
            subtitle="Tous les tarifs du métier"
          />
        </div>

        <VillePills
          title="Ramonage dans les grandes villes"
          links={villes.map((v) => ({
            href: `/${metier}/${v.slug}`,
            label: `Ramoneur ${v.name}`,
          }))}
        />
      </div>
    </main>
  );
}

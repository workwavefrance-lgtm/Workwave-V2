import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { URGENCE_CONTENT, type UrgenceContent } from "@/lib/data/urgence-content";
import { BASE_URL } from "@/lib/constants";
import { DoorKeyArt, FlameRadiatorArt } from "@/components/seo/PilierArt";
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
 * Page pilier "dépannage en urgence" d'un métier : /[metier]/urgence.
 * Segment statique prioritaire sur /[metier]/[location] (même pattern que
 * /[metier]/prix et /[metier]/guide).
 *
 * Angle éditorial : transparence anti-arnaque. Tous les chiffres viennent
 * de lib/data/urgence-content.ts (sourcé via Perplexity, sources citées) —
 * zéro chiffre inventé, zéro promesse de délai, zéro prix d'appel.
 *
 * ⚠️ Ne JAMAIS ajouter de loading.tsx sur cette route (casse notFound()).
 */
export const revalidate = 604800; // 7j (13/06) : pic crawl Google 650k pages = +200% Vercel ; donnees Sirene statiques, 0 impact SEO

// Whitelist des métiers couverts — extensible (plombier, électricien...).
const URGENCE_METIERS = new Set(["serrurier", "chauffagiste"]);

const METIER_LABELS: Record<string, { singular: string; plural: string }> = {
  serrurier: { singular: "Serrurier", plural: "serruriers" },
  chauffagiste: { singular: "Chauffagiste", plural: "chauffagistes" },
};

// Illustration héro par métier (line-art, élément signature en accent coral).
const HERO_ART: Record<string, (props: { className?: string }) => React.JSX.Element> = {
  serrurier: DoorKeyArt,
  chauffagiste: FlameRadiatorArt,
};

type FaqItem = { question: string; answer: string };

/**
 * Copy spécifique à chaque métier (title, intro, FAQ, maillage). Toutes les
 * fonctions ne dérivent leurs chiffres QUE de `content` (urgence-content.ts).
 */
type UrgenceConfig = {
  title: (year: number, content: UrgenceContent) => string;
  description: (year: number, content: UrgenceContent) => string;
  h1: string;
  intro: (year: number, content: UrgenceContent) => string;
  calloutTitle: string;
  faqs: (year: number, content: UrgenceContent) => FaqItem[];
  /** 3e carte du maillage (guide de prestation spécifique au métier). */
  guideCard: { href: string; title: string; subtitle: string };
};

const URGENCE_CONFIG: Record<string, UrgenceConfig> = {
  serrurier: {
    title: (year) =>
      `Serrurier en urgence : prix réels ${year}, tarifs et arnaques à éviter`,
    description: (_year, content) => {
      const r0 = content.priceRanges[0];
      return `Ouverture de porte claquée : ${r0.low} à ${r0.high} € constatés. Évitez les arnaques : prix réels sourcés, serruriers vérifiés au registre SIRENE, devis gratuit, sans commission.`;
    },
    h1: "Serrurier en urgence : prix réels, délais et arnaques à éviter",
    intro: (_year, content) => {
      const claquee = content.priceRanges[0];
      const verrouillee = content.priceRanges[1];
      return `Aucune réglementation générale n'encadre les tarifs des serruriers en France : chaque entreprise fixe librement ses prix. La loi impose en revanche une information préalable du client et un devis écrit avant toute intervention de dépannage à domicile. Sur le marché, les écarts sont considérables : une simple ouverture de porte claquée se facture entre ${fmtEur(claquee.low)} € et ${fmtEur(claquee.high)} € en journée, et une porte verrouillée ou blindée peut atteindre ${fmtEur(verrouillee.high)} €. Cette page rassemble les prix réellement constatés (sources citées), les arnaques les plus courantes et les bons réflexes à avoir avant d'appeler.`;
    },
    calloutTitle: "Majorations nuit, week-end et jours fériés.",
    faqs: (year, content) => {
      const claquee = content.priceRanges[0];
      const verrouillee = content.priceRanges[1];
      return [
        {
          question: "Combien coûte une ouverture de porte claquée ?",
          answer: `En journée et en semaine, les prix constatés en ${year} vont de ${fmtEur(claquee.low)} € à ${fmtEur(claquee.high)} € pour une porte simplement claquée. Méfiez-vous des prix d'appel très bas annoncés au téléphone : la facture est souvent fortement augmentée une fois le serrurier sur place. Exigez toujours un devis écrit avant l'intervention.`,
        },
        {
          question: "Porte claquée ou verrouillée : quelle différence de prix ?",
          answer: `Une porte claquée (non verrouillée) s'ouvre par une technique simple : comptez ${fmtEur(claquee.low)} € à ${fmtEur(claquee.high)} € constatés en journée. Une porte verrouillée ou blindée demande davantage de travail : les prix constatés vont de ${fmtEur(verrouillee.low)} € à ${fmtEur(verrouillee.high)} €. Précisez bien la situation au téléphone, car la technique et le coût ne sont pas les mêmes.`,
        },
        {
          question: "Un serrurier peut-il intervenir sans devis ?",
          answer:
            "Non dans la plupart des cas. L'arrêté du 24 janvier 2017 impose, pour les prestations de dépannage à domicile, une information préalable du consommateur et un devis écrit au-delà de 150 € TTC — certaines sources résument cette exigence comme un contrat écrit dès le premier euro. Refusez toute intervention sans validation préalable du prix total et des éventuelles pièces à remplacer.",
        },
        {
          question: "Quelles majorations la nuit et le week-end ?",
          answer:
            "Les sources récentes constatent des majorations d'environ +20 % à +100 % la nuit, le week-end et les jours fériés, avec une moyenne souvent citée autour de +30 %. Certaines grilles évoquent aussi des suppléments de 30 % à 50 % selon la plage horaire et la zone. Demandez le montant exact de la majoration avant d'accepter l'intervention.",
        },
        {
          question: "Comment reconnaître une arnaque au dépannage ?",
          answer:
            "Les signes les plus fréquents : un prix d'appel très bas au téléphone puis une facture fortement augmentée sur place, un remplacement de serrure imposé alors qu'une ouverture simple suffisait, l'absence de devis écrit avant intervention, du matériel facturé à un prix manifestement excessif, ou un prospectus donnant l'apparence d'un service officiel alors qu'il s'agit d'une entreprise privée.",
        },
        {
          question: "Mon assurance habitation couvre-t-elle l'ouverture de porte ?",
          answer:
            "Cela dépend de votre contrat : certaines garanties d'assurance habitation prennent en charge tout ou partie de l'ouverture de porte ou du remplacement de serrure après effraction. Avant d'avancer les frais, contactez votre assureur pour vérifier ce que couvre votre contrat — certains imposent de passer par leur réseau de dépanneurs agréés.",
        },
      ];
    },
    guideCard: {
      href: "/guide-des-prix/prix-changement-serrure",
      title: "Prix d'un changement de serrure",
      subtitle: "Le guide détaillé de la prestation",
    },
  },
  chauffagiste: {
    title: (year) =>
      `Chauffagiste en urgence : prix réels ${year}, dépannage chauffage et arnaques`,
    description: (_year, content) => {
      const depannage = content.priceRanges[0];
      return `Dépannage de chaudière en urgence : ${depannage.low} à ${depannage.high} € constatés (déplacement et main-d'œuvre, hors pièces). Évitez les arnaques : prix réels sourcés, chauffagistes vérifiés au registre SIRENE, devis gratuit, sans commission.`;
    },
    h1: "Chauffagiste en urgence : prix réels, dépannage chauffage et arnaques à éviter",
    intro: (_year, content) => {
      const depannage = content.priceRanges[0];
      const horaire = content.priceRanges[1];
      return `Chaudière en panne, chauffage qui ne démarre plus : aucune grille nationale n'encadre les tarifs des chauffagistes, chaque entreprise fixe librement ses prix. La loi impose en revanche un devis écrit avant exécution pour les prestations de dépannage à domicile, dans les cas prévus par l'arrêté du 24 janvier 2017. Sur le marché, un dépannage de chaudière en urgence se facture entre ${fmtEur(depannage.low)} € et ${fmtEur(depannage.high)} € (déplacement et main-d'œuvre, hors pièces), pour un tarif horaire constaté de ${fmtEur(horaire.low)} € à ${fmtEur(horaire.high)} €. Cette page rassemble les prix réellement constatés (sources citées), les arnaques les plus courantes et les bons réflexes à avoir avant d'appeler.`;
    },
    calloutTitle: "Majorations soir, week-end et jours fériés.",
    faqs: (year, content) => {
      const depannage = content.priceRanges[0];
      const horaire = content.priceRanges[1];
      const entretien = content.priceRanges[2];
      const piece = content.priceRanges[3];
      return [
        {
          question:
            "L'entretien annuel de la chaudière est-il obligatoire et combien coûte-t-il ?",
          answer: `Oui : l'entretien annuel est obligatoire pour les chaudières dont la puissance nominale est comprise entre 4 et 400 kW, selon le décret du 9 juin 2009. Les prix constatés en ${year} vont de ${fmtEur(entretien.low)} € à ${fmtEur(entretien.high)} €. Une attestation d'entretien doit vous être remise après la visite : conservez-la, elle sert de justificatif de conformité. En location, l'entretien est à la charge de l'occupant des lieux, sauf stipulation contraire du bail.`,
        },
        {
          question: "Quel est le tarif horaire d'un chauffagiste ?",
          answer: `Les tarifs horaires constatés en ${year} vont de ${fmtEur(horaire.low)} € à ${fmtEur(horaire.high)} €. Avant tout déplacement, demandez le prix exact et vérifiez s'il inclut le déplacement, le diagnostic, la main-d'œuvre et la TVA — ces postes doivent apparaître séparément sur le devis et la facture.`,
        },
        {
          question: "Combien coûte un dépannage de chaudière en urgence ?",
          answer: `Les prix constatés en ${year} vont de ${fmtEur(depannage.low)} € à ${fmtEur(depannage.high)} € pour un dépannage urgent (déplacement et main-d'œuvre, hors pièces). Si une pièce courante doit être remplacée (circulateur ou thermostat), comptez ${fmtEur(piece.low)} € à ${fmtEur(piece.high)} € selon les cas, hors pièce. Exigez un devis écrit avant toute réparation, surtout si des pièces doivent être remplacées.`,
        },
        {
          question: "Quelles majorations le soir et le week-end ?",
          answer:
            "En pratique, les majorations constatées pour une intervention de dépannage chauffage ou chaudière en soirée, la nuit, le week-end ou les jours fériés sont généralement de l'ordre de +25 % à +50 %, avec des cas plus élevés selon la zone et l'urgence. Demandez le montant exact de la majoration avant d'accepter l'intervention.",
        },
        {
          question: "Comment reconnaître une arnaque au dépannage chauffage ?",
          answer:
            "Les pratiques les plus signalées : un remplacement complet de chaudière forcé alors qu'une réparation ciblée ou un simple changement de pièce suffit, des frais de déplacement ou de diagnostic ajoutés sans annonce préalable, un prix d'appel bas puis une facture gonflée par des majorations non expliquées, des pièces facturées très au-dessus du marché sans référence détaillée, ou un paiement exigé avant toute explication écrite de la panne et du coût final.",
        },
        {
          question: "Un devis est-il obligatoire avant un dépannage de chauffage ?",
          answer:
            "Oui dans les cas prévus par l'arrêté du 24 janvier 2017 : pour les prestations de dépannage à domicile, un devis écrit est obligatoire avant exécution. Refusez toute intervention sans validation préalable du prix. En cas de litige ou de pratique commerciale douteuse, vous pouvez signaler l'entreprise via SignalConso, l'outil de signalement de la DGCCRF.",
        },
      ];
    },
    guideCard: {
      href: "/guide-des-prix/prix-reparation-chaudiere",
      title: "Prix d'une réparation de chaudière",
      subtitle: "Le guide détaillé de la prestation",
    },
  },
};

type Props = { params: Promise<{ metier: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  if (!URGENCE_METIERS.has(metier)) return {};
  const content = URGENCE_CONTENT[metier];
  const config = URGENCE_CONFIG[metier];
  if (!content || !config) return {};

  const year = new Date().getFullYear();
  const title = config.title(year, content);
  const description = config.description(year, content);

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}/${metier}/urgence` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${BASE_URL}/${metier}/urgence`,
    },
  };
}

export default async function MetierUrgencePage({ params }: Props) {
  const { metier } = await params;
  if (!URGENCE_METIERS.has(metier)) notFound();
  const content = URGENCE_CONTENT[metier];
  const config = URGENCE_CONFIG[metier];
  if (!content || !config) notFound();

  const year = new Date().getFullYear();
  const labels = METIER_LABELS[metier];
  const HeroArt = HERO_ART[metier] ?? DoorKeyArt;
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: labels.singular, href: `/${metier}` },
    { label: "Urgence" },
  ];

  // FAQ — réponses dérivées UNIQUEMENT du contenu sourcé (urgence-content.ts).
  const faqs = config.faqs(year, content);

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
        categoryName={labels.singular}
        citySlug={null}
        locationName="près de chez vous"
        preposition=""
        tagline="Recevez des devis de pros SIRET vérifiés, gratuitement."
        ctaText="Décrire mon problème"
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        {config.h1}
      </h1>

      {/* Intro factuelle — ton calme et protecteur, illustration en regard */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>{config.intro(year, content)}</p>
        </div>
        <HeroArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* CTA héro — au-dessus de la ligne de flottaison : le visiteur en
          urgence veut une action immédiate, pas 2000 mots. */}
      <HeroCta
        href={`/deposer-projet?categorie=${metier}`}
        label={`Trouver un ${labels.singular.toLowerCase()} vérifié`}
        note={`Gratuit, sans engagement — votre demande est visible par les ${labels.plural} SIRET vérifiés de votre zone, qui vous recontactent directement.`}
      />

      {/* ─── Tableau des prix réels — LA section différenciante ─── */}
      <section className="mb-12">
        <PriceRangesCard
          heading={`Prix constatés ${year}`}
          metaLabel={`Données ${retrievedLabel}`}
          priceRanges={content.priceRanges}
          sources={content.sources}
        />

        {/* Callout majorations nuit / week-end */}
        <InfoCallout title={config.calloutTitle} text={content.majorations} />

        {/* CTA contextuel — pic de confiance : le visiteur vient de voir des
            prix honnêtes, c'est le moment où il bascule. */}
        <PostPriceCta
          href={`/deposer-projet?categorie=${metier}`}
          text={`Recevez des devis dans ces fourchettes, de la part de ${labels.plural} vérifiés près de chez vous.`}
          linkLabel="Demander un devis gratuit"
        />
      </section>

      {/* ─── Arnaques au dépannage ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les arnaques au dépannage à connaître
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Le dépannage en urgence est l&apos;un des secteurs les plus signalés par les
          consommateurs. Voici les pratiques les plus fréquemment constatées.
        </p>
        <ScamWarningsList warnings={content.scamWarnings} />

        {/* CTA contextuel — pic émotionnel : après la liste des arnaques, on
            propose la voie sûre. */}
        <PostScamCta
          href={`/deposer-projet?categorie=${metier}`}
          text={`Pour écarter ces risques : décrivez votre situation sur Workwave, et seuls des ${labels.plural} au SIRET vérifié peuvent vous répondre.`}
          buttonLabel="Passer par un pro vérifié"
        />
      </section>

      {/* ─── Bons réflexes ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les bons réflexes avant d&apos;appeler
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Quelques vérifications simples suffisent à écarter la grande majorité des
          mauvaises surprises.
        </p>
        <GoodReflexesList reflexes={content.goodReflexes} />
        <SiretNote
          text={`chaque ${labels.singular.toLowerCase()} référencé sur Workwave dispose d'un SIRET vérifiable au registre officiel SIRENE. Vous pouvez contrôler l'identité de l'entreprise avant même de décrocher votre téléphone.`}
        />
      </section>

      {/* ─── Ce que dit la loi ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
          Ce que dit la loi
        </h2>
        <LegalFactsList facts={content.legalFacts} />
      </section>

      {/* ─── CTA principal ─── */}
      <FinalCtaSection
        href={`/deposer-projet?categorie=${metier}`}
        title={`Besoin d'un ${labels.singular.toLowerCase()} de confiance ?`}
        text={`Décrivez votre problème, recevez des devis de ${labels.plural} SIRET vérifiés près de chez vous — gratuit, sans commission.`}
        buttonLabel="Décrire mon problème gratuitement"
        footnote="Gratuit · sans engagement · projet visible par les pros de votre zone"
      />

      {/* ─── FAQ (UI + schema FAQPage injecté plus haut) ─── */}
      <FaqAccordion
        faqs={faqs}
        title={`Questions fréquentes — ${labels.singular.toLowerCase()} en urgence`}
      />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MaillageCard
            href={`/${metier}`}
            title={`${labels.singular}s autour de moi`}
            subtitle="Trouver un pro près de chez vous"
          />
          <MaillageCard
            href={`/${metier}/prix`}
            title={`Guide des prix ${labels.singular.toLowerCase()}`}
            subtitle="Tous les tarifs du métier"
          />
          <MaillageCard
            href={config.guideCard.href}
            title={config.guideCard.title}
            subtitle={config.guideCard.subtitle}
          />
        </div>

        <VillePills
          title={`${labels.singular} en urgence dans les grandes villes`}
          links={villes.map((v) => ({
            href: `/${metier}/${v.slug}`,
            label: `${labels.singular} ${v.name}`,
          }))}
        />
      </div>
    </main>
  );
}

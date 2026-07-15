import type { Metadata } from "next";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { URGENCE_CONTENT } from "@/lib/data/urgence-content";
import { BASE_URL } from "@/lib/constants";
import { AcUnitArt } from "@/components/seo/PilierArt";
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
 * Page pilier "pose de climatisation" : /[metier]/installation (climaticien
 * only). Segment statique prioritaire sur /[metier]/[location] (même pattern
 * que /[metier]/prix, /[metier]/guide et /[metier]/urgence).
 *
 * Intention de recherche : "pose climatisation" / "installateur clim" /
 * "prix installation climatisation".
 *
 * ⚠️ VOCABULAIRE : dans tout le texte visible, dire "installateur(s) de
 * climatisation" — jamais "climaticien" (c'est le langage de recherche réel ;
 * le slug technique reste /climaticien).
 *
 * Tous les chiffres viennent de lib/data/urgence-content.ts (sourcé via
 * Perplexity, sources citées) — zéro chiffre inventé, RIEN d'inventé sur
 * MaPrimeRénov (réponse prudente strictement sourcée).
 *
 * ⚠️ Ne JAMAIS ajouter de loading.tsx sur cette route (casse notFound()).
 */
export const revalidate = 2592000; // 30j (15/07) : cache long sur toutes les routes SEO pour couper le cout ISR Vercel sous crawl ; donnees Sirene/prix statiques, 0 impact SEO.

const INSTALLATION_METIERS = new Set(["climaticien"]);

type Props = { params: Promise<{ metier: string }> };

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  if (!INSTALLATION_METIERS.has(metier)) return {};
  const content = URGENCE_CONTENT[metier];
  if (!content) return {};

  const year = new Date().getFullYear();
  const mono = content.priceRanges[0];
  const title = `Pose de climatisation : prix ${year}, aides et choisir son installateur`;
  const description = `Pose d'une clim monosplit : ${fmtEur(mono.low)} à ${fmtEur(mono.high)} € constatés (matériel et pose). Prix réels sourcés, attestation fluides frigorigènes, installateurs de climatisation SIRET vérifiés, devis gratuit, sans commission.`;

  return {
    title: { absolute: title },
    description,
    alternates: { canonical: `${BASE_URL}/${metier}/installation` },
    openGraph: {
      type: "article",
      title,
      description,
      url: `${BASE_URL}/${metier}/installation`,
    },
  };
}

export default async function ClimInstallationPage({ params }: Props) {
  const { metier } = await params;
  if (!INSTALLATION_METIERS.has(metier)) notFound();
  const content = URGENCE_CONTENT[metier];
  if (!content) notFound();

  const year = new Date().getFullYear();
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const mono = content.priceRanges[0];
  const multi = content.priceRanges[1];
  const gainable = content.priceRanges[2];
  const entretien = content.priceRanges[3];

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Installateur de climatisation", href: `/${metier}` },
    { label: "Pose de climatisation" },
  ];

  // FAQ — réponses dérivées UNIQUEMENT du contenu sourcé (urgence-content.ts).
  const faqs = [
    {
      question: "Combien coûte la pose d'une climatisation ?",
      answer: `Les prix constatés en ${year}, matériel et pose compris : ${fmtEur(mono.low)} € à ${fmtEur(mono.high)} € pour un monosplit (une pièce), ${fmtEur(multi.low)} € à ${fmtEur(multi.high)} € pour un multisplit (plusieurs pièces), et ${fmtEur(gainable.low)} € à ${fmtEur(gainable.high)} € pour une clim gainable. Demandez au moins trois devis détaillés mentionnant matériel, main-d'œuvre, mise en service, accessoires et garanties, puis comparez à périmètre identique.`,
    },
    {
      question: "Peut-on poser sa climatisation soi-même ?",
      answer:
        "Non pour une installation complète : la manipulation d'un circuit contenant des fluides frigorigènes nécessite une attestation de capacité détenue par l'entreprise. L'autoinstallation complète d'une climatisation avec raccordement frigorifique n'est donc pas librement réalisable par un particulier. Vérifiez que l'installateur possède bien les qualifications requises et qu'il peut fournir les attestations demandées.",
    },
    {
      question: "Quelles aides pour une climatisation réversible ?",
      answer:
        "Prudence sur ce point : la climatisation réversible air-air n'est pas éligible à MaPrimeRénov' en tant que telle. Les aides citées par les sources consultées portent surtout sur la TVA réduite — 10 % sur la main-d'œuvre, sous conditions de recours à un professionnel qualifié — et, selon les cas, sur d'autres dispositifs distincts. Méfiez-vous des discours commerciaux promettant une clim « éligible à toutes les aides ».",
    },
    {
      question: "L'entretien d'une climatisation est-il obligatoire ?",
      answer: `L'entretien d'une climatisation ou pompe à chaleur air-air peut être obligatoire selon la puissance et les caractéristiques de l'équipement ; une inspection d'étanchéité s'applique à certains équipements contenant des gaz fluorés au-delà de seuils réglementaires. Côté budget, l'entretien annuel constaté en ${year} va de ${fmtEur(entretien.low)} € à ${fmtEur(entretien.high)} €.`,
    },
    {
      question: "Faut-il une autorisation en copropriété ?",
      answer:
        "L'installation d'une unité extérieure peut nécessiter une autorisation en copropriété et/ou une vérification des règles d'urbanisme locales, car elle modifie les parties communes ou l'aspect extérieur du bâtiment. En copropriété, demandez l'accord écrit du syndic ou de l'assemblée générale avant toute pose d'unité extérieure visible ou impactant les parties communes.",
    },
    {
      question: "Comment choisir son installateur de climatisation ?",
      answer:
        "Trois vérifications clés : un SIRET vérifiable au registre officiel SIRENE, une attestation de capacité pour la manipulation des fluides frigorigènes, et au moins trois devis détaillés comparés à périmètre identique (matériel, pose, mise en service, entretien éventuel). Faites aussi valider la puissance et le dimensionnement par une étude thermique simple ou, a minima, par une visite technique sérieuse avant de signer.",
    },
  ];

  const breadcrumbJsonLd = toBreadcrumbSchema(breadcrumbItems, BASE_URL);
  const faqJsonLd = getFaqSchema(faqs);

  const villes = [
    { slug: "marseille", name: "Marseille" },
    { slug: "nice", name: "Nice" },
    { slug: "montpellier", name: "Montpellier" },
    { slug: "toulouse", name: "Toulouse" },
    { slug: "lyon", name: "Lyon" },
  ];

  return (
    <main className="max-w-3xl mx-auto px-4 py-12">
      <JsonLd data={breadcrumbJsonLd} />
      <JsonLd data={faqJsonLd} />
      <StickyProjectCTA
        categorySlug={metier}
        categoryName="Pose de climatisation"
        citySlug={null}
        locationName="près de chez vous"
        preposition=""
        tagline="Recevez des devis de pros SIRET vérifiés, gratuitement."
        ctaText="Demander un devis"
      />

      <Breadcrumb items={breadcrumbItems} />

      <h1 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
        Pose de clim : prix réels, aides et comment choisir son installateur
      </h1>

      {/* Intro factuelle — ton calme et protecteur, illustration en regard */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>
            Faire poser une climatisation n&apos;est pas un achat anodin : sur le
            marché, un monosplit se facture entre {fmtEur(mono.low)} € et{" "}
            {fmtEur(mono.high)} € (matériel et pose), un multisplit entre{" "}
            {fmtEur(multi.low)} € et {fmtEur(multi.high)} €, et la manipulation des
            fluides frigorigènes est réservée aux entreprises détenant une
            attestation de capacité — vous ne pouvez pas raccorder le circuit
            vous-même. Cette page rassemble les prix réellement constatés (sources
            citées), l&apos;état réel des aides, les pratiques commerciales à fuir
            et les bons réflexes pour choisir votre installateur de climatisation.
          </p>
        </div>
        <AcUnitArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* CTA héro — au-dessus de la ligne de flottaison. */}
      <HeroCta
        href={`/deposer-projet?categorie=${metier}`}
        label="Trouver un installateur vérifié"
        note="Gratuit, sans engagement — votre demande est visible par les installateurs de climatisation SIRET vérifiés de votre zone, qui vous recontactent directement."
      />

      {/* ─── Prix constatés ─── */}
      <section className="mb-12">
        <PriceRangesCard
          heading={`Prix constatés ${year}`}
          metaLabel={`Données ${retrievedLabel}`}
          priceRanges={content.priceRanges}
          sources={content.sources}
        />

        {/* Callout haute saison été */}
        <InfoCallout title="Haute saison en été." text={content.majorations} />

        {/* CTA contextuel post-prix */}
        <PostPriceCta
          href={`/deposer-projet?categorie=${metier}`}
          text="Recevez des devis dans ces fourchettes, de la part d'installateurs de climatisation vérifiés près de chez vous."
          linkLabel="Demander un devis gratuit"
        />
      </section>

      {/* ─── Ce que dit la loi (attestation fluides, entretien, copro, aides) ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Ce que dit la loi
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Attestation fluides frigorigènes, entretien, copropriété, état réel des
          aides : l&apos;essentiel à connaître avant de signer.
        </p>
        <LegalFactsList facts={content.legalFacts} />
      </section>

      {/* ─── Arnaques à la pose de climatisation ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les arnaques à la pose de climatisation
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          La pose de climatisation fait l&apos;objet de pratiques commerciales
          régulièrement signalées, surtout en période de forte chaleur. Voici les
          plus fréquemment constatées.
        </p>
        <ScamWarningsList warnings={content.scamWarnings} />

        {/* CTA contextuel post-arnaques */}
        <PostScamCta
          href={`/deposer-projet?categorie=${metier}`}
          text="Pour écarter ces risques : décrivez votre projet sur Workwave, et seuls des installateurs au SIRET vérifié peuvent vous répondre."
          buttonLabel="Passer par un pro vérifié"
        />
      </section>

      {/* ─── Bons réflexes ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Les bons réflexes avant de signer
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed mb-6">
          Quelques vérifications simples suffisent à écarter la grande majorité des
          mauvaises surprises.
        </p>
        <GoodReflexesList reflexes={content.goodReflexes} />
        <SiretNote text="chaque installateur de climatisation référencé sur Workwave dispose d'un SIRET vérifiable au registre officiel SIRENE. Vous pouvez contrôler l'identité de l'entreprise avant même de demander un devis." />
      </section>

      {/* ─── CTA principal ─── */}
      <FinalCtaSection
        href={`/deposer-projet?categorie=${metier}`}
        title="Besoin d'un installateur de climatisation de confiance ?"
        text="Décrivez votre projet, recevez des devis d'installateurs SIRET vérifiés près de chez vous — gratuit, sans commission."
        buttonLabel="Décrire mon projet gratuitement"
        footnote="Gratuit · sans engagement · projet visible par les pros de votre zone"
      />

      {/* ─── FAQ (UI + schema FAQPage injecté plus haut) ─── */}
      <FaqAccordion faqs={faqs} title="Questions fréquentes — pose de climatisation" />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <MaillageCard
            href={`/${metier}`}
            title="Installateurs de climatisation autour de moi"
            subtitle="Trouver un pro près de chez vous"
          />
          <MaillageCard
            href="/guide-des-prix/prix-pose-climatiseur"
            title="Prix de pose d'un climatiseur"
            subtitle="Le guide détaillé de la prestation"
          />
          <MaillageCard
            href="/guide-des-prix/prix-entretien-climatisation"
            title="Prix d'entretien d'une climatisation"
            subtitle="Le guide détaillé de la prestation"
          />
        </div>

        <VillePills
          title="Pose de climatisation dans les grandes villes"
          links={villes.map((v) => ({
            href: `/${metier}/${v.slug}`,
            label: `Climatisation ${v.name}`,
          }))}
        />
      </div>
    </main>
  );
}

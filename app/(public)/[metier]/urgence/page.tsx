import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import FaqAccordion from "@/components/seo/FaqAccordion";
import StickyProjectCTA from "@/components/listing/StickyProjectCTA";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";
import { URGENCE_CONTENT } from "@/lib/data/urgence-content";
import { BASE_URL } from "@/lib/constants";

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
export const revalidate = 86400;

// Whitelist des métiers couverts — extensible (chauffagiste, plombier...).
const URGENCE_METIERS = new Set(["serrurier"]);

const METIER_LABELS: Record<string, { singular: string; plural: string }> = {
  serrurier: { singular: "Serrurier", plural: "serruriers" },
};

type Props = { params: Promise<{ metier: string }> };

function fmtEur(n: number): string {
  return n.toLocaleString("fr-FR");
}

/**
 * Illustration line-art "porte + clé" (style MonumentArt : traits fins,
 * currentColor pour la structure, accent coral pour la clé). Décorative.
 */
function DoorKeyArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 220 210"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.6}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      {/* cadre de porte */}
      <rect x="44" y="18" width="100" height="174" rx="8" />
      {/* panneau de porte */}
      <rect x="57" y="31" width="74" height="161" rx="4" />
      {/* moulures */}
      <rect x="68" y="44" width="52" height="40" rx="3" opacity="0.5" />
      <rect x="68" y="132" width="52" height="46" rx="3" opacity="0.5" />
      {/* poignée */}
      <circle cx="121" cy="110" r="3.2" fill="currentColor" stroke="none" />
      {/* trou de serrure */}
      <circle cx="94" cy="104" r="7" />
      <path d="M94 110 L94 122" />
      {/* clé — accent coral */}
      <g stroke="var(--accent)" strokeWidth={1.8}>
        <circle cx="170" cy="142" r="13" />
        <circle cx="170" cy="142" r="5.5" opacity="0.6" />
        <path d="M179 152 L203 178" />
        <path d="M194 168 L187 175" />
        <path d="M203 178 L196 185" />
      </g>
      {/* traits d'urgence */}
      <g stroke="var(--accent)" strokeWidth={1.6} opacity="0.7">
        <path d="M168 36 L180 24" />
        <path d="M178 52 L192 46" />
        <path d="M160 26 L164 16" />
      </g>
    </svg>
  );
}

/** Bouclier + coche line-art (confiance / vérification). Décoratif. */
function ShieldCheckArt({ className }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 64 64"
      fill="none"
      stroke="currentColor"
      strokeWidth={1.8}
      strokeLinecap="round"
      strokeLinejoin="round"
      className={className}
      aria-hidden="true"
    >
      <path d="M32 6 L52 14 V30 C52 44 44 53 32 58 C20 53 12 44 12 30 V14 Z" />
      <path d="M23 31 L29.5 38 L42 24" stroke="var(--accent)" strokeWidth={2.2} />
    </svg>
  );
}

function hostnameOf(url: string): string {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return "source";
  }
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { metier } = await params;
  if (!URGENCE_METIERS.has(metier)) return {};
  const content = URGENCE_CONTENT[metier];
  if (!content) return {};

  const year = new Date().getFullYear();
  const labels = METIER_LABELS[metier];
  const r0 = content.priceRanges[0];
  const title = `${labels.singular} en urgence : prix réels ${year}, tarifs et arnaques à éviter`;
  const description = `Ouverture de porte claquée : ${r0.low} à ${r0.high} € constatés. Évitez les arnaques : prix réels sourcés, ${labels.plural} vérifiés au registre SIRENE, devis gratuit, sans commission.`;

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
  if (!content) notFound();

  const year = new Date().getFullYear();
  const labels = METIER_LABELS[metier];
  const retrievedLabel = new Date(content.retrievedAt).toLocaleDateString("fr-FR", {
    month: "long",
    year: "numeric",
  });

  const porteClaquee = content.priceRanges[0];
  const porteVerrouillee = content.priceRanges[1];

  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: labels.singular, href: `/${metier}` },
    { label: "Urgence" },
  ];

  // FAQ — réponses dérivées UNIQUEMENT du contenu sourcé (urgence-content.ts).
  const faqs = [
    {
      question: "Combien coûte une ouverture de porte claquée ?",
      answer: `En journée et en semaine, les prix constatés en ${year} vont de ${fmtEur(porteClaquee.low)} € à ${fmtEur(porteClaquee.high)} € pour une porte simplement claquée. Méfiez-vous des prix d'appel très bas annoncés au téléphone : la facture est souvent fortement augmentée une fois le serrurier sur place. Exigez toujours un devis écrit avant l'intervention.`,
    },
    {
      question: "Porte claquée ou verrouillée : quelle différence de prix ?",
      answer: `Une porte claquée (non verrouillée) s'ouvre par une technique simple : comptez ${fmtEur(porteClaquee.low)} € à ${fmtEur(porteClaquee.high)} € constatés en journée. Une porte verrouillée ou blindée demande davantage de travail : les prix constatés vont de ${fmtEur(porteVerrouillee.low)} € à ${fmtEur(porteVerrouillee.high)} €. Précisez bien la situation au téléphone, car la technique et le coût ne sont pas les mêmes.`,
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
        {labels.singular} en urgence : prix réels, délais et arnaques à éviter
      </h1>

      {/* Intro factuelle — ton calme et protecteur, illustration en regard */}
      <div className="flex flex-col sm:flex-row gap-8 items-start mb-10">
        <div className="text-base text-[var(--text-secondary)] leading-relaxed space-y-3 flex-1">
          <p>
            Aucune réglementation générale n&apos;encadre les tarifs des {labels.plural} en
            France : chaque entreprise fixe librement ses prix. La loi impose en revanche
            une information préalable du client et un devis écrit avant toute intervention
            de dépannage à domicile. Sur le marché, les écarts sont considérables : une
            simple ouverture de porte claquée se facture entre {fmtEur(porteClaquee.low)} €
            et {fmtEur(porteClaquee.high)} € en journée, et une porte verrouillée ou
            blindée peut atteindre {fmtEur(porteVerrouillee.high)} €. Cette page rassemble
            les prix réellement constatés (sources citées), les arnaques les plus courantes
            et les bons réflexes à avoir avant d&apos;appeler.
          </p>
        </div>
        <DoorKeyArt className="hidden sm:block w-44 shrink-0 text-[var(--text-tertiary)]" />
      </div>

      {/* CTA héro — au-dessus de la ligne de flottaison : le visiteur en
          urgence veut une action immédiate, pas 2000 mots. */}
      <div className="mb-12 flex flex-col sm:flex-row sm:items-center gap-4">
        <Link
          href={`/deposer-projet?categorie=${metier}`}
          className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-7 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] whitespace-nowrap"
          style={{ boxShadow: "0 4px 16px -4px rgba(255,90,54,0.45)" }}
        >
          Trouver un {labels.singular.toLowerCase()} vérifié
        </Link>
        <p className="text-xs text-[var(--text-tertiary)] leading-relaxed">
          Gratuit, sans engagement — votre demande est visible par les{" "}
          {labels.plural} SIRET vérifiés de votre zone, qui vous recontactent
          directement.
        </p>
      </div>

      {/* ─── Tableau des prix réels — LA section différenciante ─── */}
      <section className="mb-12">
        <div className="rounded-2xl border border-[var(--card-border)] overflow-hidden">
          <div className="bg-[var(--bg-secondary)] px-6 py-3 border-b border-[var(--card-border)] flex items-center justify-between gap-3">
            <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide">
              Prix constatés {year}
            </h2>
            <span className="text-xs text-[var(--text-tertiary)]">
              Données {retrievedLabel}
            </span>
          </div>
          {/* Fourchettes visuelles : chaque barre positionne min→max sur une
              échelle commune (max global), plus lisible qu'un tableau sec. */}
          <div className="text-sm">
            {content.priceRanges.map((r, i) => {
              const maxHigh = Math.max(...content.priceRanges.map((p) => p.high));
              const left = (r.low / maxHigh) * 100;
              const width = Math.max(((r.high - r.low) / maxHigh) * 100, 4);
              return (
                <div
                  key={i}
                  className="px-6 py-4 border-b border-[var(--card-border)] last:border-0"
                >
                  <div className="flex items-baseline justify-between gap-4 mb-2.5">
                    <span className="text-[var(--text-secondary)]">{r.label}</span>
                    <span className="font-semibold text-[var(--text-primary)] whitespace-nowrap">
                      {fmtEur(r.low)} € à {fmtEur(r.high)} €
                    </span>
                  </div>
                  <div
                    className="relative h-1.5 rounded-full bg-[var(--bg-secondary)]"
                    aria-hidden="true"
                  >
                    <div
                      className="absolute top-0 h-full rounded-full"
                      style={{
                        left: `${left}%`,
                        width: `${width}%`,
                        background:
                          "linear-gradient(90deg, var(--accent), var(--accent-hover))",
                        opacity: 0.85,
                      }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
          <div className="px-6 py-2.5 bg-[var(--bg-secondary)] border-t border-[var(--card-border)] text-xs text-[var(--text-tertiary)]">
            Sources :{" "}
            {content.sources.slice(0, 4).map((u, i) => (
              <span key={i}>
                {i > 0 && ", "}
                <a
                  href={u}
                  target="_blank"
                  rel="noopener noreferrer nofollow"
                  className="underline hover:text-[var(--accent)]"
                >
                  {hostnameOf(u)}
                </a>
              </span>
            ))}
          </div>
        </div>

        {/* Callout majorations nuit / week-end */}
        <div className="mt-4 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5 flex gap-3.5">
          <svg
            className="w-5 h-5 shrink-0 mt-0.5 text-[var(--accent)]"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.8}
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <circle cx="12" cy="12" r="10" />
            <polyline points="12 6 12 12 16 14" />
          </svg>
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--text-primary)]">
              Majorations nuit, week-end et jours fériés.
            </span>{" "}
            {content.majorations}
          </p>
        </div>

        {/* CTA contextuel — pic de confiance : le visiteur vient de voir des
            prix honnêtes, c'est le moment où il bascule. */}
        <div className="mt-4 rounded-2xl border border-[var(--accent)]/25 bg-[var(--accent-muted)] px-5 py-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <p className="text-sm text-[var(--text-primary)] font-medium leading-relaxed">
            Recevez des devis dans ces fourchettes, de la part de{" "}
            {labels.plural} vérifiés près de chez vous.
          </p>
          <Link
            href={`/deposer-projet?categorie=${metier}`}
            className="inline-flex items-center justify-center gap-1.5 text-sm font-semibold text-[var(--accent)] hover:underline whitespace-nowrap shrink-0"
          >
            Demander un devis gratuit
            <svg
              className="w-4 h-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
              aria-hidden="true"
            >
              <path d="M5 12h14" />
              <path d="M12 5l7 7-7 7" />
            </svg>
          </Link>
        </div>
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
        <ul className="space-y-3">
          {content.scamWarnings.map((w, i) => (
            <li
              key={i}
              className="flex gap-3.5 rounded-2xl border border-[var(--card-border)] p-5"
            >
              <svg
                className="w-5 h-5 shrink-0 mt-0.5 text-[var(--accent)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M10.29 3.86L1.82 18a2 2 0 0 0 1.71 3h16.94a2 2 0 0 0 1.71-3L13.71 3.86a2 2 0 0 0-3.42 0z" />
                <line x1="12" y1="9" x2="12" y2="13" />
                <line x1="12" y1="17" x2="12.01" y2="17" />
              </svg>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{w}</p>
            </li>
          ))}
        </ul>

        {/* CTA contextuel — pic émotionnel : après la liste des arnaques, on
            propose la voie sûre. */}
        <div className="mt-5 flex flex-col sm:flex-row sm:items-center gap-3 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-5 py-4">
          <ShieldCheckArt className="w-8 h-8 shrink-0 text-[var(--text-primary)]" />
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed flex-1">
            Pour écarter ces risques : décrivez votre situation sur Workwave, et
            seuls des {labels.plural} au SIRET vérifié peuvent vous répondre.
          </p>
          <Link
            href={`/deposer-projet?categorie=${metier}`}
            className="inline-flex items-center justify-center border border-[var(--accent)] text-[var(--accent)] hover:bg-[var(--accent)] hover:text-white px-5 py-2.5 rounded-full text-sm font-semibold transition-all duration-250 whitespace-nowrap shrink-0"
          >
            Passer par un pro vérifié
          </Link>
        </div>
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
        <ul className="space-y-4">
          {content.goodReflexes.map((r, i) => (
            <li key={i} className="flex gap-4 items-start">
              <span className="w-7 h-7 shrink-0 rounded-full bg-[var(--accent-muted)] text-[var(--accent)] text-[13px] font-bold flex items-center justify-center">
                {i + 1}
              </span>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed pt-1">
                {r}
              </p>
            </li>
          ))}
        </ul>
        <div className="mt-6 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5">
          <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
            <span className="font-semibold text-[var(--text-primary)]">
              Bon à savoir :
            </span>{" "}
            chaque {labels.singular.toLowerCase()}{" "}référencé sur Workwave
            dispose d&apos;un SIRET vérifiable au registre officiel SIRENE. Vous pouvez
            contrôler l&apos;identité de l&apos;entreprise avant même de décrocher
            votre téléphone.
          </p>
        </div>
      </section>

      {/* ─── Ce que dit la loi ─── */}
      <section className="mb-12">
        <h2 className="text-xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
          Ce que dit la loi
        </h2>
        <ul className="space-y-3">
          {content.legalFacts.map((f, i) => (
            <li
              key={i}
              className="flex gap-3.5 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] p-5"
            >
              <svg
                className="w-5 h-5 shrink-0 mt-0.5 text-[var(--text-tertiary)]"
                viewBox="0 0 24 24"
                fill="none"
                stroke="currentColor"
                strokeWidth={1.8}
                strokeLinecap="round"
                strokeLinejoin="round"
                aria-hidden="true"
              >
                <path d="M14 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8z" />
                <polyline points="14 2 14 8 20 8" />
                <line x1="16" y1="13" x2="8" y2="13" />
                <line x1="16" y1="17" x2="8" y2="17" />
              </svg>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{f}</p>
            </li>
          ))}
        </ul>
      </section>

      {/* ─── CTA principal ─── */}
      <section className="mb-12 rounded-2xl bg-[var(--accent-muted)] border border-[var(--accent)]/20 p-6 sm:p-8 text-center">
        <ShieldCheckArt className="w-12 h-12 mx-auto mb-4 text-[var(--text-primary)]" />
        <h2 className="text-lg sm:text-xl font-bold tracking-tight text-[var(--text-primary)] mb-2">
          Besoin d&apos;un {labels.singular.toLowerCase()} de confiance ?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-md mx-auto mb-6">
          Décrivez votre problème, recevez des devis de {labels.plural} SIRET vérifiés
          près de chez vous — gratuit, sans commission.
        </p>
        <Link
          href={`/deposer-projet?categorie=${metier}`}
          className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-8 py-3.5 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02]"
          style={{ boxShadow: "0 4px 16px -4px rgba(255,90,54,0.45)" }}
        >
          Décrire mon problème gratuitement
        </Link>
        <p className="mt-3 text-xs text-[var(--text-tertiary)]">
          Gratuit · sans engagement · projet visible par les pros de votre zone
        </p>
      </section>

      {/* ─── FAQ (UI + schema FAQPage injecté plus haut) ─── */}
      <FaqAccordion
        faqs={faqs}
        title={`Questions fréquentes — ${labels.singular.toLowerCase()} en urgence`}
      />

      {/* ─── Maillage interne ─── */}
      <div className="mt-14 pt-8 border-t border-[var(--border-color)]">
        <div className="grid sm:grid-cols-3 gap-4 mb-8">
          <Link
            href={`/${metier}`}
            className="rounded-2xl border border-[var(--card-border)] p-5 hover:border-[var(--accent)] transition-colors duration-200"
          >
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              {labels.singular}s autour de moi
            </span>
            <span className="block text-xs text-[var(--text-tertiary)] mt-1">
              Trouver un pro près de chez vous
            </span>
          </Link>
          <Link
            href={`/${metier}/prix`}
            className="rounded-2xl border border-[var(--card-border)] p-5 hover:border-[var(--accent)] transition-colors duration-200"
          >
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Guide des prix {labels.singular.toLowerCase()}
            </span>
            <span className="block text-xs text-[var(--text-tertiary)] mt-1">
              Tous les tarifs du métier
            </span>
          </Link>
          <Link
            href="/guide-des-prix/prix-changement-serrure"
            className="rounded-2xl border border-[var(--card-border)] p-5 hover:border-[var(--accent)] transition-colors duration-200"
          >
            <span className="text-sm font-semibold text-[var(--text-primary)]">
              Prix d&apos;un changement de serrure
            </span>
            <span className="block text-xs text-[var(--text-tertiary)] mt-1">
              Le guide détaillé de la prestation
            </span>
          </Link>
        </div>

        <h2 className="text-sm font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-3">
          {labels.singular} en urgence dans les grandes villes
        </h2>
        <ul className="flex flex-wrap gap-2">
          {villes.map((v) => (
            <li key={v.slug}>
              <Link
                href={`/${metier}/${v.slug}`}
                className="inline-flex items-center px-3.5 py-2 rounded-full border border-[var(--card-border)] text-[13px] text-[var(--text-secondary)] hover:border-[var(--accent)] hover:text-[var(--text-primary)] transition-colors duration-200"
              >
                {labels.singular} {v.name}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </main>
  );
}

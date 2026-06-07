import type { Metadata } from "next";
import Link from "next/link";
import { notFound } from "next/navigation";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/ui/Breadcrumb";
import CompetitorComparison from "@/components/pro/CompetitorComparison";
import { COMPETITOR_OFFERS, type CompetitorOffer } from "@/lib/data/competitor-offers";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";

const BASE_URL = "https://workwave.fr";

// Seuls les concurrents avec un modèle ET un prix CONFIRMÉS (sourcés) ont une
// page dédiée. Les autres (données null) ne sont jamais publiés → 404.
type PublishableOffer = CompetitorOffer & { model: string; price_text: string };
function publishable(c: CompetitorOffer | undefined): c is PublishableOffer {
  return !!c && !!c.model && !!c.price_text;
}

export function generateStaticParams() {
  return Object.values(COMPETITOR_OFFERS)
    .filter(publishable)
    .map((c) => ({ concurrent: c.slug }));
}

export const dynamicParams = false;

export async function generateMetadata({
  params,
}: {
  params: Promise<{ concurrent: string }>;
}): Promise<Metadata> {
  const { concurrent } = await params;
  const c = COMPETITOR_OFFERS[concurrent];
  if (!publishable(c)) return { title: "Alternative — Workwave" };
  const title = `Workwave, l'alternative à ${c.name} sans abonnement — 9,90 € / lead`;
  const description = `${c.name} : ${c.model.toLowerCase()}. Workwave : pas d'abonnement, pas de commission, 9,90 € TTC par lead que vous voulez contacter. Comparatif factuel et inscription gratuite.`;
  const canonical = `${BASE_URL}/pro/alternatives/${c.slug}`;
  return {
    title,
    description,
    alternates: { canonical },
    openGraph: { type: "website", title, description, url: canonical },
  };
}

function buildFaqs(c: PublishableOffer): { question: string; answer: string }[] {
  const faqs: { question: string; answer: string }[] = [
    {
      question: `Workwave est-il vraiment sans abonnement, contrairement à ${c.name} ?`,
      answer: `Oui. Sur Workwave, vous réclamez votre fiche gratuitement (vérification SIRET, 2 minutes) et recevez automatiquement les projets de votre zone par email. Vous ne payez que 9,90 € TTC pour débloquer les coordonnées d'un client qui vous intéresse — paiement unique, sans abonnement ni carte bancaire à l'inscription. ${c.name} fonctionne, lui, sur un modèle de type « ${c.model.toLowerCase()} ».`,
    },
    {
      question: `Combien coûte un lead sur Workwave par rapport à ${c.name} ?`,
      answer: `Sur Workwave, un lead coûte 9,90 € TTC, payé uniquement quand vous décidez de contacter le client. Côté ${c.name}, le tarif constaté est de « ${c.price_text} » (donnée indicative tierce, à vérifier sur leur site). Avec Workwave, vous gardez le contrôle total : vous ne payez que les projets que vous choisissez réellement de traiter.`,
    },
  ];
  if (c.leads_shared) {
    faqs.push({
      question: `Comment Workwave évite-t-il le lead acheté à l'aveugle ?`,
      answer: `Sur Workwave, vous recevez gratuitement par email les projets de votre zone et consultez chaque demande en entier (description, budget, ville) avant de payer. Vous ne déboursez les 9,90 € TTC que si vous décidez de débloquer les coordonnées. Chez ${c.name}, le constat est : « ${c.leads_shared} ». Vous gardez ainsi le contrôle total de ce que vous payez.`,
    });
  }
  faqs.push({
    question: `Comment m'inscrire sur Workwave ?`,
    answer: `Saisissez votre numéro SIRET sur la page « Retrouver ma fiche », confirmez votre identité par email, et vous recevez immédiatement les projets de votre catégorie et de votre département. C'est gratuit, sans engagement et sans carte bancaire.`,
  });
  return faqs;
}

const valueProps = [
  {
    title: "Aucun abonnement, aucun engagement",
    description:
      "Vous ne payez jamais d'abonnement mensuel. Pas de période bloquée, pas de prélèvement récurrent. Vous débloquez un lead seulement quand vous le voulez.",
  },
  {
    title: "9,90 € TTC par lead, prix transparent",
    description:
      "Un tarif unique, clair, affiché. Pas de crédits à acheter d'avance, pas de grille opaque selon la zone ou le métier. Vous savez exactement ce que vous payez.",
  },
  {
    title: "Vous voyez le projet avant de payer",
    description:
      "Description, budget, ville, délai : vous consultez chaque demande gratuitement et ne déboursez les 9,90 € que si vous décidez de débloquer les coordonnées. Jamais de lead acheté à l'aveugle.",
  },
  {
    title: "0 % de commission sur vos devis",
    description:
      "Workwave ne touche rien sur vos chantiers. Le devis, le contrat et le paiement se font à 100 % entre vous et le client. Vos revenus restent vos revenus.",
  },
];

export default async function AlternativePage({
  params,
}: {
  params: Promise<{ concurrent: string }>;
}) {
  const { concurrent } = await params;
  const c = COMPETITOR_OFFERS[concurrent];
  if (!publishable(c)) notFound();

  const faqs = buildFaqs(c);
  const breadcrumbItems = [
    { label: "Accueil", href: "/" },
    { label: "Espace Pro", href: "/pro" },
    { label: "Sans abonnement", href: "/pro/sans-abonnement" },
    { label: `Alternative à ${c.name}` },
  ];

  return (
    <main className="px-4 py-10 sm:py-14">
      <JsonLd data={toBreadcrumbSchema(breadcrumbItems, BASE_URL)} />
      <JsonLd data={getFaqSchema(faqs)} />

      <div className="max-w-4xl mx-auto">
        <Breadcrumb items={breadcrumbItems} />

        {/* Hero */}
        <header className="mb-12">
          <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-tight mb-5">
            Workwave, l&apos;alternative à {c.name}
            <span className="text-[var(--accent)]"> sans abonnement.</span>
          </h1>
          <p className="text-lg text-[var(--text-secondary)] leading-relaxed max-w-2xl">
            Recevez les demandes de travaux de votre zone et payez uniquement
            <strong className="text-[var(--text-primary)] font-semibold"> 9,90 € TTC par lead</strong> que
            vous voulez contacter. Pas d&apos;abonnement, pas de commission, pas
            d&apos;engagement.
          </p>
          <div className="mt-8 flex flex-wrap gap-3">
            <Link
              href="/pro/retrouver-fiche"
              className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-3 px-8 rounded-full transition-all duration-250 hover:scale-[1.02]"
            >
              Tapez votre SIRET pour commencer
            </Link>
            <Link
              href="/pro"
              className="inline-flex items-center justify-center border border-[var(--card-border)] text-[var(--text-primary)] font-semibold py-3 px-8 rounded-full hover:border-[var(--accent)] transition-all duration-250"
            >
              Comment ça marche
            </Link>
          </div>
        </header>

        {/* Modèle du concurrent (factuel, sourcé) */}
        {c.summary && (
          <section className="mb-10">
            <h2 className="text-xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
              Le modèle de {c.name}
            </h2>
            <p className="text-[var(--text-secondary)] leading-relaxed">
              {c.summary}
            </p>
          </section>
        )}

        {/* Tableau comparatif */}
        <section className="mb-14">
          <h2 className="text-xl font-bold text-[var(--text-primary)] mb-5 tracking-tight">
            Workwave vs {c.name} : le comparatif
          </h2>
          <CompetitorComparison competitor={c} />
        </section>

        {/* Value props */}
        <section className="mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] text-center mb-10 tracking-tight">
            Pourquoi les artisans choisissent le pay-per-lead
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
            {valueProps.map((v) => (
              <div
                key={v.title}
                className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6"
              >
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                  {v.title}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed">
                  {v.description}
                </p>
              </div>
            ))}
          </div>
        </section>

        {/* FAQ */}
        <section className="mb-14">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] text-center mb-8 tracking-tight">
            Questions fréquentes
          </h2>
          <div className="max-w-3xl mx-auto divide-y divide-[var(--border-color)]">
            {faqs.map((faq) => (
              <details key={faq.question} className="group py-5">
                <summary className="flex items-center justify-between cursor-pointer list-none">
                  <span className="text-base font-medium text-[var(--text-primary)] pr-4">
                    {faq.question}
                  </span>
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0 text-[var(--text-tertiary)] transition-transform duration-250 group-open:rotate-180"
                  >
                    <path
                      d="M5 7.5L10 12.5L15 7.5"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </summary>
                <p className="text-sm text-[var(--text-secondary)] leading-relaxed mt-3 pr-8">
                  {faq.answer}
                </p>
              </details>
            ))}
          </div>
        </section>

        {/* CTA final */}
        <section className="text-center bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            Prêt à recevoir vos premiers chantiers
            <span className="text-[var(--accent)]"> ?</span>
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Réclamez votre fiche gratuitement et recevez les projets de votre
            zone. Vous ne payez que les leads qui vous intéressent.
          </p>
          <Link
            href="/pro/retrouver-fiche"
            className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-4 px-10 rounded-full text-base transition-all duration-250 hover:scale-[1.02]"
          >
            Trouver ma fiche gratuitement
          </Link>
        </section>
      </div>
    </main>
  );
}

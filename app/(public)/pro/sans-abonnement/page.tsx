import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import Breadcrumb from "@/components/ui/Breadcrumb";
import { COMPETITOR_OFFERS } from "@/lib/data/competitor-offers";
import { toBreadcrumbSchema, getFaqSchema } from "@/lib/utils/schema";

const BASE_URL = "https://workwave.fr";

export const metadata: Metadata = {
  title: "Recevez des chantiers sans abonnement — Pay-per-lead 9,90 €",
  description:
    "Marre des abonnements mensuels et des leads vendus à 10 artisans ? Workwave : fiche gratuite, pas d'abonnement, 9,90 € TTC par lead que vous voulez contacter. Comparatif des plateformes.",
  alternates: { canonical: `${BASE_URL}/pro/sans-abonnement` },
  openGraph: {
    type: "website",
    title: "Recevez des chantiers sans abonnement — Workwave",
    description:
      "Fiche gratuite, pas d'abonnement, 9,90 € TTC par lead. Le comparatif des plateformes de mise en relation pour artisans.",
    url: `${BASE_URL}/pro/sans-abonnement`,
  },
};

// Concurrents publiables (modèle + prix confirmés/sourcés uniquement).
const competitors = Object.values(COMPETITOR_OFFERS).filter(
  (c) => c.model && c.price_text
);

const faqs = [
  {
    question: "Workwave a-t-il un abonnement mensuel pour les pros ?",
    answer:
      "Non. La fiche professionnelle est gratuite à vie et l'inscription ne demande aucune carte bancaire. Vous recevez automatiquement les projets de votre zone par email. Vous payez uniquement 9,90 € TTC pour débloquer les coordonnées d'un client que vous souhaitez contacter — paiement unique par projet, sans aucun abonnement.",
  },
  {
    question: "Quelle différence avec les plateformes à abonnement ?",
    answer:
      "Les plateformes à abonnement facturent un montant fixe chaque mois, que vous décrochiez des chantiers ou non. Avec le pay-per-lead de Workwave, vous ne dépensez que lorsqu'un projet vous intéresse vraiment : 9,90 € TTC pour ce projet précis. Aucun risque de payer dans le vide pendant un mois creux.",
  },
  {
    question: "Comment je reçois les projets, et est-ce que je paie pour les voir ?",
    answer:
      "Vous recevez gratuitement par email les projets de votre catégorie publiés dans votre zone d'intervention, et vous les consultez en entier (description, budget, ville, délai) sans rien payer. Vous ne déboursez les 9,90 € TTC que si vous décidez de débloquer les coordonnées du client pour le contacter. Vous ne payez donc jamais pour un lead que vous n'avez pas choisi, ni à l'aveugle.",
  },
  {
    question: "Workwave prend-il une commission sur mes chantiers ?",
    answer:
      "Non, 0 % de commission. Le devis, le contrat et le paiement se font directement entre vous et le client. Workwave est un simple intermédiaire de mise en relation : vos revenus restent intégralement les vôtres.",
  },
  {
    question: "Comment recevoir des chantiers sans payer d'abonnement ?",
    answer:
      "Saisissez votre SIRET sur la page « Retrouver ma fiche », confirmez votre identité par email, et c'est tout : vous recevez automatiquement les projets de votre catégorie et de votre département. Vous décidez ensuite, projet par projet, lesquels débloquer pour 9,90 € TTC.",
  },
];

const breadcrumbItems = [
  { label: "Accueil", href: "/" },
  { label: "Espace Pro", href: "/pro" },
  { label: "Sans abonnement" },
];

function fmtMonth(iso: string): string {
  const [y, m] = iso.split("-");
  const mois = [
    "janv.", "févr.", "mars", "avr.", "mai", "juin",
    "juil.", "août", "sept.", "oct.", "nov.", "déc.",
  ];
  return `${mois[parseInt(m, 10) - 1]} ${y}`;
}

export default function SansAbonnementPage() {
  return (
    <main>
      <JsonLd data={toBreadcrumbSchema(breadcrumbItems, BASE_URL)} />
      <JsonLd data={getFaqSchema(faqs)} />

      {/* Hero */}
      <section className="px-4 pt-12 sm:pt-16 pb-4">
        <div className="max-w-4xl mx-auto">
          <Breadcrumb items={breadcrumbItems} />
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold text-[var(--text-primary)] leading-[1.1] tracking-tight mb-6">
            Recevez des chantiers
            <span className="text-[var(--accent)]"> sans abonnement.</span>
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed max-w-2xl mb-8">
            Pas d&apos;abonnement mensuel, pas de commission, pas de lead revendu
            à dix artisans. Vous réclamez votre fiche gratuitement, recevez les
            demandes de votre zone, et payez seulement{" "}
            <strong className="text-[var(--text-primary)] font-semibold">9,90 € TTC par lead</strong> que
            vous voulez contacter.
          </p>
          <Link
            href="/pro/retrouver-fiche"
            className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-4 px-10 rounded-full text-base transition-all duration-250 hover:scale-[1.02]"
          >
            Tapez votre SIRET pour commencer
          </Link>
          <p className="text-xs text-[var(--text-tertiary)] mt-3">
            Gratuit · Sans carte bancaire · 2 minutes
          </p>
        </div>
      </section>

      {/* Les modèles du marché — table comparative factuelle sourcée */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-4 tracking-tight">
            Les modèles de facturation du marché
          </h2>
          <p className="text-[var(--text-secondary)] leading-relaxed mb-8 max-w-2xl">
            La plupart des plateformes de mise en relation facturent les artisans
            via un abonnement mensuel ou la vente de leads partagés. Voici les
            modèles constatés, comparés à celui de Workwave.
          </p>

          <div className="overflow-x-auto -mx-4 px-4">
            <table className="w-full min-w-[640px] border-collapse text-sm">
              <thead>
                <tr className="border-b border-[var(--border-color)]">
                  <th className="text-left font-semibold text-[var(--text-secondary)] py-3 pr-4">Plateforme</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] py-3 pr-4">Modèle</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] py-3 pr-4">Prix payé par le pro</th>
                  <th className="text-left font-semibold text-[var(--text-secondary)] py-3">Engagement</th>
                </tr>
              </thead>
              <tbody>
                {/* Ligne Workwave en avant */}
                <tr className="border-b border-[var(--border-color)] bg-[var(--accent-muted)]">
                  <td className="py-4 pr-4 font-bold text-[var(--text-primary)]">Workwave</td>
                  <td className="py-4 pr-4 text-[var(--text-primary)]">Pay-per-lead transparent</td>
                  <td className="py-4 pr-4 text-[var(--text-primary)] font-semibold">9,90 € TTC / lead débloqué</td>
                  <td className="py-4 text-[var(--text-primary)]">Aucun</td>
                </tr>
                {competitors.map((c) => (
                  <tr key={c.slug} className="border-b border-[var(--border-color)]">
                    <td className="py-4 pr-4 font-medium text-[var(--text-primary)]">
                      <Link href={`/pro/alternatives/${c.slug}`} className="hover:text-[var(--accent)] underline-offset-2 hover:underline">
                        {c.name}
                      </Link>
                    </td>
                    <td className="py-4 pr-4 text-[var(--text-secondary)]">{c.model}</td>
                    <td className="py-4 pr-4 text-[var(--text-secondary)]">{c.price_text}</td>
                    <td className="py-4 text-[var(--text-secondary)]">{c.commitment ?? "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="text-xs text-[var(--text-tertiary)] mt-4 leading-relaxed">
            Données concurrents indicatives, issues de sources publiques tierces
            constatées en {fmtMonth(competitors[0]?.retrievedAt || "2026-06-07")},
            susceptibles d&apos;évoluer — vérifiez les conditions à jour sur le
            site de chaque plateforme. Comparatif objectif (art. L121-8 du Code de
            la consommation).
          </p>
        </div>
      </section>

      {/* Comparatifs détaillés — cartes vers les pages alternatives */}
      <section className="px-4 py-16 sm:py-20 bg-[var(--bg-secondary)]">
        <div className="max-w-4xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight text-center">
            Comparatifs détaillés
          </h2>
          <p className="text-[var(--text-secondary)] text-center mb-10 max-w-xl mx-auto">
            Workwave face à chaque plateforme, point par point.
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-5">
            {competitors.map((c) => (
              <Link
                key={c.slug}
                href={`/pro/alternatives/${c.slug}`}
                className="block bg-[var(--bg-primary)] border border-[var(--card-border)] rounded-2xl p-6 hover:border-[var(--accent)] transition-all duration-250 hover:-translate-y-1"
              >
                <h3 className="text-base font-semibold text-[var(--text-primary)] mb-2">
                  Workwave vs {c.name}
                </h3>
                <p className="text-sm text-[var(--text-secondary)] mb-4">
                  {c.model}
                </p>
                <span className="text-sm font-medium text-[var(--accent)]">
                  Voir le comparatif →
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="px-4 py-16 sm:py-20">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] text-center mb-10 tracking-tight">
            Questions fréquentes
          </h2>
          <div className="divide-y divide-[var(--border-color)]">
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
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 pb-20 sm:pb-28">
        <div className="max-w-3xl mx-auto text-center bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-3xl p-8 sm:p-12">
          <h2 className="text-2xl sm:text-3xl font-bold text-[var(--text-primary)] mb-3 tracking-tight">
            Arrêtez de payer pour rien
            <span className="text-[var(--accent)]">.</span>
          </h2>
          <p className="text-[var(--text-secondary)] mb-8 max-w-xl mx-auto">
            Réclamez votre fiche gratuitement et recevez les chantiers de votre
            zone dès aujourd&apos;hui. Vous ne payez que les leads qui vous
            intéressent.
          </p>
          <Link
            href="/pro/retrouver-fiche"
            className="inline-flex items-center justify-center bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold py-4 px-10 rounded-full text-base transition-all duration-250 hover:scale-[1.02]"
          >
            Trouver ma fiche gratuitement
          </Link>
        </div>
      </section>
    </main>
  );
}

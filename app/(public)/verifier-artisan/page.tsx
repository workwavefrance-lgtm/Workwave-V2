import type { Metadata } from "next";
import Link from "next/link";
import Breadcrumb from "@/components/ui/Breadcrumb";
import JsonLd from "@/components/seo/JsonLd";
import { toBreadcrumbSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";
import VerifierArtisanForm from "./VerifierArtisanForm";

// Le gabarit racine ajoute « | Workwave.fr » : titre court pour rester lisible dans Google.
const TITRE = "Vérifier un artisan par SIRET : est-il en activité ?";
const DESCRIPTION =
  "Entrez le SIRET ou le SIREN d'un artisan : état de l'établissement (en activité ou fermé), date de création, activité, forme juridique, certification RGE. Données du registre Sirene de l'INSEE, gratuit et sans inscription.";

export const metadata: Metadata = {
  title: TITRE,
  description: DESCRIPTION,
  alternates: { canonical: `${BASE_URL}/verifier-artisan` },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Workwave.fr",
    title: TITRE,
    description: DESCRIPTION,
    url: `${BASE_URL}/verifier-artisan`,
  },
};

// Contenu FAQ : chaque réponse décrit ce que l'outil fait réellement, rien de plus.
const FAQ: { question: string; reponse: string }[] = [
  {
    question: "Où trouver le SIRET d'un artisan ?",
    reponse:
      "Sur son devis ou sa facture : 14 chiffres, souvent près du nom de l'entreprise. Si vous n'avez que le SIREN (9 chiffres), la vérification porte sur le siège de l'entreprise.",
  },
  {
    question: "Que signifie « établissement fermé » ?",
    reponse:
      "L'INSEE a enregistré la fermeture de ce lieu d'activité. L'entreprise peut avoir déménagé (elle reste alors « active » avec un autre établissement) ou avoir cessé toute activité (« entreprise cessée »). L'outil affiche les deux états séparément.",
  },
  {
    question: "D'où viennent les données ?",
    reponse:
      "Du répertoire Sirene tenu par l'INSEE, consulté à chaque vérification via l'API publique Annuaire des entreprises (recherche-entreprises.api.gouv.fr). Workwave.fr n'ajoute, ne modifie et ne conserve aucune donnée.",
  },
  {
    question: "Un artisan en activité est-il forcément fiable ?",
    reponse:
      "Non. Le registre atteste l'existence légale et l'état administratif de l'entreprise, pas la qualité du travail. Demandez l'attestation d'assurance décennale, comparez plusieurs devis et lisez les avis.",
  },
];

export default function VerifierArtisanPage() {
  const fil = [{ label: "Accueil", href: "/" }, { label: "Vérifier un artisan" }];
  const faqJsonLd = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: FAQ.map((f) => ({
      "@type": "Question",
      name: f.question,
      acceptedAnswer: { "@type": "Answer", text: f.reponse },
    })),
  };

  return (
    <main className="max-w-2xl mx-auto px-4 py-12 sm:py-16">
      <JsonLd data={toBreadcrumbSchema(fil, BASE_URL)} />
      <JsonLd data={faqJsonLd} />
      <Breadcrumb items={fil} />

      <p className="text-sm font-medium text-[var(--accent)] mb-4 tracking-wide uppercase">
        Outil gratuit
      </p>
      <h1 className="text-3xl sm:text-4xl lg:text-5xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-5">
        Vérifier un artisan : <span className="whitespace-nowrap">existe-t-il</span> vraiment,{" "}
        <span className="whitespace-nowrap">est-il</span> toujours en activité ?
      </h1>
      <p className="text-base sm:text-lg text-[var(--text-secondary)] leading-relaxed mb-8">
        Avant de signer un devis, vérifiez l&apos;entreprise au registre Sirene de l&apos;INSEE,
        le registre officiel de toutes les entreprises françaises, mis à jour en continu. En
        quelques secondes : l&apos;établissement est-il ouvert ou fermé, depuis quand
        l&apos;entreprise existe, quelle est son activité déclarée, sa forme juridique, son
        effectif, et si elle est reconnue RGE.
      </p>

      <VerifierArtisanForm />

      <section className="mt-16">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-4">
          Ce que la vérification vous apprend
        </h2>
        <ul className="space-y-3 text-[15px] text-[var(--text-secondary)] leading-relaxed">
          {/* Espaces explicites après chaque <span> : le compilateur JSX avale
              l'espace qui précède un retour à la ligne (leçon du 02/09). */}
          <li>
            <span className="text-[var(--text-primary)] font-medium">L&apos;état de l&apos;établissement</span>
            {" : en activité, ou fermé avec la date de fermeture enregistrée par l'INSEE."}
          </li>
          <li>
            <span className="text-[var(--text-primary)] font-medium">L&apos;état de l&apos;entreprise</span>
            {" : active, ou cessée avec sa date de cessation. Un établissement peut être fermé alors que l'entreprise continue ailleurs."}
          </li>
          <li>
            <span className="text-[var(--text-primary)] font-medium">La date de création et l&apos;ancienneté</span>
            {", l'activité déclarée (code NAF et son libellé officiel), l'adresse, la forme juridique et la tranche d'effectif."}
          </li>
          <li>
            <span className="text-[var(--text-primary)] font-medium">La reconnaissance RGE</span>
            {", nécessaire pour les aides à la rénovation énergétique, telle qu'enregistrée dans l'annuaire officiel."}
          </li>
        </ul>
      </section>

      <section className="mt-14">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
          Questions fréquentes
        </h2>
        <div className="divide-y divide-[var(--border-color)] border-y border-[var(--border-color)]">
          {FAQ.map((f) => (
            <details key={f.question} className="group py-4">
              <summary className="cursor-pointer list-none flex items-center justify-between gap-4 text-[15px] font-medium text-[var(--text-primary)]">
                {f.question}
                <svg
                  viewBox="0 0 20 20"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth={1.75}
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  className="w-4 h-4 shrink-0 text-[var(--text-tertiary)] transition-transform duration-200 group-open:rotate-180"
                  aria-hidden="true"
                >
                  <path d="M5 8l5 5 5-5" />
                </svg>
              </summary>
              <p className="mt-3 text-[15px] text-[var(--text-secondary)] leading-relaxed">{f.reponse}</p>
            </details>
          ))}
        </div>
      </section>

      <p className="mt-12 text-sm text-[var(--text-tertiary)] leading-relaxed">
        Vous préparez des travaux ? Consultez les{" "}
        <Link href="/guide-des-prix" className="underline underline-offset-4 hover:text-[var(--text-primary)] transition-colors duration-200">
          guides des prix par métier
        </Link>{" "}
        ou{" "}
        <Link href="/deposer-projet" className="underline underline-offset-4 hover:text-[var(--text-primary)] transition-colors duration-200">
          déposez votre projet gratuitement
        </Link>
        .
      </p>
    </main>
  );
}

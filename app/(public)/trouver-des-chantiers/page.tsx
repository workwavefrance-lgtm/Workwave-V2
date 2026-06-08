import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import ChantiersSections from "@/components/chantiers/ChantiersSections";
import {
  getChantiersFaqSchema,
  getChantiersServiceSchema,
} from "@/lib/data/chantiers";

// Page hub PRO-ACQUISITION : capter l'intention "trouver des chantiers"
// (artisans qui cherchent du travail) — requête sur laquelle travaux.com,
// habitatpresto, ootravaux… paient des Google Ads, et où Workwave n'avait
// AUCUNE page. Angle gagnant (analyse concurrentielle) : on est le SEUL à
// afficher le prix (9,90 €/lead) ; tous les autres le cachent. + FAQPage schema
// qu'aucun concurrent n'a. Contenu mutualisé via ChantiersSections.

const BASE_URL = "https://workwave.fr";

export const metadata: Metadata = {
  title: "Trouver des chantiers : 9,90 €/lead, sans abonnement",
  description:
    "Recevez les demandes de votre zone et payez 9,90 € seulement pour débloquer un contact. Sans abonnement, sans commission. Créez votre fiche gratuite.",
  alternates: { canonical: `${BASE_URL}/trouver-des-chantiers` },
  openGraph: {
    title:
      "Trouver des chantiers près de chez vous — 9,90 €/lead, sans abonnement",
    description:
      "Le seul service d'apport de chantiers à prix transparent : 9,90 € le contact, zéro abonnement, zéro commission. Créez votre fiche gratuite sur Workwave.",
    url: `${BASE_URL}/trouver-des-chantiers`,
    type: "website",
  },
};

export default function TrouverDesChantiersPage() {
  return (
    <main>
      <JsonLd data={getChantiersServiceSchema()} />
      <JsonLd data={getChantiersFaqSchema()} />

      {/* ===================== HERO ===================== */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-semibold text-[var(--accent)] mb-4 tracking-wide uppercase">
            Pour les artisans
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
            Trouvez des chantiers près de chez vous.
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed mb-4 max-w-2xl mx-auto">
            Recevez les demandes des particuliers de votre zone. Payez{" "}
            <strong className="text-[var(--text-primary)]">
              9,90 € seulement
            </strong>{" "}
            pour débloquer un contact qui vous intéresse.
          </p>
          <p className="text-base text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
            Pas d&apos;abonnement. Pas d&apos;engagement. Pas de commission sur
            vos chantiers.{" "}
            <strong>Le seul service qui affiche son prix.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/pro/retrouver-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Trouver ma fiche avec mon SIRET
            </Link>
            <Link
              href="/pro/creer-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Créer ma fiche
            </Link>
          </div>
          <p className="mt-5 text-sm text-[var(--text-tertiary)]">
            Inscription gratuite · Fiche en ligne en 2 minutes
          </p>
        </div>
      </section>

      <ChantiersSections />
    </main>
  );
}

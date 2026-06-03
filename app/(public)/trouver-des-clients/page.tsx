import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import ClientsSections from "@/components/clients/ClientsSections";
import {
  getClientsFaqSchema,
  getClientsServiceSchema,
} from "@/lib/data/clients";

// Hub PRO-ACQUISITION services à domicile & aide à la personne : capter
// "trouver des clients" (femmes de ménage, jardiniers, gardes d'enfants, profs,
// aides à domicile…). Pendant de /trouver-des-chantiers (BTP). Même angle :
// 9,90 €/contact, zéro abonnement, zéro commission, seul à afficher le prix.

const BASE_URL = "https://workwave.fr";

export const metadata: Metadata = {
  title: "Trouver des clients : 9,90 €/contact, sans abonnement",
  description:
    "Professionnels des services à domicile et de l'aide à la personne : trouvez des clients près de chez vous. Payez 9,90 € seulement pour débloquer un contact qui vous intéresse — sans abonnement, sans commission. Créez votre fiche gratuite.",
  alternates: { canonical: `${BASE_URL}/trouver-des-clients` },
  openGraph: {
    title:
      "Trouver des clients près de chez vous — 9,90 €/contact, sans abonnement",
    description:
      "Ménage, jardinage, garde d'enfants, soutien scolaire… Recevez des clients près de chez vous. 9,90 € le contact, zéro abonnement, zéro commission.",
    url: `${BASE_URL}/trouver-des-clients`,
    type: "website",
  },
};

export default function TrouverDesClientsPage() {
  return (
    <main>
      <JsonLd data={getClientsServiceSchema()} />
      <JsonLd data={getClientsFaqSchema()} />

      {/* ===================== HERO ===================== */}
      <section className="px-4 py-20 sm:py-28">
        <div className="max-w-3xl mx-auto text-center">
          <span className="inline-block text-sm font-semibold text-[var(--accent)] mb-4 tracking-wide uppercase">
            Pour les professionnels des services
          </span>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
            Trouvez des clients près de chez vous.
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed mb-4 max-w-2xl mx-auto">
            Ménage, jardinage, garde d&apos;enfants, soutien scolaire, aide aux
            seniors… Recevez les demandes des particuliers de votre zone et payez{" "}
            <strong className="text-[var(--text-primary)]">9,90 € seulement</strong>{" "}
            pour débloquer un client qui vous intéresse.
          </p>
          <p className="text-base text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto">
            Pas d&apos;abonnement. Pas de commission sur vos prestations.{" "}
            <strong>Le seul service qui affiche son prix.</strong>
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              href="/pro/creer-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Créer ma fiche gratuitement
            </Link>
            <Link
              href="/pro/retrouver-fiche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              J&apos;ai déjà un SIRET
            </Link>
          </div>
          <p className="mt-5 text-sm text-[var(--text-tertiary)]">
            Inscription gratuite · Auto-entrepreneur ou entreprise
          </p>
        </div>
      </section>

      <ClientsSections />
    </main>
  );
}

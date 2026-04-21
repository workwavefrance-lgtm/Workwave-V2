import type { Metadata } from "next";
import Link from "next/link";
import JsonLd from "@/components/seo/JsonLd";
import { getOrganizationSchema } from "@/lib/utils/schema";
import { BASE_URL } from "@/lib/constants";

export const metadata: Metadata = {
  title: "À propos — pourquoi Workwave existe",
  description:
    "Workwave est né d'un constat simple : les artisans paient 500 à 600 € par mois pour 2 ou 3 leads qui ne répondent même pas. On a créé une alternative claire, locale et accessible.",
  alternates: { canonical: `${BASE_URL}/a-propos` },
  openGraph: {
    type: "website",
    locale: "fr_FR",
    siteName: "Workwave",
    title: "À propos — pourquoi Workwave existe",
    description:
      "Workwave est né d'un constat simple : les artisans paient 500 à 600 € par mois pour 2 ou 3 leads qui ne répondent même pas. On a créé une alternative claire, locale et accessible.",
    url: `${BASE_URL}/a-propos`,
  },
};

export default function AProposPage() {
  return (
    <main>
      <JsonLd data={getOrganizationSchema(BASE_URL)} />

      {/* Hero */}
      <section className="px-4 pt-20 pb-16 sm:pt-28 sm:pb-20 lg:pt-32 lg:pb-24">
        <div className="max-w-3xl mx-auto">
          <p className="text-sm font-medium text-[var(--accent)] mb-6 tracking-wide uppercase">
            À propos
          </p>
          <h1 className="text-4xl sm:text-5xl lg:text-6xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-8">
            Les artisans méritent mieux que{" "}
            <span className="text-[var(--accent)]">600 € par mois</span> pour
            quelques leads fantômes.
          </h1>
          <p className="text-lg sm:text-xl text-[var(--text-secondary)] leading-relaxed">
            Workwave a été créé pour corriger ce problème. Une plateforme
            claire, simple, locale, à un coût dérisoire.
          </p>
        </div>
      </section>

      {/* Le problème */}
      <section className="px-4 py-16 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Le constat
          </h2>
          <div className="space-y-5 text-[var(--text-secondary)] leading-relaxed text-base sm:text-lg">
            <p>
              Les pros en ont marre. Marre de payer 500, 600, parfois 800 €
              par mois à des plateformes nationales pour recevoir 2 ou 3 leads
              dans le mois. Et quand ces leads arrivent, la moitié ne répond
              même pas au téléphone.
            </p>
            <p>
              Pendant ce temps, Habitatpresto, PagesJaunes et les autres
              continuent d&apos;encaisser, sans s&apos;assurer que les artisans
              en aient pour leur argent. La logique est inversée : ce sont les
              pros qui prennent tous les risques, et les plateformes qui
              raflent la marge.
            </p>
            <p className="text-[var(--text-primary)] font-medium">
              Workwave a été conçu pour offrir le même service, mais à un coût
              dérisoire et avec une utilisation simple.
            </p>
          </div>
        </div>
      </section>

      {/* La solution */}
      <section className="px-4 py-16 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-10">
            Notre approche
          </h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8">
              <p className="text-sm font-semibold text-[var(--accent)] mb-2">
                Un tarif honnête
              </p>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                39 € par mois, sans engagement
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                Pas de commission cachée. Pas d&apos;engagement annuel. Pas de
                vendeur qui vous appelle pour vous faire signer. Vous arrêtez
                quand vous voulez, en un clic.
              </p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8">
              <p className="text-sm font-semibold text-[var(--accent)] mb-2">
                Un produit simple
              </p>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                Pas de paliers, pas de jargon
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                Une fiche, un dashboard, des leads. C&apos;est tout. Vous
                pouvez tout faire depuis votre téléphone, en deux clics.
              </p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8">
              <p className="text-sm font-semibold text-[var(--accent)] mb-2">
                Un ancrage local
              </p>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                Basé à Craon, dans la Vienne
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                Workwave est une SAS française, sans capital étranger. On
                connaît la Vienne, on y vit, on travaille avec les pros qui y
                bossent au quotidien.
              </p>
            </div>
            <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8">
              <p className="text-sm font-semibold text-[var(--accent)] mb-2">
                Le bon sens d&apos;abord
              </p>
              <h3 className="text-xl font-bold text-[var(--text-primary)] mb-3">
                Une fiche gratuite pour tous les pros
              </h3>
              <p className="text-[var(--text-secondary)] leading-relaxed text-sm">
                Tous les artisans de la Vienne sont déjà référencés
                gratuitement. Vous reclamez la vôtre en 3 minutes pour la
                personnaliser, sans rien à payer.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* Le fondateur */}
      <section className="px-4 py-16 border-t border-[var(--border-color)] bg-[var(--bg-secondary)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Qui est derrière Workwave
          </h2>
          <div className="space-y-5 text-[var(--text-secondary)] leading-relaxed text-base sm:text-lg">
            <p>
              Workwave est porté par{" "}
              <strong className="text-[var(--text-primary)]">
                Willy Gauvrit
              </strong>
              , entrepreneur basé à Craon (86110), à côté de Poitiers. Pas une
              équipe de 50 commerciaux, pas une boîte américaine, pas un fonds
              d&apos;investissement.
            </p>
            <p>
              Juste une personne qui en a eu marre de voir les artisans de la
              Vienne se faire facturer des fortunes pour des plateformes qui
              ne livrent pas. L&apos;idée : utiliser ce que la technologie
              permet aujourd&apos;hui (automatisation, IA, hébergement low-cost)
              pour proposer un service au prix réel — pas au prix marketing.
            </p>
            <p>
              Une question, un retour, une critique ? Écrivez à{" "}
              <a
                href="mailto:contact@workwave.fr"
                className="text-[var(--accent)] hover:underline font-medium"
              >
                contact@workwave.fr
              </a>
              . Vous tomberez sur Willy directement.
            </p>
          </div>
        </div>
      </section>

      {/* CTA final */}
      <section className="px-4 py-20 sm:py-24 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-3xl sm:text-4xl font-bold tracking-tight text-[var(--text-primary)] mb-6">
            Prêt à essayer autre chose ?
          </h2>
          <p className="text-lg text-[var(--text-secondary)] mb-10 max-w-xl mx-auto leading-relaxed">
            Découvrez l&apos;espace pro, ou parcourez l&apos;annuaire pour
            voir si vous y êtes déjà.
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/pro"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Voir l&apos;espace pro
            </Link>
            <Link
              href="/recherche"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-transparent border border-[var(--border-color)] text-[var(--text-primary)] font-semibold transition-all duration-250 hover:border-[var(--accent)] hover:text-[var(--accent)]"
            >
              Parcourir l&apos;annuaire
            </Link>
          </div>
        </div>
      </section>
    </main>
  );
}

export const revalidate = 3600; // 1h

import Link from "next/link";
import SearchForm from "@/components/search/SearchForm";
import JsonLd from "@/components/seo/JsonLd";
// Imports publics (sans cookies) pour permettre le caching ISR de la home.
// Ne PAS remplacer par `lib/queries/categories` ou `lib/queries/cities` :
// ces modules touchent aux cookies (cf. lib/supabase/server.ts) et basculent
// la page en dynamic => cache CDN inactif (TTFB 0.4s a chaque visite).
import { getCategoriesByVerticalPublic } from "@/lib/queries/home-public";
import { getTopCitiesPublic, getAllDepartmentsPublic } from "@/lib/queries/home-public";
import {
  getWebSiteSchema,
  getOrganizationSchema,
  getFaqSchema,
} from "@/lib/utils/schema";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { BASE_URL } from "@/lib/constants";

// FAQ affichee en bas de la home (section visible) + injectee en JSON-LD
// FAQPage. Contenu strictement factuel : tout est verifiable dans le
// projet (cf. lecon CLAUDE.md sur les inventions a bannir du contenu).
const homeFaqs = [
  {
    question: "Qu'est-ce que Workwave ?",
    answer:
      "Workwave est un annuaire en ligne de professionnels du BTP, des services à domicile et de l'aide à la personne, couvrant les 12 départements de la Nouvelle-Aquitaine. La plateforme référence plus de 226 000 professionnels dans 4 293 communes et met en relation les particuliers avec des artisans locaux.",
  },
  {
    question: "Workwave est-il gratuit pour les particuliers ?",
    answer:
      "Oui. La recherche d'un professionnel, la consultation des fiches et le dépôt d'un projet de travaux sont entièrement gratuits pour les particuliers. Aucune création de compte n'est nécessaire pour rechercher un artisan ou déposer une demande.",
  },
  {
    question: "Comment trouver un artisan sur Workwave ?",
    answer:
      "Indiquez un métier et une ville dans la barre de recherche. Workwave affiche les professionnels référencés dans la zone choisie, avec leurs coordonnées, leur description et leurs informations légales comme le numéro SIRET et les certifications déclarées.",
  },
  {
    question: "Comment déposer un projet de travaux ?",
    answer:
      "Remplissez le formulaire de dépôt de projet en décrivant votre besoin. La demande est analysée puis transmise automatiquement à un maximum de 3 professionnels qualifiés dans la catégorie et la zone concernées. Ces professionnels recontactent ensuite directement le particulier.",
  },
  {
    question: "D'où proviennent les fiches des professionnels ?",
    answer:
      "Les fiches de base sont créées à partir de données publiques, principalement le registre SIRENE de l'INSEE. Chaque professionnel peut réclamer gratuitement sa fiche pour la compléter, ajouter des photos, corriger ses informations ou en demander la suppression.",
  },
  {
    question: "Combien coûte Workwave pour un professionnel ?",
    answer:
      "Le référencement de base est gratuit à vie. Un abonnement optionnel à 39 € par mois, ou 390 € par an, permet de recevoir automatiquement les demandes de projets des particuliers. Un essai gratuit de 14 jours sans carte bancaire est proposé.",
  },
  {
    question: "Quelle zone géographique couvre Workwave ?",
    answer:
      "Workwave couvre l'ensemble de la région Nouvelle-Aquitaine, soit 12 départements : Charente, Charente-Maritime, Corrèze, Creuse, Dordogne, Gironde, Landes, Lot-et-Garonne, Pyrénées-Atlantiques, Deux-Sèvres, Vienne et Haute-Vienne.",
  },
];

export default async function Home() {
  const [btp, domicile, personne, topCities, departments] = await Promise.all([
    getCategoriesByVerticalPublic("btp"),
    getCategoriesByVerticalPublic("domicile"),
    getCategoriesByVerticalPublic("personne"),
    getTopCitiesPublic(30),
    getAllDepartmentsPublic(),
  ]);

  const allCategories = [...btp, ...domicile, ...personne].sort((a, b) =>
    a.name.localeCompare(b.name)
  );

  // Rotation des 12 departements pour repartir le link juice de la home
  // sur tous les departements de Nouvelle-Aquitaine au lieu de tout pousser
  // vers vienne-86. Offset different par vertical pour varier l'ordre.
  // Cf. lecon CLAUDE.md (audit 2026-05-03).
  const deptSlugs = departments.map((d) => generateDepartmentSlug(d));
  const linkFor = (catSlug: string, idx: number, offset: number): string => {
    if (deptSlugs.length === 0) return `/${catSlug}`;
    const dept = deptSlugs[(idx + offset) % deptSlugs.length];
    return `/${catSlug}/${dept}`;
  };

  const verticals = [
    { title: "BTP et artisanat", categories: btp, offset: 0 },
    { title: "Services a domicile", categories: domicile, offset: 4 },
    { title: "Aide a la personne", categories: personne, offset: 8 },
  ];

  return (
    <main>
      <JsonLd data={getWebSiteSchema(BASE_URL)} />
      <JsonLd data={getOrganizationSchema(BASE_URL)} />

      {/* Hero */}
      <section className="py-24 sm:py-32 lg:py-40 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h1 className="text-4xl sm:text-5xl lg:text-7xl font-extrabold tracking-tight text-[var(--text-primary)] leading-[1.1] mb-6">
            Tout le savoir-faire local,
            <br />
            enfin accessible
            {/* Point coral anime en pulse subtil. Pas d'opacity:0 a l'init
                = le point est rendu serveur-side, LCP intact. */}
            <span className="text-[var(--accent)] animate-accent-pulse">.</span>
          </h1>
          {/* Slide-in du sous-titre, leger delai pour qu'il arrive apres
              que le H1 soit visible. Le sous-titre n'est pas le LCP. */}
          <p
            className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-in-up"
            style={{ animationDelay: "120ms" }}
          >
            Des centaines de milliers de professionnels référencés en
            Nouvelle-Aquitaine, à portée d&apos;un clic.
          </p>
          <SearchForm categories={allCategories} />
          <p className="mt-6 text-sm text-[var(--text-tertiary)]">
            Plus de{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              226 000
            </span>{" "}
            professionnels référencés dans{" "}
            <span className="font-semibold text-[var(--text-primary)]">
              4 293
            </span>{" "}
            communes de Nouvelle-Aquitaine
          </p>
        </div>
      </section>

      {/* Categories par vertical */}
      {verticals.map((vertical) => (
        <section
          key={vertical.title}
          className="py-16 px-4 border-t border-[var(--border-color)]"
        >
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
              {vertical.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {vertical.categories.map((cat, i) => (
                <Link
                  key={cat.id}
                  href={linkFor(cat.slug, i, vertical.offset)}
                  className="group bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 text-center transition-all duration-250 hover:-translate-y-1 hover:shadow-md hover:border-[var(--accent)]"
                >
                  <span className="text-sm font-medium text-[var(--text-primary)] group-hover:text-[var(--accent)] transition-colors duration-250">
                    {cat.name}
                  </span>
                </Link>
              ))}
            </div>
          </div>
        </section>
      ))}

      {/* Top villes */}
      <section className="py-16 px-4 bg-[var(--bg-secondary)] border-t border-[var(--border-color)]">
        <div className="max-w-6xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
            Principales villes de Nouvelle-Aquitaine
          </h2>
          <div className="flex flex-wrap gap-3">
            {topCities.slice(0, 20).map((city) => (
              <Link
                key={city.id}
                href={`/plombier/${city.slug}`}
                className="px-4 py-2 bg-[var(--card-bg)] border border-[var(--card-border)] rounded-full text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] hover:border-[var(--accent)] transition-all duration-250"
              >
                {city.name}
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* FAQ — section visible + JSON-LD FAQPage (cf. getFaqSchema).
          Enrichit aussi le volume de contenu de la home (signal SEO/GEO). */}
      <JsonLd data={getFaqSchema(homeFaqs)} />
      <section className="py-16 px-4 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
            Questions fréquentes
          </h2>
          <div className="space-y-0 divide-y divide-[var(--border-color)]">
            {homeFaqs.map((faq) => (
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
    </main>
  );
}

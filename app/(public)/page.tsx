export const revalidate = 3600; // 1h

import Link from "next/link";
import { Fragment } from "react";
import ProCtaSection from "@/components/home/ProCtaSection";
import SearchForm from "@/components/search/SearchForm";
import CountUp from "@/components/ui/CountUp";
import RecentProjectsSection from "@/components/home/RecentProjectsSection";
import JsonLd from "@/components/seo/JsonLd";
// Imports publics (sans cookies) pour permettre le caching ISR de la home.
// Ne PAS remplacer par `lib/queries/categories` ou `lib/queries/cities` :
// ces modules touchent aux cookies (cf. lib/supabase/server.ts) et basculent
// la page en dynamic => cache CDN inactif (TTFB 0.4s a chaque visite).
import { getCategoriesByVerticalPublic } from "@/lib/queries/home-public";
import { getTopCitiesPublic, getAllDepartmentsPublic } from "@/lib/queries/home-public";
import { getRecentProjectsForHome } from "@/lib/queries/recent-projects";
import {
  getWebSiteSchema,
  getOrganizationSchema,
  getFaqSchema,
} from "@/lib/utils/schema";
import { generateDepartmentSlug } from "@/lib/utils/slugs";
import { BASE_URL } from "@/lib/constants";
import type { Metadata } from "next";

// Canonical explicite de la home (manquait : Next n'émet la balise canonical
// que si alternates.canonical est défini). Title/description/OG restent hérités
// du root layout. Résout le trou détecté en QA SEO du 30/05.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// FAQ affichee en bas de la home (section visible) + injectee en JSON-LD
// FAQPage. Contenu strictement factuel : tout est verifiable dans le
// projet (cf. lecon CLAUDE.md sur les inventions a bannir du contenu).
const homeFaqs = [
  {
    question: "Qu'est-ce que Workwave ?",
    answer:
      "Workwave est un annuaire en ligne de professionnels du BTP, des services à domicile et de l'aide à la personne, couvrant toute la France et la Belgique francophone. La plateforme référence plus de 2,5 millions de professionnels dans 35 163 communes et met en relation les particuliers avec des artisans locaux.",
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
      "Remplissez le formulaire de dépôt de projet en décrivant votre besoin. La demande est analysée puis transmise automatiquement aux professionnels qualifiés de la catégorie et de la zone concernées. Ces professionnels recontactent ensuite directement le particulier.",
  },
  {
    question: "D'où proviennent les fiches des professionnels ?",
    answer:
      "Les fiches de base sont créées à partir de données publiques, principalement le registre SIRENE de l'INSEE. Chaque professionnel peut réclamer gratuitement sa fiche pour la compléter, ajouter des photos, corriger ses informations ou en demander la suppression.",
  },
  {
    question: "Combien coûte Workwave pour un professionnel ?",
    answer:
      "Le référencement est gratuit à vie et les professionnels reçoivent gratuitement par email tous les projets de leur zone. Ils paient uniquement 9,90 € pour débloquer les coordonnées d'un client qui les intéresse : un paiement unique par lead, sans abonnement, sans commission et sans carte bancaire à l'inscription.",
  },
  {
    question: "Quelle zone géographique couvre Workwave ?",
    answer:
      "Workwave couvre toute la France et la Belgique francophone : les 101 départements français (métropole et outre-mer) et les 6 provinces belges (Wallonie et Bruxelles), soit plus de 35 000 communes référencées.",
  },
];

export default async function Home() {
  const [btp, domicile, personne, topCities, departments, recentProjects] =
    await Promise.all([
      getCategoriesByVerticalPublic("btp"),
      getCategoriesByVerticalPublic("domicile"),
      getCategoriesByVerticalPublic("personne"),
      getTopCitiesPublic(30),
      getAllDepartmentsPublic(),
      getRecentProjectsForHome(10),
    ]);

  // Catégories pour le sélecteur de recherche, avec leur vertical (le
  // SearchForm les regroupe par univers + recherche au lieu d'une liste à plat).
  const allCategories = [
    ...btp.map((c) => ({ slug: c.slug, name: c.name, vertical: "btp" })),
    ...domicile.map((c) => ({ slug: c.slug, name: c.name, vertical: "domicile" })),
    ...personne.map((c) => ({ slug: c.slug, name: c.name, vertical: "personne" })),
  ];

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
            Trouvez le bon artisan
            <br />
            près de chez vous
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
            Tout le savoir-faire local, enfin accessible. Décrivez votre projet
            et recevez des devis gratuits d&apos;artisans près de chez vous.
          </p>
          <SearchForm categories={allCategories} />
          {/* Réassurance QUALITÉ — uniquement des signaux VRAIS (pub honnête + RGPD) :
              SIRET vérifiable au registre officiel (annuaire-entreprises.data.gouv.fr),
              données publiques SIRENE, gratuité réelle. PAS de "décennale validée"
              (auto-déclaré, non vérifié) ni d'avis inventés (0 avis natif à ce jour). */}
          <ul className="mt-5 flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm text-[var(--text-secondary)]">
            {[
              "SIRET vérifié au registre officiel",
              "Données publiques officielles",
              "100 % gratuit, sans engagement",
            ].map((label) => (
              <li key={label} className="inline-flex items-center gap-1.5">
                <svg
                  viewBox="0 0 24 24"
                  fill="none"
                  className="w-4 h-4 text-[var(--accent)] shrink-0"
                  aria-hidden="true"
                >
                  <path
                    d="M20 6 9 17l-5-5"
                    stroke="currentColor"
                    strokeWidth="2.5"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                {label}
              </li>
            ))}
          </ul>
          {/* Bande de stats : preuve de couverture immédiate (chiffres coral animés). */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-x-8 gap-y-8 sm:gap-x-14">
            <div className="text-center">
              <CountUp
                end={2560292}
                className="block text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-[var(--accent)] tabular-nums"
              />
              <span className="mt-2 block text-sm sm:text-base text-[var(--text-secondary)]">
                professionnels référencés
              </span>
            </div>
            <div
              className="hidden sm:block h-14 w-px bg-[var(--card-border)]"
              aria-hidden="true"
            />
            <div className="text-center">
              <CountUp
                end={35163}
                className="block text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-[var(--accent)] tabular-nums"
              />
              <span className="mt-2 block text-sm sm:text-base text-[var(--text-secondary)]">
                communes couvertes
              </span>
            </div>
            <div
              className="hidden sm:block h-14 w-px bg-[var(--card-border)]"
              aria-hidden="true"
            />
            <div className="text-center">
              <CountUp
                end={107}
                className="block text-4xl sm:text-6xl font-extrabold tracking-tight leading-none text-[var(--accent)] tabular-nums"
              />
              <span className="mt-2 block text-sm sm:text-base text-[var(--text-secondary)]">
                départements et provinces
              </span>
            </div>
          </div>
          {/* CTA principal du hero : déposer un projet (gratuit), juste sous le
              bandeau de stats — emplacement validé par Willy (le "rond"). */}
          <div className="mt-12">
            <Link
              href="/deposer-projet"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white text-base font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Déposer mon projet — gratuit
            </Link>
          </div>
        </div>
      </section>

      {/* Projets déposés récemment — double CTA (particulier dépose / pro reçoit).
          Modulable : 1→10 vrais projets anonymisés, se masque si 0. */}
      <RecentProjectsSection projects={recentProjects} />

      {/* Categories par vertical — CTA pro inséré juste après le BTP (demande
          Willy 14/07 : visibilité max pour le recrutement de pros). */}
      {verticals.map((vertical) => (
        <Fragment key={vertical.title}>
        <section className="py-16 px-4 border-t border-[var(--border-color)]">
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
        {vertical.title === "BTP et artisanat" && <ProCtaSection />}
        </Fragment>
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

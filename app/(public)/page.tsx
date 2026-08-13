export const revalidate = 3600; // 1h

import Link from "next/link";
import Image from "next/image";
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
          {/* La PREUVE avant la promesse (11/08/2026).
              Avant : "Trouvez le bon artisan près de chez vous." — une phrase
              que TOUS les concurrents ecrivent. Le seul chiffre qui nous
              distingue (2,5 M de fiches contre 58 216 chez Travaux.com, soit
              43x) etait relegue sous la barre de recherche, dans un compteur
              anime que la moitie des visiteurs ne voit jamais.
              Il passe donc en premier mot du H1.
              La 2e ligne garde "celui qu'il vous faut, pres de chez vous" :
              2,5 millions peut sonner "base de donnees" plutot que "on
              s'occupe de vous" — cette ligne ramene le chiffre a une personne.
              Mots-cles de referencement conserves : "artisan" et
              "pres de chez vous" (intention locale). */}
          {/* 13/08 (decision Willy) : la PROMESSE s'affiche en premier, le
              chiffre en appui dessous, tailles rapprochees (60px vs 44px).
              L'inversion est PUREMENT VISUELLE (flex + order) : l'ordre du DOM
              ne bouge pas, Google lit toujours "2 560 292 artisans références.
              Trouvez gratuitement un artisan, pres de chez vous." Le H1 grille
              donc le meme contenu qu'avant, seule la 2e ligne a change de
              formulation ("celui qu'il vous faut" -> "un artisan"). */}
          <h1 className="flex flex-col tracking-tight leading-[1.1] mb-6">
            <span className="order-2 mt-3 text-2xl sm:text-3xl lg:text-[44px] font-extrabold text-[var(--text-secondary)]">
              2 560 292 artisans référencés
            </span>
            <span className="order-1 text-3xl sm:text-4xl lg:text-6xl font-extrabold text-[var(--text-primary)]">
              Trouvez gratuitement un artisan, près de chez vous
              {/* Point coral anime en pulse subtil. Pas d'opacity:0 a l'init
                  = le point est rendu serveur-side, LCP intact. */}
              <span className="text-[var(--accent)] animate-accent-pulse">.</span>
            </span>
          </h1>
          {/* Slide-in du sous-titre, leger delai pour qu'il arrive apres
              que le H1 soit visible. Le sous-titre n'est pas le LCP. */}
          <p
            className="text-lg sm:text-xl text-[var(--text-secondary)] mb-10 max-w-2xl mx-auto leading-relaxed animate-slide-in-up"
            style={{ animationDelay: "120ms" }}
          >
            Décrivez votre projet, des artisans près de chez vous vous
            recontacteront gratuitement.
          </p>
          {/* La barre du HAUT mene au DEPOT, pas au listing (decision Willy,
              11/08/2026) : on veut faire entrer les gens dans l'entonnoir, pas
              les envoyer consulter des fiches. Metier + ville sont repris tels
              quels, et le formulaire saute directement a "decrivez votre
              projet". Celle qui mene aux fiches est plus bas dans la page. */}
          <SearchForm categories={allCategories} destination="depot" />
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
          {/* Bande de compteurs SUPPRIMEE le 11/08/2026.
              Le chiffre 2 560 292 est passe dans le H1 le meme jour : le
              repeter 400 px plus bas, en enorme et en coral, avec le meme
              libelle "professionnels referencés", faisait lire deux fois la
              meme information et repoussait le bouton d'action sous la ligne
              de flottaison. Les deux autres chiffres (35 163 communes,
              107 departements) restent visibles sur /departements et /pro. */}
          {/* CTA principal du hero : déposer un projet (gratuit), juste sous le
              bandeau de stats — emplacement validé par Willy (le "rond"). */}
          <div className="mt-12">
            <Link
              href="/deposer-projet"
              className="inline-flex items-center justify-center px-8 py-4 rounded-full bg-[var(--accent)] text-white text-base font-semibold transition-all duration-250 hover:bg-[var(--accent-hover)] hover:scale-[1.02]"
            >
              Déposer mon projet (gratuit)
            </Link>
          </div>
        </div>
      </section>

      {/* Photo — le site est entierement typographique et sombre : aucun visage,
          aucun chantier. Un particulier qui cherche un artisan doit voir du
          travail reel. Photo fournie par Willy le 11/08/2026, convertie de
          4,8 Mo PNG a 139 Ko WebP / 106 Ko AVIF (-97 %).
          Cadre : arrondi 3xl + bordure discrete, coherent avec les cards du
          site. Pas de texte en surimpression : la photo parle seule. */}
      <section className="px-4 pb-4">
        <div className="max-w-6xl mx-auto">
          <div className="relative overflow-hidden rounded-3xl border border-[var(--card-border)]">
            <Image
              src="/photos/macon-mur-brique.webp"
              alt="Maçon montant un mur en briques sur un chantier"
              width={1600}
              height={1068}
              priority={false}
              sizes="(max-width: 1152px) 100vw, 1152px"
              className="w-full h-auto object-cover"
            />
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

      {/* Barre de recherche "consultation", APRES les trois univers de metiers.
          Celle du haut fait entrer dans l'entonnoir ; celle-ci est pour qui
          veut d'abord regarder les fiches avant de se decider. Deux intentions
          differentes, deux emplacements — au lieu d'une seule barre qui doit
          servir les deux et n'en sert bien aucune. */}
      <section className="py-16 px-4 border-t border-[var(--border-color)]">
        <div className="max-w-3xl mx-auto text-center">
          <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
            Vous préférez regarder d&apos;abord ?
          </h2>
          <p className="text-[var(--text-secondary)] mb-8">
            Consultez les professionnels référencés près de chez vous.
          </p>
          <SearchForm categories={allCategories} destination="listing" />
          <div className="mt-12 overflow-hidden rounded-3xl border border-[var(--card-border)]">
            <Image
              src="/photos/macon-chantier.webp"
              alt="Artisan maçon au travail sur un chantier de construction"
              width={1600}
              height={1056}
              sizes="(max-width: 768px) 100vw, 768px"
              className="w-full h-auto object-cover"
            />
          </div>
        </div>
      </section>

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

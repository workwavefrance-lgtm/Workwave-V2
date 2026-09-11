export const revalidate = 3600; // 1h

import Link from "next/link";
import Image from "next/image";
import { Fragment } from "react";
import ProCtaSection from "@/components/home/ProCtaSection";
import SearchForm from "@/components/search/SearchForm";
import DepotSection from "@/components/home/DepotSection";
import RecentProjectsSection from "@/components/home/RecentProjectsSection";
import MisesAJourSection from "@/components/home/MisesAJourSection";
import { getFichesFraiches } from "@/lib/queries/fraicheur";
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
import { DEPT_PAR_CATEGORIE } from "@/lib/data/home-links";
import { BASE_URL } from "@/lib/constants";
import type { Metadata } from "next";

// Canonical explicite de la home (manquait : Next n'émet la balise canonical
// que si alternates.canonical est défini). Title/description/OG restent hérités
// du root layout. Résout le trou détecté en QA SEO du 30/05.
export const metadata: Metadata = {
  alternates: { canonical: "/" },
};

// Compteur public de la home : fiches OUVERTES uniquement (etat_admin IS NULL
// OR etat_admin <> 'F', regle FILTRE_OUVERTS de lib/queries/pros.ts).
// Mesure le 03/09/2026 en SQL par Willy, fiches ouvertes : 1 233 038, sur
// 2 439 976 fiches actives dont 1 206 938 etablissements fermes d'apres les
// fichiers Stock Sirene. L'ancien chiffre (2 560 292) comptait les fermes.
// A re-mesurer apres chaque scrape ou classement (dette : compteur en dur,
// lecon du 08/06).
// Fiches OUVERTES en base, mesurees le 05/09/2026 apres le rattrapage Sirene
// (1 233 039 avant). Chiffre ecrit en dur : a remettre a jour dans la
// procedure d'apres-scrape (avec la vue des listings et les barometres), cf.
// lecon L65. Le 11/09/2026 l'accueil affichait encore l'ancien.
const PROS_OUVERTS = "1 523 855";

// FAQ affichee en bas de la home (section visible) + injectee en JSON-LD
// FAQPage. Contenu strictement factuel : tout est verifiable dans le
// projet (cf. lecon CLAUDE.md sur les inventions a bannir du contenu).
const homeFaqs = [
  {
    question: "Qu'est-ce que Workwave ?",
    answer:
      // « plus de 1,2 million » = PROS_OUVERTS arrondi (1 233 038 le 03/09/2026).
      "Workwave est un annuaire en ligne de professionnels du BTP, des services à domicile et de l'aide à la personne, couvrant toute la France et la Belgique francophone. La plateforme référence plus de 1,2 million de professionnels dans 35 163 communes et met en relation les particuliers avec des artisans locaux.",
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
  // `departments` n'est plus lu depuis que les liens de l'accueil viennent de
  // lib/data/home-links.ts. La lecture est conservee pour ne pas changer
  // l'ordre du Promise.all ci-dessous.
  const [btp, domicile, personne, topCities, , recentProjects, fichesFraiches] =
    await Promise.all([
      getCategoriesByVerticalPublic("btp"),
      getCategoriesByVerticalPublic("domicile"),
      getCategoriesByVerticalPublic("personne"),
      getTopCitiesPublic(30),
      getAllDepartmentsPublic(),
      getRecentProjectsForHome(10),
      // 24 fiches modifiees ces 7 jours, pour l'entonnoir de decouverte. En
      // cas d'echec de cette seule lecture, la home ne doit pas tomber : le
      // bloc se masque simplement.
      getFichesFraiches(7, 24).catch(() => []),
    ]);

  // Catégories pour le sélecteur de recherche, avec leur vertical (le
  // SearchForm les regroupe par univers + recherche au lieu d'une liste à plat).
  const allCategories = [
    ...btp.map((c) => ({ slug: c.slug, name: c.name, vertical: "btp" })),
    ...domicile.map((c) => ({ slug: c.slug, name: c.name, vertical: "domicile" })),
    ...personne.map((c) => ({ slug: c.slug, name: c.name, vertical: "personne" })),
  ];

  // Le departement mis en avant pour chaque metier vient de
  // lib/data/home-links.ts, qui ne retient qu'un departement ayant REELLEMENT
  // des professionnels ouverts.
  //
  // Avant le 06/09/2026, il etait choisi par simple ROTATION, sans verifier
  // qu'il y avait quelqu'un dedans. Mesure de ce jour : l'accueil renvoyait
  // vers /montage-meubles/calvados-14, /coach-sportif/bouches-du-rhone-13 et
  // /cours-musique/cantal-15, TROIS PAGES VIDES. Treize categories du site
  // n'ont aucun professionnel : notre page la plus visitee par Google
  // l'envoyait donc dans des impasses, au moment precis ou il juge la qualite
  // du site.
  //
  // Quand une categorie n'a de professionnels nulle part (16 sur 57), le lien
  // pointe vers sa page RACINE, qui utilise la proximite et ne promet pas un
  // departement en particulier. Aucune page n'est retiree ni mise en noindex :
  // on cesse simplement de mettre en avant un couple metier x departement vide.
  //
  // A regenerer apres tout scrape ou reclassement :
  //   npx tsx scripts/build-home-links.ts
  const linkFor = (catSlug: string): string => {
    const dept = DEPT_PAR_CATEGORIE[catSlug];
    return dept ? `/${catSlug}/${dept}` : `/${catSlug}`;
  };

  const verticals = [
    { title: "BTP et artisanat", categories: btp, offset: 0 },
    { title: "Services à domicile", categories: domicile, offset: 4 },
    { title: "Aide à la personne", categories: personne, offset: 8 },
  ];

  return (
    <main>
      <JsonLd data={getWebSiteSchema(BASE_URL)} />
      <JsonLd data={getOrganizationSchema(BASE_URL)} />

      {/* Hero */}
      {/* HERO EN DEUX COLONNES (13/08, maquette Willy).
          Texte + bloc d'action a GAUCHE, photo de chantier a DROITE, fondue
          dans le fond par un degrade. En dessous de lg, la photo passe en
          fond tres attenue derriere le texte : sur un telephone, une colonne
          image volerait la moitie de l'ecran a la barre de recherche. */}
      <section className="relative overflow-hidden -mt-[72px] pt-[calc(72px+3rem)] pb-16 sm:pb-20 lg:pb-24 px-4">
        {/* MOSAIQUE DE METIERS, colonne droite (13/08, maquette Willy).
            Elle remonte DERRIERE le header (marge negative de 72 px, la
            hauteur du header) : celui-ci est transparent tant qu'on n'a pas
            defile, donc l'image occupe tout le haut de l'ecran.

            Le degrade `mask-image` efface le bord gauche ET le bas : l'image
            se FOND dans le blanc au lieu d'etre une photo collee avec un bord
            net. C'est ce qui fait tenir l'ensemble.

            Sur mobile elle passe en fond tres attenue derriere le texte : une
            colonne image volerait la moitie de l'ecran a la barre de recherche.

            `priority` : elle est dans le premier ecran, candidate LCP. */}
        {/* 16/08 : la photo recule de 58 % a 46 % pour rendre sa place au
            message. Elle reste entiere et lisible (5 metiers visibles), elle
            n'occupe simplement plus la moitie de l'ecran. `sizes` suit la
            largeur reelle, sinon le navigateur telecharge une image
            surdimensionnee pour rien. */}
        <div className="pointer-events-none absolute inset-y-0 right-0 w-full xl:w-[46%] opacity-[0.12] xl:opacity-100">
          <Image
            src="/photos/hero-metiers.webp"
            alt="Artisans au travail : charpentier, électricien, plombier, couvreur, peintre et menuisier"
            aria-hidden="true"
            fill
            priority
            sizes="(max-width: 1280px) 100vw, 46vw"
            className="object-cover object-center [mask-image:linear-gradient(to_right,transparent,black_30%),linear-gradient(to_bottom,black_78%,transparent)] [mask-composite:intersect] [-webkit-mask-composite:source-in]"
          />
        </div>
        {/* Le conteneur s'elargit avec l'ecran au lieu de rester bloque a
            896 px. Sans ces paliers, un ecran 2560 affichait 65 % de vide
            lateral (mesure du 13/08). Le bloc d'action, lui, reste borne a
            max-w-3xl : une barre de recherche de 1200 px de large serait
            absurde a viser a la souris. */}
        {/* 16/08 (choix Willy sur 4 largeurs capturees du site) : la colonne
            passe de 46 % a 60 %. MESURE qui a declenche le changement : le
            cadre d'action a un plafond de 768 px mais n'en faisait que 721,
            parce que la COLONNE etait plus etroite que le cadre qu'elle
            contient. Le cadre n'atteignait donc jamais sa taille prevue.
            Effet visible : le titre passe de 3 lignes a 2, donc la phrase se
            lit d'un seul coup d'oeil au lieu d'etre coupee sur "vous." seul. */}
        <div className="relative w-[min(92vw,1440px)] mx-auto xl:mx-0 xl:ml-[max(2rem,calc((100vw-1440px)/2))] xl:max-w-[60%] text-center xl:text-left">
          {/* La PREUVE avant la promesse (11/08/2026).
              Avant : "Trouvez le bon artisan près de chez vous." : une phrase
              que TOUS les concurrents ecrivent. Le seul chiffre qui nous
              distingue (2,5 M de fiches contre 58 216 chez Travaux.com, soit
              43x) etait relegue sous la barre de recherche, dans un compteur
              anime que la moitie des visiteurs ne voit jamais.
              Il passe donc en premier mot du H1.
              La 2e ligne garde "celui qu'il vous faut, pres de chez vous" :
              2,5 millions peut sonner "base de donnees" plutot que "on
              s'occupe de vous", cette ligne ramene le chiffre a une personne.
              Mots-cles de referencement conserves : "artisan" et
              "pres de chez vous" (intention locale). */}
          {/* 13/08 (decision Willy) : la PROMESSE s'affiche en premier, le
              chiffre en appui dessous, tailles rapprochees (60px vs 44px).
              L'inversion est PUREMENT VISUELLE (flex + order) : l'ordre du DOM
              ne bouge pas, Google lit toujours "2 560 292 artisans références.
              Trouvez gratuitement un artisan, pres de chez vous." Le H1 grille
              donc le meme contenu qu'avant, seule la 2e ligne a change de
              formulation ("celui qu'il vous faut" -> "un artisan"). */}
          {/* TYPOGRAPHIE FLUIDE (13/08). Avant : `lg:text-6xl` figeait le titre
              a 60 px DES 1024 px et pour toujours. Mesure sur le site :
                  ecran 1280 -> 30 % de vide lateral
                  ecran 1920 -> 53 %
                  ecran 2560 -> 65 %
              ...avec un titre identique a 60 px dans les quatre cas.
              `clamp(min, fluide, max)` fait suivre la taille a la largeur de
              l'ecran EN CONTINU, sans palier : 30 px sur petit mobile, 84 px
              sur tres grand ecran. Les bornes evitent les deux exces (illisible
              en dessous, demesure au-dela). */}
          {/* 11/09/2026 : le compteur sort du H1. Il y etait dans un second
              <span>, si bien que Google lisait « 1 233 038 artisans
              référencésTrouvez gratuitement un artisan… » d'un seul tenant. Le
              H1 ne porte plus que la phrase ; le chiffre est un paragraphe
              juste dessous, au meme endroit visuel. */}
          <h1 className="flex flex-col items-center xl:items-start tracking-tight leading-[1.08]">
            <span className="font-extrabold text-[var(--text-primary)] text-[clamp(1.875rem,3.6vw,4.25rem)]">
              Trouvez gratuitement un artisan, près de chez vous
              {/* Point coral anime en pulse subtil. Pas d'opacity:0 a l'init
                  = le point est rendu serveur-side, LCP intact. */}
              <span className="text-[var(--accent)] animate-accent-pulse">.</span>
            </span>
          </h1>
          <p className="mt-3 mb-6 text-center xl:text-left font-extrabold tracking-tight text-[var(--text-secondary)] text-[clamp(1.5rem,2vw,2.5rem)]">
            {PROS_OUVERTS} artisans référencés
          </p>
          {/* BLOC D'ACTION (13/08, choix Willy sur 4 demos capturees du site).
              Un seul objet contient tout le parcours : la promesse, la
              recherche, la reassurance, et le depot de projet.

              Trois choix, chacun corrigeant un defaut constate en capture :
              1. FOND TEINTE, PAS DE BORDURE. Avant : une bordure coral autour
                 de la barre de recherche, qui a DEJA sa propre carte bordee.
                 Cadre dans un cadre, illisible. Le fond teinte laisse la carte
                 blanche ressortir.
              2. LA PROMESSE EN TITRE DU BLOC. Elle etait en petit gris
                 au-dessus du cadre et se perdait. C'est elle qui dit ce que
                 fait le site, elle passe en gras noir, "gratuitement" en coral.
              3. LE BOUTON DE DEPOT DEDANS. Il flottait seul plus bas, sans
                 lien visuel avec la recherche. Les deux chemins (chercher
                 soi-meme / decrire son projet) sont maintenant dans le meme
                 objet.

              11/09/2026 (decision Willy sur maquette) : la barre du HAUT mene
              a nouveau aux LISTES d'artisans (metier + ville -> page metier x
              ville, metier seul -> page metier). Du 11/08 au 11/09 elle menait
              au depot ; le visiteur ne savait plus s'il cherchait un artisan
              ou deposait un projet, et le bouton de depot entasse dessous
              brouillait encore. Le depot a maintenant SA section juste apres
              le hero (components/home/DepotSection.tsx). Un texte libre sans
              metier reconnu (« fuite d'eau ») continue d'aller au depot, texte
              repris : ce cas est gere dans SearchForm, pas ici.

              `animate-halo-respire` : halo qui respire 3 cycles puis s'arrete,
              coupe par prefers-reduced-motion. */}
          {/* Plafond 768 px (max-w-3xl) -> 880 px. Il reste un PLAFOND et non
              un pourcentage : au-dela, une barre de recherche de plus de
              900 px devient penible a viser a la souris. Mesure a 2560 px :
              le cadre se stabilise bien a 880 et ne suit pas l'ecran. */}
          <div className="max-w-[880px] mx-auto xl:mx-0 rounded-3xl bg-[color-mix(in_srgb,var(--accent)_7%,var(--bg-secondary))] p-6 sm:p-8 animate-halo-respire">
            <p className="text-lg sm:text-xl font-bold text-[var(--text-primary)] leading-snug mb-6 max-w-xl mx-auto xl:mx-0">
              Un métier, une ville : la liste des artisans près de chez vous,
              avec leurs coordonnées.{" "}
              <span className="text-[var(--accent)]">Gratuit</span>, sans compte.
            </p>
            <SearchForm categories={allCategories} destination="listing" />
          {/* Réassurance QUALITÉ : uniquement des signaux VRAIS (pub honnête + RGPD) :
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
          </div>
          {/* Barre de reassurance (maquette Willy). Trois signaux VRAIS et
              verifiables, aucun chiffre invente : le SIRET est controlable au
              registre officiel, les donnees viennent de Sirene, et le nombre
              de projets n'est PAS affiche puisqu'on ne peut pas encore
              l'annoncer honnetement. */}
          <div className="relative mt-10 inline-flex flex-col sm:flex-row items-center gap-y-3 sm:gap-x-7 rounded-2xl bg-[var(--bg-primary)] border border-[var(--card-border)] shadow-sm px-6 py-4 text-sm text-[var(--text-secondary)]">
            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true">
                <path d="M12 3l7 3v6c0 4-3 7-7 9-4-2-7-5-7-9V6l7-3z" stroke="currentColor" strokeWidth="1.8" strokeLinejoin="round" />
                <path d="M9 12l2 2 4-4" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              Gratuit pour les particuliers
            </span>
            <span className="hidden sm:block w-px h-5 bg-[var(--card-border)]" aria-hidden="true" />
            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true">
                <rect x="4" y="10" width="16" height="10" rx="2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M8 10V7a4 4 0 118 0v3" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Sécurisé et confidentiel
            </span>
            <span className="hidden sm:block w-px h-5 bg-[var(--card-border)]" aria-hidden="true" />
            <span className="inline-flex items-center gap-2">
              <svg viewBox="0 0 24 24" fill="none" className="w-4 h-4 text-[var(--accent)] shrink-0" aria-hidden="true">
                <path d="M3 20v-1a5 5 0 015-5h3a5 5 0 015 5v1" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
                <circle cx="9.5" cy="8" r="3.2" stroke="currentColor" strokeWidth="1.8" />
                <path d="M17 14a4 4 0 014 4v2" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
              Sans création de compte
            </span>
          </div>
          {/* Bande de compteurs SUPPRIMEE le 11/08/2026.
              Le chiffre 2 560 292 est passe dans le H1 le meme jour : le
              repeter 400 px plus bas, en enorme et en coral, avec le meme
              libelle "professionnels referencés", faisait lire deux fois la
              meme information et repoussait le bouton d'action sous la ligne
              de flottaison. Les deux autres chiffres (35 163 communes,
              107 departements) restent visibles sur /departements et /pro. */}
          {/* CTA principal du hero : déposer un projet (gratuit), juste sous le
              bandeau de stats, emplacement validé par Willy (le "rond"). */}
        </div>
      </section>

      {/* Section photo isolee SUPPRIMEE le 13/08 : la mosaique de metiers du
          hero joue desormais ce role, et beaucoup mieux. Une photo unique de
          macon en pleine largeur au milieu de la page faisait doublon. */}
      {/* Projets déposés récemment : double CTA (particulier dépose / pro reçoit).
          Modulable : 1→10 vrais projets anonymisés, se masque si 0. */}
      {/* Le depot de projet a sa propre section (11/09/2026), juste apres le
          hero : voir components/home/DepotSection.tsx. */}
      <DepotSection />

      <RecentProjectsSection projects={recentProjects} />

      {/* Entonnoir de decouverte pour Google (01/09/2026) : la home est relue
          chaque jour, les 24 fiches les plus recemment modifiees y sont liees
          pour etre decouvertes en 24 h. Cf. components/home/MisesAJourSection. */}
      <MisesAJourSection pages={fichesFraiches} />

      {/* Categories par vertical : CTA pro inséré juste après le BTP (demande
          Willy 14/07 : visibilité max pour le recrutement de pros). */}
      {verticals.map((vertical) => (
        <Fragment key={vertical.title}>
        <section className="py-16 px-4 border-t border-[var(--border-color)]">
          <div className="max-w-6xl mx-auto">
            <h2 className="text-2xl sm:text-3xl font-bold tracking-tight text-[var(--text-primary)] mb-8">
              {vertical.title}
            </h2>
            <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
              {vertical.categories.map((cat) => (
                <Link
                  key={cat.id}
                  href={linkFor(cat.slug)}
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
          differentes, deux emplacements, au lieu d'une seule barre qui doit
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

      {/* FAQ : section visible + JSON-LD FAQPage (cf. getFaqSchema).
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

import Link from "next/link";
// Imports publics (sans cookies) : critique pour le caching ISR du layout
// (public). Si on remet `getAllCategories` / `getAllDepartments` qui
// touchent aux cookies, toutes les pages publiques basculent en dynamic
// => cache CDN inactif.
import {
  getAllCategoriesPublic,
  getAllDepartmentsPublic,
} from "@/lib/queries/home-public";
import { generateDepartmentSlug } from "@/lib/utils/slugs";

/**
 * Pied de page, reorganise le 11/09/2026 (maquette validee par Willy).
 *
 * Avant : la colonne « BTP et artisanat » listait les 9 premieres categories
 * par ordre alphabetique, donc Architecte, Ascensoriste, Carreleur... jusqu'a
 * Decorateur : plombier, electricien, macon, peintre, les metiers que les gens
 * cherchent, n'y etaient pas. Et une colonne « Entreprise » de 21 liens
 * melangeait l'espace pro, les barometres, le blog et les mentions legales.
 * Le pied de page est present sur chaque page du site : ses liens pesent pour
 * Google, autant les donner aux pages qui comptent.
 *
 * Apres : un bloc de marque avec deux actions (deposer un projet, reclamer sa
 * fiche), puis quatre colonnes de meme hauteur : les dix metiers les plus
 * demandes, la maison et la personne, ce qui sert au particulier, ce qui sert
 * au professionnel. Une ligne basse pour le legal. Les titres de colonnes sont
 * des <p>, pas des balises de titre : ils ne polluent pas le plan de chaque
 * page.
 *
 * Decision Willy : AUCUNE coordonnee de l'editeur ici (ni SIREN ni adresse),
 * elles restent sur /mentions-legales. Seule la source des donnees est citee.
 */

// Ordre voulu par Willy. Une categorie absente de la base est simplement sautee.
const METIERS_LES_PLUS_DEMANDES = [
  "plombier",
  "electricien",
  "macon",
  "peintre",
  "menuisier",
  "carreleur",
  "couvreur",
  "chauffagiste",
  "plaquiste",
  "paysagiste",
];
const MAISON_ET_PERSONNE = [
  "menage",
  "nettoyage-vitres",
  "debarras",
  "demenagement",
  "aide-seniors",
  "garde-enfants",
  "soutien-scolaire",
  "aide-administrative",
];

const PARTICULIERS = [
  { href: "/deposer-projet", label: "Déposer un projet" },
  { href: "/recherche", label: "Rechercher un artisan" },
  { href: "/verifier-artisan", label: "Vérifier un artisan" },
  { href: "/departements", label: "Tous les départements" },
  { href: "/barometre-artisans", label: "Baromètre des artisans" },
  { href: "/barometre-prix-artisans", label: "Baromètre des prix" },
  { href: "/barometre-penurie-artisans", label: "Les déserts d'artisans" },
  { href: "/blog", label: "Blog" },
];
const PROFESSIONNELS = [
  { href: "/pro", label: "Espace pro" },
  { href: "/pro/retrouver-fiche", label: "Réclamer ma fiche" },
  { href: "/trouver-des-chantiers", label: "Trouver des chantiers" },
  { href: "/trouver-des-clients", label: "Trouver des clients" },
  { href: "/pro#pricing", label: "Tarifs : 9,90 € le contact" },
  { href: "/pro/connexion", label: "Connexion" },
  { href: "/ai", label: "Freelances et services digitaux" },
  { href: "/barometre-artisans-belgique", label: "Baromètre Belgique" },
];
const LIGNE_BASSE = [
  { href: "/a-propos", label: "À propos" },
  { href: "mailto:contact@workwave.fr", label: "Contact", externe: true },
  { href: "/feedback", label: "Améliorer Workwave.fr" },
  { href: "/mentions-legales", label: "Mentions légales" },
  { href: "/cgu", label: "CGU" },
  { href: "/cgv", label: "CGV" },
  { href: "https://www.instagram.com/workwave.fr/", label: "Instagram", externe: true },
];

const LIEN = "text-zinc-400 hover:text-white transition-colors duration-250";
const TITRE = "text-xs font-bold uppercase tracking-wider text-white mb-4";
// Sur telephone la liste passe sur deux colonnes (rien de tronque, moins de
// defilement) ; sur grand ecran, une colonne classique.
const LISTE = "grid grid-cols-2 gap-x-4 gap-y-2 lg:block lg:space-y-2";

export default async function Footer() {
  const [categories, departments] = await Promise.all([
    getAllCategoriesPublic(),
    getAllDepartmentsPublic(),
  ]);
  const parSlug = new Map(categories.map((c) => [c.slug, c]));
  const metiers = METIERS_LES_PLUS_DEMANDES.map((s) => parSlug.get(s)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );
  const maison = MAISON_ET_PERSONNE.map((s) => parSlug.get(s)).filter(
    (c): c is NonNullable<typeof c> => Boolean(c)
  );

  // Rotation des departements sur les liens metier, conservee (audit du
  // 03/05/2026) : le pied de page est sur 2 M de pages, faire pointer chaque
  // metier vers un departement different repartit la decouverte par Google
  // sur toute la France au lieu de tout pousser vers un seul departement.
  const deptSlugs = departments.map((d) => generateDepartmentSlug(d));
  const linkFor = (catSlug: string, idx: number, offset: number): string => {
    if (deptSlugs.length === 0) return `/${catSlug}`;
    const dept = deptSlugs[(idx + offset) % deptSlugs.length];
    return `/${catSlug}/${dept}`;
  };

  return (
    <footer className="bg-[#0A0A0A] dark:bg-[#111111] text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-14 sm:py-16">
        <div className="grid gap-10 md:grid-cols-2 lg:grid-cols-[1.3fr_repeat(4,1fr)] lg:gap-8">
          {/* Bloc de marque : l'accroche et les deux actions */}
          <div className="md:col-span-2 lg:col-span-1">
            <Link prefetch={false} href="/" className="text-2xl font-bold tracking-tight">
              Workwave.fr
            </Link>
            <p className="text-sm text-zinc-400 mt-3 max-w-xs">
              Annuaire gratuit d&apos;artisans et de services, vérifié au registre
              officiel. France et Belgique francophone.
            </p>
            <Link
              prefetch={false}
              href="/deposer-projet"
              className="mt-5 inline-flex items-center justify-center rounded-full bg-[var(--accent)] hover:bg-[var(--accent-hover)] px-5 py-2.5 text-sm font-semibold text-white transition-colors duration-250"
            >
              Déposer un projet (gratuit)
            </Link>
            <Link
              prefetch={false}
              href="/pro/retrouver-fiche"
              className="mt-3 block text-sm font-semibold text-white hover:text-zinc-300 transition-colors duration-250"
            >
              Vous êtes artisan ? Réclamez votre fiche →
            </Link>
          </div>

          <div>
            <p className={TITRE}>Métiers les plus demandés</p>
            <ul className={LISTE}>
              {metiers.map((cat, i) => (
                <li key={cat.id}>
                  <Link prefetch={false} href={linkFor(cat.slug, i, 0)} className={LIEN}>
                    {cat.name}
                  </Link>
                </li>
              ))}
              <li className="col-span-2 pt-1">
                <Link prefetch={false} href="/recherche" className="font-semibold text-white hover:text-zinc-300 transition-colors duration-250">
                  Tous les métiers →
                </Link>
              </li>
            </ul>
          </div>

          <div>
            <p className={TITRE}>Maison et personne</p>
            <ul className={LISTE}>
              {maison.map((cat, i) => (
                <li key={cat.id}>
                  <Link prefetch={false} href={linkFor(cat.slug, i, 5)} className={LIEN}>
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={TITRE}>Particuliers</p>
            <ul className={LISTE}>
              {PARTICULIERS.map((l) => (
                <li key={l.href}>
                  <Link prefetch={false} href={l.href} className={LIEN}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          <div>
            <p className={TITRE}>Professionnels</p>
            <ul className={LISTE}>
              {PROFESSIONNELS.map((l) => (
                <li key={l.href}>
                  <Link prefetch={false} href={l.href} className={LIEN}>
                    {l.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        </div>

        {/* Ligne basse : legal et contact. Pas de coordonnees de l'editeur. */}
        <div className="mt-12 pt-6 border-t border-zinc-800 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between text-xs text-zinc-400">
          <ul className="flex flex-wrap gap-x-5 gap-y-2">
            {LIGNE_BASSE.map((l) =>
              l.externe ? (
                <li key={l.href}>
                  <a
                    href={l.href}
                    className={LIEN}
                    {...(l.href.startsWith("http") ? { target: "_blank", rel: "noopener noreferrer" } : {})}
                  >
                    {l.label}
                  </a>
                </li>
              ) : (
                <li key={l.href}>
                  <Link prefetch={false} href={l.href} className={LIEN}>
                    {l.label}
                  </Link>
                </li>
              )
            )}
          </ul>
          <p className="m-0">© {new Date().getFullYear()} Workwave.fr</p>
        </div>
        <p className="mt-3 text-xs text-zinc-500">
          Données d&apos;entreprises issues du registre Sirene de l&apos;INSEE.
        </p>
      </div>
    </footer>
  );
}

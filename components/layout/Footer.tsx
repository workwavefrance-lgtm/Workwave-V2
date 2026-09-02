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

export default async function Footer() {
  const [categories, departments] = await Promise.all([
    getAllCategoriesPublic(),
    getAllDepartmentsPublic(),
  ]);

  const btp = categories.filter((c) => c.vertical === "btp").slice(0, 9);
  const domicile = categories
    .filter((c) => c.vertical === "domicile")
    .slice(0, 9);
  const personne = categories
    .filter((c) => c.vertical === "personne")
    .slice(0, 8);

  // Rotation des 12 departements pour repartir le link juice du footer
  // (present sur 200k+ pages) sur tous les departements de Nouvelle-Aquitaine,
  // au lieu de tout pousser vers vienne-86 (situation pre-fix qui limitait
  // la decouvrabilite de 92,7% des pros par Google). Offset different par
  // colonne pour qu'aucune colonne ne demarre sur le meme dept.
  // Cf. lecon CLAUDE.md (audit 2026-05-03).
  const deptSlugs = departments.map((d) => generateDepartmentSlug(d));
  const linkFor = (catSlug: string, idx: number, offset: number): string => {
    if (deptSlugs.length === 0) return `/${catSlug}`;
    const dept = deptSlugs[(idx + offset) % deptSlugs.length];
    return `/${catSlug}/${dept}`;
  };
  const OFFSET_BTP = 0;
  const OFFSET_DOMICILE = 4; // decale d'1/3 de la liste
  const OFFSET_PERSONNE = 8; // decale d'2/3 de la liste

  return (
    <footer className="bg-[#0A0A0A] dark:bg-[#111111] text-white mt-auto">
      <div className="max-w-6xl mx-auto px-4 py-16">
        {/* Logo */}
        <div className="mb-12">
          <Link prefetch={false} href="/" className="text-2xl font-bold tracking-tight">
            Workwave.fr
          </Link>
          <p className="text-sm text-zinc-400 mt-2 max-w-md">
            Trouvez les meilleurs professionnels près de chez vous. Annuaire
            gratuit en France et en Belgique francophone.
          </p>
        </div>

        {/* Colonnes de liens */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 text-sm">
          <div>
            <h4 className="font-semibold text-white mb-4">BTP et artisanat</h4>
            <ul className="space-y-2">
              {btp.map((cat, i) => (
                <li key={cat.id}>
                  <Link
                    prefetch={false}
                    href={linkFor(cat.slug, i, OFFSET_BTP)}
                    className="text-zinc-400 hover:text-white transition-colors duration-250"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">
              Services à domicile
            </h4>
            <ul className="space-y-2">
              {domicile.map((cat, i) => (
                <li key={cat.id}>
                  <Link
                    prefetch={false}
                    href={linkFor(cat.slug, i, OFFSET_DOMICILE)}
                    className="text-zinc-400 hover:text-white transition-colors duration-250"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">
              Aide à la personne
            </h4>
            <ul className="space-y-2">
              {personne.map((cat, i) => (
                <li key={cat.id}>
                  <Link
                    prefetch={false}
                    href={linkFor(cat.slug, i, OFFSET_PERSONNE)}
                    className="text-zinc-400 hover:text-white transition-colors duration-250"
                  >
                    {cat.name}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
          <div>
            <h4 className="font-semibold text-white mb-4">Entreprise</h4>
            <ul className="space-y-2">
              <li>
                <Link
                  prefetch={false}
                  href="/pro"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Espace Pro
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/trouver-des-chantiers"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Trouver des chantiers
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/trouver-des-clients"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Trouver des clients
                </Link>
              </li>
              <li>
                {/* Vertical freelance désormais intégré à workwave.fr (/ai).
                    Lien INTERNE (le .co est en cours de sunset, redirigé .fr) :
                    garde l'autorité sur .fr + rend /ai visible sitewide. */}
                <Link
                  prefetch={false}
                  href="/ai"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Freelances &amp; services digitaux
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/pro#pricing"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Tarifs
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/pro/connexion"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Connexion pro
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/recherche"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Rechercher
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/verifier-artisan"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Vérifier un artisan
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/departements"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Tous les départements
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/blog"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Blog
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/barometre-artisans"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Baromètre des artisans
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/barometre-prix-artisans"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Baromètre des prix
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/barometre-penurie-artisans"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Les déserts d&apos;artisans
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/barometre-artisans-belgique"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Baromètre Belgique
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/a-propos"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  À propos
                </Link>
              </li>
              <li>
                <a
                  href="mailto:contact@workwave.fr"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Contact
                </a>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/feedback"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Améliorer Workwave.fr
                </Link>
              </li>
              <li>
                <a
                  href="https://www.instagram.com/workwave.fr/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Instagram
                </a>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/mentions-legales"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  Mentions légales
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/cgu"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  CGU
                </Link>
              </li>
              <li>
                <Link
                  prefetch={false}
                  href="/cgv"
                  className="text-zinc-400 hover:text-white transition-colors duration-250"
                >
                  CGV
                </Link>
              </li>
            </ul>
          </div>
        </div>

        {/* Copyright */}
        <div className="mt-12 pt-8 border-t border-zinc-800 text-xs text-zinc-400 text-center">
          &copy; {new Date().getFullYear()} Workwave.fr. Tous droits réservés.
        </div>
      </div>
    </footer>
  );
}

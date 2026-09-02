import Link from "next/link";
import type { PageFraiche } from "@/lib/queries/fraicheur";

/**
 * « Mis à jour cette semaine » : un entonnoir de découverte pour Google.
 *
 * La page d'accueil est celle que Google relit chaque jour. Y placer des liens
 * vers des pages profondes récemment modifiées, c'est les faire découvrir en
 * 24 h au lieu de les laisser au fond de la file. Le bloc tourne tout seul au
 * rythme des réclamations et enrichissements (ISR de la home, 1 h).
 *
 * Discret pour l'humain, volontairement : c'est un signal pour le crawl, pas
 * une vitrine. Se masque s'il n'y a rien à montrer. Liens sans préchargement
 * (leçon du 30/08 : chaque préchargement est une page fabriquée pour rien).
 */
export default function MisesAJourSection({ pages }: { pages: PageFraiche[] }) {
  if (pages.length === 0) return null;

  return (
    <section className="px-4 py-12 border-t border-[var(--border-color)]">
      <div className="max-w-6xl mx-auto">
        <h2 className="text-sm font-semibold uppercase tracking-wide text-[var(--text-tertiary)] mb-4">
          Fiches mises à jour cette semaine
        </h2>
        <ul className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-x-6 gap-y-2">
          {pages.map((p) => (
            <li key={p.url} className="truncate">
              <Link
                href={p.url.replace("https://workwave.fr", "")}
                prefetch={false}
                className="text-sm text-[var(--text-secondary)] hover:text-[var(--accent)] transition-colors duration-250"
              >
                {p.titre}
              </Link>
            </li>
          ))}
        </ul>
      </div>
    </section>
  );
}

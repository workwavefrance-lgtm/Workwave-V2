import Link from "next/link";

type ProjectCtaBannerProps = {
  /** Slug de la catégorie (ex: "plombier") — utilisé pour pré-remplir le form */
  categorySlug: string;
  /** Nom lisible de la catégorie (ex: "Plombier") */
  categoryName: string;
  /** Slug de la ville/département pour pré-remplir le form */
  locationSlug: string;
  /** Nom lisible (ex: "Poitiers" ou "Vienne (86)") */
  locationName: string;
  /** "à" ou "en" selon ville/département */
  preposition: string;
};

/**
 * Bandeau d'incitation au dépôt de projet, affiché en haut des pages listing.
 * Pré-remplit la catégorie et la ville via query params vers /deposer-projet.
 *
 * Design : volontairement épuré (vs Travaux.com), coral discret, pas de gradient,
 * conforme à la philosophie de design (section 8 bis du CLAUDE.md).
 */
export default function ProjectCtaBanner({
  categorySlug,
  categoryName,
  locationSlug,
  locationName,
  preposition,
}: ProjectCtaBannerProps) {
  const href = `/deposer-projet?categorie=${encodeURIComponent(
    categorySlug
  )}&ville=${encodeURIComponent(locationSlug)}`;

  return (
    <section
      aria-label="Demander un devis"
      className="mb-10 rounded-2xl border border-[var(--card-border)] bg-[var(--bg-secondary)] px-6 py-6 sm:px-8 sm:py-7 sm:flex sm:items-center sm:justify-between sm:gap-6"
    >
      <div className="mb-5 sm:mb-0">
        <h2 className="text-lg sm:text-xl font-semibold text-[var(--text-primary)] mb-1.5">
          Besoin d&apos;un {categoryName.toLowerCase()} {preposition}{" "}
          {locationName} ?
        </h2>
        <p className="text-sm text-[var(--text-secondary)] leading-relaxed max-w-xl">
          Décrivez votre projet en 2 minutes. Recevez gratuitement plusieurs
          devis de professionnels qualifiés près de chez vous.
        </p>
      </div>
      <Link
        href={href}
        prefetch={false}
        className="inline-flex items-center justify-center gap-2 whitespace-nowrap bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white px-6 py-3 rounded-full text-sm font-semibold transition-all duration-250 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--accent)]/40"
      >
        Décrire mon projet
        <svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2.5"
          strokeLinecap="round"
          strokeLinejoin="round"
          aria-hidden="true"
        >
          <path d="M5 12h14" />
          <path d="m12 5 7 7-7 7" />
        </svg>
      </Link>
    </section>
  );
}

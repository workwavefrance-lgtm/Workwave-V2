import Link from "next/link";

type Props = {
  /** Nom du pro affiche sur la fiche (pour personnaliser le titre). */
  proName: string;
  /** Slug de la categorie du pro -> pre-remplit le formulaire. */
  categorySlug?: string;
  /** Nom lisible de la categorie (pour le sous-titre). */
  categoryName?: string;
  /** Slug de la ville du pro -> pre-remplit le formulaire. */
  citySlug?: string | null;
  /** Nom lisible de la ville (pour le sous-titre). */
  cityName?: string | null;
};

/**
 * Encart "Pas le bon artisan ? Decrivez votre projet" affiche en bas
 * de chaque fiche `/artisan/[slug]`.
 *
 * Pourquoi : 77% du trafic SEO de Workwave arrive sur des fiches pros
 * individuelles (recherches navigationnelles type "nom de l'entreprise").
 * Ces visiteurs ont l'info contact, mais s'ils ne tombent pas d'accord
 * (indispo, pas le bon profil, pas le bon tarif), ils repartent sans
 * rien proposer cote Workwave. Cet encart leur offre une alternative
 * NON BLOQUANTE au moment exact ou ils en ont besoin.
 *
 * Lien vers `/deposer-projet` avec pre-remplissage du metier + de la
 * ville via query params (geres cote page : page.tsx du formulaire).
 */
export default function ProjectCTABlock({
  proName,
  categorySlug,
  categoryName,
  citySlug,
  cityName,
}: Props) {
  const params = new URLSearchParams();
  if (categorySlug) params.set("categorie", categorySlug);
  if (citySlug) params.set("ville", citySlug);
  const href =
    "/deposer-projet" + (params.toString() ? `?${params.toString()}` : "");

  // Sous-titre adapte : avec metier + ville si possible, sinon generique.
  const subtitle =
    categoryName && cityName
      ? `Decrivez votre besoin de ${categoryName.toLowerCase()} a ${cityName}, on contacte jusqu'a 3 artisans qualifies dans votre zone. Gratuit, sans engagement.`
      : categoryName
      ? `Decrivez votre besoin de ${categoryName.toLowerCase()}, on contacte jusqu'a 3 artisans qualifies dans votre zone. Gratuit, sans engagement.`
      : "Decrivez votre projet, on contacte jusqu'a 3 artisans qualifies dans votre zone. Gratuit, sans engagement.";

  return (
    <section className="mt-12 pt-8 border-t border-[var(--border-color)]">
      <div className="bg-[var(--bg-secondary)] border border-[var(--card-border)] rounded-2xl p-6 sm:p-8">
        <h2 className="text-xl sm:text-2xl font-bold tracking-tight text-[var(--text-primary)] mb-3">
          {proName} ne vous convient pas, ou est indisponible ?
        </h2>
        <p className="text-sm sm:text-base text-[var(--text-secondary)] leading-relaxed mb-6 max-w-2xl">
          {subtitle}
        </p>
        <Link
          href={href}
          className="inline-flex items-center gap-2 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-white font-semibold px-6 py-3 rounded-full text-sm transition-all duration-250 hover:scale-[1.02]"
        >
          Déposer mon projet
          <svg
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            aria-hidden="true"
          >
            <path d="M5 12h14M12 5l7 7-7 7" />
          </svg>
        </Link>
        <p className="mt-4 text-xs text-[var(--text-tertiary)]">
          Réponse rapide · 100 % gratuit · Sans engagement · Sans création de compte
        </p>
      </div>
    </section>
  );
}

type ListingIntroProps = {
  /** Texte d'intro (markdown simple : juste paragraphes séparés par lignes vides) */
  intro: string;
  /** Fallback si pas d'intro disponible : généré dynamiquement par la page */
  fallback?: string;
};

/**
 * Bloc d'introduction affiché au-dessus de la grille de pros sur les pages listing.
 * Sert à la fois pour la conversion (rassurer le visiteur) et le SEO (texte indexable
 * en haut de page, riche en mots-clés métier × ville).
 *
 * Le contenu vient de la table seo_pages (premier paragraphe de seo.content),
 * extrait par lib/utils/seo.ts > extractIntro().
 */
export default function ListingIntro({ intro, fallback }: ListingIntroProps) {
  const text = intro?.trim() || fallback?.trim() || "";
  if (!text) return null;

  // Découper en paragraphes (lignes vides) et nettoyer
  const paragraphs = text
    .split(/\n\s*\n/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter(Boolean);

  if (paragraphs.length === 0) return null;

  return (
    <section
      aria-label="À propos"
      className="mb-10 max-w-3xl"
    >
      {paragraphs.map((p, i) => (
        <p
          key={i}
          className="text-[var(--text-secondary)] leading-relaxed mb-3 last:mb-0"
        >
          {p}
        </p>
      ))}
    </section>
  );
}

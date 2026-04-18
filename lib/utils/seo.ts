export function truncateDescription(
  text: string | null | undefined,
  maxLength: number = 155
): string {
  if (!text) return "";
  if (text.length <= maxLength) return text;
  return text.slice(0, maxLength - 3).trimEnd() + "...";
}

/**
 * Extrait l'intro d'un contenu SEO en markdown.
 * Retourne tout ce qui précède le premier titre H2 (## ...).
 * Nettoie aussi un éventuel H1 (# ...) en début, et limite la longueur.
 *
 * Usage : afficher un paragraphe d'intro court au-dessus de la grille de pros,
 * tout en gardant le contenu long complet en bas de page.
 */
export function extractIntro(
  markdown: string | null | undefined,
  maxLength: number = 600
): string {
  if (!markdown) return "";

  // Couper avant le premier H2
  const h2Index = markdown.search(/^## /m);
  let intro = h2Index === -1 ? markdown : markdown.slice(0, h2Index);

  // Retirer un éventuel H1 (# Titre) en début
  intro = intro.replace(/^#\s.*$/m, "").trim();

  // Limiter à maxLength caractères, sans couper un mot
  if (intro.length > maxLength) {
    const truncated = intro.slice(0, maxLength);
    const lastSpace = truncated.lastIndexOf(" ");
    intro = truncated.slice(0, lastSpace > 0 ? lastSpace : maxLength).trimEnd() + "…";
  }

  return intro;
}

/**
 * Inverse de extractIntro : retourne le contenu APRÈS le premier H2.
 * Utilisé pour éviter la duplication entre l'intro affichée en haut de page
 * et le contenu long affiché en bas (SeoContent).
 */
export function stripIntro(markdown: string | null | undefined): string {
  if (!markdown) return "";
  const h2Index = markdown.search(/^## /m);
  if (h2Index === -1) return ""; // pas de H2 → tout était l'intro
  return markdown.slice(h2Index).trimEnd();
}

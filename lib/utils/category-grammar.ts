/**
 * Helpers de grammaire francaise pour les libelles de categories.
 *
 * Probleme : on a des phrases du genre "Vous cherchez un {category} ?"
 * qui marchent pour "un plombier" / "un electricien" mais cassent sur
 * "un livraison de courses" / "un garde d'enfants" / "un aide aux
 * seniors" (categories feminines).
 *
 * Solution : un Set explicite des categories feminines. Defaut
 * masculin ("un") pour tout le reste. A maintenir manuellement quand
 * on ajoute une nouvelle categorie (rare).
 *
 * Source : CLAUDE.md section 7 + table `categories` de Supabase
 * (libelles vus dans la base, normalises en lowercase).
 */

/** Liste des libelles de categories en GENRE FEMININ. */
const FEMININE_CATEGORIES = new Set<string>([
  // services a domicile
  "livraison de courses",
  // aide a la personne
  "garde d'enfants",
  "garde animaux",
  "aide aux seniors",
  "aide administrative",
  // BTP / domicile
  "vidéosurveillance",
]);

/**
 * Renvoie "un" ou "une" selon le genre de la categorie.
 *
 * Comparaison en lowercase + trim pour matcher quel que soit
 * le casing en base (categories.name est generalement en Title
 * Case dans la base, ex. "Livraison de courses").
 */
export function getCategoryArticle(categoryName: string): "un" | "une" {
  const key = categoryName.toLowerCase().trim();
  return FEMININE_CATEGORIES.has(key) ? "une" : "un";
}

/**
 * Renvoie "meilleurs" ou "meilleures" selon le genre.
 * Utilise pour les titres "Les X meilleurs/meilleures [metier]".
 */
export function getCategoryBestForm(categoryName: string): "meilleurs" | "meilleures" {
  return getCategoryArticle(categoryName) === "une" ? "meilleures" : "meilleurs";
}

/**
 * Pluralise un nom de categorie pour les titres au pluriel.
 * Regle simple : on ajoute "s" au PREMIER mot (les autres restent
 * souvent inchanges en francais : "Aide aux seniors" -> "Aides aux
 * seniors", "Garde d'enfants" -> "Gardes d'enfants"). Marche aussi
 * sur un seul mot ("Plombier" -> "Plombiers").
 *
 * Sortie en minuscule pour les phrases du genre "les 10 meilleurs
 * plombiers a Poitiers".
 */
export function pluralizeCategoryName(categoryName: string): string {
  const lower = categoryName.toLowerCase().trim();
  if (!lower) return lower;

  const parts = lower.split(/\s+/);
  const first = parts[0];
  // Si deja termine par "s" ou "x", on ne double pas
  if (/[sx]$/.test(first)) {
    parts[0] = first;
  } else {
    parts[0] = first + "s";
  }
  return parts.join(" ");
}

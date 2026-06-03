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
  // Proximité (Vague 3 AlloVoisins)
  "manutention",
  "coiffure à domicile",
  "esthétique à domicile",
  "couture et retouches",
  "assistance informatique",
  "promenade d'animaux",
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

/**
 * Mappe le NOM DU METIER -> NOM DU SERVICE pour les phrases du type
 * "projet de PEINTURE" (au lieu de "projet de peintre") ou "travaux
 * de PLOMBERIE" (au lieu de "travaux de plombier").
 *
 * En francais le metier (plombier) est souvent different du nom du
 * service (plomberie). Pour les services a domicile et l'aide a la
 * personne, c'est generalement le meme mot (jardinage, menage,
 * soutien scolaire).
 */
const SERVICE_LABEL_BY_CATEGORY_SLUG: Record<string, string> = {
  // BTP — mappings necessaires
  plombier: "plomberie",
  electricien: "électricité",
  macon: "maçonnerie",
  peintre: "peinture",
  carreleur: "carrelage",
  menuisier: "menuiserie",
  couvreur: "couverture",
  chauffagiste: "chauffage",
  charpentier: "charpente",
  facadier: "façade",
  serrurier: "serrurerie",
  climaticien: "climatisation",
  terrassier: "terrassement",
  paysagiste: "paysagisme",
  elagueur: "élagage",
  architecte: "architecture",
  "decorateur-interieur": "décoration intérieure",
  plaquiste: "plâtrerie",
  pisciniste: "piscine",
  vitrier: "vitrerie",
  ramoneur: "ramonage",
  cuisiniste: "cuisine sur mesure",
  videosurveillance: "vidéosurveillance",
  "nettoyage-pro": "nettoyage professionnel",
  // Domicile — generalement le nom est deja le nom du service
  jardinage: "jardinage",
  menage: "ménage",
  repassage: "repassage",
  "petit-bricolage": "bricolage",
  "nettoyage-vitres": "nettoyage de vitres",
  debarras: "débarras",
  demenagement: "déménagement",
  "livraison-de-courses": "livraison de courses",
  "lavage-voiture-a-domicile": "lavage de voiture",
  // Personne — pareil
  "garde-d-enfants": "garde d'enfants",
  "garde-enfants": "garde d'enfants",
  "soutien-scolaire": "soutien scolaire",
  "aide-aux-seniors": "aide aux seniors",
  "aide-administrative": "aide administrative",
  "cours-particuliers": "cours particuliers",
  "accompagnement-handicap": "accompagnement",
  "promenade-animaux": "promenade d'animaux",
  "garde-animaux": "garde d'animaux",
};

/**
 * Renvoie le NOM DU SERVICE associe a une categorie, pour les phrases
 * du type "projet de {service}" / "travaux de {service}".
 *
 * Fallback : si la categorie n'est pas mappee, retourne le nom de la
 * categorie en lowercase (cas des services a domicile et aide a la
 * personne ou metier = service).
 */
export function getCategoryServiceLabel(categorySlug: string, categoryName: string): string {
  const mapped = SERVICE_LABEL_BY_CATEGORY_SLUG[categorySlug];
  if (mapped) return mapped;
  return categoryName.toLowerCase().trim();
}

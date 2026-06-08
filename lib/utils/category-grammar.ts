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

/**
 * Phrasé des LISTINGS (titres "Top 10 ...", H1, meta).
 *
 * Probleme : pluralizeCategoryName casse pour les services ("Top 10 menages",
 * "Top 10 gardes d'enfants", "Trouver un menage"). Ce template marche pour les
 * METIERS BTP (plombiers, macons) mais pas pour les SERVICES.
 *
 * Solution : un override par categorie qui fournit explicitement :
 *   - plural   : le nom au pluriel apres "Top 10 ..." (ex. "entreprises de menage")
 *   - singular : le nom au singulier apres "Trouver un/une ..." (ex. "entreprise de menage")
 *   - article  : "un"/"une" (accord avec le singulier)
 *   - notes    : "notes"/"notees" (accord avec le PLURIEL, pour "les mieux X")
 *
 * Defaut (BTP non mappe) : pluralizeCategoryName + nom au singulier + article auto.
 */
export type CategoryListing = {
  plural: string;
  singular: string;
  article: "un" | "une";
  notes: "notés" | "notées";
};

const CATEGORY_LISTING_OVERRIDES: Record<string, CategoryListing> = {
  // ---- BTP qui pluralisent mal ----
  "decorateur-interieur": { plural: "décorateurs d'intérieur", singular: "décorateur d'intérieur", article: "un", notes: "notés" },
  "diagnostic-immobilier": { plural: "diagnostiqueurs immobiliers", singular: "diagnostiqueur immobilier", article: "un", notes: "notés" },
  videosurveillance: { plural: "installateurs de vidéosurveillance", singular: "installateur de vidéosurveillance", article: "un", notes: "notés" },
  "installateur-videosurveillance": { plural: "installateurs de vidéosurveillance", singular: "installateur de vidéosurveillance", article: "un", notes: "notés" },
  // ---- DOMICILE ----
  menage: { plural: "entreprises de ménage", singular: "entreprise de ménage", article: "une", notes: "notées" },
  repassage: { plural: "services de repassage", singular: "service de repassage", article: "un", notes: "notés" },
  "petit-bricolage": { plural: "professionnels du bricolage", singular: "professionnel du bricolage", article: "un", notes: "notés" },
  "nettoyage-vitres": { plural: "professionnels du nettoyage de vitres", singular: "laveur de vitres", article: "un", notes: "notés" },
  debarras: { plural: "entreprises de débarras", singular: "entreprise de débarras", article: "une", notes: "notées" },
  demenagement: { plural: "déménageurs", singular: "déménageur", article: "un", notes: "notés" },
  "livraison-de-courses": { plural: "services de livraison de courses", singular: "service de livraison de courses", article: "un", notes: "notés" },
  "entreprise-de-nettoyage": { plural: "entreprises de nettoyage", singular: "entreprise de nettoyage", article: "une", notes: "notées" },
  "nettoyage-pro": { plural: "entreprises de nettoyage", singular: "entreprise de nettoyage", article: "une", notes: "notées" },
  jardinage: { plural: "jardiniers", singular: "jardinier", article: "un", notes: "notés" },
  multiservice: { plural: "professionnels multiservices", singular: "professionnel multiservice", article: "un", notes: "notés" },
  // ---- PERSONNE ----
  "garde-enfants": { plural: "services de garde d'enfants", singular: "garde d'enfants", article: "une", notes: "notés" },
  "garde-d-enfants": { plural: "services de garde d'enfants", singular: "garde d'enfants", article: "une", notes: "notés" },
  "garde-animaux": { plural: "services de garde d'animaux", singular: "garde d'animaux", article: "une", notes: "notés" },
  "soutien-scolaire": { plural: "professeurs de soutien scolaire", singular: "professeur de soutien scolaire", article: "un", notes: "notés" },
  "cours-particuliers": { plural: "professeurs particuliers", singular: "professeur particulier", article: "un", notes: "notés" },
  "aide-aux-seniors": { plural: "services d'aide aux seniors", singular: "service d'aide aux seniors", article: "un", notes: "notés" },
  "aide-administrative": { plural: "professionnels de l'aide administrative", singular: "professionnel de l'aide administrative", article: "un", notes: "notés" },
  "accompagnement-handicap": { plural: "services d'accompagnement", singular: "service d'accompagnement", article: "un", notes: "notés" },
  "coach-sportif": { plural: "coachs sportifs", singular: "coach sportif", article: "un", notes: "notés" },
  "coiffure-a-domicile": { plural: "coiffeurs à domicile", singular: "coiffeur à domicile", article: "un", notes: "notés" },
  "esthetique-a-domicile": { plural: "esthéticiennes à domicile", singular: "esthéticienne à domicile", article: "une", notes: "notées" },
  "cours-de-musique": { plural: "professeurs de musique", singular: "professeur de musique", article: "un", notes: "notés" },
  "promenade-animaux": { plural: "promeneurs d'animaux", singular: "promeneur d'animaux", article: "un", notes: "notés" },
};

/**
 * Renvoie le phrasé de listing (pluriel, singulier, article, accord) pour une
 * catégorie. Override explicite si dispo (services), sinon fallback BTP.
 */
export function getCategoryListing(categorySlug: string, categoryName: string): CategoryListing {
  const o = CATEGORY_LISTING_OVERRIDES[categorySlug];
  if (o) return o;
  const article = getCategoryArticle(categoryName);
  return {
    plural: pluralizeCategoryName(categoryName),
    singular: categoryName.toLowerCase().trim(),
    article,
    notes: article === "une" ? "notées" : "notés",
  };
}

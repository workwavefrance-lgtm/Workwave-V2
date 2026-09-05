/**
 * Utils pour formater les donnees Sirene v3 (codes INSEE) en labels
 * lisibles pour l'affichage sur les fiches pros.
 */

// Codes officiels INSEE pour la tranche d'effectif salarie
// https://www.insee.fr/fr/information/2114043
// 17/08/2026 : le code "NN" (effectif non renseigne) N'EST PLUS ici.
// Il concerne 92 % des fiches, et affichait "Effectif inconnu" a l'identique
// sur 2,3 millions de pages. C'est du texte dupliqué qui n'apprend rien au
// lecteur et qui aggrave le probleme d'indexation mesure ce jour-la
// (218 870 pages en "exploree, actuellement non indexee"). Absent de la
// table, `formatEffectifRange` renvoie null et le bloc entier disparait,
// y compris dans les donnees structurees ou `numberOfEmployees` valait
// "Effectif inconnu".
const EFFECTIF_LABELS: Record<string, string> = {
  "00": "0 salarié",
  "01": "1 ou 2 salariés",
  "02": "3 à 5 salariés",
  "03": "6 à 9 salariés",
  "11": "10 à 19 salariés",
  "12": "20 à 49 salariés",
  "21": "50 à 99 salariés",
  "22": "100 à 199 salariés",
  "31": "200 à 249 salariés",
  "32": "250 à 499 salariés",
  "41": "500 à 999 salariés",
  "42": "1 000 à 1 999 salariés",
  "51": "2 000 à 4 999 salariés",
  "52": "5 000 à 9 999 salariés",
  "53": "10 000 salariés et plus",
};

export function formatEffectifRange(code: string | null | undefined): string | null {
  if (!code) return null;
  return EFFECTIF_LABELS[code] || null;
}

/**
 * Renvoie l'annee de creation depuis une date complete YYYY-MM-DD,
 * ou null si pas de date. Utilise pour afficher "Entreprise creee en 2008".
 */
export function formatFoundingYear(date: string | null | undefined): string | null {
  if (!dateSireneUtilisable(date)) return null;
  date = date as string;
  const year = date.slice(0, 4);
  if (!/^\d{4}$/.test(year)) return null;
  return year;
}

/**
 * Retourne le nombre d'annees depuis la creation, pour afficher
 * "Entreprise active depuis 17 ans" (signal d'experience).
 */
/**
 * 1900-01-01 est la date bouchon « inconnue » de l'INSEE. Mesure du
 * 05/09/2026 : 10 391 fiches actives la portent, dont 290 ecrites le jour
 * meme. Affichee telle quelle, elle produit « 126 ans d'activite », un fait
 * faux et visible. Une date anterieure a 1901 est donc traitee comme absente.
 */
const ANNEE_MINIMUM = 1901;

export function dateSireneUtilisable(date: string | null | undefined): boolean {
  if (!date) return false;
  const annee = parseInt(date.slice(0, 4), 10);
  return !isNaN(annee) && annee >= ANNEE_MINIMUM;
}

export function formatAgeYears(date: string | null | undefined): number | null {
  if (!dateSireneUtilisable(date)) return null;
  const year = parseInt(date!.slice(0, 4), 10);
  if (isNaN(year)) return null;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  return age >= 0 ? age : null;
}

const MOIS = ["janvier","février","mars","avril","mai","juin",
              "juillet","août","septembre","octobre","novembre","décembre"];

/**
 * Date de creation en toutes lettres : "12 mars 2009", ou null.
 *
 * Pourquoi la date COMPLETE et pas seulement l'annee (20/08/2026) : la cause
 * mesuree de notre non-indexation est le texte partage entre fiches voisines.
 * Sur un groupe de 40 artisans du meme metier dans la meme ville, on compte
 * 24 annees de creation distinctes, mais 300 jours calendaires distincts pour
 * 1000 fiches. La date exacte est donc le fait gratuit le PLUS discriminant
 * dont on dispose, et il est renseigne sur 93,8 % des fiches actives.
 */
export function formatDateCreation(date: string | null | undefined): string | null {
  if (!date) return null;
  const m = String(date).slice(0, 10).match(/^(\d{4})-(\d{2})-(\d{2})$/);
  if (!m) return null;
  const [, a, mo, j] = m;
  const mois = MOIS[parseInt(mo, 10) - 1];
  if (!mois) return null;
  const jour = parseInt(j, 10);
  if (!jour || jour > 31) return null;
  return `${jour === 1 ? "1er" : jour} ${mois} ${a}`;
}

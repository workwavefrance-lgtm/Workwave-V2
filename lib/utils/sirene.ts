/**
 * Utils pour formater les donnees Sirene v3 (codes INSEE) en labels
 * lisibles pour l'affichage sur les fiches pros.
 */

// Codes officiels INSEE pour la tranche d'effectif salarie
// https://www.insee.fr/fr/information/2114043
const EFFECTIF_LABELS: Record<string, string> = {
  NN: "Effectif inconnu",
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
  if (!date) return null;
  const year = date.slice(0, 4);
  if (!/^\d{4}$/.test(year)) return null;
  return year;
}

/**
 * Retourne le nombre d'annees depuis la creation, pour afficher
 * "Entreprise active depuis 17 ans" (signal d'experience).
 */
export function formatAgeYears(date: string | null | undefined): number | null {
  if (!date) return null;
  const year = parseInt(date.slice(0, 4), 10);
  if (isNaN(year)) return null;
  const currentYear = new Date().getFullYear();
  const age = currentYear - year;
  return age >= 0 ? age : null;
}

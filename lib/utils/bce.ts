/**
 * Numéro d'entreprise belge (BCE/KBO) — validation et formatage.
 *
 * Format : 10 chiffres, commence par 0 ou 1 (ex. 1016514072).
 * Checksum officiel mod 97 : les 2 derniers chiffres = 97 − (8 premiers % 97).
 * Affiché en Belgique sous la forme "1016.514.072" (ou "BE 1016.514.072" TVA).
 *
 * Stockage Workwave : le numéro BCE (10 chiffres) va dans pros.siret
 * (varchar(14), UNIQUE) — aucune collision possible avec un SIRET français
 * (toujours 14 chiffres). pros.siren reste NULL pour les pros belges.
 */

/** Nettoie une saisie utilisateur : garde les chiffres uniquement. */
export function cleanBce(input: string): string {
  return (input || "").replace(/\D/g, "");
}

/** Valide un numéro d'entreprise BCE (10 chiffres + checksum mod 97). */
export function isValidBce(input: string): boolean {
  const n = cleanBce(input);
  if (!/^[01]\d{9}$/.test(n)) return false;
  const body = parseInt(n.slice(0, 8), 10);
  const check = parseInt(n.slice(8, 10), 10);
  return 97 - (body % 97) === check;
}

/** Formate pour l'affichage : "1016514072" → "1016.514.072". */
export function formatBce(input: string): string {
  const n = cleanBce(input);
  if (n.length !== 10) return input;
  return `${n.slice(0, 4)}.${n.slice(4, 7)}.${n.slice(7, 10)}`;
}

/** URL de la fiche officielle au registre BCE Public Search (consultation unitaire). */
export function bcePublicSearchUrl(bce: string): string {
  return `https://kbopub.economie.fgov.be/kbopub/toonondernemingps.html?ondernemingsnummer=${cleanBce(bce)}&lang=fr`;
}

/**
 * Détecte le pays d'un identifiant d'entreprise saisi : 14 chiffres = SIRET
 * français, 10 chiffres = BCE belge. null si ni l'un ni l'autre.
 */
export function detectCompanyIdCountry(input: string): "FR" | "BE" | null {
  const n = cleanBce(input);
  if (n.length === 14) return "FR";
  if (n.length === 10) return "BE";
  return null;
}

/** Réduit les titres sans couper un mot, une ville ou une information utile. */
export function blogSearchTitle(title: string): string {
  return title
    .replace(/\s*\|\s*Workwave(?:\.fr)?\s*$/i, "")
    .replace(/\s*[:—–-]\s*le guide complet pour bien choisir votre artisan en (\d{4})$/i, " : conseils et devis $1")
    .replace(/\s*[:—–-]\s*le guide complet$/i, "")
    .trim();
}

/** Corrige uniquement la phrase de comptage connue du contenu historique.
 * Les prix, surfaces, dates et autres chiffres du texte restent intacts. */
export function synchronizeListingCount(content: string, count: number): string {
  return content.replace(
    /Avec [\d\s\u202f]+ professionnels référencés sur la zone/g,
    `Avec ${count} professionnel${count === 1 ? "" : "s"} référencé${count === 1 ? "" : "s"} sur la zone`,
  );
}

// Baromètre artisans Belgique francophone (Wallonie + Bruxelles) par province.
// Généré le 2026-09-05 par scripts/build-barometre-be.ts. Pros = BCE (notre base),
// population = somme des communes (Statbel). 0 invention.

export type BeProvince = { rank: number; code: string; name: string; region: string; pros: number; population: number; densite: number };

export const BAROMETRE_BE: BeProvince[] = [
  {
    "code": "WBR",
    "name": "Brabant wallon",
    "region": "Wallonie",
    "pros": 12907,
    "population": 415381,
    "densite": 310.7,
    "rank": 1
  },
  {
    "code": "BRU",
    "name": "Bruxelles-Capitale",
    "region": "Bruxelles-Capitale",
    "pros": 35488,
    "population": 1255795,
    "densite": 282.6,
    "rank": 2
  },
  {
    "code": "WNA",
    "name": "Namur",
    "region": "Wallonie",
    "pros": 14057,
    "population": 505348,
    "densite": 278.2,
    "rank": 3
  },
  {
    "code": "WLX",
    "name": "Luxembourg belge",
    "region": "Wallonie",
    "pros": 7777,
    "population": 296008,
    "densite": 262.7,
    "rank": 4
  },
  {
    "code": "WLG",
    "name": "Liège",
    "region": "Wallonie",
    "pros": 23799,
    "population": 1043388,
    "densite": 228.1,
    "rank": 5
  },
  {
    "code": "WHT",
    "name": "Hainaut",
    "region": "Wallonie",
    "pros": 26715,
    "population": 1365328,
    "densite": 195.7,
    "rank": 6
  }
];

export const BAROMETRE_BE_META = { totalPros: 120743, nbProvinces: 6, generatedAt: "2026-09-05", prosSource: "Banque-Carrefour des Entreprises (BCE)", popSource: "Statbel (population des communes)" };

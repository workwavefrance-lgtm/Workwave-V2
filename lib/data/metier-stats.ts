// Stats REELLES par metier issues de notre base : nombre de fiches OUVERTES
// (etablissements non fermes d'apres le registre Sirene, regle FILTRE_OUVERTS).
// Genere le 2026-09-05 par scripts/build-metier-stats.ts (donnees : extraction).
// A relancer apres chaque scrape ou classement Sirene. Donnee unique : 0 invention.

export const METIER_STATS: Record<string, number> = {
  "accompagnement-handicap": 3369,
  "accompagnement-post-partum": 0,
  "aide-administrative": 38601,
  "aide-seniors": 15326,
  "architecte": 45284,
  "ascensoriste": 0,
  "assistance-informatique": 1,
  "carreleur": 35210,
  "charpentier": 14650,
  "chauffagiste": 37426,
  "climaticien": 2703,
  "coach-sportif": 0,
  "coiffure-domicile": 0,
  "cours-musique": 0,
  "cours-particuliers": 3794,
  "couture-retouches": 0,
  "couvreur": 35284,
  "cuisinier-a-domicile": 0,
  "cuisiniste": 11365,
  "debarras": 16490,
  "decorateur-interieur": 25844,
  "demenagement": 7073,
  "depannage-electromenager": 2984,
  "diagnostic-immobilier": 12085,
  "elagueur": 27310,
  "electricien": 94490,
  "esthetique-domicile": 0,
  "facadier": 10049,
  "garde-animaux": 35134,
  "garde-enfants": 19636,
  "livraison-de-courses": 28384,
  "macon": 105335,
  "manutention": 0,
  "massage-bien-etre": 0,
  "menage": 48881,
  "menuisier": 82061,
  "montage-meubles": 0,
  "multiservice": 2,
  "naturopathe": 1,
  "nettoyage-pro": 5581,
  "nettoyage-vitres": 13402,
  "paysagiste": 66564,
  "peintre": 69620,
  "petit-bricolage": 15761,
  "pisciniste": 6024,
  "plaquiste": 46334,
  "plombier": 54988,
  "promenade-animaux": 0,
  "psychopraticien": 5,
  "ramoneur": 5910,
  "repassage": 11038,
  "serrurier": 1110,
  "soutien-scolaire": 51939,
  "terrassier": 42336,
  "traitement-nuisibles": 0,
  "videosurveillance-installateur": 5527,
  "vitrier": 1036
};

/**
 * Etat Sirene par metier, France uniquement (fichiers Stock Sirene (INSEE), classement du 03/09/2026) :
 * fiches dont l'etat est verifie, etablissements fermes, entreprises disparues
 * (etablissement ferme ET unite legale cessee). Les fiches belges (BCE) et celles
 * absentes des fichiers Stock n'ont pas d'etat connu : hors denominateur.
 * Aucun taux a publier sous 200 fiches verifiees (ETATS_META.seuilTaux).
 */
export const METIER_ETATS: Record<string, { verifies: number; fermes: number; disparus: number }> = {
  "accompagnement-handicap": {
    "verifies": 6488,
    "fermes": 3120,
    "disparus": 2139
  },
  "aide-administrative": {
    "verifies": 66308,
    "fermes": 27724,
    "disparus": 20239
  },
  "aide-seniors": {
    "verifies": 37589,
    "fermes": 22267,
    "disparus": 13692
  },
  "architecte": {
    "verifies": 70380,
    "fermes": 34199,
    "disparus": 21163
  },
  "assistance-informatique": {
    "verifies": 1,
    "fermes": 0,
    "disparus": 0
  },
  "carreleur": {
    "verifies": 71707,
    "fermes": 39176,
    "disparus": 27118
  },
  "charpentier": {
    "verifies": 33249,
    "fermes": 18599,
    "disparus": 12223
  },
  "chauffagiste": {
    "verifies": 62730,
    "fermes": 30511,
    "disparus": 19156
  },
  "climaticien": {
    "verifies": 5453,
    "fermes": 2750,
    "disparus": 1328
  },
  "cours-particuliers": {
    "verifies": 9033,
    "fermes": 5240,
    "disparus": 3721
  },
  "couvreur": {
    "verifies": 60096,
    "fermes": 29493,
    "disparus": 18534
  },
  "cuisiniste": {
    "verifies": 35066,
    "fermes": 23701,
    "disparus": 15311
  },
  "debarras": {
    "verifies": 37191,
    "fermes": 20703,
    "disparus": 13717
  },
  "decorateur-interieur": {
    "verifies": 63961,
    "fermes": 38117,
    "disparus": 27264
  },
  "demenagement": {
    "verifies": 9347,
    "fermes": 5985,
    "disparus": 3649
  },
  "depannage-electromenager": {
    "verifies": 7865,
    "fermes": 4881,
    "disparus": 3579
  },
  "diagnostic-immobilier": {
    "verifies": 25200,
    "fermes": 13115,
    "disparus": 7718
  },
  "elagueur": {
    "verifies": 32748,
    "fermes": 5440,
    "disparus": 3568
  },
  "electricien": {
    "verifies": 135071,
    "fermes": 55130,
    "disparus": 38150
  },
  "facadier": {
    "verifies": 19654,
    "fermes": 12022,
    "disparus": 7887
  },
  "garde-animaux": {
    "verifies": 85825,
    "fermes": 50697,
    "disparus": 35828
  },
  "garde-enfants": {
    "verifies": 30181,
    "fermes": 10551,
    "disparus": 6806
  },
  "livraison-de-courses": {
    "verifies": 76892,
    "fermes": 48520,
    "disparus": 41174
  },
  "macon": {
    "verifies": 149316,
    "fermes": 59649,
    "disparus": 41476
  },
  "menage": {
    "verifies": 83001,
    "fermes": 41481,
    "disparus": 30206
  },
  "menuisier": {
    "verifies": 149016,
    "fermes": 76101,
    "disparus": 52536
  },
  "multiservice": {
    "verifies": 2,
    "fermes": 0,
    "disparus": 0
  },
  "naturopathe": {
    "verifies": 1,
    "fermes": 0,
    "disparus": 0
  },
  "nettoyage-pro": {
    "verifies": 10964,
    "fermes": 5383,
    "disparus": 3245
  },
  "nettoyage-vitres": {
    "verifies": 32676,
    "fermes": 19275,
    "disparus": 12241
  },
  "paysagiste": {
    "verifies": 88180,
    "fermes": 40356,
    "disparus": 25577
  },
  "peintre": {
    "verifies": 120824,
    "fermes": 53530,
    "disparus": 36734
  },
  "petit-bricolage": {
    "verifies": 45960,
    "fermes": 30201,
    "disparus": 21957
  },
  "pisciniste": {
    "verifies": 15620,
    "fermes": 9596,
    "disparus": 6013
  },
  "plaquiste": {
    "verifies": 78968,
    "fermes": 42385,
    "disparus": 29170
  },
  "plombier": {
    "verifies": 100020,
    "fermes": 47455,
    "disparus": 33658
  },
  "psychopraticien": {
    "verifies": 7,
    "fermes": 2,
    "disparus": 1
  },
  "ramoneur": {
    "verifies": 14176,
    "fermes": 8267,
    "disparus": 5607
  },
  "repassage": {
    "verifies": 27888,
    "fermes": 16850,
    "disparus": 12541
  },
  "serrurier": {
    "verifies": 2343,
    "fermes": 1233,
    "disparus": 693
  },
  "soutien-scolaire": {
    "verifies": 127213,
    "fermes": 75287,
    "disparus": 52116
  },
  "terrassier": {
    "verifies": 62787,
    "fermes": 32734,
    "disparus": 22149
  },
  "videosurveillance-installateur": {
    "verifies": 13753,
    "fermes": 8226,
    "disparus": 5048
  },
  "vitrier": {
    "verifies": 851,
    "fermes": 555,
    "disparus": 373
  }
};

export const ETATS_META = {
  source: "fichiers Stock Sirene (INSEE), classement du 03/09/2026",
  classementDu: "2026-09-03",
  seuilTaux: 200,
  // France, 3 verticaux (batiment, services a domicile, aide a la personne)
  verifies: 2105601,
  fermes: 1070507,
  disparus: 735305,
  partFermes: 50.8,
  partDisparus: 34.9,
};

export const COVERAGE = {
  departments: 107,
  communes: 35163,
  totalPros: 1155947, // fiches ouvertes, 3 verticaux, France + Belgique
  retrievedAt: "2026-09-05",
};

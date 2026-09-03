// Stats REELLES par metier issues de notre base : nombre de fiches OUVERTES
// (etablissements non fermes d'apres le registre Sirene, regle FILTRE_OUVERTS).
// Genere le 2026-09-03 par scripts/build-metier-stats.ts (donnees : extraction).
// A relancer apres chaque scrape ou classement Sirene. Donnee unique : 0 invention.

export const METIER_STATS: Record<string, number> = {
  "accompagnement-handicap": 3369,
  "accompagnement-post-partum": 0,
  "aide-administrative": 38601,
  "aide-seniors": 15326,
  "architecte": 26989,
  "ascensoriste": 0,
  "assistance-informatique": 1,
  "carreleur": 23586,
  "charpentier": 13545,
  "chauffagiste": 26227,
  "climaticien": 2703,
  "coach-sportif": 0,
  "coiffure-domicile": 0,
  "cours-musique": 0,
  "cours-particuliers": 3794,
  "couture-retouches": 0,
  "couvreur": 29121,
  "cuisinier-a-domicile": 0,
  "cuisiniste": 10182,
  "debarras": 16490,
  "decorateur-interieur": 9348,
  "demenagement": 7073,
  "depannage-electromenager": 2984,
  "diagnostic-immobilier": 7970,
  "elagueur": 24916,
  "electricien": 48259,
  "esthetique-domicile": 0,
  "facadier": 9474,
  "garde-animaux": 35134,
  "garde-enfants": 19636,
  "livraison-de-courses": 28384,
  "macon": 47840,
  "manutention": 0,
  "massage-bien-etre": 0,
  "menage": 48881,
  "menuisier": 57492,
  "montage-meubles": 0,
  "multiservice": 2,
  "naturopathe": 1,
  "nettoyage-pro": 5581,
  "nettoyage-vitres": 13402,
  "paysagiste": 53329,
  "peintre": 30720,
  "petit-bricolage": 15761,
  "pisciniste": 5869,
  "plaquiste": 33554,
  "plombier": 30701,
  "promenade-animaux": 0,
  "psychopraticien": 5,
  "ramoneur": 5606,
  "repassage": 11038,
  "serrurier": 1110,
  "soutien-scolaire": 51939,
  "terrassier": 38425,
  "traitement-nuisibles": 0,
  "videosurveillance-installateur": 5253,
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
    "verifies": 52085,
    "fermes": 34199,
    "disparus": 21163
  },
  "assistance-informatique": {
    "verifies": 1,
    "fermes": 0,
    "disparus": 0
  },
  "carreleur": {
    "verifies": 60083,
    "fermes": 39176,
    "disparus": 27118
  },
  "charpentier": {
    "verifies": 32144,
    "fermes": 18599,
    "disparus": 12223
  },
  "chauffagiste": {
    "verifies": 51531,
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
    "verifies": 53933,
    "fermes": 29493,
    "disparus": 18534
  },
  "cuisiniste": {
    "verifies": 33883,
    "fermes": 23701,
    "disparus": 15311
  },
  "debarras": {
    "verifies": 37191,
    "fermes": 20703,
    "disparus": 13717
  },
  "decorateur-interieur": {
    "verifies": 47465,
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
    "verifies": 21085,
    "fermes": 13115,
    "disparus": 7718
  },
  "elagueur": {
    "verifies": 30354,
    "fermes": 5440,
    "disparus": 3568
  },
  "electricien": {
    "verifies": 88840,
    "fermes": 55130,
    "disparus": 38150
  },
  "facadier": {
    "verifies": 19079,
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
    "verifies": 91821,
    "fermes": 59649,
    "disparus": 41476
  },
  "menage": {
    "verifies": 83001,
    "fermes": 41481,
    "disparus": 30206
  },
  "menuisier": {
    "verifies": 124447,
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
    "verifies": 74945,
    "fermes": 40356,
    "disparus": 25577
  },
  "peintre": {
    "verifies": 81925,
    "fermes": 53530,
    "disparus": 36734
  },
  "petit-bricolage": {
    "verifies": 45960,
    "fermes": 30201,
    "disparus": 21957
  },
  "pisciniste": {
    "verifies": 15465,
    "fermes": 9596,
    "disparus": 6013
  },
  "plaquiste": {
    "verifies": 66188,
    "fermes": 42385,
    "disparus": 29170
  },
  "plombier": {
    "verifies": 75733,
    "fermes": 47455,
    "disparus": 33658
  },
  "psychopraticien": {
    "verifies": 7,
    "fermes": 2,
    "disparus": 1
  },
  "ramoneur": {
    "verifies": 13872,
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
    "verifies": 58876,
    "fermes": 32734,
    "disparus": 22149
  },
  "videosurveillance-installateur": {
    "verifies": 13479,
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
  verifies: 1810312,
  fermes: 1070507,
  disparus: 735305,
  partFermes: 59.1,
  partDisparus: 40.6,
};

export const COVERAGE = {
  departments: 107,
  communes: 35163,
  totalPros: 860657, // fiches ouvertes, 3 verticaux, France + Belgique
  retrievedAt: "2026-09-03",
};

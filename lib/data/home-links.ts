/**
 * Genere par scripts/build-home-links.ts. NE PAS editer a la main.
 *
 * Pour chaque categorie, un departement qui a au moins 3 professionnels
 * OUVERTS. `null` quand la categorie n'en a nulle part : la page d'accueil
 * pointe alors vers la page racine du metier, jamais vers une page vide.
 *
 * Pourquoi ce fichier existe : le 06/09/2026, l'accueil renvoyait vers
 * /montage-meubles/calvados-14, /coach-sportif/bouches-du-rhone-13 et
 * /cours-musique/cantal-15, trois pages vides, parce qu'il choisissait le
 * departement par simple rotation sans verifier qu'il y avait quelqu'un.
 *
 * 16 categorie(s) sans aucun departement fourni :
 * multiservice, montage-meubles, manutention, coiffure-domicile, esthetique-domicile, couture-retouches, cours-musique, coach-sportif, assistance-informatique, promenade-animaux, traitement-nuisibles, naturopathe, massage-bien-etre, accompagnement-post-partum, cuisinier-a-domicile, psychopraticien
 */
export const DEPT_PAR_CATEGORIE: Record<string, string | null> = {
  "plombier": "aisne-02",
  "electricien": "ariege-09",
  "macon": "charente-16",
  "peintre": "creuse-23",
  "menuisier": "corse-du-sud-2a",
  "carreleur": "ille-et-vilaine-35",
  "plaquiste": "loire-42",
  "couvreur": "maine-et-loire-49",
  "charpentier": "morbihan-56",
  "facadier": "puy-de-dome-63",
  "serrurier": "saone-et-loire-71",
  "chauffagiste": "seine-et-marne-77",
  "climaticien": "vaucluse-84",
  "terrassier": "essonne-91",
  "paysagiste": "guyane-973",
  "elagueur": "ain-01",
  "architecte": "alpes-maritimes-06",
  "decorateur-interieur": "bouches-du-rhone-13",
  "menage": "cote-d-or-21",
  "repassage": "eure-et-loir-28",
  "petit-bricolage": "gironde-33",
  "nettoyage-vitres": "landes-40",
  "debarras": "lot-et-garonne-47",
  "demenagement": "meurthe-et-moselle-54",
  "livraison-de-courses": "orne-61",
  "garde-enfants": "haut-rhin-68",
  "soutien-scolaire": "paris-75",
  "aide-seniors": "tarn-et-garonne-82",
  "aide-administrative": "yonne-89",
  "cours-particuliers": "charente-16",
  "accompagnement-handicap": "ain-01",
  "garde-animaux": "alpes-de-haute-provence-04",
  "pisciniste": "aude-11",
  "vitrier": "cher-18",
  "ramoneur": "drome-26",
  "videosurveillance-installateur": "haute-garonne-31",
  "nettoyage-pro": "isere-38",
  "cuisiniste": "loiret-45",
  "multiservice": null,
  "montage-meubles": null,
  "manutention": null,
  "coiffure-domicile": null,
  "esthetique-domicile": null,
  "couture-retouches": null,
  "cours-musique": null,
  "coach-sportif": null,
  "assistance-informatique": null,
  "promenade-animaux": null,
  "traitement-nuisibles": null,
  "ascensoriste": "dordogne-24",
  "diagnostic-immobilier": "haute-corse-2b",
  "depannage-electromenager": "indre-36",
  "naturopathe": null,
  "massage-bien-etre": null,
  "accompagnement-post-partum": null,
  "cuisinier-a-domicile": null,
  "psychopraticien": null
};

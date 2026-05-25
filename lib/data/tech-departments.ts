/**
 * Liste des 95 departements de France metropolitaine + Corse (2A, 2B)
 * + 5 DOM (Guadeloupe, Martinique, Guyane, Reunion, Mayotte).
 *
 * Utilise par /ai/[skill]/dept/[dept] pour le SEO programmatic departement.
 * Slug = code dept (75, 69, 2A, etc.) pour URL courte.
 *
 * Population : INSEE 2024 (estimation), source publique
 * https://www.insee.fr/fr/statistiques/2012713
 */
export type TechDepartment = {
  code: string;
  name: string;
  region: string;
  population: number;
};

export const TECH_DEPARTMENTS: TechDepartment[] = [
  { code: "01", name: "Ain", region: "Auvergne-Rhone-Alpes", population: 663_000 },
  { code: "02", name: "Aisne", region: "Hauts-de-France", population: 526_000 },
  { code: "03", name: "Allier", region: "Auvergne-Rhone-Alpes", population: 332_000 },
  { code: "04", name: "Alpes-de-Haute-Provence", region: "Provence-Alpes-Cote-d-Azur", population: 166_000 },
  { code: "05", name: "Hautes-Alpes", region: "Provence-Alpes-Cote-d-Azur", population: 141_000 },
  { code: "06", name: "Alpes-Maritimes", region: "Provence-Alpes-Cote-d-Azur", population: 1_094_000 },
  { code: "07", name: "Ardeche", region: "Auvergne-Rhone-Alpes", population: 327_000 },
  { code: "08", name: "Ardennes", region: "Grand Est", population: 268_000 },
  { code: "09", name: "Ariege", region: "Occitanie", population: 154_000 },
  { code: "10", name: "Aube", region: "Grand Est", population: 309_000 },
  { code: "11", name: "Aude", region: "Occitanie", population: 374_000 },
  { code: "12", name: "Aveyron", region: "Occitanie", population: 280_000 },
  { code: "13", name: "Bouches-du-Rhone", region: "Provence-Alpes-Cote-d-Azur", population: 2_059_000 },
  { code: "14", name: "Calvados", region: "Normandie", population: 698_000 },
  { code: "15", name: "Cantal", region: "Auvergne-Rhone-Alpes", population: 144_000 },
  { code: "16", name: "Charente", region: "Nouvelle-Aquitaine", population: 354_000 },
  { code: "17", name: "Charente-Maritime", region: "Nouvelle-Aquitaine", population: 651_000 },
  { code: "18", name: "Cher", region: "Centre-Val de Loire", population: 300_000 },
  { code: "19", name: "Correze", region: "Nouvelle-Aquitaine", population: 240_000 },
  { code: "2A", name: "Corse-du-Sud", region: "Corse", population: 159_000 },
  { code: "2B", name: "Haute-Corse", region: "Corse", population: 187_000 },
  { code: "21", name: "Cote-d-Or", region: "Bourgogne-Franche-Comte", population: 535_000 },
  { code: "22", name: "Cotes-d-Armor", region: "Bretagne", population: 599_000 },
  { code: "23", name: "Creuse", region: "Nouvelle-Aquitaine", population: 116_000 },
  { code: "24", name: "Dordogne", region: "Nouvelle-Aquitaine", population: 414_000 },
  { code: "25", name: "Doubs", region: "Bourgogne-Franche-Comte", population: 543_000 },
  { code: "26", name: "Drome", region: "Auvergne-Rhone-Alpes", population: 514_000 },
  { code: "27", name: "Eure", region: "Normandie", population: 599_000 },
  { code: "28", name: "Eure-et-Loir", region: "Centre-Val de Loire", population: 430_000 },
  { code: "29", name: "Finistere", region: "Bretagne", population: 909_000 },
  { code: "30", name: "Gard", region: "Occitanie", population: 750_000 },
  { code: "31", name: "Haute-Garonne", region: "Occitanie", population: 1_416_000 },
  { code: "32", name: "Gers", region: "Occitanie", population: 192_000 },
  { code: "33", name: "Gironde", region: "Nouvelle-Aquitaine", population: 1_634_000 },
  { code: "34", name: "Herault", region: "Occitanie", population: 1_186_000 },
  { code: "35", name: "Ille-et-Vilaine", region: "Bretagne", population: 1_088_000 },
  { code: "36", name: "Indre", region: "Centre-Val de Loire", population: 219_000 },
  { code: "37", name: "Indre-et-Loire", region: "Centre-Val de Loire", population: 612_000 },
  { code: "38", name: "Isere", region: "Auvergne-Rhone-Alpes", population: 1_271_000 },
  { code: "39", name: "Jura", region: "Bourgogne-Franche-Comte", population: 259_000 },
  { code: "40", name: "Landes", region: "Nouvelle-Aquitaine", population: 415_000 },
  { code: "41", name: "Loir-et-Cher", region: "Centre-Val de Loire", population: 331_000 },
  { code: "42", name: "Loire", region: "Auvergne-Rhone-Alpes", population: 765_000 },
  { code: "43", name: "Haute-Loire", region: "Auvergne-Rhone-Alpes", population: 228_000 },
  { code: "44", name: "Loire-Atlantique", region: "Pays de la Loire", population: 1_437_000 },
  { code: "45", name: "Loiret", region: "Centre-Val de Loire", population: 681_000 },
  { code: "46", name: "Lot", region: "Occitanie", population: 174_000 },
  { code: "47", name: "Lot-et-Garonne", region: "Nouvelle-Aquitaine", population: 332_000 },
  { code: "48", name: "Lozere", region: "Occitanie", population: 76_000 },
  { code: "49", name: "Maine-et-Loire", region: "Pays de la Loire", population: 819_000 },
  { code: "50", name: "Manche", region: "Normandie", population: 497_000 },
  { code: "51", name: "Marne", region: "Grand Est", population: 565_000 },
  { code: "52", name: "Haute-Marne", region: "Grand Est", population: 174_000 },
  { code: "53", name: "Mayenne", region: "Pays de la Loire", population: 307_000 },
  { code: "54", name: "Meurthe-et-Moselle", region: "Grand Est", population: 731_000 },
  { code: "55", name: "Meuse", region: "Grand Est", population: 184_000 },
  { code: "56", name: "Morbihan", region: "Bretagne", population: 762_000 },
  { code: "57", name: "Moselle", region: "Grand Est", population: 1_046_000 },
  { code: "58", name: "Nievre", region: "Bourgogne-Franche-Comte", population: 206_000 },
  { code: "59", name: "Nord", region: "Hauts-de-France", population: 2_606_000 },
  { code: "60", name: "Oise", region: "Hauts-de-France", population: 826_000 },
  { code: "61", name: "Orne", region: "Normandie", population: 280_000 },
  { code: "62", name: "Pas-de-Calais", region: "Hauts-de-France", population: 1_465_000 },
  { code: "63", name: "Puy-de-Dome", region: "Auvergne-Rhone-Alpes", population: 660_000 },
  { code: "64", name: "Pyrenees-Atlantiques", region: "Nouvelle-Aquitaine", population: 690_000 },
  { code: "65", name: "Hautes-Pyrenees", region: "Occitanie", population: 228_000 },
  { code: "66", name: "Pyrenees-Orientales", region: "Occitanie", population: 482_000 },
  { code: "67", name: "Bas-Rhin", region: "Grand Est", population: 1_142_000 },
  { code: "68", name: "Haut-Rhin", region: "Grand Est", population: 768_000 },
  { code: "69", name: "Rhone", region: "Auvergne-Rhone-Alpes", population: 1_876_000 },
  { code: "70", name: "Haute-Saone", region: "Bourgogne-Franche-Comte", population: 234_000 },
  { code: "71", name: "Saone-et-Loire", region: "Bourgogne-Franche-Comte", population: 552_000 },
  { code: "72", name: "Sarthe", region: "Pays de la Loire", population: 567_000 },
  { code: "73", name: "Savoie", region: "Auvergne-Rhone-Alpes", population: 437_000 },
  { code: "74", name: "Haute-Savoie", region: "Auvergne-Rhone-Alpes", population: 836_000 },
  { code: "75", name: "Paris", region: "Ile-de-France", population: 2_133_000 },
  { code: "76", name: "Seine-Maritime", region: "Normandie", population: 1_249_000 },
  { code: "77", name: "Seine-et-Marne", region: "Ile-de-France", population: 1_426_000 },
  { code: "78", name: "Yvelines", region: "Ile-de-France", population: 1_447_000 },
  { code: "79", name: "Deux-Sevres", region: "Nouvelle-Aquitaine", population: 374_000 },
  { code: "80", name: "Somme", region: "Hauts-de-France", population: 568_000 },
  { code: "81", name: "Tarn", region: "Occitanie", population: 391_000 },
  { code: "82", name: "Tarn-et-Garonne", region: "Occitanie", population: 261_000 },
  { code: "83", name: "Var", region: "Provence-Alpes-Cote-d-Azur", population: 1_080_000 },
  { code: "84", name: "Vaucluse", region: "Provence-Alpes-Cote-d-Azur", population: 561_000 },
  { code: "85", name: "Vendee", region: "Pays de la Loire", population: 691_000 },
  { code: "86", name: "Vienne", region: "Nouvelle-Aquitaine", population: 437_000 },
  { code: "87", name: "Haute-Vienne", region: "Nouvelle-Aquitaine", population: 372_000 },
  { code: "88", name: "Vosges", region: "Grand Est", population: 360_000 },
  { code: "89", name: "Yonne", region: "Bourgogne-Franche-Comte", population: 333_000 },
  { code: "90", name: "Territoire de Belfort", region: "Bourgogne-Franche-Comte", population: 141_000 },
  { code: "91", name: "Essonne", region: "Ile-de-France", population: 1_321_000 },
  { code: "92", name: "Hauts-de-Seine", region: "Ile-de-France", population: 1_624_000 },
  { code: "93", name: "Seine-Saint-Denis", region: "Ile-de-France", population: 1_658_000 },
  { code: "94", name: "Val-de-Marne", region: "Ile-de-France", population: 1_407_000 },
  { code: "95", name: "Val-d-Oise", region: "Ile-de-France", population: 1_249_000 },
];

export function findDepartmentByCode(code: string): TechDepartment | undefined {
  return TECH_DEPARTMENTS.find((d) => d.code === code.toUpperCase());
}

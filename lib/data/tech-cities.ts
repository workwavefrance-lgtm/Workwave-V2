/**
 * Liste hardcodee des 30 plus grosses villes tech francaises pour le
 * SEO programmatique Workwave AI.
 *
 * Ordre : population + densite tech estimee. Paris en tete, puis grosses
 * metropoles, puis villes secondaires avec ecosystem tech (Grenoble, Sophia
 * Antipolis, Aix, etc.).
 *
 * Utilise par /ai/[skill]/[ville] pour generer 30 villes x 6 categories =
 * 180 pages SEO. Filtre les pros via postal_code LIKE '{prefix}%'.
 *
 * Le `dept_prefix` correspond au code departement (2 chiffres FR metropole,
 * 3 chiffres DOM). Sert au filtre LIKE postal_code.
 *
 * Le `slug` est utilise dans l'URL (ex. /ai/developpement-web/paris).
 */
export type TechCity = {
  slug: string;
  name: string;
  dept_prefix: string;
  dept_name: string;
  population: number;
};

export const TECH_CITIES: TechCity[] = [
  { slug: "paris", name: "Paris", dept_prefix: "75", dept_name: "Paris", population: 2_103_000 },
  { slug: "marseille", name: "Marseille", dept_prefix: "13", dept_name: "Bouches-du-Rhone", population: 877_000 },
  { slug: "lyon", name: "Lyon", dept_prefix: "69", dept_name: "Rhone", population: 522_000 },
  { slug: "toulouse", name: "Toulouse", dept_prefix: "31", dept_name: "Haute-Garonne", population: 504_000 },
  { slug: "nice", name: "Nice", dept_prefix: "06", dept_name: "Alpes-Maritimes", population: 343_000 },
  { slug: "nantes", name: "Nantes", dept_prefix: "44", dept_name: "Loire-Atlantique", population: 320_000 },
  { slug: "montpellier", name: "Montpellier", dept_prefix: "34", dept_name: "Herault", population: 299_000 },
  { slug: "strasbourg", name: "Strasbourg", dept_prefix: "67", dept_name: "Bas-Rhin", population: 285_000 },
  { slug: "bordeaux", name: "Bordeaux", dept_prefix: "33", dept_name: "Gironde", population: 260_000 },
  { slug: "lille", name: "Lille", dept_prefix: "59", dept_name: "Nord", population: 235_000 },
  { slug: "rennes", name: "Rennes", dept_prefix: "35", dept_name: "Ille-et-Vilaine", population: 220_000 },
  { slug: "reims", name: "Reims", dept_prefix: "51", dept_name: "Marne", population: 182_000 },
  { slug: "saint-etienne", name: "Saint-Etienne", dept_prefix: "42", dept_name: "Loire", population: 170_000 },
  { slug: "le-havre", name: "Le Havre", dept_prefix: "76", dept_name: "Seine-Maritime", population: 165_000 },
  { slug: "toulon", name: "Toulon", dept_prefix: "83", dept_name: "Var", population: 165_000 },
  { slug: "grenoble", name: "Grenoble", dept_prefix: "38", dept_name: "Isere", population: 158_000 },
  { slug: "dijon", name: "Dijon", dept_prefix: "21", dept_name: "Cote-d-Or", population: 156_000 },
  { slug: "angers", name: "Angers", dept_prefix: "49", dept_name: "Maine-et-Loire", population: 154_000 },
  { slug: "nimes", name: "Nimes", dept_prefix: "30", dept_name: "Gard", population: 148_000 },
  { slug: "villeurbanne", name: "Villeurbanne", dept_prefix: "69", dept_name: "Rhone", population: 148_000 },
  { slug: "clermont-ferrand", name: "Clermont-Ferrand", dept_prefix: "63", dept_name: "Puy-de-Dome", population: 145_000 },
  { slug: "le-mans", name: "Le Mans", dept_prefix: "72", dept_name: "Sarthe", population: 143_000 },
  { slug: "aix-en-provence", name: "Aix-en-Provence", dept_prefix: "13", dept_name: "Bouches-du-Rhone", population: 143_000 },
  { slug: "brest", name: "Brest", dept_prefix: "29", dept_name: "Finistere", population: 139_000 },
  { slug: "tours", name: "Tours", dept_prefix: "37", dept_name: "Indre-et-Loire", population: 137_000 },
  { slug: "amiens", name: "Amiens", dept_prefix: "80", dept_name: "Somme", population: 134_000 },
  { slug: "limoges", name: "Limoges", dept_prefix: "87", dept_name: "Haute-Vienne", population: 131_000 },
  { slug: "annecy", name: "Annecy", dept_prefix: "74", dept_name: "Haute-Savoie", population: 128_000 },
  { slug: "metz", name: "Metz", dept_prefix: "57", dept_name: "Moselle", population: 117_000 },
  { slug: "perpignan", name: "Perpignan", dept_prefix: "66", dept_name: "Pyrenees-Orientales", population: 118_000 },
];

export function findTechCityBySlug(slug: string): TechCity | undefined {
  return TECH_CITIES.find((c) => c.slug === slug);
}

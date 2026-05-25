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
  // ─── Extension 30 → 60 villes (Phase 9 bis SEO push) ──────────────────
  { slug: "boulogne-billancourt", name: "Boulogne-Billancourt", dept_prefix: "92", dept_name: "Hauts-de-Seine", population: 121_000 },
  { slug: "rouen", name: "Rouen", dept_prefix: "76", dept_name: "Seine-Maritime", population: 111_000 },
  { slug: "orleans", name: "Orleans", dept_prefix: "45", dept_name: "Loiret", population: 116_000 },
  { slug: "mulhouse", name: "Mulhouse", dept_prefix: "68", dept_name: "Haut-Rhin", population: 109_000 },
  { slug: "caen", name: "Caen", dept_prefix: "14", dept_name: "Calvados", population: 105_000 },
  { slug: "nancy", name: "Nancy", dept_prefix: "54", dept_name: "Meurthe-et-Moselle", population: 104_000 },
  { slug: "saint-denis", name: "Saint-Denis", dept_prefix: "93", dept_name: "Seine-Saint-Denis", population: 113_000 },
  { slug: "argenteuil", name: "Argenteuil", dept_prefix: "95", dept_name: "Val-d-Oise", population: 110_000 },
  { slug: "montreuil", name: "Montreuil", dept_prefix: "93", dept_name: "Seine-Saint-Denis", population: 110_000 },
  { slug: "roubaix", name: "Roubaix", dept_prefix: "59", dept_name: "Nord", population: 98_000 },
  { slug: "tourcoing", name: "Tourcoing", dept_prefix: "59", dept_name: "Nord", population: 97_000 },
  { slug: "nanterre", name: "Nanterre", dept_prefix: "92", dept_name: "Hauts-de-Seine", population: 96_000 },
  { slug: "vitry-sur-seine", name: "Vitry-sur-Seine", dept_prefix: "94", dept_name: "Val-de-Marne", population: 95_000 },
  { slug: "avignon", name: "Avignon", dept_prefix: "84", dept_name: "Vaucluse", population: 91_000 },
  { slug: "creteil", name: "Creteil", dept_prefix: "94", dept_name: "Val-de-Marne", population: 91_000 },
  { slug: "dunkerque", name: "Dunkerque", dept_prefix: "59", dept_name: "Nord", population: 87_000 },
  { slug: "poitiers", name: "Poitiers", dept_prefix: "86", dept_name: "Vienne", population: 89_000 },
  { slug: "asnieres-sur-seine", name: "Asnieres-sur-Seine", dept_prefix: "92", dept_name: "Hauts-de-Seine", population: 87_000 },
  { slug: "versailles", name: "Versailles", dept_prefix: "78", dept_name: "Yvelines", population: 85_000 },
  { slug: "courbevoie", name: "Courbevoie", dept_prefix: "92", dept_name: "Hauts-de-Seine", population: 84_000 },
  { slug: "pau", name: "Pau", dept_prefix: "64", dept_name: "Pyrenees-Atlantiques", population: 78_000 },
  { slug: "colombes", name: "Colombes", dept_prefix: "92", dept_name: "Hauts-de-Seine", population: 86_000 },
  { slug: "beziers", name: "Beziers", dept_prefix: "34", dept_name: "Herault", population: 80_000 },
  { slug: "cholet", name: "Cholet", dept_prefix: "49", dept_name: "Maine-et-Loire", population: 55_000 },
  { slug: "la-rochelle", name: "La Rochelle", dept_prefix: "17", dept_name: "Charente-Maritime", population: 78_000 },
  { slug: "calais", name: "Calais", dept_prefix: "62", dept_name: "Pas-de-Calais", population: 75_000 },
  { slug: "antibes", name: "Antibes", dept_prefix: "06", dept_name: "Alpes-Maritimes", population: 75_000 },
  { slug: "cannes", name: "Cannes", dept_prefix: "06", dept_name: "Alpes-Maritimes", population: 74_000 },
  { slug: "saint-nazaire", name: "Saint-Nazaire", dept_prefix: "44", dept_name: "Loire-Atlantique", population: 71_000 },
  { slug: "ajaccio", name: "Ajaccio", dept_prefix: "2A", dept_name: "Corse-du-Sud", population: 71_000 },
];

export function findTechCityBySlug(slug: string): TechCity | undefined {
  return TECH_CITIES.find((c) => c.slug === slug);
}

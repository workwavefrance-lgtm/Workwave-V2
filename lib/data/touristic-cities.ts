/**
 * Villes touristiques à forte demande de location saisonnière / Airbnb.
 *
 * Alimente les pages territoriales /menage/location-saisonniere/[ville].
 * Chaque entrée a été VÉRIFIÉE en base (script _touristic-cities.ts, 08/07/2026) :
 * slug réel dans `cities` + au moins 3 pros ménage/nettoyage/multiservice actifs
 * dans la commune. Pas de ville inventée, pas de slug deviné.
 *
 * `zone` = regroupement éditorial (contexte + maillage interne).
 * `kind`  = "mer" (littoral) | "montagne" | "ville" (métropole touristique).
 */
export type TouristicCity = {
  slug: string;
  name: string;
  dept: string;
  zone: string;
  kind: "mer" | "montagne" | "ville";
};

export const TOURISTIC_CITIES: TouristicCity[] = [
  // ─── Côte d'Azur ───
  { slug: "nice", name: "Nice", dept: "06", zone: "Côte d'Azur", kind: "mer" },
  { slug: "cannes", name: "Cannes", dept: "06", zone: "Côte d'Azur", kind: "mer" },
  { slug: "antibes", name: "Antibes", dept: "06", zone: "Côte d'Azur", kind: "mer" },
  { slug: "menton", name: "Menton", dept: "06", zone: "Côte d'Azur", kind: "mer" },
  { slug: "grasse", name: "Grasse", dept: "06", zone: "Côte d'Azur", kind: "ville" },
  { slug: "cagnes-sur-mer", name: "Cagnes-sur-Mer", dept: "06", zone: "Côte d'Azur", kind: "mer" },
  { slug: "saint-raphael-83", name: "Saint-Raphaël", dept: "83", zone: "Côte d'Azur", kind: "mer" },
  { slug: "frejus", name: "Fréjus", dept: "83", zone: "Côte d'Azur", kind: "mer" },
  // ─── Golfe de Saint-Tropez & Var ───
  { slug: "sainte-maxime", name: "Sainte-Maxime", dept: "83", zone: "Golfe de Saint-Tropez", kind: "mer" },
  { slug: "saint-tropez", name: "Saint-Tropez", dept: "83", zone: "Golfe de Saint-Tropez", kind: "mer" },
  { slug: "cavalaire-sur-mer", name: "Cavalaire-sur-Mer", dept: "83", zone: "Golfe de Saint-Tropez", kind: "mer" },
  { slug: "le-lavandou", name: "Le Lavandou", dept: "83", zone: "Var littoral", kind: "mer" },
  { slug: "hyeres", name: "Hyères", dept: "83", zone: "Var littoral", kind: "mer" },
  { slug: "bandol", name: "Bandol", dept: "83", zone: "Var littoral", kind: "mer" },
  { slug: "toulon", name: "Toulon", dept: "83", zone: "Var littoral", kind: "ville" },
  // ─── Provence & Bouches-du-Rhône ───
  { slug: "cassis", name: "Cassis", dept: "13", zone: "Provence", kind: "mer" },
  { slug: "la-ciotat", name: "La Ciotat", dept: "13", zone: "Provence", kind: "mer" },
  { slug: "marseille", name: "Marseille", dept: "13", zone: "Provence", kind: "ville" },
  { slug: "aix-en-provence", name: "Aix-en-Provence", dept: "13", zone: "Provence", kind: "ville" },
  { slug: "martigues", name: "Martigues", dept: "13", zone: "Provence", kind: "mer" },
  { slug: "arles", name: "Arles", dept: "13", zone: "Provence", kind: "ville" },
  { slug: "avignon", name: "Avignon", dept: "84", zone: "Provence", kind: "ville" },
  { slug: "cavaillon", name: "Cavaillon", dept: "84", zone: "Provence", kind: "ville" },
  { slug: "orange", name: "Orange", dept: "84", zone: "Provence", kind: "ville" },
  // ─── Occitanie littoral ───
  { slug: "montpellier", name: "Montpellier", dept: "34", zone: "Occitanie littoral", kind: "ville" },
  { slug: "sete", name: "Sète", dept: "34", zone: "Occitanie littoral", kind: "mer" },
  { slug: "agde", name: "Agde", dept: "34", zone: "Occitanie littoral", kind: "mer" },
  { slug: "la-grande-motte", name: "La Grande-Motte", dept: "34", zone: "Occitanie littoral", kind: "mer" },
  { slug: "perpignan", name: "Perpignan", dept: "66", zone: "Côte Vermeille", kind: "ville" },
  { slug: "argeles-sur-mer", name: "Argelès-sur-Mer", dept: "66", zone: "Côte Vermeille", kind: "mer" },
  { slug: "collioure", name: "Collioure", dept: "66", zone: "Côte Vermeille", kind: "mer" },
  { slug: "canet-en-roussillon", name: "Canet-en-Roussillon", dept: "66", zone: "Côte Vermeille", kind: "mer" },
  // ─── Pays Basque & Landes ───
  { slug: "biarritz", name: "Biarritz", dept: "64", zone: "Pays Basque", kind: "mer" },
  { slug: "anglet", name: "Anglet", dept: "64", zone: "Pays Basque", kind: "mer" },
  { slug: "bayonne", name: "Bayonne", dept: "64", zone: "Pays Basque", kind: "ville" },
  { slug: "saint-jean-de-luz", name: "Saint-Jean-de-Luz", dept: "64", zone: "Pays Basque", kind: "mer" },
  { slug: "hendaye", name: "Hendaye", dept: "64", zone: "Pays Basque", kind: "mer" },
  { slug: "capbreton", name: "Capbreton", dept: "40", zone: "Côte Landaise", kind: "mer" },
  { slug: "seignosse", name: "Seignosse", dept: "40", zone: "Côte Landaise", kind: "mer" },
  { slug: "mimizan", name: "Mimizan", dept: "40", zone: "Côte Landaise", kind: "mer" },
  // ─── Bassin d'Arcachon & Gironde ───
  { slug: "bordeaux", name: "Bordeaux", dept: "33", zone: "Bassin d'Arcachon", kind: "ville" },
  { slug: "arcachon", name: "Arcachon", dept: "33", zone: "Bassin d'Arcachon", kind: "mer" },
  { slug: "la-teste-de-buch", name: "La Teste-de-Buch", dept: "33", zone: "Bassin d'Arcachon", kind: "mer" },
  { slug: "lacanau", name: "Lacanau", dept: "33", zone: "Bassin d'Arcachon", kind: "mer" },
  { slug: "andernos-les-bains", name: "Andernos-les-Bains", dept: "33", zone: "Bassin d'Arcachon", kind: "mer" },
  // ─── Charente-Maritime & Vendée ───
  { slug: "la-rochelle", name: "La Rochelle", dept: "17", zone: "Côte Atlantique", kind: "mer" },
  { slug: "royan", name: "Royan", dept: "17", zone: "Côte Atlantique", kind: "mer" },
  { slug: "saint-palais-sur-mer", name: "Saint-Palais-sur-Mer", dept: "17", zone: "Côte Atlantique", kind: "mer" },
  { slug: "chatelaillon-plage", name: "Châtelaillon-Plage", dept: "17", zone: "Côte Atlantique", kind: "mer" },
  { slug: "les-sables-d-olonne", name: "Les Sables-d'Olonne", dept: "85", zone: "Côte Atlantique", kind: "mer" },
  { slug: "saint-jean-de-monts", name: "Saint-Jean-de-Monts", dept: "85", zone: "Côte Atlantique", kind: "mer" },
  { slug: "saint-gilles-croix-de-vie", name: "Saint-Gilles-Croix-de-Vie", dept: "85", zone: "Côte Atlantique", kind: "mer" },
  { slug: "noirmoutier-en-l-ile", name: "Noirmoutier-en-l'Île", dept: "85", zone: "Côte Atlantique", kind: "mer" },
  // ─── Loire-Atlantique ───
  { slug: "la-baule-escoublac", name: "La Baule-Escoublac", dept: "44", zone: "Côte de Jade", kind: "mer" },
  { slug: "pornic", name: "Pornic", dept: "44", zone: "Côte de Jade", kind: "mer" },
  { slug: "saint-nazaire", name: "Saint-Nazaire", dept: "44", zone: "Côte de Jade", kind: "ville" },
  // ─── Bretagne ───
  { slug: "saint-malo", name: "Saint-Malo", dept: "35", zone: "Bretagne", kind: "mer" },
  { slug: "dinard", name: "Dinard", dept: "35", zone: "Bretagne", kind: "mer" },
  { slug: "cancale", name: "Cancale", dept: "35", zone: "Bretagne", kind: "mer" },
  { slug: "quiberon", name: "Quiberon", dept: "56", zone: "Bretagne", kind: "mer" },
  { slug: "carnac", name: "Carnac", dept: "56", zone: "Bretagne", kind: "mer" },
  { slug: "vannes", name: "Vannes", dept: "56", zone: "Bretagne", kind: "ville" },
  { slug: "concarneau", name: "Concarneau", dept: "29", zone: "Bretagne", kind: "mer" },
  { slug: "quimper", name: "Quimper", dept: "29", zone: "Bretagne", kind: "ville" },
  // ─── Normandie ───
  { slug: "deauville", name: "Deauville", dept: "14", zone: "Côte Normande", kind: "mer" },
  { slug: "trouville-sur-mer", name: "Trouville-sur-Mer", dept: "14", zone: "Côte Normande", kind: "mer" },
  { slug: "cabourg", name: "Cabourg", dept: "14", zone: "Côte Normande", kind: "mer" },
  { slug: "honfleur", name: "Honfleur", dept: "14", zone: "Côte Normande", kind: "mer" },
  // ─── Alpes & Savoie ───
  { slug: "annecy", name: "Annecy", dept: "74", zone: "Alpes & lacs", kind: "montagne" },
  { slug: "chamonix-mont-blanc", name: "Chamonix-Mont-Blanc", dept: "74", zone: "Alpes & lacs", kind: "montagne" },
  { slug: "megeve", name: "Megève", dept: "74", zone: "Alpes & lacs", kind: "montagne" },
  { slug: "thonon-les-bains", name: "Thonon-les-Bains", dept: "74", zone: "Alpes & lacs", kind: "montagne" },
  { slug: "chambery", name: "Chambéry", dept: "73", zone: "Alpes & lacs", kind: "montagne" },
  { slug: "aix-les-bains", name: "Aix-les-Bains", dept: "73", zone: "Alpes & lacs", kind: "montagne" },
  // ─── Corse ───
  { slug: "ajaccio", name: "Ajaccio", dept: "2A", zone: "Corse", kind: "mer" },
  { slug: "bastia", name: "Bastia", dept: "2B", zone: "Corse", kind: "mer" },
  { slug: "porto-vecchio", name: "Porto-Vecchio", dept: "2A", zone: "Corse", kind: "mer" },
  { slug: "calvi", name: "Calvi", dept: "2B", zone: "Corse", kind: "mer" },
];

const BY_SLUG = new Map(TOURISTIC_CITIES.map((c) => [c.slug, c]));

/** Retourne la ville touristique par son slug, ou undefined si non listée. */
export function getTouristicCity(slug: string): TouristicCity | undefined {
  return BY_SLUG.get(slug);
}

/** Villes de la même zone (hors la ville courante), pour le maillage interne. */
export function citiesInSameZone(
  slug: string,
  limit = 6
): TouristicCity[] {
  const cur = BY_SLUG.get(slug);
  if (!cur) return [];
  return TOURISTIC_CITIES.filter(
    (c) => c.zone === cur.zone && c.slug !== slug
  ).slice(0, limit);
}

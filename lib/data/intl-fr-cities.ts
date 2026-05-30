/**
 * Villes francophones internationales (hors France) ciblées par Workwave AI.
 *
 * Servent les pages /ai/monde/[skill]/[ville] (en français). La France est
 * déjà couverte par /ai/[skill]/[ville] (pilotée par la base). BTP = France only.
 *
 * Tarifs affichés en EUR (locale "fr") avec mention "indicatif" — on ne convertit
 * pas en devise locale (MAD/XOF/CAD…) pour ne pas inventer de précision locale.
 */

import type { MonumentName } from "@/components/ai/MonumentArt";

export type FrCity = {
  slug: string;
  name: string;
  country: string; // en français
  region: "Europe" | "Afrique" | "Amérique";
  monument: MonumentName;
  blurb: string;
};

export const FR_CITIES: FrCity[] = [
  // ─── Europe francophone ──────────────────────────────────────────────
  {
    slug: "bruxelles",
    name: "Bruxelles",
    country: "Belgique",
    region: "Europe",
    monument: "skyline",
    blurb:
      "Capitale belge et carrefour européen, Bruxelles concentre une forte demande en talents tech et digitaux, en français comme en anglais.",
  },
  {
    slug: "geneve",
    name: "Genève",
    country: "Suisse",
    region: "Europe",
    monument: "skyline",
    blurb:
      "Hub international d'institutions et d'entreprises, Genève soutient une demande haut de gamme en freelances spécialisés.",
  },
  {
    slug: "lausanne",
    name: "Lausanne",
    country: "Suisse",
    region: "Europe",
    monument: "skyline",
    blurb:
      "Pôle technologique et académique de Suisse romande, Lausanne attire startups et profils tech de pointe.",
  },
  {
    slug: "luxembourg",
    name: "Luxembourg",
    country: "Luxembourg",
    region: "Europe",
    monument: "skyline",
    blurb:
      "Place financière et numérique européenne, le Luxembourg offre un marché dense pour les freelances tech et data.",
  },
  // ─── Amérique francophone ────────────────────────────────────────────
  {
    slug: "montreal",
    name: "Montréal",
    country: "Canada",
    region: "Amérique",
    monument: "skyline",
    blurb:
      "Capitale tech du Québec (IA, jeu vidéo, effets visuels), Montréal est un vivier majeur de talents francophones.",
  },
  // ─── Afrique francophone ─────────────────────────────────────────────
  {
    slug: "casablanca",
    name: "Casablanca",
    country: "Maroc",
    region: "Afrique",
    monument: "skyline",
    blurb:
      "Capitale économique du Maroc, Casablanca abrite un écosystème tech et digital en pleine croissance.",
  },
  {
    slug: "rabat",
    name: "Rabat",
    country: "Maroc",
    region: "Afrique",
    monument: "skyline",
    blurb:
      "Pôle administratif et universitaire du Maroc, Rabat développe un secteur numérique dynamique.",
  },
  {
    slug: "tunis",
    name: "Tunis",
    country: "Tunisie",
    region: "Afrique",
    monument: "skyline",
    blurb:
      "Hub tech et offshore de Tunisie, Tunis dispose d'un solide vivier d'ingénieurs et de développeurs francophones.",
  },
  {
    slug: "dakar",
    name: "Dakar",
    country: "Sénégal",
    region: "Afrique",
    monument: "skyline",
    blurb:
      "Porte d'entrée tech de l'Afrique de l'Ouest, Dakar voit éclore startups et talents numériques francophones.",
  },
  {
    slug: "abidjan",
    name: "Abidjan",
    country: "Côte d'Ivoire",
    region: "Afrique",
    monument: "skyline",
    blurb:
      "Capitale économique ivoirienne, Abidjan est un moteur de la tech francophone en Afrique de l'Ouest.",
  },
];

const FR_CITY_MAP = new Map(FR_CITIES.map((c) => [c.slug, c]));

export function getFrCity(slug: string): FrCity | null {
  return FR_CITY_MAP.get(slug) ?? null;
}

export function frCitySlugs(): string[] {
  return FR_CITIES.map((c) => c.slug);
}

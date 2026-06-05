/**
 * Métadonnées pays pour les guides Workwave AI (visa/permis freelance, etc.).
 *
 * Le CONTENU factuel (permis, coûts, règles) vit dans lib/data/freelance-visa.ts
 * et est SOURCÉ (recherche web) — jamais inventé. Ce fichier ne contient que des
 * métadonnées neutres (nom, monument, devise).
 *
 * Phase visa wave 1 = Golfe. Extensible ensuite (Europe, etc.).
 */

import type { MonumentName } from "@/components/ai/MonumentArt";
import type { Currency } from "@/lib/i18n/format";
import { INTL_CITIES, type IntlCity } from "./intl-cities";

export type IntlCountry = {
  slug: string; // "uae", "saudi-arabia"...
  name: string; // "United Arab Emirates"
  shortName: string; // "the UAE" / "Saudi Arabia"
  region: "Gulf";
  currency: Currency;
  monument: MonumentName;
};

export const GULF_COUNTRIES: IntlCountry[] = [
  { slug: "uae", name: "United Arab Emirates", shortName: "the UAE", region: "Gulf", currency: "AED", monument: "dubai" },
  { slug: "saudi-arabia", name: "Saudi Arabia", shortName: "Saudi Arabia", region: "Gulf", currency: "SAR", monument: "riyadh" },
  { slug: "qatar", name: "Qatar", shortName: "Qatar", region: "Gulf", currency: "QAR", monument: "skyline" },
  { slug: "bahrain", name: "Bahrain", shortName: "Bahrain", region: "Gulf", currency: "USD", monument: "skyline" },
  { slug: "kuwait", name: "Kuwait", shortName: "Kuwait", region: "Gulf", currency: "USD", monument: "skyline" },
  { slug: "oman", name: "Oman", shortName: "Oman", region: "Gulf", currency: "USD", monument: "skyline" },
];

const COUNTRY_MAP = new Map(GULF_COUNTRIES.map((c) => [c.slug, c]));

export function getCountry(slug: string): IntlCountry | null {
  return COUNTRY_MAP.get(slug) ?? null;
}

// ════════════════════════════════════════════════════════════════════════
// HUBS PAYS & CONTINENT (vague mondiale) — DÉRIVÉS de INTL_CITIES (source de
// vérité unique). Les US sont exclus : ils ont déjà des hubs d'état dédiés.
// Sert les routes /en/ai/country/[country] et /en/ai/continent/[continent].
// ════════════════════════════════════════════════════════════════════════

export type Continent = {
  slug: string;
  name: string; // affichage dans une phrase, ex. "the Gulf & Middle East"
  shortName: string; // libellé court, ex. "Latin America"
  region: IntlCity["region"];
};

// region (donnée ville) -> hub continent.
const REGION_CONTINENT: Record<string, Continent | undefined> = {
  Asia: { slug: "asia", name: "Asia", shortName: "Asia", region: "Asia" },
  Europe: { slug: "europe", name: "Europe", shortName: "Europe", region: "Europe" },
  Gulf: { slug: "gulf", name: "the Gulf & Middle East", shortName: "the Gulf", region: "Gulf" },
  Latam: { slug: "latin-america", name: "Latin America", shortName: "Latin America", region: "Latam" },
  Oceania: { slug: "oceania", name: "Oceania", shortName: "Oceania", region: "Oceania" },
  Africa: { slug: "africa", name: "Africa", shortName: "Africa", region: "Africa" },
};

export const CONTINENTS: Continent[] = Object.values(REGION_CONTINENT).filter(
  (c): c is Continent => Boolean(c)
);

export function getContinent(slug: string): Continent | null {
  return CONTINENTS.find((c) => c.slug === slug) ?? null;
}

export type WorldCountry = {
  slug: string; // "japan", "south-korea"
  name: string; // "Japan"
  countryCode: string; // "JP"
  region: IntlCity["region"];
  continentSlug: string;
  monument: MonumentName;
};

function slugifyCountry(name: string): string {
  return name
    .toLowerCase()
    .normalize("NFD")
    .replace(/[̀-ͯ]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "");
}

// Une entrée par countryCode présent dans INTL_CITIES (hors USA). Le monument
// retenu est le premier monument dédié trouvé pour ce pays (sinon "skyline").
export const WORLD_COUNTRIES: WorldCountry[] = (() => {
  const byCode = new Map<string, WorldCountry>();
  for (const c of INTL_CITIES) {
    if (c.region === "USA") continue;
    const cont = REGION_CONTINENT[c.region];
    if (!cont) continue;
    const existing = byCode.get(c.countryCode);
    if (existing) {
      const generic = existing.monument === "skyline" || existing.monument === "skyline-global";
      if (generic && c.monument !== "skyline" && c.monument !== "skyline-global") {
        existing.monument = c.monument;
      }
      continue;
    }
    byCode.set(c.countryCode, {
      slug: slugifyCountry(c.country),
      name: c.country,
      countryCode: c.countryCode,
      region: c.region,
      continentSlug: cont.slug,
      monument: c.monument,
    });
  }
  return [...byCode.values()].sort((a, b) => a.name.localeCompare(b.name));
})();

const WORLD_COUNTRY_MAP = new Map(WORLD_COUNTRIES.map((c) => [c.slug, c]));

export function getWorldCountry(slug: string): WorldCountry | null {
  return WORLD_COUNTRY_MAP.get(slug) ?? null;
}

export function getCountriesByContinent(continentSlug: string): WorldCountry[] {
  return WORLD_COUNTRIES.filter((c) => c.continentSlug === continentSlug);
}

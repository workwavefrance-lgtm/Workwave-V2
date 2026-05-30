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

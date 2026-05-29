/**
 * Villes internationales ciblees par Workwave AI (anglais) — Phase C.
 *
 * BTP reste 100% FR : ces villes ne servent QUE les pages /en/ai/*.
 *
 * Chaque ville :
 *   - currency : DOIT etre une devise supportee par lib/i18n/format.ts
 *     (EUR/USD/GBP/AED/SAR/QAR/CHF). Pour les zones a devise non supportee
 *     (ex. Stockholm/SEK), on affiche en USD (devise freelance globale).
 *   - monument : MonumentName pour le hero (line-art). "skyline" en fallback
 *     quand on n'a pas encore de monument dedie (ajout progressif).
 *   - blurb : phrase factuelle et generique (pas d'affirmation invérifiable).
 *
 * Source villes/regions : SEO research interne (Gulf Tier 1-2 + Europe hubs).
 */

import type { MonumentName } from "@/components/ai/MonumentArt";
import type { Currency } from "@/lib/i18n/format";

export type IntlCity = {
  slug: string;
  name: string;
  country: string;
  countryCode: string; // ISO 3166-1 alpha-2
  region: "Gulf" | "Europe";
  currency: Currency;
  monument: MonumentName;
  blurb: string;
};

export const INTL_CITIES: IntlCity[] = [
  // ─── Gulf & Middle East ──────────────────────────────────────────────
  {
    slug: "dubai",
    name: "Dubai",
    country: "United Arab Emirates",
    countryCode: "AE",
    region: "Gulf",
    currency: "AED",
    monument: "dubai",
    blurb:
      "A leading Gulf hub for tech and digital business, Dubai draws companies hiring both remote and on-site freelance talent across the Middle East.",
  },
  {
    slug: "abu-dhabi",
    name: "Abu Dhabi",
    country: "United Arab Emirates",
    countryCode: "AE",
    region: "Gulf",
    currency: "AED",
    monument: "skyline",
    blurb:
      "The UAE capital backs a fast-growing technology and innovation sector, with strong demand for senior freelance specialists.",
  },
  {
    slug: "riyadh",
    name: "Riyadh",
    country: "Saudi Arabia",
    countryCode: "SA",
    region: "Gulf",
    currency: "SAR",
    monument: "riyadh",
    blurb:
      "Saudi Arabia's capital is investing heavily in digital transformation, creating sustained demand for tech and product talent.",
  },
  {
    slug: "jeddah",
    name: "Jeddah",
    country: "Saudi Arabia",
    countryCode: "SA",
    region: "Gulf",
    currency: "SAR",
    monument: "skyline",
    blurb:
      "A major commercial gateway on the Red Sea, Jeddah hosts a growing community of startups and digital teams.",
  },
  {
    slug: "doha",
    name: "Doha",
    country: "Qatar",
    countryCode: "QA",
    region: "Gulf",
    currency: "QAR",
    monument: "skyline",
    blurb:
      "Qatar's capital pairs deep investment in technology and media with a rising appetite for specialist freelance skills.",
  },
  // ─── Europe ──────────────────────────────────────────────────────────
  {
    slug: "london",
    name: "London",
    country: "United Kingdom",
    countryCode: "GB",
    region: "Europe",
    currency: "GBP",
    monument: "london",
    blurb:
      "Europe's largest tech ecosystem, London concentrates demand for senior developers, AI engineers and product talent.",
  },
  {
    slug: "dublin",
    name: "Dublin",
    country: "Ireland",
    countryCode: "IE",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "Home to the European HQs of many global tech companies, Dublin has a dense market for engineering and data skills.",
  },
  {
    slug: "amsterdam",
    name: "Amsterdam",
    country: "Netherlands",
    countryCode: "NL",
    region: "Europe",
    currency: "EUR",
    monument: "amsterdam",
    blurb:
      "A leading Northern-European tech hub, Amsterdam is a magnet for product, design and engineering freelancers.",
  },
  {
    slug: "berlin",
    name: "Berlin",
    country: "Germany",
    countryCode: "DE",
    region: "Europe",
    currency: "EUR",
    monument: "berlin",
    blurb:
      "Germany's startup capital, Berlin combines a vibrant founder scene with strong demand for technical freelancers.",
  },
  {
    slug: "munich",
    name: "Munich",
    country: "Germany",
    countryCode: "DE",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "An industrial and deep-tech powerhouse, Munich attracts senior engineering and data specialists.",
  },
  {
    slug: "paris",
    name: "Paris",
    country: "France",
    countryCode: "FR",
    region: "Europe",
    currency: "EUR",
    monument: "paris",
    blurb:
      "One of Europe's biggest tech markets, Paris offers a deep pool of developers, AI engineers and designers.",
  },
  {
    slug: "brussels",
    name: "Brussels",
    country: "Belgium",
    countryCode: "BE",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "A multilingual European capital, Brussels blends institutional and corporate demand for digital freelance talent.",
  },
  {
    slug: "lisbon",
    name: "Lisbon",
    country: "Portugal",
    countryCode: "PT",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "A booming hub for startups and remote work, Lisbon has become one of Europe's favourite cities for tech talent.",
  },
  {
    slug: "madrid",
    name: "Madrid",
    country: "Spain",
    countryCode: "ES",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "Spain's capital anchors a fast-growing tech scene with strong demand across development and data.",
  },
  {
    slug: "barcelona",
    name: "Barcelona",
    country: "Spain",
    countryCode: "ES",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "A Mediterranean tech and design hub, Barcelona draws product and engineering freelancers from across Europe.",
  },
  {
    slug: "zurich",
    name: "Zurich",
    country: "Switzerland",
    countryCode: "CH",
    region: "Europe",
    currency: "CHF",
    monument: "skyline",
    blurb:
      "A high-value market for senior tech and data talent, Zurich pairs finance and deep-tech demand.",
  },
  {
    slug: "geneva",
    name: "Geneva",
    country: "Switzerland",
    countryCode: "CH",
    region: "Europe",
    currency: "CHF",
    monument: "skyline",
    blurb:
      "An international hub for institutions and corporates, Geneva sustains demand for specialist digital freelancers.",
  },
  {
    slug: "stockholm",
    name: "Stockholm",
    country: "Sweden",
    countryCode: "SE",
    region: "Europe",
    currency: "USD",
    monument: "skyline",
    blurb:
      "One of Europe's most productive startup ecosystems, Stockholm has deep demand for engineering and product skills.",
  },
];

const CITY_MAP = new Map(INTL_CITIES.map((c) => [c.slug, c]));

export function getIntlCity(slug: string): IntlCity | null {
  return CITY_MAP.get(slug) ?? null;
}

export function allIntlCitySlugs(): string[] {
  return INTL_CITIES.map((c) => c.slug);
}

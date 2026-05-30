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
  region: "Gulf" | "Europe" | "USA";
  currency: Currency;
  monument: MonumentName;
  blurb: string;
  // ─── Champs RICHES (tier US) — optionnels. Rendus en sections premium par
  // le template /en/ai/[skill]/[city] quand présents. Faits PUBLICS vérifiables
  // uniquement (état, fuseau, métro, écosystème qualitatif) — aucun chiffre
  // inventé (règle CLAUDE.md). Le Golfe/Europe ne les renseigne pas (fallback).
  state?: string; // "California"
  stateCode?: string; // "CA" (2 lettres)
  metro?: string; // "San Francisco Bay Area"
  timezone?: string; // "Pacific Time (PT)"
  techScene?: string; // paragraphe factuel sur l'écosystème tech/freelance local
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
  // ─── Gulf & Middle East — Tier 2 ─────────────────────────────────────
  {
    slug: "sharjah",
    name: "Sharjah",
    country: "United Arab Emirates",
    countryCode: "AE",
    region: "Gulf",
    currency: "AED",
    monument: "skyline",
    blurb:
      "Part of the UAE's dynamic economy, Sharjah hosts a growing base of SMEs and creative businesses hiring freelance talent.",
  },
  {
    slug: "manama",
    name: "Manama",
    country: "Bahrain",
    countryCode: "BH",
    region: "Gulf",
    currency: "USD",
    monument: "skyline",
    blurb:
      "A regional finance and fintech hub, Manama pairs a business-friendly climate with rising demand for digital skills.",
  },
  {
    slug: "kuwait-city",
    name: "Kuwait City",
    country: "Kuwait",
    countryCode: "KW",
    region: "Gulf",
    currency: "USD",
    monument: "skyline",
    blurb:
      "Kuwait's capital is steadily digitising its economy, opening opportunities for freelance tech and product specialists.",
  },
  {
    slug: "muscat",
    name: "Muscat",
    country: "Oman",
    countryCode: "OM",
    region: "Gulf",
    currency: "USD",
    monument: "skyline",
    blurb:
      "Oman's capital is investing in digital transformation, with growing demand for engineering and data talent.",
  },
  {
    slug: "neom",
    name: "NEOM",
    country: "Saudi Arabia",
    countryCode: "SA",
    region: "Gulf",
    currency: "SAR",
    monument: "skyline",
    blurb:
      "A flagship Saudi megaproject in technology and innovation, NEOM drives strong demand for senior specialist talent.",
  },
  // ─── Europe — Tier 2 ─────────────────────────────────────────────────
  {
    slug: "milan",
    name: "Milan",
    country: "Italy",
    countryCode: "IT",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "Italy's business and design capital, Milan combines a strong creative scene with growing tech demand.",
  },
  {
    slug: "vienna",
    name: "Vienna",
    country: "Austria",
    countryCode: "AT",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "A high-quality-of-life hub in Central Europe, Vienna anchors steady demand for engineering and data specialists.",
  },
  {
    slug: "copenhagen",
    name: "Copenhagen",
    country: "Denmark",
    countryCode: "DK",
    region: "Europe",
    currency: "USD",
    monument: "skyline",
    blurb:
      "A Nordic leader in design and clean tech, Copenhagen has deep demand for product and engineering talent.",
  },
  {
    slug: "tallinn",
    name: "Tallinn",
    country: "Estonia",
    countryCode: "EE",
    region: "Europe",
    currency: "EUR",
    monument: "skyline",
    blurb:
      "One of Europe's most digital societies, Tallinn punches well above its weight for startups and engineering talent.",
  },
  {
    slug: "warsaw",
    name: "Warsaw",
    country: "Poland",
    countryCode: "PL",
    region: "Europe",
    currency: "USD",
    monument: "skyline",
    blurb:
      "A fast-growing Central-European tech hub, Warsaw offers a deep and competitive pool of engineering talent.",
  },
  // ─── United States — Tier 1 tech hubs ────────────────────────────────
  {
    slug: "san-francisco", name: "San Francisco", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "golden-gate",
    state: "California", stateCode: "CA", metro: "San Francisco Bay Area",
    timezone: "Pacific Time (PT)",
    blurb:
      "The heart of the world's largest technology ecosystem, San Francisco concentrates demand for senior engineers, AI and product talent.",
    techScene:
      "The San Francisco Bay Area is the world's leading technology hub — home to global software companies, the venture-capital industry and one of the deepest pools of senior engineering, AI and product talent anywhere.",
  },
  {
    slug: "new-york", name: "New York", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "statue-liberty",
    state: "New York", stateCode: "NY", metro: "New York metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A global business capital, New York pairs finance, media and a vast tech scene with one of the largest freelance markets in the world.",
    techScene:
      "New York pairs Wall Street with a sprawling 'Silicon Alley' spanning fintech, media, adtech and e-commerce — and one of the largest freelance and creative talent markets anywhere.",
  },
  {
    slug: "los-angeles", name: "Los Angeles", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "Greater Los Angeles",
    timezone: "Pacific Time (PT)",
    blurb:
      "Entertainment capital and home of 'Silicon Beach', Los Angeles drives strong demand for creative, video and product freelancers.",
    techScene:
      "Greater Los Angeles blends entertainment, media and the fast-growing 'Silicon Beach' startup cluster, with heavy demand for creative, video, design and product talent.",
  },
  {
    slug: "seattle", name: "Seattle", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "space-needle",
    state: "Washington", stateCode: "WA", metro: "Greater Seattle",
    timezone: "Pacific Time (PT)",
    blurb:
      "A top-tier engineering hub anchored by global cloud and e-commerce companies, Seattle is dense with senior software talent.",
    techScene:
      "Seattle is a top-tier engineering hub anchored by global cloud and e-commerce giants, with deep demand for cloud, data and senior software freelancers.",
  },
  {
    slug: "austin", name: "Austin", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Texas", stateCode: "TX", metro: "Greater Austin",
    timezone: "Central Time (CT)",
    blurb:
      "One of the fastest-growing US tech hubs, Austin attracts major employers and startups relocating from the coasts.",
    techScene:
      "Austin has become one of the fastest-growing US tech hubs, drawing major employers and startups relocating from the coasts, with rising demand across software, product and data.",
  },
  {
    slug: "boston", name: "Boston", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Massachusetts", stateCode: "MA", metro: "Greater Boston",
    timezone: "Eastern Time (ET)",
    blurb:
      "A world-class research and deep-tech hub, Boston pairs leading universities with strong biotech and enterprise software demand.",
    techScene:
      "Greater Boston combines world-class universities with deep strengths in biotech, enterprise software and robotics, fueling steady demand for technical and data specialists.",
  },
  {
    slug: "chicago", name: "Chicago", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Illinois", stateCode: "IL", metro: "Chicagoland",
    timezone: "Central Time (CT)",
    blurb:
      "The Midwest's business and tech anchor, Chicago is strong in fintech, logistics and enterprise software.",
    techScene:
      "Chicago anchors the Midwest tech scene with strengths in fintech, logistics and enterprise software, and a large, competitively-priced engineering talent market.",
  },
  {
    slug: "denver", name: "Denver", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Colorado", stateCode: "CO", metro: "Denver–Aurora",
    timezone: "Mountain Time (MT)",
    blurb:
      "A magnet for remote-first tech workers and startups, Denver and the Front Range are a fast-rising talent market.",
    techScene:
      "Denver and the Front Range have emerged as a magnet for remote-first tech workers and startups, with growing demand for software, cloud and data skills.",
  },
  {
    slug: "miami", name: "Miami", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Florida", stateCode: "FL", metro: "South Florida",
    timezone: "Eastern Time (ET)",
    blurb:
      "A rising hub for fintech, crypto and Latin-America-facing tech, Miami attracts founders, investors and remote talent.",
    techScene:
      "Miami has rapidly positioned itself as a hub for fintech, crypto and Latin-America-facing tech, attracting founders, investors and a growing base of remote talent.",
  },
  {
    slug: "atlanta", name: "Atlanta", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Georgia", stateCode: "GA", metro: "Metro Atlanta",
    timezone: "Eastern Time (ET)",
    blurb:
      "The tech capital of the US Southeast, Atlanta is strong in fintech, logistics and media.",
    techScene:
      "Atlanta is the tech capital of the US Southeast — strong in fintech, logistics and media, with a deep and diverse engineering talent pool.",
  },
  {
    slug: "washington-dc", name: "Washington, D.C.", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "us-capitol",
    state: "District of Columbia", stateCode: "DC", metro: "Washington metro (DMV)",
    timezone: "Eastern Time (ET)",
    blurb:
      "Pairing government and defense technology with a strong cybersecurity and cloud market across the DMV.",
    techScene:
      "The Washington, D.C. area pairs government and defense technology with a strong cybersecurity, data and cloud market across Northern Virginia and Maryland.",
  },
  {
    slug: "san-diego", name: "San Diego", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "San Diego County",
    timezone: "Pacific Time (PT)",
    blurb:
      "Blending biotech, defense and a growing software scene on the Southern California coast.",
    techScene:
      "San Diego blends biotech, defense and a growing software scene, with demand for engineering, data and product specialists along the Southern California coast.",
  },
];

const CITY_MAP = new Map(INTL_CITIES.map((c) => [c.slug, c]));

export function getIntlCity(slug: string): IntlCity | null {
  return CITY_MAP.get(slug) ?? null;
}

export function allIntlCitySlugs(): string[] {
  return INTL_CITIES.map((c) => c.slug);
}

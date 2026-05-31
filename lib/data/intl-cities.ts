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
    slug: "monaco",
    name: "Monaco",
    country: "Monaco",
    countryCode: "MC",
    region: "Europe",
    currency: "EUR",
    monument: "monaco",
    blurb:
      "A sovereign city-state on the French Riviera, Monaco concentrates finance, luxury and a state-backed digital drive into barely two square kilometres — a compact, high-end market for senior freelance talent.",
    metro: "French Riviera (Côte d'Azur)",
    timezone: "Central European Time (CET)",
    techScene:
      "Few places pack as much wealth and high-end business into so little ground as Monaco — a sovereign principality of barely two square kilometres, ruled by the House of Grimaldi and wrapped around the yachts of Port Hercule and the Belle Époque grandeur of Monte-Carlo. The government-led Extended Monaco programme is digitising public services and courting fintech, sustainability and deep-tech ventures, while private banking, real estate, yachting, hospitality and the Formula 1 Grand Prix sustain steady demand for senior digital, design and engineering freelancers. French is the official language, with English and Italian widely spoken, and the principality levies no personal income tax on residents — a combination that keeps it a magnet for international talent across the wider Côte d'Azur.",
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
  // ─── United States — Tier 2+ ─────────────────────────────────────────
  {
    slug: "san-jose", name: "San Jose", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "San Francisco Bay Area",
    timezone: "Pacific Time (PT)",
    blurb:
      "The largest city in Silicon Valley, San Jose sits at the centre of the world's densest hardware and software industry.",
    techScene:
      "San Jose is the largest city of Silicon Valley, home to major hardware and semiconductor companies and one of the deepest concentrations of engineering and product talent in the world.",
  },
  {
    slug: "houston", name: "Houston", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Texas", stateCode: "TX", metro: "Greater Houston",
    timezone: "Central Time (CT)",
    blurb:
      "A major US metro anchored by energy, aerospace and healthcare, with a fast-growing software and data scene.",
    techScene:
      "Houston is a major US metro anchored by the energy, aerospace and medical sectors, with growing demand for software, data and engineering freelancers supporting digital transformation.",
  },
  {
    slug: "dallas", name: "Dallas", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Texas", stateCode: "TX", metro: "Dallas–Fort Worth",
    timezone: "Central Time (CT)",
    blurb:
      "A major business and tech centre of the US South, strong in telecom, finance and enterprise software.",
    techScene:
      "The Dallas–Fort Worth metroplex is a major corporate hub strong in telecom, finance and enterprise software, with a large and competitively-priced technical talent market.",
  },
  {
    slug: "fort-worth", name: "Fort Worth", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Texas", stateCode: "TX", metro: "Dallas–Fort Worth",
    timezone: "Central Time (CT)",
    blurb:
      "Part of the Dallas–Fort Worth metroplex, Fort Worth pairs aerospace and logistics with a growing tech base.",
    techScene:
      "Fort Worth anchors the western side of the Dallas–Fort Worth metroplex, with strengths in aerospace, logistics and manufacturing and growing demand for software and data talent.",
  },
  {
    slug: "san-antonio", name: "San Antonio", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Texas", stateCode: "TX", metro: "Greater San Antonio",
    timezone: "Central Time (CT)",
    blurb:
      "A large Texan metro known for cybersecurity, military and a growing IT services sector.",
    techScene:
      "San Antonio is a large Texan metro known for its cybersecurity cluster, military presence and a growing IT and cloud services sector.",
  },
  {
    slug: "phoenix", name: "Phoenix", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Arizona", stateCode: "AZ", metro: "Greater Phoenix (Valley of the Sun)",
    timezone: "Mountain Time (MT, no DST)",
    blurb:
      "A fast-growing Southwest metro with rising semiconductor manufacturing and a broad tech-services base.",
    techScene:
      "Greater Phoenix is one of the fastest-growing US metros, with rising semiconductor manufacturing investment and broad demand for software, data and IT-services freelancers.",
  },
  {
    slug: "philadelphia", name: "Philadelphia", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Pennsylvania", stateCode: "PA", metro: "Greater Philadelphia",
    timezone: "Eastern Time (ET)",
    blurb:
      "A major East-Coast metro pairing universities and healthcare with a solid software and life-sciences scene.",
    techScene:
      "Greater Philadelphia pairs leading universities and a strong healthcare sector with growing software, fintech and life-sciences activity, supplying a deep technical talent pool.",
  },
  {
    slug: "jacksonville", name: "Jacksonville", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Florida", stateCode: "FL", metro: "Greater Jacksonville",
    timezone: "Eastern Time (ET)",
    blurb:
      "Florida's largest city by area, with strengths in finance, logistics and a growing tech sector.",
    techScene:
      "Jacksonville is a large Florida metro with strengths in financial services and logistics, and a growing base of software and IT freelancers serving regional employers.",
  },
  {
    slug: "columbus", name: "Columbus", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Ohio", stateCode: "OH", metro: "Greater Columbus",
    timezone: "Eastern Time (ET)",
    blurb:
      "Ohio's capital and largest city, with a growing tech, insurance and research economy.",
    techScene:
      "Columbus is a growing Midwest tech market anchored by a large university, insurance and retail headquarters, with rising demand for software, data and product talent.",
  },
  {
    slug: "charlotte", name: "Charlotte", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "North Carolina", stateCode: "NC", metro: "Greater Charlotte",
    timezone: "Eastern Time (ET)",
    blurb:
      "A major US banking centre with a fast-growing fintech and software scene.",
    techScene:
      "Charlotte is a major US banking centre with a fast-growing fintech and enterprise-software scene, attracting technical and data talent across the Carolinas.",
  },
  {
    slug: "indianapolis", name: "Indianapolis", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Indiana", stateCode: "IN", metro: "Greater Indianapolis",
    timezone: "Eastern Time (ET)",
    blurb:
      "Indiana's capital, with a notable SaaS and life-sciences cluster.",
    techScene:
      "Indianapolis has built a notable SaaS and marketing-technology cluster alongside life sciences, supporting steady demand for software and data freelancers.",
  },
  {
    slug: "nashville", name: "Nashville", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Tennessee", stateCode: "TN", metro: "Greater Nashville",
    timezone: "Central Time (CT)",
    blurb:
      "A fast-growing Southern metro strong in healthcare, music and a rising tech scene.",
    techScene:
      "Nashville is a fast-growing Southern metro strong in healthcare and music, with a rising tech scene and growing demand for software and creative freelancers.",
  },
  {
    slug: "portland", name: "Portland", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Oregon", stateCode: "OR", metro: "Portland metro",
    timezone: "Pacific Time (PT)",
    blurb:
      "A Pacific-Northwest hub with a strong hardware, design and software talent base.",
    techScene:
      "Portland combines a long-standing semiconductor and hardware presence (the 'Silicon Forest') with a strong design and software community and a deep creative talent pool.",
  },
  {
    slug: "las-vegas", name: "Las Vegas", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Nevada", stateCode: "NV", metro: "Las Vegas Valley",
    timezone: "Pacific Time (PT)",
    blurb:
      "A growing Southwest metro diversifying from hospitality into tech, logistics and remote work.",
    techScene:
      "Las Vegas is diversifying beyond hospitality and entertainment into tech, logistics and remote work, with growing demand for software, data and design freelancers.",
  },
  {
    slug: "detroit", name: "Detroit", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Michigan", stateCode: "MI", metro: "Metro Detroit",
    timezone: "Eastern Time (ET)",
    blurb:
      "The heart of the US auto industry, increasingly active in mobility, software and connected-vehicle tech.",
    techScene:
      "Metro Detroit is the heart of the US automotive industry and increasingly active in mobility, connected-vehicle and software engineering, with strong demand for technical talent.",
  },
  {
    slug: "memphis", name: "Memphis", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Tennessee", stateCode: "TN", metro: "Greater Memphis",
    timezone: "Central Time (CT)",
    blurb:
      "A major US logistics hub on the Mississippi with a growing IT and operations base.",
    techScene:
      "Memphis is a major US logistics and distribution hub, with growing demand for software, data and IT-operations freelancers supporting supply-chain and healthcare employers.",
  },
  {
    slug: "louisville", name: "Louisville", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Kentucky", stateCode: "KY", metro: "Louisville metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "Kentucky's largest city, strong in logistics, healthcare and a growing tech-services sector.",
    techScene:
      "Louisville is strong in logistics and healthcare, with a growing tech-services sector and steady demand for software and data freelancers across the region.",
  },
  {
    slug: "baltimore", name: "Baltimore", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Maryland", stateCode: "MD", metro: "Baltimore metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A historic East-Coast port city with strengths in cybersecurity, healthcare and research.",
    techScene:
      "Baltimore pairs major research universities and hospitals with a strong cybersecurity sector linked to the wider Washington–Baltimore corridor, supporting demand for technical talent.",
  },
  {
    slug: "milwaukee", name: "Milwaukee", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Wisconsin", stateCode: "WI", metro: "Greater Milwaukee",
    timezone: "Central Time (CT)",
    blurb:
      "A Great-Lakes metro with manufacturing roots and a growing software and fintech base.",
    techScene:
      "Milwaukee combines a strong manufacturing and finance base with a growing software and fintech scene, supplying competitively-priced engineering and data talent.",
  },
  {
    slug: "albuquerque", name: "Albuquerque", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "New Mexico", stateCode: "NM", metro: "Albuquerque metro",
    timezone: "Mountain Time (MT)",
    blurb:
      "New Mexico's largest city, with strengths in national-lab research and aerospace.",
    techScene:
      "Albuquerque hosts national-laboratory research and aerospace activity, with demand for engineering, data and software freelancers in a growing Southwest market.",
  },
  {
    slug: "tucson", name: "Tucson", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Arizona", stateCode: "AZ", metro: "Tucson metro",
    timezone: "Mountain Time (MT, no DST)",
    blurb:
      "A southern-Arizona metro with strengths in optics, aerospace and university research.",
    techScene:
      "Tucson has notable strengths in optics, aerospace and university research, with a growing base of software and engineering freelancers in southern Arizona.",
  },
  {
    slug: "fresno", name: "Fresno", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "Fresno metro",
    timezone: "Pacific Time (PT)",
    blurb:
      "A major Central-Valley city in California with a growing tech-services and remote-work base.",
    techScene:
      "Fresno is a growing US metro in California's Central Valley with rising demand for remote freelance tech talent across software, data and design.",
  },
  {
    slug: "sacramento", name: "Sacramento", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "Greater Sacramento",
    timezone: "Pacific Time (PT)",
    blurb:
      "California's capital, with a growing tech, government and healthcare technology sector.",
    techScene:
      "Sacramento pairs state government and healthcare with a growing tech scene, benefiting from proximity to the Bay Area and rising demand for software and data talent.",
  },
  {
    slug: "kansas-city", name: "Kansas City", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Missouri", stateCode: "MO", metro: "Kansas City metro",
    timezone: "Central Time (CT)",
    blurb:
      "A Midwest metro with strengths in engineering, telecom and a growing startup scene.",
    techScene:
      "Kansas City has strengths in engineering, telecom and animal-health industries, with a growing startup scene and steady demand for software and data freelancers.",
  },
  {
    slug: "raleigh", name: "Raleigh", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "North Carolina", stateCode: "NC", metro: "Research Triangle",
    timezone: "Eastern Time (ET)",
    blurb:
      "Anchor of the Research Triangle, strong in software, life sciences and university research.",
    techScene:
      "Raleigh anchors the Research Triangle alongside Durham, with strengths in software and life sciences and a deep talent pool drawn from the area's universities.",
  },
  {
    slug: "omaha", name: "Omaha", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Nebraska", stateCode: "NE", metro: "Omaha metro",
    timezone: "Central Time (CT)",
    blurb:
      "Nebraska's largest city, with strengths in finance, insurance and data centres.",
    techScene:
      "Omaha has strengths in finance, insurance and data-centre operations, with steady demand for software, data and IT freelancers across the region.",
  },
  {
    slug: "minneapolis", name: "Minneapolis", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Minnesota", stateCode: "MN", metro: "Minneapolis–Saint Paul (Twin Cities)",
    timezone: "Central Time (CT)",
    blurb:
      "The larger of the Twin Cities, with a strong corporate, healthcare and software base.",
    techScene:
      "Minneapolis and the Twin Cities host a dense base of corporate headquarters in retail, healthcare and finance, supporting strong demand for software, data and product talent.",
  },
  {
    slug: "tampa", name: "Tampa", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Florida", stateCode: "FL", metro: "Tampa Bay",
    timezone: "Eastern Time (ET)",
    blurb:
      "A fast-growing Florida metro with a rising fintech, cybersecurity and software scene.",
    techScene:
      "The Tampa Bay area is a fast-growing Florida metro with a rising fintech, cybersecurity and software scene, attracting remote and relocating tech talent.",
  },
  {
    slug: "oakland", name: "Oakland", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "San Francisco Bay Area",
    timezone: "Pacific Time (PT)",
    blurb:
      "A core East-Bay city in the San Francisco Bay Area with a strong tech and creative scene.",
    techScene:
      "Oakland is a core East-Bay city within the San Francisco Bay Area, with a strong tech and creative community and deep access to the region's engineering and design talent.",
  },
  {
    slug: "cleveland", name: "Cleveland", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Ohio", stateCode: "OH", metro: "Greater Cleveland",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Great-Lakes metro strong in healthcare, manufacturing and a growing tech sector.",
    techScene:
      "Cleveland is strong in healthcare and advanced manufacturing, with a growing tech sector and competitively-priced demand for software and data freelancers.",
  },
  {
    slug: "pittsburgh", name: "Pittsburgh", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Pennsylvania", stateCode: "PA", metro: "Greater Pittsburgh",
    timezone: "Eastern Time (ET)",
    blurb:
      "A research-driven metro strong in robotics, AI and autonomous-systems work.",
    techScene:
      "Pittsburgh has transformed into a research-driven tech hub strong in robotics, AI and autonomous systems, anchored by leading universities and a growing engineering talent pool.",
  },
  {
    slug: "cincinnati", name: "Cincinnati", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Ohio", stateCode: "OH", metro: "Greater Cincinnati",
    timezone: "Eastern Time (ET)",
    blurb:
      "An Ohio-River metro with strengths in consumer goods, marketing tech and software.",
    techScene:
      "Cincinnati combines consumer-goods headquarters with a growing marketing-technology and software scene, supporting steady demand for technical and creative freelancers.",
  },
  {
    slug: "orlando", name: "Orlando", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Florida", stateCode: "FL", metro: "Greater Orlando",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Florida metro strong in simulation, gaming, hospitality tech and a growing software scene.",
    techScene:
      "Orlando has notable strengths in modelling, simulation and digital media alongside hospitality technology, with growing demand for software, data and creative freelancers.",
  },
  {
    slug: "st-louis", name: "St. Louis", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Missouri", stateCode: "MO", metro: "Greater St. Louis",
    timezone: "Central Time (CT)",
    blurb:
      "A Midwest metro with strengths in agtech, geospatial, finance and healthcare.",
    techScene:
      "St. Louis has growing strengths in agtech, geospatial technology, finance and healthcare, with a developing startup scene and demand for software and data talent.",
  },
  {
    slug: "salt-lake-city", name: "Salt Lake City", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Utah", stateCode: "UT", metro: "Salt Lake City metro (Silicon Slopes)",
    timezone: "Mountain Time (MT)",
    blurb:
      "The centre of Utah's 'Silicon Slopes', a fast-growing SaaS and startup hub.",
    techScene:
      "Salt Lake City anchors Utah's fast-growing 'Silicon Slopes' corridor, a notable SaaS and startup hub with strong demand for software, product and data talent.",
  },
  {
    slug: "richmond", name: "Richmond", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Virginia", stateCode: "VA", metro: "Greater Richmond",
    timezone: "Eastern Time (ET)",
    blurb:
      "Virginia's capital, with strengths in finance, government services and a growing tech scene.",
    techScene:
      "Richmond pairs finance and government services with a growing tech scene, benefiting from its position in the wider Virginia technology corridor.",
  },
  {
    slug: "durham", name: "Durham", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "North Carolina", stateCode: "NC", metro: "Research Triangle",
    timezone: "Eastern Time (ET)",
    blurb:
      "A core Research Triangle city, strong in software, life sciences and university research.",
    techScene:
      "Durham is a core Research Triangle city, strong in software and life sciences and anchored by major universities, with a deep and growing technical talent pool.",
  },
  {
    slug: "boulder", name: "Boulder", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Colorado", stateCode: "CO", metro: "Boulder metro",
    timezone: "Mountain Time (MT)",
    blurb:
      "A Colorado university town with a dense startup, aerospace and software ecosystem.",
    techScene:
      "Boulder packs a dense startup, aerospace and software ecosystem around a major research university, with high demand for engineering, data and product talent relative to its size.",
  },
  {
    slug: "ann-arbor", name: "Ann Arbor", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Michigan", stateCode: "MI", metro: "Ann Arbor metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Michigan university town with strengths in research, software and mobility tech.",
    techScene:
      "Ann Arbor is a research-driven university town with strengths in software, mobility and life sciences, supplying a highly-skilled engineering and data talent pool.",
  },
  {
    slug: "madison", name: "Madison", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Wisconsin", stateCode: "WI", metro: "Madison metro",
    timezone: "Central Time (CT)",
    blurb:
      "Wisconsin's capital and university city, strong in software, biotech and research.",
    techScene:
      "Madison combines state government and a major research university with strengths in software, biotech and health technology, supporting steady demand for technical talent.",
  },
  {
    slug: "provo", name: "Provo", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Utah", stateCode: "UT", metro: "Provo–Orem (Silicon Slopes)",
    timezone: "Mountain Time (MT)",
    blurb:
      "A core 'Silicon Slopes' city in Utah with a strong SaaS and startup presence.",
    techScene:
      "Provo is a core city of Utah's 'Silicon Slopes' corridor, with a strong SaaS and startup presence and a young, growing pool of software and product talent.",
  },
  {
    slug: "san-francisco-east-bay", name: "Fremont", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "San Francisco Bay Area",
    timezone: "Pacific Time (PT)",
    blurb:
      "A Bay Area city strong in advanced manufacturing and hardware on the eastern edge of Silicon Valley.",
    techScene:
      "Fremont sits on the eastern edge of Silicon Valley with strengths in advanced manufacturing and hardware, with deep access to the Bay Area's engineering talent.",
  },
  {
    slug: "el-paso", name: "El Paso", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Texas", stateCode: "TX", metro: "El Paso metro",
    timezone: "Mountain Time (MT)",
    blurb:
      "A west-Texas border metro with strengths in logistics, defence and cross-border trade.",
    techScene:
      "El Paso is a west-Texas border metro with strengths in logistics, defence and cross-border trade, and growing demand for software and IT freelancers.",
  },
  {
    slug: "oklahoma-city", name: "Oklahoma City", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Oklahoma", stateCode: "OK", metro: "Oklahoma City metro",
    timezone: "Central Time (CT)",
    blurb:
      "Oklahoma's capital, with strengths in energy, aerospace and a growing tech base.",
    techScene:
      "Oklahoma City has strengths in energy and aerospace, with a growing startup base and steady demand for software, data and IT freelancers.",
  },
  {
    slug: "tulsa", name: "Tulsa", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Oklahoma", stateCode: "OK", metro: "Tulsa metro",
    timezone: "Central Time (CT)",
    blurb:
      "An Oklahoma metro known for energy and a high-profile remote-worker recruitment programme.",
    techScene:
      "Tulsa has gained attention for its remote-worker recruitment programme, with growing demand for software, data and design freelancers alongside its energy industry.",
  },
  {
    slug: "wichita", name: "Wichita", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Kansas", stateCode: "KS", metro: "Wichita metro",
    timezone: "Central Time (CT)",
    blurb:
      "Kansas's largest city, a long-standing US aircraft-manufacturing centre.",
    techScene:
      "Wichita is a long-standing aircraft-manufacturing centre, with growing demand for engineering, software and data freelancers supporting aerospace and industrial employers.",
  },
  {
    slug: "new-orleans", name: "New Orleans", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Louisiana", stateCode: "LA", metro: "Greater New Orleans",
    timezone: "Central Time (CT)",
    blurb:
      "A Louisiana port city with a growing software, creative and digital-media scene.",
    techScene:
      "New Orleans pairs its port, tourism and energy economy with a growing software, creative and digital-media scene, attracting remote and freelance tech talent.",
  },
  {
    slug: "baton-rouge", name: "Baton Rouge", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Louisiana", stateCode: "LA", metro: "Baton Rouge metro",
    timezone: "Central Time (CT)",
    blurb:
      "Louisiana's capital, with strengths in petrochemicals, university research and growing IT services.",
    techScene:
      "Baton Rouge combines a petrochemical industrial base with a major research university and a growing IT-services sector, supporting demand for software and data freelancers.",
  },
  {
    slug: "birmingham", name: "Birmingham", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Alabama", stateCode: "AL", metro: "Greater Birmingham",
    timezone: "Central Time (CT)",
    blurb:
      "Alabama's largest metro, with strengths in healthcare, finance and biomedical research.",
    techScene:
      "Birmingham is Alabama's largest metro with strengths in healthcare, finance and biomedical research, and a growing base of software and data freelancers.",
  },
  {
    slug: "huntsville", name: "Huntsville", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Alabama", stateCode: "AL", metro: "Huntsville metro",
    timezone: "Central Time (CT)",
    blurb:
      "An Alabama metro known for aerospace, defence and engineering research.",
    techScene:
      "Huntsville is a noted aerospace and defence centre with a dense engineering workforce, supporting strong demand for software, data and systems freelancers.",
  },
  {
    slug: "charleston", name: "Charleston", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "South Carolina", stateCode: "SC", metro: "Charleston metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A South-Carolina coastal metro with a fast-growing software and aerospace scene.",
    techScene:
      "Charleston has built a fast-growing software and aerospace scene (sometimes called 'Silicon Harbor'), attracting remote tech talent to the South Carolina coast.",
  },
  {
    slug: "columbia-sc", name: "Columbia", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "South Carolina", stateCode: "SC", metro: "Columbia metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "South Carolina's capital and university city, with a growing insurance and tech base.",
    techScene:
      "Columbia pairs state government and a major university with a growing insurance and tech base, supporting steady demand for software and data freelancers.",
  },
  {
    slug: "greenville", name: "Greenville", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "South Carolina", stateCode: "SC", metro: "Greenville metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "An upstate-South-Carolina metro with strengths in advanced manufacturing and engineering.",
    techScene:
      "Greenville has strengths in advanced manufacturing and engineering, with a growing tech scene and rising demand for software and data freelancers in upstate South Carolina.",
  },
  {
    slug: "knoxville", name: "Knoxville", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Tennessee", stateCode: "TN", metro: "Knoxville metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Tennessee university city near major national-laboratory research.",
    techScene:
      "Knoxville sits near major national-laboratory research and a large university, with growing demand for software, data and engineering freelancers.",
  },
  {
    slug: "chattanooga", name: "Chattanooga", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Tennessee", stateCode: "TN", metro: "Chattanooga metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Tennessee metro known for its very high-speed municipal fibre network and growing startup scene.",
    techScene:
      "Chattanooga is known for its high-speed municipal fibre network ('Gig City'), which has helped seed a growing startup scene and demand for software and data freelancers.",
  },
  {
    slug: "grand-rapids", name: "Grand Rapids", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Michigan", stateCode: "MI", metro: "Grand Rapids metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A western-Michigan metro with strengths in manufacturing, healthcare and design.",
    techScene:
      "Grand Rapids combines manufacturing, healthcare and design with a growing tech scene, supplying competitively-priced software and data talent in western Michigan.",
  },
  {
    slug: "buffalo", name: "Buffalo", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "New York", stateCode: "NY", metro: "Buffalo–Niagara",
    timezone: "Eastern Time (ET)",
    blurb:
      "A western-New-York metro with strengths in healthcare, advanced manufacturing and research.",
    techScene:
      "Buffalo has strengths in healthcare, advanced manufacturing and university research, with a growing tech scene and demand for software and data freelancers.",
  },
  {
    slug: "rochester", name: "Rochester", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "New York", stateCode: "NY", metro: "Rochester metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "An upstate-New-York metro with a long history in optics, imaging and engineering.",
    techScene:
      "Rochester has a long history in optics, imaging and engineering, with a research-driven workforce and demand for software, data and hardware freelancers.",
  },
  {
    slug: "hartford", name: "Hartford", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Connecticut", stateCode: "CT", metro: "Greater Hartford",
    timezone: "Eastern Time (ET)",
    blurb:
      "A long-standing US insurance centre in Connecticut with a growing insurtech scene.",
    techScene:
      "Hartford is a long-standing US insurance centre with a growing insurtech and data scene, supporting steady demand for software and analytics freelancers.",
  },
  {
    slug: "providence", name: "Providence", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Rhode Island", stateCode: "RI", metro: "Providence metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "Rhode Island's capital, a New-England university city with a strong design and creative scene.",
    techScene:
      "Providence is a New-England university city with a strong design and creative community, and growing demand for software, design and data freelancers.",
  },
  {
    slug: "virginia-beach", name: "Virginia Beach", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Virginia", stateCode: "VA", metro: "Hampton Roads",
    timezone: "Eastern Time (ET)",
    blurb:
      "A coastal-Virginia metro in Hampton Roads with strengths in defence and logistics.",
    techScene:
      "Virginia Beach anchors the Hampton Roads region, with strengths in defence, logistics and a growing tech sector supporting demand for software and data freelancers.",
  },
  {
    slug: "norfolk", name: "Norfolk", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Virginia", stateCode: "VA", metro: "Hampton Roads",
    timezone: "Eastern Time (ET)",
    blurb:
      "A major US naval port in Hampton Roads, Virginia, with a growing tech-services base.",
    techScene:
      "Norfolk is a major naval port in the Hampton Roads region, with a growing tech-services base and demand for software, data and cybersecurity freelancers.",
  },
  {
    slug: "des-moines", name: "Des Moines", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Iowa", stateCode: "IA", metro: "Des Moines metro",
    timezone: "Central Time (CT)",
    blurb:
      "Iowa's capital, a notable US insurance and financial-services centre.",
    techScene:
      "Des Moines is a notable US insurance and financial-services centre, with a growing insurtech and data scene and steady demand for software freelancers.",
  },
  {
    slug: "boise", name: "Boise", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Idaho", stateCode: "ID", metro: "Boise metro",
    timezone: "Mountain Time (MT)",
    blurb:
      "Idaho's capital and a fast-growing Mountain-West tech and semiconductor metro.",
    techScene:
      "Boise is a fast-growing Mountain-West metro with a long-standing semiconductor presence and rising demand for software, data and product freelancers.",
  },
  {
    slug: "spokane", name: "Spokane", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Washington", stateCode: "WA", metro: "Spokane metro",
    timezone: "Pacific Time (PT)",
    blurb:
      "An eastern-Washington metro with strengths in healthcare, aerospace and a growing tech base.",
    techScene:
      "Spokane has strengths in healthcare and aerospace, with a growing tech base and rising demand for remote software, data and design freelancers in eastern Washington.",
  },
  {
    slug: "reno", name: "Reno", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Nevada", stateCode: "NV", metro: "Reno–Sparks",
    timezone: "Pacific Time (PT)",
    blurb:
      "A northern-Nevada metro with growing logistics, data-centre and tech activity near the Bay Area.",
    techScene:
      "Reno has growing logistics, data-centre and manufacturing activity benefiting from its proximity to the Bay Area, with rising demand for software and data freelancers.",
  },
  {
    slug: "colorado-springs", name: "Colorado Springs", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Colorado", stateCode: "CO", metro: "Colorado Springs metro",
    timezone: "Mountain Time (MT)",
    blurb:
      "A Colorado metro with strengths in defence, aerospace and cybersecurity.",
    techScene:
      "Colorado Springs has strong defence, aerospace and cybersecurity sectors, with a skilled engineering workforce and demand for software and systems freelancers.",
  },
  {
    slug: "fort-collins", name: "Fort Collins", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Colorado", stateCode: "CO", metro: "Fort Collins metro",
    timezone: "Mountain Time (MT)",
    blurb:
      "A Colorado university town on the Front Range with a growing hardware and software scene.",
    techScene:
      "Fort Collins is a Front-Range university town with strengths in hardware, clean energy and software, supplying skilled engineering and data talent.",
  },
  {
    slug: "santa-barbara", name: "Santa Barbara", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "Santa Barbara metro",
    timezone: "Pacific Time (PT)",
    blurb:
      "A Southern-California coastal city with a niche software and research cluster ('Silicon Beach' north).",
    techScene:
      "Santa Barbara hosts a niche software and research cluster around its university, with demand for engineering, data and product freelancers on the Central Coast.",
  },
  {
    slug: "irvine", name: "Irvine", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "Greater Los Angeles",
    timezone: "Pacific Time (PT)",
    blurb:
      "An Orange-County city with a dense base of technology, gaming and semiconductor companies.",
    techScene:
      "Irvine hosts a dense base of technology, gaming and semiconductor companies in Orange County, with strong demand for software, product and design talent.",
  },
  {
    slug: "long-beach", name: "Long Beach", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "Greater Los Angeles",
    timezone: "Pacific Time (PT)",
    blurb:
      "A major US port city in the Los Angeles area with a growing tech and creative scene.",
    techScene:
      "Long Beach is a major US port city within Greater Los Angeles, with a growing tech and creative scene and deep access to the region's talent pool.",
  },
  {
    slug: "bakersfield", name: "Bakersfield", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "California", stateCode: "CA", metro: "Bakersfield metro",
    timezone: "Pacific Time (PT)",
    blurb:
      "A Central-Valley California metro with an energy and agriculture base and growing remote-work demand.",
    techScene:
      "Bakersfield is a Central-Valley metro with an energy and agriculture base and rising demand for remote freelance tech talent across software, data and design.",
  },
  {
    slug: "mesa", name: "Mesa", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Arizona", stateCode: "AZ", metro: "Greater Phoenix (Valley of the Sun)",
    timezone: "Mountain Time (MT, no DST)",
    blurb:
      "A large city in Greater Phoenix with growing aerospace, education and tech activity.",
    techScene:
      "Mesa is a large city within Greater Phoenix, with growing aerospace, education and tech activity and access to the metro's expanding engineering talent pool.",
  },
  {
    slug: "scottsdale", name: "Scottsdale", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Arizona", stateCode: "AZ", metro: "Greater Phoenix (Valley of the Sun)",
    timezone: "Mountain Time (MT, no DST)",
    blurb:
      "A Greater-Phoenix city with a notable base of software, fintech and digital-media companies.",
    techScene:
      "Scottsdale has a notable base of software, fintech and digital-media companies within Greater Phoenix, with strong demand for technical and creative freelancers.",
  },
  {
    slug: "plano", name: "Plano", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Texas", stateCode: "TX", metro: "Dallas–Fort Worth",
    timezone: "Central Time (CT)",
    blurb:
      "A northern-Dallas suburb hosting many corporate headquarters, telecom and tech companies.",
    techScene:
      "Plano hosts numerous corporate headquarters in telecom, finance and technology within the Dallas–Fort Worth metroplex, supporting strong demand for software and data talent.",
  },
  {
    slug: "henderson", name: "Henderson", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Nevada", stateCode: "NV", metro: "Las Vegas Valley",
    timezone: "Pacific Time (PT)",
    blurb:
      "A city in the Las Vegas Valley with growing tech, logistics and remote-work activity.",
    techScene:
      "Henderson is a growing city within the Las Vegas Valley, with rising tech, logistics and remote-work activity and demand for software and data freelancers.",
  },
  {
    slug: "chandler", name: "Chandler", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Arizona", stateCode: "AZ", metro: "Greater Phoenix (Valley of the Sun)",
    timezone: "Mountain Time (MT, no DST)",
    blurb:
      "A Greater-Phoenix city with a strong semiconductor and technology-manufacturing presence.",
    techScene:
      "Chandler has a strong semiconductor and technology-manufacturing presence within Greater Phoenix, supporting demand for engineering, data and software freelancers.",
  },
  {
    slug: "lincoln", name: "Lincoln", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Nebraska", stateCode: "NE", metro: "Lincoln metro",
    timezone: "Central Time (CT)",
    blurb:
      "Nebraska's capital and university city, with a growing software and startup scene.",
    techScene:
      "Lincoln pairs state government and a major university with a growing software and startup scene, supplying skilled engineering and data talent.",
  },
  {
    slug: "greensboro", name: "Greensboro", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "North Carolina", stateCode: "NC", metro: "Piedmont Triad",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Piedmont-Triad metro in North Carolina with strengths in logistics and manufacturing.",
    techScene:
      "Greensboro anchors North Carolina's Piedmont Triad, with strengths in logistics and manufacturing and a growing base of software and data freelancers.",
  },
  {
    slug: "winston-salem", name: "Winston-Salem", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "North Carolina", stateCode: "NC", metro: "Piedmont Triad",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Piedmont-Triad city in North Carolina with strengths in healthcare and biomedical research.",
    techScene:
      "Winston-Salem has strengths in healthcare and biomedical research within the Piedmont Triad, with growing demand for software, data and health-tech freelancers.",
  },
  {
    slug: "fayetteville-ar", name: "Fayetteville", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Arkansas", stateCode: "AR", metro: "Northwest Arkansas",
    timezone: "Central Time (CT)",
    blurb:
      "A Northwest-Arkansas university city near major corporate headquarters.",
    techScene:
      "Fayetteville anchors the fast-growing Northwest Arkansas region near major retail and logistics headquarters, with rising demand for software and data freelancers.",
  },
  {
    slug: "little-rock", name: "Little Rock", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Arkansas", stateCode: "AR", metro: "Little Rock metro",
    timezone: "Central Time (CT)",
    blurb:
      "Arkansas's capital, with strengths in finance, healthcare and government services.",
    techScene:
      "Little Rock is Arkansas's capital with strengths in finance, healthcare and government services, supporting steady demand for software and data freelancers.",
  },
  {
    slug: "lexington", name: "Lexington", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Kentucky", stateCode: "KY", metro: "Lexington metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Kentucky university city with strengths in healthcare, research and manufacturing.",
    techScene:
      "Lexington is a Kentucky university city with strengths in healthcare, research and manufacturing, with growing demand for software and data freelancers.",
  },
  {
    slug: "dayton", name: "Dayton", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Ohio", stateCode: "OH", metro: "Dayton metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "An Ohio metro with a long aerospace and engineering heritage.",
    techScene:
      "Dayton has a long aerospace and engineering heritage anchored by major research and defence activity, with demand for software, data and systems freelancers.",
  },
  {
    slug: "syracuse", name: "Syracuse", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "New York", stateCode: "NY", metro: "Syracuse metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A central-New-York university city with growing research and tech activity.",
    techScene:
      "Syracuse is a central-New-York university city with growing research and tech activity, including emerging semiconductor investment in the wider region.",
  },
  {
    slug: "albany", name: "Albany", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "New York", stateCode: "NY", metro: "Capital District",
    timezone: "Eastern Time (ET)",
    blurb:
      "New York's capital, with strengths in government, research and nanotechnology.",
    techScene:
      "Albany pairs state government with strengths in research and nanotechnology in the Capital District, supporting demand for software, data and engineering talent.",
  },
  {
    slug: "worcester", name: "Worcester", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Massachusetts", stateCode: "MA", metro: "Greater Boston",
    timezone: "Eastern Time (ET)",
    blurb:
      "A central-Massachusetts city with strengths in biotech, healthcare and university research.",
    techScene:
      "Worcester has strengths in biotech, healthcare and university research within the wider Greater Boston region, supplying a skilled technical talent pool.",
  },
  {
    slug: "new-haven", name: "New Haven", country: "United States",
    countryCode: "US", region: "USA", currency: "USD", monument: "skyline",
    state: "Connecticut", stateCode: "CT", metro: "New Haven metro",
    timezone: "Eastern Time (ET)",
    blurb:
      "A Connecticut university city with strengths in biotech and life-sciences research.",
    techScene:
      "New Haven is a Connecticut university city with strengths in biotech and life-sciences research, supplying a highly-skilled technical and scientific talent pool.",
  },
];

const CITY_MAP = new Map(INTL_CITIES.map((c) => [c.slug, c]));

export function getIntlCity(slug: string): IntlCity | null {
  return CITY_MAP.get(slug) ?? null;
}

export function allIntlCitySlugs(): string[] {
  return INTL_CITIES.map((c) => c.slug);
}

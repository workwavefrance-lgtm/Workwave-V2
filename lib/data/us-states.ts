/**
 * États US ciblés par Workwave AI (anglais) — Phase 2 USA.
 *
 * Servent les hubs /en/ai/[skill]/state/[state] (ex. /en/ai/web-development/state/california)
 * qui maillent vers les villes de l'état. Segment littéral "state/" => aucun
 * conflit avec /en/ai/[skill]/[city] (cf. leçon CLAUDE.md 18/04 sur les slugs).
 *
 * RÈGLE : faits PUBLICS uniquement (division census, capitale, blurb qualitatif).
 * AUCUN chiffre inventé. Les villes d'un état sont dérivées de INTL_CITIES
 * (city.state === state.name) — pas de duplication.
 */

export type UsState = {
  slug: string; // kebab-case ("california", "new-york")
  name: string; // "California"
  code: string; // "CA"
  division: "Northeast" | "Midwest" | "South" | "West"; // régions Census US
  blurb: string; // 1 phrase factuelle/qualitative
};

export const US_STATES: UsState[] = [
  { slug: "alabama", name: "Alabama", code: "AL", division: "South", blurb: "A Southern state with growing demand for remote freelance tech, data and design talent." },
  { slug: "alaska", name: "Alaska", code: "AK", division: "West", blurb: "Remote-first by geography, Alaska's businesses increasingly hire freelance tech talent online." },
  { slug: "arizona", name: "Arizona", code: "AZ", division: "West", blurb: "Anchored by the fast-growing Phoenix metro, Arizona has rising demand for software and data freelancers." },
  { slug: "arkansas", name: "Arkansas", code: "AR", division: "South", blurb: "Home to major retail and logistics headquarters, Arkansas hires freelance tech and data talent." },
  { slug: "california", name: "California", code: "CA", division: "West", blurb: "Home to Silicon Valley, Los Angeles and San Diego — the largest tech economy in the United States." },
  { slug: "colorado", name: "Colorado", code: "CO", division: "West", blurb: "Denver and the Front Range are a magnet for remote-first startups and engineering talent." },
  { slug: "connecticut", name: "Connecticut", code: "CT", division: "Northeast", blurb: "A Northeast hub for finance and insurance, with steady demand for software and data freelancers." },
  { slug: "delaware", name: "Delaware", code: "DE", division: "South", blurb: "A corporate and finance-friendly state with demand for freelance development and data skills." },
  { slug: "florida", name: "Florida", code: "FL", division: "South", blurb: "Led by Miami's fintech and crypto scene plus Orlando and Tampa, Florida is a fast-rising tech market." },
  { slug: "georgia", name: "Georgia", code: "GA", division: "South", blurb: "Atlanta is the tech capital of the Southeast, strong in fintech, logistics and media." },
  { slug: "hawaii", name: "Hawaii", code: "HI", division: "West", blurb: "A remote-work-friendly state where businesses hire freelance tech talent across time zones." },
  { slug: "idaho", name: "Idaho", code: "ID", division: "West", blurb: "Boise's fast population growth is fueling rising demand for freelance software and data talent." },
  { slug: "illinois", name: "Illinois", code: "IL", division: "Midwest", blurb: "Chicago anchors the Midwest tech scene with strengths in fintech, logistics and enterprise software." },
  { slug: "indiana", name: "Indiana", code: "IN", division: "Midwest", blurb: "Indianapolis has a growing enterprise-software and SaaS scene hiring freelance tech talent." },
  { slug: "iowa", name: "Iowa", code: "IA", division: "Midwest", blurb: "A Midwest state with insurance, agtech and data-center investment driving freelance tech demand." },
  { slug: "kansas", name: "Kansas", code: "KS", division: "Midwest", blurb: "Anchored by the Kansas City metro, with demand for freelance software, data and design talent." },
  { slug: "kentucky", name: "Kentucky", code: "KY", division: "South", blurb: "Louisville and Lexington host logistics and healthcare firms hiring freelance tech talent." },
  { slug: "louisiana", name: "Louisiana", code: "LA", division: "South", blurb: "New Orleans and Baton Rouge have a growing digital and creative freelance market." },
  { slug: "maine", name: "Maine", code: "ME", division: "Northeast", blurb: "A remote-work-friendly New England state with rising demand for freelance tech talent." },
  { slug: "maryland", name: "Maryland", code: "MD", division: "South", blurb: "Part of the DC metro, Maryland is strong in cybersecurity, biotech and data freelance work." },
  { slug: "massachusetts", name: "Massachusetts", code: "MA", division: "Northeast", blurb: "Greater Boston pairs world-class universities with deep biotech and enterprise-software demand." },
  { slug: "michigan", name: "Michigan", code: "MI", division: "Midwest", blurb: "Detroit and Ann Arbor blend automotive tech, mobility and a growing software freelance market." },
  { slug: "minnesota", name: "Minnesota", code: "MN", division: "Midwest", blurb: "Minneapolis–Saint Paul hosts major corporates and a healthy software and data freelance scene." },
  { slug: "mississippi", name: "Mississippi", code: "MS", division: "South", blurb: "A Southern state with growing remote demand for freelance tech, data and design talent." },
  { slug: "missouri", name: "Missouri", code: "MO", division: "Midwest", blurb: "Kansas City and St. Louis anchor a Midwest market for freelance software and data talent." },
  { slug: "montana", name: "Montana", code: "MT", division: "West", blurb: "A remote-first mountain state where businesses hire freelance tech talent online." },
  { slug: "nebraska", name: "Nebraska", code: "NE", division: "Midwest", blurb: "Omaha hosts finance and insurance leaders with steady freelance tech and data demand." },
  { slug: "nevada", name: "Nevada", code: "NV", division: "West", blurb: "Las Vegas and Reno have a growing tech and digital-creative freelance market." },
  { slug: "new-hampshire", name: "New Hampshire", code: "NH", division: "Northeast", blurb: "A New England state within reach of Boston, with demand for freelance software and data talent." },
  { slug: "new-jersey", name: "New Jersey", code: "NJ", division: "Northeast", blurb: "Part of the New York metro, New Jersey is strong in pharma, finance and enterprise tech." },
  { slug: "new-mexico", name: "New Mexico", code: "NM", division: "West", blurb: "Albuquerque pairs national labs and research with a growing freelance tech market." },
  { slug: "new-york", name: "New York", code: "NY", division: "Northeast", blurb: "Led by New York City — finance, media and 'Silicon Alley', one of the largest freelance markets anywhere." },
  { slug: "north-carolina", name: "North Carolina", code: "NC", division: "South", blurb: "The Research Triangle (Raleigh–Durham) and Charlotte drive strong software, data and fintech demand." },
  { slug: "north-dakota", name: "North Dakota", code: "ND", division: "Midwest", blurb: "A remote-first state with growing demand for freelance tech and data talent." },
  { slug: "ohio", name: "Ohio", code: "OH", division: "Midwest", blurb: "Columbus, Cleveland and Cincinnati host insurance, healthcare and enterprise-software employers." },
  { slug: "oklahoma", name: "Oklahoma", code: "OK", division: "South", blurb: "Oklahoma City and Tulsa have a growing remote and freelance tech market." },
  { slug: "oregon", name: "Oregon", code: "OR", division: "West", blurb: "Portland's 'Silicon Forest' is strong in hardware, software and design freelance talent." },
  { slug: "pennsylvania", name: "Pennsylvania", code: "PA", division: "Northeast", blurb: "Philadelphia and Pittsburgh blend healthcare, robotics, AI research and enterprise software." },
  { slug: "rhode-island", name: "Rhode Island", code: "RI", division: "Northeast", blurb: "A compact New England state with design, education and a growing freelance tech market." },
  { slug: "south-carolina", name: "South Carolina", code: "SC", division: "South", blurb: "Charleston and Greenville host a growing software, automotive-tech and freelance digital scene." },
  { slug: "south-dakota", name: "South Dakota", code: "SD", division: "Midwest", blurb: "A finance-friendly, remote-first state with rising freelance tech demand." },
  { slug: "tennessee", name: "Tennessee", code: "TN", division: "South", blurb: "Nashville's healthcare and music-tech scene plus Memphis logistics drive freelance tech demand." },
  { slug: "texas", name: "Texas", code: "TX", division: "South", blurb: "Austin, Dallas, Houston and San Antonio make Texas one of the fastest-growing US tech markets." },
  { slug: "utah", name: "Utah", code: "UT", division: "West", blurb: "The 'Silicon Slopes' (Salt Lake City, Provo) are one of the fastest-growing US SaaS hubs." },
  { slug: "vermont", name: "Vermont", code: "VT", division: "Northeast", blurb: "A remote-work-friendly New England state with demand for freelance tech and design talent." },
  { slug: "virginia", name: "Virginia", code: "VA", division: "South", blurb: "Northern Virginia anchors US cloud and data-center infrastructure plus cybersecurity demand." },
  { slug: "washington", name: "Washington", code: "WA", division: "West", blurb: "Seattle is a top-tier engineering hub anchored by global cloud and e-commerce companies." },
  { slug: "west-virginia", name: "West Virginia", code: "WV", division: "South", blurb: "A remote-first state with growing demand for freelance tech and data talent." },
  { slug: "wisconsin", name: "Wisconsin", code: "WI", division: "Midwest", blurb: "Madison and Milwaukee blend healthcare-tech, manufacturing software and a freelance digital scene." },
  { slug: "wyoming", name: "Wyoming", code: "WY", division: "West", blurb: "A business-friendly, remote-first state with rising freelance tech demand." },
  { slug: "washington-dc", name: "Washington, D.C.", code: "DC", division: "South", blurb: "The nation's capital pairs government and defense tech with strong cybersecurity and cloud demand." },
];

const STATE_MAP = new Map(US_STATES.map((s) => [s.slug, s]));

export function getUsState(slug: string): UsState | null {
  return STATE_MAP.get(slug) ?? null;
}

export function usStateSlugs(): string[] {
  return US_STATES.map((s) => s.slug);
}

// Tarifs freelance SENIOR par pays (USD/heure), SOURCÉS Perplexity le 2026-06-06.
// Ancre géographique pour les hubs pricing skill×pays (/en/ai/[skill]/country/[country]).
// NE PAS éditer à la main : relancer scripts/fetch-ai-country-rates.ts. Zéro chiffre inventé.

export type AiCountryRate = { slug: string; name: string; seniorHourlyMinUsd: number | null; seniorHourlyMaxUsd: number | null; level: string | null; note: string; sources: string[]; retrievedAt: string };

export const AI_COUNTRY_RATES: Record<string, AiCountryRate> = {
  "united-states": {
    "slug": "united-states",
    "name": "United States",
    "seniorHourlyMinUsd": 85,
    "seniorHourlyMaxUsd": 190,
    "level": "premium",
    "note": "U.S. senior freelance software/digital hourly rates sit in the global premium tier and are generally well above mid-market ranges, with reported senior developer benchmarks around $85-$110/hour average and senior full-stack rates around $130-$190/hour.",
    "sources": [
      "https://geomotiv.com/blog/software-engineer-hourly-rate-in-the-usa/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://mismo.team/how-much-does-it-cost-to-hire-a-developer/",
      "https://www.hireinsouth.com/post/software-developer-rates-by-country"
    ],
    "retrievedAt": "2026-06-06"
  },
  "india": {
    "slug": "india",
    "name": "India",
    "seniorHourlyMinUsd": 15,
    "seniorHourlyMaxUsd": 40,
    "level": "budget",
    "note": "For senior freelance software/digital talent based in India, realistic hourly pricing is still below the global mid-market, with many India-based rates clustering around $6–$25/hour and experienced/specialist Indian rates often around ₹2,000–₹5,000+/hour ($24–$60+/hour), so a $15–$40/hour senior band is a conservative market fit.",
    "sources": [
      "https://www.karboncard.com/blog/freelance-hourly-rate",
      "https://www.upwork.com/resources/upwork-hourly-rates",
      "https://hubstaff.com/time-tracking/average-hourly-rates",
      "https://clockify.me/average-hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "japan": {
    "slug": "japan",
    "name": "Japan",
    "seniorHourlyMinUsd": 20,
    "seniorHourlyMaxUsd": 50,
    "level": "mid",
    "note": "For Japan, senior freelance software/digital hourly rates sit below premium US/EU markets and are generally in a mid-market global band, with Upwork showing software developers at about $10–$100/hr and senior Japan-based salary data translating to a lower local market ceiling than premium freelance hubs.",
    "sources": [
      "https://japan-dev.com/blog/software-developer-salaries-in-japan-the-ultimate-guide",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.levels.fyi/companies/upwork/salaries/software-engineer",
      "https://gigradar.io/blog/upwork-hourly-rate"
    ],
    "retrievedAt": "2026-06-06"
  },
  "china": {
    "slug": "china",
    "name": "China",
    "seniorHourlyMinUsd": 24,
    "seniorHourlyMaxUsd": 35,
    "level": "budget",
    "note": "China-based freelance software and digital talent is in a lower-cost hourly band than the global mid-market, with Asia software engineer rates cited around $24-$35/hour and Upwork/market data placing many skilled freelancers above entry-level but below Western premium rates.",
    "sources": [
      "https://www.upwork.com/resources/upwork-hourly-rates",
      "https://hubstaff.com/time-tracking/average-hourly-rates",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.youtube.com/watch?v=PwbFc-fC_f8"
    ],
    "retrievedAt": "2026-06-06"
  },
  "united-arab-emirates": {
    "slug": "united-arab-emirates",
    "name": "United Arab Emirates",
    "seniorHourlyMinUsd": 60,
    "seniorHourlyMaxUsd": 100,
    "level": "mid",
    "note": "For the UAE, reported senior freelance software/developer hourly rates cluster around about $60–$100/hr, which is above low-cost markets but below premium US/Switzerland-style pricing.",
    "sources": [
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "saudi-arabia": {
    "slug": "saudi-arabia",
    "name": "Saudi Arabia",
    "seniorHourlyMinUsd": 55,
    "seniorHourlyMaxUsd": 95,
    "level": "mid",
    "note": "Saudi Arabia’s senior freelance software/digital hourly rates are generally below premium global markets and are commonly cited around the mid-market range, roughly $55–$95 per hour.",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "mexico": {
    "slug": "mexico",
    "name": "Mexico",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 80,
    "level": "mid",
    "note": "Mexico’s senior freelance software/digital hourly rates are typically below U.S. premium-market pricing and sit in a mid-range band relative to the global market.",
    "sources": [
      "https://huntly.ai/blog/software-developer-salary-mexico/",
      "https://mismo.team/how-much-does-it-cost-to-hire-a-developer/",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "indonesia": {
    "slug": "indonesia",
    "name": "Indonesia",
    "seniorHourlyMinUsd": 24,
    "seniorHourlyMaxUsd": 33,
    "level": "budget",
    "note": "Indonesia fits the Southeast Asia low-cost band, where senior software freelancer hourly rates are typically around $24–$33/hour, well below global senior-market benchmarks.",
    "sources": [
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "brazil": {
    "slug": "brazil",
    "name": "Brazil",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 75,
    "level": "mid",
    "note": "Brazil-based senior freelance software talent typically prices below U.S./Western Europe levels but around the upper-middle of Latin America, with 2026 benchmarked senior hourly rates commonly in the $45–$75 range.",
    "sources": [
      "https://www.howdy.com/blog/brazil-software-engineer-salary-hiring-cost-benchmarks",
      "https://uvik.net/blog/global-software-developer-rates-2026/",
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "australia": {
    "slug": "australia",
    "name": "Australia",
    "seniorHourlyMinUsd": 63,
    "seniorHourlyMaxUsd": 85,
    "level": "mid",
    "note": "Australia’s senior freelance software rate sits in the global mid-market: roughly $63/hr median and up to about $85/hr for top specialists, below North America and above Europe/UK.",
    "sources": [
      "https://lemon.io/rate-calculator/australia/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.index.dev/blog/freelance-developer-rates",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "vietnam": {
    "slug": "vietnam",
    "name": "Vietnam",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 70,
    "level": "mid",
    "note": "Vietnam is a cost-efficient Southeast Asian market, and senior freelance hourly rates are typically below global premium markets while still reaching the mid-range for experienced specialists.",
    "sources": [
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/",
      "https://arc.dev/salaries/software-engineers-in-vietnam",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "thailand": {
    "slug": "thailand",
    "name": "Thailand",
    "seniorHourlyMinUsd": 25,
    "seniorHourlyMaxUsd": 55,
    "level": "mid",
    "note": "Thailand is a lower-cost Southeast Asian market, so experienced freelance software and digital talent typically sits below global premium markets and is usually priced in the mid-range rather than at North America or Western Europe senior rates.",
    "sources": [
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://arc.dev/salaries/software-engineers-in-thailand",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "switzerland": {
    "slug": "switzerland",
    "name": "Switzerland",
    "seniorHourlyMinUsd": 100,
    "seniorHourlyMaxUsd": 160,
    "level": "premium",
    "note": "Swiss senior freelance software and digital rates sit in the premium segment globally, with recent 2026 benchmarks showing senior developer medians around $50-$137/hour and common senior Swiss ranges around $100-$160/hour.",
    "sources": [
      "https://magicheidi.ch/hourly-rates",
      "https://lemon.io/rate-calculator/switzerland/",
      "https://arc.dev/employer-blog/freelance-developers-cost/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "spain": {
    "slug": "spain",
    "name": "Spain",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 65,
    "level": "mid",
    "note": "Spain’s senior freelance software/digital hourly rates are generally below premium US/Western Europe top-end pricing and sit in a mid-market band around $40–$65/hour versus the global market.",
    "sources": [
      "https://www.upwork.com/resources/upwork-hourly-rates",
      "https://hubstaff.com/time-tracking/average-hourly-rates",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.upwork.com/resources/how-to-set-your-freelance-rate"
    ],
    "retrievedAt": "2026-06-06"
  },
  "south-korea": {
    "slug": "south-korea",
    "name": "South Korea",
    "seniorHourlyMinUsd": 17,
    "seniorHourlyMaxUsd": 40,
    "level": "budget",
    "note": "South Korea’s freelance hourly software/deigital rates are materially below the global senior freelancer average and sit in a lower-cost market band than the U.S. or Western Europe.",
    "sources": [
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/",
      "https://whatisthesalary.com/it-salaries/software-engineer-salary-in-south-korea/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "south-africa": {
    "slug": "south-africa",
    "name": "South Africa",
    "seniorHourlyMinUsd": 35,
    "seniorHourlyMaxUsd": 55,
    "level": "mid",
    "note": "South Africa’s senior freelance software/digital hourly rates are generally below premium US/Western Europe levels and sit in a mid-market offshore band, around the mid-$30s to mid-$50s per hour.",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "philippines": {
    "slug": "philippines",
    "name": "Philippines",
    "seniorHourlyMinUsd": 25,
    "seniorHourlyMaxUsd": 55,
    "level": "mid",
    "note": "Philippines senior freelance software-digital hourly rates are generally below premium US/EU market rates and cluster in a mid-market band, with published 2026 benchmarks showing about $25–$55/hour for senior talent.",
    "sources": [
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "pakistan": {
    "slug": "pakistan",
    "name": "Pakistan",
    "seniorHourlyMinUsd": 20,
    "seniorHourlyMaxUsd": 45,
    "level": "mid",
    "note": "Pakistan sits in a lower-cost South Asian freelance band, with senior hourly rates commonly quoted around $20–$45/hr, below the global senior market and well under premium Western rates.",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.youtube.com/watch?v=TcmIPwsUh4U",
      "https://www.searchopal.com/blog/web-developer-salary-in-pakistan",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "new-zealand": {
    "slug": "new-zealand",
    "name": "New Zealand",
    "seniorHourlyMinUsd": null,
    "seniorHourlyMaxUsd": null,
    "level": "mid",
    "note": "New Zealand senior freelance digital/software hourly rates appear to sit in a mid-market band globally, with local benchmark data showing NZ app/developer rates around the low-$30s to low-$60s USD per hour rather than premium-market levels.",
    "sources": [
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.roberthalf.com/nz/en/job-details/senior-software-engineer",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "malaysia": {
    "slug": "malaysia",
    "name": "Malaysia",
    "seniorHourlyMinUsd": null,
    "seniorHourlyMaxUsd": null,
    "level": "mid",
    "note": "Malaysia is a lower-to-mid cost software market globally, but the provided sources support annual senior compensation more directly than a specific senior freelance hourly USD range.",
    "sources": [
      "https://www.levels.fyi/t/software-engineer/levels/senior/locations/malaysia",
      "https://arc.dev/salaries/software-engineers-in-malaysia",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "germany": {
    "slug": "germany",
    "name": "Germany",
    "seniorHourlyMinUsd": 45,
    "seniorHourlyMaxUsd": 60,
    "level": "mid",
    "note": "Germany’s senior freelance software rate is in the mid-market range and sits below global premium markets like North America, but above low-cost offshore markets.",
    "sources": [
      "https://lemon.io/rate-calculator/germany/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.index.dev/blog/freelance-developer-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "colombia": {
    "slug": "colombia",
    "name": "Colombia",
    "seniorHourlyMinUsd": 45,
    "seniorHourlyMaxUsd": 75,
    "level": "mid",
    "note": "Colombia’s senior freelance software/digital hourly rates are typically below premium global markets and fit a mid-market Latin America range rather than a premium one.",
    "sources": [
      "https://huntly.ai/blog/software-developer-salary-colombia/",
      "https://www.abbacustechnologies.com/developer-rates-in-latam-in-2026/",
      "https://mismo.team/how-much-does-it-cost-to-hire-a-developer/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "argentina": {
    "slug": "argentina",
    "name": "Argentina",
    "seniorHourlyMinUsd": 33,
    "seniorHourlyMaxUsd": 55,
    "level": "mid",
    "note": "In Argentina, senior freelance software rates sit in the global mid-market, with credible 2026 benchmarks around $40/hour and top senior generalist rates reaching the low-to-mid $50s.",
    "sources": [
      "https://lemon.io/rate-calculator/argentina/",
      "https://www.howdy.com/blog/argentina-software-engineer-salary-hiring-cost-benchmarks-2026",
      "https://plane.com/salaries/freelancer/argentina/for-employees",
      "https://hubstaff.com/time-tracking/average-hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "uruguay": {
    "slug": "uruguay",
    "name": "Uruguay",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 75,
    "level": "mid",
    "note": "Uruguay’s senior freelance software/digital hourly rates are typically below premium US/EU market pricing but above low-cost markets, with senior local compensation data and regional freelance benchmarks pointing to a mid-market band.",
    "sources": [
      "https://www.tecla.io/salaries/software-developer-salary-uruguay",
      "https://mismo.team/latam-software-engineer-salary-guide-averages-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://blog.nextideatech.com/what-are-the-average-salaries-for-software-developers-in-latin-american-countries/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "united-kingdom": {
    "slug": "united-kingdom",
    "name": "United Kingdom",
    "seniorHourlyMinUsd": 78,
    "seniorHourlyMaxUsd": 125,
    "level": "high",
    "note": "In the UK, senior freelance digital and software rates sit in the high tier globally, with a representative 2026 benchmark around $78–$125 per hour, above mid-market regions and below the top premium markets.",
    "sources": [
      "https://arc.dev/employer-blog/freelance-developers-cost/",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "tunisia": {
    "slug": "tunisia",
    "name": "Tunisia",
    "seniorHourlyMinUsd": 13,
    "seniorHourlyMaxUsd": 38,
    "level": "budget",
    "note": "Tunisia is a low-cost freelance market, with reported software/app developer hourly rates around $13-$38/hr, which sits below the global mid-market and well below premium markets.",
    "sources": [
      "https://arc.dev/salaries/software-engineers-in-tunisia",
      "https://www.index.dev/blog/freelance-developer-rates",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/",
      "https://employsome.com/blog/average-salary-tunisia/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "taiwan": {
    "slug": "taiwan",
    "name": "Taiwan",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 80,
    "level": "mid",
    "note": "Taiwan’s senior freelance software/digital hourly rates are generally below U.S. premium-market levels and fit a mid-market international band, with senior offshore-style benchmarks in Asia often clustering around roughly $40–$80/hour.",
    "sources": [
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "sweden": {
    "slug": "sweden",
    "name": "Sweden",
    "seniorHourlyMinUsd": 31,
    "seniorHourlyMaxUsd": 65,
    "level": "mid",
    "note": "Sweden’s senior freelance software rates sit in the mid-to-high global range, roughly around $31–$54/hr for senior contracts and up to about $65/hr for strong senior talent, which is below premium US/Nordics top-end pricing.",
    "sources": [
      "https://lemon.io/rate-calculator/sweden/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://arc.dev/salaries/software-engineers-in-sweden",
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country"
    ],
    "retrievedAt": "2026-06-06"
  },
  "sri-lanka": {
    "slug": "sri-lanka",
    "name": "Sri Lanka",
    "seniorHourlyMinUsd": null,
    "seniorHourlyMaxUsd": null,
    "level": "budget",
    "note": "Sri Lanka is a lower-cost freelance market; senior software and digital rates sit well below premium global levels (precise hourly figure under review — not displayed).",
    "sources": [
      "https://hashtagcoders.lk/blogs/remote-software-jobs-sri-lanka-2026",
      "https://www.levels.fyi/t/software-engineer/levels/senior/locations/sri-lanka",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "singapore": {
    "slug": "singapore",
    "name": "Singapore",
    "seniorHourlyMinUsd": 25,
    "seniorHourlyMaxUsd": 60,
    "level": "mid",
    "note": "Singapore freelance software/digital senior hourly rates are in a mid-market band and sit below top-tier global hubs like the U.S. and Switzerland, with published Singapore benchmarks commonly around $25–$60/hour.",
    "sources": [
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "senegal": {
    "slug": "senegal",
    "name": "Senegal",
    "seniorHourlyMinUsd": 15,
    "seniorHourlyMaxUsd": 40,
    "level": "budget",
    "note": "Senegal-based senior freelance software/digital rates are in a low-cost market band below the typical global senior developer range, with common offshore Africa comparisons clustering around roughly $15–$40 per hour.",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://devoxsoftware.com/blog/average-software-developer-hourly-rate/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "rwanda": {
    "slug": "rwanda",
    "name": "Rwanda",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 70,
    "level": "mid",
    "note": "Rwanda-based senior software/digital freelancers are best placed in a lower-cost international market, with realistic hourly senior rates around $40–$70/h, below North American and Western European senior market rates.",
    "sources": [
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.levels.fyi/t/software-engineer/locations/rwanda",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "qatar": {
    "slug": "qatar",
    "name": "Qatar",
    "seniorHourlyMinUsd": null,
    "seniorHourlyMaxUsd": null,
    "level": "mid",
    "note": "Qatar-specific senior freelance hourly-rate data for software or digital work is not directly evidenced in the provided sources, while the broader Upwork and global freelance data show senior expert rates commonly around $70-$150+/hour or about $101/hour worldwide for senior software engineers.",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.upwork.com/resources/upwork-hourly-rates",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "portugal": {
    "slug": "portugal",
    "name": "Portugal",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 45,
    "level": "mid",
    "note": "Portuguese senior freelance software rates are in the mid-market range globally, with 2026 developer data clustering around $40–$45 per hour and still below typical US senior rates.",
    "sources": [
      "https://lemon.io/rate-calculator/portugal/",
      "https://www.getharvest.com/calculators/hourly-rate-calculator-in-portugal",
      "https://plane.com/salaries/freelancer/portugal/for-employees",
      "https://www.portutax.com/news/self-employed-tax-guide-for-freelancers-in-portugal-2026-68"
    ],
    "retrievedAt": "2026-06-06"
  },
  "poland": {
    "slug": "poland",
    "name": "Poland",
    "seniorHourlyMinUsd": 30,
    "seniorHourlyMaxUsd": 65,
    "level": "mid",
    "note": "Poland’s senior freelance software/digital hourly rates sit in a mid-market band and are typically below Western Europe and U.S. senior benchmarks, with strong senior developers clustering around the $40–$65/hour range.",
    "sources": [
      "https://lemon.io/rate-calculator/poland/",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://arc.dev/employer-blog/freelance-developers-cost/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "peru": {
    "slug": "peru",
    "name": "Peru",
    "seniorHourlyMinUsd": 35,
    "seniorHourlyMaxUsd": 60,
    "level": "mid",
    "note": "Peru’s senior freelance software hourly rates are in a lower-to-mid global band, with 2026 market data placing experienced developers around $35–$60 per hour, below premium US and Western European rates but above many entry-level global markets.",
    "sources": [
      "https://lemon.io/rate-calculator/peru/",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.upwork.com/resources/upwork-hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "oman": {
    "slug": "oman",
    "name": "Oman",
    "seniorHourlyMinUsd": 15,
    "seniorHourlyMaxUsd": 45,
    "level": "mid",
    "note": "In Oman, a realistic senior freelance hourly rate is generally below premium global-market pricing and aligns with Upwork’s lower-to-mid international bands rather than top-tier US/EU rates.",
    "sources": [
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.upwork.com/resources/how-much-do-freelancers-make",
      "https://www.upwork.com/resources/highest-paying-freelance-jobs",
      "https://www.upwork.com/resources/upwork-hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "nigeria": {
    "slug": "nigeria",
    "name": "Nigeria",
    "seniorHourlyMinUsd": 23,
    "seniorHourlyMaxUsd": 45,
    "level": "budget",
    "note": "Nigeria’s senior freelance software rates are reported around $23–$45 per hour, which sits in a lower-cost, budget-to-low-mid global market band rather than the premium international tier.",
    "sources": [
      "https://lemon.io/rate-calculator/nigeria/",
      "https://golance.com/hiring/best-freelance-software-developers-hourly-rate",
      "https://jobmeter.app/blog/software-developer-salary-nigeria-2026-your-ultimate-guide",
      "https://www.upwork.com/hire/software-developers/cost/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "netherlands": {
    "slug": "netherlands",
    "name": "Netherlands",
    "seniorHourlyMinUsd": 95,
    "seniorHourlyMaxUsd": 130,
    "level": "high",
    "note": "In the Netherlands, senior freelance software and digital rates are generally above mid-market global levels and commonly fall in the roughly $95-$130/hour range, which is higher than low-cost markets but below premium hubs like Switzerland or top US tech markets.",
    "sources": [
      "https://nextleveljobs.eu/blog/software-engineer-salary/netherlands",
      "https://arc.dev/salaries/software-engineers-in-netherlands",
      "https://www.abbacustechnologies.com/web-developer-hiring-cost-in-the-netherlands-in-2026/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "morocco": {
    "slug": "morocco",
    "name": "Morocco",
    "seniorHourlyMinUsd": 15,
    "seniorHourlyMaxUsd": 40,
    "level": "mid",
    "note": "Morocco’s realistic senior freelance hourly rates sit below premium global markets and are generally in a lower-cost mid range, with Morocco-specific benchmarks around $16–$42/hr and common senior freelance developer rates worldwide much higher.",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "monaco": {
    "slug": "monaco",
    "name": "Monaco",
    "seniorHourlyMinUsd": 90,
    "seniorHourlyMaxUsd": 150,
    "level": "high",
    "note": "Monaco-based senior software/digital freelancers would typically price in the Western Europe premium band, above mid-market global rates and roughly aligned with senior freelance developer benchmarks.",
    "sources": [
      "https://arc.dev/employer-blog/freelance-developers-cost/",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://hubstaff.com/time-tracking/average-hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "kuwait": {
    "slug": "kuwait",
    "name": "Kuwait",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 70,
    "level": "mid",
    "note": "Kuwait-based senior software/digital freelancers appear to sit in a mid-market hourly band that is below premium US/Western Europe pricing but above low-cost markets, with a realistic senior range around $40–70/hour.",
    "sources": [
      "https://www.levels.fyi/t/software-engineer/locations/kuwait",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.glassdoor.com/Salaries/kuwait-senior-software-engineer-salary-SRCH_IL.0,6_IC3470419_KO7,31.htm"
    ],
    "retrievedAt": "2026-06-06"
  },
  "kenya": {
    "slug": "kenya",
    "name": "Kenya",
    "seniorHourlyMinUsd": 25,
    "seniorHourlyMaxUsd": 50,
    "level": "mid",
    "note": "Kenya-based senior software and digital freelancers typically price below US/Western Europe but around the lower-middle of global freelance hourly market bands, roughly in the $25-$50/hour range.",
    "sources": [
      "https://www.upwork.com/resources/upwork-hourly-rates",
      "https://clockify.me/average-hourly-rates",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.hireinsouth.com/post/how-much-does-upwork-cost"
    ],
    "retrievedAt": "2026-06-06"
  },
  "italy": {
    "slug": "italy",
    "name": "Italy",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 90,
    "level": "mid",
    "note": "Italy’s senior freelance software/digital hourly rates are generally below premium US/Swiss levels and sit in a mid-market band, with Upwork-style benchmarks for experienced developers commonly clustering around the $40–$90/hour range.",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.youtube.com/watch?v=jv-eTZh5shs"
    ],
    "retrievedAt": "2026-06-06"
  },
  "israel": {
    "slug": "israel",
    "name": "Israel",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 75,
    "level": "mid",
    "note": "Israel’s senior freelance software/digital rates are generally above low-cost markets and sit around the upper-mid global band, with market benchmarks showing roughly $47/h average freelancer rates and Israel hourly ranges around $31–$75/h.",
    "sources": [
      "https://globalbit.co.il/blog/real-cost-hiring-developer-israel",
      "https://www.freelancermap.com/freelancer/israel",
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "ireland": {
    "slug": "ireland",
    "name": "Ireland",
    "seniorHourlyMinUsd": 30,
    "seniorHourlyMaxUsd": 60,
    "level": "mid",
    "note": "Ireland’s realistic senior freelance hourly rates sit below US premium markets and align with a mid-market European range, with one 2026 estimate placing Ireland at about $30–60/hour for app/developer work.",
    "sources": [
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.index.dev/blog/freelance-developer-rates",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "hong-kong": {
    "slug": "hong-kong",
    "name": "Hong Kong",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 70,
    "level": "high",
    "note": "Hong Kong’s realistic senior freelance software/digital hourly rates are generally in the upper-mid to high global range, below premium U.S./Western Europe pricing but above low-cost markets.",
    "sources": [
      "https://arc.dev/salaries/software-engineers-in-hong-kong",
      "https://www.levels.fyi/t/software-engineer/levels/senior/locations/hong-kong-hkg",
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://whatisthesalary.com/it-salaries/software-engineer-salary-in-hong-kong/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "ghana": {
    "slug": "ghana",
    "name": "Ghana",
    "seniorHourlyMinUsd": null,
    "seniorHourlyMaxUsd": null,
    "level": null,
    "note": "",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://www.levels.fyi/companies/upwork/salaries/software-engineer",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.index.dev/blog/freelance-developer-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "france": {
    "slug": "france",
    "name": "France",
    "seniorHourlyMinUsd": 32,
    "seniorHourlyMaxUsd": 78,
    "level": "mid",
    "note": "France’s senior freelance hourly rates are a global mid-tier level, below North America but above lower-cost regions, with a realistic senior software rate around $32-$78/hour.",
    "sources": [
      "https://lemon.io/rate-calculator/france/",
      "https://www.abbacustechnologies.com/developer-rates-and-costs-in-france-in-2026/",
      "https://arc.dev/employer-blog/freelance-developers-cost/",
      "https://clockify.me/average-hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "estonia": {
    "slug": "estonia",
    "name": "Estonia",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 65,
    "level": "mid",
    "note": "Estonia’s senior freelance software/digital hourly rates sit in the Eastern Europe/Baltic range and are well below U.S./Western European premium-market pricing.",
    "sources": [
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "egypt": {
    "slug": "egypt",
    "name": "Egypt",
    "seniorHourlyMinUsd": 12,
    "seniorHourlyMaxUsd": 35,
    "level": "mid",
    "note": "Egypt’s experienced freelance software/digital rates are generally below premium Western markets and sit around the lower-to-mid international hourly band, with Upwork-style senior developer pricing commonly centering in the teens to low-30s USD per hour.",
    "sources": [
      "https://www.upwork.com/hire/software-developers/cost/",
      "https://arc.dev/salaries/software-engineers-in-egypt",
      "https://www.levels.fyi/t/software-engineer/levels/senior/locations/cairo-egy",
      "https://gigradar.io/blog/upwork-hourly-rate"
    ],
    "retrievedAt": "2026-06-06"
  },
  "denmark": {
    "slug": "denmark",
    "name": "Denmark",
    "seniorHourlyMinUsd": 44,
    "seniorHourlyMaxUsd": 95,
    "level": "high",
    "note": "Denmark’s senior freelance software/digital hourly rates sit in a high-cost European band, below top-tier U.S./Swiss premium pricing but above low- and mid-cost global markets.",
    "sources": [
      "https://www.hyperbolic.dk/en/hyperacademy/money-in-the-industry-in-denmark-how-much-does-a-software-developer-earn",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "chile": {
    "slug": "chile",
    "name": "Chile",
    "seniorHourlyMinUsd": 30,
    "seniorHourlyMaxUsd": 70,
    "level": "mid",
    "note": "Chile’s senior freelance hourly rates are generally below premium US/Western Europe market levels and fit a mid-market band, with South America averages and Latin America offshore developer benchmarks clustering around roughly $24–$47/hour.",
    "sources": [
      "https://www.upwork.com/resources/upwork-hourly-rates",
      "https://hubstaff.com/time-tracking/average-hourly-rates",
      "https://gigradar.io/blog/upwork-hourly-rate",
      "https://www.upwork.com/resources/how-to-set-your-freelance-rate"
    ],
    "retrievedAt": "2026-06-06"
  },
  "cambodia": {
    "slug": "cambodia",
    "name": "Cambodia",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 70,
    "level": "mid",
    "note": "For Cambodia, a realistic senior freelance hourly rate is typically below premium Western-market pricing and fits a lower-cost Southeast Asia outsourcing band, with senior rates commonly around $40–$70/hour versus $90+/hour in North America and Western Europe.",
    "sources": [
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://devoxsoftware.com/blog/average-software-developer-hourly-rate/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "belgium": {
    "slug": "belgium",
    "name": "Belgium",
    "seniorHourlyMinUsd": 90,
    "seniorHourlyMaxUsd": 130,
    "level": "high",
    "note": "Belgium’s senior freelance software rates are reported around €90–€130+ per hour, which places them in the high but not premium segment of the global senior freelance market.",
    "sources": [
      "https://www.abbacustechnologies.com/developer-rates-and-pricing-in-belgium-for-2026/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "bangladesh": {
    "slug": "bangladesh",
    "name": "Bangladesh",
    "seniorHourlyMinUsd": 25,
    "seniorHourlyMaxUsd": 50,
    "level": "budget",
    "note": "Bangladesh sits in the low-cost South Asia freelance market, where senior software hourly rates are typically well below global senior-market levels and often cluster around the mid-$20s to low-$50s per hour.",
    "sources": [
      "https://arc.dev/salaries/software-engineers-in-bangladesh",
      "https://www.remotecrew.io/blog/software-developer-per-hour-rate-by-country",
      "https://www.aalpha.net/articles/offshore-software-development-hourly-rates/",
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "bahrain": {
    "slug": "bahrain",
    "name": "Bahrain",
    "seniorHourlyMinUsd": 40,
    "seniorHourlyMaxUsd": 90,
    "level": "mid",
    "note": "Bahrain’s senior freelance software/digital hourly rates are realistically in the global mid-market range, below premium US/Western Europe pricing but above low-cost offshore markets.",
    "sources": [
      "https://solohourly.com/guides/average-freelance-rates-2026",
      "https://hubstaff.com/time-tracking/average-hourly-rates",
      "https://www.glassdoor.com/Salaries/manama-bahrain-freelance-designer-salary-SRCH_IL.0,14_IM3045_KO15,33.htm",
      "https://www.upwork.com/resources/upwork-hourly-rates"
    ],
    "retrievedAt": "2026-06-06"
  },
  "austria": {
    "slug": "austria",
    "name": "Austria",
    "seniorHourlyMinUsd": 80,
    "seniorHourlyMaxUsd": 120,
    "level": "high",
    "note": "Austria is a high-cost Western European market, so experienced freelance software/digital rates are typically above mid-market countries and sit below top premium hubs like Switzerland or the U.S.",
    "sources": [
      "https://www.contractrates.fyi/Senior-Software-Engineer/hourly-rates",
      "https://www.index.dev/blog/freelance-developer-rates",
      "https://arc.dev/employer-blog/software-developer-freelance-vs-full-time-costs/",
      "https://jaydevs.com/how-much-does-it-cost-to-hire-app-developer/"
    ],
    "retrievedAt": "2026-06-06"
  }
};

export function getAiCountryRate(slug: string): AiCountryRate | null {
  return AI_COUNTRY_RATES[slug] || null;
}

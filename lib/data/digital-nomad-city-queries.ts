// Top requêtes Google + services demandés + hubs par ville digital nomad (sourcé Perplexity le 2026-06-06).
// Utilisé pour enrichir SEO les pages /en/ai/[skill]/[city] des villes DN.
// NE PAS éditer à la main : relancer scripts/fetch-digital-nomad-queries.ts.

export type CityQueryData = { slug: string; name: string; country: string; topQueries: string[]; popularServices: string[]; hubs: string[]; sources: string[]; retrievedAt: string };

export const DN_CITY_QUERIES: Record<string, CityQueryData> = {
  "phuket": {
    "slug": "phuket",
    "name": "Phuket",
    "country": "Thailand",
    "topQueries": [
      "hire social media manager phuket",
      "freelance web designer phuket",
      "phuket seo freelancer",
      "hire graphic designer phuket",
      "phuket video editor freelancer",
      "phuket copywriter freelancer"
    ],
    "popularServices": [
      "social media management",
      "web design",
      "graphic design",
      "seo",
      "video editing"
    ],
    "hubs": [
      "HOMA Phuket Town",
      "The Slate Phuket",
      "Baan Karonburi Resort",
      "Phuket Town coworking"
    ],
    "sources": [
      "https://www.twine.net/find/social-media-managers/th/phuket",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-ads-freelancers/th/",
      "https://www.truelancer.com/google-adwords-freelancers-in-bangkok?page=34"
    ],
    "retrievedAt": "2026-06-06"
  },
  "koh-samui": {
    "slug": "koh-samui",
    "name": "Koh Samui",
    "country": "Thailand",
    "topQueries": [],
    "popularServices": [
      "web design",
      "social media management",
      "video editing",
      "copywriting",
      "seo"
    ],
    "hubs": [
      "coworking koh samui",
      "koh samui coliving",
      "coworking space koh samui",
      "digital nomad hub koh samui"
    ],
    "sources": [
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-search-agents/th/",
      "https://www.truelancer.com/google-adwords-freelancers-in-bangkok?page=34",
      "https://www.twine.net/jobs/promoters/in/thailand/koh-samui"
    ],
    "retrievedAt": "2026-06-06"
  },
  "koh-phangan": {
    "slug": "koh-phangan",
    "name": "Koh Phangan",
    "country": "Thailand",
    "topQueries": [
      "freelance web designer koh phangan",
      "social media manager koh phangan",
      "freelance graphic designer koh phangan",
      "video editor koh phangan",
      "seo specialist koh phangan",
      "copywriter koh phangan"
    ],
    "popularServices": [
      "web design",
      "social media management",
      "graphic design",
      "video editing",
      "seo"
    ],
    "hubs": [
      "Beachub",
      "The Nomad House",
      "The Sanctuary Thailand",
      "Baan Bhuwad"
    ],
    "sources": [
      "https://beafreelanceblogger.com/freelancing-thailand-visa/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-ads-freelancers/th/",
      "https://www.freelancermap.com/freelancer/koh-phangan"
    ],
    "retrievedAt": "2026-06-06"
  },
  "pai": {
    "slug": "pai",
    "name": "Pai",
    "country": "Thailand",
    "topQueries": [],
    "popularServices": [],
    "hubs": [],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.youtube.com/watch?v=ihdefK7ScTI",
      "https://www.upwork.com/hire/google-search-agents/th/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "krabi": {
    "slug": "krabi",
    "name": "Krabi",
    "country": "Thailand",
    "topQueries": [],
    "popularServices": [],
    "hubs": [
      "Dribbble freelance creative directors in Krabi",
      "Upwork Google search experts in Thailand",
      "",
      ""
    ],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-search-agents/th/",
      "https://www.truelancer.com/google-adwords-freelancers-in-bangkok?page=34"
    ],
    "retrievedAt": "2026-06-06"
  },
  "pattaya": {
    "slug": "pattaya",
    "name": "Pattaya",
    "country": "Thailand",
    "topQueries": [
      "freelance web designer pattaya",
      "social media manager pattaya",
      "seo specialist pattaya",
      "video editor pattaya",
      "content creator pattaya",
      "graphic designer pattaya"
    ],
    "popularServices": [
      "web design",
      "social media management",
      "video editing",
      "content creation",
      "google slides / presentation design"
    ],
    "hubs": [
      "N/A",
      "N/A",
      "N/A",
      "N/A"
    ],
    "sources": [
      "https://www.twine.net/find/content-creators/th/pattaya-city",
      "https://www.youtube.com/watch?v=vsaTBlyR-3o",
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.truelancer.com/google-slides-freelancers-in-pattaya"
    ],
    "retrievedAt": "2026-06-06"
  },
  "ubud": {
    "slug": "ubud",
    "name": "Ubud",
    "country": "Indonesia",
    "topQueries": [],
    "popularServices": [],
    "hubs": [
      "Outpost Ubud",
      "Kura Kura Coworking",
      "Hubud",
      "Dojo Bali"
    ],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.upwork.com/hire/google-search-console-freelancers/id/",
      "https://www.freelancer.com/job-search/freelance-google-indonesia/",
      "https://www.truelancer.com/search-engine-marketing-sem-freelancers-in-indonesia"
    ],
    "retrievedAt": "2026-06-06"
  },
  "canggu": {
    "slug": "canggu",
    "name": "Canggu",
    "country": "Indonesia",
    "topQueries": [
      "freelance web designer canggu",
      "social media manager canggu bali",
      "freelance graphic designer canggu",
      "hire seo specialist canggu bali",
      "video editor canggu bali",
      "freelance copywriter canggu"
    ],
    "popularServices": [
      "web development",
      "digital marketing",
      "content creation",
      "ux/ui design",
      "consulting"
    ],
    "hubs": [
      "Dojo Bali",
      "Tropical Nomad",
      "B Work Bali",
      "Outpost Canggu"
    ],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.balivillahub.com/blog/most-in-demand-jobs-in-bali-for-expats-and-locals",
      "https://www.youtube.com/watch?v=EY8N_G0K7po",
      "https://www.upwork.com/hire/google-search-console-freelancers/id/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "seminyak": {
    "slug": "seminyak",
    "name": "Seminyak",
    "country": "Indonesia",
    "topQueries": [
      "hire freelance web designer seminyak",
      "freelance social media manager seminyak",
      "hire seo specialist bali seminyak",
      "freelance copywriter seminyak bali",
      "freelance photographer seminyak bali",
      "hire video editor seminyak bali"
    ],
    "popularServices": [
      "web design",
      "social media management",
      "seo",
      "copywriting",
      "photography / video production"
    ],
    "hubs": [
      "Dojo Bali",
      "Outpost Seminyak",
      "Tropical Nomad Coworking",
      "Biliq Seminyak"
    ],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-search-console-freelancers/id/",
      "https://www.toptal.com/marketing/google-search-console"
    ],
    "retrievedAt": "2026-06-06"
  },
  "sanur": {
    "slug": "sanur",
    "name": "Sanur",
    "country": "Indonesia",
    "topQueries": [],
    "popularServices": [],
    "hubs": [],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-search-console-freelancers/id/",
      "https://www.toptal.com/marketing/google-search-console"
    ],
    "retrievedAt": "2026-06-06"
  },
  "yogyakarta": {
    "slug": "yogyakarta",
    "name": "Yogyakarta",
    "country": "Indonesia",
    "topQueries": [
      "freelance web developer yogyakarta",
      "hire social media manager yogyakarta",
      "freelance graphic designer yogyakarta",
      "hire seo specialist yogyakarta",
      "video editor yogyakarta freelance",
      "copywriter yogyakarta freelance"
    ],
    "popularServices": [
      "web development",
      "seo",
      "social media management",
      "graphic design / branding",
      "video editing / content creation"
    ],
    "hubs": [
      "hotel horison yogyakarta coworking",
      "lutus coffee & coworking",
      "hyspace yogyakarta",
      "the legacy yogyakarta coliving"
    ],
    "sources": [
      "https://contra.com/hire/web-developers-in-indonesia",
      "https://arc.dev/en-id/hire-marketers/seo-specialists",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-search-console-freelancers/id/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "da-nang": {
    "slug": "da-nang",
    "name": "Da Nang",
    "country": "Vietnam",
    "topQueries": [
      "freelance web designer da nang",
      "hire graphic designer da nang",
      "content creator da nang",
      "seo specialist da nang",
      "freelance developer da nang",
      "social media manager da nang"
    ],
    "popularServices": [
      "content creation",
      "web design",
      "graphic design",
      "seo",
      "virtual assistant / personal assistant"
    ],
    "hubs": [
      "Enouvo Space",
      "Mynoname Office & Coworking",
      "DNC Space",
      "The Village Coworking Da Nang"
    ],
    "sources": [
      "https://www.youtube.com/watch?v=drSoIa-aBgk",
      "https://www.upwork.com/hire/content-creators/vn/da-nang/",
      "https://www.truelancer.com/personal-assistant-freelancers-in-da-nang",
      "https://www.businessinsider.com/da-nang-vietnam-asia-new-digital-nomad-hub-fastest-growing-2026-2"
    ],
    "retrievedAt": "2026-06-06"
  },
  "hoi-an": {
    "slug": "hoi-an",
    "name": "Hoi An",
    "country": "Vietnam",
    "topQueries": [],
    "popularServices": [],
    "hubs": [],
    "sources": [
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-ads-freelancers/vn/",
      "https://www.truelancer.com/market-research-freelancers-in-vietnam",
      "https://www.guru.com/m/hire/freelancers-in/vietnam/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "nha-trang": {
    "slug": "nha-trang",
    "name": "Nha Trang",
    "country": "Vietnam",
    "topQueries": [
      "hire web designer nha trang",
      "hire seo freelancer nha trang",
      "hire social media manager nha trang",
      "hire video editor nha trang",
      "freelance photographer nha trang",
      "graphic designer nha trang"
    ],
    "popularServices": [
      "web design",
      "seo",
      "social media marketing",
      "video editing",
      "graphic design"
    ],
    "hubs": [
      "Coworking Nha Trang",
      "Nha Trang Coworking",
      "iHub Nha Trang",
      "True Home Nha Trang"
    ],
    "sources": [
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.behance.net/hire/web-designers/vietnam/nha-trang",
      "https://www.fi.freelancer.com/job-search/freelance-nha-trang/",
      "https://www.upwork.com/hire/google-sheets-freelancers/vn/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "siargao": {
    "slug": "siargao",
    "name": "Siargao",
    "country": "Philippines",
    "topQueries": [],
    "popularServices": [],
    "hubs": [],
    "sources": [
      "https://www.youtube.com/watch?v=OG7kQt-DL0E",
      "https://ph.indeed.com/q-siargao-hiring-jobs.html",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.upwork.com/hire/google-my-business-freelancers/ph/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "palawan": {
    "slug": "palawan",
    "name": "Palawan",
    "country": "Philippines",
    "topQueries": [
      "hire freelancer palawan",
      "freelance web designer palawan",
      "social media manager palawan",
      "video editor palawan",
      "virtual assistant palawan",
      "graphic designer palawan"
    ],
    "popularServices": [
      "virtual assistance",
      "social media management",
      "graphic design",
      "web design",
      "video editing"
    ],
    "hubs": [
      "No verified palawan coworking or coliving hubs found in the provided results.",
      "",
      "",
      ""
    ],
    "sources": [
      "https://www.youtube.com/watch?v=OG7kQt-DL0E",
      "https://www.truelancer.com/google-search-freelancers-in-philippines",
      "https://www.upwork.com/hire/google-assistant-freelancers/ph/",
      "https://www.freelancer.com/freelancers/philippines"
    ],
    "retrievedAt": "2026-06-06"
  },
  "langkawi": {
    "slug": "langkawi",
    "name": "Langkawi",
    "country": "Malaysia",
    "topQueries": [],
    "popularServices": [],
    "hubs": [],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.truelancer.com/google-search-freelancers",
      "https://www.freelancer.com/job-search/langkawi-freelance/",
      "https://www.upwork.com/hire/my/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "galle": {
    "slug": "galle",
    "name": "Galle",
    "country": "Sri Lanka",
    "topQueries": [
      "freelance web designer galle",
      "social media manager galle",
      "seo freelancer galle",
      "video editor galle sri lanka",
      "graphic designer galle",
      "copywriter galle"
    ],
    "popularServices": [
      "web design",
      "social media marketing",
      "seo",
      "video editing",
      "graphic design"
    ],
    "hubs": [
      "galle fort",
      "le garage galle",
      "the canterbury inn",
      "galle coliving"
    ],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.toptal.com/marketing/google-search-console",
      "https://www.freelancer.com/hire/google-search"
    ],
    "retrievedAt": "2026-06-06"
  },
  "ella": {
    "slug": "ella",
    "name": "Ella",
    "country": "Sri Lanka",
    "topQueries": [],
    "popularServices": [
      "web design",
      "social media management",
      "video editing",
      "copywriting",
      "seo"
    ],
    "hubs": [],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.truelancer.com/google-search-freelancers-in-sri-lanka",
      "https://www.upwork.com/hire/google-search-agents/lk/"
    ],
    "retrievedAt": "2026-06-06"
  },
  "siem-reap": {
    "slug": "siem-reap",
    "name": "Siem Reap",
    "country": "Cambodia",
    "topQueries": [],
    "popularServices": [
      "web design",
      "social media management",
      "seo",
      "pay-per-click advertising",
      "khmer translation"
    ],
    "hubs": [
      "Factory Phnom Penh",
      "Impact Hub Phnom Penh",
      "Bamboo Angkor Boutique",
      "The Aviary Hotel"
    ],
    "sources": [
      "https://www.upwork.com/hire/khmer-freelancers/kh/siem-reap/",
      "https://www.travelbeginsat40.com/2022/08/hiring-a-freelancer-in-cambodia/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.twine.net/jobs/in/cambodia/siem-reap"
    ],
    "retrievedAt": "2026-06-06"
  },
  "goa": {
    "slug": "goa",
    "name": "Goa",
    "country": "India",
    "topQueries": [
      "freelance web designer goa",
      "social media manager goa",
      "seo consultant goa",
      "video editor goa",
      "copywriter goa",
      "freelance photographer goa"
    ],
    "popularServices": [
      "web design",
      "social media marketing",
      "seo",
      "video editing",
      "copywriting"
    ],
    "hubs": [
      "NomadGao",
      "The Postcard Cuelim",
      "WTF Goa",
      "The Hosteller Goa"
    ],
    "sources": [
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.youtube.com/watch?v=xF1vVv0Z53A",
      "https://www.truelancer.com/google-search-freelancers"
    ],
    "retrievedAt": "2026-06-06"
  },
  "sapporo": {
    "slug": "sapporo",
    "name": "Sapporo",
    "country": "Japan",
    "topQueries": [
      "freelance web designer sapporo",
      "sapporo social media manager",
      "hire seo freelancer sapporo",
      "sapporo copywriter for hire",
      "video editor sapporo freelance",
      "hire photographer sapporo"
    ],
    "popularServices": [
      "web design",
      "social media management",
      "seo",
      "copywriting",
      "video editing"
    ],
    "hubs": [],
    "sources": [
      "https://careerboom.ai/en/us/blog/tool-review/best-japan-job-platforms",
      "https://www.youtube.com/watch?v=jAE-wUQXkC4",
      "https://www.behance.net/hire/web-designers/japan/sapporo",
      "https://www.upwork.com/freelancers/norikos"
    ],
    "retrievedAt": "2026-06-06"
  },
  "okinawa": {
    "slug": "okinawa",
    "name": "Okinawa",
    "country": "Japan",
    "topQueries": [],
    "popularServices": [],
    "hubs": [
      "Truelancer",
      "Twine",
      "Guidable Jobs",
      ""
    ],
    "sources": [
      "https://www.youtube.com/watch?v=vqIRmyG-nvM",
      "https://www.truelancer.com/freelancers-in-okinawa",
      "https://www.youtube.com/watch?v=IzK_daUxKJY",
      "https://jobs.guidable.co/en"
    ],
    "retrievedAt": "2026-06-06"
  },
  "jeju": {
    "slug": "jeju",
    "name": "Jeju",
    "country": "South Korea",
    "topQueries": [
      "freelance web designer jeju",
      "hire social media manager jeju",
      "jeju video editor freelancer",
      "jeju seo freelancer",
      "hire graphic designer jeju",
      "copywriter jeju freelance"
    ],
    "popularServices": [
      "web design",
      "social media management",
      "video editing",
      "graphic design",
      "seo"
    ],
    "hubs": [
      "empty",
      "empty",
      "empty",
      "empty"
    ],
    "sources": [
      "https://www.youtube.com/watch?v=ULHVwtnMOJY",
      "https://www.behance.net/hire/illustrators/republic-of-korea?locale=en_US",
      "https://www.upwork.com/hire/research-and-strategy-freelancers/kr/",
      "https://www.truelancer.com/freelancers-in-jeju"
    ],
    "retrievedAt": "2026-06-06"
  },
  "kathmandu": {
    "slug": "kathmandu",
    "name": "Kathmandu",
    "country": "Nepal",
    "topQueries": [
      "hire freelance web designer kathmandu",
      "hire seo expert kathmandu",
      "freelance ui ux designer kathmandu",
      "hire social media manager kathmandu",
      "hire copywriter kathmandu",
      "hire video editor kathmandu"
    ],
    "popularServices": [
      "web design",
      "seo",
      "ui/ux design",
      "social media management",
      "copywriting"
    ],
    "hubs": [
      "Impact Hub Kathmandu",
      "Work Around Kathmandu",
      "Dalai-La Boutique Hotel and Ccoliving",
      "The Spark Hub"
    ],
    "sources": [
      "https://www.guru.com/m/hire/freelancers-in/nepal/",
      "https://mattolpinski.com/articles/google-trends-for-freelancers/",
      "https://www.truelancer.com/google-search-freelancers-in-nepal",
      "https://www.upwork.com/hire/google-search-console-freelancers/np/"
    ],
    "retrievedAt": "2026-06-06"
  }
};

export function getDnCityQueries(slug: string): CityQueryData | null {
  return DN_CITY_QUERIES[slug] || null;
}

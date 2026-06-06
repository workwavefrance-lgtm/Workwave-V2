/**
 * Récupère les VRAIES requêtes Google qui marchent par ville digital nomad
 * + les services freelance les plus demandés + les concurrents/sources,
 * via Perplexity (sourcé, zéro chiffre/intent inventé).
 *
 * Sortie : lib/data/digital-nomad-city-queries.ts (Record<slug, CityQueryData>).
 * Coût : ~25 villes × $0.005 = ~$0.125.
 *
 * Usage :
 *   npx tsx scripts/fetch-digital-nomad-queries.ts --dry-run    # 3 villes (Ubud, Phuket, Da Nang)
 *   npx tsx scripts/fetch-digital-nomad-queries.ts              # toutes les 25 villes DN ajoutées
 */
import { config } from "dotenv";
import path from "path";
import fs from "fs";
config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const KEY = process.env.PERPLEXITY_API_KEY;
if (!KEY) { console.error("❌ PERPLEXITY_API_KEY manquante"); process.exit(1); }
const DRY = process.argv.includes("--dry-run");

// 25 villes digital nomad ajoutées au commit c243485
const DN_CITIES = [
  { slug: "phuket", name: "Phuket", country: "Thailand" },
  { slug: "koh-samui", name: "Koh Samui", country: "Thailand" },
  { slug: "koh-phangan", name: "Koh Phangan", country: "Thailand" },
  { slug: "pai", name: "Pai", country: "Thailand" },
  { slug: "krabi", name: "Krabi", country: "Thailand" },
  { slug: "pattaya", name: "Pattaya", country: "Thailand" },
  { slug: "ubud", name: "Ubud", country: "Indonesia" },
  { slug: "canggu", name: "Canggu", country: "Indonesia" },
  { slug: "seminyak", name: "Seminyak", country: "Indonesia" },
  { slug: "sanur", name: "Sanur", country: "Indonesia" },
  { slug: "yogyakarta", name: "Yogyakarta", country: "Indonesia" },
  { slug: "da-nang", name: "Da Nang", country: "Vietnam" },
  { slug: "hoi-an", name: "Hoi An", country: "Vietnam" },
  { slug: "nha-trang", name: "Nha Trang", country: "Vietnam" },
  { slug: "siargao", name: "Siargao", country: "Philippines" },
  { slug: "palawan", name: "Palawan", country: "Philippines" },
  { slug: "langkawi", name: "Langkawi", country: "Malaysia" },
  { slug: "galle", name: "Galle", country: "Sri Lanka" },
  { slug: "ella", name: "Ella", country: "Sri Lanka" },
  { slug: "siem-reap", name: "Siem Reap", country: "Cambodia" },
  { slug: "goa", name: "Goa", country: "India" },
  { slug: "sapporo", name: "Sapporo", country: "Japan" },
  { slug: "okinawa", name: "Okinawa", country: "Japan" },
  { slug: "jeju", name: "Jeju", country: "South Korea" },
  { slug: "kathmandu", name: "Kathmandu", country: "Nepal" },
];

type CityQueryData = {
  slug: string;
  name: string;
  country: string;
  topQueries: string[];      // requêtes Google les + tapées (côté CLIENT cherchant un freelance)
  popularServices: string[]; // services freelance les + demandés sur place
  hubs: string[];            // coworkings/coliving phares cités
  sources: string[];         // URLs Perplexity (preuve)
  retrievedAt: string;
};

function buildPrompt(city: { name: string; country: string }): string {
  return (
    `For ${city.name}, ${city.country} (a known digital nomad destination), what are ` +
    `the actual most-searched Google queries by people HIRING freelancers there, ` +
    `the most in-demand freelance/digital services on the ground, and the main ` +
    `coworking spaces or coliving hubs?\n\n` +
    `Answer ONLY in strict JSON: ` +
    `{"topQueries": ["...","...","...","...","...","..."], ` +
    `"popularServices": ["...","...","...","...","..."], ` +
    `"hubs": ["...","...","...","..."]}.\n` +
    `- topQueries: 6 short, realistic English search queries someone would type on ` +
    `Google when LOOKING TO HIRE a freelancer in ${city.name} (e.g. "freelance web ` +
    `designer ubud", "social media manager bali canggu"). Lowercase. No fluff.\n` +
    `- popularServices: 5 generic service categories ranking high there (web design, ` +
    `social media, video editing, copywriting, SEO, branding, photography, etc.).\n` +
    `- hubs: 4 actual notable coworking spaces or coliving brands in ${city.name} (cite real names).\n` +
    `DO NOT invent. If unknown, use empty arrays. Answer ONLY the JSON.`
  );
}

async function fetchOne(city: { slug: string; name: string; country: string }): Promise<CityQueryData> {
  const base: CityQueryData = {
    slug: city.slug, name: city.name, country: city.country,
    topQueries: [], popularServices: [], hubs: [], sources: [],
    retrievedAt: new Date().toISOString().slice(0, 10),
  };
  const res = await fetch("https://api.perplexity.ai/chat/completions", {
    method: "POST",
    headers: { Authorization: `Bearer ${KEY}`, "Content-Type": "application/json" },
    body: JSON.stringify({ model: "sonar", temperature: 0.2, messages: [{ role: "user", content: buildPrompt(city) }] }),
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const data: any = await res.json();
  if (!res.ok || !data?.choices) return base;
  const content: string = data.choices[0]?.message?.content || "";
  base.sources = (Array.isArray(data.citations) ? data.citations : null) ||
    (Array.isArray(data.search_results) ? data.search_results.map((s: { url?: string }) => s.url).filter(Boolean) : []) || [];
  base.sources = base.sources.slice(0, 4);

  const m = content.match(/\{[\s\S]*\}/);
  if (m) {
    try {
      const j = JSON.parse(m[0].replace(/\[\d+\]/g, ""));
      base.topQueries = Array.isArray(j.topQueries) ? j.topQueries.slice(0, 6).map((s: string) => String(s).trim().toLowerCase()) : [];
      base.popularServices = Array.isArray(j.popularServices) ? j.popularServices.slice(0, 5).map((s: string) => String(s).trim()) : [];
      base.hubs = Array.isArray(j.hubs) ? j.hubs.slice(0, 4).map((s: string) => String(s).trim()) : [];
    } catch { /* ignore */ }
  }
  return base;
}

async function main() {
  // --only=slug1,slug2,... : refetch ciblé (sans toucher au fichier existant fusionné)
  const onlyArg = process.argv.find((a) => a.startsWith("--only="));
  const onlySlugs = onlyArg ? new Set(onlyArg.replace("--only=", "").split(",").filter(Boolean)) : null;
  const list = DRY
    ? DN_CITIES.filter((c) => ["ubud", "phuket", "da-nang"].includes(c.slug))
    : onlySlugs
      ? DN_CITIES.filter((c) => onlySlugs.has(c.slug))
      : DN_CITIES;
  console.log(`Perplexity fetch — ${list.length} villes DN${DRY ? " [DRY: 3 villes]" : ""}\n`);
  const out: Record<string, CityQueryData> = {};
  for (const c of list) {
    const e = await fetchOne(c);
    out[e.slug] = e;
    console.log(`  ${e.slug.padEnd(14)} queries:${e.topQueries.length} services:${e.popularServices.length} hubs:${e.hubs.length} src:${e.sources.length}`);
    if (DRY) {
      console.log(`     topQueries     : ${e.topQueries.slice(0, 3).join(" | ")}`);
      console.log(`     popularServices: ${e.popularServices.slice(0, 3).join(" | ")}`);
      console.log(`     hubs           : ${e.hubs.slice(0, 3).join(" | ")}`);
      console.log(`     sources[0]     : ${(e.sources[0] || "").slice(0, 80)}`);
    }
    await new Promise((r) => setTimeout(r, 1100));
  }
  if (DRY) {
    console.log("\n[DRY] OK — re-lance sans --dry-run pour les 25 villes (~$0.15).");
    return;
  }

  // Fusion avec l'existant (en mode --only on garde les villes déjà OK)
  const outFile = path.resolve(process.cwd(), "lib/data/digital-nomad-city-queries.ts");
  let merged: Record<string, CityQueryData> = out;
  if (onlySlugs && fs.existsSync(outFile)) {
    const existing = fs.readFileSync(outFile, "utf-8");
    const m = existing.match(/DN_CITY_QUERIES[\s\S]*?=\s*(\{[\s\S]*?\})\s*;\s*\n\s*export function/);
    if (m) {
      try {
        const prev = JSON.parse(m[1]) as Record<string, CityQueryData>;
        // Garde les anciennes, écrase celles refetchées + retient l'ancienne si nouvelle est plus pauvre
        merged = { ...prev };
        for (const [slug, fresh] of Object.entries(out)) {
          const prevCity = prev[slug];
          const freshScore = fresh.topQueries.length + fresh.popularServices.length + fresh.hubs.length;
          const prevScore = prevCity ? prevCity.topQueries.length + prevCity.popularServices.length + prevCity.hubs.length : -1;
          merged[slug] = freshScore >= prevScore ? fresh : prevCity;
        }
      } catch { /* ignore */ }
    }
  }

  const header = `// Top requêtes Google + services demandés + hubs par ville digital nomad (sourcé Perplexity le ${new Date().toISOString().slice(0,10)}).\n// Utilisé pour enrichir SEO les pages /en/ai/[skill]/[city] des villes DN.\n// NE PAS éditer à la main : relancer scripts/fetch-digital-nomad-queries.ts.\n\nexport type CityQueryData = { slug: string; name: string; country: string; topQueries: string[]; popularServices: string[]; hubs: string[]; sources: string[]; retrievedAt: string };\n\nexport const DN_CITY_QUERIES: Record<string, CityQueryData> = ${JSON.stringify(merged, null, 2)};\n\nexport function getDnCityQueries(slug: string): CityQueryData | null {\n  return DN_CITY_QUERIES[slug] || null;\n}\n`;
  fs.writeFileSync(outFile, header);
  const sourced = Object.values(merged).filter((e) => e.topQueries.length > 0 && e.popularServices.length > 0 && e.hubs.length > 0).length;
  console.log(`\nVilles 100% complètes (queries + services + hubs) : ${sourced}/${Object.keys(merged).length}`);
  console.log("✓ écrit → lib/data/digital-nomad-city-queries.ts");
}

main().catch((e) => { console.error("ERREUR:", e.message); process.exit(1); });

/**
 * Ping Google Indexing API sur les NOUVELLES pages internationales (vague
 * mondiale : Asie / Latam / Océanie / Afrique + hubs pays/continent).
 *
 * Le quota Indexing API = 200 URLs/jour. On priorise (le sitemap-ai-en.xml
 * couvre le reste via le crawl naturel) :
 *   1. Hubs continent (6)
 *   2. Hubs pays (~50)
 *   3. web-development × pays (~50)
 *   4. ai-engineering × pays (~50)
 *   5. web-development × villes phares (~30)
 * -> ~186, capé à 200. Ce qui dépasse est LOGGÉ (pas de cap silencieux).
 *
 * Pre-requis ADC : `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform`
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-intl.ts --dry-run
 *   npx tsx scripts/ping-google-indexing-intl.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { google } from "googleapis";
import { INTL_CITIES } from "@/lib/data/intl-cities";
import { WORLD_COUNTRIES, CONTINENTS } from "@/lib/data/intl-countries";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const RATE_LIMIT_MS = 110;
const BASE = "https://workwave.fr";
const DRY_RUN = process.argv.includes("--dry-run");
const QUOTA = 200;
const NEW_REGIONS = ["Asia", "Latam", "Oceania", "Africa"];

function buildUrls(): { urls: string[]; dropped: number } {
  const newCities = INTL_CITIES.filter((c) => NEW_REGIONS.includes(c.region));
  // Villes phares = monument dédié d'abord.
  const marquee = [
    ...newCities.filter((c) => c.monument !== "skyline" && c.monument !== "skyline-global"),
    ...newCities.filter((c) => c.monument === "skyline" || c.monument === "skyline-global"),
  ].slice(0, 30);

  const all: string[] = [
    ...CONTINENTS.map((c) => `${BASE}/en/ai/continent/${c.slug}`),
    ...WORLD_COUNTRIES.map((c) => `${BASE}/en/ai/country/${c.slug}`),
    ...WORLD_COUNTRIES.map((c) => `${BASE}/en/ai/web-development/country/${c.slug}`),
    ...WORLD_COUNTRIES.map((c) => `${BASE}/en/ai/ai-engineering/country/${c.slug}`),
    ...marquee.map((c) => `${BASE}/en/ai/web-development/${c.slug}`),
  ];
  const deduped = [...new Set(all)];
  const urls = deduped.slice(0, QUOTA);
  return { urls, dropped: deduped.length - urls.length };
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
async function pingUrl(client: any, url: string): Promise<{ ok: boolean; error?: string }> {
  try {
    const res = await client.request({
      url: "https://indexing.googleapis.com/v3/urlNotifications:publish",
      method: "POST",
      data: { url, type: "URL_UPDATED" },
    });
    return { ok: res.status === 200 };
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
  } catch (e: any) {
    const msg = e?.errors?.[0]?.message || e?.message || String(e);
    return { ok: false, error: msg };
  }
}

async function main() {
  const { urls, dropped } = buildUrls();

  if (DRY_RUN) {
    console.log("=== DRY RUN — URLs internationales qui seraient pingées ===\n");
    urls.forEach((url, i) => console.log(`  ${(i + 1).toString().padStart(3)}. ${url.replace(BASE, "")}`));
    console.log(`\nTotal pingées : ${urls.length} / quota ${QUOTA}`);
    if (dropped > 0) console.log(`⚠️  ${dropped} URLs au-delà du quota — relancer demain ou compter sur le sitemap.`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  console.log(`Ping de ${urls.length} URLs intl (delay ${RATE_LIMIT_MS}ms)...\n`);
  if (dropped > 0) console.log(`⚠️  ${dropped} URLs prioritaires au-delà du quota du jour (sitemap couvre le reste).\n`);

  let okCount = 0;
  let failCount = 0;
  const failureReasons = new Map<string, number>();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await pingUrl(client, url);
    if (result.ok) {
      okCount++;
      console.log(`\x1b[32m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✓ ${url.replace(BASE, "")}\x1b[0m`);
    } else {
      failCount++;
      const reason = (result.error || "unknown").slice(0, 80);
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      console.error(`\x1b[31m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✗ ${url.replace(BASE, "")} -> ${reason}\x1b[0m`);
      if (reason.includes("Quota exceeded") || reason.includes("429") || reason.includes("403")) {
        console.error("\n\x1b[31m⚠️  Erreur fatale (quota ou auth), arrêt.\x1b[0m");
        break;
      }
    }
    if (i < urls.length - 1) await new Promise((r) => setTimeout(r, RATE_LIMIT_MS));
  }

  console.log("\n=== Resume ===");
  console.log(`  Total tentés : ${okCount + failCount}`);
  console.log(`  ✓ OK         : \x1b[32m${okCount}\x1b[0m`);
  console.log(`  ✗ Echecs     : \x1b[31m${failCount}\x1b[0m`);
  if (failCount > 0) {
    console.log("\n=== Détail échecs ===");
    Array.from(failureReasons.entries()).sort((a, b) => b[1] - a[1]).forEach(([msg, n]) => console.log(`  [${n}] ${msg}`));
  }
}

main().catch((e) => {
  console.error("Erreur fatale:", e);
  process.exit(1);
});

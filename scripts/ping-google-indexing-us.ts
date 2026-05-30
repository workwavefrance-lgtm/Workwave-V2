/**
 * Ping Google Indexing API sur les pages US (Workwave AI) — gTLD workwaveai.co.
 *
 * Priorité (cap 200/jour) :
 *   1. Home /en/ai (1)
 *   2. Hubs skill /en/ai/{skill} (14)
 *   3. Hubs d'état /en/ai/{skill}/state/{state} pour les 3 skills phares (3 x 51 = 153)
 *      → chaque hub d'état maille vers ses villes (cascade de crawl).
 *   4. Pages villes US phares /en/ai/web-development/{city} (complète jusqu'à 200)
 *
 * BTP reste 100% FR. URLs sur www.workwaveai.co (après migration du contenu EN).
 *
 * Pré-requis : ADC avec scope indexing (cf. lecon CLAUDE.md 29/04) :
 *   gcloud auth application-default login --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-us.ts --dry-run
 *   npx tsx scripts/ping-google-indexing-us.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { google } from "googleapis";
import { INTL_SKILLS } from "@/lib/data/intl-skills";
import { INTL_CITIES } from "@/lib/data/intl-cities";
import { US_STATES } from "@/lib/data/us-states";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const RATE_LIMIT_MS = 110;
const BASE = "https://www.workwaveai.co";
const DRY_RUN = process.argv.includes("--dry-run");
const TOP_SKILLS = ["web-development", "ai-engineering", "cloud-devops"];

function buildUrls(): string[] {
  const urls: string[] = [`${BASE}/en/ai`];
  for (const skill of INTL_SKILLS) urls.push(`${BASE}/en/ai/${skill.slug}`);
  // Hubs d'état pour les 3 skills phares (cascade vers les villes)
  for (const sk of TOP_SKILLS) {
    for (const st of US_STATES) urls.push(`${BASE}/en/ai/${sk}/state/${st.slug}`);
  }
  // Villes US phares (web-development) pour compléter
  const usCities = INTL_CITIES.filter((c) => c.region === "USA");
  for (const c of usCities) urls.push(`${BASE}/en/ai/web-development/${c.slug}`);
  return urls.slice(0, 200); // safety cap quota
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
  const urls = buildUrls();

  if (DRY_RUN) {
    console.log("=== DRY RUN — URLs US qui seraient pingées ===\n");
    urls.forEach((url, i) => console.log(`  ${(i + 1).toString().padStart(3)}. ${url.replace(BASE, "")}`));
    console.log(`\nTotal: ${urls.length}\n`);
    return;
  }

  console.log("Authentification ADC...");
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const client = (await auth.getClient()) as any;
  console.log("✅ Authentifié.\n");

  console.log(`Ping de ${urls.length} URLs US (delay ${RATE_LIMIT_MS}ms)...\n`);

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

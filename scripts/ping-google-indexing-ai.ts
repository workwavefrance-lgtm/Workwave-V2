/**
 * Ping Google Indexing API cible sur les pages /ai/* (Workwave AI).
 *
 * Strategie de priorisation (top 100 URLs) :
 *   1. Home /ai (1)
 *   2. Pages hub principales (4) : /freelances, /tarifs, /pour-les-freelances,
 *      /barometre-tjm
 *   3. 6 categories racines /ai/{cat} (6)
 *   4. 35 stacks barometre TJM /ai/barometre-tjm/{skill} (35)
 *   5. Top 6 cat x top 8 villes (48) : Paris, Lyon, Marseille, Toulouse,
 *      Bordeaux, Nantes, Strasbourg, Lille
 *   6. Top 6 cat x dept Paris (75) (6)
 *
 * Total : 100 URLs / 200 quota jour. Laisse ~100 pour l'autre script
 * ping-google-indexing-listings.ts (pages BTP).
 *
 * Pre-requis : `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform`
 * (cf. lecon CLAUDE.md 29/04/2026 sur les scopes)
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-ai.ts --dry-run
 *   npx tsx scripts/ping-google-indexing-ai.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { google } from "googleapis";
import { TJM_REFERENCE } from "@/lib/data/tech-tjm-reference";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const RATE_LIMIT_MS = 110;
const BASE = "https://workwave.fr";
const DRY_RUN = process.argv.includes("--dry-run");

const AI_CATEGORIES = [
  "intelligence-artificielle",
  "developpement-web",
  "cloud-devops",
  "no-code-automation",
  "data-analytics",
  "design-produit",
];

const TOP_CITIES = [
  "paris",
  "lyon",
  "marseille",
  "toulouse",
  "bordeaux",
  "nantes",
  "strasbourg",
  "lille",
];

function buildPriorityUrls(): string[] {
  const urls: string[] = [];

  // 1. Home /ai (1)
  urls.push(`${BASE}/ai`);

  // 2. Hub pages (4)
  urls.push(`${BASE}/ai/freelances`);
  urls.push(`${BASE}/ai/tarifs`);
  urls.push(`${BASE}/ai/pour-les-freelances`);
  urls.push(`${BASE}/ai/barometre-tjm`);

  // 3. 6 categories racines (6)
  AI_CATEGORIES.forEach((cat) => {
    urls.push(`${BASE}/ai/${cat}`);
  });

  // 4. 35 stacks barometre TJM
  Object.keys(TJM_REFERENCE).forEach((skill) => {
    urls.push(`${BASE}/ai/barometre-tjm/${skill}`);
  });

  // 5. Top 6 cat x top 8 villes (48)
  AI_CATEGORIES.forEach((cat) => {
    TOP_CITIES.forEach((city) => {
      urls.push(`${BASE}/ai/${cat}/${city}`);
    });
  });

  // 6. Top 6 cat x dept Paris (75) — 6
  AI_CATEGORIES.forEach((cat) => {
    urls.push(`${BASE}/ai/${cat}/dept/75`);
  });

  return urls.slice(0, 100); // safety cap a 100
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
  const urls = buildPriorityUrls();

  if (DRY_RUN) {
    console.log("=== DRY RUN — URLs qui seraient pingées ===\n");
    urls.forEach((url, i) => {
      const p = url.replace(BASE, "");
      console.log(`  ${(i + 1).toString().padStart(3)}. ${p}`);
    });
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

  console.log(`Ping de ${urls.length} URLs /ai/* (delay ${RATE_LIMIT_MS}ms)...\n`);

  let okCount = 0;
  let failCount = 0;
  const failureReasons = new Map<string, number>();

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await pingUrl(client, url);

    if (result.ok) {
      okCount++;
      const p = url.replace(BASE, "");
      console.log(`\x1b[32m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✓ ${p}\x1b[0m`);
    } else {
      failCount++;
      const reason = (result.error || "unknown").slice(0, 80);
      failureReasons.set(reason, (failureReasons.get(reason) || 0) + 1);
      console.error(
        `\x1b[31m  [${(i + 1).toString().padStart(3)}/${urls.length}] ✗ ${url.replace(BASE, "")} -> ${reason}\x1b[0m`
      );
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
    Array.from(failureReasons.entries())
      .sort((a, b) => b[1] - a[1])
      .forEach(([msg, n]) => console.log(`  [${n}] ${msg}`));
  }

  if (okCount > 0) {
    console.log(
      `\n\x1b[32m✓ Google va re-crawler ces ${okCount} URLs /ai/* dans les prochaines heures.\nLes pages avec nouveaux schemas + FAQs apparaitront en SERP enrichies.\x1b[0m`
    );
  }
}

main().catch((e) => {
  console.error("Erreur fatale:", e);
  process.exit(1);
});

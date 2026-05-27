/**
 * Ping Google Indexing API cible sur les 8 nouvelles categories Phase 11
 * (business + creatif). Lance le 27/05/2026 apres l'extension multi-vertical.
 *
 * Strategie de priorisation (max 200 URLs / quota jour) :
 *   1. 8 categories racines /ai/{cat} (8)
 *   2. 8 cat x top 25 villes France (200) -> on plafonne a 192 pour rester sous 200
 *
 * Categories ciblees :
 *   - marketing-communication (18k pros)
 *   - design-creation (64k pros)
 *   - strategie-management (121k pros)
 *   - finance-comptabilite (14k pros)
 *   - rh-recrutement (313 pros)
 *   - juridique-conseil (65k pros)
 *   - redaction-copywriting (20k pros)
 *   - audiovisuel-medias (56k pros)
 *
 * Pre-requis : `gcloud auth application-default login --scopes=https://www.googleapis.com/auth/indexing,https://www.googleapis.com/auth/cloud-platform`
 *
 * Usage :
 *   npx tsx scripts/ping-google-indexing-multivertical.ts --dry-run
 *   npx tsx scripts/ping-google-indexing-multivertical.ts
 */
import { config } from "dotenv";
import * as path from "path";
import { google } from "googleapis";

config({ path: path.resolve(process.cwd(), ".env.local"), override: true });

const RATE_LIMIT_MS = 110;
const BASE = "https://workwave.fr";
const DRY_RUN = process.argv.includes("--dry-run");

// Les 8 nouvelles categories Phase 11 (business + creatif)
const NEW_CATEGORIES = [
  "marketing-communication",
  "design-creation",
  "strategie-management",
  "finance-comptabilite",
  "rh-recrutement",
  "juridique-conseil",
  "redaction-copywriting",
  "audiovisuel-medias",
];

// Top 24 plus grosses villes France (par population)
const TOP_CITIES = [
  "paris",
  "marseille",
  "lyon",
  "toulouse",
  "nice",
  "nantes",
  "montpellier",
  "strasbourg",
  "bordeaux",
  "lille",
  "rennes",
  "reims",
  "le-havre",
  "saint-etienne",
  "toulon",
  "grenoble",
  "dijon",
  "angers",
  "nimes",
  "villeurbanne",
  "saint-denis",
  "le-mans",
  "aix-en-provence",
  "clermont-ferrand",
];

function buildPriorityUrls(): string[] {
  const urls: string[] = [];

  // 1. 8 categories racines (8)
  NEW_CATEGORIES.forEach((cat) => {
    urls.push(`${BASE}/ai/${cat}`);
  });

  // 2. 8 cat x 24 villes = 192 (sous quota 200/jour)
  NEW_CATEGORIES.forEach((cat) => {
    TOP_CITIES.forEach((city) => {
      urls.push(`${BASE}/ai/${cat}/${city}`);
    });
  });

  return urls;
}

function sleep(ms: number): Promise<void> {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

async function pingUrl(
  client: ReturnType<
    typeof google.indexing
  >["v3"]["urlNotifications"],
  url: string
): Promise<{ ok: boolean; error?: string }> {
  try {
    await client.publish({
      requestBody: { url, type: "URL_UPDATED" },
    });
    return { ok: true };
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    return { ok: false, error: msg.slice(0, 200) };
  }
}

async function main() {
  const urls = buildPriorityUrls();
  console.log(`\nMulti-vertical Phase 11 — ping Google Indexing API`);
  console.log(`Total URLs : ${urls.length} (sous quota 200/jour)\n`);

  if (DRY_RUN) {
    console.log("DRY RUN. Premieres URLs :");
    urls.slice(0, 10).forEach((u) => console.log(`  ${u}`));
    console.log(`  ... + ${urls.length - 10} autres URLs`);
    return;
  }

  // Auth via ADC
  const auth = new google.auth.GoogleAuth({
    scopes: ["https://www.googleapis.com/auth/indexing"],
  });
  const authClient = await auth.getClient();
  // @ts-expect-error : googleapis types ne matchent pas precisement
  google.options({ auth: authClient });
  const client = google.indexing("v3").urlNotifications;

  let ok = 0;
  let fail = 0;
  const errors: { url: string; error: string }[] = [];

  for (let i = 0; i < urls.length; i++) {
    const url = urls[i];
    const result = await pingUrl(client, url);
    if (result.ok) {
      ok++;
      process.stdout.write(`.`);
    } else {
      fail++;
      errors.push({ url, error: result.error || "unknown" });
      process.stdout.write(`x`);
    }
    if (i < urls.length - 1) await sleep(RATE_LIMIT_MS);
    if ((i + 1) % 50 === 0) process.stdout.write(` ${i + 1}/${urls.length}\n`);
  }

  console.log(`\n\n=== Resultats ===`);
  console.log(`OK   : ${ok}`);
  console.log(`Fail : ${fail}`);
  if (errors.length > 0) {
    console.log("\nPremiers errors :");
    errors.slice(0, 5).forEach((e) => console.log(`  ${e.url}: ${e.error}`));
  }
}

main().catch((e) => {
  console.error("\nFatal :", e);
  process.exit(1);
});
